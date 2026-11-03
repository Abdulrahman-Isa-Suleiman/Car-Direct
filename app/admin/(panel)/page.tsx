import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/pricing";
import { ACTIVE, ADMIN_HINT, NEEDS_ACTION } from "@/lib/order-flow";
import type { OrderStatus } from "@/lib/orders";
import { StatusPill } from "./orders/StatusPill";

export default async function Dashboard() {
  const { sb, name } = await requireAdmin();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [{ data: cars }, { data: deposits }, { data: active }, { data: todo }] = await Promise.all([
    sb.from("vehicles").select("status"),
    sb.from("payments").select("amount_kobo").eq("kind", "deposit").eq("status", "success").gte("paid_at", monthStart),
    sb.from("orders").select("balance_kobo").in("status", ACTIVE),
    sb.from("orders").select("id, order_number, status, customer_name, updated_at, vehicles(title)").in("status", NEEDS_ACTION).order("updated_at").limit(20),
  ]);
  const n = (s: string) => (cars ?? []).filter((c) => c.status === s).length;
  const sum = (rows: { [k: string]: number }[] | null, k: string) => (rows ?? []).reduce((a, r) => a + (r[k] ?? 0), 0);
  const kpis = [
    { label: "On ground", value: String(n("available")) },
    { label: "In transit", value: String(n("in_transit")) },
    { label: "Deposits this month", value: formatMoney(sum(deposits, "amount_kobo"), "NGN", { compact: true }) },
    { label: "Balances to collect", value: formatMoney(sum(active, "balance_kobo"), "NGN", { compact: true }) },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Good day, {name.split(" ")[0]}</h1>
      <dl className="tabular mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-5">
            <dt className="text-sm text-slate-600">{k.label}</dt><dd className="mt-1 text-2xl font-semibold">{k.value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="todo-h" className="mt-8 rounded-2xl bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="todo-h" className="text-lg font-medium">Needs your attention</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-emerald-700 hover:underline">All orders</Link>
        </div>
        {todo?.length ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {todo.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 py-2 hover:bg-slate-50">
                  <span><span className="tabular font-medium">{o.order_number}</span> · {(o.vehicles as unknown as { title: string } | null)?.title} · {o.customer_name}</span>
                  <span className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">{ADMIN_HINT[o.status as OrderStatus]?.split(".")[0]}</span><StatusPill status={o.status} /></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-slate-600">Nothing waiting. New deposits and cars passing inspection show up here.</p>}
      </section>
    </main>
  );
}
