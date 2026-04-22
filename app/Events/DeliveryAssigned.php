<?php

namespace App\Events;

use App\Models\Delivery;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryAssigned implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Delivery $delivery)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('rider-deliveries.' . $this->delivery->rider_id),
            new PrivateChannel('admin-dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'delivery.assigned';
    }

    public function broadcastWith(): array
    {
        return [
            'delivery' => $this->delivery->load(['orders', 'rider', 'producer']),
        ];
    }
}
