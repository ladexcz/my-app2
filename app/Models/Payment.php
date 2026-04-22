<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'amount',
        'status',
        'payment_method',
        'transaction_id',
        'escrowed_at',
        'released_at',
        'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'escrowed_at' => 'datetime',
            'released_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    /**
     * Payment belongs to an order
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Scope: Get escrowed payments
     */
    public function scopeEscrowed($query)
    {
        return $query->where('status', 'escrowed');
    }

    /**
     * Scope: Get released payments
     */
    public function scopeReleased($query)
    {
        return $query->where('status', 'released');
    }

    /**
     * Scope: Get refunded payments
     */
    public function scopeRefunded($query)
    {
        return $query->where('status', 'refunded');
    }

    /**
     * Scope: Get payments by method
     */
    public function scopeByMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    /**
     * Check if payment is escrowed
     */
    public function isEscrowed(): bool
    {
        return $this->status === 'escrowed';
    }

    /**
     * Check if payment is released
     */
    public function isReleased(): bool
    {
        return $this->status === 'released';
    }

    /**
     * Release escrowed payment (after delivery confirmed)
     */
    public function release(): void
    {
        if ($this->status === 'escrowed') {
            $this->update([
                'status' => 'released',
                'released_at' => now(),
            ]);
        }
    }

    /**
     * Refund payment (on cancellation or rejection)
     */
    public function refund(): void
    {
        $this->update([
            'status' => 'refunded',
            'refunded_at' => now(),
        ]);
    }
}
