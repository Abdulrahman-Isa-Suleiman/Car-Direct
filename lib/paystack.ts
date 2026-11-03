import "server-only";
import crypto from "node:crypto";

const BASE = "https://api.paystack.co";
const key = () => process.env.PAYSTACK_SECRET_KEY!;

export async function initializeTransaction(args: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountKobo,
      currency: "NGN",
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
      // Bank transfer first: card limits often block 8-figure naira charges.
      channels: ["bank_transfer", "card", "ussd"],
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message ?? "Paystack initialize failed");
  return json.data as { authorization_url: string; access_code: string; reference: string };
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key()}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message ?? "Paystack verify failed");
  return json.data as { status: string; amount: number; currency: string; channel: string; reference: string };
}

/** Paystack signs the raw body with HMAC-SHA512 using your secret key. */
export function isValidSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", key()).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
