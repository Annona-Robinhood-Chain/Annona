"use client";
import { useRef, useState } from "react";
import { BRAND } from "./brand";
import { Button, ButtonAnchor } from "./ui";

// imageHref: gambar PNG kartu dari route handler (opsional); tampil sebagai tautan unduh.
export function ShareDialog({ text, imageHref, children }: { text: string; imageHref?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  }
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => ref.current?.showModal()}>Share</Button>
      <dialog ref={ref} onClose={() => setCopied(false)} className="share-dlg">
        <div className="share-dlg-in">
          {children}
          <div className="share-actions">
            <Button size="sm" onClick={copy}>{copied ? "Copied" : "Copy text"}</Button>
            {imageHref && <ButtonAnchor href={imageHref} download={`${BRAND.toLowerCase()}-harvest.png`} variant="ghost" size="sm">Download image</ButtonAnchor>}
            <Button variant="ghost" size="sm" onClick={() => ref.current?.close()}>Close</Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
