import { shortAddr, usd } from "@/lib/format";
import { Appear, Label, Tag, TiltCard } from "./primitives";
import { ROUND_STATUS } from "./product";
import { RoundCountdown } from "./round-countdown";
import { ButtonLink } from "./ui";

// Potongan halaman Harvest (Fase 7): kartu round per vault, kotak "This round records" + pratinjau Harvest Card, tabel round gabungan.
// Padanan `pMeasure()` di annona.html; istilah produk mengikuti K5 (Measure → Harvest, Merchant → Picker, Tessera → Harvest Card).

const expiryFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const qtyFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

/** Round yang sedang berjalan di satu vault (subset dari data `getVault().currentRound`). */
export type HarvestRound = { no: number; status: string; strike: number; expiry: string; notional: number; premiumUsdg: number | null; picker: string | null };

const STATUS_TEXT: Record<string, string> = {
  auctioned: "Premium is already paid. The round is waiting for expiry.",
  open: "The round is open. A Picker has not paid the premium yet.",
};

/** Kartu round satu vault (.pcard tanpa tautan; tombol di dalamnya yang menuju halaman vault). Tanpa round: keadaan "No round is open." */
export function HarvestRoundCard({ symbol, kind, underlying, round, index = 0 }: {
  symbol: string; kind: "spur" | "graft"; underlying?: string; round: HarvestRound | null; index?: number;
}) {
  const type = kind === "spur" ? "Spur Vault · covered call" : "Graft Vault · cash-secured put";
  const id = `hr-${symbol}`;
  return (
    <TiltCard className="pcard hr-card" delay={index * 0.1} role="group" aria-labelledby={id}>
      <div className="top">
        <div><div className="sym">{symbol}</div><div className="nm">{type}{underlying && ` on ${underlying}`}</div></div>
        <Tag sun={!!round}>{round ? `Round #${round.no}` : "No round"}</Tag>
      </div>
      <h3 id={id} className="hr-title">{round ? `Round #${round.no}` : "No round is open."}</h3>
      <p className="muted hr-text">{round ? (STATUS_TEXT[round.status] ?? "") : "The next round opens soon. Past rounds are listed below."}</p>
      {round && (
        <>
          <div className="row"><span className="k">Strike</span><span className="num">{usd(round.strike)}</span></div>
          <div className="row"><span className="k">Expires</span><span><time dateTime={round.expiry}>{expiryFmt.format(new Date(round.expiry))} ET</time></span></div>
          <div className="row"><span className="k">Notional</span><span className="num">{qtyFmt.format(round.notional)}{underlying && ` ${underlying}`}</span></div>
          <div className="row"><span className="k">Premium paid</span><span className="num">{round.premiumUsdg === null ? "Not auctioned yet" : usd(round.premiumUsdg)}</span></div>
          <div className="row"><span className="k">Picker</span><span className="num">{round.picker ? shortAddr(round.picker) : "—"}</span></div>
          <div className="row"><span className="k">Status</span><span>{ROUND_STATUS[round.status] ?? round.status}</span></div>
          <RoundCountdown expiry={round.expiry} label="Time to expiry" />
        </>
      )}
      <ButtonLink href={`/vaults/${symbol}`} variant="ghost" size="sm" arrow>Open {symbol}</ButtonLink>
    </TiltCard>
  );
}

/** Kartu putus-putus untuk vault yang belum ada di data dan belum dikonfigurasi: tanpa angka, tanpa tautan ke halaman yang tidak ada. */
export function HarvestPlanCard({ kind, index = 0 }: { kind: "spur" | "graft"; index?: number }) {
  const spur = kind === "spur";
  return (
    <Appear className="pcard plan hr-card" delay={index * 0.1}>
      <div className="top">
        <div><div className="sym">{spur ? "Spur Vault" : "gNVDA"}</div><div className="nm">{spur ? "Spur Vault" : "Graft Vault"} · not connected yet</div></div>
        <Tag>Not live</Tag>
      </div>
      <h3 className="hr-title">Not connected yet.</h3>
      <p className="muted hr-text">This vault is not connected to the site yet.</p>
      <ButtonLink href={`/vaults?kind=${kind}`} variant="ghost" size="sm" arrow>See {spur ? "Spurs" : "Grafts"}</ButtonLink>
    </Appear>
  );
}

const RECORDS = ["Strike", "Expiry", "Notional", "Premium", "Picker", "Settlement price"];

/** Kolom kanan: apa yang dicatat satu round (.fields) + pratinjau Harvest Card (.tessera). Pratinjau memakai "—", bukan angka contoh. */
export function HarvestRecords() {
  return (
    <Appear className="form">
      <Label reveal={false}>This round records</Label>
      <ul className="fields" aria-label="Recorded for every round">
        {RECORDS.map((r) => <li key={r}>{r}</li>)}
      </ul>
      <div className="tessera" role="img" aria-label="Harvest Card preview. The first result appears after the first Harvest.">
        <div className="t1">My garden harvested <b>—</b> this week.</div>
        <div className="t2" aria-hidden="true"><span>HARVEST CARD</span><span>AFTER FIRST HARVEST</span></div>
      </div>
    </Appear>
  );
}

/** Baris tabel "Past rounds": satu baris per round dari kedua vault. */
export type HarvestRow = { symbol: string; no: number; strike: number; expiry: string; premiumUsdg: number | null; settlementPrice?: number | null; status: string };

/** Tabel round gabungan Spur + Graft (.dtable). Kolom Vault ditambahkan (html memakai satu tabel untuk semua vault). */
export function HarvestRoundsTable({ rows, empty = "No rounds yet. The first Harvest will show up here." }: { rows: HarvestRow[]; empty?: string }) {
  const heads: [string, boolean][] = [["Vault", false], ["Round", false], ["Strike", true], ["Expiry", false], ["Premium", true], ["Settled at", true], ["Status", false]];
  return (
    <Appear className="dtable-wrap">
      <table className="dtable">
        <caption className="sr-only">Past rounds, newest first</caption>
        <thead><tr>{heads.map(([h, r]) => <th key={h} scope="col" className={r ? "r" : undefined}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={heads.length} className="dim" style={{ textAlign: "center", padding: 36 }}>{empty}</td></tr>}
          {rows.map((r) => (
            <tr key={`${r.symbol}-${r.no}`}>
              <th scope="row" className="mono">{r.symbol}</th>
              <td>#{r.no}</td>
              <td className="num r">{usd(r.strike)}</td>
              <td className="nw">{r.expiry.slice(0, 10)}</td>
              <td className="num r">{r.premiumUsdg === null ? "—" : usd(r.premiumUsdg)}</td>
              <td className="num r">{r.settlementPrice ? usd(r.settlementPrice) : "—"}</td>
              <td>{ROUND_STATUS[r.status] ?? r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Appear>
  );
}
