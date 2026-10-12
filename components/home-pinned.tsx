"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { marketState } from "@/lib/api/market";
import { MarketStatusPill } from "./data";
import { Mosaic } from "./mosaic";
import { Appear, Countdown, SplitTitle, Tag } from "./primitives";
import { Ill, type IllKind } from "./sheaf-art";

// Scene "pinned" di Home (Fase 4.3): kiri = panggung lengket berisi ilustrasi + widget per langkah, kanan = enam langkah yang digulir.
// Langkah yang melewati tengah layar (IntersectionObserver, margin -45%) menyalakan scene-nya. Di bawah 1000px panggung disembunyikan
// dan tiap langkah membawa salinan scene-nya sendiri (.m-art), seperti m-art di annona.html.
// Angka di widget berasal dari data hidup (diformat di server dan dikirim sebagai string); yang tidak ada tampil "—" atau "Not live yet".
export type PinnedLive = {
  cordonHref: string; spurHref: string; graftHref: string;
  nav: string; cordonLive: boolean;
  spurStrike: string; spurApy: string; spurLive: boolean;
  graftStrike: string; graftApy: string; graftLive: boolean; graftOpen: boolean;
  expiry: string | null;
};

const TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA"];
const DRIFT = [13.1, 12.4, 14.0, 13.6, 15.2, 18.3, 13.4];
const SAMPLE_WALLET = "0x7a3f…c41e";

const STEPS: { ill: IllKind; h: ReactNode; p: string; trade?: string; t: string[] }[] = [
  { ill: "sheaf", h: <>Seven stalks, <em>one cordon</em></>, p: "Mint cMAG7 with USDG while the market is open. The vault holds seven large companies at equal weight. You hold one token, and you keep the basket’s ups and its downs.", t: ["One token", "Equal weight", "Redeem in-kind any time", "Mint in market hours"] },
  { ill: "winnow", h: <>Pruned <em>on schedule</em></>, p: "Prices move and weights drift. On a set calendar, the keeper trims the cordon back to target. Every trade is checked against the oracle price, with a hard cap on slippage, and only while prices are live.", t: ["Scheduled", "Oracle-checked", "Slippage cap", "Live prices only"] },
  { ill: "sickle", h: <>Sell the <em>top of the field</em></>, p: "Deposit a Stock Token. Each week a Picker buys the upside above a strike and pays the premium the moment the option is sold. You collect it every round.", trade: "Spurs cap your upside. That is the trade.", t: ["Weekly round", "Premium up front", "Paid in USDG", "Upside capped"] },
  { ill: "granary", h: <>Paid to wait <em>for a lower price</em></>, p: "Store USDG in the vault. A Picker pays premium for the promise to cover the drop below a strike. If the price ends below it, the vault pays out the shortfall in cash.", t: ["USDG in", "Strike below price", "Cash-settled", "Can lose more than premium"] },
  { ill: "scale", h: <>The Harvest, <em>every Friday</em></>, p: "Each round ends at the US market close on Friday. Your Harvest Card shows the realized result as a percentage, never a promise. How a round settles is still being decided, and the docs say so plainly.", t: ["Friday 16:00 ET", "Realized, not projected", "Shareable Harvest Card"] },
  { ill: "mosaic", h: <>Your portfolio, <em>on the Wall</em></>, p: "The Wall draws your positions as a sheaf of wheat. Each position is a stalk, and each Harvest you collect adds a grain. Share it with percentages only, unless you choose to show amounts.", t: ["Deterministic", "One stalk per position", "One grain per Harvest", "You choose what to share"] },
];

/* ---------------------------------------------------------------- Widget per scene ---------------------------------------------------------------- */

const Row = ({ k, children }: { k: string; children: ReactNode }) => <div className="row"><span className="k">{k}</span><span className="num">{children}</span></div>;
const Cta = ({ href, children, disabled }: { href: string; children: ReactNode; disabled?: boolean }) =>
  disabled ? <span className="wbtn" aria-disabled="true">{children}</span> : <Link className="wbtn" href={href}>{children}</Link>;

const everyMinute = (cb: () => void) => { const id = setInterval(cb, 60_000); return () => clearInterval(id); };
function MarketPill() {
  const state = useSyncExternalStore(everyMinute, () => marketState(new Date()), () => null);
  return state ? <MarketStatusPill state={state} /> : <span className="pill"><i aria-hidden="true" />—</span>;
}

// Bobot melenceng lalu dipangkas kembali tiap 3,2 detik (drift() di annona.html). Reduced motion: diam di kondisi melenceng.
function Drift() {
  const [trimmed, setTrimmed] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const h = setInterval(() => setTrimmed((v) => !v), 3200);
    return () => clearInterval(h);
  }, []);
  return (
    <>
      <div className="drift" role="img" aria-label="Seven stock weights drifting apart, then trimmed back to equal weight.">
        {TICKERS.map((t, i) => {
          const v = trimmed ? 14.3 : DRIFT[i];
          return <div key={t}><span>{t}</span><div className="bar"><b style={{ width: `${v * 4}%` }} /></div><span className="w" style={{ textAlign: "right" }}>{v.toFixed(1)}%</span></div>;
        })}
      </div>
      <div className="hint">{trimmed ? "Trimmed back to equal weight." : "Weights drift with the market. The keeper trims them back."}</div>
    </>
  );
}

function Widget({ i, live }: { i: number; live: PinnedLive }) {
  switch (i) {
    case 0:
      return (
        <div className="widget">
          <div className="w-title"><span className="mono">cMAG7 · Cordon</span><Tag>{live.cordonLive ? "Live" : "Not live yet"}</Tag></div>
          <div className="comp" aria-hidden="true">{TICKERS.map((_, k) => <span key={k} style={{ "--i": k } as CSSProperties} />)}</div>
          <div className="legend">{TICKERS.map((t) => <span key={t}>{t}</span>)}</div>
          <Row k="Weights">Equal · 14.29%</Row>
          <Row k="NAV per share">{live.nav}</Row>
          <div className="row"><span className="k">Pays premium</span><span>No</span></div>
          <Cta href={live.cordonHref}>Mint with USDG</Cta>
          <div className="hint">Minting needs the market to be open.</div>
        </div>
      );
    case 1:
      return (
        <div className="widget">
          <div className="w-title"><span>Pruning</span><MarketPill /></div>
          <Drift />
        </div>
      );
    case 2:
      return (
        <div className="widget">
          <div className="w-title"><span className="mono">sNVDA · Spur Vault</span><Tag>{live.spurLive ? "Live" : "Not live yet"}</Tag></div>
          <Row k="You deposit">NVDA</Row>
          <Row k="Strike this week">{live.spurStrike}</Row>
          <div className="row"><span className="k">Premium</span><span className="num" style={{ color: "var(--wheat)" }}>✦ paid up front</span></div>
          <Row k="Realized APY">{live.spurApy}</Row>
          <Cta href={live.spurHref}>Join next round</Cta>
          <div className="hint">Deposits queue for the next round.</div>
        </div>
      );
    case 3:
      return (
        <div className="widget">
          <div className="w-title"><span className="mono">gNVDA · Graft Vault</span><Tag>{live.graftLive ? "Live" : "Not live yet"}</Tag></div>
          <Row k="Collateral">USDG</Row>
          <div className="row"><span className="k">Strike</span><span>{live.graftOpen ? live.graftStrike : "Below today’s price"}</span></div>
          <div className="row"><span className="k">Settlement</span><span>Cash</span></div>
          <Row k="Realized APY">{live.graftApy}</Row>
          <Cta href={live.graftHref} disabled={!live.graftOpen}>{live.graftOpen ? "Join next round" : "No round open"}</Cta>
          <div className="hint">{live.graftOpen ? "Deposits queue for the next round." : "The next round shows up here."}</div>
        </div>
      );
    case 4:
      return (
        <div className="widget">
          <div className="w-title"><span>Next Harvest</span><span className="mono" style={{ fontSize: 11 }}>FRI 16:00 ET</span></div>
          {live.expiry ? <Countdown to={live.expiry} /> : <Countdown />}
          <div className="tessera">
            <div className="t1">My field harvested <b>+0.42%</b> this week.</div>
            <div className="t2"><span>HARVEST CARD · PREVIEW</span><span>DEMO</span></div>
          </div>
        </div>
      );
    default:
      return (
        <div className="widget">
          <div className="w-title"><span>Your Wall</span><Tag>Preview</Tag></div>
          <Mosaic address={SAMPLE_WALLET} cols={16} rows={10} />
          <div className="hint">Same wallet, same drawing. A sample wallet is shown here.</div>
        </div>
      );
  }
}

function Scene({ i, live, on }: { i: number; live: PinnedLive; on?: boolean }) {
  return (
    <div className={`scene${on ? " on" : ""}`} data-scene={i}>
      <Ill kind={STEPS[i].ill} className="ill" />
      <Widget i={i} live={live} />
    </div>
  );
}

export function Pinned({ live }: { live: PinnedLive }) {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (es) => es.forEach((en) => { if (en.isIntersecting) setActive(Number((en.target as HTMLElement).dataset.step)); }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, []);
  return (
    <div className="pin">
      <div className="pin-art">
        <div className="stage">
          <div className="gridbg" aria-hidden="true" />
          <div className="counter" aria-hidden="true"><b>{String(active + 1).padStart(2, "0")}</b> / {String(STEPS.length).padStart(2, "0")}</div>
          <div className="ticks" aria-hidden="true">{STEPS.map((_, i) => <i key={i} className={i === active ? "on" : undefined} />)}</div>
          {STEPS.map((_, i) => <Scene key={i} i={i} live={live} on={i === active} />)}
        </div>
      </div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <article key={i} className="step" data-step={i} ref={(el) => { steps.current[i] = el; }}>
            <div className="m-art"><Scene i={i} live={live} /></div>
            <div className="idx">{String(i + 1).padStart(2, "0")}</div>
            <SplitTitle level={3}>{s.h}</SplitTitle>
            <Appear as="p">{s.p}</Appear>
            {s.trade && <Appear as="p" className="trade">{s.trade}</Appear>}
            <Appear as="ul" className="ticks-l">{s.t.map((x) => <li key={x}>{x}</li>)}</Appear>
          </article>
        ))}
      </div>
    </div>
  );
}
