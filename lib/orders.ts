import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { notifyPaymentConfirmed } from "@/lib/notify";

export type OrderStatus =
  | "pending_deposit" | "deposit_paid" | "procuring" | "shipped" | "arrived_port" | "in_abuja_inspection"
  | "balance_due" | "balance_paid" | "delivered" | "cancelled" | "refunded" | "refund_pending";

/** Buyer-facing words for each stage. Admin screens reuse the labels. */
export const STATUS_COPY: Record<OrderStatus, { label: string; headline: string; body: string }> = {
  pending_deposit: { label: "Awaiting deposit", headline: "Your deposit hasn't arrived yet", body: "If you've just paid, this page updates within a few minutes. Bank transfers can take longer." },
  deposit_paid: { label: "Deposit paid", headline: "Your car is reserved", body: "We've received your 40% deposit. We'll confirm the next step with the factory or seller within one working day." },
  procuring: { label: "Sourcing", headline: "We're securing your car", body: "We're buying the car from the factory or certified seller and booking it onto a vessel." },
  shipped: { label: "Shipped", headline: "Your car is on the water", body: "Shipping from China to Lagos takes 30 to 45 days. We'll update you when it reaches port." },
  arrived_port: { label: "At port", headline: "Your car has reached Lagos", body: "We're clearing customs, then trucking it to Abuja. This usually takes 7 to 14 days." },
  in_abuja_inspection: { label: "Inspecting", headline: "Your car is in Abuja", body: "We're running the pre-delivery inspection. You're welcome to attend; message us to book a time." },
  balance_due: { label: "Balance due", headline: "Your car passed inspection", body: "Pay the 60% balance to book your hand-over." },
  balance_paid: { label: "Balance paid", headline: "Paid in full", body: "We'll contact you to arrange the hand-over, plates and papers." },
  delivered: { label: "Delivered", headline: "Enjoy your new car", body: "Thank you for buying with Cars Direct." },
  refund_pending: { label: "Refund due", headline: "This car was reserved moments before your payment", body: "Another buyer's deposit arrived first. Your deposit will be refunded in full; we'll contact you about refund timing or a similar car." },
  cancelled: { label: "Cancelled", headline: "This order was cancelled", body: "No deposit was taken. Message us if you'd like to reserve another car." },
  refunded: { label: "Refunded", headline: "Your deposit has been refunded", body: "Message us if the refund hasn't reached your account." },
};

/** The happy path, in order, for the tracking timeline. */
export const JOURNEY: OrderStatus[] = [
  "deposit_paid", "procuring", "shipped", "arrived_port", "in_abuja_inspection", "balance_due", "balance_paid", "delivered",
];

export interface OrderView {
  id: string; orderNumber: string; status: OrderStatus; accessToken: string;
  customerName: string; customerEmail: string; customerPhone: string;
  priceKobo: number; depositKobo: number; balanceKobo: number;
  readyFrom: string | null; readyTo: string | null; createdAt: string;
  vehicle: { title: string; slug: string; powertrain: string };
  payments: { kind: "deposit" | "balance"; amountKobo: number; status: string; paidAt: string | null; channel: string | null; reference: string }[];
  events: { status: OrderStatus; at: string }[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toView(o: any): OrderView {
  return {
    id: o.id, orderNumber: o.order_number, status: o.status, accessToken: o.access_token,
    customerName: o.customer_name, customerEmail: o.customer_email, customerPhone: o.customer_phone,
    priceKobo: o.price_kobo, depositKobo: o.deposit_kobo, balanceKobo: o.balance_kobo,
    readyFrom: o.expected_ready_from, readyTo: o.expected_ready_to, createdAt: o.created_at,
    vehicle: { title: o.vehicles?.title ?? "Vehicle", slug: o.vehicles?.slug ?? "", powertrain: o.vehicles?.powertrain ?? "" },
    payments: (o.payments ?? []).map((p: { kind: "deposit" | "balance"; amount_kobo: number; status: string; paid_at: string | null; channel: string | null; provider_reference: string }) => ({
      kind: p.kind, amountKobo: p.amount_kobo, status: p.status, paidAt: p.paid_at, channel: p.channel, reference: p.provider_reference,
    })),
    events: [...(o.order_events ?? [])]
      .sort((a: { created_at: string }, b: { created_at: string }) => a.created_at.localeCompare(b.created_at))
      .map((e: { status: OrderStatus; created_at: string }) => ({ status: e.status, at: e.created_at })),
  };
}

const ORDER_SELECT =
  "id, order_number, status, access_token, customer_name, customer_email, customer_phone, price_kobo, deposit_kobo, balance_kobo, expected_ready_from, expected_ready_to, created_at, vehicles(title, slug, powertrain), payments(kind, amount_kobo, status, paid_at, channel, provider_reference), order_events(status, created_at)";

/** Buyer lookup by the secret token in their tracking link. Service role: buyers have no account. */
export async function getOrderByToken(token: string): Promise<OrderView | null> {
  if (!UUID.test(token)) return null;
  const { data } = await supabaseAdmin().from("orders").select(ORDER_SELECT).eq("access_token", token).maybeSingle();
  return data ? toView(data) : null;
}

export async function getOrderById(id: string): Promise<OrderView | null> {
  if (!UUID.test(id)) return null;
  const { data } = await supabaseAdmin().from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  return data ? toView(data) : null;
}

/**
 * When Paystack sends the buyer back (?reference=...), confirm the payment right away
 * instead of waiting for the webhook. Same checks as the webhook; safe to run twice.
 */
export async function confirmReturnedPayment(order: OrderView, reference: string) {
  const pay = order.payments.find((p) => p.reference === reference);
  if (!pay || pay.status === "success") return false;
  try {
    const tx = await verifyTransaction(reference);
    if (tx.status !== "success" || tx.currency !== "NGN") return false;
    const { error } = await supabaseAdmin().rpc("confirm_payment", {
      p_reference: tx.reference, p_amount_kobo: tx.amount, p_channel: tx.channel, p_raw: tx,
    });
    if (!error) await notifyPaymentConfirmed(tx.reference).catch(() => {});
    return !error;
  } catch {
    return false; // the webhook will still arrive
  }
}
