"use client";

import { useCallback, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { splitPayment, formatMoney } from "@/lib/pricing";

/* ------------------------------------------------------------------ */
/* Options                                                            */
/* ------------------------------------------------------------------ */

const FEATURES = [
  "Leather seats", "Ventilated seats", "ADAS Level 2", "360° camera", "Sunroof / panoramic roof",
  "HUD", "Wireless CarPlay / Android Auto", "Fast charging (DC)", "V2L (power out)",
  "Heat pump", "Premium audio", "Third row seats",
];
const CATEGORIES = ["exterior", "interior", "dashboard", "battery_report"] as const;
type Category = (typeof CATEGORIES)[number];
const CATEGORY_LABEL: Record<Category, string> = {
  exterior: "Exterior", interior: "Interior", dashboard: "Dashboard", battery_report: "Battery report",
};

interface Photo { file: File; preview: string; category: Category }

const THIS_YEAR = new Date().getFullYear();

/* ------------------------------------------------------------------ */
/* Image compression: phone photos are 4–8 MB; shrink before upload   */
/* so staff on mobile data are not waiting minutes.                   */
/* ------------------------------------------------------------------ */
async function compress(file: File, maxEdge = 1920, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file; // PDFs (battery reports) go up as-is
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file); } catch { return file; } // e.g. HEIC on some browsers
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const canvas = new OffscreenCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.convertToBlob({ type: "image/webp", quality });
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);

/* ------------------------------------------------------------------ */

export default function QuickUploadForm({ ngnPerUsd }: { ngnPerUsd: number }) {
  const [f, setF] = useState({
    title: "", make: "", model: "",
    condition: "fairly_used" as "brand_new" | "fairly_used",
    powertrain: "PHEV" as "EREV" | "PHEV" | "BEV",
    modelYear: THIS_YEAR - 2, mileageKm: "",
    batteryKwh: "", electricRangeKm: "", combinedRangeKm: "", rangeStandard: "CLTC",
    price: "", priceCurrency: "NGN" as "NGN" | "USD",
    status: "available" as "available" | "in_transit" | "factory_order" | "sold",
    etaDate: "",
    inspectionVerified: true,
    features: [] as string[],
  });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<{ kind: "idle" | "saving" | "done" | "error"; msg?: string }>({ kind: "idle" });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  // Price is entered in either currency; NGN kobo is what we store and charge.
  const priceKobo = useMemo(() => {
    const n = Number(String(f.price).replace(/[^\d.]/g, ""));
    if (!n) return 0;
    return Math.round(f.priceCurrency === "NGN" ? n * 100 : n * ngnPerUsd * 100);
  }, [f.price, f.priceCurrency, ngnPerUsd]);
  const split = priceKobo > 0 ? splitPayment(priceKobo) : null;

  const addFiles = useCallback((files: FileList | File[]) => {
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || file.type === "application/pdf")
      .map((file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
        // Default: photos are exterior, PDFs are battery reports. Staff retag with the dropdown.
        category: (file.type === "application/pdf" ? "battery_report" : "exterior") as Category,
      }));
    setPhotos((p) => [...p, ...next]);
  }, []);

  const errors: string[] = [];
  if (!f.title.trim()) errors.push("Add a title");
  if (f.condition === "fairly_used" && f.modelYear < 2020) errors.push("Fairly Used cars must be 2020 or newer");
  if (!priceKobo) errors.push("Add a price");
  if (photos.filter((p) => p.category === "exterior").length === 0) errors.push("Add at least one exterior photo");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (errors.length) return setState({ kind: "error", msg: errors[0] });
    setState({ kind: "saving", msg: "Saving vehicle…" });
    const sb = supabaseBrowser();
    try {
      const { data: v, error } = await sb.from("vehicles").insert({
        slug: slugify(f.title),
        title: f.title.trim(),
        make: f.make.trim() || f.title.split(" ")[1] || "",
        model: f.model.trim() || f.title.split(" ").slice(2).join(" "),
        condition: f.condition,
        powertrain: f.powertrain,
        model_year: f.modelYear,
        mileage_km: f.condition === "brand_new" ? 0 : Number(f.mileageKm || 0),
        battery_kwh: f.batteryKwh ? Number(f.batteryKwh) : null,
        electric_range_km: f.electricRangeKm ? Number(f.electricRangeKm) : null,
        combined_range_km: f.powertrain === "BEV" || !f.combinedRangeKm ? null : Number(f.combinedRangeKm),
        range_standard: f.rangeStandard,
        price_kobo: priceKobo,
        price_usd_cents: Math.round(priceKobo / ngnPerUsd),
        features: f.features,
        inspection_verified: f.inspectionVerified,
        status: f.status,
        eta_date: f.status === "in_transit" && f.etaDate ? f.etaDate : null,
      }).select("id").single();
      if (error || !v) throw new Error(error?.message ?? "Could not save vehicle");

      // Upload photos 3 at a time (gentle on mobile connections).
      let done = 0;
      const queue = photos.map((p, i) => async () => {
        const blob = await compress(p.file);
        const ext = blob.type === "image/webp" ? "webp" : p.file.name.split(".").pop();
        const path = `${v.id}/${p.category}-${i}.${ext}`;
        const up = await sb.storage.from("vehicle-images").upload(path, blob, { contentType: blob.type, upsert: true });
        if (up.error) throw up.error;
        await sb.from("vehicle_images").insert({ vehicle_id: v.id, path, category: p.category, sort_order: i });
        setState({ kind: "saving", msg: `Uploading photos ${++done}/${photos.length}…` });
      });
      for (let i = 0; i < queue.length; i += 3) await Promise.all(queue.slice(i, i + 3).map((fn) => fn()));

      setState({ kind: "done", msg: `Published “${f.title}”.` });
      setPhotos([]);
      setF((p) => ({ ...p, title: "", make: "", model: "", mileageKm: "", price: "", features: [] }));
    } catch (err) {
      setState({ kind: "error", msg: (err as Error).message });
    }
  }

  /* ---------------------------- UI helpers ---------------------------- */
  const Segmented = <T extends string>({ id, value, options, onChange }: {
    id: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void;
  }) => (
    <div role="radiogroup" id={id} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
          className={`rounded-md px-2 py-2.5 text-sm font-medium ${value === o.v ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
  const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-base focus:border-emerald-600 focus:outline-none";
  const label = "block text-sm font-medium text-ink";

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-8 px-4 py-6 pb-32">
      <header>
        <h1 className="font-display text-2xl text-ink">Add a vehicle</h1>
        <p className="text-sm text-slate-500">Photos first, then the basics. Takes about 2 minutes.</p>
      </header>

      {/* 1. Photos */}
      <section aria-labelledby="photos-h" className="space-y-3">
        <h2 id="photos-h" className="text-xs font-semibold uppercase tracking-wider text-slate-500">1 · Photos & reports</h2>
        <label
          htmlFor="photo-input"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center ${dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300"}`}
        >
          <span className="font-medium text-ink">Drop photos here or tap to choose</span>
          <span className="mt-1 text-xs text-slate-500">JPG, PNG, HEIC or PDF battery report · resized automatically</span>
          <input id="photo-input" type="file" multiple accept="image/*,application/pdf" className="sr-only"
            onChange={(e) => e.target.files && addFiles(e.target.files)} />
        </label>
        {photos.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p, i) => (
              <li key={i} className="overflow-hidden rounded-lg border border-slate-200">
                {p.preview
                  ? <img src={p.preview} alt="" className="aspect-[4/3] w-full object-cover" />
                  : <div className="flex aspect-[4/3] items-center justify-center bg-slate-50 text-xs text-slate-500">PDF · {p.file.name}</div>}
                <div className="flex gap-1 p-1.5">
                  <select aria-label="Photo type" value={p.category}
                    onChange={(e) => setPhotos((ps) => ps.map((x, j) => (j === i ? { ...x, category: e.target.value as Category } : x)))}
                    className="min-w-0 flex-1 rounded border-slate-200 text-xs">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                  </select>
                  <button type="button" aria-label="Remove photo" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                    className="rounded px-2 text-slate-400 hover:text-red-600">×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. Basics */}
      <section aria-labelledby="basics-h" className="space-y-4">
        <h2 id="basics-h" className="text-xs font-semibold uppercase tracking-wider text-slate-500">2 · Basics</h2>
        <label htmlFor="title" className={label}>Vehicle title
          <input id="title" className={input} placeholder="2024 BYD Song Plus DM-i" value={f.title}
            onChange={(e) => set("title", e.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className={label}>Condition</span>
            <Segmented id="condition" value={f.condition} onChange={(v) => {
              set("condition", v);
              if (v === "brand_new") { set("modelYear", THIS_YEAR); set("mileageKm", "0"); }
            }}
              options={[{ v: "brand_new", label: "Brand New" }, { v: "fairly_used", label: "Fairly Used 2020+" }]} />
          </div>
          <div><span className={label}>Powertrain</span>
            <Segmented id="powertrain" value={f.powertrain} onChange={(v) => set("powertrain", v)}
              options={[{ v: "EREV", label: "EREV" }, { v: "PHEV", label: "PHEV" }, { v: "BEV", label: "BEV" }]} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label htmlFor="modelYear" className={label}>Model year
            <select id="modelYear" className={input} value={f.modelYear} onChange={(e) => set("modelYear", Number(e.target.value))}>
              {Array.from({ length: THIS_YEAR - 2019 + 1 }, (_, i) => THIS_YEAR + 1 - i).map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
          <label htmlFor="mileageKm" className={label}>Mileage (km)
            <input id="mileageKm" inputMode="numeric" className={input} disabled={f.condition === "brand_new"}
              value={f.condition === "brand_new" ? "0" : f.mileageKm} onChange={(e) => set("mileageKm", e.target.value)} />
          </label>
        </div>
      </section>

      {/* 3. Battery & range */}
      <section aria-labelledby="battery-h" className="space-y-4">
        <h2 id="battery-h" className="text-xs font-semibold uppercase tracking-wider text-slate-500">3 · Battery & range</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label htmlFor="batteryKwh" className={label}>Battery (kWh)
            <input id="batteryKwh" inputMode="decimal" className={input} value={f.batteryKwh} onChange={(e) => set("batteryKwh", e.target.value)} />
          </label>
          <label htmlFor="electricRangeKm" className={label}>Electric range (km)
            <input id="electricRangeKm" inputMode="numeric" className={input} value={f.electricRangeKm} onChange={(e) => set("electricRangeKm", e.target.value)} />
          </label>
          <label htmlFor="combinedRangeKm" className={label}>Combined (km)
            <input id="combinedRangeKm" inputMode="numeric" className={input} disabled={f.powertrain === "BEV"}
              value={f.powertrain === "BEV" ? "" : f.combinedRangeKm} onChange={(e) => set("combinedRangeKm", e.target.value)} />
          </label>
          <label htmlFor="rangeStandard" className={label}>Test cycle
            <select id="rangeStandard" className={input} value={f.rangeStandard} onChange={(e) => set("rangeStandard", e.target.value)}>
              <option>CLTC</option><option>WLTP</option><option>NEDC</option>
            </select>
          </label>
        </div>
      </section>

      {/* 4. Price */}
      <section aria-labelledby="price-h" className="space-y-3">
        <h2 id="price-h" className="text-xs font-semibold uppercase tracking-wider text-slate-500">4 · Price</h2>
        <div className="flex gap-2">
          <select aria-label="Price currency" className="rounded-md border border-slate-300 px-2" value={f.priceCurrency}
            onChange={(e) => set("priceCurrency", e.target.value as "NGN" | "USD")}>
            <option value="NGN">₦ NGN</option><option value="USD">$ USD</option>
          </select>
          <input id="price" inputMode="numeric" placeholder="48,500,000" className={`${input} mt-0 text-lg tabular-nums`}
            value={f.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-4 tabular-nums">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-800">40% deposit</p>
            <p className="font-display text-2xl text-emerald-900">{split ? formatMoney(split.depositKobo, "NGN") : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">60% balance</p>
            <p className="font-display text-2xl text-ink">{split ? formatMoney(split.balanceKobo, "NGN") : "—"}</p>
          </div>
          {f.priceCurrency === "USD" && split && (
            <p className="col-span-2 text-xs text-slate-500">Converted at ₦{ngnPerUsd.toLocaleString()}/$1 (Settings).</p>
          )}
        </div>
      </section>

      {/* 5. Features */}
      <section aria-labelledby="features-h" className="space-y-3">
        <h2 id="features-h" className="text-xs font-semibold uppercase tracking-wider text-slate-500">5 · Features</h2>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((ft) => {
            const on = f.features.includes(ft);
            return (
              <button key={ft} type="button" aria-pressed={on}
                onClick={() => set("features", on ? f.features.filter((x) => x !== ft) : [...f.features, ft])}
                className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-slate-700"}`}>
                {on ? "✓ " : ""}{ft}
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Status */}
      <section aria-labelledby="status-h" className="space-y-4">
        <h2 id="status-h" className="text-xs font-semibold uppercase tracking-wider text-slate-500">6 · Status & inspection</h2>
        <Segmented id="status" value={f.status} onChange={(v) => set("status", v)} options={[
          { v: "available", label: "On Ground" }, { v: "in_transit", label: "In Transit" },
          { v: "factory_order", label: "Factory Order" }, { v: "sold", label: "Sold" },
        ]} />
        {f.status === "in_transit" && (
          <label htmlFor="etaDate" className={label}>Vessel ETA at Nigerian port
            <input id="etaDate" type="date" className={input} value={f.etaDate} onChange={(e) => set("etaDate", e.target.value)} />
          </label>
        )}
        <label htmlFor="inspectionVerified" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          <input id="inspectionVerified" type="checkbox" className="h-5 w-5 accent-emerald-600"
            checked={f.inspectionVerified} onChange={(e) => set("inspectionVerified", e.target.checked)} />
          <span className="text-sm"><b>150-Point Inspection Verified</b> — shows the badge on the listing</span>
        </label>
      </section>

      {/* Sticky save bar (thumb-reachable on phones) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <p role="status" className={`min-w-0 flex-1 truncate text-sm ${state.kind === "error" ? "text-red-600" : "text-slate-600"}`}>
            {state.msg ?? (errors.length ? errors[0] : "Ready to publish")}
          </p>
          <button type="submit" disabled={state.kind === "saving"}
            className="rounded-md bg-emerald-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
            {state.kind === "saving" ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}
