import "server-only";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { initializeTransaction } from "@/lib/paystack";
import { SITE_URL } from "@/lib/site";

/**
 * Creates a pending payment row and a Paystack checkout for it. Used for the deposit (checkout)
 * and the balance (tracking page). The amount always comes from the order in the database.
 */
export async function startPayment(order: {
  id: string; order_number: string; access_token: string; customer_email: string; vehicle_title: string;
}, kind: "deposit" | "balance", amountKobo: number) {
  const reference = `${order.order_number}-${kind === "deposit" ? "DEP" : "BAL"}-${crypto.randomBytes(3).toString("hex")}`;
  const { error } = await supabaseAdmin().from("payments").insert({
    order_id: order.id, kind, amount_kobo: amountKobo, provider: "paystack", provider_reference: reference,
  });
  if (error) throw new Error("Could not record the payment");
  const tx = await initializeTransaction({
    email: order.customer_email,
    amountKobo,
    reference,
    callbackUrl: `${SITE_URL}/orders/${order.access_token}`, // Paystack appends ?reference=
    metadata: { order_number: order.order_number, vehicle: order.vehicle_title, kind },
  });
  return tx.authorization_url;
}
