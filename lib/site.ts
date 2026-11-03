export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const WHATSAPP_URL = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? "2340000000000"}`;
/** WhatsApp link with a pre-filled first message. */
export const whatsappWith = (text: string) => `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
