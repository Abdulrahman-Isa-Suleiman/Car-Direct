"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { CardVehicle } from "@/lib/home-data";
import { VehicleCard } from "./VehicleCard";

const TABS = [
  { v: "available", label: "On ground now", hint: "Drive away in 2–5 days" },
  { v: "in_transit", label: "Arriving soon", hint: "On the water from China" },
  { v: "factory_order", label: "Factory order", hint: "Built to your spec, 7–12 weeks" },
] as const;

export function FeaturedVehicles({ vehicles, ngnPerUsd, isSample }: { vehicles: CardVehicle[]; ngnPerUsd: number; isSample: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["v"]>("available");
  const shown = vehicles.filter((v) => v.status === tab).slice(0, 3);
  const active = TABS.find((t) => t.v === tab)!;

  return (
    <section aria-labelledby="featured-h" className="bg-mist py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="featured-h" className="font-display text-3xl font-semibold sm:text-4xl">This week&apos;s stock</h2>
            <p className="mt-2 text-slate-600">{active.hint}.{isSample && " Sample listings shown until inventory is connected."}</p>
          </div>
          <div role="tablist" aria-label="Availability" className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t.v} role="tab" id={`tab-${t.v}`} aria-selected={tab === t.v} aria-controls="featured-panel"
                onClick={() => setTab(t.v)}
                className={`min-h-[44px] cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${tab === t.v ? "border-ink bg-ink text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}>
                {t.label} <span className="tabular opacity-60">{vehicles.filter((v) => v.status === t.v).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div id="featured-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((v) => <VehicleCard key={v.id} v={v} ngnPerUsd={ngnPerUsd} />)}
          {shown.length === 0 && <p className="text-slate-600">Nothing in this group right now. Ask us on WhatsApp what&apos;s coming next.</p>}
        </div>
        <Link href={`/vehicles?status=${tab}`}
          className="mt-10 inline-flex min-h-[44px] items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-600">
          See all {active.label.toLowerCase()} <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
