import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getVehicleBySlug } from "@/lib/home-data";
import { SiteHeader } from "@/components/home/SiteHeader";
import DepositCheckout from "@/components/checkout/DepositCheckout";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic"; // always check availability at checkout time

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vehicle } = await getVehicleBySlug((await params).slug);
  return { title: vehicle ? `Reserve ${vehicle.title} · Cars Direct` : "Reserve · Cars Direct", robots: { index: false } };
}

export default async function ReservePage({ params }: Props) {
  const { slug } = await params;
  const { vehicle: v, ngnPerUsd, isSample } = await getVehicleBySlug(slug);
  if (!v) notFound();
  if (v.status === "sold" || v.status === "reserved") redirect(`/vehicles/${slug}`);

  const cover = v.images.find((i) => i.category === "exterior" && !i.isPdf)?.url ?? null;
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <Link href={`/vehicles/${slug}`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-700 hover:text-ink">
            <ArrowLeft aria-hidden className="h-4 w-4" /> Back to {v.title}
          </Link>
        </div>
        <DepositCheckout
          ngnPerUsd={ngnPerUsd}
          demoMode={isSample}
          vehicle={{ id: v.id, title: v.title, coverUrl: cover, condition: v.condition, powertrain: v.powertrain,
            status: v.status, etaDate: v.etaDate, priceKobo: v.priceKobo }}
        />
      </main>
    </>
  );
}
