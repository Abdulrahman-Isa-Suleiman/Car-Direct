"use client";
/** Last resort when the root layout itself fails. Plain HTML: no fonts or providers are available here. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-NG">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "96px 16px", color: "#0F172A" }}>
        <h1 style={{ fontSize: 24 }}>Cars Direct is having a problem</h1>
        <p style={{ color: "#475569" }}>Please try again in a minute.</p>
        <button onClick={reset} style={{ marginTop: 24, minHeight: 48, padding: "0 24px", background: "#047857", color: "#fff", border: 0, borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>Try again</button>
      </body>
    </html>
  );
}
