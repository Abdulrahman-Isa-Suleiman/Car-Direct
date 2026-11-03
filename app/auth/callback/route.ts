import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Magic-link landing: swaps the one-time code for a session, then sends the admin on. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";
  const safeNext = next.startsWith("/admin") ? next : "/admin"; // never redirect off-site
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
}
