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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producer_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('category'); // vegetables, fruits, fish, etc
            $table->decimal('price', 10, 2); // price per kg or per unit
            $table->integer('quantity_available'); // current stock
            $table->integer('min_order_quantity')->default(1); // minimum order qty
            $table->string('unit')->default('kg'); // kg, lbs, pieces, etc
            $table->text('description')->nullable();
            $table->timestamp('freshness_expiry_time')->nullable(); // when product expires
            $table->boolean('is_available')->default(true);
            $table->timestamps();
            
            // Indexes for fast queries
            $table->index('producer_id');
            $table->index('freshness_expiry_time');
            $table->index('is_available');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
