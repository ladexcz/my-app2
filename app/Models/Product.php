<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'producer_id',
        'name',
        'category',
        'price',
        'quantity_available',
        'min_order_quantity',
        'unit',
        'description',
        'freshness_expiry_time',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'freshness_expiry_time' => 'datetime',
            'is_available' => 'boolean',
        ];
    }

    /**
     * Product belongs to a Producer (User)
     */
    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    /**
     * Product has many order items
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Product has many inventory logs
     */
    public function inventoryLogs(): HasMany
    {
        return $this->hasMany(InventoryLog::class);
    }

    /**
     * Scope: Get only available products (not expired, in stock)
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)
            ->where('quantity_available', '>', 0)
            ->where(function ($q) {
                $q->whereNull('freshness_expiry_time')
                    ->orWhere('freshness_expiry_time', '>', now());
            });
    }

    /**
     * Scope: Get products expiring soon (within 24 hours)
     */
    public function scopeExpiringSoon($query)
    {
        return $query->whereBetween('freshness_expiry_time', [now(), now()->addHours(24)]);
    }

    /**
     * Scope: Get products by producer
     */
    public function scopeByProducer($query, $producerId)
    {
        return $query->where('producer_id', $producerId);
    }

    /**
     * Scope: Get products by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope: Get products within price range
     */
    public function scopeWithinPriceRange($query, $minPrice, $maxPrice)
    {
        return $query->whereBetween('price', [$minPrice, $maxPrice]);
    }

    /**
     * Check if product is still fresh (not expired)
     */
    public function isFresh(): bool
    {
        if (!$this->freshness_expiry_time) {
            return true;
        }
        return $this->freshness_expiry_time > now();
    }

    /**
     * Mark product as unavailable (expired or out of stock)
     */
    public function markUnavailable(): void
    {
        $this->update(['is_available' => false]);
    }

    /**
     * Deduct inventory after order
     */
    public function deductInventory(int $quantity, int $orderId): void
    {
        $this->decrement('quantity_available', $quantity);
        
        $this->inventoryLogs()->create([
            'quantity_change' => -$quantity,
            'reason' => 'sold',
            'order_id' => $orderId,
        ]);

        if ($this->quantity_available <= 0) {
            $this->markUnavailable();
        }
    }

    /**
     * Restock inventory
     */
    public function restock(int $quantity, string $notes = null): void
    {
        $this->increment('quantity_available', $quantity);
        
        $this->inventoryLogs()->create([
            'quantity_change' => $quantity,
            'reason' => 'restocked',
            'notes' => $notes,
        ]);

        if ($quantity > 0) {
            $this->update(['is_available' => true]);
        }
    }
}
