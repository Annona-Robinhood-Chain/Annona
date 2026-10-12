import Link from "next/link";
import { Empty } from "./primitives";

// Tombol bergaya Annona (Fase 2.1): kelas `.btn` di globals.css (isian naik saat hover, panah bergeser). API lama tetap:
// variant "primary" = .btn-sun (oranye), "ghost" = .btn-ghost. Tambahan: size "sm", `magnet` (efek magnet di kursor halus), `arrow` (panah →).
type Variant = "primary" | "ghost";
type Size = "md" | "sm";
type Extra = { variant?: Variant; size?: Size; magnet?: boolean; arrow?: boolean };
const join = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

// Kelas tombol untuk elemen non-tombol (mis. <span> "View vault" di dalam kartu yang seluruhnya tautan).
export const buttonClass = (variant: Variant = "primary", size: Size = "md", magnet = false) =>
  join("btn", variant === "primary" ? "btn-sun" : "btn-ghost", size === "sm" && "btn-sm", magnet && "mag");
const Arrow = () => <span className="arr" aria-hidden="true">→</span>;

export function Button({ variant = "primary", size = "md", magnet = false, arrow = false, className = "", children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & Extra) {
  return <button type="button" {...p} className={join(buttonClass(variant, size, magnet), className)}>{children}{arrow && <Arrow />}</button>;
}
// Navigasi memakai <a>, bukan <button>.
export function ButtonLink({ variant = "primary", size = "md", magnet = false, arrow = false, className = "", children, ...p }: React.ComponentProps<typeof Link> & Extra) {
  return <Link {...p} className={join(buttonClass(variant, size, magnet), className)}>{children}{arrow && <Arrow />}</Link>;
}
// Unduhan atau berkas (mis. gambar dari route handler): <a> biasa, bukan next/link (tanpa prefetch dan routing klien).
export function ButtonAnchor({ variant = "primary", size = "md", magnet = false, arrow = false, className = "", children, ...p }: React.AnchorHTMLAttributes<HTMLAnchorElement> & Extra) {
  return <a {...p} className={join(buttonClass(variant, size, magnet), className)}>{children}{arrow && <Arrow />}</a>;
}
// sub: kalimat penjelas di bawah judul. dashed: panel "after MVP" (transparan, garis putus-putus).
export function Panel({ title, sub, dashed = false, children, className = "" }: { title?: string; sub?: string; dashed?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <section className={`relative rounded-[22px] p-7 ${dashed ? "border border-dashed border-wire bg-transparent" : "bg-panel"} ${className}`}>
      {title && <h2 className={`font-display text-[1.6rem] font-[450] tracking-[-.01em] ${sub ? "mb-1.5" : "mb-3"}`}>{title}</h2>}
      {sub && <p className="mb-[18px] text-[.92rem] text-bark">{sub}</p>}
      {children}
    </section>
  );
}
// Lencana kecil: kini memakai gaya `.tag` Annona (mono, kapital, garis tipis).
export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={join("tag", className)}>{children}</span>;
}
export function Skeleton({ className = "h-6 w-full" }: { className?: string }) {
  return <div aria-hidden className={`rounded-lg bg-wire/40 motion-safe:animate-pulse ${className}`} />;
}
// Keadaan kosong bergaya Annona (.empty). Props lama dipertahankan; `children` (mis. tombol) tampil di bawah teks.
export function EmptyState({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return <Empty title={title} text={text}>{children}</Empty>;
}
