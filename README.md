# Car-Direct

Storefront and admin for **Cars Direct**, an Abuja importer of Chinese EREV, PHEV and BEV vehicles (brand new and fairly used 2020+). Buyers reserve a car with a **40% deposit** and pay the **60% balance** after it passes inspection in Abuja.

**Stack:** Next.js 15 (App Router) · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Paystack · Resend (email)

## What's here

| Area | Routes |
|---|---|
| Storefront | `/` home · `/vehicles` listing with shareable filters · `/vehicles/[slug]` detail · `/vehicles/[slug]/reserve` deposit checkout |
| Buyers | `/orders/[token]` private order tracking and balance payment |
| Admin | `/admin` dashboard · `/admin/orders` · `/admin/vehicles` inventory · `/admin/vehicles/new` quick upload · `/admin/settings` exchange rate |
| Legal | `/terms/deposit` · `/privacy` (drafts, pending legal review) |
| API | `/api/checkout` · `/api/orders/[token]/balance` · `/api/payments/paystack/webhook` |

Until Supabase is connected the storefront shows six clearly labelled sample cars and payments are switched off.

## Set up

1. **Install:** `npm install`
2. **Supabase:** create a project, then run the migrations in order in the SQL editor:
   `supabase/migrations/0001_init.sql`, then `0002_operations.sql`.
3. **Environment:** copy `.env.example` to `.env.local` and fill it in. Never commit real keys.
4. **First admin:** in Supabase, Authentication → Users → invite your email, accept the invite, then run `supabase/scripts/promote_admin.sql` with your email.
5. **Paystack:** set the webhook URL to `https://<your-domain>/api/payments/paystack/webhook`.
6. **Run:** `npm run dev`, or `npm run build && npm start`.

## Money rules

- All money is stored as integer **kobo**. The deposit is 40% rounded to the nearest naira; the balance is the price minus the deposit, so the two always add up exactly (`lib/pricing.ts`, mirrored in SQL).
- The amount charged always comes from the database, never from the browser.
- `confirm_payment()` in the database is the only place a payment is marked paid. It is idempotent, checks the amount, and refuses to sell one used car twice (a late second deposit becomes "refund pending").

## Before launch

- Import duty, levy and clearing rates in `landedCost` (`lib/pricing.ts`) are **placeholders**: confirm them with a licensed customs agent.
- Delivery day ranges (`TIMELINE_DAYS`) should be confirmed with your shipping and clearing partners.
- The deposit terms and privacy policy are drafts. After legal review, set `LEGAL_DRAFT = false` in `components/legal/LegalPage.tsx`.
- Replace the footer placeholders (address, RC number) in `components/home/Sections.tsx`.
