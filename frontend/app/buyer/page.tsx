"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import DashboardCard from "@/components/DashboardCard";
import { BUTTON, CARD, INPUT, TEXT, BADGE, IMAGE as IMG, LAYOUT, ALERT } from "@/lib/tailwind";

type User = {
  name: string;
  role: string;
};

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  minOrder: number;
};

type MarketItem = {
  id: string;
  title: string;
  subtitle: string;
  metadata: string;
  price: string;
  badge: string;
  image: string;
  unitPrice: number;
  minOrder: number;
};

const marketItems: MarketItem[] = [
  {
    id: "tilapia",
    title: "Tilapia Fresh Catch",
    subtitle: "Cavite · 80kg available",
    metadata: "₱98 /kg · Just caught",
    price: "₱98/kg",
    badge: "Fresh",
    image: "https://images.unsplash.com/photo-1509927081543-187c7492c580?auto=format&fit=crop&w=800&q=80",
    unitPrice: 98,
    minOrder: 30,
  },
  {
    id: "onion",
    title: "Organic Red Onion",
    subtitle: "Laguna · 220kg available",
    metadata: "₱55 /kg · 2 days shelf life",
    price: "₱55/kg",
    badge: "HotDeal",
    image: "https://images.unsplash.com/photo-1561043433-aaf687c4cf4d?auto=format&fit=crop&w=800&q=80",
    unitPrice: 55,
    minOrder: 30,
  },
  {
    id: "banana",
    title: "Banana Bunch",
    subtitle: "Davao · 120kg available",
    metadata: "₱32 /kg · Ready for pickup",
    price: "₱32/kg",
    badge: "Local",
    image: "https://images.unsplash.com/photo-1524594154900-1d1c4e56a9b4?auto=format&fit=crop&w=800&q=80",
    unitPrice: 32,
    minOrder: 30,
  },
];

export default function BuyerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartMessage, setCartMessage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<"Pickup" | "Delivery" | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [barangay, setBarangay] = useState("");
  const [formError, setFormError] = useState("");
  const [mapSearch, setMapSearch] = useState("Metro Manila, Philippines");
  const [mapQuery, setMapQuery] = useState("Metro Manila, Philippines");
  const [pinnedLocation, setPinnedLocation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("agri-market-user");
    if (!stored) {
      router.push("/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as User;
      if (parsed.role !== "buyer") {
        router.push(`/${parsed.role}`);
        return;
      }
      setUser(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!cartMessage) return;
    const timeout = window.setTimeout(() => setCartMessage(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [cartMessage]);

  const addToCart = (item: MarketItem) => {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [
        ...current,
        {
          id: item.id,
          name: item.title,
          quantity: item.minOrder,
          price: item.unitPrice,
          image: item.image,
          minOrder: item.minOrder,
        },
      ];
    });

    setCartMessage(`${item.title} added to cart`);
  };

  const updateQuantity = (id: string, quantity: number, minOrder: number) => {
    if (quantity < minOrder) {
      setCartMessage(`Minimum order is ${minOrder}kg`);
      quantity = minOrder;
    }

    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const handlePinLocation = () => {
    const location = mapSearch.trim();
    if (!location) {
      setFormError("Enter a searchable location first.");
      return;
    }
    setPinnedLocation(location);
    setMapQuery(location);
    setFormError("");
    setCartMessage("Delivery location pinned.");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Geolocation is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const query = `${coords.latitude},${coords.longitude}`;
        setMapSearch(query);
        setMapQuery(query);
        setPinnedLocation("Current location");
        setFormError("");
        setCartMessage("Current location pinned.");
      },
      () => {
        setFormError("Unable to get your current location.");
      }
    );
  };

  const filteredItems = marketItems.filter((item) =>
    `${item.title} ${item.subtitle}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const saveDeliveryTask = (task: unknown) => {
    const existingTasks = localStorage.getItem("agri-market-delivery-tasks");
    const tasks = existingTasks ? JSON.parse(existingTasks) as any[] : [];
    tasks.unshift(task);
    localStorage.setItem("agri-market-delivery-tasks", JSON.stringify(tasks));
  };

  const checkout = (pickupOrDelivery: "Pickup" | "Delivery") => {
    if (cart.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    if (!fullName || !phone || !streetAddress || !barangay) {
      setFormError("Please fill in your full address details.");
      return;
    }

    if (pickupOrDelivery === "Delivery" && !pinnedLocation) {
      setFormError("Please pin a delivery location on the map for delivery orders.");
      return;
    }

    const receipt = {
      id: `order-${Date.now()}`,
      items: cart,
      total: totalPrice,
      mode: pickupOrDelivery,
      date: new Date().toISOString(),
      fullName,
      phone,
      streetAddress,
      barangay,
      pinnedLocation: pickupOrDelivery === "Delivery" ? pinnedLocation : "Pickup order",
      mapQuery: pickupOrDelivery === "Delivery" ? mapQuery : "Pickup",
    };

    if (pickupOrDelivery === "Delivery") {
      const deliveryTask = {
        id: `task-${Date.now()}`,
        orderId: receipt.id,
        customerName: receipt.fullName,
        customerPhone: receipt.phone,
        address: `${receipt.streetAddress}, ${receipt.barangay}`,
        mode: receipt.mode,
        items: receipt.items,
        total: receipt.total,
        status: "Assigned",
        eta: "45 mins",
        fee: "₱180",
        assignedRider: "Ella",
        date: receipt.date,
      };
      saveDeliveryTask(deliveryTask);
    }

    localStorage.setItem("agri-market-receipt", JSON.stringify(receipt));
    setFormError("");
    setCheckoutMode(pickupOrDelivery);
    setCheckoutLoading(true);

    window.setTimeout(() => {
      setCart([]);
      router.push("/buyer/receipt");
    }, 900);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#1B1B1B] pb-24">
      <Navbar title="🛒 Customer Dashboard" subtitle="Discover fresh produce and join bulk orders." />
      <div
        aria-live="polite"
        className={`${ALERT.success} ${
          cartMessage ? "opacity-100 blur-0" : "opacity-0 blur-sm"
        }`}
      >
        {cartMessage || ""}
      </div>
      {checkoutLoading && checkoutMode ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0F341050] px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#D8D3BC] bg-white p-8 text-center shadow-2xl shadow-emerald-200/40">
            <p className="text-sm uppercase tracking-[0.35em] text-[#2E7D32]">Processing order</p>
            <h2 className="mt-4 text-2xl font-semibold text-[#1B1B1B]">Preparing your receipt</h2>
            <p className="mt-3 text-sm text-[#4F4F4F]">Redirecting to {checkoutMode.toLowerCase()} receipt...</p>
            <div className="mt-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
              ✓
            </div>
          </div>
        </div>
      ) : null}
      <div className={LAYOUT.container}>
        <section className="mb-5 grid gap-4 sm:grid-cols-3">
          <DashboardCard
            title="Orders"
            value={`${cart.length}`}
            subtitle="Items in cart"
            icon="🛒"
          />
          <DashboardCard
            title="Savings"
            value="₱120"
            subtitle="Smart bulk pricing"
            icon="💰"
          />
          <DashboardCard
            title="Delivery"
            value={pinnedLocation ? "Ready" : "Set location"}
            subtitle="Delivery mode"
            icon="📍"
          />
        </section>

        <section className={`mb-6 ${CARD.base}`}>
          <div className="flex flex-col gap-4">
            <div>
              <p className={TEXT.badge}>Search market</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">Search gulay, isda...</h2>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search gulay, isda..."
                className={INPUT.base}
              />
              <button type="button" className={BUTTON.secondary} onClick={() => setSearchTerm("")}>
                Clear
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          <div className={LAYOUT.grid3Col}>
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                metadata={item.metadata}
                price={item.price}
                badge={item.badge}
                image={item.image}
                actionLabel={`Add ${item.minOrder}kg`}
                onAction={() => addToCart(item)}
              />
            ))}
          </div>

          <div className={CARD.base}>
            <h3 className={TEXT.heading}>Bulk order opportunities</h3>
            <p className={`mt-2 ${TEXT.muted}`}>Join group orders to unlock lower prices and faster deliveries.</p>
            <div className="mt-5 space-y-3">
              {[
                { name: "Red Onion", joined: 46, target: 100, price: "₱60/kg" },
                { name: "Eggplant", joined: 24, target: 80, price: "₱65/kg" },
              ].map((item) => (
                <div key={item.name} className="flex flex-col gap-3 rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#1B1B1B]">{item.name}</p>
                    <p className="mt-1 text-sm text-[#4F4F4F]">{item.joined}kg joined of {item.target}kg</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={BADGE.primary}>{item.price}</span>
                    <button className={BUTTON.primary}>
                      Join order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <section className={CARD.base}>
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className={CARD.white}>
                <h3 className={TEXT.heading}>Delivery details</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={`${TEXT.hint} font-medium`}>Full name</span>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Juan dela Cruz"
                      className={`mt-2 ${INPUT.light}`}
                    />
                  </label>
                  <label className="block">
                    <span className={`${TEXT.hint} font-medium`}>Phone</span>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="0917 123 4567"
                      className={`mt-2 ${INPUT.light}`}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={`${TEXT.hint} font-medium`}>Street address</span>
                    <input
                      value={streetAddress}
                      onChange={(event) => setStreetAddress(event.target.value)}
                      placeholder="123 Farmers Lane"
                      className={`mt-2 ${INPUT.light}`}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={`${TEXT.hint} font-medium`}>Barangay</span>
                    <input
                      value={barangay}
                      onChange={(event) => setBarangay(event.target.value)}
                      placeholder="Barangay San Isidro"
                      className={`mt-2 ${INPUT.light}`}
                    />
                  </label>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[1.6fr_auto]">
                    <input
                      value={mapSearch}
                      onChange={(event) => setMapSearch(event.target.value)}
                      placeholder="Search delivery location"
                      className={INPUT.light}
                    />
                    <button
                      type="button"
                      onClick={handlePinLocation}
                      className={BUTTON.primary}
                    >
                      Pin location
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className={BUTTON.secondary}
                  >
                    Use current location
                  </button>
                  {pinnedLocation ? (
                    <p className={ALERT.info}>
                      Pinned location: {pinnedLocation}
                    </p>
                  ) : null}
                  {formError ? (
                    <p className={ALERT.error}>{formError}</p>
                  ) : null}
                </div>
              </div>

              <div className={CARD.white}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={TEXT.heading}>Route preview</h3>
                    <p className={`mt-2 ${TEXT.muted}`}>Searchable map to pin the delivery address and verify your route.</p>
                  </div>
                  <span className={BADGE.primary}>Live map</span>
                </div>
                <div className="mt-5 overflow-hidden rounded-[2rem] border border-[#D8D3BC] bg-[#F6F3E7]">
                  <iframe
                    title="Delivery route map"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                    className="h-72 w-full border-0"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className={CARD.base}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className={TEXT.heading}>Cart & Checkout</h3>
                <p className={`mt-1 ${TEXT.muted}`}>Review your items and choose pickup or delivery.</p>
              </div>
              <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-sm text-[#4F4F4F]">Items: {totalItems}</span>
            </div>
            <div className="mt-5 space-y-4">
              {cart.length === 0 ? (
                <p className={TEXT.muted}>No items in cart yet.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        {item.image ? (
                        <div className={IMG.cartItem}>
                          <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : null}
                        <div>
                          <p className="font-semibold text-[#1B1B1B]">{item.name}</p>
                          <p className={TEXT.muted}>₱{item.price}/kg · Total: ₱{item.quantity * item.price}</p>
                          <p className={TEXT.small}>Minimum wholesale order: {item.minOrder}kg</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.minOrder)}
                          className={BUTTON.small}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={item.minOrder}
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.id, Number(event.target.value), item.minOrder)}
                          className="w-24 rounded-3xl border border-[#D8D3BC] bg-white px-3 py-2 text-center text-sm text-[#1B1B1B] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.minOrder)}
                          className={BUTTON.small}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className={BUTTON.remove}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold text-[#1B1B1B]">
                  <span>Total: ₱{totalPrice}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => checkout("Pickup")}
                    className={BUTTON.primary}
                  >
                    Checkout Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => checkout("Delivery")}
                    className={BUTTON.secondary}
                  >
                    Checkout Delivery
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="profile" className={`mt-6 ${CARD.base}`}>
          <h3 className={TEXT.heading}>Profile</h3>
          <p className="mt-2 text-sm text-[#4F4F4F]">Account details and dashboard summary for {user.name}.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#F5F5F5] p-4">
              <p className="text-sm text-[#4F4F4F]">Name</p>
              <p className="mt-1 font-semibold text-[#1B1B1B]">{user.name}</p>
            </div>
            <div className="rounded-3xl bg-[#F5F5F5] p-4">
              <p className="text-sm text-[#4F4F4F]">Role</p>
              <p className="mt-1 font-semibold text-[#1B1B1B]">Customer</p>
            </div>
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}


