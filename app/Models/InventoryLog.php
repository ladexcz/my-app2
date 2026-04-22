<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'quantity_change',
        'reason',
        'order_id',
        'notes',
    ];

    /**
     * Inventory log belongs to a product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Inventory log belongs to an order (if reason is sold)
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Scope: Get logs by product
     */
    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope: Get logs by reason
     */
    public function scopeByReason($query, $reason)
    {
        return $query->where('reason', $reason);
    }

    /**
     * Scope: Get sales logs
     */
    public function scopeSales($query)
    {
        return $query->where('reason', 'sold');
    }

    /**
     * Scope: Get restock logs
     */
    public function scopeRestocks($query)
    {
        return $query->where('reason', 'restocked');
    }

    /**
     * Scope: Get expired logs
     */
    public function scopeExpired($query)
    {
        return $query->where('reason', 'expired');
    }
}
