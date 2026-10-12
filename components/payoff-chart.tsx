import { graftResult, holdResult, spurResult, type PayoffInput } from "@/lib/docs/payoff";
import { pct } from "@/lib/format";
import { Appear } from "./primitives";

// Diagram ilustratif hasil per saham pada expiry (Fase 6.3, palet Annona). SVG polos, tanpa data produk.
// Garis putus-putus = hanya memegang saham; garis oranye tebal (tergambar saat terlihat) = di dalam vault.
// Dua garis dibedakan oleh gaya garis dan label langsung, bukan hanya warna. Dipakai halaman Docs.
const W = 360, H = 232, L = 44, R = 14, T = 16, B = 38;

const CFG = {
  spur: { input: { start: 100, strike: 110, premiumPct: 0.9 } as PayoffInput, x: [80, 140], y: [-20, 40], fn: spurResult, name: "Spur Vault" },
  graft: { input: { start: 100, strike: 90, premiumPct: 0.9 } as PayoffInput, x: [60, 120], y: [-40, 20], fn: graftResult, name: "Graft Vault" },
} as const;

export function PayoffChart({ kind, titleId }: { kind: "spur" | "graft"; titleId: string }) {
  const c = CFG[kind];
  const { start, strike, premiumPct } = c.input;
  const [x0, x1] = c.x, [y0, y1] = c.y;
  const sx = (p: number) => L + ((p - x0) / (x1 - x0)) * (W - L - R);
  const sy = (r: number) => T + ((y1 - r) / (y1 - y0)) * (H - T - B);
  const pt = (p: number, f: (p: number) => number) => `${sx(p).toFixed(1)} ${sy(f(p)).toFixed(1)}`;
  const line = (pts: number[], f: (p: number) => number) => pts.map((p, i) => `${i ? "L" : "M"}${pt(p, f)}`).join("");
  const hold = line([x0, x1], (p) => holdResult(p, start));
  const vaultPts = [x0, strike, x1];
  const vault = line(vaultPts, (p) => c.fn(p, c.input));
  const area = `${vault} L${sx(x1).toFixed(1)} ${sy(0).toFixed(1)} L${sx(x0).toFixed(1)} ${sy(0).toFixed(1)}Z`;
  const yTicks: number[] = [];
  for (let t = y0; t <= y1; t += 20) yTicks.push(t);
  const desc = kind === "spur"
    ? `Illustrative chart. Start price ${start}, strike ${strike}, premium ${premiumPct}%. Below the strike, a Spur Vault tracks the stock with a small premium on top. Above the strike, the result stays flat at the cap while holding the stock keeps rising.`
    : `Illustrative chart. Start price ${start}, strike ${strike}, premium ${premiumPct}%. Above the strike, a Graft Vault earns only the premium. Below the strike, it loses value as the price falls, with the premium as a small cushion.`;
  const capY = c.fn(x1, c.input);

  return (
    <Appear className="w-full max-w-md">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={titleId} className="simchart h-auto w-full">
        <title id={titleId}>{kind === "spur" ? "Spur Vault result compared with holding the stock" : "Graft Vault result compared with buying the stock"}</title>
        <desc>{desc}</desc>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke={t === 0 ? "var(--line-2)" : "var(--line)"} strokeWidth={1} strokeDasharray={t === 0 ? undefined : "2 5"} />
            <text x={L - 6} y={sy(t) + 4} textAnchor="end" fill="var(--fg-3)" fontSize="10">{t === 0 ? "0%" : pct(t, 0)}</text>
          </g>
        ))}
        <line x1={sx(strike)} x2={sx(strike)} y1={T} y2={H - B} stroke="var(--fg-3)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={sx(start)} x2={sx(start)} y1={T} y2={H - B} stroke="var(--line-2)" strokeWidth="1" />
        <text x={sx(start)} y={H - B + 16} textAnchor="middle" fill="var(--fg)" fontSize="12" style={{ fontFamily: "var(--sans)" }}>Start</text>
        <text x={sx(strike)} y={H - B + 16} textAnchor="middle" fill="var(--fg)" fontSize="12" style={{ fontFamily: "var(--sans)" }}>Strike</text>
        <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" fill="var(--fg-3)" fontSize="12" style={{ fontFamily: "var(--sans)" }}>Price at expiry</text>
        <path d={hold} fill="none" stroke="var(--fg-2)" strokeWidth="1.6" strokeDasharray="6 5" />
        <path d={area} fill="rgba(229,100,43,.08)" stroke="none" />
        <path className="lineA" d={vault} fill="none" stroke="var(--sun)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={sx(start)} cy={sy(c.fn(start, c.input))} r="5" fill="var(--sun)" stroke="var(--bg-2)" strokeWidth="2" />
        <text x={W - R - 34} y={sy(holdResult(x1, start)) + 6} textAnchor="end" fill="var(--fg-2)" fontSize="12" style={{ fontFamily: "var(--sans)" }}>{kind === "spur" ? "Holding the stock" : "Buying the stock"}</text>
        <text x={W - R - 2} y={kind === "graft" ? sy(capY) + 20 : sy(capY) - 8} textAnchor="end" fill="var(--leaf)" fontSize="12" fontWeight="600" style={{ fontFamily: "var(--sans)" }}>{c.name}</text>
      </svg>
    </Appear>
  );
}
