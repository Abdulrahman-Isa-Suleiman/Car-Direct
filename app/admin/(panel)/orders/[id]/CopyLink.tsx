"use client";
import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex gap-2">
      <input readOnly value={url} aria-label="Tracking link" onFocus={(e) => e.target.select()}
        className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-slate-200 bg-mist px-2 font-mono text-xs" />
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }}
        className="min-h-[44px] cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-medium">{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}
