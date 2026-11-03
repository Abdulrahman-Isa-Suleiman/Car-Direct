import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, Circle, CircleDot } from "lucide-react";
import { getRelated, getVehicleBySlug, type DetailVehicle } from "@/lib/home-data";
import { estimateReadyWindow, formatMoney, TIMELINE_DAYS } from "@/lib/pricing";
import { SITE_URL, whatsappWith } from "@/lib/site";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/Sections";
import { VehicleCard } from "@/components/home/VehicleCard";
import { Gallery } from "@/components/detail/Gallery";
import { MobileReserveBar, PricePanel } from "@/components/detail/PricePanel";
import { BackToResults } from "@/components/detail/BackToResults";
import { VehicleJsonLd } from "@/components/detail/VehicleJsonLd";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vehicle: v } = await getVehicleBySlug((await params).slug);
  if (!v) notFound(); // runs before streaming starts, so the response is a real 404
  const deposit = formatMoney(v.depositKobo, "NGN");
  const cover = v.images.find((i) => i.category === "exterior" && !i.isPdf)?.url;
  return {
    title: `${v.title} · Reserve with ${deposit} · Cars Direct`,
    description: `${v.condition === "brand_new" ? "Brand new" : `Fairly used, ${v.mileageKm.toLocaleString("en-NG")} km`} ${v.powertrain}. Pay ${deposit} today, the balance after inspection in Abuja.`,
    openGraph: cover ? { images: [{ url: cover }] } : undefined, // WhatsApp link preview
  };
}

const fmtDate = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

/* ---------- Where this car is in the journey ---------- */
const STAGES = [
  { name: "Built at the factory", days: TIMELINE_DAYS.factoryProduction },
  { name: "Shipping from China to Lagos", days: TIMELINE_DAYS.oceanShipping },
  { name: "Customs clearing and truck to Abuja", days: TIMELINE_DAYS.clearingAndHaulage },
  { name: "Pre-delivery inspection in Abuja", days: TIMELINE_DAYS.abujaPdi },
  { name: "Hand-over and balance payment", days: null },
];
const CURRENT_STAGE = { factory_order: 0, in_transit: 1, available: 3, reserved: 3, sold: 4 } as const;

function Journey({ v }: { v: DetailVehicle }) {
  const at = CURRENT_STAGE[v.status];
  return (
    <ol className="grid gap-0">
      {STAGES.map((s, i) => {
        const state = i < at ? "done" : i === at ? "now" : "next";
        const Icon = state === "done" ? Check : state === "now" ? CircleDot : Circle;
        return (
          <li key={s.name} className="relative flex gap-4 pb-6 last:pb-0">
            {i < STAGES.length - 1 && (
              <span aria-hidden className={`absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${i < at ? "bg-emerald-600" : "bg-slate-200"}`} />
            )}
            <span className={`relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${state === "done" ? "bg-emerald-600 text-white" : state === "now" ? "bg-white text-emerald-700 ring-2 ring-emerald-600" : "bg-white text-slate-300 ring-2 ring-slate-200"}`}>
              <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div>
              <p className={`font-medium ${state === "next" ? "text-slate-500" : "text-ink"}`}>
                {s.name}
                {state === "now" && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">This car is here</span>}
              </p>
              {s.days && <p className="tabular text-sm text-slate-500">{s.days[0]}–{s.days[1]} days</p>}
              {i === 1 && v.status === "in_transit" && v.etaDate && (
                <p className="text-sm text-slate-600">Vessel due at port {fmtDate(new Date(v.etaDate))}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const CHECKS = (pt: DetailVehicle["powertrain"]) => [
  "Battery state of health and cell balance",
  "AC and DC charging test",
  ...(pt === "BEV" ? [] : ["Engine and generator under load"]),
  "Brakes, suspension and tyres",
  "ADAS sensors and cameras",
  "Paint depth, accident and flood check",
];

export default async function VehiclePage({ params }: Props) {
  const { slug } = await params;
  const { vehicle: v, ngnPerUsd, isSample } = await getVehicleBySlug(slug);
  if (!v) notFound();
  const related = await getRelated(v);

  const canReserve = v.status === "available" || v.status === "in_transit" || v.status === "factory_order";
  const unavailableLabel = v.status === "sold" ? "Sold" : "Reserved by another buyer";
  const win = canReserve ? estimateReadyWindow(v.status, new Date(), v.etaDate ? new Date(v.etaDate) : null) : null;
  const readyText = win ? `${fmtDate(win.from)} – ${fmtDate(win.to)} (${win.minDays}–${win.maxDays} days)` : "Not available";
  const wa = whatsappWith(`Hi Cars Direct, I'm interested in the ${v.title}: ${SITE_URL}/vehicles/${v.slug}`);
  const ptPlural = `${v.powertrain}s`;

  const specs = [
    { k: "Year", v: String(v.modelYear) },
    { k: "Mileage", v: `${v.mileageKm.toLocaleString("en-NG")} km` },
    { k: "Battery", v: v.batteryKwh ? `${v.batteryKwh} kWh` : "—" },
    { k: "Electric range", v: v.electricRangeKm ? `${v.electricRangeKm} km` : "—", note: v.rangeStandard },
    ...(v.powertrain === "BEV" ? [] : [{ k: "Total range", v: v.combinedRangeKm ? `${v.combinedRangeKm.toLocaleString("en-NG")} km` : "—", note: "with fuel" }]),
    { k: "Powertrain", v: v.powertrain },
  ];

  return (
    <>
      <VehicleJsonLd v={v} />
      <SiteHeader />
      <main className="bg-white pb-28 lg:pb-0">
        {/* Breadcrumbs connect detail → listing → home */}
        <div className="border-b border-slate-200">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
            <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-slate-500">
              <ol className="flex flex-wrap items-center gap-x-2">
                <li><Link href="/" className="hover:text-ink">Home</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/vehicles" className="hover:text-ink">Inventory</Link></li>
                <li aria-hidden>/</li>
                <li><Link href={`/vehicles?powertrain=${v.powertrain}`} className="hover:text-ink">{ptPlural}</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="truncate text-ink">{v.title}</li>
              </ol>
            </nav>
            <BackToResults />
          </div>
        </div>

        {!canReserve && (
          <p role="status" className="bg-amber-50 px-4 py-3 text-center text-[15px] text-amber-900">
            This {v.status === "sold" ? "car has been sold" : "car is reserved by another buyer"}. Similar cars are below, or we can source the same model for you.
          </p>
        )}

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          {/* A: gallery + title */}
          <div className="grid gap-6">
            <Gallery v={v} />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className={`rounded-full px-2.5 py-1 ${v.condition === "brand_new" ? "bg-ink text-white" : "border border-slate-300 text-slate-700"}`}>
                  {v.condition === "brand_new" ? "Brand New · 0 km" : `Fairly Used · ${v.modelYear}`}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 tracking-wide text-emerald-700">{v.powertrain}</span>
                {v.inspectionVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-2.5 py-1 text-gold">
                    <BadgeCheck aria-hidden className="h-4 w-4" /> {v.inspectionPoints}-Point Inspection Verified
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-5xl">{v.title}</h1>
              {v.description && <p className="mt-4 max-w-2xl text-lg text-slate-600">{v.description}</p>}
              {isSample && <p className="mt-3 text-sm text-slate-500">Sample listing shown until inventory is connected.</p>}
            </div>
          </div>

          {/* B: price panel, sticky beside the content on desktop */}
          <aside aria-label="Price and reservation" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              <PricePanel slug={v.slug} title={v.title} priceKobo={v.priceKobo} ngnPerUsd={ngnPerUsd} readyText={readyText}
                whatsappUrl={wa} canReserve={canReserve} unavailableLabel={unavailableLabel} />
              <p className="mt-4 text-sm text-slate-600">
                The deposit is refunded if the car fails our Abuja inspection.{" "}
                <Link href="/#how-it-works" className="font-medium text-emerald-700 underline-offset-4 hover:underline">How the 40% deposit works</Link>
              </p>
            </div>
          </aside>

          {/* C: details */}
          <div className="grid gap-12">
            <section aria-labelledby="specs-h">
              <h2 id="specs-h" className="text-xl font-medium">Key specs</h2>
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
                {specs.map((s) => (
                  <div key={s.k} className="bg-white p-4">
                    <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{s.k}</dt>
                    <dd className="tabular mt-1 text-lg font-medium">
                      {s.v}{s.note && <span className="ml-1.5 text-xs font-normal text-slate-500">{s.note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
              {v.rangeStandard === "CLTC" && (
                <p className="mt-3 text-sm text-slate-500">CLTC is China&apos;s test cycle. Expect roughly 20–30% less in Abuja driving with the AC on.</p>
              )}
            </section>

            {v.features.length > 0 && (
              <section aria-labelledby="features-h">
                <h2 id="features-h" className="text-xl font-medium">Features</h2>
                <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {v.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[15px]">
                      <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="grid gap-12 md:grid-cols-2">
              <section aria-labelledby="journey-h">
                <h2 id="journey-h" className="text-xl font-medium">Where this car is now</h2>
                <div className="mt-5"><Journey v={v} /></div>
              </section>
              {v.inspectionVerified && (
                <section aria-labelledby="insp-h" className="rounded-2xl bg-mist p-6">
                  <h2 id="insp-h" className="flex items-center gap-2 text-xl font-medium">
                    <BadgeCheck aria-hidden className="h-6 w-6 text-gold" /> {v.inspectionPoints}-point inspection
                  </h2>
                  <p className="mt-2 text-[15px] text-slate-600">Checked before shipping and again in Abuja before hand-over. Highlights:</p>
                  <ul className="mt-4 grid gap-2.5">
                    {CHECKS(v.powertrain).map((c) => (
                      <li key={c} className="flex items-start gap-3 text-[15px]">
                        <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> {c}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-h" className="border-t border-slate-200 bg-mist py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="related-h" className="font-display text-3xl font-semibold">Similar cars</h2>
                <Link href={`/vehicles?powertrain=${v.powertrain}`}
                  className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-600">
                  See all {ptPlural} <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => <li key={r.id} className="flex"><VehicleCard v={r} ngnPerUsd={ngnPerUsd} /></li>)}
              </ul>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
      <MobileReserveBar slug={v.slug} priceKobo={v.priceKobo} ngnPerUsd={ngnPerUsd} canReserve={canReserve} unavailableLabel={v.status === "sold" ? "Sold" : "Reserved"} />
    </>
  );
}
