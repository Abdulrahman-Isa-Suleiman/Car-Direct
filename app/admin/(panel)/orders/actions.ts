"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { NEXT } from "@/lib/order-flow";
import type { OrderStatus } from "@/lib/orders";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyPaymentConfirmed, notifyStage } from "@/lib/notify";

const Move = z.object({ orderId: z.string().uuid(), to: z.string(), note: z.string().max(500).optional() });

export async function moveOrder(input: z.infer<typeof Move>): Promise<{ ok: boolean; error?: string }> {
  const { sb } = await requireAdmin();
  const p = Move.safeParse(input);
  if (!p.success) return { ok: false, error: "Invalid request." };

  const { data: o } = await sb.from("orders").select("id, status, vehicle_id, vehicle_status_at_order, notes").eq("id", p.data.orderId).single();
  if (!o) return { ok: false, error: "Order not found." };
  const allowed = NEXT[o.status as OrderStatus]?.some((n) => n.to === p.data.to);
  if (!allowed) return { ok: false, error: "That step isn't allowed from the order's current stage. Refresh the page." };

  const notes = p.data.note ? [o.notes, `${new Date().toISOString().slice(0, 10)}: ${p.data.note}`].filter(Boolean).join("\n") : o.notes;
  const { error } = await sb.from("orders").update({ status: p.data.to, notes, updated_at: new Date().toISOString() })
    .eq("id", o.id).eq("status", o.status); // only if nobody moved it meanwhile
  if (error) return { ok: false, error: "Couldn't save. Try again." };

  // Keep the car's status in step with the order.
  if (p.data.to === "delivered") {
    await sb.from("vehicles").update({ status: "sold" }).eq("id", o.vehicle_id).eq("status", "reserved");
  }
  if (p.data.to === "refunded" && o.status !== "refund_pending" && o.vehicle_status_at_order !== "factory_order") {
    // This order held the reservation on a single car: put it back on sale.
    await sb.from("vehicles").update({ status: o.vehicle_status_at_order }).eq("id", o.vehicle_id).eq("status", "reserved");
  }
  await notifyStage(o.id, p.data.to as OrderStatus).catch((e) => console.error("notify failed", e));
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${o.id}`); revalidatePath("/admin");
  revalidatePath("/vehicles"); revalidatePath("/");
  return { ok: true };
}

const Manual = z.object({ orderId: z.string().uuid(), bankReference: z.string().trim().min(3).max(80), checked: z.literal(true) });

/**
 * Record a bank transfer that arrived outside Paystack. Runs through the same confirm_payment
 * function as Paystack, so double-sale protection and the order history apply.
 */
export async function recordManualPayment(input: { orderId: string; bankReference: string; checked: boolean }): Promise<{ ok: boolean; error?: string }> {
  const { sb, user } = await requireAdmin();
  const p = Manual.safeParse(input);
  if (!p.success) return { ok: false, error: "Add the bank reference and confirm you've seen the money arrive." };

  const { data: o } = await sb.from("orders").select("id, order_number, status, deposit_kobo, balance_kobo").eq("id", p.data.orderId).single();
  if (!o) return { ok: false, error: "Order not found." };
  const kind = o.status === "pending_deposit" ? "deposit" : o.status === "balance_due" ? "balance" : null;
  if (!kind) return { ok: false, error: "Nothing is due on this order right now." };
  const amount = kind === "deposit" ? o.deposit_kobo : o.balance_kobo;

  const admin = supabaseAdmin(); // confirm_payment is only callable with the service role
  const reference = `${o.order_number}-${kind === "deposit" ? "DEP" : "BAL"}-BANK-${crypto.randomBytes(3).toString("hex")}`;
  const { error: insErr } = await admin.from("payments").insert({
    order_id: o.id, kind, amount_kobo: amount, provider: "bank_transfer_manual", provider_reference: reference, confirmed_by: user.id,
  });
  if (insErr) return { ok: false, error: "Couldn't record the payment." };
  const { error } = await admin.rpc("confirm_payment", {
    p_reference: reference, p_amount_kobo: amount, p_channel: "bank_transfer",
    p_raw: { bank_reference: p.data.bankReference, recorded_by: user.id, recorded_at: new Date().toISOString() },
  });
  if (error) return { ok: false, error: "Payment recorded but the order didn't update. Check the order before trying again." };
  await notifyPaymentConfirmed(reference).catch((e) => console.error("notify failed", e));
  revalidatePath(`/admin/orders/${o.id}`); revalidatePath("/admin/orders"); revalidatePath("/admin");
  revalidatePath("/vehicles"); revalidatePath("/");
  return { ok: true };
}
