"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type { DetailVehicle, ImageCategory } from "@/lib/home-data";

const LABEL: Record<ImageCategory, string> = {
  exterior: "Exterior", interior: "Interior", dashboard: "Dashboard", battery_report: "Battery report", other: "More",
};

/** Swipe-free gallery: buttons and thumbnails only, no auto-rotation (keyboard and single-pointer friendly). */
export function Gallery({ v }: { v: DetailVehicle }) {
  const photos = useMemo(() => v.images.filter((i) => !i.isPdf), [v.images]);
  const reports = v.images.filter((i) => i.isPdf);
  const cats = [...new Set(photos.map((p) => p.category))];
  const [i, setI] = useState(0);
  const cur = photos[i];
  const go = (d: number) => setI((x) => (x + d + photos.length) % photos.length);

  if (photos.length === 0) {
    return (
      <div className="relative flex aspect-[16/10] items-end overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-ink p-6">
        <span aria-hidden className="font-display text-7xl font-semibold text-white/10 sm:text-8xl">{v.powertrain}</span>
        <p className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">Photos added after inspection</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100"
        onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}>
        <Image key={cur.url} src={cur.url} alt={`${v.title}, ${LABEL[cur.category].toLowerCase()} photo ${i + 1} of ${photos.length}`}
          fill priority={i === 0} sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo"
              className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white">
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo"
              className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white">
              <ChevronRight aria-hidden className="h-5 w-5" />
            </button>
          </>
        )}
        <p className="tabular absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs text-white" aria-live="polite">
          {LABEL[cur.category]} · {i + 1} / {photos.length}
        </p>
      </div>

      {cats.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Jump to">
          {cats.map((c) => (
            <button key={c} type="button" onClick={() => setI(photos.findIndex((p) => p.category === c))}
              aria-pressed={cur.category === c}
              className={`min-h-[40px] cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${cur.category === c ? "border-ink bg-ink text-white" : "border-slate-300 text-slate-700 hover:border-slate-400"}`}>
              {LABEL[c]}
            </button>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="All photos">
        {photos.map((p, j) => (
          <li key={p.url}>
            <button type="button" onClick={() => setI(j)} aria-label={`Show photo ${j + 1}`} aria-current={j === i}
              className={`relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg ring-offset-2 ${j === i ? "ring-2 ring-emerald-600" : "opacity-80 hover:opacity-100"}`}>
              <Image src={p.url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {reports.map((r, j) => (
        <a key={r.url} href={r.url} target="_blank" rel="noopener"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-emerald-700 hover:underline">
          <FileText aria-hidden className="h-4 w-4" /> Battery diagnostic report{reports.length > 1 ? ` ${j + 1}` : ""} (PDF)
        </a>
      ))}
    </div>
  );
}
