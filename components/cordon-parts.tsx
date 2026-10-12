import Link from "next/link";
import type { ComponentProps } from "react";
import { BRAND } from "./brand";
import { MarketStatusPill } from "./data";
import { Appear, Note, RiskBox, Tag } from "./primitives";

// Potongan halaman Cordons yang dipakai daftar dan detail (Fase 5).

/** Baris meta di kepala halaman: chip sesi pasar, penanda data demo, catatan jam. Padanan `sessionNote()` di annona.html. */
export function SessionMeta({ state, next, demo = false }: { state: ComponentProps<typeof MarketStatusPill>["state"]; next?: string; demo?: boolean }) {
  return (
    <>
      <MarketStatusPill state={state} next={next} />
      {demo && <Tag>Demo data · not live prices</Tag>}
      <Note>Session times are approximate and do not yet reflect exchange holidays.</Note>
    </>
  );
}

/** Kotak risiko Cordon (.risk). Daftar butir seperti `riskBox()` di annona.html: butir pertama khusus Cordon, sisanya RISK_BASE. */
export function CordonRisk() {
  return (
    <RiskBox
      items={[
        "A Cordon keeps the ups and downs of its basket.",
        "Its Stock Tokens are tokenised debt securities: economic exposure to a stock, not legal rights to the shares.",
        "Token prices can sit above the raw share price because dividends are reinvested.",
        <>Not offered to US persons. Other regions are restricted. See <Link href="/restricted">where {BRAND} is restricted</Link>.</>,
      ]}
    />
  );
}

/** Komposisi target: satu baris per Stock Token (ticker, bilah yang terisi saat terlihat, persen). Padanan `.cbar` di annona.html. */
export function CompositionRows({ items, label }: { items: { label: string; weightBps: number }[]; label: string }) {
  return (
    <Appear>
      <ul className="cbars" aria-label={label}>
        <li className="cbar cbar-h" aria-hidden="true"><span>Stock Token</span><span /><span>Target</span></li>
        {items.map((it) => (
          <li key={it.label} className="cbar">
            <span>{it.label}</span>
            <div className="bar" aria-hidden="true"><b style={{ "--w": `${it.weightBps / 100}%` } as React.CSSProperties} /></div>
            <span>{(it.weightBps / 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </Appear>
  );
}
