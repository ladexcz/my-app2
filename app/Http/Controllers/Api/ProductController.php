<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    /**
     * Get marketplace products (for buyers)
     */
    public function marketplace(Request $request): JsonResponse
    {
        $query = Product::available()->with(['producer']);

        // Filter by category
        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        // Filter by price range
        if ($request->filled('min_price') && $request->filled('max_price')) {
            $query->withinPriceRange($request->min_price, $request->max_price);
        }

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $order = $request->get('order', 'desc');
        $query->orderBy($sortBy, $order);

        $products = $query->paginate($request->get('per_page', 20));

        return response()->json($products);
    }

    /**
     * Get single product
     */
    public function show($id): JsonResponse
    {
        $product = Product::with(['producer'])->findOrFail($id);

        return response()->json($product);
    }

    /**
     * Get producer's products
     */
    public function producerProducts(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->isProducer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $products = $user->products()
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($products);
    }

    /**
     * Create product (producer only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->isProducer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0.01',
            'quantity_available' => 'required|integer|min:1',
            'min_order_quantity' => 'integer|min:1',
            'unit' => 'string|max:50',
            'description' => 'nullable|string',
            'freshness_expiry_time' => 'nullable|date_format:Y-m-d H:i:s',
        ]);

        $product = $user->products()->create([
            ...$validated,
            'producer_id' => $user->id,
        ]);

        return response()->json($product, 201);
    }

    /**
     * Update product (producer only)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        if ($product->producer_id !== $user->id || !$user->isProducer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'string|max:255',
            'category' => 'string|max:100',
            'price' => 'numeric|min:0.01',
            'quantity_available' => 'integer|min:0',
            'min_order_quantity' => 'integer|min:1',
            'unit' => 'string|max:50',
            'description' => 'nullable|string',
            'freshness_expiry_time' => 'nullable|date_format:Y-m-d H:i:s',
            'is_available' => 'boolean',
        ]);

        $product->update($validated);

        return response()->json($product);
    }

    /**
     * Delete product (producer only)
     */
    public function destroy($id): JsonResponse
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        if ($product->producer_id !== $user->id || !$user->isProducer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }
}
