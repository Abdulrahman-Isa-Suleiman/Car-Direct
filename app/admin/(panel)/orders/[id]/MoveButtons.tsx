"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveOrder } from "../actions";

type Opt = { to: string; label: string; danger?: boolean };

/** Stage buttons. Refunds and cancellations ask for a reason and a second click. */
export function MoveButtons({ orderId, options }: { orderId: string; options: Opt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState<Opt | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!options.length) return <p className="mt-4 text-sm text-slate-500">No manual step from this stage. Payments move it on automatically.</p>;

  function go(o: Opt) {
    setErr(null);
    start(async () => {
      const r = await moveOrder({ orderId, to: o.to, note: note.trim() || undefined });
      if (!r.ok) setErr(r.error ?? "Couldn't save.");
      else { setConfirming(null); setNote(""); router.refresh(); }
    });
  }

  return (
    <div className="mt-5 grid gap-3">
      {!confirming && (
        <div className="flex flex-wrap gap-3">
          {options.map((o) => (
            <button key={o.to} type="button" disabled={pending}
              onClick={() => (o.danger ? setConfirming(o) : go(o))}
              className={`min-h-[48px] cursor-pointer rounded-xl px-5 font-semibold disabled:opacity-60 ${o.danger ? "border border-red-300 text-red-700 hover:bg-red-50" : "bg-ink text-white hover:bg-slate-800"}`}>
              {pending ? "Saving…" : o.label}
            </button>
          ))}
        </div>
      )}
      {confirming && (
        <div className="grid gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-900">{confirming.label}?</p>
          <label htmlFor="move-note" className="grid gap-1 text-sm text-red-900">Reason (saved on the order)
            <textarea id="move-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} required
              className="rounded-lg border border-red-200 bg-white p-2 text-[15px] text-ink" />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={pending || !note.trim()} onClick={() => go(confirming)}
              className="min-h-[44px] cursor-pointer rounded-lg bg-red-700 px-4 font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : `Yes, ${confirming.label.toLowerCase()}`}</button>
            <button type="button" onClick={() => setConfirming(null)} className="min-h-[44px] cursor-pointer px-3 font-medium text-slate-700">Keep order as is</button>
          </div>
        </div>
      )}
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    </div>
  );
}
