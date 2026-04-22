<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Get buyer's orders
     */
    public function buyerOrders(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->isBuyer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $orders = $user->buyerOrders()
            ->with(['items', 'producer', 'delivery', 'payment', 'rating'])
            ->orderBy('ordered_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($orders);
    }

    /**
     * Get producer's orders (orders they received)
     */
    public function producerOrders(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->isProducer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $orders = $user->producerOrders()
            ->with(['items', 'buyer', 'delivery', 'payment'])
            ->orderBy('ordered_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($orders);
    }

    /**
     * Get single order
     */
    public function show($id): JsonResponse
    {
        $order = Order::with(['items', 'buyer', 'producer', 'delivery', 'payment', 'rating'])
            ->findOrFail($id);

        // Check authorization
        if ($order->buyer_id !== Auth::id() && $order->producer_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($order);
    }

    /**
     * Create order (buyer places order)
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->isBuyer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'producer_id' => 'required|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|string|max:50',
        ]);

        try {
            DB::beginTransaction();

            $totalPrice = 0;
            $orderItems = [];

            // Validate all products belong to producer and have sufficient stock
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($product->producer_id != $validated['producer_id']) {
                    return response()->json(['message' => 'Product does not belong to selected producer'], 422);
                }

                if ($product->quantity_available < $item['quantity']) {
                    return response()->json(['message' => "Insufficient stock for {$product->name}"], 422);
                }

                if ($item['quantity'] < $product->min_order_quantity) {
                    return response()->json(['message' => "Minimum order quantity for {$product->name} is {$product->min_order_quantity}"], 422);
                }

                $subtotal = $product->price * $item['quantity'];
                $totalPrice += $subtotal;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'subtotal' => $subtotal,
                ];
            }

            // Create order
            $order = Order::create([
                'buyer_id' => $user->id,
                'producer_id' => $validated['producer_id'],
                'total_price' => $totalPrice,
                'status' => 'pending',
                'payment_method' => $validated['payment_method'],
                'ordered_at' => now(),
            ]);

            // Create order items
            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            DB::commit();

            // Broadcast order created event (will implement in Phase 5)
            // broadcast(new OrderCreated($order));

            return response()->json($order->load(['items', 'producer', 'payment']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create order: ' . $e->getMessage()], 422);
        }
    }

    /**
     * Confirm order (producer accepts)
     */
    public function confirm($id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = Auth::user();

        if ($order->producer_id !== $user->id || !$user->isProducer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order cannot be confirmed in current status'], 422);
        }

        $order->confirm();

        return response()->json(['message' => 'Order confirmed', 'order' => $order]);
    }

    /**
     * Reject order (producer rejects)
     */
    public function reject($id, Request $request): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = Auth::user();

        if ($order->producer_id !== $user->id || !$user->isProducer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order cannot be rejected in current status'], 422);
        }

        $order->reject();

        return response()->json(['message' => 'Order rejected', 'order' => $order]);
    }

    /**
     * Mark order ready for pickup (producer)
     */
    public function markReady($id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = Auth::user();

        if ($order->producer_id !== $user->id || !$user->isProducer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->status !== 'confirmed') {
            return response()->json(['message' => 'Order must be confirmed first'], 422);
        }

        $order->markReady();

        // Deduct inventory
        foreach ($order->items as $item) {
            $item->product->deductInventory($item->quantity, $order->id);
        }

        // Trigger delivery assignment
        app(\App\Services\DeliveryService::class)->assignDeliveryForOrder($order);

        return response()->json(['message' => 'Order marked ready', 'order' => $order]);
    }

    /**
     * Rate product (buyer after delivery)
     */
    public function rate($id, Request $request): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = Auth::user();

        if ($order->buyer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->status !== 'delivered') {
            return response()->json(['message' => 'Can only rate delivered orders'], 422);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $rating = Rating::updateOrCreate(
            ['order_id' => $order->id],
            [
                'buyer_id' => $user->id,
                'producer_id' => $order->producer_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]
        );

        return response()->json(['message' => 'Rating saved', 'rating' => $rating]);
    }

    /**
     * Cancel order (buyer can cancel if not confirmed yet)
     */
    public function cancel($id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = Auth::user();

        if ($order->buyer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Order cannot be cancelled in current status'], 422);
        }

        $order->cancel();

        return response()->json(['message' => 'Order cancelled', 'order' => $order]);
    }
}
