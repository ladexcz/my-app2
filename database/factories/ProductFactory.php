<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'producer_id' => \App\Models\User::factory(),
            'name' => $this->faker->words(2, true), // better than word
            'category' => $this->faker->randomElement(['vegetables', 'fruits', 'fish', 'meat', 'dairy', 'grains']),
            'price' => $this->faker->randomFloat(2, 10, 500),
            'quantity_available' => $this->faker->numberBetween(10, 1000),
            'min_order_quantity' => $this->faker->numberBetween(1, 10),
            'unit' => $this->faker->randomElement(['kg', 'lbs', 'pieces', 'liters']),
            'description' => $this->faker->optional()->sentence(),
            'freshness_expiry_time' => $this->faker->optional()->dateTimeBetween('now', '+30 days'),
            'is_available' => $this->faker->boolean(90), // 90% available
        ];
    }
}
