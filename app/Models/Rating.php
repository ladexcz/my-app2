<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rating extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'buyer_id',
        'producer_id',
        'rating',
        'comment',
    ];

    /**
     * Rating belongs to an order
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Rating belongs to a buyer
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Rating belongs to a producer
     */
    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    /**
     * Scope: Get high ratings (4-5 stars)
     */
    public function scopeHighRatings($query)
    {
        return $query->whereIn('rating', [4, 5]);
    }

    /**
     * Scope: Get low ratings (1-2 stars)
     */
    public function scopeLowRatings($query)
    {
        return $query->whereIn('rating', [1, 2]);
    }

    /**
     * Scope: Get ratings for a producer
     */
    public function scopeForProducer($query, $producerId)
    {
        return $query->where('producer_id', $producerId);
    }

    /**
     * Get average rating for a producer
     */
    public static function getAverageRating($producerId): float
    {
        return self::forProducer($producerId)->average('rating') ?? 0;
    }

    /**
     * Get total rating count for a producer
     */
    public static function getRatingCount($producerId): int
    {
        return self::forProducer($producerId)->count();
    }
}
