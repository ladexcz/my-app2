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
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rider_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('producer_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['assigned', 'picked_up', 'in_transit', 'completed', 'cancelled'])->default('assigned');
            $table->decimal('route_distance', 10, 2)->nullable(); // in km
            $table->timestamp('estimated_eta')->nullable(); // estimated time of arrival
            $table->timestamp('pickup_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('rider_id');
            $table->index('producer_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
