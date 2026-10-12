import { pct, usd } from "@/lib/format";
import { Delta } from "./data";
import { Appear, ChartEmpty, Tag, TiltCard } from "./primitives";
import { Ill } from "./sheaf-art";
import { TrendChart } from "./sparkline";
import { buttonClass } from "./ui";

const dash = (why: string) => <>—<span className="sr-only"> {why}</span></>;

export function CordonCard({ symbol, name, nav, change, assets, tvlUsd, composition, trend, isDemo, index = 0 }: {
  symbol: string; name: string; nav: number | null; change: number | null; assets: number; tvlUsd?: number | null;
  composition?: { label: string; weightBps: number }[]; trend?: number[]; isDemo?: boolean; index?: number;
}) {
  // Kartu gaya Annona (.pcard): simbol mono + nama, jumlah aset, ticker, grafik 3 bulan, baris angka, tombol ghost.
  return (
    <TiltCard href={`/cordons/${symbol}`} className="pcard" delay={index * 0.1}>
      <div className="top">
        <div><div className="sym">{symbol}</div><div className="nm">Cordon · Stock basket</div><div className="nm">{name}</div></div>
        <div className="tags"><Tag sun>{assets} assets</Tag>{isDemo && <Tag>demo</Tag>}</div>
      </div>
      {composition && composition.length > 0
        ? <ul className="tickers" aria-label="Components">{composition.map((c) => <li key={c.label}>{c.label}</li>)}</ul>
        : <div className="tickers" aria-hidden="true" />}
      <div className="note" style={{ marginBottom: 4 }}>Last 3 months</div>
      {trend && trend.length >= 2
        ? <TrendChart values={trend} label={`${symbol} NAV trend, last 3 months, from ${usd(trend[0])} to ${usd(trend[trend.length - 1])}`} />
        : <ChartEmpty label="No NAV history yet" />}
      <div className="row"><span className="k">NAV per share</span><span className="num">{nav === null ? dash("no NAV yet") : usd(nav)}</span></div>
      {change !== null && <div className="row"><span className="k">Since last close</span><span className="num"><Delta value={change} /></span></div>}
      {tvlUsd != null && <div className="row"><span className="k">Total value</span><span className="num">{usd(tvlUsd)}</span></div>}
      <span aria-hidden className={buttonClass("ghost", "sm")}>View Cordon <span className="arr">→</span></span>
    </TiltCard>
  );
}
const expiryFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const ROUND_STATUS: Record<string, string> = { open: "open", auctioned: "premium auctioned" };

// apy dan strike boleh null: vault baru belum punya round settled (APY) atau belum punya round aktif (strike).
// Kartu gaya Annona (.pcard, Fase 6.1): simbol mono + jenis vault, chip aset yang disetor, ilustrasi (sabit / lumbung), baris angka, tombol ghost.
export function VaultCard({ symbol, kind, underlying, apy, strike, round, isDemo, index = 0 }: {
  symbol: string; kind: "spur" | "graft"; underlying?: string; apy: number | null; strike: number | null;
  round?: { no: number; status: string; expiry: string } | null; isDemo?: boolean; index?: number;
}) {
  const spur = kind === "spur";
  const type = spur ? "Spur · Covered call" : "Graft · Cash-secured put";
  return (
    <TiltCard href={`/vaults/${symbol}`} className="pcard" delay={index * 0.1}>
      <div className="top">
        <div><div className="sym">{symbol}</div><div className="nm">{type}{underlying && ` on ${underlying}`}</div></div>
        <div className="tags"><Tag sun>{spur ? underlying ?? "Stock" : "USDG"} in</Tag>{isDemo && <Tag>demo</Tag>}</div>
      </div>
      <Ill kind={spur ? "sickle" : "granary"} className="vault-ill" />
      <div className="row"><span className="k">Strike this week</span><span className="num">{strike === null ? dash("no open round") : usd(strike)}</span></div>
      <div className="row">
        <span className="k">Realized APY</span>
        <span className="num">{apy === null ? <>{dash("no settled rounds yet")} <small className="note">no settled rounds</small></> : pct(apy, 1)}</span>
      </div>
      <div className="row">
        <span className="k">{round ? `Round #${round.no} · ${ROUND_STATUS[round.status] ?? round.status}` : "Round"}</span>
        <span>{round ? <>expires <time dateTime={round.expiry}>{expiryFmt.format(new Date(round.expiry))} ET</time></> : "No round open"}</span>
      </div>
      <span aria-hidden className={buttonClass("ghost", "sm")}>View vault <span className="arr">→</span></span>
    </TiltCard>
  );
}
// premiumUsdg dan settlementPrice boleh null: round yang belum dilelang atau belum settle.
export type RoundRow = { no: number; strike: number; expiry: string; premiumUsdg: number | null; settlementPrice?: number | null; status: string };
// Tabel riwayat Harvest gaya Annona (.dtable, Fase 6.2). `empty`: teks baris kosong bila belum ada round (seperti html: satu baris di tengah).
export function RoundHistoryTable({ rounds, empty = "No rounds yet. The first Harvest will show up here." }: { rounds: RoundRow[]; empty?: string }) {
  const heads: [string, boolean][] = [["Round", false], ["Strike", true], ["Expiry", false], ["Premium", true], ["Settled at", true], ["Status", false]];
  return (
    <Appear className="dtable-wrap">
      <table className="dtable">
        <caption className="sr-only">Harvest history</caption>
        <thead><tr>{heads.map(([h, r]) => <th key={h} scope="col" className={r ? "r" : undefined}>{h}</th>)}</tr></thead>
        <tbody>
          {rounds.length === 0 && <tr><td colSpan={heads.length} className="dim" style={{ textAlign: "center", padding: 36 }}>{empty}</td></tr>}
          {rounds.map((r) => (
            <tr key={r.no}>
              <th scope="row">#{r.no}</th>
              <td className="num r">{usd(r.strike)}</td>
              <td>{r.expiry.slice(0, 10)}</td>
              <td className="num r">{r.premiumUsdg === null ? "—" : usd(r.premiumUsdg)}</td>
              <td className="num r">{r.settlementPrice ? usd(r.settlementPrice) : "—"}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Appear>
  );
}
export function PositionList({ items }: { items: { id: string; label: string; valueUsd: number; weightBps: number }[] }) {
  return (
    <div className="plist">
      {items.map((p) => (
        <div key={p.id} className="row">
          <span className="k"><span className="mono">{p.label}</span> <span className="note">{(p.weightBps / 100).toFixed(1)}%</span></span>
          <span className="num">{usd(p.valueUsd)}</span>
        </div>
      ))}
    </div>
  );
}
