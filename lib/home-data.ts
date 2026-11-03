import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { VehicleStatus } from "@/lib/pricing";
import { applyFilters, PAGE_SIZE, type Filters } from "@/lib/listing";

export interface CardVehicle {
  id: string;
  slug: string;
  title: string;
  condition: "brand_new" | "fairly_used";
  powertrain: "EREV" | "PHEV" | "BEV";
  modelYear: number;
  mileageKm: number;
  batteryKwh: number | null;
  electricRangeKm: number | null;
  rangeStandard: string;
  priceKobo: number;
  depositKobo: number;
  status: VehicleStatus;
  etaDate: string | null;
  inspectionVerified: boolean;
  imageUrl: string | null;
}

/** Shown until Supabase is connected. Clearly sample stock: replace with real listings. */
export const SAMPLE_VEHICLES: CardVehicle[] = [
  { id: "s1", slug: "sample-song-plus", title: "2022 BYD Song Plus DM-i", condition: "fairly_used", powertrain: "PHEV", modelYear: 2022, mileageKm: 38200, batteryKwh: 18.3, electricRangeKm: 110, rangeStandard: "NEDC", priceKobo: 48_500_000_00, depositKobo: 19_400_000_00, status: "available", etaDate: null, inspectionVerified: true, imageUrl: null },
  { id: "s2", slug: "sample-li-l7", title: "2025 Li Auto L7 Pro", condition: "brand_new", powertrain: "EREV", modelYear: 2025, mileageKm: 0, batteryKwh: 42.8, electricRangeKm: 210, rangeStandard: "CLTC", priceKobo: 92_000_000_00, depositKobo: 36_800_000_00, status: "factory_order", etaDate: null, inspectionVerified: true, imageUrl: null },
  { id: "s3", slug: "sample-seal", title: "2023 BYD Seal AWD", condition: "fairly_used", powertrain: "BEV", modelYear: 2023, mileageKm: 21500, batteryKwh: 82.5, electricRangeKm: 520, rangeStandard: "WLTP", priceKobo: 61_000_000_00, depositKobo: 24_400_000_00, status: "in_transit", etaDate: "2026-12-18", inspectionVerified: true, imageUrl: null },
  { id: "s4", slug: "sample-aito-m7", title: "2025 AITO M7 Ultra", condition: "brand_new", powertrain: "EREV", modelYear: 2025, mileageKm: 0, batteryKwh: 40, electricRangeKm: 240, rangeStandard: "CLTC", priceKobo: 84_500_000_00, depositKobo: 33_800_000_00, status: "in_transit", etaDate: "2027-01-06", inspectionVerified: true, imageUrl: null },
  { id: "s5", slug: "sample-atto3", title: "2021 BYD Atto 3", condition: "fairly_used", powertrain: "BEV", modelYear: 2021, mileageKm: 46800, batteryKwh: 60.5, electricRangeKm: 420, rangeStandard: "WLTP", priceKobo: 33_500_000_00, depositKobo: 13_400_000_00, status: "available", etaDate: null, inspectionVerified: true, imageUrl: null },
  { id: "s6", slug: "sample-deepal-s7", title: "2025 Deepal S07 REEV", condition: "brand_new", powertrain: "EREV", modelYear: 2025, mileageKm: 0, batteryKwh: 31.7, electricRangeKm: 200, rangeStandard: "CLTC", priceKobo: 52_000_000_00, depositKobo: 20_800_000_00, status: "factory_order", etaDate: null, inspectionVerified: true, imageUrl: null },
];

const SELECT =
  "id, slug, title, condition, powertrain, model_year, mileage_km, battery_kwh, electric_range_km, range_standard, price_kobo, deposit_kobo, status, eta_date, inspection_verified, vehicle_images(path, category, sort_order)";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

async function fxRate(sb: NonNullable<ReturnType<typeof client>>) {
  const { data } = await sb.from("settings").select("value").eq("key", "fx_ngn_per_usd").single();
  return Number(data?.value ?? 1500);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(sb: NonNullable<ReturnType<typeof client>>, r: any): CardVehicle {
  const cover = [...(r.vehicle_images ?? [])]
    .filter((i: { category: string }) => i.category === "exterior")
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0];
  return {
    id: r.id, slug: r.slug, title: r.title, condition: r.condition, powertrain: r.powertrain,
    modelYear: r.model_year, mileageKm: r.mileage_km, batteryKwh: r.battery_kwh, electricRangeKm: r.electric_range_km,
    rangeStandard: r.range_standard, priceKobo: r.price_kobo, depositKobo: r.deposit_kobo, status: r.status,
    etaDate: r.eta_date, inspectionVerified: r.inspection_verified,
    imageUrl: cover ? sb.storage.from("vehicle-images").getPublicUrl(cover.path).data.publicUrl : null,
  };
}

export async function getHomeData(): Promise<{ vehicles: CardVehicle[]; ngnPerUsd: number; isSample: boolean }> {
  const sb = client();
  if (!sb) return { vehicles: SAMPLE_VEHICLES, ngnPerUsd: 1500, isSample: true };
  const [{ data: rows }, ngnPerUsd] = await Promise.all([
    sb.from("vehicles").select(SELECT).in("status", ["available", "in_transit", "factory_order"])
      .order("created_at", { ascending: false }).limit(24),
    fxRate(sb),
  ]);
  if (!rows?.length) return { vehicles: SAMPLE_VEHICLES, ngnPerUsd, isSample: true };
  return { vehicles: rows.map((r) => mapRow(sb, r)), ngnPerUsd, isSample: false };
}

/** Filtered, sorted, paginated inventory for /vehicles. Returns up to page × PAGE_SIZE rows ("Show more"). */
export async function getInventory(f: Filters): Promise<{ vehicles: CardVehicle[]; total: number; ngnPerUsd: number; isSample: boolean }> {
  const sb = client();
  const limit = f.page * PAGE_SIZE;
  if (!sb) {
    const all = applyFilters(SAMPLE_VEHICLES, f);
    return { vehicles: all.slice(0, limit), total: all.length, ngnPerUsd: 1500, isSample: true };
  }
  let q = sb.from("vehicles").select(SELECT, { count: "exact" })
    .in("status", f.status.length ? f.status : ["available", "in_transit", "factory_order"]);
  if (f.condition) q = q.eq("condition", f.condition);
  if (f.powertrain.length) q = q.in("powertrain", f.powertrain);
  if (f.depositMin !== undefined) q = q.gte("deposit_kobo", f.depositMin * 100);
  if (f.depositMax !== undefined) q = q.lte("deposit_kobo", f.depositMax * 100);
  if (f.yearMin) q = q.gte("model_year", f.yearMin);
  if (f.kmMax) q = q.lte("mileage_km", f.kmMax);
  if (f.rangeMin) q = q.gte("electric_range_km", f.rangeMin);
  q = {
    newest: () => q.order("created_at", { ascending: false }),
    "deposit-asc": () => q.order("deposit_kobo", { ascending: true }),
    "deposit-desc": () => q.order("deposit_kobo", { ascending: false }),
    "range-desc": () => q.order("electric_range_km", { ascending: false, nullsFirst: false }),
  }[f.sort]();
  const [{ data: rows, count }, ngnPerUsd] = await Promise.all([q.range(0, limit - 1), fxRate(sb)]);
  return { vehicles: (rows ?? []).map((r) => mapRow(sb, r)), total: count ?? 0, ngnPerUsd, isSample: false };
}

/* ------------------------------------------------------------------ */
/* Vehicle detail                                                      */
/* ------------------------------------------------------------------ */

export type ImageCategory = "exterior" | "interior" | "dashboard" | "battery_report" | "other";

export interface DetailVehicle extends CardVehicle {
  combinedRangeKm: number | null;
  features: string[];
  description: string | null;
  inspectionPoints: number;
  images: { url: string; category: ImageCategory; isPdf: boolean }[];
}

const SAMPLE_DETAIL: Record<string, Pick<DetailVehicle, "combinedRangeKm" | "features" | "description">> = {
  "sample-song-plus": { combinedRangeKm: 1100, features: ["Leather seats", "Ventilated seats", "Panoramic sunroof", "360° camera", "Wireless CarPlay / Android Auto", "Heat pump"],
    description: "One owner from Shenzhen, full dealer service history. Blade battery at 96% state of health on our diagnostic." },
  "sample-li-l7": { combinedRangeKm: 1315, features: ["Leather seats", "Ventilated & massage seats", "ADAS Level 2", "HUD", "Premium audio", "Fridge", "Air suspension"],
    description: "Five-seat family SUV. Ordered new from the factory in your choice of colour and interior." },
  "sample-seal": { combinedRangeKm: null, features: ["Leather seats", "ADAS Level 2", "HUD", "Panoramic glass roof", "V2L (power out)", "Fast charging (DC)"],
    description: "Dual-motor AWD, 0–100 km/h in 3.8 s. Battery at 97% state of health." },
  "sample-aito-m7": { combinedRangeKm: 1200, features: ["Leather seats", "Ventilated seats", "ADAS Level 2", "HUD", "Third row seats", "Premium audio"],
    description: "Six-seat range-extended SUV. On the water now, arriving at Tin Can Island in January." },
  "sample-atto3": { combinedRangeKm: null, features: ["Panoramic sunroof", "360° camera", "Fast charging (DC)", "V2L (power out)"],
    description: "Compact SUV, ideal for city driving with home charging. Battery at 93% state of health." },
  "sample-deepal-s7": { combinedRangeKm: 1120, features: ["ADAS Level 2", "HUD", "Panoramic glass roof", "Wireless CarPlay / Android Auto"],
    description: "Range-extended version of the Deepal S07 coupe-SUV. Factory order, about 7 to 12 weeks to Abuja." },
};

export async function getVehicleBySlug(slug: string): Promise<{ vehicle: DetailVehicle | null; ngnPerUsd: number; isSample: boolean }> {
  const sb = client();
  if (!sb) {
    const v = SAMPLE_VEHICLES.find((x) => x.slug === slug);
    return {
      vehicle: v ? { ...v, ...SAMPLE_DETAIL[v.slug], inspectionPoints: 150, images: [] } : null,
      ngnPerUsd: 1500, isSample: true,
    };
  }
  const [{ data: r }, ngnPerUsd] = await Promise.all([
    sb.from("vehicles").select(`${SELECT}, combined_range_km, features, description, inspection_points`).eq("slug", slug).maybeSingle(),
    fxRate(sb),
  ]);
  if (!r) return { vehicle: null, ngnPerUsd, isSample: false };
  const images = [...(r.vehicle_images ?? [])]
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((i: { path: string; category: ImageCategory }) => ({
      url: sb.storage.from("vehicle-images").getPublicUrl(i.path).data.publicUrl,
      category: i.category,
      isPdf: i.path.toLowerCase().endsWith(".pdf"),
    }));
  return {
    ngnPerUsd, isSample: false,
    vehicle: { ...mapRow(sb, r), combinedRangeKm: r.combined_range_km, features: r.features ?? [], description: r.description,
      inspectionPoints: r.inspection_points ?? 150, images },
  };
}

/** Up to 3 other cars with the same powertrain, falling back to anything orderable. */
export async function getRelated(v: CardVehicle): Promise<CardVehicle[]> {
  const sb = client();
  const pick = (pool: CardVehicle[]) => {
    const others = pool.filter((x) => x.id !== v.id && x.status !== "sold" && x.status !== "reserved");
    return [...others.filter((x) => x.powertrain === v.powertrain), ...others.filter((x) => x.powertrain !== v.powertrain)].slice(0, 3);
  };
  if (!sb) return pick(SAMPLE_VEHICLES);
  const { data } = await sb.from("vehicles").select(SELECT).in("status", ["available", "in_transit", "factory_order"])
    .neq("id", v.id).order("created_at", { ascending: false }).limit(12);
  return pick((data ?? []).map((r) => mapRow(sb, r)));
}

/** Every slug, for generateStaticParams (sample mode) and sitemaps. */
export async function getAllSlugs() {
  const sb = client();
  if (!sb) return SAMPLE_VEHICLES.map((v) => v.slug);
  const { data } = await sb.from("vehicles").select("slug").neq("status", "sold");
  return (data ?? []).map((r) => r.slug as string);
}
