"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  DEPOSIT_BUCKETS, POWERTRAINS, SORTS, STATUSES, STATUS_LABEL,
  activeCount, toQuery, type Filters,
} from "@/lib/listing";

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 2020 + 2 }, (_, i) => THIS_YEAR + 1 - i);
const KM = [10_000, 30_000, 50_000, 80_000];
const RANGE = [100, 200, 400];
const PT_HINT = { EREV: "Engine only charges", PHEV: "Engine can drive", BEV: "Battery only" } as const;

/* ------------------------------------------------------------------ */
/* URL navigation: every change replaces the query string; the server  */
/* page re-renders with the new results. Page resets to 1.             */
/* ------------------------------------------------------------------ */
function useFilterNav(f: Filters) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const go = (patch: Partial<Filters>) =>
    start(() => router.replace(pathname + toQuery({ ...f, page: 1, ...patch }), { scroll: false }));
  const toggle = <K extends "powertrain" | "status">(key: K, v: Filters[K][number]) => {
    const cur = f[key] as string[];
    go({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as Partial<Filters>);
  };
  return { go, toggle, pending };
}

const depositValue = (f: Filters) =>
  f.depositMin === undefined && f.depositMax === undefined ? "" : `${f.depositMin ?? 0}-${f.depositMax ?? ""}`;
const parseDeposit = (v: string) => {
  if (!v) return { depositMin: undefined, depositMax: undefined };
  const [a, b] = v.split("-");
  return { depositMin: Number(a), depositMax: b ? Number(b) : undefined };
};

/* ------------------------------------------------------------------ */
/* Filter fields: rendered in the desktop sidebar and the mobile sheet */
/* ------------------------------------------------------------------ */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-slate-200 py-5 first:pt-0 last:border-0">
      <legend className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{title}</legend>
      <div className="grid gap-1">{children}</div>
    </fieldset>
  );
}

const optionRow =
  "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-2 text-[15px] text-slate-700 hover:bg-slate-50 has-[:checked]:text-ink has-[:checked]:font-medium";
const box = "h-5 w-5 shrink-0 accent-emerald-600";
const selectCls = "min-h-[44px] w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-[15px]";

function FilterFields({ f, idPrefix }: { f: Filters; idPrefix: string }) {
  const { go, toggle } = useFilterNav(f);
  const id = (s: string) => `${idPrefix}-${s}`;
  return (
    <div>
      <Group title="Condition">
        {([["", "All"], ["brand_new", "Brand New · 0 km"], ["fairly_used", "Fairly Used · 2020+"]] as const).map(([v, label]) => (
          <label key={v} htmlFor={id(`cond-${v || "all"}`)} className={optionRow}>
            <input id={id(`cond-${v || "all"}`)} type="radio" name={id("condition")} className={box}
              checked={(f.condition ?? "") === v} onChange={() => go({ condition: v || undefined })} />
            {label}
          </label>
        ))}
      </Group>

      <Group title="Powertrain">
        {POWERTRAINS.map((p) => (
          <label key={p} htmlFor={id(`pt-${p}`)} className={optionRow}>
            <input id={id(`pt-${p}`)} type="checkbox" className={box}
              checked={f.powertrain.includes(p)} onChange={() => toggle("powertrain", p)} />
            <span className="flex flex-1 items-baseline justify-between gap-2">
              <span>{p}</span><span className="text-xs text-slate-500">{PT_HINT[p]}</span>
            </span>
          </label>
        ))}
      </Group>

      <Group title="Availability">
        {STATUSES.map((s) => (
          <label key={s} htmlFor={id(`st-${s}`)} className={optionRow}>
            <input id={id(`st-${s}`)} type="checkbox" className={box}
              checked={f.status.includes(s)} onChange={() => toggle("status", s)} />
            {STATUS_LABEL[s]}
          </label>
        ))}
      </Group>

      <Group title="Deposit you pay today">
        {[{ v: "", label: "Any amount" }, ...DEPOSIT_BUCKETS].map((b) => (
          <label key={b.v} htmlFor={id(`dep-${b.v || "any"}`)} className={optionRow}>
            <input id={id(`dep-${b.v || "any"}`)} type="radio" name={id("deposit")} className={box}
              checked={depositValue(f) === b.v} onChange={() => go(parseDeposit(b.v))} />
            {b.label}
          </label>
        ))}
      </Group>

      <Group title="Year, mileage and range">
        <label htmlFor={id("year")} className="grid gap-1 text-sm text-slate-600">Model year from
          <select id={id("year")} className={selectCls} value={f.yearMin ?? ""}
            onChange={(e) => go({ yearMin: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Any year</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label htmlFor={id("km")} className="mt-3 grid gap-1 text-sm text-slate-600">Mileage up to
          <select id={id("km")} className={selectCls} value={f.kmMax ?? ""}
            onChange={(e) => go({ kmMax: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Any mileage</option>
            {KM.map((k) => <option key={k} value={k}>{k.toLocaleString("en-NG")} km</option>)}
          </select>
        </label>
        <label htmlFor={id("range")} className="mt-3 grid gap-1 text-sm text-slate-600">Electric range at least
          <select id={id("range")} className={selectCls} value={f.rangeMin ?? ""}
            onChange={(e) => go({ rangeMin: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Any range</option>
            {RANGE.map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
        </label>
      </Group>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop sidebar                                                    */
/* ------------------------------------------------------------------ */
export function FilterSidebar({ f }: { f: Filters }) {
  return (
    <aside aria-label="Filters" className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
        <FilterFields f={f} idPrefix="side" />
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Toolbar: count, mobile filter sheet, sort, active chips            */
/* ------------------------------------------------------------------ */
export function ListingToolbar({ f, total }: { f: Filters; total: number }) {
  const { go, pending } = useFilterNav(f);
  const dialog = useRef<HTMLDialogElement>(null);
  const n = activeCount(f);

  const chips: { label: string; clear: Partial<Filters> }[] = [
    ...(f.condition ? [{ label: f.condition === "brand_new" ? "Brand New" : "Fairly Used", clear: { condition: undefined } }] : []),
    ...f.powertrain.map((p) => ({ label: p, clear: { powertrain: f.powertrain.filter((x) => x !== p) } })),
    ...f.status.map((s) => ({ label: STATUS_LABEL[s], clear: { status: f.status.filter((x) => x !== s) } })),
    ...(depositValue(f)
      ? [{ label: `Deposit ${DEPOSIT_BUCKETS.find((b) => b.v === depositValue(f))?.label ?? "custom"}`, clear: { depositMin: undefined, depositMax: undefined } }]
      : []),
    ...(f.yearMin ? [{ label: `${f.yearMin} or newer`, clear: { yearMin: undefined } }] : []),
    ...(f.kmMax ? [{ label: `Up to ${f.kmMax.toLocaleString("en-NG")} km`, clear: { kmMax: undefined } }] : []),
    ...(f.rangeMin ? [{ label: `${f.rangeMin}+ km electric`, clear: { rangeMin: undefined } }] : []),
  ];
  const clearAll: Partial<Filters> = {
    condition: undefined, powertrain: [], status: [], depositMin: undefined, depositMax: undefined,
    yearMin: undefined, kmMax: undefined, rangeMin: undefined,
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="tabular mr-auto text-[15px] text-slate-600" aria-live="polite">
          {pending ? "Updating…" : <><b className="text-ink">{total}</b> {total === 1 ? "vehicle" : "vehicles"}</>}
        </p>
        <button type="button" onClick={() => dialog.current?.showModal()}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium lg:hidden">
          <SlidersHorizontal aria-hidden className="h-4 w-4" /> Filters{n > 0 && <span className="tabular rounded-full bg-ink px-1.5 text-xs text-white">{n}</span>}
        </button>
        <label htmlFor="sort" className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hidden sm:inline">Sort</span>
          <select id="sort" value={f.sort} onChange={(e) => go({ sort: e.target.value as Filters["sort"] })}
            className="min-h-[44px] cursor-pointer rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-ink">
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <ul aria-label="Active filters" className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <li key={c.label}>
              <button type="button" onClick={() => go(c.clear)} aria-label={`Remove filter: ${c.label}`}
                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full bg-ink py-1 pl-3 pr-2 text-sm text-white hover:bg-slate-800">
                {c.label} <X aria-hidden className="h-4 w-4 opacity-70" />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => go(clearAll)}
              className="min-h-[36px] cursor-pointer px-2 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline">
              Clear all
            </button>
          </li>
        </ul>
      )}

      {/* Mobile filter sheet: native <dialog> gives focus trapping and Esc to close */}
      <dialog ref={dialog} aria-labelledby="filters-title"
        onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
        className="m-0 mt-auto max-h-[88vh] w-full max-w-none rounded-t-2xl bg-white p-0 text-ink backdrop:bg-ink/60 lg:hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 id="filters-title" className="text-lg font-medium">Filters</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close filters"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 pt-5">
          <FilterFields f={f} idPrefix="sheet" />
        </div>
        <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-4 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button type="button" onClick={() => go(clearAll)}
            className="min-h-[48px] flex-1 cursor-pointer rounded-xl border border-slate-300 font-medium">Clear</button>
          <button type="button" onClick={() => dialog.current?.close()}
            className="tabular min-h-[48px] flex-[2] cursor-pointer rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700">
            {pending ? "Updating…" : `Show ${total} ${total === 1 ? "car" : "cars"}`}
          </button>
        </div>
      </dialog>
    </div>
  );
}
