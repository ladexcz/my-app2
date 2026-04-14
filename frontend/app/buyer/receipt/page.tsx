"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";

type ReceiptItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  minOrder: number;
};

type ReceiptData = {
  items: ReceiptItem[];
  total: number;
  mode: "Pickup" | "Delivery";
  date: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  barangay: string;
  pinnedLocation: string;
  mapQuery: string;
};

export default function BuyerReceiptPage() {
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("agri-market-receipt");
    if (!stored) {
      router.push("/buyer");
      return;
    }

    try {
      setReceipt(JSON.parse(stored) as ReceiptData);
    } catch {
      router.push("/buyer");
    }
  }, [router]);

  if (!receipt) return null;

  const mapQuery = receipt.mapQuery || (receipt.mode === "Delivery"
    ? "delivery+route+Metro+Manila"
    : "pickup+location+Metro+Manila");

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#1B1B1B] pb-24">
      <Navbar title="Order Receipt" subtitle="Checkout complete — review your delivery details." />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#D8D3BC] bg-[#F7F3E7] p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#2E7D32]">Receipt</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#1B1B1B]">Order confirmed</h1>
              <p className="mt-2 text-sm text-[#4F4F4F]">Your order is set for {receipt.mode.toLowerCase()} and ready for route planning.</p>
            </div>
            <div className="rounded-3xl bg-[#E8F5E9] px-4 py-3 text-sm font-semibold text-[#256229]">
              {receipt.mode}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#1B1B1B]">Order summary</h2>
              <div className="mt-5 space-y-4">
                {receipt.items.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-3xl border border-[#D8D3BC] bg-[#F5F5F5] p-4">
                    {item.image ? (
                      <div className="relative h-20 w-20 overflow-hidden rounded-[1.5rem] bg-[#F1F1E5]">
                        <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <p className="font-semibold text-[#1B1B1B]">{item.name}</p>
                      <p className="mt-1 text-sm text-[#4F4F4F]">{item.quantity}kg · ₱{item.price}/kg</p>
                    </div>
                    <p className="text-sm font-semibold text-[#1B1B1B]">₱{item.quantity * item.price}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#1B1B1B]">Receipt details</h2>
              <div className="mt-5 space-y-3 text-sm text-[#4F4F4F]">
                <div className="flex items-center justify-between rounded-3xl bg-[#F5F5F5] p-4">
                  <span>Order date</span>
                  <span>{new Date(receipt.date).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-[#F5F5F5] p-4">
                  <span>Total paid</span>
                  <span className="font-semibold text-[#1B1B1B]">₱{receipt.total}</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-[#F5F5F5] p-4">
                  <span>Delivery type</span>
                  <span>{receipt.mode}</span>
                </div>
                <div className="rounded-3xl bg-[#F5F5F5] p-4">
                  <p className="font-semibold text-[#1B1B1B]">{receipt.fullName}</p>
                  <p className="text-sm text-[#4F4F4F]">{receipt.phone}</p>
                  <p className="text-sm text-[#4F4F4F]">{receipt.streetAddress}</p>
                  <p className="text-sm text-[#4F4F4F]">{receipt.barangay}</p>
                  <p className="mt-2 text-xs text-[#256229]">Pinned: {receipt.pinnedLocation}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1B1B1B]">Map navigation</h2>
                <p className="mt-2 text-sm text-[#4F4F4F]">Locate the pickup or delivery area before dispatch.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/buyer")}
                className="rounded-3xl bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#256229]"
              >
                Back to marketplace
              </button>
            </div>
            <div className="mt-6 overflow-hidden rounded-[2rem] border border-[#D8D3BC] bg-[#F6F3E7]">
              <iframe
                title="Receipt map"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="h-72 w-full border-0"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
