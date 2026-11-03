"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { updateVehicle } from "./actions";

export interface AdminVehicle {
  id: string; slug: string; title: string; condition: string; powertrain: string; modelYear: number;
  price: string; deposit: string; status: "available" | "in_transit" | "factory_order" | "reserved" | "sold";
  etaDate: string | null; coverUrl: string | null;
}

const STATUS = [
  { v: "available", label: "On ground in Abuja" }, { v: "in_transit", label: "In transit" },
  { v: "factory_order", label: "Factory order" }, { v: "reserved", label: "Reserved" }, { v: "sold", label: "Sold" },
] as const;

export function VehicleRow({ v }: { v: AdminVehicle }) {
  const [status, setStatus] = useState(v.status);
  const [eta, setEta] = useState(v.etaDate ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function save(next: { status?: AdminVehicle["status"]; eta?: string }) {
    const s = next.status ?? status, e = next.eta ?? eta;
    start(async () => {
      const r = await updateVehicle({ id: v.id, status: s, etaDate: s === "in_transit" && e ? e : null });
      setMsg(r.ok ? { ok: true, text: "Saved" } : { ok: false, text: r.error ?? "Couldn't save" });
      if (!r.ok) { setStatus(v.status); setEta(v.etaDate ?? ""); }
    });
  }

  return (
    <li className="grid gap-4 rounded-2xl bg-white p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center">
      <div className="hidden aspect-[4/3] overflow-hidden rounded-lg bg-slate-200 sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {v.coverUrl && <img src={v.coverUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{v.title}</p>
        <p className="tabular text-sm text-slate-600">
          {v.condition === "brand_new" ? "Brand New" : `Fairly Used ${v.modelYear}`} · {v.powertrain} · {v.price} · deposit {v.deposit}
        </p>
        <Link href={`/vehicles/${v.slug}`} target="_blank" className="text-sm font-medium text-emerald-700 hover:underline">View on site</Link>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor={`st-${v.id}`} className="grid gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">Status
          <select id={`st-${v.id}`} value={status} disabled={pending}
            onChange={(e) => { const s = e.target.value as AdminVehicle["status"]; setStatus(s); if (s !== "in_transit" || eta) save({ status: s }); }}
            className="min-h-[44px] cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-[15px] normal-case tracking-normal text-ink">
            {STATUS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </label>
        {status === "in_transit" && (
          <label htmlFor={`eta-${v.id}`} className="grid gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">Vessel ETA
            <input id={`eta-${v.id}`} type="date" value={eta} disabled={pending}
              onChange={(e) => { setEta(e.target.value); if (e.target.value) save({ status: "in_transit", eta: e.target.value }); }}
              className="min-h-[44px] rounded-lg border border-slate-300 px-3 text-[15px] text-ink" />
          </label>
        )}
        <p role="status" className={`min-h-[44px] min-w-[56px] content-center text-sm ${msg?.ok === false ? "text-red-700" : "text-emerald-700"}`}>
          {pending ? "Saving…" : msg?.text ?? ""}
        </p>
      </div>
    </li>
  );
}
