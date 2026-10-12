"use client";
import Link from "next/link";
import {
  Fragment, cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore,
  type CSSProperties, type ElementType, type HTMLAttributes, type InputHTMLAttributes, type ReactElement, type ReactNode,
} from "react";
import { nextHarvestClose, splitDuration } from "@/lib/schedule";

// Pustaka primitif UI bergaya Annona (Fase 2). Padanan JS-nya di annona.html: enhance()/observe()/onScroll().
// Prinsip: semua perilaku lewat hook React (tanpa pemindai DOM global), aman SSR (HTML server = HTML hidrasi), dan
// tanpa JS atau dengan prefers-reduced-motion semuanya tampil utuh (CSS-nya hanya menyembunyikan di bawah <html class="js">).
const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = () => typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches;
const pad2 = (n: number) => String(n).padStart(2, "0");

/* ---------------------------------------------------------------- 2.2 Reveal ---------------------------------------------------------------- */

// Satu IntersectionObserver bersama; tiap elemen mendaftarkan callback sekali lalu dilepas (seperti observe() di html: threshold .12, margin bawah 6%).
const watchers = new Map<Element, () => void>();
let shared: IntersectionObserver | null = null;
function watch(el: Element, cb: () => void) {
  if (reduced() || typeof IntersectionObserver === "undefined") { cb(); return () => {}; }
  shared ??= new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { const f = watchers.get(e.target); watchers.delete(e.target); shared?.unobserve(e.target); f?.(); }
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  watchers.set(el, cb);
  shared.observe(el);
  return () => { watchers.delete(el); shared?.unobserve(el); };
}
/** Pasang pada elemen; `on` menjadi true sekali, saat elemen pertama kali masuk layar (atau langsung bila reduced motion). */
export function useInView<T extends Element = HTMLElement>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => { const el = ref.current; return el ? watch(el, () => setOn(true)) : undefined; }, []);
  return [ref, on] as const;
}

type PolyProps<T extends ElementType> = { as?: T; className?: string; style?: CSSProperties; children?: ReactNode } & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "children">;
const delayStyle = (style: CSSProperties | undefined, delay?: number) => (delay == null ? style : ({ ...style, "--d": `${delay}s` } as CSSProperties));

/** `data-reveal`: muncul naik tipis + memudar. variant "scale" (zoom masuk) atau "clip" (terbuka dari bawah). `delay` dalam detik. */
export function Appear<T extends ElementType = "div">({ as, variant, delay, className, style, children, ...rest }: PolyProps<T> & { variant?: "scale" | "clip"; delay?: number }) {
  const Tag = (as ?? "div") as ElementType;
  const [ref, on] = useInView();
  return <Tag ref={ref} data-reveal={variant ?? ""} className={cx(className, on && "in")} style={delayStyle(style, delay)} {...rest}>{children}</Tag>;
}

// data-split: tiap kata dibungkus .sw > span (naik dari bawah, jeda 45ms per kata). Menelusuri elemen anak (mis. <em>) dan menjaga <br>.
function splitNodes(node: ReactNode, c: { i: number }): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return String(node).split(/(\s+)/).map((p, k) => (!p ? null : /^\s+$/.test(p) ? " " : (
      <span className="sw" key={k}><span style={{ "--i": c.i++ } as CSSProperties}>{p}</span></span>
    )));
  }
  if (Array.isArray(node)) return node.map((n, k) => <Fragment key={k}>{splitNodes(n, c)}</Fragment>);
  if (isValidElement(node)) {
    if (node.type === "br") return node;
    const el = node as ReactElement<{ children?: ReactNode }>;
    return cloneElement(el, undefined, splitNodes(el.props.children, c));
  }
  return node;
}
/** Judul besar bergaya Annona dengan animasi kata-per-kata. `level` memilih h1/h2/h3 sekaligus ukuran (.d-h1/.d-h2/.d-h3). Beri `<em>` untuk kata beraksen. */
export function SplitTitle({ level = 2, className, style, children, ...rest }: { level?: 1 | 2 | 3; className?: string; style?: CSSProperties; children: ReactNode } & Omit<HTMLAttributes<HTMLHeadingElement>, "className" | "style" | "children">) {
  const Tag = `h${level}` as ElementType;
  const [ref, on] = useInView();
  return <Tag ref={ref} className={cx(`d-h${level}`, className, on && "in")} style={style} {...rest}>{splitNodes(children, { i: 0 })}</Tag>;
}

/** Hook pemanggil `cb` saat gulir/ubah ukuran (dibatasi satu kali per frame) dan sekali saat mount. Tidak berjalan di server. */
function useScrollEffect(cb: () => void) {
  const fn = useRef(cb);
  useEffect(() => { fn.current = cb; });
  useEffect(() => {
    let q = false;
    const run = () => { q = false; fn.current(); };
    const on = () => { if (!q) { q = true; requestAnimationFrame(run); } };
    run();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);
}

/** Paragraf besar yang kata-katanya menyala saat digulir (data-words). Tulis `[kata beraksen]` dalam kurung siku untuk huruf miring beraksen. */
export function WordFill({ text, className }: { text: string; className?: string }) {
  const words: { w: string; acc: boolean }[] = [];
  for (const m of text.matchAll(/\[([^\]]+)\]|(\S+)/g)) for (const w of (m[1] ?? m[2] ?? "").split(" ")) if (w) words.push({ w, acc: m[1] != null });
  const ref = useRef<HTMLParagraphElement>(null);
  const [k, setK] = useState(0);
  useScrollEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.25), 0, 1);
    setK(reduced() ? words.length : Math.round(p * words.length));
  });
  return (
    <p ref={ref} className={cx("wordscroll", className)}>
      {words.map((x, i) => <Fragment key={i}><span className={cx("hw", x.acc && "acc", i < k && "on")}>{x.w}</span>{" "}</Fragment>)}
    </p>
  );
}

/** Daftar bergaris yang garis oranyenya terisi saat digulir (data-fill). Pakai `className="psteps"` atau `"timeline"`; anak `<li>` yang sudah terlewati mendapat kelas `lit`. */
export function FillList({ as = "ol", className, children, ...rest }: { as?: "ol" | "ul"; className?: string; children: ReactNode } & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  const Tag = as as ElementType;
  const ref = useRef<HTMLElement>(null);
  useScrollEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rm = reduced(), vh = innerHeight, r = el.getBoundingClientRect();
    el.style.setProperty("--f", String(rm ? 1 : clamp((vh * 0.6 - r.top) / r.height, 0, 1)));
    el.querySelectorAll(":scope > li").forEach((li) => li.classList.toggle("lit", rm || li.getBoundingClientRect().top < vh * 0.6));
  });
  return <Tag ref={ref} className={className} {...rest}>{children}</Tag>;
}

/* ---------------------------------------------------------------- 2.3 Kartu, FAQ, kotak ---------------------------------------------------------------- */

/** Kartu miring mengikuti kursor + kilau (data-tilt). `className`: "tcard" | "pcard" | "gcol". Dengan `href` jadi tautan (next/link), tanpa itu <div>. Hanya pointer halus dan tanpa reduced motion. */
export function TiltCard({ href, className, delay, reveal = true, max = 4, style, children, ...rest }: {
  href?: string; className?: string; delay?: number; reveal?: boolean; max?: number; style?: CSSProperties; children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "children">) {
  const [ref, on] = useInView();
  const move = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || !fine() || reduced()) return;
    const c = e.currentTarget, b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
    c.style.setProperty("--ry", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
    c.style.setProperty("--rx", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
    c.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    c.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  };
  const leave = (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); };
  const common = {
    ref, "data-tilt": "", ...(reveal ? { "data-reveal": "" } : {}), className: cx(className, reveal && on && "in"),
    style: delayStyle(style, delay), onPointerMove: move, onPointerLeave: leave, ...rest,
  };
  return href ? <Link href={href} {...(common as object)}>{children}</Link> : <div {...(common as object)}>{children}</div>;
}

/** FAQ akordeon (.acc). Tiap butir terbuka/tutup sendiri-sendiri, seperti di annona.html. */
export function Accordion({ items, startOpen = [] }: { items: { q: ReactNode; a: ReactNode }[]; startOpen?: number[] }) {
  const base = useId();
  const [open, setOpen] = useState<Set<number>>(() => new Set(startOpen));
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <>
      {items.map((it, i) => {
        const o = open.has(i), id = `${base}-${i}`;
        return (
          <Appear key={i} className={cx("acc", o && "open")}>
            <button type="button" aria-expanded={o} aria-controls={id} onClick={() => toggle(i)}>
              <span className="n">{pad2(i + 1)}</span><span className="q">{it.q}</span><span className="pm" aria-hidden="true" />
            </button>
            <div className="acc-body" id={id} role="region"><div inert={!o}><p>{it.a}</p></div></div>
          </Appear>
        );
      })}
    </>
  );
}

/** Kotak risiko bergaris oranye (.risk). `items` dirender sebagai daftar; `children` untuk isi bebas. */
export function RiskBox({ lead = "Risks.", items, children, className, delay }: { lead?: ReactNode; items?: ReactNode[]; children?: ReactNode; className?: string; delay?: number }) {
  return (
    <Appear className={cx("risk", className)} delay={delay} role="note">
      <b>{lead}</b>{children && <> {children}</>}
      {items && <ul>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>}
    </Appear>
  );
}

/** Keadaan kosong (.empty): cincin putus-putus berputar + judul + penjelasan. */
export function Empty({ title, text, children, className }: { title: ReactNode; text?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <Appear className={cx("empty", className)}>
      <div className="er" aria-hidden="true"><i /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </Appear>
  );
}

/** Placeholder grafik kosong (.chart-empty): garis putus-putus + pemindai bergerak + label. */
export function ChartEmpty({ label, tall = false, className }: { label: string; tall?: boolean; className?: string }) {
  return (
    <div className={cx("chart-empty", tall && "tall", className)} role="img" aria-label={label}>
      <svg preserveAspectRatio="none" viewBox="0 0 400 120" aria-hidden="true"><path d="M0 90 L400 90" stroke="var(--line-2)" strokeDasharray="4 6" fill="none" /></svg>
      <div className="scan" aria-hidden="true" />
      <div className="ce-t" aria-hidden="true">{label}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- 2.1 Penanda kecil ---------------------------------------------------------------- */

export type PillKind = "open" | "pre" | "after" | "night";
/** Chip status bertitik: open (hijau berpendar), pre/after (gandum), night (merah), tanpa kind = abu-abu. */
export function Pill({ kind, className, children, ...rest }: { kind?: PillKind; className?: string; children: ReactNode } & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children">) {
  return <span className={cx("pill", kind, className)} {...rest}><i aria-hidden="true" />{children}</span>;
}
export function Tag({ sun = false, className, children }: { sun?: boolean; className?: string; children: ReactNode }) {
  return <span className={cx("tag", sun && "sun", className)}>{children}</span>;
}
/** Label kecil kapital bermono dengan garis di depan (.label). Ikut animasi reveal. */
export function Label({ children, className, delay, reveal = true }: { children: ReactNode; className?: string; delay?: number; reveal?: boolean }) {
  return reveal ? <Appear as="p" className={cx("label", className)} delay={delay}>{children}</Appear> : <p className={cx("label", className)}>{children}</p>;
}
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("note", className)}>{children}</p>;
}
/** Lencana pill di hero (.eyebrow) dengan titik berdenyut. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("eyebrow", className)}><span className="pulse" aria-hidden="true" />{children}</span>;
}
export function Chip({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="chip" href={href}>{children}</Link>;
}

/* ---------------------------------------------------------------- 2.4 Latar, header halaman, hitung mundur ---------------------------------------------------------------- */

export function GridBg({ className }: { className?: string }) { return <div className={cx("gridbg", className)} aria-hidden="true" />; }

/** Header halaman dalam (.phead): grid, bola cahaya, crumb, label, judul terpecah, lead, baris meta. Pakai bersama `<Header overlay />`. */
export function PageHead({ crumb, label, title, lead, meta }: { crumb?: ReactNode; label: ReactNode; title: ReactNode; lead?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="phead">
      <GridBg />
      <div className="orb" aria-hidden="true" />
      <div className="wrap">
        {crumb && <Appear as="nav" className="crumb" aria-label="Breadcrumb">{crumb}</Appear>}
        <Label>{label}</Label>
        <SplitTitle level={1}>{title}</SplitTitle>
        {lead && <Appear as="p" className="lead" delay={0.25}>{lead}</Appear>}
        {meta && <Appear className="meta-row" delay={0.35}>{meta}</Appear>}
      </div>
    </header>
  );
}

const tickEvery = (cb: () => void) => { const id = setInterval(cb, 1000); return () => clearInterval(id); };
/**
 * Hitung mundur 4 kotak (.cd). Tanpa `to`: menuju Jumat 16:00 ET berikutnya (lib/schedule.nextHarvestClose), tidak pernah habis.
 * Dengan `to` (ISO/ms/Date): menuju waktu itu dan berhenti di nol. Server dan hidrasi awal menampilkan "--" supaya HTML sama dengan klien.
 */
export function Countdown({ to, big = false, className }: { to?: string | number | Date; big?: boolean; className?: string }) {
  const sec = useSyncExternalStore(tickEvery, () => Math.floor(Date.now() / 1000), () => null);
  const left = sec === null ? null : to == null ? Math.floor(nextHarvestClose(new Date(sec * 1000)).getTime() / 1000) - sec : Math.floor(new Date(to).getTime() / 1000) - sec;
  const t = left === null ? null : splitDuration(left);
  const v = t ? [String(t.d), pad2(t.h), pad2(t.m), pad2(t.s)] : ["--", "--", "--", "--"];
  const names = big ? ["Days", "Hours", "Minutes", "Seconds"] : ["Days", "Hrs", "Min", "Sec"];
  const label = t ? `${t.d} days ${t.h} hours ${t.m} minutes ${t.s} seconds` : "Loading countdown";
  return (
    <div className={cx("cd", big && "big", className)} role="timer" aria-live="off" aria-label={label}>
      {v.map((x, i) => <div key={names[i]} aria-hidden="true"><b>{x}</b><small>{names[i]}</small></div>)}
    </div>
  );
}

/* ---------------------------------------------------------------- 2.5 Form ---------------------------------------------------------------- */

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cx("input", className)} {...rest} />; }

/** Kolom jumlah besar (.field): label + isi (input) + chip aset di kanan. Fokus menyalakan border oranye. */
export function Field({ label, aside, asset, children, className }: { label: ReactNode; aside?: ReactNode; asset?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cx("field", className)}>
      <label htmlFor={id}><span>{label}</span>{aside && <span>{aside}</span>}</label>
      <div className="fi">
        {isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string }>, { id: (children as ReactElement<{ id?: string }>).props.id ?? id }) : children}
        {asset && <span className="asset">{asset}</span>}
      </div>
    </div>
  );
}

/** Slider (input range) dengan isian oranye sampai posisi ibu jari (`--p`). Terkontrol: `value` + `onValueChange`. */
export function RangeSlider({ value, min, max, step = 1, onValueChange, className, ...rest }: {
  value: number; min: number; max: number; step?: number; onValueChange: (v: number) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "min" | "max" | "step" | "onChange" | "type">) {
  const p = max === min ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100);
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onValueChange(Number(e.target.value)), [onValueChange]);
  return <input type="range" className={cx("range", className)} min={min} max={max} step={step} value={value} onChange={onChange} style={{ "--p": `${p}%` } as CSSProperties} {...rest} />;
}

