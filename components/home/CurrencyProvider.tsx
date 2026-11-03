"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Currency } from "@/lib/pricing";

const Ctx = createContext<{ currency: Currency; setCurrency: (c: Currency) => void }>({
  currency: "NGN",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setState] = useState<Currency>("NGN");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cd-currency");
      if (saved === "USD" || saved === "NGN") setState(saved);
    } catch {}
  }, []);
  const setCurrency = (c: Currency) => {
    setState(c);
    try { localStorage.setItem("cd-currency", c); } catch {}
  };
  return <Ctx.Provider value={{ currency, setCurrency }}>{children}</Ctx.Provider>;
}

export const useCurrency = () => useContext(Ctx);

export function CurrencyToggle({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { currency, setCurrency } = useCurrency();
  const base = tone === "dark" ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600";
  const on = tone === "dark" ? "bg-white text-ink" : "bg-ink text-white";
  return (
    <div role="group" aria-label="Display prices in" className={`flex rounded-full p-1 text-sm ${base}`}>
      {(["NGN", "USD"] as const).map((c) => (
        <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)}
          className={`min-h-[36px] min-w-[48px] cursor-pointer rounded-full px-3 font-medium transition-colors duration-200 ${currency === c ? on : ""}`}>
          {c === "NGN" ? "₦ NGN" : "$ USD"}
        </button>
      ))}
    </div>
  );
}
