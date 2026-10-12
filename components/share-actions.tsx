"use client";
import { useState } from "react";
import { BRAND } from "./brand";
import { Button, ButtonAnchor } from "./ui";

// Kontrol di bawah Harvest Card: salin teks dan unduh PNG. Tanpa dialog: kartunya sudah terlihat.
export function ShareActions({ text, imageHref }: { text: string; imageHref?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try { await navigator.clipboard.writeText(text); setState("copied"); } catch { setState("failed"); }
  }
  return (
    <div className="share-actions">
      <Button variant="ghost" size="sm" onClick={copy}>Copy share text</Button>
      {imageHref && <ButtonAnchor href={imageHref} download={`${BRAND.toLowerCase()}-harvest.png`} variant="ghost" size="sm">Download image</ButtonAnchor>}
      <span role="status" className="note">{state === "copied" ? "Copied" : state === "failed" ? "Could not copy. Select the text manually." : ""}</span>
    </div>
  );
}
