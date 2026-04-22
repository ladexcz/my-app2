<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order,
        public string $oldStatus,
        public string $newStatus
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('order-tracking.' . $this->order->id),
            new PrivateChannel('producer-orders.' . $this->order->producer_id),
            new PrivateChannel('admin-dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.status-changed';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'order' => $this->order->load(['items', 'buyer', 'delivery']),
            'timestamp' => now(),
        ];
    }
}
