"use client";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { displayPrice } from "@/lib/pricing";
import type { CardVehicle } from "@/lib/home-data";
import { useCurrency } from "./CurrencyProvider";

const STATUS = {
  available: { label: "On ground in Abuja", cls: "bg-emerald-50 text-emerald-700" },
  in_transit: { label: "In transit", cls: "bg-sky-50 text-sky-800" },
  factory_order: { label: "Factory order", cls: "bg-amber-50 text-amber-800" },
  reserved: { label: "Reserved", cls: "bg-slate-100 text-slate-600" },
  sold: { label: "Sold", cls: "bg-slate-100 text-slate-600" },
} as const;

const eta = (d: string) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" });

export function VehicleCard({ v, ngnPerUsd }: { v: CardVehicle; ngnPerUsd: number }) {
  const { currency } = useCurrency();
  const s = STATUS[v.status];
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-900/5">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-800 to-ink">
        {v.imageUrl ? (
          <Image src={v.imageUrl} alt={v.title} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span aria-hidden className="absolute inset-0 flex items-end p-4 font-display text-5xl font-semibold text-white/10">{v.powertrain}</span>
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
          {s.label}{v.status === "in_transit" && v.etaDate ? ` · ETA ${eta(v.etaDate)}` : ""}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className={`rounded-full px-2.5 py-1 ${v.condition === "brand_new" ? "bg-ink text-white" : "border border-slate-300 text-slate-700"}`}>
            {v.condition === "brand_new" ? "Brand New" : `Fairly Used · ${v.modelYear}`}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 tracking-wide text-emerald-700">{v.powertrain}</span>
          {v.inspectionVerified && (
            <span className="inline-flex items-center gap-1 text-gold"><BadgeCheck aria-hidden className="h-4 w-4" /> 150-point verified</span>
          )}
        </div>
        <h3 className="text-lg font-medium leading-snug">
          <Link href={`/vehicles/${v.slug}`} className="after:absolute after:inset-0">{v.title}</Link>
        </h3>
        <p className="tabular text-sm text-slate-600">
          {v.mileageKm > 0 ? `${v.mileageKm.toLocaleString("en-NG")} km` : "0 km"}
          {v.batteryKwh ? ` · ${v.batteryKwh} kWh` : ""}
          {v.electricRangeKm ? ` · ${v.electricRangeKm} km electric (${v.rangeStandard})` : ""}
        </p>
        <div className="mt-auto grid grid-cols-2 items-end gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Reserve with</p>
            <p className="tabular text-xl font-semibold text-emerald-700">{displayPrice(v.depositKobo, currency, ngnPerUsd)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Full price</p>
            <p className="tabular text-base text-slate-700">{displayPrice(v.priceKobo, currency, ngnPerUsd)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
