"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "🏠", label: "Home" },
  { href: null, icon: "🛒", label: "Orders" },
  { href: "#profile", icon: "👤", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isDashboard = ["/buyer", "/producer", "/rider", "/admin"].includes(pathname);

  if (!isDashboard) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D8D3BC] bg-[#F8F4E2]/95 px-4 py-3 backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href ?? pathname}
            className="flex-1 rounded-3xl bg-[#EFF1E0] px-3 py-3 text-center text-xs font-semibold text-[#4F4F4F] transition hover:bg-[#E8F5E9]"
          >
            <span className="block text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

