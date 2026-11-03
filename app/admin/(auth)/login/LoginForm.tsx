"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      // Only existing accounts get a link: invite admins from the Supabase dashboard.
      options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/auth/callback?next=/admin` },
    });
    if (error) { setState("error"); setMsg(error.message.includes("Signups not allowed") ? "No admin account uses that email." : error.message); }
    else setState("sent");
  }

  if (state === "sent") {
    return <p role="status" className="mt-6 rounded-lg bg-emerald-50 p-4 text-[15px] text-emerald-900">Check <b>{email}</b> for a sign-in link. It works once and expires in an hour.</p>;
  }
  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <label htmlFor="email" className="grid gap-1 text-sm font-medium">Work email
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="min-h-[48px] rounded-lg border border-slate-300 px-3 text-base font-normal focus:border-emerald-600 focus:outline-none" />
      </label>
      {state === "error" && <p role="alert" className="text-sm text-red-700">{msg}</p>}
      <button type="submit" disabled={state === "sending"}
        className="min-h-[48px] cursor-pointer rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {state === "sending" ? "Sending link…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
