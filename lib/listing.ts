/**
 * Listing filters live in the URL so a filtered view can be shared on WhatsApp.
 * Shared by the server page (parsing + filtering) and the client controls (building URLs).
 */
import type { CardVehicle } from "@/lib/home-data";

export type Sort = "newest" | "deposit-asc" | "deposit-desc" | "range-desc";
export const PAGE_SIZE = 12;

export interface Filters {
  condition?: "brand_new" | "fairly_used";
  powertrain: ("EREV" | "PHEV" | "BEV")[];
  status: ("available" | "in_transit" | "factory_order")[];
  depositMin?: number; // naira
  depositMax?: number; // naira
  yearMin?: number;
  kmMax?: number;
  rangeMin?: number;
  sort: Sort;
  page: number;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = <T extends string>(v: string | string[] | undefined, allowed: readonly T[]) =>
  (one(v)?.split(",") ?? []).filter((x): x is T => (allowed as readonly string[]).includes(x));
const int = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

export const POWERTRAINS = ["EREV", "PHEV", "BEV"] as const;
export const STATUSES = ["available", "in_transit", "factory_order"] as const;
export const SORTS: { v: Sort; label: string }[] = [
  { v: "newest", label: "Newest listed" },
  { v: "deposit-asc", label: "Deposit: low to high" },
  { v: "deposit-desc", label: "Deposit: high to low" },
  { v: "range-desc", label: "Longest electric range" },
];
export const DEPOSIT_BUCKETS = [
  { v: "0-15000000", label: "Up to ₦15M" },
  { v: "15000000-25000000", label: "₦15M – ₦25M" },
  { v: "25000000-40000000", label: "₦25M – ₦40M" },
  { v: "40000000-", label: "₦40M and above" },
];
export const STATUS_LABEL = { available: "On ground in Abuja", in_transit: "In transit", factory_order: "Factory order" } as const;

export function parseFilters(p: Params): Filters {
  const cond = one(p.condition);
  const [dMin, dMax] = (one(p.deposit) ?? "").split("-");
  const sort = one(p.sort) as Sort;
  return {
    condition: cond === "brand_new" || cond === "fairly_used" ? cond : undefined,
    powertrain: list(p.powertrain, POWERTRAINS),
    status: list(p.status, STATUSES),
    depositMin: int(dMin),
    depositMax: int(dMax),
    yearMin: int(one(p.year)),
    kmMax: int(one(p.km)),
    rangeMin: int(one(p.range)),
    sort: SORTS.some((s) => s.v === sort) ? sort : "newest",
    page: Math.max(1, int(one(p.page)) ?? 1),
  };
}

/** Serialise back to a query string, dropping defaults so URLs stay short. */
export function toQuery(f: Filters) {
  const q = new URLSearchParams();
  if (f.condition) q.set("condition", f.condition);
  if (f.powertrain.length) q.set("powertrain", f.powertrain.join(","));
  if (f.status.length) q.set("status", f.status.join(","));
  if (f.depositMin !== undefined || f.depositMax !== undefined) q.set("deposit", `${f.depositMin ?? 0}-${f.depositMax ?? ""}`);
  if (f.yearMin) q.set("year", String(f.yearMin));
  if (f.kmMax) q.set("km", String(f.kmMax));
  if (f.rangeMin) q.set("range", String(f.rangeMin));
  if (f.sort !== "newest") q.set("sort", f.sort);
  if (f.page > 1) q.set("page", String(f.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function activeCount(f: Filters) {
  return [f.condition, f.powertrain.length, f.status.length, f.depositMin ?? f.depositMax, f.yearMin, f.kmMax, f.rangeMin]
    .filter(Boolean).length;
}

/** In-memory filter, used for sample stock (the Supabase path filters in SQL). */
export function applyFilters(vs: CardVehicle[], f: Filters) {
  const out = vs.filter((v) =>
    (!f.condition || v.condition === f.condition) &&
    (!f.powertrain.length || f.powertrain.includes(v.powertrain)) &&
    (!f.status.length || (f.status as string[]).includes(v.status)) &&
    (f.depositMin === undefined || v.depositKobo >= f.depositMin * 100) &&
    (f.depositMax === undefined || v.depositKobo <= f.depositMax * 100) &&
    (!f.yearMin || v.modelYear >= f.yearMin) &&
    (!f.kmMax || v.mileageKm <= f.kmMax) &&
    (!f.rangeMin || (v.electricRangeKm ?? 0) >= f.rangeMin));
  const by: Record<Sort, (a: CardVehicle, b: CardVehicle) => number> = {
    newest: () => 0,
    "deposit-asc": (a, b) => a.depositKobo - b.depositKobo,
    "deposit-desc": (a, b) => b.depositKobo - a.depositKobo,
    "range-desc": (a, b) => (b.electricRangeKm ?? 0) - (a.electricRangeKm ?? 0),
  };
  return out.sort(by[f.sort]);
}
