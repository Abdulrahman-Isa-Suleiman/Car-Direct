import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./AdminNav";
import { signOut } from "./actions";

// Always per-request: admin pages must never be cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin · Cars Direct", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { name } = await requireAdmin();
  return (
    <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="bg-ink text-slate-300 lg:min-h-screen">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block lg:px-5 lg:py-6">
          <p className="font-display text-2xl font-semibold text-white">Cars Direct</p>
          <form action={signOut} className="lg:hidden"><button className="min-h-[44px] cursor-pointer text-sm text-slate-300 hover:text-white">Sign out</button></form>
        </div>
        <AdminNav />
        <div className="hidden px-5 pt-8 text-sm lg:block">
          <p className="truncate text-slate-400">{name}</p>
          <form action={signOut}><button className="mt-1 min-h-[44px] cursor-pointer text-slate-300 underline-offset-4 hover:text-white hover:underline">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
