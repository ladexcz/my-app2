"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavbarProps = {
  title: string;
  subtitle: string;
};

type User = {
  name: string;
  role: string;
} | null;

export default function Navbar({ title, subtitle }: NavbarProps) {
  const [user, setUser] = useState<User>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("agri-market-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("agri-market-user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("agri-market-user");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#D8D3BC] bg-[#F8F4E2] px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#2E7D32]">Agri Marketplace</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">{title}</h1>
          <p className="mt-1 text-sm text-[#4F4F4F]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <div className="rounded-full border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-2 text-sm text-[#4F4F4F]">
              {user.name} · {user.role}
            </div>
          ) : null}
          <Link
            href="/"
            className="rounded-full bg-[#EFF1E0] px-4 py-2 text-sm font-medium text-[#4F4F4F] transition duration-300 hover:bg-[#E8F5E9]"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#256229]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

