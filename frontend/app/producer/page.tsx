"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import DashboardCard from "@/components/DashboardCard";
import { BUTTON, CARD, INPUT, TEXT, BADGE, LAYOUT } from "@/lib/tailwind";

type User = {
  name: string;
  role: string;
};

type Product = {
  title: string;
  owner?: string;
  subtitle: string;
  metadata: string;
  price: string;
  badge?: string;
  image?: string;
};

const defaultInventory: Product[] = [
  {
    title: "Tilapia",
    owner: "Aqua Harvest Farm",
    subtitle: "120kg available · Fresh catch",
    metadata: "Harvested today · Cavite",
    price: "₱95/kg",
    badge: "Live",
    image: "https://images.unsplash.com/photo-1518976024611-4888b5efc9be?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Red Onion",
    owner: "Green Fields Co.",
    subtitle: "240kg available · Organic",
    metadata: "Harvested 2 days ago · Laguna",
    price: "₱52/kg",
    badge: "Featured",
    image: "https://images.unsplash.com/photo-1514125851977-1e250c9107a0?auto=format&fit=crop&w=800&q=80",
  },
];

const initialForm = {
  title: "",
  subtitle: "",
  metadata: "",
  price: "",
  badge: "",
  image: null as string | null,
};

export default function ProducerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<Product[]>(defaultInventory);
  const [newProduct, setNewProduct] = useState<typeof initialForm>(initialForm);

  useEffect(() => {
    const stored = localStorage.getItem("agri-market-user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as User;
      if (parsed.role !== "producer") {
        router.push(`/${parsed.role}`);
        return;
      }
      setUser(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleInputChange = (key: keyof typeof initialForm, value: string) => {
    setNewProduct((current) => ({ ...current, [key]: value }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setNewProduct((current) => ({ ...current, image: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateListing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newProduct.title || !newProduct.price) return;

    const created: Product = {
      title: newProduct.title,
      owner: user?.name || "👨‍🌾 Seller",
      subtitle: newProduct.subtitle || "Seller upload · Fresh stock",
      metadata: newProduct.metadata || "Local farm harvest",
      price: newProduct.price,
      badge: newProduct.badge || "New",
      image: newProduct.image ?? undefined,
    };

    setInventory((current) => [created, ...current]);
    setNewProduct(initialForm);
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#1B1B1B] pb-24">
      <Navbar title="👨‍🌾 Seller Studio" subtitle="Publish listings and manage incoming orders." />
      <div className={LAYOUT.container}>
        <section className="mb-5 grid gap-4 sm:grid-cols-3">
          <DashboardCard
            title="Listings"
            value={`${inventory.length}`}
            subtitle="Active products"
            icon="📦"
          />
          <DashboardCard
            title="Orders"
            value="12"
            subtitle="New requests"
            icon="🧾"
          />
          <DashboardCard
            title="Earnings"
            value="₱18.4k"
            subtitle="Weekly estimate"
            icon="💵"
          />
        </section>

        <section className={`mb-6 ${CARD.base}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={TEXT.badge}>👨‍🌾 Seller</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">Hello, {user.name}.</h2>
              <p className="mt-2 text-sm text-[#4F4F4F]">Upload fresh produce and manage incoming orders.</p>
            </div>
            <button className={BUTTON.primary} type="button">
              + Upload Product
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          {inventory.map((item) => (
            <ProductCard
              key={`${item.title}-${item.price}-${item.metadata}`}
              title={item.title}
              owner={item.owner}
              subtitle={item.subtitle}
              metadata={item.metadata}
              price={item.price}
              badge={item.badge}
              image={item.image}
              actionLabel="View orders"
              onAction={() => alert(`View orders for ${item.title}`)}
            />
          ))}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className={CARD.base}>
            <h3 className={TEXT.heading}>Add a new listing</h3>
            <p className={`mt-2 ${TEXT.muted}`}>Upload a product image and publish a fresh listing instantly.</p>
            <form onSubmit={handleCreateListing} className="mt-5 space-y-4">
              <div>
                <label className={`mb-2 block ${TEXT.label}`}>Product name</label>
                <input
                  value={newProduct.title}
                  onChange={(event) => handleInputChange("title", event.target.value)}
                  className={INPUT.base}
                  placeholder="Tilapia, Vegetables, Rice"
                />
              </div>
              <div>
                <label className={`mb-2 block ${TEXT.label}`}>Details</label>
                <input
                  value={newProduct.subtitle}
                  onChange={(event) => handleInputChange("subtitle", event.target.value)}
                  className={INPUT.base}
                  placeholder="120kg available · Fresh catch"
                />
              </div>
              <div>
                <label className={`mb-2 block ${TEXT.label}`}>Location / metadata</label>
                <input
                  value={newProduct.metadata}
                  onChange={(event) => handleInputChange("metadata", event.target.value)}
                  className={INPUT.base}
                  placeholder="Harvested today · Cavite"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`mb-2 block ${TEXT.label}`}>Price</label>
                  <input
                    value={newProduct.price}
                    onChange={(event) => handleInputChange("price", event.target.value)}
                    className={INPUT.base}
                    placeholder="₱95/kg"
                  />
                </div>
                <div>
                  <label className={`mb-2 block ${TEXT.label}`}>Badge</label>
                  <input
                    value={newProduct.badge}
                    onChange={(event) => handleInputChange("badge", event.target.value)}
                    className={INPUT.base}
                    placeholder="Live, Featured, New"
                  />
                </div>
              </div>
              <div>
                <label className={`mb-2 block ${TEXT.label}`}>Upload image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full rounded-3xl border border-[#D8D3BC] bg-white px-4 py-3 text-sm text-[#1B1B1B] outline-none"
                />
              </div>
              {newProduct.image ? (
                <div className="rounded-[1.75rem] border border-[#D8D3BC] bg-white p-3">
                  <img src={newProduct.image} alt="Upload preview" className="h-40 w-full rounded-[1.5rem] object-cover" />
                </div>
              ) : null}
              <button
                type="submit"
                className={`w-full ${BUTTON.primary}`}
              >
                Publish listing
              </button>
            </form>
          </div>

          <div className={CARD.base}>
            <h3 className={TEXT.heading}>Incoming orders</h3>
            <p className={`mt-2 ${TEXT.muted}`}>Accept or reject orders and mark goods ready for pickup.</p>
            <div className="mt-5 space-y-4">
              {[
                { buyer: "Maia Store", product: "Tilapia", qty: 18, status: "Pending" },
                { buyer: "FreshMart", product: "Red Onion", qty: 30, status: "Confirmed" },
              ].map((order) => (
                <div key={order.buyer} className="rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#1B1B1B]">{order.buyer}</p>
                      <p className="mt-1 text-sm text-[#4F4F4F]">{order.qty}kg of {order.product}</p>
                    </div>
                    <span className={BADGE.primary}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="profile" className={`mt-6 ${CARD.base}`}>
          <h3 className={TEXT.heading}>Profile</h3>
          <p className="mt-2 text-sm text-[#4F4F4F]">Manage your seller account and quick access links.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#F5F5F5] p-4">
              <p className="text-sm text-[#4F4F4F]">Name</p>
              <p className="mt-1 font-semibold text-[#1B1B1B]">{user.name}</p>
            </div>
            <div className="rounded-3xl bg-[#F5F5F5] p-4">
              <p className="text-sm text-[#4F4F4F]">Role</p>
              <p className="mt-1 font-semibold text-[#1B1B1B]">Seller</p>
            </div>
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}


