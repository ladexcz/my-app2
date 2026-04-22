<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'buyer_id',
        'producer_id',
        'total_price',
        'status',
        'payment_method',
        'ordered_at',
        'confirmed_at',
        'ready_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'total_price' => 'decimal:2',
            'ordered_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'ready_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    /**
     * Order belongs to a Buyer
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Order belongs to a Producer
     */
    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    /**
     * Order has many items
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Order has one delivery
     */
    public function delivery(): HasOne
    {
        return $this->hasOne(Delivery::class);
    }

    /**
     * Order has one payment
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /**
     * Order has one rating
     */
    public function rating(): HasOne
    {
        return $this->hasOne(Rating::class);
    }

    /**
     * Scope: Get pending orders
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Get confirmed orders
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Scope: Get orders ready for delivery
     */
    public function scopeReady($query)
    {
        return $query->where('status', 'ready');
    }

    /**
     * Scope: Get orders in delivery
     */
    public function scopeInDelivery($query)
    {
        return $query->where('status', 'in_delivery');
    }

    /**
     * Scope: Get delivered orders
     */
    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }

    /**
     * Scope: Get orders by buyer
     */
    public function scopeByBuyer($query, $buyerId)
    {
        return $query->where('buyer_id', $buyerId);
    }

    /**
     * Scope: Get orders by producer
     */
    public function scopeByProducer($query, $producerId)
    {
        return $query->where('producer_id', $producerId);
    }

    /**
     * Confirm order (producer accepts it)
     */
    public function confirm(): void
    {
        $this->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        // Create escrowed payment
        Payment::create([
            'order_id' => $this->id,
            'amount' => $this->total_price,
            'status' => 'escrowed',
            'payment_method' => $this->payment_method,
            'escrowed_at' => now(),
        ]);
    }

    /**
     * Mark order as ready for pickup
     */
    public function markReady(): void
    {
        $this->update([
            'status' => 'ready',
            'ready_at' => now(),
        ]);
    }

    /**
     * Mark order as in delivery
     */
    public function markInDelivery(): void
    {
        $this->update([
            'status' => 'in_delivery',
        ]);
    }

    /**
     * Mark order as delivered
     */
    public function markDelivered(): void
    {
        $this->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        // Release escrowed payment
        $payment = $this->payment;
        if ($payment && $payment->status === 'escrowed') {
            $payment->update([
                'status' => 'released',
                'released_at' => now(),
            ]);
        }
    }

    /**
     * Cancel order
     */
    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);

        // Refund any escrowed payment
        $payment = $this->payment;
        if ($payment && $payment->status === 'escrowed') {
            $payment->update([
                'status' => 'refunded',
                'refunded_at' => now(),
            ]);
        }
    }

    /**
     * Reject order (producer rejects it)
     */
    public function reject(): void
    {
        $this->update(['status' => 'rejected']);
    }

    /**
     * Calculate total price for order
     */
    public static function calculateTotal(array $items): float
    {
        $total = 0;
        foreach ($items as $item) {
            $total += $item['quantity'] * $item['unit_price'];
        }
        return $total;
    }
}
