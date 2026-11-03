import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, CircleDot, Circle, MessageCircle } from "lucide-react";
import { confirmReturnedPayment, getOrderByToken, JOURNEY, STATUS_COPY, type OrderStatus } from "@/lib/orders";
import { formatMoney } from "@/lib/pricing";
import { whatsappWith } from "@/lib/site";
import { supabaseConfigured } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/home/SiteHeader";
import { PayBalanceButton } from "./PayBalanceButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order · Cars Direct", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ reference?: string; trxref?: string }> };

const fmt = (d: string) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
const naira = (k: number) => formatMoney(k, "NGN");
const OFF_PATH: OrderStatus[] = ["refund_pending", "cancelled", "refunded"];

export default async function OrderPage({ params, searchParams }: Props) {
  if (!supabaseConfigured()) notFound();
  const { token } = await params;
  const { reference } = await searchParams;
  let order = await getOrderByToken(token);
  if (!order) notFound();

  // Back from Paystack: confirm now, then drop the query string so a refresh doesn't re-verify.
  if (reference) {
    await confirmReturnedPayment(order, reference);
    redirect(`/orders/${token}`);
  }

  const copy = STATUS_COPY[order.status];
  const at = JOURNEY.indexOf(order.status);
  const offPath = OFF_PATH.includes(order.status);
  const when = (s: OrderStatus) => order!.events.find((e) => e.status === s)?.at;
  const deposit = order.payments.find((p) => p.kind === "deposit" && p.status === "success");
  const balance = order.payments.find((p) => p.kind === "balance" && p.status === "success");
  const wa = whatsappWith(`Hi Cars Direct, a question about order ${order.orderNumber} (${order.vehicle.title}).`);

  return (
    <>
      <SiteHeader />
      <main className="bg-mist pb-16">
        <section className="bg-ink text-white">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <p className="tabular text-sm text-slate-400">Order {order.orderNumber} · placed {fmt(order.createdAt)}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{copy.headline}</h1>
            <p className="mt-3 max-w-xl text-lg text-slate-300">{copy.body}</p>
            <p className="mt-5 text-[15px]">
              <Link href={`/vehicles/${order.vehicle.slug}`} className="font-medium text-emerald-300 underline-offset-4 hover:underline">{order.vehicle.title}</Link>
              <span className="text-slate-400"> · for {order.customerName}</span>
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-3xl gap-6 px-4 pt-8 sm:px-6">
          {/* Money */}
          <section aria-labelledby="pay-h" className="rounded-2xl bg-white p-6">
            <h2 id="pay-h" className="text-lg font-medium">Payments</h2>
            <dl className="tabular mt-4 grid gap-3 text-[15px]">
              <div className="flex justify-between gap-4"><dt className="text-slate-600">Vehicle price</dt><dd>{naira(order.priceKobo)}</dd></div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Deposit · 40%</dt>
                <dd className={deposit ? "text-emerald-700" : ""}>{naira(order.depositKobo)} {deposit ? `· paid ${fmt(deposit.paidAt!)}` : "· not received"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Balance · 60%</dt>
                <dd className={balance ? "text-emerald-700" : ""}>{naira(order.balanceKobo)} {balance ? `· paid ${fmt(balance.paidAt!)}` : "· due after inspection"}</dd>
              </div>
            </dl>
            {order.status === "balance_due" && <PayBalanceButton token={order.accessToken} amount={naira(order.balanceKobo)} />}
          </section>

          {/* Journey */}
          {!offPath && (
            <section aria-labelledby="track-h" className="rounded-2xl bg-white p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="track-h" className="text-lg font-medium">Progress</h2>
                {order.readyFrom && order.readyTo && !["balance_paid", "delivered"].includes(order.status) && (
                  <p className="tabular text-sm text-slate-600">Estimated ready in Abuja: {fmt(order.readyFrom)} – {fmt(order.readyTo)}</p>
                )}
              </div>
              <ol className="mt-5 grid">
                {JOURNEY.map((s, i) => {
                  const state = at < 0 ? "next" : i < at ? "done" : i === at ? "now" : "next";
                  const Icon = state === "done" ? Check : state === "now" ? CircleDot : Circle;
                  const t = when(s);
                  return (
                    <li key={s} className="relative flex gap-4 pb-5 last:pb-0">
                      {i < JOURNEY.length - 1 && <span aria-hidden className={`absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-0.5 ${i < at ? "bg-emerald-600" : "bg-slate-200"}`} />}
                      <span className={`relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${state === "done" ? "bg-emerald-600 text-white" : state === "now" ? "bg-white text-emerald-700 ring-2 ring-emerald-600" : "bg-white text-slate-300 ring-2 ring-slate-200"}`}>
                        <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4">
                        <p className={state === "next" ? "text-slate-500" : "font-medium"}>{STATUS_COPY[s].label}{state === "now" && <span className="sr-only"> (current)</span>}</p>
                        {t && state !== "next" && <p className="tabular text-sm text-slate-500">{fmt(t)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6">
            <p className="text-[15px] text-slate-600">Questions? Quote order <b className="tabular text-ink">{order.orderNumber}</b>.</p>
            <a href={wa} target="_blank" rel="noopener"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700">
              <MessageCircle aria-hidden className="h-5 w-5" /> Message us
            </a>
          </section>
          <p className="text-sm text-slate-500">Keep this link private: anyone with it can see this order. We emailed it to {order.customerEmail}.</p>
        </div>
      </main>
    </>
  );
}
