import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidSignature, verifyTransaction } from "@/lib/paystack";
import { notifyPaymentConfirmed } from "@/lib/notify";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!isValidSignature(raw, req.headers.get("x-paystack-signature")))
    return new NextResponse("bad signature", { status: 401 });

  const event = JSON.parse(raw);
  if (event.event !== "charge.success") return NextResponse.json({ ok: true });

  // Re-verify with Paystack rather than trusting the webhook body alone.
  const tx = await verifyTransaction(event.data.reference);
  if (tx.status !== "success" || tx.currency !== "NGN") return NextResponse.json({ ok: true });

  const { error } = await supabaseAdmin().rpc("confirm_payment", {
    p_reference: tx.reference,
    p_amount_kobo: tx.amount,
    p_channel: tx.channel,
    p_raw: tx,
  });
  if (error) {
    console.error("confirm_payment failed", tx.reference, error.message);
    return new NextResponse("error", { status: 500 }); // Paystack retries
  }
  await notifyPaymentConfirmed(tx.reference).catch((e) => console.error("notify failed", e));
  return NextResponse.json({ ok: true });
}
