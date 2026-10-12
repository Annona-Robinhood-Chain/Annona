"use client";
import { useEffect, useRef } from "react";

// Kursor custom (titik + cincin yang menyusul, membesar saat hover) dan efek magnet untuk elemen `.mag` (annona.html).
// Hanya pointer halus dan tanpa reduced motion; selain itu tidak ada yang dipasang dan kursor bawaan tetap dipakai.
// Saat modal wallet Reown (web component w3m-*/appkit-*/wui-*) berada di bawah penunjuk, kursor bawaan dikembalikan (kelas `cur-off`).
const HOVER = "a,button,input,select,textarea,label,summary,[role=button],[data-tilt]";
const isModal = (t: Element | null) => !!t && /^(W3M|APPKIT|WUI)-/i.test(t.tagName);

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = dot.current, r = ring.current, body = document.body;
    if (!d || !r) return;
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0, mag: HTMLElement | null = null;
    const move = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      body.classList.add("cur");
      d.style.transform = `translate(${x}px,${y}px)`;
      const m = (e.target as Element | null)?.closest?.(".mag") as HTMLElement | null;
      if (mag && mag !== m) mag.style.transform = "";
      if (m) {
        const b = m.getBoundingClientRect();
        m.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.22}px,${(e.clientY - b.top - b.height / 2) * 0.3}px)`;
      }
      mag = m;
    };
    const leave = () => { body.classList.remove("cur"); if (mag) { mag.style.transform = ""; mag = null; } };
    const over = (e: MouseEvent) => {
      const t = e.target as Element | null;
      body.classList.toggle("cur-off", isModal(t));
      body.classList.toggle("hov", !!t?.closest?.(HOVER));
    };
    const loop = () => { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; raf = requestAnimationFrame(loop); };
    addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseover", over);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseover", over);
      body.classList.remove("cur", "hov", "cur-off");
    };
  }, []);
  return (<><div id="cdot" ref={dot} aria-hidden="true" /><div id="cring" ref={ring} aria-hidden="true" /></>);
}
