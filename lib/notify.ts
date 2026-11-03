import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import { STATUS_COPY, type OrderStatus } from "@/lib/orders";

/**
 * Email via Resend (https://resend.com). Set RESEND_API_KEY, EMAIL_FROM ("Cars Direct <orders@yourdomain>")
 * and ADMIN_EMAIL. Without them, messages are logged and skipped so nothing else breaks.
 */
async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!key || !from || !to) { console.info(`[notify] email skipped (not configured): ${subject} → ${to}`); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) console.error(`[notify] email failed ${res.status}: ${subject} → ${to}`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const naira = (k: number) => formatMoney(k, "NGN");

function layout(title: string, body: string, cta?: { href: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;background:#F1F4F7;font-family:Helvetica,Arial,sans-serif;color:#0F172A">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:12px" cellpadding="0" cellspacing="0">
  <tr><td style="background:#0F172A;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;font-size:20px;font-weight:bold">Cars Direct</td></tr>
  <tr><td style="padding:24px"><h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>${body}
  ${cta ? `<p style="margin:24px 0 0"><a href="${cta.href}" style="background:#047857;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block">${esc(cta.label)}</a></p>` : ""}
  </td></tr></table></td></tr></table></body></html>`;
}

type OrderRow = { id: string; order_number: string; access_token: string; status: OrderStatus; customer_name: string; customer_email: string; deposit_kobo: number; balance_kobo: number; vehicles: { title: string } | null };

async function loadOrder(orderId: string) {
  const { data } = await supabaseAdmin().from("orders")
    .select("id, order_number, access_token, status, customer_name, customer_email, deposit_kobo, balance_kobo, vehicles(title)")
    .eq("id", orderId).single();
  return data as unknown as OrderRow | null;
}

/** Call after any payment is confirmed (webhook, Paystack return, manual transfer). Sends at most once per payment. */
export async function notifyPaymentConfirmed(reference: string) {
  const admin = supabaseAdmin();
  // Atomic claim: only the first caller gets a row back.
  const { data: claimed } = await admin.from("payments").update({ notified_at: new Date().toISOString() })
    .eq("provider_reference", reference).eq("status", "success").is("notified_at", null)
    .select("order_id, kind, amount_kobo").maybeSingle();
  if (!claimed) return;
  const o = await loadOrder(claimed.order_id);
  if (!o) return;
  const car = o.vehicles?.title ?? "your car";
  const track = { href: `${SITE_URL}/orders/${o.access_token}`, label: "Track your order" };
  const adminTo = process.env.ADMIN_EMAIL ?? "";

  if (o.status === "refund_pending") {
    await sendEmail(o.customer_email, `${o.order_number}: about your deposit`, layout(STATUS_COPY.refund_pending.headline,
      `<p>Hello ${esc(o.customer_name)},</p><p>We received your ${naira(claimed.amount_kobo)} deposit for the ${esc(car)}, but another buyer's deposit arrived moments earlier. Your deposit will be refunded in full and we'll be in touch today.</p>`, track));
    await sendEmail(adminTo, `REFUND NEEDED ${o.order_number}`, layout("Second deposit on a reserved car",
      `<p>${esc(o.customer_name)} paid ${naira(claimed.amount_kobo)} for the ${esc(car)} after it was reserved. Refund it in Paystack, then mark the order "Refund sent".</p>`,
      { href: `${SITE_URL}/admin/orders/${o.id}`, label: "Open order" }));
    return;
  }
  if (claimed.kind === "deposit") {
    await sendEmail(o.customer_email, `${o.order_number}: your ${car} is reserved`, layout("Your car is reserved",
      `<p>Hello ${esc(o.customer_name)},</p><p>We've received your deposit of <b>${naira(claimed.amount_kobo)}</b> for the <b>${esc(car)}</b>. Your order number is <b>${o.order_number}</b>.</p><p>The balance of ${naira(o.balance_kobo)} is due only after the car passes inspection in Abuja. Keep this email: the link below shows your order's progress.</p>`, track));
    await sendEmail(adminTo, `New deposit ${o.order_number}`, layout("New deposit received",
      `<p>${esc(o.customer_name)} paid ${naira(claimed.amount_kobo)} for the ${esc(car)}.</p>`, { href: `${SITE_URL}/admin/orders/${o.id}`, label: "Open order" }));
  } else {
    await sendEmail(o.customer_email, `${o.order_number}: paid in full`, layout("Paid in full, thank you",
      `<p>Hello ${esc(o.customer_name)},</p><p>We've received your balance of <b>${naira(claimed.amount_kobo)}</b>. We'll contact you to book the hand-over of your ${esc(car)}.</p>`, track));
    await sendEmail(adminTo, `Balance paid ${o.order_number}`, layout("Balance paid",
      `<p>${esc(o.customer_name)} paid the balance for the ${esc(car)}. Book the hand-over.</p>`, { href: `${SITE_URL}/admin/orders/${o.id}`, label: "Open order" }));
  }
}

/** Buyer update when an admin moves the order to a stage the buyer cares about. */
const BUYER_STAGES: OrderStatus[] = ["shipped", "in_abuja_inspection", "balance_due", "delivered", "refunded"];
export async function notifyStage(orderId: string, status: OrderStatus) {
  if (!BUYER_STAGES.includes(status)) return;
  const o = await loadOrder(orderId);
  if (!o) return;
  const c = STATUS_COPY[status];
  const extra = status === "balance_due" ? `<p>Balance due: <b>${naira(o.balance_kobo)}</b>.</p>` : "";
  await sendEmail(o.customer_email, `${o.order_number}: ${c.label.toLowerCase()}`, layout(c.headline,
    `<p>Hello ${esc(o.customer_name)},</p><p>${esc(c.body)}</p>${extra}`,
    { href: `${SITE_URL}/orders/${o.access_token}`, label: status === "balance_due" ? "Pay the balance" : "Track your order" }));
}
