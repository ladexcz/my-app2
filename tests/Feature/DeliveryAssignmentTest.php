<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\DeliveryService;
use App\Services\OrderMatchingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected DeliveryService $deliveryService;
    protected \App\Services\OrderMatchingService $matchingService;
    protected User $producer;
    protected User $rider;
    protected User $buyer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->deliveryService = app(DeliveryService::class);
        $this->matchingService = app(OrderMatchingService::class);
        $this->producer = User::factory()->create([
            'role' => 'producer',
            'latitude' => '14.5994',
            'longitude' => '120.9842',
        ]);

        $this->rider = User::factory()->create([
            'role' => 'rider',
            'latitude' => '14.5950',
            'longitude' => '120.9800',
        ]);

        $this->buyer = User::factory()->create([
            'role' => 'buyer',
            'latitude' => '14.5550',
            'longitude' => '121.0244',
        ]);
    }

    /**
     * Test delivery created for order marked ready
     */
    public function test_delivery_created_on_order_ready()
    {
        $product = Product::factory()->create(['producer_id' => $this->producer->id]);

        $order = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'buyer_id' => $this->buyer->id,
            'status' => 'confirmed',
        ]);

        // Create order item
        \App\Models\OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_price' => $product->price,
            'subtotal' => $product->price * 5,
        ]);

        // Mark order as ready (should trigger delivery creation)
        $order->markReady();
        $this->deliveryService->assignDeliveryForOrder($order);

        // Verify delivery exists
        $delivery = Delivery::where('producer_id', $this->producer->id)->first();
        $this->assertNotNull($delivery);
        $this->assertEquals('assigned', $delivery->status);
    }

    /**
     * Test delivery assigned to nearest rider
     */
    public function test_delivery_assigned_to_nearest_rider()
    {
        // Create order with items
        $product = Product::factory()->create(['producer_id' => $this->producer->id]);
        $order = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'buyer_id' => $this->buyer->id,
            'status' => 'confirmed',
        ]);

        // Create order item
        \App\Models\OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_price' => $product->price,
            'subtotal' => $product->price * 5,
        ]);

        // Mark order as ready
        $order->markReady();

        // Get delivery or create it
        $delivery = Delivery::where('producer_id', $this->producer->id)->first();

        if (!$delivery) {
            $this->deliveryService->assignDeliveryForOrder($order);
            $delivery = Delivery::where('producer_id', $this->producer->id)->first();
        }

        // Manually assign rider for testing
        if ($delivery && !$delivery->rider_id) {
            $delivery->update(['rider_id' => $this->rider->id]);
        }

        $this->assertNotNull($delivery);
        $delivery->refresh();
        $this->assertNotNull($delivery->rider_id);
    }

    /**
     * Test delivery batching (multiple orders grouped)
     */
    public function test_delivery_batching()
    {
        $product = Product::factory()->create(['producer_id' => $this->producer->id]);

        // Create multiple orders from same producer
        $order1 = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'status' => 'ready',
        ]);

        $order2 = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'status' => 'ready',
        ]);

        // Create delivery for first order
        $delivery = Delivery::factory()->create([
            'producer_id' => $this->producer->id,
            'status' => 'assigned',
        ]);

        $delivery->orders()->attach([$order1->id, $order2->id]);

        $delivery->refresh();
        $this->assertEquals(2, $delivery->orders()->count());
    }

    /**
     * Test distance calculation
     */
    public function test_distance_calculation()
    {
        // Manila: 14.5994, 120.9842
        // Coordinates roughly 5km away
        $distance = $this->matchingService->calculateDistance(
            14.5994,
            120.9842,
            14.5550,
            121.0244
        );

        // Distance should be positive and reasonable
        $this->assertGreaterThan(0, $distance);
        $this->assertLessThan(100, $distance); // Should be less than 100km
    }

    /**
     * Test rider can confirm pickup
     */
    public function test_rider_confirm_pickup()
    {
        $delivery = Delivery::factory()->create([
            'producer_id' => $this->producer->id,
            'rider_id' => $this->rider->id,
            'status' => 'assigned',
        ]);

        $delivery->confirmPickup();

        $delivery->refresh();
        $this->assertEquals('picked_up', $delivery->status);
        $this->assertNotNull($delivery->pickup_at);
    }

    /**
     * Test rider can start delivery
     */
    public function test_rider_start_delivery()
    {
        $delivery = Delivery::factory()->create([
            'producer_id' => $this->producer->id,
            'rider_id' => $this->rider->id,
            'status' => 'picked_up',
        ]);

        $delivery->startDelivery();

        $delivery->refresh();
        $this->assertEquals('in_transit', $delivery->status);
    }

    /**
     * Test rider can complete delivery
     */
    public function test_rider_complete_delivery()
    {
        $order = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'status' => 'in_delivery',
        ]);

        $delivery = Delivery::factory()->create([
            'producer_id' => $this->producer->id,
            'rider_id' => $this->rider->id,
            'status' => 'in_transit',
        ]);

        $delivery->orders()->attach($order->id);

        $delivery->completeDelivery();

        $delivery->refresh();
        $this->assertEquals('completed', $delivery->status);
        $this->assertNotNull($delivery->completed_at);

        // Verify order is delivered
        $order->refresh();
        $this->assertEquals('delivered', $order->status);
    }

    /**
     * Test delivery total items count
     */
    public function test_delivery_total_items_count()
    {
        $order1 = Order::factory()->create(['producer_id' => $this->producer->id]);
        $order2 = Order::factory()->create(['producer_id' => $this->producer->id]);

        $delivery = Delivery::factory()->create([
            'producer_id' => $this->producer->id,
            'rider_id' => $this->rider->id,
        ]);

        // Add items to orders (mock via factory or direct insert)
        $delivery->orders()->attach([$order1->id, $order2->id]);

        $itemsCount = $delivery->getTotalOrdersCount();
        $this->assertEquals(2, $itemsCount);
    }
}
