"use client";
import Link from "next/link";
import { useEffect } from "react";
import { WHATSAPP_URL } from "@/lib/site";

/** Shown when a page fails to load. Keeps the buyer one tap from help. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-3xl font-semibold">Cars Direct</p>
      <h1 className="mt-6 text-2xl font-medium">This page didn&apos;t load</h1>
      <p className="mt-3 text-slate-600">It&apos;s usually a brief connection problem. If you were paying, no money is taken twice: check your order link or message us.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="min-h-[48px] cursor-pointer rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700">Try again</button>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener" className="inline-flex min-h-[48px] items-center rounded-xl border border-slate-300 px-6 font-medium">Message us</a>
        <Link href="/" className="inline-flex min-h-[48px] items-center px-4 font-medium text-slate-700">Home</Link>
      </div>
      {error.digest && <p className="tabular mt-8 text-xs text-slate-400">Reference {error.digest}</p>}
    </main>
  );
}
