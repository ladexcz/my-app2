<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'rider_id',
        'producer_id',
        'status',
        'route_distance',
        'estimated_eta',
        'pickup_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'route_distance' => 'decimal:2',
            'estimated_eta' => 'datetime',
            'pickup_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Delivery belongs to a Rider
     */
    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    /**
     * Delivery belongs to a Producer
     */
    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    /**
     * Delivery has many orders (batch delivery)
     */
    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'delivery_order');
    }

    /**
     * Scope: Get unassigned deliveries (no rider yet)
     */
    public function scopeUnassigned($query)
    {
        return $query->where('status', 'assigned');
    }

    /**
     * Scope: Get active deliveries (in progress)
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['assigned', 'picked_up', 'in_transit']);
    }

    /**
     * Scope: Get deliveries by rider
     */
    public function scopeByRider($query, $riderId)
    {
        return $query->where('rider_id', $riderId);
    }

    /**
     * Scope: Get deliveries by producer
     */
    public function scopeByProducer($query, $producerId)
    {
        return $query->where('producer_id', $producerId);
    }

    /**
     * Add order to delivery batch
     */
    public function addOrder(Order $order): void
    {
        $this->orders()->attach($order->id);
        $order->update(['status' => 'in_delivery']);
    }

    /**
     * Confirm pickup from producer
     */
    public function confirmPickup(): void
    {
        $this->update([
            'status' => 'picked_up',
            'pickup_at' => now(),
        ]);
    }

    /**
     * Start delivery (mark as in transit)
     */
    public function startDelivery(): void
    {
        $this->update(['status' => 'in_transit']);
    }

    /**
     * Complete delivery
     */
    public function completeDelivery(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Mark all orders in batch as delivered
        foreach ($this->orders as $order) {
            $order->markDelivered();
        }
    }

    /**
     * Get total items in delivery batch
     */
    public function getTotalItemsCount(): int
    {
        return $this->orders->reduce(function ($carry, $order) {
            return $carry + $order->items->count();
        }, 0);
    }

    /**
     * Get total orders in batch
     */
    public function getTotalOrdersCount(): int
    {
        return $this->orders->count();
    }
}
