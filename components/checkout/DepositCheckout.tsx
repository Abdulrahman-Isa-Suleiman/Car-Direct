"use client";

import { useMemo, useState } from "react";
import { useCurrency } from "@/components/home/CurrencyProvider";
import { splitPayment, displayPrice, estimateReadyWindow, type VehicleStatus } from "@/lib/pricing";

export interface CheckoutVehicle {
  id: string;
  title: string;
  coverUrl: string | null;
  condition: "brand_new" | "fairly_used";
  powertrain: "EREV" | "PHEV" | "BEV";
  status: VehicleStatus;
  etaDate: string | null;
  priceKobo: number;
}

const STATUS_LABEL: Record<VehicleStatus, string> = {
  available: "Available on Ground · Abuja",
  in_transit: "In Transit from China",
  factory_order: "Factory Order",
  reserved: "Reserved",
  sold: "Sold",
};

const fmtDate = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

/** `demoMode`: sample stock has no database row, so payment is disabled with an explanation. */
export default function DepositCheckout({ vehicle, ngnPerUsd, demoMode = false }: { vehicle: CheckoutVehicle; ngnPerUsd: number; demoMode?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [form, setForm] = useState({ name: "", phone: "", email: "", acceptTerms: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { totalKobo, depositKobo, balanceKobo } = useMemo(() => splitPayment(vehicle.priceKobo), [vehicle.priceKobo]);
  const eta = useMemo(
    () => estimateReadyWindow(vehicle.status, new Date(), vehicle.etaDate ? new Date(vehicle.etaDate) : null),
    [vehicle.status, vehicle.etaDate],
  );
  const show = (kobo: number) => displayPrice(kobo, currency, ngnPerUsd);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (demoMode) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: vehicle.id, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Checkout failed. Please try again.");
      window.location.href = json.authorizationUrl; // Paystack hosted page
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
      {/* ---------- Buyer details ---------- */}
      <form onSubmit={onSubmit} className="order-2 space-y-5 lg:order-1" id="checkout-form">
        <h1 className="font-display text-3xl text-ink">Reserve with a 40% deposit</h1>
        <p className="text-sm text-slate-600">
          Pay {show(depositKobo)} today to start procurement. The balance of {show(balanceKobo)} is due after
          the car passes pre-delivery inspection in Abuja, before handover.
        </p>

        {[
          { id: "name", label: "Full name", type: "text", autoComplete: "name" },
          { id: "phone", label: "Phone (WhatsApp)", type: "tel", autoComplete: "tel", placeholder: "0803 000 0000" },
          { id: "email", label: "Email for receipts", type: "email", autoComplete: "email" },
        ].map((f) => (
          <label key={f.id} htmlFor={f.id} className="block">
            <span className="text-sm font-medium text-ink">{f.label}</span>
            <input
              id={f.id}
              required
              type={f.type}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              value={form[f.id as "name" | "phone" | "email"]}
              onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </label>
        ))}

        <label htmlFor="acceptTerms" className="flex items-start gap-3 rounded-md bg-mist p-3 text-sm text-slate-700">
          <input
            id="acceptTerms"
            type="checkbox"
            required
            checked={form.acceptTerms}
            onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
            className="mt-0.5 h-5 w-5 accent-emerald-600"
          />
          <span>
            I agree to the <a href="/terms/deposit" target="_blank" className="font-medium underline">deposit terms</a>: the 40% is
            refunded if the car fails inspection in Abuja or misses the delivery window, and the 60% balance is due before hand-over.
          </span>
        </label>

        {demoMode && (
          <p role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            This is a sample listing, so payment is switched off. Connect Supabase and Paystack to take real deposits.
          </p>
        )}
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting || demoMode}
          className="w-full rounded-md bg-emerald-600 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Opening secure payment…" : `Pay ${displayPrice(depositKobo, "NGN", ngnPerUsd)} deposit`}
        </button>
        <p className="text-center text-xs text-slate-500">
          Secured by Paystack · Bank transfer, card or USSD · Charged in Naira
        </p>
      </form>

      {/* ---------- Order summary ---------- */}
      <aside className="order-1 h-fit rounded-xl bg-ink p-5 text-white lg:sticky lg:top-6 lg:order-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-300">Order summary</span>
          <div role="group" aria-label="Display currency" className="flex rounded-full bg-white/10 p-0.5 text-xs">
            {(["NGN", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={`rounded-full px-3 py-1 ${currency === c ? "bg-white text-ink" : "text-slate-300"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {vehicle.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vehicle.coverUrl} alt="" className="mt-4 aspect-[16/10] w-full rounded-lg object-cover" />
        ) : (
          <div aria-hidden className="mt-4 flex aspect-[16/10] w-full items-end rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 p-4 font-display text-4xl text-white/10">{vehicle.powertrain}</div>
        )}
        <h2 className="mt-3 font-display text-lg">{vehicle.title}</h2>
        <p className="text-xs text-slate-300">
          {vehicle.condition === "brand_new" ? "Brand New" : "Fairly Used · 2020+"} · {vehicle.powertrain} ·{" "}
          {STATUS_LABEL[vehicle.status]}
        </p>

        {/* Deposit bar: 40 / 60 */}
        <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-white/15" aria-hidden>
          <div className="w-[40%] bg-emerald-400" />
        </div>

        <dl className="mt-4 space-y-2 text-sm tabular-nums">
          <div className="flex justify-between"><dt className="text-slate-300">Vehicle price</dt><dd>{show(totalKobo)}</dd></div>
          <div className="flex justify-between text-base font-semibold text-emerald-300">
            <dt>Due today (40%)</dt><dd>{show(depositKobo)}</dd>
          </div>
          <div className="flex justify-between"><dt className="text-slate-300">Balance before handover (60%)</dt><dd>{show(balanceKobo)}</dd></div>
        </dl>

        <div className="mt-5 rounded-lg bg-white/5 p-3 text-xs text-slate-300">
          <p className="font-medium text-white">Estimated ready in Abuja</p>
          <p className="mt-1 tabular-nums">
            {fmtDate(eta.from)} – {fmtDate(eta.to)} ({eta.minDays}–{eta.maxDays} days)
          </p>
        </div>

        {currency === "USD" && (
          <p className="mt-3 text-[11px] text-slate-400">
            USD shown at ₦{ngnPerUsd.toLocaleString()}/$1 for reference. You are charged in Naira; the balance is fixed in
            Naira at today&apos;s price.
          </p>
        )}
      </aside>
    </div>
  );
}
