import { MARK_COLORS, MARK_PATHS, MARK_VIEWBOX } from "@/lib/brand-mark";

// Tanda merek Annona: bulan sabit, gandum, dan matahari terbit. Matahari tetap oranye di kedua tema; bulan dan gandum mengikuti
// --logo-moon / --logo-wheat (app/globals.css) supaya tetap terbaca di latar terang. Ukuran bawaan diatur CSS (.brand svg = 30px).
export function Logo({ className = "" }: { className?: string; priority?: boolean }) {
  return (
    <svg viewBox={MARK_VIEWBOX} aria-hidden className={`shrink-0 ${className}`}>
      <path fill={`var(--logo-moon, ${MARK_COLORS.moon})`} fillRule="evenodd" d={MARK_PATHS.moon} />
      <path fill={`var(--logo-wheat, ${MARK_COLORS.wheat})`} fillRule="evenodd" d={MARK_PATHS.wheat} />
      <path fill={MARK_COLORS.sun} fillRule="evenodd" d={MARK_PATHS.sun} />
    </svg>
  );
}
