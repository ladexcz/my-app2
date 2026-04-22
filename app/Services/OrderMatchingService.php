<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OrderMatchingService
{
    /**
     * Match order to nearest available producer
     * 
     * Uses simple location-based matching (Haversine formula)
     * In production, would integrate with Google Maps API
     */
    public function matchOrderToProducer(Order $order): ?User
    {
        // Get all products needed from the order
        $productIds = $order->items->pluck('product_id')->toArray();

        // Find producers who have ALL required products in stock
        $matchingProducers = User::where('role', 'producer')
            ->whereNull('deleted_at')
            ->where(function ($q) use ($productIds) {
                $q->whereHas('products', function ($subQ) use ($productIds) {
                    $subQ->whereIn('id', $productIds)
                        ->where('quantity_available', '>', 0)
                        ->where('is_available', true);
                }, '=', count($productIds)); // Ensure producer has ALL products
            })
            ->get();

        if ($matchingProducers->isEmpty()) {
            return null;
        }

        // If buyer has location, match by nearest producer
        if ($order->buyer->latitude && $order->buyer->longitude) {
            $producer = $this->findNearestProducer(
                $matchingProducers,
                $order->buyer->latitude,
                $order->buyer->longitude
            );
        } else {
            // Random producer if no buyer location
            $producer = $matchingProducers->random();
        }

        return $producer;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * Returns distance in kilometers
     */
    public function calculateDistance(
        float $lat1,
        float $lon1,
        float $lat2,
        float $lon2
    ): float {
        $earthRadius = 6371; // km

        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(
            sqrt(
                pow(sin($latDelta / 2), 2) +
                cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)
            )
        );

        return $angle * $earthRadius;
    }

    /**
     * Find nearest producer from collection
     */
    private function findNearestProducer($producers, float $buyerLat, float $buyerLon): User
    {
        $nearest = null;
        $minDistance = PHP_FLOAT_MAX;

        foreach ($producers as $producer) {
            if (!$producer->latitude || !$producer->longitude) {
                continue;
            }

            $distance = $this->calculateDistance(
                $buyerLat,
                $buyerLon,
                $producer->latitude,
                $producer->longitude
            );

            if ($distance < $minDistance) {
                $minDistance = $distance;
                $nearest = $producer;
            }
        }

        return $nearest ?? $producers->first();
    }

    /**
     * Validate order can be matched to producer
     */
    public function validateOrderCanBeMatched(Order $order): array
    {
        $errors = [];

        // Check all products exist and have stock
        foreach ($order->items as $item) {
            if (!$item->product) {
                $errors[] = "Product {$item->product_id} not found";
                continue;
            }

            if ($item->product->quantity_available < $item->quantity) {
                $errors[] = "Insufficient stock for {$item->product->name}";
            }

            if (!$item->product->isFresh()) {
                $errors[] = "Product {$item->product->name} has expired";
            }
        }

        return $errors;
    }
}
