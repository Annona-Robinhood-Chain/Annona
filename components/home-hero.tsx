"use client";
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { Appear, useInView } from "./primitives";
import { Orbits, SheafPaths, SunDisc } from "./sheaf-art";

// Bagian klien dari hero Home (Fase 4.1): ilustrasi sheaf + matahari + orbit dengan parallax kursor (initHome di annona.html),
// jam New York di HUD, dan empat angka statistik yang naik saat terlihat. Halaman Home sendiri tetap server component.

/** Ilustrasi hero 600×600. Sheaf tergambar saat tampil; bergeser mengikuti kursor (hanya pointer halus, tanpa reduced motion). */
export function HeroArt() {
  const [ref, on] = useInView<HTMLDivElement>();
  useEffect(() => {
    const art = ref.current, hero = art?.closest<HTMLElement>("#hero");
    if (!art || !hero || !matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    art.style.transition = "transform 1.2s cubic-bezier(.2,.8,.2,1)";
    const mv = (e: MouseEvent) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      art.style.transform = `translate3d(${x * -24}px,${y * -18}px,0)`;
    };
    hero.addEventListener("mousemove", mv);
    return () => hero.removeEventListener("mousemove", mv);
  }, [ref]);
  const ground: React.ReactNode[] = [];
  for (let i = 0; i < 28; i++) {
    const x = 30 + i * 20;
    ground.push(<line key={i} x1={x} y1={520} x2={x - 8 + (i % 3) * 5} y2={528 + (i % 4) * 4} opacity={0.5} />);
  }
  return (
    <div ref={ref} className={`hero-art${on ? " in" : ""}`}>
      <svg viewBox="0 0 600 600" role="img" aria-label="Ink drawing of a bound sheaf of wheat before an orange sun, circled by orbit rings.">
        <Orbits cx={320} cy={260} r={190} />
        <SunDisc cx={320} cy={260} r={190} id="hero" hatch="var(--bg)" />
        <g stroke="var(--fg)" strokeWidth={1.2} opacity={0.5}>
          <line x1={20} y1={520} x2={580} y2={520} />
          {ground}
        </g>
        <g className="sheaf-grow" fill="none"><SheafPaths cx={290} baseY={518} h={420} n={15} stroke="var(--fg)" sw={1.6} animate /></g>
        <g className="sheaf-grow" fill="none" opacity={0.7}><SheafPaths cx={470} baseY={518} h={250} n={9} stroke="var(--fg)" sw={1.3} animate /></g>
      </svg>
    </div>
  );
}

const nyFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const everySecond = (cb: () => void) => { const id = setInterval(cb, 1000); return () => clearInterval(id); };
/** Jam New York (hh:mm:ss). Server dan hidrasi awal menampilkan "--:--:--" supaya HTML sama dengan klien. */
export function NyTime() {
  const t = useSyncExternalStore(everySecond, () => nyFmt.format(new Date()), () => null);
  return <b>{t ?? "--:--:--"}</b>;
}

/* ---------------------------------------------------------------- Statistik (.stats) ---------------------------------------------------------------- */

const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// Pemformat buatan sendiri (bukan Intl) supaya server dan klien menghasilkan teks yang sama persis (lihat catatan di count-up.tsx).
const fmtNum = (v: number, dec: number, pad: number) => {
  const [i, d] = Math.max(0, v).toFixed(dec).split(".");
  return (pad ? i.padStart(pad, "0") : group(i)) + (d ? `.${d}` : "");
};

/** Angka yang naik dari 0 saat terlihat (data-count). Nilai akhir selalu ada di teks sr-only; reduced motion langsung menampilkannya. */
function Count({ value, dec = 0, pad = 0, prefix = "" }: { value: number | null; dec?: number; pad?: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [view, on] = useInView<HTMLSpanElement>();
  useEffect(() => {
    const el = ref.current;
    if (!el || !on || value === null) return;
    const show = (v: number) => { el.textContent = fmtNum(v, dec, pad); };
    if (value === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) { show(value); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1600);
      show(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, value, dec, pad]);
  if (value === null) return <>—<span className="sr-only"> not available</span></>;
  return (
    <span ref={view}>
      {prefix}<span ref={ref} aria-hidden="true">{fmtNum(0, dec, pad)}</span>
      <span className="sr-only">{prefix}{fmtNum(value, dec, pad)}</span>
    </span>
  );
}

export type StatsInput = { valueUsd: number; products: number; harvests: number; premiumUsdg: number } | null;
const decFor = (v: number) => (Number.isInteger(v) || v >= 1000 ? 0 : 2);

/** Empat angka hidup. Tanpa data (belum tersambung atau gagal dimuat) tampil "—", bukan nilai karangan. */
export function StatsGrid({ stats }: { stats: StatsInput }) {
  const items: { t: string; k: string; node: React.ReactNode }[] = [
    { t: "01 · Value bound", k: "in Cordons and open rounds", node: <Count value={stats ? stats.valueUsd : null} dec={stats ? decFor(stats.valueUsd) : 0} prefix="$" /> },
    { t: "02 · Products live", k: "Cordons and vaults", node: <Count value={stats ? stats.products : null} pad={2} /> },
    { t: "03 · Harvests settled", k: "rounds so far", node: <Count value={stats ? stats.harvests : null} pad={2} /> },
    { t: "04 · Premium harvested", k: "paid out in USDG", node: <Count value={stats ? stats.premiumUsdg : null} dec={stats ? decFor(stats.premiumUsdg) : 0} prefix="$" /> },
  ];
  const move = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  };
  return (
    <div className="stats">
      {items.map((s, i) => (
        <Appear key={s.t} className="stat" delay={i * 0.08} style={{ "--mx": "50%" } as CSSProperties} onMouseMove={move}>
          <div className="t">{s.t}</div>
          <div className="v">{s.node}</div>
          <div className="k">{s.k}</div>
        </Appear>
      ))}
    </div>
  );
}
