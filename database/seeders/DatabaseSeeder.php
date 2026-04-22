<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create mock users for testing

        // Admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'email_verified_at' => now(),
            'verified_at' => now(),
            'phone' => '+639123456789',
            'latitude' => '14.5994',
            'longitude' => '120.9842',
        ]);

        // Customer (Buyer) user
        User::create([
            'name' => 'Customer User',
            'email' => 'customer@gmail.com',
            'password' => Hash::make('customer123'),
            'role' => 'buyer',
            'email_verified_at' => now(),
            'verified_at' => now(),
            'phone' => '+639123456790',
            'latitude' => '14.5550',
            'longitude' => '121.0244',
        ]);

        // Delivery Partner (Rider) user
        User::create([
            'name' => 'Delivery Partner',
            'email' => 'delivery@gmail.com',
            'password' => Hash::make('delivery123'),
            'role' => 'rider',
            'email_verified_at' => now(),
            'verified_at' => now(),
            'phone' => '+639123456791',
            'latitude' => '14.5950',
            'longitude' => '120.9800',
        ]);

        // Seller (Producer) user
        User::create([
            'name' => 'Seller User',
            'email' => 'seller@gmail.com',
            'password' => Hash::make('seller123'),
            'role' => 'producer',
            'email_verified_at' => now(),
            'verified_at' => now(),
            'phone' => '+639123456792',
            'latitude' => '14.5994',
            'longitude' => '120.9842',
        ]);
    }
}
