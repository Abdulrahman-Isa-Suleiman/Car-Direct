"use client";
import { useActionState } from "react";
import { saveFxRate, type FxState } from "./actions";

export function FxForm({ current }: { current: number }) {
  const [state, action, pending] = useActionState<FxState, FormData>(saveFxRate, null);
  return (
    <form action={action} className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
      <label htmlFor="rate" className="grid flex-1 gap-1 text-sm font-medium">Naira per US dollar
        <div className="flex items-center rounded-lg border border-slate-300 focus-within:border-emerald-600">
          <span className="pl-3 text-slate-500">₦</span>
          <input id="rate" name="rate" inputMode="decimal" required defaultValue={current ? current.toLocaleString("en-NG") : ""}
            className="tabular min-h-[48px] w-full rounded-lg px-2 text-lg font-normal focus:outline-none" />
        </div>
      </label>
      <button type="submit" disabled={pending} className="min-h-[48px] cursor-pointer rounded-lg bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {pending ? "Saving…" : "Save rate"}
      </button>
      {state && <p role="status" className={`text-sm sm:basis-full ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}
