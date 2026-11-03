"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

const Update = z.object({
  id: z.string().uuid(),
  status: z.enum(["available", "in_transit", "factory_order", "reserved", "sold"]),
  etaDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export async function updateVehicle(input: z.infer<typeof Update>): Promise<{ ok: boolean; error?: string }> {
  const { sb } = await requireAdmin();
  const p = Update.safeParse(input);
  if (!p.success) return { ok: false, error: "Check the status and date." };
  const { data, error } = await sb.from("vehicles")
    .update({ status: p.data.status, eta_date: p.data.status === "in_transit" ? p.data.etaDate : null, updated_at: new Date().toISOString() })
    .eq("id", p.data.id).select("slug").single();
  if (error || !data) return { ok: false, error: "Couldn't save. Try again." };
  // Storefront pages cache for 5 minutes; refresh the ones showing this car now.
  revalidatePath("/"); revalidatePath("/vehicles"); revalidatePath(`/vehicles/${data.slug}`);
  return { ok: true };
}
