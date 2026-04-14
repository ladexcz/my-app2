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

type DeliveryTask = {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  mode: "Pickup" | "Delivery";
  items: { id: string; name: string; quantity: number; price: number }[];
  total: number;
  status: "Assigned" | "En route" | "Delivered" | "Ready for pickup";
  eta: string;
  fee: string;
  assignedRider: string;
  date: string;
};

const defaultRouteTasks: DeliveryTask[] = [
  {
    id: "task-1",
    orderId: "order-1",
    customerName: "Mina Cruz",
    customerPhone: "09171234567",
    address: "123 Beach Road, Cavite",
    mode: "Delivery",
    items: [{ id: "tilapia", name: "Tilapia Fresh Catch", quantity: 30, price: 98 }],
    total: 2940,
    status: "Assigned",
    eta: "45 min",
    fee: "₱320",
    assignedRider: "Ella",
    date: new Date().toISOString(),
  },
  {
    id: "task-2",
    orderId: "order-2",
    customerName: "Jomar Santos",
    customerPhone: "09172345678",
    address: "456 Market Street, Laguna",
    mode: "Delivery",
    items: [{ id: "onion", name: "Organic Red Onion", quantity: 20, price: 55 }],
    total: 1100,
    status: "Assigned",
    eta: "30 min",
    fee: "₱240",
    assignedRider: "Ella",
    date: new Date().toISOString(),
  },
];

const loadDeliveryTasks = (): DeliveryTask[] => {
  if (typeof window === "undefined") return defaultRouteTasks;
  const stored = localStorage.getItem("agri-market-delivery-tasks");
  if (!stored) return defaultRouteTasks;
  try {
    const parsed = JSON.parse(stored) as DeliveryTask[];
    return parsed.length ? parsed : defaultRouteTasks;
  } catch {
    return defaultRouteTasks;
  }
};

const saveDeliveryTasks = (tasks: DeliveryTask[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("agri-market-delivery-tasks", JSON.stringify(tasks));
};

const nextStatusLabel = (status: DeliveryTask["status"]) => {
  if (status === "Assigned") return "Start delivery";
  if (status === "En route") return "Mark delivered";
  return "Completed";
};

export default function RiderPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [routeTasks, setRouteTasks] = useState<DeliveryTask[]>([]);
  const activeTasks = routeTasks.filter((task) => task.status !== "Delivered").length;
  const totalEarnings = routeTasks
    .filter((task) => task.status !== "Delivered")
    .reduce((sum, task) => sum + Number(task.fee.replace(/[^0-9]/g, "")), 0);

  useEffect(() => {
    const stored = localStorage.getItem("agri-market-user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as User;
      if (parsed.role !== "rider") {
        router.push(`/${parsed.role}`);
        return;
      }
      setUser(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    setRouteTasks(loadDeliveryTasks());
  }, []);

  const updateTaskStatus = (taskId: string) => {
    setRouteTasks((current) => {
      const updated = current.map((task) => {
        if (task.id !== taskId) return task;

        const nextStatus: DeliveryTask["status"] =
          task.status === "Assigned"
            ? "En route"
            : task.status === "En route"
            ? "Delivered"
            : task.status;

        return { ...task, status: nextStatus };
      });

      saveDeliveryTasks(updated);
      return updated;
    });
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#1B1B1B] pb-24">
      <Navbar title="🚚 Delivery Partner Hub" subtitle="Manage pickups, batch routes, and delivery confirmations." />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-[#2E7D32]">🚚 Delivery Partner</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">Good day, {user.name}.</h2>
          <p className="mt-2 text-sm text-[#4F4F4F]">Here are your current batch deliveries and route priorities.</p>
        </section>

        <section className="mb-5 grid gap-4 sm:grid-cols-3">
          <DashboardCard title="Task queue" value={`${routeTasks.length}`} subtitle="Current deliveries" icon="📦" />
          <DashboardCard title="Active" value={`${activeTasks}`} subtitle="Ongoing routes" icon="🚚" />
          <DashboardCard title="Payout" value={`₱${totalEarnings}`} subtitle="Estimated today" icon="💵" />
        </section>

        <section className="grid gap-5">
          {routeTasks.length === 0 ? (
            <div className="rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
              <p className="text-sm text-[#4F4F4F]">No delivery tasks found yet. Customer orders will appear here once placed.</p>
            </div>
          ) : (
            routeTasks.map((task) => (
              <div key={task.id} className="rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1B1B1B]">{task.customerName}</h3>
                    <p className="mt-2 text-sm text-[#4F4F4F]">{task.address}</p>
                  </div>
                  <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-sm font-semibold text-emerald-700">
                    {task.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 text-sm text-[#4F4F4F]">
                    <p className="font-semibold text-[#1B1B1B]">Mode</p>
                    <p>{task.mode}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 text-sm text-[#4F4F4F]">
                    <p className="font-semibold text-[#1B1B1B]">Rider</p>
                    <p>{task.assignedRider}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#4F4F4F]">
                  <p>ETA: {task.eta}</p>
                  <p>Fee: {task.fee}</p>
                  <p>Total: ₱{task.total}</p>
                </div>
                <button
                  className="mt-5 w-full rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229] disabled:cursor-not-allowed disabled:bg-slate-400"
                  onClick={() => updateTaskStatus(task.id)}
                  disabled={task.status === "Delivered"}
                >
                  {nextStatusLabel(task.status)}
                </button>
              </div>
            ))
          )}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1B1B1B]">Route efficiency</h3>
            <p className="mt-2 text-sm text-[#4F4F4F]">Batch deliveries save time and reduce idle distance.</p>
            <ul className="mt-4 space-y-3 text-sm text-[#4F4F4F]">
              <li className="rounded-3xl bg-[#F5F5F5] p-4">Assign closest route first</li>
              <li className="rounded-3xl bg-[#F5F5F5] p-4">Confirm QR pickup at producer location</li>
              <li className="rounded-3xl bg-[#F5F5F5] p-4">Combine stops when load fits</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1B1B1B]">Earnings summary</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-[#F5F5F5] p-4 text-center">
                <p className="text-2xl font-semibold text-[#1B1B1B]">{routeTasks.filter((task) => task.status !== "Delivered").length}</p>
                <p className="mt-1 text-sm text-[#4F4F4F]">Active batches</p>
              </div>
              <div className="rounded-3xl bg-[#F5F5F5] p-4 text-center">
                <p className="text-2xl font-semibold text-[#1B1B1B]">₱{routeTasks.reduce((sum, task) => sum + (task.status !== "Delivered" ? Number(task.fee.replace(/[^0-9]/g, "")) : 0), 0)}</p>
                <p className="mt-1 text-sm text-[#4F4F4F]">Estimated payout</p>
              </div>
            </div>
          </div>
        </section>

        <section id="profile" className="mt-6 rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B1B1B]">Profile</h3>
          <p className="mt-2 text-sm text-[#4F4F4F]">Your delivery partner summary and account snapshot.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#F5F5F5] p-4">
              <p className="text-sm text-[#4F4F4F]">Name</p>
              <p className="mt-1 font-semibold text-[#1B1B1B]">{user.name}</p>
            </div>
            <div className="rounded-3xl bg-[#F5F5F5] p-4">
              <p className="text-sm text-[#4F4F4F]">Role</p>
              <p className="mt-1 font-semibold text-[#1B1B1B]">Delivery Partner</p>
            </div>
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}


