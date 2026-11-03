"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

const BUDGETS = [
  { v: "", label: "Any deposit" },
  { v: "0-15000000", label: "Up to ₦15M" },
  { v: "15000000-25000000", label: "₦15M – ₦25M" },
  { v: "25000000-40000000", label: "₦25M – ₦40M" },
  { v: "40000000-", label: "₦40M and above" },
];

function Seg<T extends string>({ name, value, options, onChange }: {
  name: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{name}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-100 p-1">
        {options.map((o) => (
          <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}
            className={`min-h-[44px] cursor-pointer rounded-lg px-2 text-sm font-medium transition-colors duration-200 ${value === o.v ? "bg-white text-ink shadow-sm" : "text-slate-600 hover:text-ink"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function HeroFinder({ count }: { count: number }) {
  const router = useRouter();
  const [condition, setCondition] = useState<"" | "brand_new" | "fairly_used">("");
  const [powertrain, setPowertrain] = useState<"" | "EREV" | "PHEV" | "BEV">("");
  const [budget, setBudget] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (condition) q.set("condition", condition);
    if (powertrain) q.set("powertrain", powertrain);
    if (budget) q.set("deposit", budget); // naira range, e.g. 15000000-25000000
    router.push(`/vehicles${q.size ? `?${q}` : ""}`);
  }

  return (
    <form onSubmit={submit} aria-label="Find a vehicle"
      className="grid gap-5 rounded-2xl bg-white p-5 text-ink shadow-2xl shadow-black/30 sm:p-6">
      <Seg name="Condition" value={condition} onChange={setCondition}
        options={[{ v: "", label: "All" }, { v: "brand_new", label: "Brand New" }, { v: "fairly_used", label: "Fairly Used" }]} />
      <Seg name="Powertrain" value={powertrain} onChange={setPowertrain}
        options={[{ v: "", label: "Any" }, { v: "EREV", label: "EREV" }, { v: "PHEV", label: "PHEV" }, { v: "BEV", label: "BEV" }]} />
      <label htmlFor="deposit-budget" className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Deposit you can pay today (40%)</span>
        <select id="deposit-budget" value={budget} onChange={(e) => setBudget(e.target.value)}
          className="min-h-[48px] cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-base">
          {BUDGETS.map((b) => <option key={b.v} value={b.v}>{b.label}</option>)}
        </select>
      </label>
      <button type="submit"
        className="inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 text-base font-semibold text-white transition-colors duration-200 hover:bg-emerald-700">
        Show {count > 0 ? `${count} ` : ""}cars <ArrowRight aria-hidden className="h-5 w-5" />
      </button>
    </form>
  );
}
