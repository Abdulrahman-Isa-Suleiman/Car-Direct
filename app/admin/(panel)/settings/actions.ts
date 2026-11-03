"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type FxState = { ok: boolean; message: string } | null;

export async function saveFxRate(_prev: FxState, form: FormData): Promise<FxState> {
  const { sb, user } = await requireAdmin();
  const raw = String(form.get("rate") ?? "").replace(/[,\s₦]/g, "");
  const rate = Number(raw);
  // Guard against typos (15 or 150000) going live on every USD price.
  if (!Number.isFinite(rate) || rate < 300 || rate > 10000) {
    return { ok: false, message: "Enter the rate in naira per US dollar, between ₦300 and ₦10,000." };
  }
  const { error } = await sb.from("settings")
    .update({ value: Math.round(rate * 100) / 100, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("key", "fx_ngn_per_usd");
  if (error) return { ok: false, message: "Couldn't save the rate. Try again." };
  revalidatePath("/", "layout"); // every page that shows USD
  return { ok: true, message: `Saved. USD prices now use ₦${rate.toLocaleString("en-NG")} per $1.` };
}
