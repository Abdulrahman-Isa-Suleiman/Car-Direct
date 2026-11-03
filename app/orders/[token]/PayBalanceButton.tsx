"use client";
import { useState } from "react";

/** Starts a Paystack payment for the 60% balance (route built in the balance step). */
export function PayBalanceButton({ token, amount }: { token: string; amount: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function pay() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/orders/${token}/balance`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't start the payment.");
      window.location.href = json.authorizationUrl;
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  return (
    <div className="mt-5">
      <button type="button" onClick={pay} disabled={busy}
        className="tabular min-h-[52px] w-full cursor-pointer rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {busy ? "Opening secure payment…" : `Pay ${amount} balance`}
      </button>
      {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
    </div>
  );
}
