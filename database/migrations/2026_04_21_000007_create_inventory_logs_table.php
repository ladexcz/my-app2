<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantity_change'); // positive for restock, negative for sold
            $table->enum('reason', ['sold', 'restocked', 'expired', 'adjustment', 'refund'])->default('sold');
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('product_id');
            $table->index('reason');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};
