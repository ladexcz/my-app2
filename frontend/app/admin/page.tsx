"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import DashboardCard from "@/components/DashboardCard";
import Navbar from "@/components/Navbar";

type User = {
  name: string;
  role: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("agri-market-user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as User;
      if (parsed.role !== "admin") {
        router.push(`/${parsed.role}`);
        return;
      }
      setUser(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#1B1B1B] pb-24">
      <Navbar title="🧑‍💼 Admin Console" subtitle="Monitor marketplace activity and user performance." />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-[#2E7D32]">🧑‍💼 Administrator</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">Hello, {user.name}.</h2>
          <p className="mt-2 text-sm text-[#4F4F4F]">Review operations, inventory health, and delivery performance.</p>
        </section>

        <section className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard title="Live listings" value="64" subtitle="Market supply" icon="🍅" />
          <DashboardCard title="Customers" value="182" subtitle="Active buyers" icon="🛒" />
          <DashboardCard title="Pending orders" value="11" subtitle="Needs review" icon="📦" />
          <DashboardCard title="Deliveries" value="8" subtitle="In progress" icon="🚚" />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1B1B1B]">Operational highlights</h3>
            <ul className="mt-5 space-y-3 text-sm text-[#4F4F4F]">
              <li className="rounded-3xl bg-[#F5F5F5] p-4">Demand increasing in Metro Manila and Cavite.</li>
              <li className="rounded-3xl bg-[#F5F5F5] p-4">Bulk orders are converting at 42% rate.</li>
              <li className="rounded-3xl bg-[#F5F5F5] p-4">🚚 Delivery Partner batch routing is saving 18% in distance.</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1B1B1B]">Recent activity</h3>
            <div className="mt-5 space-y-3">
              {[
                "👨‍🌾 Seller A posted 40kg of tilapia.",
                "🛒 Customer B joined a bulk onion order.",
                "🚚 Delivery Partner C completed 2 deliveries.",
              ].map((item) => (
                <div key={item} className="rounded-3xl bg-[#F5F5F5] p-4 text-sm text-[#4F4F4F]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="profile" className="mt-6 rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B1B1B]">Profile</h3>
          <p className="mt-2 text-sm text-[#4F4F4F]">Admin account summary and quick navigation links.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#F5F5F5] p-4">
              <p className="text-sm text-[#4F4F4F]">Role</p>
              <p className="mt-1 font-semibold text-[#1B1B1B]">Administrator</p>
            </div>
            <div className="rounded-3xl bg-[#F5F5F5] p-4">
              <p className="text-sm text-[#4F4F4F]">Access</p>
              <p className="mt-1 font-semibold text-[#1B1B1B]">Marketplace overview</p>
            </div>
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}


