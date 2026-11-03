/** Skeleton shown while filtered results load. Same grid as the real page, so nothing jumps (CLS). */
export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading vehicles" className="bg-white">
      <div className="h-16 bg-ink" />
      <div className="border-b border-slate-200 bg-mist">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-10 w-2/3 max-w-md animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-slate-200" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="aspect-[16/10] animate-pulse bg-slate-200" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-8 w-full animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
