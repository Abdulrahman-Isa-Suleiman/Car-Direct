import Image from "next/image";
import Link from "next/link";
import { getHomeData } from "@/lib/home-data";
import { SiteHeader } from "@/components/home/SiteHeader";
import { HeroFinder } from "@/components/home/HeroFinder";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { TrustStrip, HowItWorks, PowertrainGuide, FinalCta, SiteFooter } from "@/components/home/Sections";

export const revalidate = 300; // refresh stock every 5 minutes

const HERO_IMAGE = process.env.NEXT_PUBLIC_HERO_IMAGE; // e.g. a Supabase public URL or /images/hero.webp

export default async function HomePage() {
  const { vehicles, ngnPerUsd, isSample } = await getHomeData();

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero: one job, getting a buyer from "curious" to a filtered list */}
        <section className="relative isolate overflow-hidden bg-ink text-white">
          {HERO_IMAGE && (
            <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-50" />
          )}
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_85%_20%,rgba(4,120,87,.35),transparent_60%),linear-gradient(180deg,rgba(15,23,42,.2),#0F172A_92%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
            <div className="animate-rise">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-400">Direct from China · Delivered in Abuja</p>
              <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                The new electric class. Reserved with 40%.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-300">
                Brand new and certified 2020+ EREVs, plug-in hybrids and EVs, inspected twice. Pay the balance only when
                your car has passed inspection in Abuja.
              </p>
              <Link href="#how-it-works" className="mt-6 inline-flex min-h-[44px] items-center text-[15px] font-medium text-white underline decoration-emerald-400 underline-offset-4 hover:decoration-2">
                How the 40% deposit works
              </Link>
            </div>
            <div className="animate-rise [animation-delay:120ms]">
              <HeroFinder count={vehicles.length} />
            </div>
          </div>
        </section>

        <TrustStrip />
        <FeaturedVehicles vehicles={vehicles} ngnPerUsd={ngnPerUsd} isSample={isSample} />
        <HowItWorks />
        <PowertrainGuide />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
