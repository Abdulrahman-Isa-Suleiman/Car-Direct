"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

const KEY = "cd-last-listing";

/** Mounted on /vehicles: remembers the filtered URL so the detail page can link straight back to it. */
export function RememberListing() {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    try { sessionStorage.setItem(KEY, pathname + (params.size ? `?${params}` : "")); } catch {}
  }, [pathname, params]);
  return null;
}

/** Back to the buyer's filtered results; plain /vehicles on a direct visit (e.g. from a WhatsApp link). */
export function BackToResults() {
  const [href, setHref] = useState("/vehicles");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved?.startsWith("/vehicles")) setHref(saved);
    } catch {}
  }, []);
  return (
    <Link href={href} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-700 hover:text-ink">
      <ArrowLeft aria-hidden className="h-4 w-4" /> {href === "/vehicles" ? "All vehicles" : "Back to results"}
    </Link>
  );
}
