<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Delivery;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class OrderFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $buyer;
    protected User $producer;
    protected User $rider;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->producer = User::factory()->create(['role' => 'producer']);
        $this->buyer = User::factory()->create(['role' => 'buyer']);
        $this->rider = User::factory()->create(['role' => 'rider']);

        // Create test product
        $this->product = Product::factory()->create([
            'producer_id' => $this->producer->id,
            'quantity_available' => 100,
            'price' => 50.00,
        ]);
    }

    /**
     * Test complete order flow: creation -> confirmation -> ready -> delivery -> completion
     */
    public function test_complete_order_flow()
    {
        // 1. Buyer creates order
        $response = $this->actingAs($this->buyer)->postJson('/api/buyer/orders', [
            'producer_id' => $this->producer->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 10,
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(201);
        $order = Order::find($response->json('id'));
        $this->assertEquals('pending', $order->status);
        $this->assertEquals(500, $order->total_price); // 10 * 50

        // 2. Producer confirms order
        $response = $this->actingAs($this->producer)->patchJson(
            "/api/producer/orders/{$order->id}/confirm"
        );

        $response->assertStatus(200);
        $order->refresh();
        $this->assertEquals('confirmed', $order->status);

        // Verify payment is escrowed
        $payment = $order->payment;
        $this->assertNotNull($payment);
        $this->assertEquals('escrowed', $payment->status);
        $this->assertEquals(500, $payment->amount);

        // 3. Producer marks order ready
        $response = $this->actingAs($this->producer)->patchJson(
            "/api/producer/orders/{$order->id}/ready"
        );

        $response->assertStatus(200);
        $order->refresh();
        $this->assertEquals('ready', $order->status);

        // Verify inventory was deducted
        $this->product->refresh();
        $this->assertEquals(90, $this->product->quantity_available);

        // 4. Verify delivery was created and assigned
        $delivery = Delivery::where('producer_id', $this->producer->id)->first();
        $this->assertNotNull($delivery);
        $this->assertEquals('assigned', $delivery->status);

        // Assign rider to delivery
        $delivery->update(['rider_id' => $this->rider->id]);

        // 5. Rider confirms pickup
        $response = $this->actingAs($this->rider)->patchJson(
            "/api/rider/deliveries/{$delivery->id}/pickup"
        );

        $response->assertStatus(200);
        $delivery->refresh();
        $this->assertEquals('picked_up', $delivery->status);

        // 6. Rider starts delivery
        $response = $this->actingAs($this->rider)->patchJson(
            "/api/rider/deliveries/{$delivery->id}/start"
        );

        $response->assertStatus(200);
        $delivery->refresh();
        $this->assertEquals('in_transit', $delivery->status);

        // Verify order status updated
        $order->refresh();
        $this->assertEquals('in_delivery', $order->status);

        // 7. Rider completes delivery
        $response = $this->actingAs($this->rider)->patchJson(
            "/api/rider/deliveries/{$delivery->id}/complete"
        );

        $response->assertStatus(200);
        $delivery->refresh();
        $this->assertEquals('completed', $delivery->status);

        // Verify order is delivered
        $order->refresh();
        $this->assertEquals('delivered', $order->status);

        // Verify payment is released
        $payment->refresh();
        $this->assertEquals('released', $payment->status);
        $this->assertNotNull($payment->released_at);
    }

    /**
     * Test order rejection flow
     */
    public function test_order_rejection_flow()
    {
        $response = $this->actingAs($this->buyer)->postJson('/api/buyer/orders', [
            'producer_id' => $this->producer->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 10,
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $order = Order::find($response->json('id'));

        // Producer rejects order
        $response = $this->actingAs($this->producer)->patchJson(
            "/api/producer/orders/{$order->id}/reject"
        );

        $response->assertStatus(200);
        $order->refresh();
        $this->assertEquals('rejected', $order->status);
    }

    /**
     * Test order cancellation by buyer
     */
    public function test_buyer_order_cancellation()
    {
        $response = $this->actingAs($this->buyer)->postJson('/api/buyer/orders', [
            'producer_id' => $this->producer->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 10,
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $order = Order::find($response->json('id'));

        // Producer confirms
        $this->actingAs($this->producer)->patchJson("/api/producer/orders/{$order->id}/confirm");
        $order->refresh();

        // Buyer cancels
        $response = $this->actingAs($this->buyer)->postJson("/api/buyer/orders/{$order->id}/cancel");

        $response->assertStatus(200);
        $order->refresh();
        $this->assertEquals('cancelled', $order->status);

        // Verify payment is refunded
        $payment = $order->payment;
        $this->assertEquals('refunded', $payment->status);
    }

    /**
     * Test insufficient stock validation
     */
    public function test_insufficient_stock_validation()
    {
        $this->product->update(['quantity_available' => 5]);

        $response = $this->actingAs($this->buyer)->postJson('/api/buyer/orders', [
            'producer_id' => $this->producer->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 10, // More than available
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Insufficient stock for ' . $this->product->name]);
    }

    /**
     * Test minimum order quantity validation
    {
        $this->product->update(['min_order_quantity' => 20]);

        $response = $this->actingAs($this->buyer)->postJson('/api/buyer/orders', [
            'producer_id' => $this->producer->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 10, // Less than minimum
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Minimum order quantity for ' . $this->product->name . ' is 20']);
     */
    public function test_buyer_authorization()
    {
        $order = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'buyer_id' => $this->buyer->id,
        ]);

        // Buyer cannot access producer's order management
        $response = $this->actingAs($this->buyer)->patchJson(
            "/api/producer/orders/{$order->id}/confirm"
        );

        $response->assertStatus(403);
    }

    /**
     * Test rating order
     */
    public function test_rate_delivered_order()
    {
        // Create and deliver order
        $order = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'buyer_id' => $this->buyer->id,
            'status' => 'delivered',
        ]);

        $response = $this->actingAs($this->buyer)->postJson(
            "/api/buyer/orders/{$order->id}/rate",
            [
                'rating' => 5,
                'comment' => 'Great product!',
            ]
        );

        $response->assertStatus(200);
        $this->assertTrue($order->rating()->exists());
    }

    /**
     * Test cannot rate undelivered order
     */
    public function test_cannot_rate_pending_order()
    {
        $order = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'buyer_id' => $this->buyer->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->buyer)->postJson(
            "/api/buyer/orders/{$order->id}/rate",
            [
                'rating' => 5,
                'comment' => 'Great product!',
            ]
        );

        $response->assertStatus(422);
    }
}
