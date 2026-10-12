"use client";
import { useEffect, useRef } from "react";
import { BRAND } from "./brand";
import { Logo } from "./logo";

// Loader pembuka (#loader di annona.html): logo Annona muncul, persen 000 → 100, lalu tirai naik (clip-path).
// SSR merender loader (hanya tampil bila <html> punya kelas `js`); skrip di <head> menambah `no-loader` bila sesi ini sudah pernah
// melihatnya atau prefers-reduced-motion aktif, sehingga loader tidak berkedip. Tanpa JS loader tidak pernah tampil.
// Semua perubahan lewat ref/classList (tanpa state), jadi tidak ada render ulang selama animasi.
const pad3 = (n: number) => String(n).padStart(3, "0");

export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current, g = art.current, p = pct.current, b = bar.current;
    if (!el || !g || !p || !b || document.documentElement.classList.contains("no-loader")) return;
    let raf = 0, t1: ReturnType<typeof setTimeout> | undefined, t2: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      try { sessionStorage.setItem("loaded", "1"); } catch {}
      el.classList.add("done");
      t2 = setTimeout(() => { el.style.display = "none"; }, 1100);
    };
    raf = requestAnimationFrame(() => g.classList.add("in"));
    const t0 = performance.now(), dur = 1500;
    const step = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / dur)), ez = 1 - Math.pow(1 - k, 3);
      p.textContent = pad3(Math.round(ez * 100));
      b.style.transform = `scaleX(${ez})`;
      if (k < 1) raf = requestAnimationFrame(step); else t1 = setTimeout(finish, 250);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div id="loader" ref={root} aria-hidden="true">
      <div className="lc">
        <div ref={art} className="ld-mark"><Logo /></div>
        <div className="lw">{BRAND.toUpperCase()}</div>
        <div className="lbar"><i ref={bar} /></div>
        <div className="lp"><span ref={pct}>000</span> / 100</div>
      </div>
    </div>
  );
}
