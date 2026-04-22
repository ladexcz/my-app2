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
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('buyer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('producer_id')->constrained('users')->onDelete('cascade');
            $table->integer('rating')->min(1)->max(5); // 1-5 stars
            $table->text('comment')->nullable();
            $table->timestamps();
            
            // Ensure one rating per order
            $table->unique('order_id');
            
            // Indexes
            $table->index('buyer_id');
            $table->index('producer_id');
            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
