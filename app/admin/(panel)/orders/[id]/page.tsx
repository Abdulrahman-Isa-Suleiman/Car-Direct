import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getOrderById, STATUS_COPY } from "@/lib/orders";
import { ADMIN_HINT, NEXT } from "@/lib/order-flow";
import { formatMoney } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import { toIntlNg } from "@/lib/phone";
import { StatusPill } from "../StatusPill";
import { MoveButtons } from "./MoveButtons";
import { CopyLink } from "./CopyLink";
import { ManualPayment } from "./ManualPayment";

const fmt = (d: string) => new Date(d).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const naira = (k: number) => formatMoney(k, "NGN");

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { sb } = await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();
  const { data: extra } = await sb.from("orders").select("notes").eq("id", id).single();
  const trackUrl = `${SITE_URL}/orders/${order.accessToken}`;
  const waBuyer = `https://wa.me/${toIntlNg(order.customerPhone)}?text=${encodeURIComponent(`Hello ${order.customerName}, this is Cars Direct about order ${order.orderNumber}. Track it here: ${trackUrl}`)}`;
  const paidKobo = order.payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amountKobo, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/admin/orders" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-700 hover:text-ink">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="tabular font-display text-3xl font-semibold">{order.orderNumber}</h1>
        <StatusPill status={order.status} />
      </div>
      <p className="mt-1 text-slate-600">
        <Link href={`/vehicles/${order.vehicle.slug}`} target="_blank" className="font-medium text-emerald-700 hover:underline">{order.vehicle.title}</Link> · placed {fmt(order.createdAt)}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-6">
          <section aria-labelledby="next-h" className="rounded-2xl bg-white p-6">
            <h2 id="next-h" className="text-lg font-medium">Next step</h2>
            <p className="mt-1 text-[15px] text-slate-600">{ADMIN_HINT[order.status]}</p>
            <MoveButtons orderId={order.id} options={NEXT[order.status] ?? []} />
            {order.status === "balance_due" && (
              <a href={`https://wa.me/${toIntlNg(order.customerPhone)}?text=${encodeURIComponent(`Hello ${order.customerName}, good news: your ${order.vehicle.title} has passed inspection in Abuja. The balance of ${naira(order.balanceKobo)} is now due. Pay securely here: ${trackUrl}`)}`}
                target="_blank" rel="noopener"
                className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-emerald-600 px-5 font-semibold text-emerald-700 hover:bg-emerald-50">
                <MessageCircle aria-hidden className="h-5 w-5" /> Send balance request on WhatsApp
              </a>
            )}
            {(order.status === "pending_deposit" || order.status === "balance_due") && (
              <ManualPayment orderId={order.id}
                label={order.status === "pending_deposit" ? "deposit" : "balance"}
                amount={naira(order.status === "pending_deposit" ? order.depositKobo : order.balanceKobo)} />
            )}
          </section>

          <section aria-labelledby="pay-h" className="rounded-2xl bg-white p-6">
            <h2 id="pay-h" className="text-lg font-medium">Payments</h2>
            <dl className="tabular mt-4 grid grid-cols-3 gap-4 text-[15px]">
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Price</dt><dd className="mt-1 font-medium">{naira(order.priceKobo)}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Paid</dt><dd className="mt-1 font-medium text-emerald-700">{naira(paidKobo)}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Outstanding</dt><dd className="mt-1 font-medium">{naira(Math.max(0, order.priceKobo - paidKobo))}</dd></div>
            </dl>
            {order.payments.length > 0 && (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2 font-medium">Type</th><th className="py-2 font-medium">Amount</th><th className="py-2 font-medium">Status</th><th className="py-2 font-medium">Paid</th><th className="py-2 font-medium">Reference</th></tr></thead>
                  <tbody className="tabular">
                    {order.payments.map((p) => (
                      <tr key={p.reference} className="border-t border-slate-100">
                        <td className="py-2 capitalize">{p.kind}</td><td className="py-2">{naira(p.amountKobo)}</td>
                        <td className={`py-2 ${p.status === "success" ? "text-emerald-700" : "text-slate-500"}`}>{p.status}{p.channel ? ` · ${p.channel}` : ""}</td>
                        <td className="py-2">{p.paidAt ? fmt(p.paidAt) : "—"}</td><td className="py-2 font-mono text-xs">{p.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="hist-h" className="rounded-2xl bg-white p-6">
            <h2 id="hist-h" className="text-lg font-medium">History</h2>
            <ol className="mt-4 grid gap-2 text-[15px]">
              {order.events.map((e, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-x-4"><span>{STATUS_COPY[e.status]?.label ?? e.status}</span><span className="tabular text-sm text-slate-500">{fmt(e.at)}</span></li>
              ))}
            </ol>
            {extra?.notes && <pre className="mt-5 whitespace-pre-wrap rounded-lg bg-mist p-3 font-sans text-sm text-slate-700">{extra.notes}</pre>}
          </section>
        </div>

        <aside aria-label="Buyer" className="grid content-start gap-6">
          <section className="rounded-2xl bg-white p-6">
            <h2 className="text-lg font-medium">{order.customerName}</h2>
            <p className="tabular mt-1 text-[15px] text-slate-600">{order.customerPhone}<br />{order.customerEmail}</p>
            <a href={waBuyer} target="_blank" rel="noopener"
              className="mt-4 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700">
              <MessageCircle aria-hidden className="h-5 w-5" /> WhatsApp buyer
            </a>
          </section>
          <section className="rounded-2xl bg-white p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Buyer&apos;s tracking link</h2>
            <CopyLink url={trackUrl} />
            <p className="mt-2 text-xs text-slate-500">Anyone with this link can see the order. Only send it to the buyer.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
