import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/pricing";
import { STATUS_COPY, type OrderStatus } from "@/lib/orders";
import { NEEDS_ACTION } from "@/lib/order-flow";
import { StatusPill } from "./StatusPill";

const TABS: { v: string; label: string; statuses?: OrderStatus[] }[] = [
  { v: "", label: "Needs action", statuses: NEEDS_ACTION },
  { v: "transit", label: "Sourcing & shipping", statuses: ["procuring", "shipped", "arrived_port"] },
  { v: "unpaid", label: "Awaiting deposit", statuses: ["pending_deposit"] },
  { v: "done", label: "Delivered", statuses: ["delivered"] },
  { v: "closed", label: "Cancelled & refunded", statuses: ["cancelled", "refunded"] },
  { v: "all", label: "All" },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { sb } = await requireAdmin();
  const { tab = "" } = await searchParams;
  const t = TABS.find((x) => x.v === tab) ?? TABS[0];
  let q = sb.from("orders").select("id, order_number, status, customer_name, customer_phone, price_kobo, balance_kobo, created_at, updated_at, vehicles(title)")
    .order("updated_at", { ascending: false }).limit(200);
  if (t.statuses) q = q.in("status", t.statuses);
  const { data: orders } = await q;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Orders</h1>
      <nav aria-label="Order groups" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((x) => (
          <Link key={x.v} href={x.v ? `/admin/orders?tab=${x.v}` : "/admin/orders"} aria-current={t.v === x.v ? "page" : undefined}
            className={`inline-flex min-h-[40px] items-center rounded-full border px-4 text-sm font-medium ${t.v === x.v ? "border-ink bg-ink text-white" : "border-slate-300 bg-white text-slate-700"}`}>
            {x.label}
          </Link>
        ))}
      </nav>
      {orders?.length ? (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
          <table className="w-full min-w-[720px] text-left text-[15px]">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Vehicle</th><th className="px-4 py-3 font-medium">Buyer</th><th className="px-4 py-3 font-medium">Stage</th><th className="px-4 py-3 text-right font-medium">Balance</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="tabular font-medium text-emerald-700 hover:underline">{o.order_number}</Link></td>
                  <td className="px-4 py-3">{(o.vehicles as unknown as { title: string } | null)?.title}</td>
                  <td className="px-4 py-3">{o.customer_name}<br /><span className="tabular text-sm text-slate-500">{o.customer_phone}</span></td>
                  <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                  <td className="tabular px-4 py-3 text-right">{formatMoney(o.balance_kobo, "NGN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          No orders in &ldquo;{t.label}&rdquo;.{t.v === "" && " Nothing needs your attention right now."}
        </p>
      )}
      <p className="mt-4 text-sm text-slate-500">Stages: {Object.values(STATUS_COPY).map((s) => s.label).join(" · ")}</p>
    </main>
  );
}
