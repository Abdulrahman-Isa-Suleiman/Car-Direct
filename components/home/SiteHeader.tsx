"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { CurrencyToggle } from "./CurrencyProvider";
import { WHATSAPP_URL } from "@/lib/site";

const NAV = [
  { href: "/vehicles", label: "Inventory" },
  { href: "/vehicles?condition=fairly_used", label: "Fairly Used" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#powertrains", label: "EREV vs PHEV vs BEV" },
];


export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // "Inventory" stays highlighted on the listing, detail and reserve pages
  const isCurrent = (href: string) => href === "/vehicles" && pathname.startsWith("/vehicles");
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white backdrop-blur supports-[backdrop-filter]:bg-ink/80"
      style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-1.5" aria-label="Cars Direct home">
          <span className="font-display text-2xl font-semibold tracking-tight">Cars Direct</span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400 sm:inline">Abuja</span>
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-6 text-[15px] text-slate-300 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isCurrent(n.href) ? "page" : undefined}
              className={`transition-colors duration-200 hover:text-white ${isCurrent(n.href) ? "text-white underline decoration-emerald-400 decoration-2 underline-offset-[6px]" : ""}`}>{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block"><CurrencyToggle /></div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener"
            className="hidden min-h-[44px] items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700 md:inline-flex">
            <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp a specialist
          </a>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden">
            {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-white/10 px-4 pb-5 pt-2 lg:hidden">
          <ul className="grid">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} aria-current={isCurrent(n.href) ? "page" : undefined}
                  className={`block py-3 text-lg ${isCurrent(n.href) ? "text-white" : "text-slate-300"}`}>{n.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-3">
            <CurrencyToggle />
            <a href={WHATSAPP_URL} target="_blank" rel="noopener"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white">
              <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
