<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get admin dashboard KPIs
     */
    public function dashboard(): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $now = now();

        $kpis = [
            'live_listings' => Product::available()->count(),
            'total_products' => Product::count(),
            'active_orders' => Order::whereIn('status', ['confirmed', 'ready', 'in_delivery'])->count(),
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'in_delivery' => Delivery::where('status', 'in_transit')->count(),
            'total_deliveries' => Delivery::count(),
            'total_users' => User::count(),
            'total_buyers' => User::where('role', 'buyer')->count(),
            'total_producers' => User::where('role', 'producer')->count(),
            'total_riders' => User::where('role', 'rider')->count(),
            'total_revenue' => Order::where('status', 'delivered')->sum('total_price'),
            'today_revenue' => Order::where('status', 'delivered')
                ->whereDate('delivered_at', $now->toDateString())
                ->sum('total_price'),
            'average_rating' => DB::table('ratings')->average('rating') ?? 0,
        ];

        return response()->json($kpis);
    }

    /**
     * Get recent activity
     */
    public function recentActivity(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $limit = $request->get('limit', 20);

        // Get recent orders
        $recentOrders = Order::with(['buyer', 'producer'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'type' => 'order',
                    'title' => "New order from {$order->buyer->name}",
                    'description' => "Order #{$order->id} for ₱{$order->total_price}",
                    'timestamp' => $order->created_at,
                    'data' => $order,
                ];
            });

        // Get recent deliveries
        $recentDeliveries = Delivery::with(['rider', 'producer'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($delivery) {
                return [
                    'type' => 'delivery',
                    'title' => "Delivery assigned to {$delivery->rider->name}",
                    'description' => "Delivery #{$delivery->id}",
                    'timestamp' => $delivery->created_at,
                    'data' => $delivery,
                ];
            });

        // Merge and sort by timestamp
        $activity = collect([$recentOrders, $recentDeliveries])->collapse()
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values();

        return response()->json($activity);
    }

    /**
     * Get users management
     */
    public function users(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = User::query();

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filter by verification status
        if ($request->filled('verified')) {
            if ($request->verified === 'true') {
                $query->whereNotNull('verified_at');
            } else {
                $query->whereNull('verified_at');
            }
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($users);
    }

    /**
     * Verify producer account
     */
    public function verifyUser($id): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $targetUser = User::findOrFail($id);

        if ($targetUser->verified_at) {
            return response()->json(['message' => 'User already verified'], 422);
        }

        $targetUser->update(['verified_at' => now()]);

        return response()->json(['message' => 'User verified', 'user' => $targetUser]);
    }

    /**
     * Get sales analytics
     */
    public function salesAnalytics(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $days = $request->get('days', 30);
        $startDate = now()->subDays($days);

        $analytics = DB::table('orders')
            ->select(
                DB::raw('DATE(delivered_at) as date'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total_price) as total_sales')
            )
            ->where('status', 'delivered')
            ->where('delivered_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(delivered_at)'))
            ->orderBy('date')
            ->get();

        return response()->json($analytics);
    }

    /**
     * Get top producers
     */
    public function topProducers(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $limit = $request->get('limit', 10);

        $producers = User::where('role', 'producer')
            ->withCount('producerOrders')
            ->with([
                'products' => function ($q) {
                    $q->select('producer_id', 'id', 'name', 'price');
                },
            ])
            ->orderBy('producer_orders_count', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($producers);
    }

    /**
     * Get popular products
     */
    public function popularProducts(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $limit = $request->get('limit', 10);

        $products = Product::select('products.*')
            ->selectRaw('COUNT(order_items.id) as order_count')
            ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
            ->groupBy('products.id')
            ->orderBy('order_count', 'desc')
            ->limit($limit)
            ->with('producer')
            ->get();

        return response()->json($products);
    }
}
