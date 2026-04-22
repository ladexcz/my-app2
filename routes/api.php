<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth
        Route::get('/auth/me', [AuthController::class, 'currentUser']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Marketplace (Products) - Public browsing
        Route::get('/marketplace', [ProductController::class, 'marketplace']);
        Route::get('/products/{id}', [ProductController::class, 'show']);

        // Producer - Product Management
        Route::get('/producer/products', [ProductController::class, 'producerProducts']);
        Route::post('/producer/products', [ProductController::class, 'store']);
        Route::patch('/producer/products/{id}', [ProductController::class, 'update']);
        Route::delete('/producer/products/{id}', [ProductController::class, 'destroy']);

        // Producer - Order Management
        Route::get('/producer/orders', [OrderController::class, 'producerOrders']);
        Route::patch('/producer/orders/{id}/confirm', [OrderController::class, 'confirm']);
        Route::patch('/producer/orders/{id}/reject', [OrderController::class, 'reject']);
        Route::patch('/producer/orders/{id}/ready', [OrderController::class, 'markReady']);

        // Buyer - Orders
        Route::get('/buyer/orders', [OrderController::class, 'buyerOrders']);
        Route::post('/buyer/orders', [OrderController::class, 'store']);
        Route::get('/buyer/orders/{id}', [OrderController::class, 'show']);
        Route::post('/buyer/orders/{id}/rate', [OrderController::class, 'rate']);
        Route::post('/buyer/orders/{id}/cancel', [OrderController::class, 'cancel']);

        // Rider - Deliveries
        Route::get('/rider/deliveries', [DeliveryController::class, 'riderDeliveries']);
        Route::get('/rider/deliveries/{id}', [DeliveryController::class, 'show']);
        Route::patch('/rider/deliveries/{id}/pickup', [DeliveryController::class, 'confirmPickup']);
        Route::patch('/rider/deliveries/{id}/start', [DeliveryController::class, 'startDelivery']);
        Route::patch('/rider/deliveries/{id}/complete', [DeliveryController::class, 'completeDelivery']);
        Route::patch('/rider/deliveries/{id}/location', [DeliveryController::class, 'updateLocation']);

        // Admin - Dashboard and Management
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/activity', [AdminController::class, 'recentActivity']);
        Route::get('/admin/users', [AdminController::class, 'users']);
        Route::patch('/admin/users/{id}/verify', [AdminController::class, 'verifyUser']);
        Route::get('/admin/sales-analytics', [AdminController::class, 'salesAnalytics']);
        Route::get('/admin/top-producers', [AdminController::class, 'topProducers']);
        Route::get('/admin/popular-products', [AdminController::class, 'popularProducts']);

        // Generic order endpoint (for getting single order by any user)
        Route::get('/orders/{id}', [OrderController::class, 'show']);
    });
});
