import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { startPayment } from "@/lib/payments";
import { splitPayment, estimateReadyWindow } from "@/lib/pricing";

const TERMS_VERSION = "deposit-terms-v1";
const HOLD_MINUTES = 15;          // a used car is held while one buyer is paying
const MAX_PER_IP_PER_HOUR = 5;
const MAX_PER_EMAIL_PER_HOUR = 3;

const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";

const Body = z.object({
  vehicleId: z.string().uuid(),
  name: z.string().min(2).max(120),
  // Accept the number however people type it: "0803 000 0000", "+234-803-000-0000".
  phone: z.string().transform((x) => x.replace(/[\s\-()]/g, "")).pipe(z.string().regex(/^(\+234|234|0)[789][01]\d{8}$/, "Enter a Nigerian mobile number, e.g. 0803 000 0000")),
  email: z.string().trim().toLowerCase().pipe(z.string().email("Enter a valid email address")),
  acceptTerms: z.literal(true),
});

export async function POST(req: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Payments aren't switched on yet. Message us on WhatsApp to reserve." }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const b = parsed.data;
  const db = supabaseAdmin();
  const ip = clientIp(req);

  // Rate limit: stops scripted floods of fake pending orders. Counted from the orders table itself.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const [{ count: byIp }, { count: byEmail }] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).eq("client_ip", ip).gte("created_at", hourAgo),
    db.from("orders").select("id", { count: "exact", head: true }).eq("customer_email", b.email).gte("created_at", hourAgo),
  ]);
  if ((byIp ?? 0) >= MAX_PER_IP_PER_HOUR || (byEmail ?? 0) >= MAX_PER_EMAIL_PER_HOUR) {
    return NextResponse.json({ error: "Too many checkout attempts. Wait an hour, or message us on WhatsApp and we'll help you reserve." }, { status: 429 });
  }

  // Amount always comes from the database, never from the browser.
  const { data: v } = await db.from("vehicles")
    .select("id, title, price_kobo, deposit_kobo, status, eta_date").eq("id", b.vehicleId).single();
  if (!v) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  if (v.status === "sold" || v.status === "reserved")
    return NextResponse.json({ error: "This vehicle has just been reserved by another buyer." }, { status: 409 });

  // A single physical car (on ground or in transit) is held while another buyer is mid-payment.
  // Factory orders can be bought by any number of people. The same buyer retrying isn't blocked.
  if (v.status === "available" || v.status === "in_transit") {
    const since = new Date(Date.now() - HOLD_MINUTES * 60_000).toISOString();
    const { count: held } = await db.from("orders").select("id", { count: "exact", head: true })
      .eq("vehicle_id", v.id).eq("status", "pending_deposit").gte("created_at", since).neq("customer_email", b.email);
    if ((held ?? 0) > 0) {
      return NextResponse.json({ error: `Another buyer is paying for this car right now. It's held for up to ${HOLD_MINUTES} minutes; check back shortly or message us about similar cars.` }, { status: 409 });
    }
  }

  const { depositKobo } = splitPayment(v.price_kobo);
  if (depositKobo !== v.deposit_kobo) throw new Error("Deposit mismatch between app and database");

  const { data: fx } = await db.from("settings").select("value").eq("key", "fx_ngn_per_usd").single();
  const window = estimateReadyWindow(v.status, new Date(), v.eta_date ? new Date(v.eta_date) : null);

  const { data: order, error } = await db.from("orders").insert({
    vehicle_id: v.id,
    customer_name: b.name,
    customer_phone: b.phone,
    customer_email: b.email,
    price_kobo: v.price_kobo,
    deposit_kobo: depositKobo,
    fx_ngn_per_usd: Number(fx?.value ?? 0),
    vehicle_status_at_order: v.status,
    expected_ready_from: window.from.toISOString().slice(0, 10),
    expected_ready_to: window.to.toISOString().slice(0, 10),
    terms_version: TERMS_VERSION,
    terms_accepted_at: new Date().toISOString(),
    client_ip: ip,
  }).select("id, order_number, access_token").single();
  if (error || !order) return NextResponse.json({ error: "Could not create order" }, { status: 500 });

  let authorizationUrl: string;
  try {
    authorizationUrl = await startPayment({ ...order, customer_email: b.email, vehicle_title: v.title }, "deposit", depositKobo);
  } catch {
    await db.from("orders").update({ status: "cancelled", notes: "Payment provider unavailable at checkout." }).eq("id", order.id);
    return NextResponse.json({ error: "Our payment provider isn't responding. No money was taken. Please try again in a few minutes." }, { status: 502 });
  }

  return NextResponse.json({ authorizationUrl, orderNumber: order.order_number });
}
