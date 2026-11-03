/** Nigerian mobile to international digits for wa.me links: 0803 123 4567 → 2348031234567. */
export function toIntlNg(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("234")) return d;
  if (d.startsWith("0")) return "234" + d.slice(1);
  return d;
}
