"use client";

import { useMemo, useState } from "react";
import { initialBulkOrders, initialOrders, initialProducts, initialTasks } from "./sampleData";
import type { BulkOrder, CartItem, DeliveryTask, FlowTab, Order, ProducerForm, Product } from "./types";

const flowTabs: { key: FlowTab; label: string; description: string }[] = [
  {
    key: "producer",
    label: "👨‍🌾 Seller",
    description: "Upload goods, manage listings, and accept orders from customers.",
  },
  {
    key: "buyer",
    label: "🛒 Customer",
    description: "Browse live market inventory, join bulk orders, and checkout.",
  },
  {
    key: "rider",
    label: "🚚 Delivery Partner",
    description: "View route assignments, pickup goods, and complete deliveries.",
  },
];

const defaultProducerForm: ProducerForm = {
  name: "",
  category: "Fish",
  quantity: 0,
  price: 0,
  harvestDate: new Date().toISOString().slice(0, 10),
  location: "",
};

const categories = ["Fish", "Vegetables", "Fruit", "Mixed"];

function formatCurrency(value: number) {
  return `₱${value.toFixed(2)}`;
}

function calculateCurrentBulkPrice(bulk: BulkOrder) {
  const found = [...bulk.tiers].reverse().find((tier) => bulk.joinedKg >= tier.threshold);
  return found ? found.price : bulk.currentPrice;
}

function computeFreshness(harvestDate: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(harvestDate).getTime()) / 86_400_000));
  if (days === 0) return "Just caught";
  if (days === 1) return "Very fresh";
  if (days <= 3) return "Fresh";
  return "Moderate";
}

function computeShelfLife(harvestDate: string) {
  const days = Math.max(1, 7 - Math.floor((Date.now() - new Date(harvestDate).getTime()) / 86_400_000));
  return `${days} day${days === 1 ? "" : "s"}`;
}

function suggestedPrice(price: number) {
  return Math.max(price * 1.02, price + 1);
}

export default function MarketShell() {
  const [activeTab, setActiveTab] = useState<FlowTab>("producer");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>(initialBulkOrders);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [tasks, setTasks] = useState<DeliveryTask[]>(initialTasks);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filters, setFilters] = useState({ category: "All", location: "All", freshness: "All", maxPrice: 0 });
  const [producerForm, setProducerForm] = useState<ProducerForm>(defaultProducerForm);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const categoryMatch = filters.category === "All" || product.category === filters.category;
        const locationMatch = filters.location === "All" || product.location === filters.location;
        const freshnessMatch = filters.freshness === "All" || product.freshness === filters.freshness;
        const priceMatch = filters.maxPrice === 0 || product.price <= filters.maxPrice;
        return categoryMatch && locationMatch && freshnessMatch && priceMatch;
      }),
    [filters, products]
  );

  const uniqueLocations = ["All", ...new Set(products.map((product) => product.location))];

  const addProduct = () => {
    if (!producerForm.name || producerForm.quantity <= 0 || producerForm.price <= 0 || !producerForm.location) {
      return;
    }

    const product: Product = {
      id: `p-${Date.now()}`,
      name: producerForm.name,
      category: producerForm.category,
      quantity: producerForm.quantity,
      price: producerForm.price,
      harvestDate: producerForm.harvestDate,
      location: producerForm.location,
      freshness: computeFreshness(producerForm.harvestDate),
      shelfLife: computeShelfLife(producerForm.harvestDate),
      suggestedPrice: Number(suggestedPrice(producerForm.price).toFixed(2)),
      status: "live",
    };

    setProducts([product, ...products]);
    setProducerForm(defaultProducerForm);
  };

  const toggleReady = (id: string) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === id ? { ...product, status: product.status === "ready" ? "live" : "ready" } : product
      )
    );
  };

  const acceptOrder = (id: string) => {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status: "preparing" } : order))
    );
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart((current) =>
        current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(product.quantity, item.quantity + 1) }
            : item
        )
      );
      return;
    }

    setCart((current) => [
      ...current,
      {
        id: `c-${Date.now()}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
      },
    ]);
  };

  const joinBulkOrder = (id: string) => {
    setBulkOrders((current) =>
      current.map((bulk) => {
        if (bulk.id !== id || bulk.status === "filled") return bulk;
        const nextKg = bulk.joinedKg + 20;
        const totalKg = Math.min(bulk.targetKg, nextKg);
        const currentPrice = calculateCurrentBulkPrice({ ...bulk, joinedKg: totalKg });
        return {
          ...bulk,
          joinedKg: totalKg,
          currentPrice,
          buyers: [...bulk.buyers, `Buyer ${bulk.buyers.length + 2}`],
          status: totalKg >= bulk.targetKg ? "filled" : "open",
        };
      })
    );
  };

  const checkout = (pickupOrDelivery: "Pickup" | "Delivery") => {
    if (cart.length === 0) return;

    const item = cart[0];
    const newOrder: Order = {
      id: `o-${Date.now()}`,
      productId: item.productId,
      buyerName: "FreshMart",
      quantity: item.quantity,
      total: item.quantity * item.price,
      status: "accepted",
      pickupOrDelivery,
      assignedRider: "Ella",
      eta: "35 mins",
    };

    setOrders([newOrder, ...orders]);
    setCart([]);
  };

  const updateTaskStatus = (id: string, nextStatus: DeliveryTask["status"]) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status: nextStatus } : task))
    );
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#1B1B1B]">
      <header className="sticky top-0 z-20 bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Agri Marketplace</p>
            <h1 className="text-xl font-semibold">Fresh Supply App</h1>
          </div>
          <span className="rounded-full border border-white/20 bg-[#F6F3E7]/10 px-3 py-2 text-sm text-white/90">
            Mobile-first experience
          </span>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-[2rem] bg-[#F6F3E7] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#2E7D32]">Agri Marketplace</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1B1B1B] sm:text-4xl">
                Farm-to-table workflow for sellers, customers, and delivery partners
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#4F4F4F] sm:text-lg">
                Dynamic mobile-friendly marketplace flow with seller listing, customer orders, bulk matching, delivery routing, and payout tracking.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {flowTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-3xl border px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "border-sky-600 bg-[#2E7D32] text-white shadow-lg shadow-emerald-200/50"
                      : "border-[#E0E0E0] bg-[#F6F3E7] text-[#4F4F4F] hover:border-[#E0E0E0]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {activeTab === "producer" && (
          <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1B1B1B]">👨‍🌾 Seller Dashboard</h2>
                    <p className="mt-1 text-sm text-[#4F4F4F]">Upload your harvest and manage your live listings.</p>
                  </div>
                  <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-sm font-medium text-emerald-700">
                    Live inventory: {products.length}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-[#4F4F4F]">Product Name</span>
                    <input
                      value={producerForm.name}
                      onChange={(event) => setProducerForm({ ...producerForm, name: event.target.value })}
                      placeholder="Tilapia"
                      className="mt-2 w-full rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none transition focus:border-emerald-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-[#4F4F4F]">Category</span>
                    <select
                      value={producerForm.category}
                      onChange={(event) => setProducerForm({ ...producerForm, category: event.target.value })}
                      className="mt-2 w-full rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none transition focus:border-emerald-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-[#4F4F4F]">Quantity (kg/unit)</span>
                    <input
                      type="number"
                      value={producerForm.quantity}
                      min={0}
                      onChange={(event) => setProducerForm({ ...producerForm, quantity: Number(event.target.value) })}
                      className="mt-2 w-full rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none transition focus:border-emerald-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-[#4F4F4F]">Price per kg / unit</span>
                    <input
                      type="number"
                      value={producerForm.price}
                      min={0}
                      onChange={(event) => setProducerForm({ ...producerForm, price: Number(event.target.value) })}
                      className="mt-2 w-full rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none transition focus:border-emerald-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-[#4F4F4F]">Harvest Date</span>
                    <input
                      type="date"
                      value={producerForm.harvestDate}
                      onChange={(event) => setProducerForm({ ...producerForm, harvestDate: event.target.value })}
                      className="mt-2 w-full rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none transition focus:border-emerald-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-[#4F4F4F]">Location</span>
                    <input
                      value={producerForm.location}
                      onChange={(event) => setProducerForm({ ...producerForm, location: event.target.value })}
                      placeholder="Batangas"
                      className="mt-2 w-full rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none transition focus:border-emerald-500"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-[#4F4F4F]">Create a marketplace listing and the system will auto-tag freshness, shelf life, and suggested price.</p>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="inline-flex items-center justify-center rounded-3xl bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#256229]"
                  >
                    Publish Listing
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1B1B1B]">Incoming Orders</h2>
                    <p className="mt-1 text-sm text-[#4F4F4F]">Accept, reject, or prepare orders from customers.</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">Queued: {orders.length}</span>
                </div>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#1B1B1B]">{order.buyerName}</p>
                          <p className="text-sm text-[#4F4F4F]">{order.quantity}kg of {products.find((item) => item.id === order.productId)?.name || "product"}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4F4F4F]">
                          <span className="rounded-full bg-[#F5F5F5] px-3 py-1">{order.pickupOrDelivery}</span>
                          <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-emerald-700">{order.status}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => acceptOrder(order.id)}
                          className="rounded-3xl bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#256229]"
                        >
                          Mark Preparing
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleReady(order.productId)}
                          className="rounded-3xl border border-[#E0E0E0] bg-[#F6F3E7] px-4 py-2 text-sm font-medium text-[#4F4F4F] transition hover:bg-[#F5F5F5]"
                        >
                          Toggle Ready for Pickup
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-semibold text-[#1B1B1B]">Live Market Feed</h2>
                <p className="mt-1 text-sm text-[#4F4F4F]">Your listing appears to customers nearby first.</p>
                <div className="mt-5 space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-3xl border border-[#E0E0E0] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-[#1B1B1B]">{product.name}</p>
                          <p className="text-sm text-[#4F4F4F]">{product.category} · {product.location}</p>
                        </div>
                        <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-sm text-[#4F4F4F]">{product.status}</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-2 text-sm text-[#4F4F4F]">
                          <p>Qty: {product.quantity} kg</p>
                          <p>Harvest: {product.harvestDate}</p>
                          <p>Freshness: {product.freshness}</p>
                          <p>Shelf life: {product.shelfLife}</p>
                        </div>
                        <div className="rounded-3xl bg-[#F5F5F5] p-4 text-sm text-[#4F4F4F]">
                          <p className="font-semibold text-[#1B1B1B]">Price</p>
                          <p className="text-lg">{formatCurrency(product.price)}</p>
                          <p className="mt-2 text-xs text-[#4F4F4F]">Suggested: {formatCurrency(product.suggestedPrice)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "buyer" && (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-semibold text-[#1B1B1B]">Marketplace Feed</h2>
                <p className="mt-1 text-sm text-[#4F4F4F]">Filter by location, category, price, and freshness.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <select
                    value={filters.category}
                    onChange={(event) => setFilters({ ...filters, category: event.target.value })}
                    className="rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none"
                  >
                    <option>All</option>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    value={filters.location}
                    onChange={(event) => setFilters({ ...filters, location: event.target.value })}
                    className="rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none"
                  >
                    {uniqueLocations.map((location) => (
                      <option key={location}>{location}</option>
                    ))}
                  </select>
                  <select
                    value={filters.freshness}
                    onChange={(event) => setFilters({ ...filters, freshness: event.target.value })}
                    className="rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none"
                  >
                    <option>All</option>
                    <option>Just caught</option>
                    <option>Very fresh</option>
                    <option>Fresh</option>
                    <option>Moderate</option>
                  </select>
                  <label className="rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B]">
                    <span>Max price</span>
                    <input
                      type="number"
                      min={0}
                      value={filters.maxPrice}
                      onChange={(event) => setFilters({ ...filters, maxPrice: Number(event.target.value) })}
                      placeholder="0"
                      className="mt-2 w-full bg-transparent text-sm outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-semibold text-[#1B1B1B]">Buy from Sellers</h2>
                <div className="mt-5 space-y-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="rounded-3xl border border-[#E0E0E0] p-4 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[#1B1B1B]">{product.name}</p>
                        <p className="mt-1 text-sm text-[#4F4F4F]">{product.location} · {product.freshness}</p>
                        <p className="mt-2 text-sm text-[#4F4F4F]">{product.quantity} kg available · {formatCurrency(product.price)}/kg</p>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="rounded-3xl bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#256229]"
                        >
                          Add to cart
                        </button>
                        <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-sm text-[#4F4F4F]">{product.shelfLife}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-semibold text-[#1B1B1B]">Bulk Order Hub</h2>
                <p className="mt-1 text-sm text-[#4F4F4F]">Join group orders to unlock lower price tiers.</p>
                <div className="mt-5 space-y-4">
                  {bulkOrders.map((bulk) => (
                    <div key={bulk.id} className="rounded-3xl border border-[#E0E0E0] p-4">
                      <p className="font-semibold text-[#1B1B1B]">{bulk.item}</p>
                      <p className="mt-2 text-sm text-[#4F4F4F]">{bulk.joinedKg}kg joined / {bulk.targetKg}kg target</p>
                      <p className="mt-2 text-sm text-[#4F4F4F]">Current price: {formatCurrency(calculateCurrentBulkPrice(bulk))} /kg</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => joinBulkOrder(bulk.id)}
                          disabled={bulk.status === "filled"}
                          className="rounded-3xl bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#256229] disabled:cursor-not-allowed disabled:bg-[#B3B3B3]"
                        >
                          {bulk.status === "filled" ? "Filled" : "Join order"}
                        </button>
                        <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-sm text-[#4F4F4F]">{bulk.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1B1B1B]">Cart & Checkout</h2>
                    <p className="mt-1 text-sm text-[#4F4F4F]">Choose pickup or delivery for your fresh order.</p>
                  </div>
                  <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-sm text-[#4F4F4F]">Items: {cart.length}</span>
                </div>
                <div className="mt-5 space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-sm text-[#4F4F4F]">No items in cart yet.</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-[#E0E0E0] p-4">
                        <p className="font-semibold text-[#1B1B1B]">{item.name}</p>
                        <p className="mt-1 text-sm text-[#4F4F4F]">Qty: {item.quantity} · Total: {formatCurrency(item.quantity * item.price)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => checkout("Pickup")}
                    className="rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229]"
                  >
                    Checkout Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => checkout("Delivery")}
                    className="rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229]"
                  >
                    Checkout Delivery
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "rider" && (
          <section className="space-y-6">
            <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-[#1B1B1B]">🚚 Delivery Partner Jobs</h2>
              <p className="mt-1 text-sm text-[#4F4F4F]">Smart matching assigns the best batch deliveries for efficiency.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-3xl border border-[#E0E0E0] p-5">
                    <p className="text-sm text-[#4F4F4F]">{task.riderName}</p>
                    <p className="mt-2 text-lg font-semibold text-[#1B1B1B]">{task.route}</p>
                    <p className="mt-3 text-sm text-[#4F4F4F]">Stops: {task.stops}</p>
                    <p className="mt-1 text-sm text-[#4F4F4F]">Load: {task.loadKg}kg</p>
                    <p className="mt-1 text-sm text-[#4F4F4F]">Earnings: {formatCurrency(task.earnings)}</p>
                    <span className="mt-3 inline-flex rounded-full bg-[#F5F5F5] px-3 py-1 text-sm text-[#4F4F4F]">{task.status}</span>
                    <div className="mt-4 flex flex-col gap-2">
                      {task.status === "assigned" && (
                        <button
                          type="button"
                          onClick={() => updateTaskStatus(task.id, "pickup")}
                          className="rounded-3xl bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#256229]"
                        >
                          Start Pickup
                        </button>
                      )}
                      {task.status === "pickup" && (
                        <button
                          type="button"
                          onClick={() => updateTaskStatus(task.id, "delivering")}
                          className="rounded-3xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                          Confirm Pickup
                        </button>
                      )}
                      {task.status === "delivering" && (
                        <button
                          type="button"
                          onClick={() => updateTaskStatus(task.id, "completed")}
                          className="rounded-3xl bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#256229]"
                        >
                          Complete Delivery
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-[#F6F3E7] p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1B1B1B]">Delivery Performance</h2>
                  <p className="mt-1 text-sm text-[#4F4F4F]">Batch deliveries reduce distance and increase delivery partner earnings.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-[#F5F5F5] p-4 text-center">
                    <p className="text-3xl font-semibold text-[#1B1B1B]">{tasks.length}</p>
                    <p className="mt-1 text-sm text-[#4F4F4F]">Active jobs</p>
                  </div>
                  <div className="rounded-3xl bg-[#F5F5F5] p-4 text-center">
                    <p className="text-3xl font-semibold text-[#1B1B1B]">{tasks.filter((task) => task.status === "completed").length}</p>
                    <p className="mt-1 text-sm text-[#4F4F4F]">Completed</p>
                  </div>
                  <div className="rounded-3xl bg-[#F5F5F5] p-4 text-center">
                    <p className="text-3xl font-semibold text-[#1B1B1B]">{tasks.reduce((sum, task) => sum + task.earnings, 0)}</p>
                    <p className="mt-1 text-sm text-[#4F4F4F]">Projected earnings</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      <footer className="bg-emerald-700 text-emerald-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm leading-6">
            Marketplace workflow for sellers, customers, and delivery partners — optimized for app-style mobile use.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-100">
            <span>Fresh listings</span>
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>Smart matching</span>
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>Batch delivery</span>
          </div>
        </div>
      </footer>
    </main>
  );
}


