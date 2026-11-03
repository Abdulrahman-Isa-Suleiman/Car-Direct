import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/pricing";
import { VehicleRow, type AdminVehicle } from "./VehicleRow";

const TABS = [
  { v: "", label: "All" }, { v: "available", label: "On ground" }, { v: "in_transit", label: "In transit" },
  { v: "factory_order", label: "Factory order" }, { v: "reserved", label: "Reserved" }, { v: "sold", label: "Sold" },
];

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { sb } = await requireAdmin();
  const { status = "" } = await searchParams;
  let q = sb.from("vehicles")
    .select("id, slug, title, condition, powertrain, model_year, price_kobo, deposit_kobo, status, eta_date, created_at, vehicle_images(path, category, sort_order)")
    .order("created_at", { ascending: false }).limit(200);
  if (TABS.some((t) => t.v === status && t.v)) q = q.eq("status", status);
  const { data: rows } = await q;
  const { data: counts } = await sb.from("vehicles").select("status");
  const count = (s: string) => (counts ?? []).filter((c) => !s || c.status === s).length;

  const vehicles: AdminVehicle[] = (rows ?? []).map((r) => {
    const cover = [...(r.vehicle_images ?? [])].filter((i) => i.category === "exterior").sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      id: r.id, slug: r.slug, title: r.title, condition: r.condition, powertrain: r.powertrain, modelYear: r.model_year,
      price: formatMoney(r.price_kobo, "NGN"), deposit: formatMoney(r.deposit_kobo, "NGN"), status: r.status, etaDate: r.eta_date,
      coverUrl: cover ? sb.storage.from("vehicle-images").getPublicUrl(cover.path).data.publicUrl : null,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Inventory</h1>
          <p className="mt-1 text-slate-600">Change a car&apos;s status here. The website updates within a minute.</p>
        </div>
        <Link href="/admin/vehicles/new" className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700">+ Add vehicle</Link>
      </div>
      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.v} href={t.v ? `/admin/vehicles?status=${t.v}` : "/admin/vehicles"} aria-current={status === t.v ? "page" : undefined}
            className={`tabular inline-flex min-h-[40px] items-center rounded-full border px-4 text-sm font-medium ${status === t.v ? "border-ink bg-ink text-white" : "border-slate-300 bg-white text-slate-700"}`}>
            {t.label} <span className="ml-1.5 opacity-60">{count(t.v)}</span>
          </Link>
        ))}
      </nav>
      {vehicles.length ? (
        <ul className="mt-6 grid gap-3">{vehicles.map((v) => <VehicleRow key={v.id} v={v} />)}</ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium">No vehicles {status ? "with this status" : "yet"}</p>
          <p className="mt-1 text-slate-600">Add your first car; it takes about two minutes.</p>
        </div>
      )}
    </main>
  );
}
