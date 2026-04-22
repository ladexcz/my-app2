<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'buyer_id' => \App\Models\User::factory(),
            'producer_id' => \App\Models\User::factory(),
            'total_price' => $this->faker->randomFloat(2, 50, 5000),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'ready', 'in_delivery', 'delivered', 'rejected', 'cancelled']),
            'payment_method' => $this->faker->randomElement(['cash', 'digital', 'gcash', 'maya']),
            'ordered_at' => now(),
            'confirmed_at' => $this->faker->optional(0.5)->dateTimeBetween('-1 week', 'now'),
            'ready_at' => $this->faker->optional(0.3)->dateTimeBetween('-1 week', 'now'),
            'delivered_at' => $this->faker->optional(0.2)->dateTimeBetween('-1 week', 'now'),
        ];
    }
}
