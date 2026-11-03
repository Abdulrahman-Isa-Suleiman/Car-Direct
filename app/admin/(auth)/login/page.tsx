import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign-in · Cars Direct", robots: { index: false } };

const ERRORS: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Request a new one.",
  not_admin: "This account isn't an admin. Ask the owner to give you admin access.",
  setup: "Supabase isn't connected yet. Add the Supabase keys to the environment, then reload.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-3xl font-semibold text-white">Cars Direct</p>
        <p className="mt-1 text-center text-sm uppercase tracking-[0.18em] text-emerald-400">Admin</p>
        <div className="mt-8 rounded-2xl bg-white p-6">
          <h1 className="text-xl font-medium">Sign in</h1>
          <p className="mt-1 text-[15px] text-slate-600">We&apos;ll email you a one-time sign-in link. No password needed.</p>
          {error && ERRORS[error] && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{ERRORS[error]}</p>}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
