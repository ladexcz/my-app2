<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;

class DeliveryService
{
    protected OrderMatchingService $matchingService;

    public function __construct(OrderMatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
    }

    /**
     * Assign delivery to order when producer marks it ready
     * 
     * Strategy:
     * 1. Get all ready orders from same producer
     * 2. Group by delivery region (producer location + nearby orders)
     * 3. Batch multiple orders into one delivery route
     * 4. Assign to nearest available rider with capacity
     */
    public function assignDeliveryForOrder(Order $order): ?Delivery
    {
        if ($order->status !== 'ready') {
            return null;
        }

        // Get all other ready orders from same producer (from last 30 mins)
        $readyOrders = Order::where('producer_id', $order->producer_id)
            ->where('status', 'ready')
            ->where('ready_at', '>=', now()->subMinutes(30))
            ->with(['buyer'])
            ->get();

        // Group orders for batching (same region/nearby buyers)
        $orderBatches = $this->groupOrdersForBatching($readyOrders);

        $delivery = null;

        // For each batch, create or update delivery
        foreach ($orderBatches as $batch) {
            $delivery = $this->createDeliveryBatch(
                $order->producer_id,
                $batch['orders'],
                $batch['region_lat'],
                $batch['region_lon']
            );

            if ($delivery) {
                // Assign rider to this delivery
                $this->assignRider($delivery);
            }
        }

        return $delivery;
    }

    /**
     * Group ready orders by geographic region for efficient batching
     * 
     * Simple clustering: group orders within ~5km of each other
     */
    private function groupOrdersForBatching($orders): array
    {
        if ($orders->isEmpty()) {
            return [];
        }

        $batches = [];
        $processed = [];

        foreach ($orders as $order) {
            if (in_array($order->id, $processed)) {
                continue;
            }

            $batch = [$order];
            $processed[] = $order->id;

            // Find nearby orders to batch with (within ~5km)
            if ($order->buyer->latitude && $order->buyer->longitude) {
                foreach ($orders as $otherOrder) {
                    if (in_array($otherOrder->id, $processed) || !$otherOrder->buyer->latitude) {
                        continue;
                    }

                    $distance = $this->matchingService->calculateDistance(
                        $order->buyer->latitude,
                        $order->buyer->longitude,
                        $otherOrder->buyer->latitude,
                        $otherOrder->buyer->longitude
                    );

                    if ($distance <= 5) { // 5km radius
                        $batch[] = $otherOrder;
                        $processed[] = $otherOrder->id;
                    }
                }
            }

            // Calculate batch region center
            $avgLat = array_sum(array_map(fn($o) => $o->buyer->latitude ?? 0, $batch)) / count($batch);
            $avgLon = array_sum(array_map(fn($o) => $o->buyer->longitude ?? 0, $batch)) / count($batch);

            $batches[] = [
                'orders' => $batch,
                'region_lat' => $avgLat,
                'region_lon' => $avgLon,
            ];
        }

        return $batches;
    }

    /**
     * Create delivery batch for multiple orders
     */
    private function createDeliveryBatch(
        int $producerId,
        array $orders,
        float $regionLat,
        float $regionLon
    ): ?Delivery {
        if (empty($orders)) {
            return null;
        }

        // Check if delivery already exists for all these orders
        $existingDelivery = Delivery::whereHas('orders', function ($q) use ($orders) {
            $q->whereIn('orders.id', array_map(fn($o) => $o->id, $orders));
        })->first();

        if ($existingDelivery) {
            return $existingDelivery;
        }

        // Calculate route distance (producer to first customer to last customer)
        $producer = User::find($producerId);
        $firstOrder = $orders[0];
        $lastOrder = end($orders);

        $distance = 0;
        if ($producer->latitude && $producer->longitude && $firstOrder->buyer->latitude) {
            $distance = $this->matchingService->calculateDistance(
                $producer->latitude,
                $producer->longitude,
                $firstOrder->buyer->latitude,
                $firstOrder->buyer->longitude
            );

            // Add distance from first to last customer
            if (count($orders) > 1 && $lastOrder->buyer->latitude) {
                $distance += $this->matchingService->calculateDistance(
                    $firstOrder->buyer->latitude,
                    $firstOrder->buyer->longitude,
                    $lastOrder->buyer->latitude,
                    $lastOrder->buyer->longitude
                );
            }
        }

        // Create delivery
        $delivery = Delivery::create([
            'rider_id' => null, // Will be assigned next
            'producer_id' => $producerId,
            'status' => 'assigned',
            'route_distance' => $distance,
            'estimated_eta' => now()->addMinutes((int)($distance * 3)), // Assume 20km/h = 3 min per km
        ]);

        // Attach all orders to delivery
        foreach ($orders as $order) {
            $delivery->orders()->attach($order->id);
        }

        return $delivery;
    }

    /**
     * Assign nearest available rider to delivery
     */
    private function assignRider(Delivery $delivery): void
    {
        // Get all available riders (not currently busy)
        $availableRiders = User::where('role', 'rider')
            ->whereNotIn('id', function ($q) {
                $q->select('rider_id')
                    ->from('deliveries')
                    ->whereIn('status', ['assigned', 'picked_up', 'in_transit']);
            })
            ->get();

        if ($availableRiders->isEmpty()) {
            // No riders available, keep delivery unassigned
            return;
        }

        // Find nearest rider to producer
        $producer = $delivery->producer;
        $nearestRider = null;
        $minDistance = PHP_FLOAT_MAX;

        foreach ($availableRiders as $rider) {
            if (!$rider->latitude || !$rider->longitude || !$producer->latitude) {
                continue;
            }

            $distance = $this->matchingService->calculateDistance(
                $producer->latitude,
                $producer->longitude,
                $rider->latitude,
                $rider->longitude
            );

            if ($distance < $minDistance) {
                $minDistance = $distance;
                $nearestRider = $rider;
            }
        }

        if ($nearestRider) {
            $delivery->update(['rider_id' => $nearestRider->id]);

            // Broadcast delivery assigned event
            // broadcast(new DeliveryAssigned($delivery));
        }
    }

    /**
     * Get active deliveries for optimization recommendations
     */
    public function getActiveDeliveries()
    {
        return Delivery::whereIn('status', ['assigned', 'picked_up', 'in_transit'])
            ->with(['orders', 'rider', 'producer'])
            ->get();
    }

    /**
     * Calculate delivery metrics
     */
    public function getDeliveryMetrics()
    {
        return [
            'average_delivery_time' => Delivery::where('status', 'completed')
                ->selectRaw('AVG(EXTRACT(EPOCH FROM (completed_at - pickup_at))/60) as avg_minutes')
                ->value('avg_minutes') ?? 0,
            'average_orders_per_delivery' => Delivery::where('status', 'completed')
                ->selectRaw('AVG(orders_count) as avg_orders')
                ->value('avg_orders') ?? 0,
            'active_deliveries' => Delivery::active()->count(),
            'completed_today' => Delivery::where('status', 'completed')
                ->whereDate('completed_at', today())
                ->count(),
        ];
    }
}
