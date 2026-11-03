import Link from "next/link";
import { ShieldCheck, ClipboardCheck, CreditCard, MapPin, ArrowRight, MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/site";

/* ---------- Trust strip: sits directly under the hero ---------- */
const TRUST = [
  { icon: ClipboardCheck, title: "150-point inspection", body: "Every car is checked in China and again in Abuja, with a battery health report." },
  { icon: ShieldCheck, title: "Protected deposit", body: "Refunded if the car fails our Abuja inspection or misses the delivery window." },
  { icon: CreditCard, title: "Pay in naira", body: "Bank transfer, card or USSD through Paystack. Prices fixed in naira on the day you reserve." },
  { icon: MapPin, title: "Hand-over in Abuja", body: "Plates, papers and a walkthrough at our showroom." },
];

export function TrustStrip() {
  return (
    <section aria-label="Why buy from Cars Direct" className="border-b border-slate-200 bg-white">
      <ul className="mx-auto grid max-w-7xl gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4 bg-white px-4 py-7 sm:px-6">
            <Icon aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" strokeWidth={1.75} />
            <div>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-[15px] text-slate-600">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- How it works: a real 4-step sequence ---------- */
const STEPS = [
  { title: "Reserve with 40%", body: "Choose a car and pay the deposit online. You get an order number and a delivery window straight away." },
  { title: "We source and ship", body: "We buy from the factory or certified seller, then ship from China to Lagos. Shipping takes 30 to 45 days." },
  { title: "Inspect in Abuja", body: "Once the car clears customs we truck it to Abuja and run the pre-delivery inspection. You can attend." },
  { title: "Pay 60% and drive", body: "Pay the balance only after the car passes inspection. Then you take the keys." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-h" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 id="how-h" className="font-display text-3xl font-semibold sm:text-4xl">From the factory floor to your driveway</h2>
          <p className="mt-3 text-lg text-slate-600">You never pay in full for a car you haven&apos;t seen.</p>
        </div>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative border-t-2 border-slate-200 pt-6 first:border-emerald-600">
              <span className="tabular font-display text-4xl font-semibold text-slate-300">{i + 1}</span>
              <h3 className="mt-2 text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-[15px] text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl bg-mist p-5 sm:p-6">
          <div className="flex h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-300" aria-hidden>
            <span className="w-[40%] bg-emerald-600" />
          </div>
          <p className="tabular text-[15px] text-slate-700">
            On a <b>₦48,500,000</b> car you pay <b className="text-emerald-700">₦19,400,000</b> today and <b>₦29,100,000</b> at hand-over.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Powertrain guide: the question every buyer asks ---------- */
const POWERTRAINS = [
  { code: "EREV", name: "Extended-range electric", how: "Wheels are always driven by the electric motor. A small petrol engine only charges the battery.",
    fit: "Best for Abuja–Kaduna or Abuja–Lagos trips. Charge at home on generator or grid, buy fuel when you need range.", range: "180–280 km electric, 1,000 km+ total" },
  { code: "PHEV", name: "Plug-in hybrid", how: "Electric for daily driving, and the petrol engine can drive the wheels directly at speed.",
    fit: "Familiar to drive and refuel anywhere. Lowest price of the three for a large SUV.", range: "50–120 km electric, 900 km+ total" },
  { code: "BEV", name: "Battery electric", how: "Battery and motor only. No engine, no oil changes, no fuel.",
    fit: "Ideal for city driving with home charging. Public fast chargers in Abuja are still few.", range: "400–600 km per charge" },
];

export function PowertrainGuide() {
  return (
    <section id="powertrains" aria-labelledby="pt-h" className="scroll-mt-20 bg-ink py-16 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 id="pt-h" className="font-display text-3xl font-semibold sm:text-4xl">EREV, PHEV or BEV?</h2>
          <p className="mt-3 text-lg text-slate-300">Which one suits you depends on how you drive and where you can charge.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {POWERTRAINS.map((p) => (
            <article key={p.code} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-4xl font-semibold text-emerald-400">{p.code}</span>
                <span className="text-sm text-slate-400">{p.name}</span>
              </div>
              <p className="text-[15px] text-slate-300">{p.how}</p>
              <p className="text-[15px] text-white">{p.fit}</p>
              <p className="tabular mt-auto border-t border-white/10 pt-4 text-sm text-slate-400">Typical: {p.range}</p>
              <Link href={`/vehicles?powertrain=${p.code}`}
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-white">
                Browse {p.code} models <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-400">Chinese spec sheets quote CLTC range. Expect roughly 20–30% less in real Abuja driving with the AC on.</p>
      </div>
    </section>
  );
}

/* ---------- Closing CTA + footer ---------- */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-h" className="bg-white py-16 sm:py-24">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="cta-h" className="font-display text-3xl font-semibold sm:text-4xl">Looking for a specific model?</h2>
          <p className="mt-3 text-lg text-slate-600">Tell us the make, trim and colour. We&apos;ll quote you a factory order.</p>
        </div>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener"
          className="inline-flex min-h-[52px] shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-emerald-700">
          <MessageCircle aria-hidden className="h-5 w-5" /> Request a quote
        </a>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-mist" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm text-slate-600 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-display text-xl font-semibold text-ink">Cars Direct</p>
          <p className="mt-2">EVs and hybrids imported direct from China, delivered in Abuja.</p>
        </div>
        <nav aria-label="Footer" className="grid gap-2">
          <Link href="/vehicles" className="hover:text-ink">All vehicles</Link>
          <Link href="/vehicles?status=available" className="hover:text-ink">On ground in Abuja</Link>
          <Link href="/vehicles?condition=fairly_used" className="hover:text-ink">Fairly used 2020+</Link>
          <Link href="/#how-it-works" className="hover:text-ink">How the 40% deposit works</Link>
          <Link href="/#powertrains" className="hover:text-ink">EREV vs PHEV vs BEV</Link>
          <Link href="/terms/deposit" className="hover:text-ink">Deposit terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy policy</Link>
        </nav>
        <p>Showroom address, RC number and phone go here.</p>
      </div>
    </footer>
  );
}
