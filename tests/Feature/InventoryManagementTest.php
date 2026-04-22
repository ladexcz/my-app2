<?php

namespace Tests\Feature;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected InventoryService $inventoryService;
    protected User $producer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->inventoryService = app(InventoryService::class);
        $this->producer = User::factory()->create(['role' => 'producer']);
        $this->product = Product::factory()->create([
            'producer_id' => $this->producer->id,
            'quantity_available' => 100,
            'price' => 50.00,
        ]);
    }

    /**
     * Test inventory deduction on order
     */
    public function test_inventory_deducted_on_order()
    {
        $initialQuantity = $this->product->quantity_available;

        $order = Order::factory()->create([
            'producer_id' => $this->producer->id,
            'status' => 'ready',
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 20,
        ]);

        // Deduct inventory
        $this->product->deductInventory(20, $order->id);

        // Verify quantity reduced
        $this->product->refresh();
        $this->assertEquals($initialQuantity - 20, $this->product->quantity_available);
    }

    /**
     * Test inventory log is created
     */
    public function test_inventory_log_created_on_deduction()
    {
        $order = Order::factory()->create(['producer_id' => $this->producer->id]);

        $this->product->deductInventory(10, $order->id);

        $log = InventoryLog::where('product_id', $this->product->id)
            ->where('order_id', $order->id)
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals(-10, $log->quantity_change);
        $this->assertEquals('sold', $log->reason);
    }

    /**
     * Test product marked unavailable when stock depleted
     */
    public function test_product_unavailable_when_stock_depleted()
    {
        $this->product->update(['quantity_available' => 5]);

        $order = Order::factory()->create(['producer_id' => $this->producer->id]);

        // Deduct remaining stock
        $this->product->deductInventory(5, $order->id);

        $this->product->refresh();
        $this->assertEquals(0, $this->product->quantity_available);
        $this->assertFalse($this->product->is_available);
    }

    /**
     * Test restock increases inventory
     */
    public function test_restock_increases_inventory()
    {
        $this->product->update(['quantity_available' => 10]);

        $this->product->restock(30, 'Morning restock');

        $this->product->refresh();
        $this->assertEquals(40, $this->product->quantity_available);
        $this->assertTrue($this->product->is_available);
    }

    /**
     * Test restock creates inventory log
     */
    public function test_restock_creates_log()
    {
        $this->product->restock(25, 'New harvest');

        $log = InventoryLog::where('product_id', $this->product->id)
            ->where('reason', 'restocked')
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals(25, $log->quantity_change);
        $this->assertEquals('New harvest', $log->notes);
    }

    /**
     * Test check inventory availability
     */
    public function test_check_inventory_availability()
    {
        $items = [
            [
                'product_id' => $this->product->id,
                'quantity' => 50,
            ],
        ];

        $result = $this->inventoryService->checkInventoryAvailability($items);

        $this->assertTrue($result['is_available']);
        $this->assertEmpty($result['errors']);
        $this->assertTrue($result['availability'][$this->product->id]['is_available']);
    }

    /**
     * Test check inventory insufficient stock
     */
    public function test_check_inventory_insufficient_stock()
    {
        $this->product->update(['quantity_available' => 10]);

        $items = [
            [
                'product_id' => $this->product->id,
                'quantity' => 50, // More than available
            ],
        ];

        $result = $this->inventoryService->checkInventoryAvailability($items);

        $this->assertFalse($result['is_available']);
        $this->assertNotEmpty($result['errors']);
    }

    /**
     * Test get low stock products
     */
    public function test_get_low_stock_products()
    {
        Product::factory()->create([
            'producer_id' => $this->producer->id,
            'quantity_available' => 3, // Low stock
        ]);

        Product::factory()->create([
            'producer_id' => $this->producer->id,
            'quantity_available' => 100, // Normal stock
        ]);

        $lowStockProducts = $this->inventoryService->getLowStockProducts(5);

        // Should return 1 product (the one with 3 units)
        $this->assertGreaterThanOrEqual(1, $lowStockProducts->count());
    }

    /**
     * Test inventory history
     */
    public function test_get_product_inventory_history()
    {
        $order = Order::factory()->create(['producer_id' => $this->producer->id]);

        $this->product->deductInventory(20, $order->id);
        $this->product->restock(10, 'Restocked');

        $history = $this->inventoryService->getProductInventoryHistory($this->product->id);

        $this->assertNotNull($history);
        $this->assertEquals($this->product->id, $history['product']->id);
        $this->assertGreaterThanOrEqual(2, $history['logs']->count());
    }
}
