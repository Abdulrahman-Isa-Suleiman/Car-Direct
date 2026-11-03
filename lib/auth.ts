import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";

/** Use at the top of every admin page and server action. Redirects anyone who isn't a signed-in admin. */
export async function requireAdmin() {
  if (!supabaseConfigured()) redirect("/admin/login?error=setup");
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser(); // verifies the JWT with Supabase, unlike getSession()
  if (!user) redirect("/admin/login");
  const { data: profile } = await sb.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/admin/login?error=not_admin");
  return { sb, user, name: profile.full_name || user.email || "Admin" };
}
