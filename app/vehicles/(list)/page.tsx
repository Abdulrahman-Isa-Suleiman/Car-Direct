import type { Metadata } from "next";
import { Suspense } from "react";
import { RememberListing } from "@/components/detail/BackToResults";
import Link from "next/link";
import { ArrowDown, MessageCircle } from "lucide-react";
import { getInventory } from "@/lib/home-data";
import { parseFilters, toQuery, activeCount, STATUS_LABEL, type Filters } from "@/lib/listing";
import { WHATSAPP_URL } from "@/lib/site";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/Sections";
import { VehicleCard } from "@/components/home/VehicleCard";
import { FilterSidebar, ListingToolbar } from "@/components/listing/ListingControls";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Page title follows the filters, so a shared WhatsApp link previews as e.g. "Brand New EREVs". */
function describe(f: Filters) {
  const cond = f.condition === "brand_new" ? "Brand New " : f.condition === "fairly_used" ? "Fairly Used " : "";
  const pt = f.powertrain.length === 1 ? `${f.powertrain[0]}s` : "EVs & hybrids";
  const st = f.status.length === 1 ? ` · ${STATUS_LABEL[f.status[0]]}` : "";
  return `${cond}${pt}${st}`;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  return {
    title: `${describe(f)} in Abuja · Cars Direct`,
    description: "Reserve with a 40% deposit. Pay the balance after inspection in Abuja.",
  };
}

export default async function VehiclesPage({ searchParams }: Props) {
  const f = parseFilters(await searchParams);
  const { vehicles, total, ngnPerUsd, isSample } = await getInventory(f);
  const hasMore = vehicles.length < total;

  return (
    <>
      <SiteHeader />
      <Suspense><RememberListing /></Suspense>
      <main className="bg-white">
        <div className="border-b border-slate-200 bg-mist">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-500">
              <ol className="flex gap-2"><li><Link href="/" className="hover:text-ink">Home</Link></li><li aria-hidden>/</li><li aria-current="page" className="text-ink">Inventory</li></ol>
            </nav>
            <h1 className="font-display text-3xl font-semibold sm:text-5xl">{describe(f)}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Every car shows the 40% deposit you pay to reserve it. The balance is due after it passes inspection in Abuja.
              {isSample && " Sample listings shown until inventory is connected."}
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
          <FilterSidebar f={f} />

          <section aria-label="Results" className="grid content-start gap-6">
            <ListingToolbar f={f} total={total} />

            {vehicles.length > 0 ? (
              <>
                <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {vehicles.map((v) => <li key={v.id} className="flex"><VehicleCard v={v} ngnPerUsd={ngnPerUsd} /></li>)}
                </ul>
                {hasMore && (
                  <Link href={`/vehicles${toQuery({ ...f, page: f.page + 1 })}`} scroll={false}
                    className="tabular mx-auto inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-300 px-6 font-medium hover:border-slate-400">
                    Show more <span className="text-slate-500">({vehicles.length} of {total})</span>
                    <ArrowDown aria-hidden className="h-4 w-4" />
                  </Link>
                )}
              </>
            ) : (
              <EmptyState f={f} />
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState({ f }: { f: Filters }) {
  const clear = { ...f, condition: undefined, powertrain: [], status: [], depositMin: undefined, depositMax: undefined,
    yearMin: undefined, kmMax: undefined, rangeMin: undefined, page: 1 };
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
      <h2 className="text-xl font-medium">No cars match all {activeCount(f)} filters</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        Try removing one, or ask us to source it. Most Chinese models can be factory-ordered and delivered in 7 to 12 weeks.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/vehicles${toQuery(clear)}`}
          className="inline-flex min-h-[48px] items-center rounded-xl border border-slate-300 px-5 font-medium hover:border-slate-400">
          Clear all filters
        </Link>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700">
          <MessageCircle aria-hidden className="h-5 w-5" /> Ask us to source it
        </a>
      </div>
    </div>
  );
}
