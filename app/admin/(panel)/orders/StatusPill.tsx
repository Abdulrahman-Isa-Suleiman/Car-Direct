import { STATUS_COPY, type OrderStatus } from "@/lib/orders";

const TONE: Partial<Record<OrderStatus, string>> = {
  pending_deposit: "bg-slate-100 text-slate-700", deposit_paid: "bg-emerald-50 text-emerald-800",
  procuring: "bg-amber-50 text-amber-800", shipped: "bg-sky-50 text-sky-800", arrived_port: "bg-sky-50 text-sky-800",
  in_abuja_inspection: "bg-violet-50 text-violet-800", balance_due: "bg-amber-100 text-amber-900",
  balance_paid: "bg-emerald-100 text-emerald-900", delivered: "bg-emerald-600 text-white",
  refund_pending: "bg-red-100 text-red-800", cancelled: "bg-slate-100 text-slate-500", refunded: "bg-slate-100 text-slate-500",
};

export function StatusPill({ status }: { status: string }) {
  const s = status as OrderStatus;
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${TONE[s] ?? "bg-slate-100"}`}>{STATUS_COPY[s]?.label ?? status}</span>;
}
