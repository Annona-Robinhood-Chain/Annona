"use client";
import { useEffect } from "react";

// Toggle tema (K3: tema terang dipertahankan). Tampil sebagai .icon-btn Annona; logika tema tidak berubah.
// Tambahan Fase 10.1: warna bilah browser (meta theme-color) mengikuti tema pilihan pengguna, karena media-query di
// <head> hanya tahu preferensi sistem. Nilainya sama dengan --wall di globals.css (terang #F3ECDF, gelap #14110F).
const THEME_COLOR = { light: "#F3ECDF", dark: "#14110F" } as const;
const paint = (theme: "light" | "dark") =>
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLOR[theme]));

export function ThemeToggle() {
  // Pilihan yang tersimpan (data-theme sudah dipasang skrip <head>) disalin ke meta setelah hidrasi.
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") paint(t);
  }, []);
  function toggle() {
    const el = document.documentElement;
    const cur = el.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    el.dataset.theme = next;
    paint(next);
    try { localStorage.setItem("theme", next); } catch {}
  }
  return (
    <button type="button" onClick={toggle} aria-label="Toggle light and dark theme" className="icon-btn">
      <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
      </svg>
    </button>
  );
}
