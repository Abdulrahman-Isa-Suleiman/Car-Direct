"use client";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { displayPrice, splitPayment } from "@/lib/pricing";
import { useCurrency, CurrencyToggle } from "@/components/home/CurrencyProvider";

interface Props {
  slug: string;
  title: string;
  priceKobo: number;
  ngnPerUsd: number;
  readyText: string;
  whatsappUrl: string;
  canReserve: boolean;
  unavailableLabel?: string;
}

export function PricePanel(p: Props) {
  const { currency } = useCurrency();
  const { depositKobo, balanceKobo } = splitPayment(p.priceKobo);
  const show = (k: number) => displayPrice(k, currency, p.ngnPerUsd);

  return (
    <div className="rounded-2xl bg-ink p-6 text-white">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Price</p>
        <CurrencyToggle />
      </div>
      <p className="tabular mt-2 text-3xl font-semibold">{show(p.priceKobo)}</p>

      <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-white/15" aria-hidden>
        <span className="w-[40%] bg-emerald-400" />
      </div>
      <dl className="tabular mt-4 grid gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-medium text-emerald-300">Pay today to reserve · 40%</dt>
          <dd className="text-xl font-semibold text-emerald-300">{show(depositKobo)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 text-slate-300">
          <dt>After inspection in Abuja · 60%</dt>
          <dd className="text-white">{show(balanceKobo)}</dd>
        </div>
      </dl>
      <p className="mt-5 rounded-lg bg-white/5 p-3 text-sm text-slate-300">
        <span className="font-medium text-white">Ready in Abuja: </span>{p.readyText}
      </p>

      {p.canReserve ? (
        <Link href={`/vehicles/${p.slug}/reserve`}
          className="tabular mt-6 flex min-h-[52px] items-center justify-center rounded-xl bg-emerald-600 text-base font-semibold text-white transition-colors duration-200 hover:bg-emerald-700">
          Reserve with {displayPrice(depositKobo, "NGN", p.ngnPerUsd)}
        </Link>
      ) : (
        <p className="mt-6 flex min-h-[52px] items-center justify-center rounded-xl bg-white/10 text-base font-semibold text-slate-300">
          {p.unavailableLabel}
        </p>
      )}
      <a href={p.whatsappUrl} target="_blank" rel="noopener"
        className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/20 text-[15px] font-medium text-white hover:bg-white/5">
        <MessageCircle aria-hidden className="h-5 w-5" /> Ask about this car on WhatsApp
      </a>
      {currency === "USD" && (
        <p className="mt-3 text-xs text-slate-400">USD at ₦{p.ngnPerUsd.toLocaleString("en-NG")}/$1 for reference. You pay in naira.</p>
      )}
    </div>
  );
}

/** Phone-only bar so the deposit and Reserve stay in thumb reach while scrolling. */
export function MobileReserveBar(p: Pick<Props, "slug" | "priceKobo" | "ngnPerUsd" | "canReserve" | "unavailableLabel">) {
  const { currency } = useCurrency();
  const { depositKobo } = splitPayment(p.priceKobo);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Reserve with 40%</p>
          <p className="tabular truncate text-lg font-semibold text-emerald-700">{displayPrice(depositKobo, currency, p.ngnPerUsd)}</p>
        </div>
        {p.canReserve ? (
          <Link href={`/vehicles/${p.slug}/reserve`}
            className="inline-flex min-h-[48px] items-center rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700">
            Reserve
          </Link>
        ) : (
          <span className="inline-flex min-h-[48px] items-center rounded-xl bg-slate-100 px-5 font-semibold text-slate-600">{p.unavailableLabel}</span>
        )}
      </div>
    </div>
  );
}
