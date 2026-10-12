import { pct } from "@/lib/format";
import { Pill } from "./primitives";
import { Reveal } from "./reveal";

export function Delta({ value }: { value: number }) {
  return <span className={`inline-flex items-center gap-1 font-medium ${value < 0 ? "text-blight" : "text-leaf"}`}>{value < 0 ? "▼" : "▲"} {pct(value)}</span>;
}
// Chip status bergaya Annona (.pill, Fase 2.1). Titik berwarna = sesi (hijau = reguler, gandum = extended, merah = malam/dijeda, abu-abu = tutup); teks status selalu ada, jadi bukan hanya soal warna.
const STATES = { regular: ["open", "Regular session"], extended: ["pre", "Extended hours"], overnight: ["night", "Overnight"], closed: [undefined, "Closed"], paused: ["night", "Oracle paused"] } as const;
export function MarketStatusPill({ state, next, prefix }: { state: keyof typeof STATES; next?: string; prefix?: string }) {
  const [kind, label] = STATES[state];
  return (
    <Pill kind={kind} role="status" className="font-medium">
      {prefix && <span className="font-normal text-bark">{prefix} ·</span>}{label}{next && <span className="font-normal text-bark"> · {next}</span>}
    </Pill>
  );
}
// Kotak risiko bergaya Annona (.risk, Fase 2.3): garis oranye di kiri, tanpa warna alarm merah.
export function RiskCallout({ children }: { children: React.ReactNode }) {
  return <aside role="note" className="risk"><b>Risk.</b> {children}</aside>;
}
// Warna segmen mengikuti pola espalier.html: daun, daun 72%, kulit kayu 80% (tiap kelipatan 3).
const segColor = (i: number) => i % 3 === 2 ? "color-mix(in srgb, var(--bark) 80%, var(--wall))" : i % 2 === 1 ? "color-mix(in srgb, var(--leaf) 72%, var(--wall))" : "var(--leaf)";
export function CompositionBar({ items }: { items: { label: string; weightBps: number }[] }) {
  return (
    <Reveal>
      <div className="mb-3 flex h-10 gap-[3px] overflow-hidden rounded-[10px]" aria-hidden>
        {items.map((it, i) => <span key={it.label} className="comp-seg block" style={{ "--w": `${it.weightBps / 100}%`, "--d": `${i * 60}ms`, background: segColor(i) } as React.CSSProperties} />)}
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-x-3 gap-y-1.5 text-[.84rem]">
        {items.map((it) => (
          <li key={it.label} className="flex justify-between gap-1.5 border-b border-dotted border-wire pb-[3px]">
            <span className="font-mono">{it.label}</span><span className="text-bark">{(it.weightBps / 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
