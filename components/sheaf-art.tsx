import { useId, type CSSProperties, type ReactNode } from "react";

// Port drawSheaf / sunDisc dari annona.html sebagai JSX murni (tanpa DOM, aman untuk SSR).
// Dipakai loader (Fase 1). Fase 3.1 menambah Orbits dan Ill (port orbits() dan ill()) untuk ilustrasi 2D di scene pinned, kartu, dan halaman sistem.
// Semua angka dibulatkan 2 desimal supaya string atribut sama persis di server dan klien (tidak ada mismatch hidrasi).
const SUN = "#E5642B", WHEAT = "#D8B25E", INK = "#14110F";
const r2 = (n: number) => Math.round(n * 100) / 100;
type Draw = CSSProperties & { "--len"?: number; "--dl"?: string };
const dr = (len: number, dl: number): Draw => ({ "--len": len, "--dl": `${r2(dl)}s` });

export function SheafPaths({ cx, baseY, h, n, stroke, sw, animate = false }: { cx: number; baseY: number; h: number; n: number; stroke: string; sw: number; animate?: boolean }) {
  const tieY = baseY - h * 0.42;
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    const topX = cx + t * h * 0.36, topY = baseY - h + Math.abs(t) * h * 0.16;
    const botX = cx - t * h * 0.12, botY = baseY - Math.abs(t) * 4;
    out.push(<path key={`s${i}`} d={`M${r2(botX)} ${r2(botY)} Q${r2(cx + t * 3)} ${r2(tieY)} ${r2(topX)} ${r2(topY)}`} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" style={animate ? dr(Math.round(h * 1.3), i * 0.05) : undefined} />);
    const dx = topX - (cx + t * 3), dy = topY - tieY, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const ang = (Math.atan2(uy, ux) * 180) / Math.PI + 90;
    for (let k = 0; k < 7; k++) {
      const d = k * h * 0.03, side = k % 2 ? 1 : -1;
      const ex = topX - ux * d + -uy * side * h * 0.012, ey = topY - uy * d + ux * side * h * 0.012;
      const st = animate ? dr(60, 0.6 + i * 0.05 + k * 0.03) : undefined;
      out.push(<ellipse key={`e${i}-${k}`} cx={r2(ex)} cy={r2(ey)} rx={r2(h * 0.012)} ry={r2(h * 0.026)} transform={`rotate(${r2(ang + side * 18)} ${r2(ex)} ${r2(ey)})`} fill="none" stroke={stroke} strokeWidth={r2(sw * 0.8)} style={st} />);
      out.push(<line key={`l${i}-${k}`} x1={r2(ex)} y1={r2(ey)} x2={r2(ex + ux * h * 0.06 + -uy * side * h * 0.03)} y2={r2(ey + uy * h * 0.06 + ux * side * h * 0.03)} stroke={stroke} strokeWidth={r2(sw * 0.5)} opacity={0.7} style={st} />);
    }
  }
  // Ikatan oranye (dua lengkung)
  [[-4, 6], [6, 16]].forEach(([a, b], j) => {
    out.push(<path key={`t${j}`} d={`M${r2(cx - h * 0.07)} ${r2(tieY + a)} Q${cx} ${r2(tieY + b)} ${r2(cx + h * 0.07)} ${r2(tieY + a)}`} stroke={SUN} strokeWidth={r2(sw * 3)} fill="none" strokeLinecap="round" style={animate ? dr(120, 1.1 + j * 0.1) : undefined} />);
  });
  return <>{out}</>;
}

// Cakram matahari: glow radial, isian oranye, garis arsir bergerak (mask pudar dari atas). `id` harus unik per halaman.
export function SunDisc({ cx, cy, r, id, hatch = INK }: { cx: number; cy: number; r: number; id: string; hatch?: string }) {
  const lines: ReactNode[] = [];
  for (let y = cy - r - 8; y < cy + r + 8; y += 8) lines.push(<line key={y} x1={cx - r} y1={y} x2={cx + r} y2={y} stroke={hatch} strokeWidth={2} opacity={0.7} />);
  return (
    <>
      <defs>
        <clipPath id={`c${id}`}><circle cx={cx} cy={cy} r={r} /></clipPath>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity="1" /></linearGradient>
        <mask id={`m${id}`}><rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={`url(#g${id})`} /></mask>
        <radialGradient id={`r${id}`}><stop offset="0" stopColor={SUN} stopOpacity=".55" /><stop offset="1" stopColor={SUN} stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.55} fill={`url(#r${id})`} />
      <circle cx={cx} cy={cy} r={r} fill={SUN} />
      <g clipPath={`url(#c${id})`} mask={`url(#m${id})`}><g className="sun-hatch">{lines}</g></g>
    </>
  );
}



// Cincin orbit di sekeliling cakram matahari: cincin titik + bulir emas (berputar 60 dtk), lingkar tanda + titik oranye (90 dtk, berlawanan).
// Warna garis memakai --fg supaya terbaca di tema gelap dan terang. Putaran dimatikan oleh reduced-motion (globals.css).
export function Orbits({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const ticks: ReactNode[] = [], R = r * 1.42;
  for (let a = 0; a < 360; a += 6) {
    const rad = (a * Math.PI) / 180, l = a % 30 === 0 ? 10 : 4;
    ticks.push(<line key={a} x1={r2(cx + Math.cos(rad) * R)} y1={r2(cy + Math.sin(rad) * R)} x2={r2(cx + Math.cos(rad) * (R + l))} y2={r2(cy + Math.sin(rad) * (R + l))} stroke="var(--fg)" strokeOpacity={a % 30 === 0 ? 0.35 : 0.15} />);
  }
  const origin = { transformOrigin: `${cx}px ${cy}px` };
  return (
    <>
      <g className="ill-spin" style={origin}>
        <circle cx={cx} cy={cy} r={r2(r * 1.22)} fill="none" stroke="var(--fg)" strokeOpacity={0.22} strokeDasharray="2 7" />
        <circle cx={r2(cx + r * 1.22)} cy={cy} r={3.5} fill="var(--wheat)" />
      </g>
      <g className="ill-spin r" style={origin}>
        {ticks}
        <circle cx={cx} cy={r2(cy - R)} r={3} fill={SUN} />
      </g>
    </>
  );
}

export type IllKind = "sheaf" | "winnow" | "sickle" | "granary" | "scale" | "mosaic";
const MOSAIC_PAL = [SUN, WHEAT, "#9CC08A", "#B4A898", "#A85D3E"];
const fl = (i: number): CSSProperties => ({ "--fx": `${i % 2 ? 6 : -6}px`, "--fy": `${14 + (i % 5) * 3}px`, "--fd": `${3 + (i % 4)}s` }) as CSSProperties;

// Ilustrasi garis 300×300 di scene pinned, kartu, dan glyph (ill() di annona.html): cakram matahari + cincin + satu gambar per `kind`.
// SMIL <animateTransform> di versi html diganti kelas CSS (.ill-flake, .ill-beam) supaya ikut reduced-motion.
export function Ill({ kind, className }: { kind: IllKind; className?: string }) {
  const id = "i" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const BONE = "var(--fg)";
  const body: ReactNode[] = [];
  if (kind === "sheaf") body.push(<SheafPaths key="s" cx={150} baseY={272} h={210} n={11} stroke={BONE} sw={1.4} />);
  if (kind === "winnow") {
    body.push(<path key="a" d="M60 200 Q150 260 240 200" />, <path key="b" d="M60 200 Q150 225 240 200" />);
    for (let i = 0; i < 9; i++) body.push(<path key={`w${i}`} d={`M${80 + i * 18} ${r2(208 + Math.sin(i) * 4)} L${86 + i * 18} ${232 + (i % 3) * 6}`} opacity={0.6} />);
    for (let i = 0; i < 16; i++) {
      const x = 80 + ((i * 13) % 150), y = 70 + ((i * 29) % 120);
      body.push(<g key={`f${i}`} className="ill-flake" style={fl(i)}><ellipse cx={x} cy={y} rx={2} ry={4.5} transform={`rotate(${i * 40} ${x} ${y})`} fill={i % 3 ? BONE : "var(--wheat)"} stroke="none" /></g>);
    }
    body.push(<path key="c" d="M60 200 L40 175 M240 200 L262 175" />);
  }
  if (kind === "sickle") {
    body.push(<path key="h" d="M80 240 L120 200" stroke={BONE} strokeWidth={7} />, <path key="bl" d="M120 200 C 120 110, 230 70, 260 140 C 225 105, 150 120, 130 200 Z" />);
    for (let i = 0; i < 6; i++) body.push(<line key={`t${i}`} x1={140 + i * 18} y1={150 - i * 6} x2={150 + i * 18} y2={140 - i * 6} opacity={0.6} />);
    body.push(<SheafPaths key="s" cx={230} baseY={282} h={110} n={5} stroke={BONE} sw={1.1} />);
  }
  if (kind === "granary") {
    body.push(<path key="r" d="M70 270 V170 L150 120 L230 170 V270 Z" />, <path key="r2" d="M60 172 L150 112 L240 172" />);
    [100, 130, 170, 200].forEach((x) => body.push(<line key={`p${x}`} x1={x} y1={185} x2={x} y2={270} />));
    body.push(<path key="d" d="M135 270 V225 Q150 205 165 225 V270" stroke={SUN} strokeWidth={2.4} />);
    for (let y = 190; y < 270; y += 10) body.push(<line key={`l${y}`} x1={72} y1={y} x2={98} y2={y} opacity={0.35} />);
    body.push(<line key="g" x1={40} y1={272} x2={260} y2={272} />);
  }
  if (kind === "scale") {
    body.push(<line key="m" x1={150} y1={80} x2={150} y2={260} />, <path key="b" d="M120 262 H180" />);
    body.push(
      <g key="beam" className="ill-beam">
        <line x1={80} y1={116} x2={220} y2={116} strokeWidth={2} />
        <path d="M80 116 L60 176 M80 116 L100 176 M55 176 Q80 196 105 176 Z" />
        <path d="M220 116 L200 176 M220 116 L240 176 M195 176 Q220 196 245 176 Z" />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={212 + i * 6 - 6} cy={172 - (i % 2) * 4} r={3} fill="var(--wheat)" stroke="none" />)}
      </g>,
      <circle key="pv" cx={150} cy={78} r={6} fill={SUN} stroke="none" />,
    );
  }
  if (kind === "mosaic") {
    const cols = 8, rows = 6, sz = 22, ox = 50, oy = 130;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const edge = x === 0 || y === 0 || x === cols - 1 || y === rows - 1;
      const c = edge ? ((x + y) % 3 === 0 ? WHEAT : "#3B342E") : MOSAIC_PAL[(x * 3 + y * 5) % MOSAIC_PAL.length];
      body.push(<rect key={`${x}-${y}`} x={ox + x * sz + 1} y={oy + y * sz + 1} width={sz - 3} height={sz - 3} rx={2} fill={c} stroke="none" opacity={0.9} />);
    }
  }
  return (
    <svg viewBox="0 0 300 300" aria-hidden="true" className={className}>
      <SunDisc cx={190} cy={110} r={68} id={id} hatch="var(--bg)" />
      <g className="ill-spin" style={{ transformOrigin: "190px 110px" }}>
        <circle cx={190} cy={110} r={92} fill="none" stroke={BONE} strokeOpacity={0.2} strokeDasharray="1 6" />
        <circle cx={282} cy={110} r={3} fill="var(--wheat)" />
      </g>
      <g stroke={BONE} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">{body}</g>
    </svg>
  );
}

export { SUN, WHEAT, INK };
