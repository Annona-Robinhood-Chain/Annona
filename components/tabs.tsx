"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

// Tab pil dengan indikator yang bergeser (tabs() di annona.html). Indikator diposisikan dari tombol/tautan aktif (.on);
// sebelum diposisikan (SSR, tanpa JS) tombol aktif memakai latar sendiri lewat CSS, jadi tidak ada kedipan.
const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

function useIndicator(active: string) {
  const box = useRef<HTMLDivElement>(null);
  const place = useCallback(() => {
    const t = box.current;
    if (!t) return;
    const on = t.querySelector<HTMLElement>(".on"), ind = t.querySelector<HTMLElement>(".ind");
    if (!on || !ind) return;
    ind.style.left = `${on.offsetLeft}px`;
    ind.style.width = `${on.offsetWidth}px`;
    // Kelas diatur langsung di DOM (bukan state) dan di frame berikutnya, supaya posisi pertama tidak ikut beranimasi.
    requestAnimationFrame(() => t.classList.add("placed"));
  }, []);
  useEffect(() => { place(); }, [place, active]);
  useEffect(() => {
    const t = box.current;
    if (!t) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    ro?.observe(t);
    void document.fonts?.ready.then(place);
    return () => ro?.disconnect();
  }, [place]);
  return box;
}

/** Pilihan satu-dari-banyak (mis. Mint / Redeem). Grup tombol dengan aria-pressed. `capitalize` menampilkan huruf awal kapital. */
export function Tabs<T extends string>({ value, options, onChange, label, capitalize = false, className }: {
  value: T; options: readonly T[]; onChange: (v: T) => void; label: string; capitalize?: boolean; className?: string;
}) {
  const box = useIndicator(value);
  return (
    <div ref={box} role="group" aria-label={label} className={cx("tabs", capitalize && "cap", className)}>
      <span className="ind" aria-hidden="true" />
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={o === value} className={o === value ? "on" : undefined} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

/** Tab berupa tautan (mis. rentang 7D / 30D / 90D lewat ?range=). Halaman server dirender ulang, indikator bergeser ke tab baru. */
export function LinkTabs({ items, active, label }: { items: { key: string; label: string; href: string; full?: string }[]; active: string; label: string }) {
  const box = useIndicator(active);
  return (
    <nav ref={box} aria-label={label} className="tabs">
      <span className="ind" aria-hidden="true" />
      {items.map((it) => (
        <Link key={it.key} href={it.href} scroll={false} aria-current={it.key === active ? "true" : undefined} aria-label={it.full} className={it.key === active ? "on" : undefined}>{it.label}</Link>
      ))}
    </nav>
  );
}
