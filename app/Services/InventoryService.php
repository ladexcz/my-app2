<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Check inventory for orders
     */
    public function checkInventoryAvailability(array $items): array
    {
        $availability = [];
        $errors = [];

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);

            if (!$product) {
                $errors[] = "Product {$item['product_id']} not found";
                continue;
            }

            $available = $product->quantity_available >= $item['quantity'] &&
                         $item['quantity'] >= $product->min_order_quantity &&
                         $product->isFresh();

            $availability[$item['product_id']] = [
                'product' => $product,
                'requested' => $item['quantity'],
                'available' => $product->quantity_available,
                'is_available' => $available,
                'freshness_expires_at' => $product->freshness_expiry_time,
            ];

            if (!$available) {
                $msg = "Product {$product->name}: ";
                if ($product->quantity_available < $item['quantity']) {
                    $msg .= "Only {$product->quantity_available} units available";
                } elseif ($item['quantity'] < $product->min_order_quantity) {
                    $msg .= "Minimum order is {$product->min_order_quantity} units";
                } elseif (!$product->isFresh()) {
                    $msg .= "Product expired";
                }
                $errors[] = $msg;
            }
        }

        return [
            'availability' => $availability,
            'errors' => $errors,
            'is_available' => empty($errors),
        ];
    }

    /**
     * Deduct inventory when order is confirmed
     */
    public function deductInventoryForOrder(int $orderId): bool
    {
        try {
            DB::beginTransaction();

            $order = \App\Models\Order::find($orderId);
            if (!$order) {
                return false;
            }

            foreach ($order->items as $item) {
                $item->product->deductInventory($item->quantity, $orderId);
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    /**
     * Restock product
     */
    public function restockProduct(int $productId, int $quantity, string $notes = null): bool
    {
        $product = Product::find($productId);
        if (!$product) {
            return false;
        }

        try {
            $product->restock($quantity, $notes);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Mark expired products as unavailable
     * Run this regularly (e.g., every 5 minutes via scheduled task)
     */
    public function markExpiredProducts(): int
    {
        $expiredCount = 0;

        $expiredProducts = Product::where('is_available', true)
            ->whereNotNull('freshness_expiry_time')
            ->where('freshness_expiry_time', '<', now())
            ->get();

        foreach ($expiredProducts as $product) {
            $product->markUnavailable();
            $expiredCount++;
        }

        return $expiredCount;
    }

    /**
     * Get low stock alerts
     */
    public function getLowStockProducts(int $threshold = 5)
    {
        return Product::where('is_available', true)
            ->where('quantity_available', '<=', $threshold)
            ->where('quantity_available', '>', 0)
            ->with('producer')
            ->get();
    }

    /**
     * Get inventory report for producer
     */
    public function getProducerInventoryReport(int $producerId)
    {
        return Product::where('producer_id', $producerId)
            ->with('inventoryLogs')
            ->get()
            ->map(function ($product) {
                $soldCount = $product->inventoryLogs()
                    ->where('reason', 'sold')
                    ->sum(DB::raw('ABS(quantity_change)'));

                return [
                    'product' => $product,
                    'current_stock' => $product->quantity_available,
                    'total_sold' => $soldCount,
                    'status' => $product->is_available ? 'active' : 'inactive',
                    'expires_at' => $product->freshness_expiry_time,
                    'days_to_expiry' => $product->freshness_expiry_time
                        ? $product->freshness_expiry_time->diffInDays(now())
                        : null,
                ];
            });
    }

    /**
     * Get inventory logs for product
     */
    public function getProductInventoryHistory(int $productId, int $days = 30)
    {
        $product = Product::find($productId);
        if (!$product) {
            return null;
        }

        return [
            'product' => $product,
            'logs' => $product->inventoryLogs()
                ->where('created_at', '>=', now()->subDays($days))
                ->orderBy('created_at', 'desc')
                ->get(),
        ];
    }

    /**
     * Predict stock out date based on historical sales
     */
    public function predictStockOutDate(int $productId): ?\DateTime
    {
        $product = Product::find($productId);
        if (!$product || $product->quantity_available <= 0) {
            return null;
        }

        // Get sales from last 7 days
        $last7Days = $product->inventoryLogs()
            ->where('reason', 'sold')
            ->where('created_at', '>=', now()->subDays(7))
            ->get();

        if ($last7Days->isEmpty()) {
            return null;
        }

        $totalSold = $last7Days->sum(fn($log) => abs($log->quantity_change));
        $dailyAverage = $totalSold / 7;

        if ($dailyAverage <= 0) {
            return null;
        }

        $daysToStockOut = ceil($product->quantity_available / $dailyAverage);

        return now()->addDays($daysToStockOut);
    }
}
