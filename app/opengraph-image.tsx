import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Default link preview (WhatsApp, X, LinkedIn) for pages without a car photo. 1200×630. */
export const alt = "Cars Direct: Chinese EVs and hybrids in Abuja, reserved with 40%";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (pkg: string, w: number) =>
  readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", `${pkg}-latin-${w}-normal.woff`));

export default async function OgImage() {
  // Brand fonts (the image renderer takes .woff, not .woff2).
  const [bodoni, jost] = await Promise.all([font("bodoni-moda", 600), font("jost", 500)]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(135deg, #0F172A 0%, #10243A 60%, #064E3B 100%)", color: "#fff", padding: 72, fontFamily: "Jost" }}>
        <div style={{ fontSize: 44, fontFamily: "Bodoni Moda", display: "flex" }}>Cars Direct</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 80, fontFamily: "Bodoni Moda", lineHeight: 1.05, maxWidth: 980 }}>Chinese EVs &amp; hybrids, delivered in Abuja.</div>
          <div style={{ fontSize: 36, marginTop: 28, color: "#6EE7B7", display: "flex" }}>Reserve with 40%. Pay the balance after inspection.</div>
        </div>
        <div style={{ fontSize: 28, color: "#A9B6C6", display: "flex" }}>EREV · PHEV · BEV · Brand new and fairly used 2020+</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Bodoni Moda", data: bodoni, weight: 600 }, { name: "Jost", data: jost, weight: 500 }] },
  );
}
