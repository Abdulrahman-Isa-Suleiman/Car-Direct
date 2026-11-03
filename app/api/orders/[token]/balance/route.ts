import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { startPayment } from "@/lib/payments";

/** Buyer pays the 60% balance from their tracking page. Only allowed once the car has passed inspection. */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Payments aren't switched on yet. Message us on WhatsApp to reserve." }, { status: 503 });
  }
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const { data: o } = await supabaseAdmin().from("orders")
    .select("id, order_number, access_token, customer_email, status, balance_kobo, vehicles(title)")
    .eq("access_token", token).maybeSingle();
  if (!o) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (o.status !== "balance_due") {
    return NextResponse.json({ error: o.status === "balance_paid" ? "The balance is already paid." : "The balance isn't due yet. We'll message you when the car passes inspection." }, { status: 409 });
  }
  try {
    const authorizationUrl = await startPayment(
      { ...o, vehicle_title: (o.vehicles as unknown as { title: string } | null)?.title ?? "Vehicle" }, "balance", o.balance_kobo,
    );
    return NextResponse.json({ authorizationUrl });
  } catch {
    return NextResponse.json({ error: "Couldn't start the payment. Try again in a minute." }, { status: 502 });
  }
}
