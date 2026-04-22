<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DeliveryController extends Controller
{
    /**
     * Get rider's deliveries
     */
    public function riderDeliveries(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->isRider()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = $user->deliveries()->with(['orders', 'producer', 'rider']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $deliveries = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($deliveries);
    }

    /**
     * Get single delivery
     */
    public function show($id): JsonResponse
    {
        $delivery = Delivery::with(['orders', 'producer', 'rider'])->findOrFail($id);
        $user = Auth::user();

        if ($delivery->rider_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($delivery);
    }

    /**
     * Confirm pickup from producer (rider)
     */
    public function confirmPickup($id): JsonResponse
    {
        $delivery = Delivery::findOrFail($id);
        $user = Auth::user();

        if ($delivery->rider_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($delivery->status !== 'assigned') {
            return response()->json(['message' => 'Delivery must be assigned to confirm pickup'], 422);
        }

        $delivery->confirmPickup();

        return response()->json(['message' => 'Pickup confirmed', 'delivery' => $delivery]);
    }

    /**
     * Start delivery (rider begins route)
     */
    public function startDelivery($id): JsonResponse
    {
        $delivery = Delivery::findOrFail($id);
        $user = Auth::user();

        if ($delivery->rider_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($delivery->status !== 'picked_up') {
            return response()->json(['message' => 'Delivery must be picked up first'], 422);
        }

        $delivery->startDelivery();

        // Update all orders to in_delivery status
        foreach ($delivery->orders as $order) {
            $order->markInDelivery();
        }

        // Broadcast delivery started event (will implement in Phase 5)
        // broadcast(new DeliveryStarted($delivery));

        return response()->json(['message' => 'Delivery started', 'delivery' => $delivery]);
    }

    /**
     * Complete delivery (rider confirms all deliveries done)
     */
    public function completeDelivery($id): JsonResponse
    {
        $delivery = Delivery::findOrFail($id);
        $user = Auth::user();

        if ($delivery->rider_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($delivery->status !== 'in_transit') {
            return response()->json(['message' => 'Delivery must be in transit'], 422);
        }

        $delivery->completeDelivery();

        // Broadcast delivery completed event (will implement in Phase 5)
        // broadcast(new DeliveryCompleted($delivery));

        return response()->json(['message' => 'Delivery completed', 'delivery' => $delivery]);
    }

    /**
     * Update rider location (for tracking - can be called frequently)
     */
    public function updateLocation($id, Request $request): JsonResponse
    {
        $delivery = Delivery::findOrFail($id);
        $user = Auth::user();

        if ($delivery->rider_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'eta_minutes' => 'nullable|integer|min:0',
        ]);

        // Update rider's location
        $user->update([
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ]);

        // Update ETA if provided
        if ($request->filled('eta_minutes')) {
            $delivery->update([
                'estimated_eta' => now()->addMinutes($validated['eta_minutes']),
            ]);
        }

        // Broadcast location update (will implement in Phase 5)
        // broadcast(new RiderLocationUpdated($delivery, $validated));

        return response()->json(['message' => 'Location updated']);
    }
}
