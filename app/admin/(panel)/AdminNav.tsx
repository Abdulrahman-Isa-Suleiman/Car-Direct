"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/vehicles", label: "Inventory", exact: true },
  { href: "/admin/vehicles/new", label: "+ Add vehicle" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-3 lg:grid lg:px-3 lg:pb-0">
      {NAV.map((n) => {
        const on = n.exact ? path === n.href : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}
            className={`flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-[15px] ${on ? "bg-white/10 text-white" : "hover:text-white"} ${n.href.endsWith("/new") ? "text-emerald-300" : ""}`}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
