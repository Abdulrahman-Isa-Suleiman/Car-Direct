"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordManualPayment } from "../actions";

export function ManualPayment({ orderId, label, amount }: { orderId: string; label: string; amount: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [checked, setChecked] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="mt-4 block min-h-[44px] cursor-pointer text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-ink">
      Buyer paid by bank transfer instead? Record it
    </button>
  );
  return (
    <form className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-mist p-4"
      onSubmit={(e) => { e.preventDefault(); setErr(null); start(async () => {
        const r = await recordManualPayment({ orderId, bankReference: ref, checked });
        if (!r.ok) setErr(r.error ?? "Couldn't record it."); else router.refresh();
      }); }}>
      <p className="font-medium">Record {label} of <span className="tabular">{amount}</span> by bank transfer</p>
      <label htmlFor="bank-ref" className="grid gap-1 text-sm">Bank reference or narration
        <input id="bank-ref" required value={ref} onChange={(e) => setRef(e.target.value)} className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-[15px]" />
      </label>
      <label htmlFor="bank-checked" className="flex items-start gap-3 text-sm">
        <input id="bank-checked" type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-5 w-5 accent-emerald-600" />
        I&apos;ve checked the business bank account and the full amount has arrived.
      </label>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending || !checked || ref.trim().length < 3}
          className="min-h-[44px] cursor-pointer rounded-lg bg-ink px-4 font-semibold text-white disabled:opacity-50">{pending ? "Recording…" : "Record payment"}</button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] cursor-pointer px-3 font-medium text-slate-700">Cancel</button>
      </div>
    </form>
  );
}
