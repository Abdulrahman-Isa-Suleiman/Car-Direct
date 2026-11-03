import Link from "next/link";
import { SiteHeader } from "@/components/home/SiteHeader";

export default function VehicleNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-semibold">This car is no longer listed</h1>
        <p className="mt-3 text-slate-600">It may have been sold or the link is out of date.</p>
        <Link href="/vehicles" className="mt-8 inline-flex min-h-[48px] items-center rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700">
          Browse current stock
        </Link>
      </main>
    </>
  );
}
