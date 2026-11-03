/**
 * Pricing, deposit and timeline math.
 * All money is integer minor units: NGN kobo (1 NGN = 100 kobo), USD cents.
 * Mirrors the SQL in supabase/migrations/0001_init.sql — keep them in sync.
 */

export const DEPOSIT_RATE = 0.4;

export type Currency = "NGN" | "USD";
export type VehicleStatus = "available" | "in_transit" | "factory_order" | "reserved" | "sold";

// ---------------------------------------------------------------------
// 1. Deposit / balance split (customer-facing)
// ---------------------------------------------------------------------

/** 40% deposit rounded to the nearest whole naira; balance absorbs the remainder so the parts always sum to the total. */
export function splitPayment(totalKobo: number) {
  if (!Number.isSafeInteger(totalKobo) || totalKobo <= 0) throw new Error("totalKobo must be a positive integer");
  const depositKobo = Math.round((totalKobo * DEPOSIT_RATE) / 100) * 100;
  const balanceKobo = totalKobo - depositKobo;
  return { totalKobo, depositKobo, balanceKobo };
}

// ---------------------------------------------------------------------
// 2. Currency display (NGN is the charge currency; USD is display only)
// ---------------------------------------------------------------------

export function koboToUsdCents(kobo: number, ngnPerUsd: number) {
  return Math.round(kobo / ngnPerUsd);
}

export function formatMoney(minor: number, currency: Currency, opts: { compact?: boolean } = {}) {
  return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: opts.compact ? "compact" : "standard",
  }).format(minor / 100);
}

/** Format a kobo amount in the buyer's chosen display currency. */
export function displayPrice(kobo: number, currency: Currency, ngnPerUsd: number, compact = false) {
  return currency === "NGN"
    ? formatMoney(kobo, "NGN", { compact })
    : formatMoney(koboToUsdCents(kobo, ngnPerUsd), "USD", { compact });
}

// ---------------------------------------------------------------------
// 3. Delivery timeline
// ---------------------------------------------------------------------

/** Day ranges per stage. Tune these from real shipment history. */
export const TIMELINE_DAYS = {
  factoryProduction: [10, 25], // order placed with factory -> car leaves factory
  oceanShipping: [30, 45],     // China port -> Lagos (Tin Can / Apapa) / Onne
  clearingAndHaulage: [7, 14], // customs clearing + truck to Abuja
  abujaPdi: [2, 5],            // pre-delivery inspection, plates, handover
} as const;

export function estimateReadyWindow(status: VehicleStatus, from: Date = new Date(), etaDate?: Date | null) {
  const T = TIMELINE_DAYS;
  let min: number, max: number, base = from;
  switch (status) {
    case "available":
      [min, max] = T.abujaPdi;
      break;
    case "in_transit":
      // Count from the vessel ETA at port when we have it; otherwise assume up to a full voyage remains.
      if (etaDate && etaDate > from) base = etaDate;
      min = T.clearingAndHaulage[0] + T.abujaPdi[0];
      max = T.clearingAndHaulage[1] + T.abujaPdi[1] + (etaDate ? 0 : T.oceanShipping[1]);
      break;
    case "factory_order":
      min = T.factoryProduction[0] + T.oceanShipping[0] + T.clearingAndHaulage[0] + T.abujaPdi[0];
      max = T.factoryProduction[1] + T.oceanShipping[1] + T.clearingAndHaulage[1] + T.abujaPdi[1];
      break;
    default:
      throw new Error(`Vehicle with status "${status}" cannot be ordered`);
  }
  const add = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
  return { from: add(base, min!), to: add(base, max!), minDays: min!, maxDays: max! };
}

// ---------------------------------------------------------------------
// 4. Landed cost (ADMIN-ONLY: used to set the listing price)
// ---------------------------------------------------------------------

/**
 * ILLUSTRATIVE RATES ONLY. Nigerian duty/levy rates and the customs exchange
 * rate change by fiscal policy and vary by HS code (and EV incentives may apply).
 * Confirm every rate with your licensed customs agent before going live.
 */
export interface LandedCostInput {
  fobUsdCents: number;          // supplier price, China port
  freightUsdCents: number;      // RoRo / container share
  insuranceRate?: number;       // of FOB + freight, e.g. 0.015
  customsNgnPerUsd: number;     // customs exchange rate (can differ from market)
  dutyRate: number;             // import duty, of CIF
  levyRate: number;             // surcharge/levy, of CIF
  otherLeviesRate?: number;     // e.g. CISS / ETLS, of CIF
  vatRate?: number;             // 7.5% on (CIF + duty + levies)
  portAndClearingKobo: number;  // terminal, shipping line, agent fees
  haulageToAbujaKobo: number;   // Lagos/Onne -> Abuja truck
  pdiAndRegistrationKobo: number;
  marginRate: number;           // your margin on landed cost
  roundToKobo?: number;         // round the final price, e.g. to ₦50,000
}

export function landedCost(i: LandedCostInput) {
  const insuranceUsd = Math.round((i.fobUsdCents + i.freightUsdCents) * (i.insuranceRate ?? 0.015));
  const cifUsdCents = i.fobUsdCents + i.freightUsdCents + insuranceUsd;
  const cifKobo = Math.round(cifUsdCents * i.customsNgnPerUsd);

  const dutyKobo = Math.round(cifKobo * i.dutyRate);
  const levyKobo = Math.round(cifKobo * i.levyRate);
  const otherKobo = Math.round(cifKobo * (i.otherLeviesRate ?? 0));
  const vatKobo = Math.round((cifKobo + dutyKobo + levyKobo + otherKobo) * (i.vatRate ?? 0.075));

  const landedKobo =
    cifKobo + dutyKobo + levyKobo + otherKobo + vatKobo +
    i.portAndClearingKobo + i.haulageToAbujaKobo + i.pdiAndRegistrationKobo;

  const step = i.roundToKobo ?? 50_000_00; // ₦50,000
  const priceKobo = Math.ceil((landedKobo * (1 + i.marginRate)) / step) * step;

  return {
    cifKobo, dutyKobo, levyKobo, otherKobo, vatKobo, landedKobo,
    priceKobo,
    marginKobo: priceKobo - landedKobo,
    ...splitPayment(priceKobo),
  };
}
