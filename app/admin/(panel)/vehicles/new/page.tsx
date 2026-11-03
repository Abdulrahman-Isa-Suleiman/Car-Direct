import { requireAdmin } from "@/lib/auth";
import QuickUploadForm from "./QuickUploadForm";

export default async function NewVehiclePage() {
  const { sb } = await requireAdmin();
  const { data: fx } = await sb.from("settings").select("value").eq("key", "fx_ngn_per_usd").single();
  return <QuickUploadForm ngnPerUsd={Number(fx?.value ?? 1500)} />;
}
