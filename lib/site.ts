/**
 * The site's public address, used in emails, Paystack return links, WhatsApp messages and the sitemap.
 * 1. NEXT_PUBLIC_SITE_URL when set (your custom domain, e.g. https://carsdirect.ng).
 * 2. On Vercel: a preview deployment uses its own URL (so test payments return to the same preview);
 *    production uses the project's production URL.
 * 3. Otherwise local development.
 */
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const WHATSAPP_URL = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? "2340000000000"}`;
/** WhatsApp link with a pre-filled first message. */
export const whatsappWith = (text: string) => `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
