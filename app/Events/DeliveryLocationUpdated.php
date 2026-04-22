<?php

namespace App\Events;

use App\Models\Delivery;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Delivery $delivery,
        public array $location
    ) {
    }

    public function broadcastOn(): array
    {
        // Broadcast to all orders in this delivery batch
        $channels = [
            new PrivateChannel('rider-deliveries.' . $this->delivery->rider_id),
        ];

        foreach ($this->delivery->orders as $order) {
            $channels[] = new PrivateChannel('order-tracking.' . $order->id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'delivery.location-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'delivery_id' => $this->delivery->id,
            'latitude' => $this->location['latitude'],
            'longitude' => $this->location['longitude'],
            'eta_minutes' => $this->location['eta_minutes'] ?? null,
            'timestamp' => now(),
        ];
    }
}
