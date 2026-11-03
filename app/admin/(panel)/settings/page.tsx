import { requireAdmin } from "@/lib/auth";
import { FxForm } from "./FxForm";

export default async function SettingsPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("settings").select("value, updated_at").eq("key", "fx_ngn_per_usd").single();
  const rate = Number(data?.value ?? 0);
  const updated = data?.updated_at ? new Date(data.updated_at) : null;
  const stale = updated ? Date.now() - updated.getTime() > 36 * 3600 * 1000 : true;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>
      <section aria-labelledby="fx-h" className="mt-6 rounded-2xl bg-white p-6">
        <h2 id="fx-h" className="text-lg font-medium">Exchange rate</h2>
        <p className="mt-1 text-[15px] text-slate-600">
          Used to show USD prices to buyers and to convert prices you enter in USD. Buyers always pay in naira, and each order keeps the rate from the day it was placed.
        </p>
        <p className={`tabular mt-4 text-sm ${stale ? "text-amber-800" : "text-slate-500"}`}>
          {updated ? `Last updated ${updated.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Never updated"}
          {stale && " · update it today"}
        </p>
        <FxForm current={rate} />
      </section>
      <section className="mt-6 rounded-2xl bg-white p-6">
        <h2 className="text-lg font-medium">Deposit</h2>
        <p className="mt-1 text-[15px] text-slate-600">Fixed at <b>40%</b> of the vehicle price, rounded to the nearest naira. Changing it needs a code and database change, because existing orders and the terms depend on it.</p>
      </section>
    </main>
  );
}
