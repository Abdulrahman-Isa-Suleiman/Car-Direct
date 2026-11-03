import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { CurrencyProvider } from "@/components/home/CurrencyProvider";
import "./globals.css";

// Self-hosted from @fontsource so builds never depend on reaching Google Fonts.
const display = localFont({
  src: [{ path: "../node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-500-normal.woff2", weight: "500" }, { path: "../node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-600-normal.woff2", weight: "600" }, { path: "../node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-700-normal.woff2", weight: "700" }],
  variable: "--font-display", display: "swap", fallback: ["Didot", "Georgia", "serif"],
});
const sans = localFont({
  src: [{ path: "../node_modules/@fontsource/jost/files/jost-latin-400-normal.woff2", weight: "400" }, { path: "../node_modules/@fontsource/jost/files/jost-latin-500-normal.woff2", weight: "500" }, { path: "../node_modules/@fontsource/jost/files/jost-latin-600-normal.woff2", weight: "600" }],
  variable: "--font-sans", display: "swap", fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Cars Direct · Chinese EVs & Hybrids in Abuja, reserve with 40%",
  description:
    "Brand new and certified fairly used EREV, PHEV and BEV vehicles imported direct from China. 150-point inspection. Pay 40% to reserve, the balance before handover in Abuja.",
};
export const viewport: Viewport = { themeColor: "#0F172A", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${display.variable} ${sans.variable}`}>
      <body>
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
