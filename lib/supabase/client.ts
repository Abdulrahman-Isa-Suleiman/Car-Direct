"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Browser client: respects RLS as the signed-in user (admins upload through this). */
export const supabaseBrowser = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
