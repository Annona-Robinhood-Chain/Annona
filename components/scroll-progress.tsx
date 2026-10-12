"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Garis progres gulir 2px + glow di tepi atas (#progress di annona.html).
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let queued = false;
    const run = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    };
    const on = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
    run();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    const ro = new ResizeObserver(on); // tinggi dokumen berubah saat konten dimuat
    ro.observe(document.documentElement);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); ro.disconnect(); };
  }, [path]);
  return <div id="progress" ref={ref} aria-hidden="true" />;
}
