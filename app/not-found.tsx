import Link from "next/link";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/Sections";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="tabular text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-slate-600">The link may be out of date, or the car may have been sold.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/vehicles" className="inline-flex min-h-[48px] items-center rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700">Browse current stock</Link>
          <Link href="/" className="inline-flex min-h-[48px] items-center rounded-xl border border-slate-300 px-6 font-medium hover:border-slate-400">Home</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
