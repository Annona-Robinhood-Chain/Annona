import type { CSSProperties } from "react";
import { generateSheaf, type TreeInput } from "@/lib/tree";
import { Appear } from "./primitives";
import { SUN } from "./sheaf-art";

// Sheaf SVG dari data akun (satu tangkai per cordon, satu bulir per Harvest, daun dari streak). Dipakai Landing, /wall, Harvest Card,
// dan sebagai cadangan pohon 3D (GardenTree) bila WebGL tidak ada. Gaya garis seperti drawSheaf() di annona.html.
// tone="card": warna tetap terang di atas kartu gelap (Harvest Card), tidak mengikuti tema halaman.
// animate: tangkai, bulir, lalu pita tergambar bertahap saat terlihat (kelas .sheaf-grow di globals.css; statis bila reduced-motion).
const dr = (len: number, dl: number): CSSProperties => ({ "--len": len, "--dl": `${Math.round(dl * 100) / 100}s` }) as CSSProperties;

export function WallTree({ input, className = "w-full max-w-xs", tone = "default", animate = false }: { input: TreeInput; className?: string; tone?: "default" | "card"; animate?: boolean }) {
  const s = generateSheaf(input);
  const card = tone === "card";
  const stroke = card ? "#EEE6D9" : "var(--fg)", leaf = card ? "#9CC08A" : "var(--gain)", muted = card ? "#968B7C" : "var(--fg-3)";
  const svg = (
    <svg viewBox={s.viewBox} role="img" className={animate ? "block h-auto w-full" : className} fill="none" strokeLinecap="round" strokeLinejoin="round"
      aria-label={`Wheat sheaf: ${input.positions.length} cordons, ${input.harvests} harvests`}>
      <g className={animate ? "sheaf-grow" : undefined}>
        {s.stalks.map((st, i) => (
          <g key={st.id + i} opacity={st.ghost ? 0.5 : 1}>
            <path d={st.d} stroke={stroke} strokeWidth={s.sw} strokeDasharray={st.ghost ? "3 6" : undefined} style={animate && !st.ghost ? dr(st.len, i * 0.05) : undefined} />
            {st.leaves.map((d, k) => <path key={`l${k}`} d={d} stroke={leaf} strokeWidth={s.sw * 0.6} style={animate ? dr(80, 0.5 + i * 0.05 + k * 0.04) : undefined} />)}
            {st.grains.map((g, k) => {
              const t = animate ? dr(60, 0.6 + i * 0.05 + k * 0.03) : undefined;
              return (
                <g key={`g${k}`}>
                  <ellipse cx={g.x} cy={g.y} rx={g.rx} ry={g.ry} transform={`rotate(${g.rot} ${g.x} ${g.y})`} stroke={stroke} strokeWidth={s.sw * 0.8} style={t} />
                  <line x1={g.x} y1={g.y} x2={g.ax} y2={g.ay} stroke={stroke} strokeWidth={s.sw * 0.5} opacity={0.7} style={t} />
                </g>
              );
            })}
          </g>
        ))}
        {s.tie.map((d, j) => <path key={`t${j}`} d={d} stroke={SUN} strokeWidth={s.sw * 3} style={animate ? dr(120, 1.1 + j * 0.1) : undefined} />)}
      </g>
      {s.hiddenFruits > 0 && <text x="290" y="16" textAnchor="end" fill={muted} className="font-mono text-[11px]">+{s.hiddenFruits}</text>}
    </svg>
  );
  return animate ? <Appear className={className}>{svg}</Appear> : svg;
}
