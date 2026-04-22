<?php

namespace App\Broadcasting;

use App\Models\Order;
use App\Models\User;

class OrderTrackingChannel
{
    /**
     * Authenticate the user's access to the channel.
     */
    public function join(User $user, Order $order): bool
    {
        // Only buyer or producer of the order can track it
        return $user->id === $order->buyer_id || $user->id === $order->producer_id;
    }
}
