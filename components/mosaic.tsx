import { generateMosaic } from "@/lib/mosaic";

// Visual akun generatif dari alamat wallet (halaman Wall, Fase 8). Server component: SVG deterministik, jadi aman SSR.
// positions/measures (opsional) memakai jumlah nyata (pita = posisi, ubin emas = Harvest); tanpa itu hanya pratinjau dari alamat.
// Ubin masuk satu per satu dari tengah (.mosaic-svg rect.t di globals.css); animasi mati bila reduced-motion.
export function Mosaic({ address, cols, rows, positions, measures, className = "" }: { address: string; cols?: number; rows?: number; positions?: number; measures?: number; className?: string }) {
  const m = generateMosaic(address, { cols, rows, positions, measures });
  return (
    <svg viewBox={m.viewBox} role="img" aria-label={`Account mosaic: ${m.positions} ${m.positions === 1 ? "band" : "bands"}, ${m.measures} gold ${m.measures === 1 ? "tile" : "tiles"}`} className={`mosaic-svg ${className}`}>
      <rect x={0} y={0} width={m.width} height={m.height} fill={m.back} />
      {m.tiles.map((t, i) => <rect key={i} className="t" x={t.x} y={t.y} width={t.w} height={t.w} rx={1.6} fill={t.fill} style={{ "--td": `${t.delay}s` } as React.CSSProperties} />)}
    </svg>
  );
}
