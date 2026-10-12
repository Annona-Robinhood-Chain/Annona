"use client";
import { useEffect, useRef } from "react";

// Partikel latar hero (particles() di annona.html): bulir gandum kecil yang naik pelan, garis emas antar titik berdekatan,
// dan garis oranye ke kursor. Kanvas mengisi induknya (induk harus position:relative); pointer-events mati, jadi kursor didengar di induk.
// Warna dibaca dari token CSS (--fg, --wheat, --sun) dan ikut tema. IntersectionObserver menghentikan loop saat di luar layar;
// prefers-reduced-motion: digambar sekali, tanpa gerak.
type P = { x: number; y: number; vx: number; vy: number; a: number; va: number; s: number; g: boolean };
const rgb = (css: string, fb: [number, number, number]): [number, number, number] => {
  const m = css.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return fb;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export function HeroParticles({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current, host = cv?.parentElement, ctx = cv?.getContext("2d");
    if (!cv || !host || !ctx) return;
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0, mx = -999, my = -999, raf = 0, vis = true, t = 0;
    let fg: [number, number, number] = [238, 230, 217], wheat: [number, number, number] = [216, 178, 94], sun: [number, number, number] = [229, 100, 43];
    const colours = () => {
      const cs = getComputedStyle(document.documentElement);
      fg = rgb(cs.getPropertyValue("--fg"), fg); wheat = rgb(cs.getPropertyValue("--wheat"), wheat); sun = rgb(cs.getPropertyValue("--sun"), sun);
      if (rm) draw();
    };
    const pts: P[] = [];
    const seed = () => {
      pts.length = 0;
      const N = Math.min(120, Math.floor((w * h) / 10000));
      for (let i = 0; i < N; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: -(0.08 + Math.random() * 0.3), a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.02, s: 0.7 + Math.random() * 1.5, g: Math.random() < 0.22 });
    };
    const size = () => {
      const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
      const first = w === 0;
      w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (first) seed();
      if (rm) draw();
    };
    const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    function draw() {
      ctx!.clearRect(0, 0, w, h); t += 0.004;
      if (!rm) for (const p of pts) {
        p.x += p.vx + Math.sin(p.y * 0.008 + t * 3) * 0.15; p.y += p.vy; p.a += p.va;
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < 140 && d > 0) { const f = ((140 - d) / 140) * 1.6; p.x += (dx / d) * f; p.y += (dy / d) * f; }
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 12; if (p.x > w + 12) p.x = -12;
      }
      ctx!.lineWidth = 0.6;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 8100) { ctx!.strokeStyle = rgba(wheat, 0.13 * (1 - d2 / 8100)); ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y); ctx!.stroke(); }
        }
        const md = Math.hypot(a.x - mx, a.y - my);
        if (md < 180) { ctx!.strokeStyle = rgba(sun, 0.35 * (1 - md / 180)); ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(mx, my); ctx!.stroke(); }
      }
      for (const p of pts) {
        ctx!.save(); ctx!.translate(p.x, p.y); ctx!.rotate(p.a);
        ctx!.fillStyle = p.g ? rgba(sun, 0.9) : rgba(fg, 0.55);
        ctx!.beginPath(); ctx!.ellipse(0, 0, p.s, p.s * 2.4, 0, 0, 6.283); ctx!.fill(); ctx!.restore();
      }
      if (vis && !rm && !document.hidden) raf = requestAnimationFrame(draw);
    }
    const onMove = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const onLeave = () => { mx = my = -999; };
    host.addEventListener("mousemove", onMove); host.addEventListener("mouseleave", onLeave);
    const ro = new ResizeObserver(size); ro.observe(cv);
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis && !rm) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } }); io.observe(host);
    const onVis = () => { if (!document.hidden && vis && !rm && !raf) raf = requestAnimationFrame(draw); else if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } };
    document.addEventListener("visibilitychange", onVis);
    const themeObs = new MutationObserver(colours); themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mql = matchMedia("(prefers-color-scheme: dark)"); mql.addEventListener("change", colours);
    colours(); size();
    if (rm) draw(); else raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); themeObs.disconnect(); mql.removeEventListener("change", colours);
      document.removeEventListener("visibilitychange", onVis); host.removeEventListener("mousemove", onMove); host.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return <canvas ref={ref} aria-hidden className={`hero-canvas ${className}`} />;
}
