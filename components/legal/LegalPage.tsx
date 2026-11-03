import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/Sections";

/** Flip to false once your lawyer has approved both pages. Removes the banner and placeholder highlighting. */
export const LEGAL_DRAFT = true;

/** A value only the business or its lawyer can set. Highlighted while the page is a draft. */
export function Fill({ children }: { children: React.ReactNode }) {
  return LEGAL_DRAFT ? <mark className="rounded bg-amber-100 px-1 text-amber-900">[{children}]</mark> : <>{children}</>;
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        {LEGAL_DRAFT && (
          <p role="note" className="bg-amber-50 px-4 py-3 text-center text-[15px] text-amber-900">
            Draft, pending legal review. Highlighted items are still to be confirmed.
          </p>
        )}
        <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6
          [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-medium [&_li]:mt-2 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6
          [&_p]:mt-3 [&_p]:text-[16px] [&_p]:leading-relaxed [&_p]:text-slate-700 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-slate-700">
          <h1 className="font-display text-4xl font-semibold">{title}</h1>
          <p className="!mt-2 text-sm !text-slate-500">Last updated {updated}</p>
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
