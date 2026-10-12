import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompositionRows, CordonRisk, SessionMeta } from "@/components/cordon-parts";
import { Delta } from "@/components/data";
import { LiveUpdates } from "@/components/live-updates";
import { Footer, Header } from "@/components/layout-parts";
import { NavChart } from "@/components/nav-chart";
import { Appear, ChartEmpty, Empty, PageHead, SplitTitle } from "@/components/primitives";
import { LinkTabs } from "@/components/tabs";
import { MintRedeemPanel } from "@/components/trade-panels";
import { tradeLive, web3Env } from "@/lib/web3/env";
import { changePct } from "@/lib/api/derive";
import { ConfigError, SYMBOL } from "@/lib/api/http";
import { marketState, nextChange } from "@/lib/api/market";
import { getCordonPage, getNav, getPrunings } from "@/lib/api/queries";
import { RANGES, parseRange } from "@/lib/api/range";
import { cordonTopics } from "@/lib/realtime/live";
import { usd } from "@/lib/format";

// NAV dan sesi pasar berubah: jangan dibekukan saat build.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ symbol: string }>; searchParams: Promise<{ range?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const safe = SYMBOL.test(symbol) ? symbol : "Cordon";
  return { title: `${safe} — Annona`, description: `NAV, composition, and mint/redeem for ${safe}. Demo preview.` };
}

const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
const shareFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const sinceFmt = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
const sessionFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" });
const asOfFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

type Loaded =
  | { kind: "ok"; cordon: NonNullable<Awaited<ReturnType<typeof getCordonPage>>>; nav: NonNullable<Awaited<ReturnType<typeof getNav>>>; prunings: Awaited<ReturnType<typeof getPrunings>> }
  | { kind: "missing" }
  | { kind: "unconfigured" }
  | { kind: "error" };

async function load(symbol: string, days: number): Promise<Loaded> {
  try {
    // Riwayat pruning opsional: bila tabelnya belum ada (migrasi 0005 belum dijalankan), halaman tetap tampil dan panelnya memberi tahu.
    const [cordon, nav, prunings] = await Promise.all([getCordonPage(symbol), getNav(symbol, days), getPrunings(symbol).catch((e) => { console.error(e); return null; })]);
    if (!cordon || !nav) return { kind: "missing" };
    return { kind: "ok", cordon, nav, prunings };
  } catch (e) {
    if (e instanceof ConfigError) return { kind: "unconfigured" };
    console.error(e);
    return { kind: "error" };
  }
}

export default async function CordonDetailPage({ params, searchParams }: Props) {
  const { symbol } = await params;
  if (!SYMBOL.test(symbol)) notFound();
  const range = parseRange((await searchParams).range);
  const data = await load(symbol, range.days);
  if (data.kind === "missing") notFound();

  const now = new Date(), state = marketState(now), next = nextChange(now);
  const nextLabel = next ? `${sessionFmt.format(new Date(next))} ET` : undefined;
  // Feed Stock Token 24/5: hanya "closed" (akhir pekan) yang menahan aksi berbasis harga live.
  const marketOpen = state !== "closed";
  const ok = data.kind === "ok";

  return (
    <>
      <Header overlay />
      <main>
        <PageHead
          crumb={<><Link href="/cordons">Cordons</Link><span>/</span><span aria-current="page">{symbol}</span></>}
          label={ok ? `Cordon · Stock basket · ${data.cordon.name}` : "Cordon · Stock basket"}
          title={symbol}
          lead={ok ? `${data.cordon.name}. One token holds the whole basket, and its value follows the stocks inside.` : undefined}
          meta={ok ? (
            <>
              <HeadNav cordon={data.cordon} nav={data.nav} />
              <SessionMeta state={state} next={nextLabel && `until ${nextLabel}`} demo={data.cordon.isDemo} />
              <LiveUpdates topics={cordonTopics(data.cordon.id)} announcement={data.cordon.navPerShare === null ? "" : `${symbol} NAV per share is now ${usd(data.cordon.navPerShare)}`} />
            </>
          ) : undefined}
        />

        {data.kind === "unconfigured" && (
          <div className="wrap"><div className="sec">
            <Empty title="Data is not connected yet" text="This preview could not reach its data source, so this Cordon cannot be shown.">
              {process.env.NODE_ENV !== "production" && (
                <p className="mono dim" style={{ marginTop: 14, fontSize: 12 }}>Dev: fill NEXT_PUBLIC_SUPABASE_URL and a publishable key in .env.local, then apply the migrations.</p>
              )}
            </Empty>
          </div></div>
        )}
        {data.kind === "error" && (
          <div className="wrap"><div className="sec"><Empty title="The garden is out of reach" text="We could not load this Cordon just now. Try again in a moment." /></div></div>
        )}

        {ok && <Body symbol={symbol} data={data} rangeKey={range.key} rangeLabel={range.label} marketOpen={marketOpen} nextLabel={nextLabel} />}
      </main>
      <Footer />
    </>
  );
}

type Okay = Extract<Loaded, { kind: "ok" }>;

// NAV besar di kepala halaman (.big-num). Perubahan = titik terakhir vs pertama dalam rentang.
function HeadNav({ cordon, nav }: { cordon: Okay["cordon"]; nav: Okay["nav"] }) {
  const first = nav.points[0], last = nav.points[nav.points.length - 1];
  const change = first && last && nav.points.length > 1 ? changePct(last.nav, first.nav) : null;
  return (
    <>
      <span className="big-num">{cordon.navPerShare === null ? <>—<span className="sr-only"> no NAV yet</span></> : usd(cordon.navPerShare)}</span>
      <span className="note">
        {change !== null && first && <><span className="num"><Delta value={change} /></span> since {sinceFmt.format(first.ts)}. </>}
        NAV per share{cordon.navPerShare !== null && last && <> · as of <time dateTime={new Date(last.ts).toISOString()}>{asOfFmt.format(last.ts)} ET</time></>}
      </span>
    </>
  );
}

function Body({ symbol, data, rangeKey, rangeLabel, marketOpen, nextLabel }: {
  symbol: string; data: Okay; rangeKey: string; rangeLabel: string; marketOpen: boolean; nextLabel?: string;
}) {
  const { cordon, nav, prunings } = data;
  const composition = cordon.assets.map((a) => ({ label: a.ticker, weightBps: a.weightBps }));
  const rangeItems = RANGES.map((r) => ({ key: r.key, label: r.key.toUpperCase(), full: r.label, href: `?range=${r.key}` }));

  return (
    <div className="wrap">
      <div className="split" style={{ paddingTop: 60 }}>
        <div>
          <section className="sec" style={{ paddingTop: 20 }} aria-labelledby="nav-title">
            <div className="sec-h">
              <SplitTitle id="nav-title">NAV</SplitTitle>
              <LinkTabs label="NAV range" active={rangeKey} items={rangeItems} />
            </div>
            <Appear>
              {nav.points.length >= 2
                ? <div className="chartbox"><NavChart points={nav.points} label={`${symbol} NAV per share, ${rangeLabel}`} /></div>
                : <ChartEmpty tall label="Not enough NAV history in this range to draw a chart" />}
            </Appear>
            {cordon.tvlUsd !== null && <div className="row"><span className="k">TVL</span><span className="num">{usd(cordon.tvlUsd)}</span></div>}
            <p className="note">{rangeLabel}. NAV is the total value of the basket divided by shares outstanding.{cordon.isDemo && " Demo values in this preview."}</p>
          </section>

          <section className="sec" aria-labelledby="comp-title">
            <div className="sec-h">
              <SplitTitle id="comp-title">Composition</SplitTitle>
              <Appear as="p">Target weights. The basket is pruned on schedule to stay close to them, so live weights drift between prunings.</Appear>
            </div>
            {composition.length > 0
              ? <CompositionRows items={composition} label={`Target weight of each component of ${symbol}`} />
              : <Empty title="No components yet" text="No components have been set for this Cordon yet." />}
          </section>

          <section className="sec" aria-labelledby="prune-title">
            <div className="sec-h">
              <SplitTitle id="prune-title">Pruning history</SplitTitle>
              <Appear as="p">Rebalancing back to target weights, with every trade checked against the oracle price.</Appear>
            </div>
            {prunings === null ? <Empty title="History unavailable" text="Pruning history is not available right now." />
              : prunings.length === 0 ? <Empty title="No prunings yet" text="The first one will show up here." />
              : (
                <Appear className="dtable-wrap">
                  <table className="dtable">
                    <caption className="sr-only">Pruning history of {symbol}</caption>
                    <thead><tr>{["Date", "Largest drift before", "After", "Trades"].map((h, i) => <th key={h} scope="col" className={i ? "r" : undefined}>{h}</th>)}</tr></thead>
                    <tbody>
                      {prunings.map((r) => (
                        <tr key={r.ts}>
                          <th scope="row"><time dateTime={r.ts}>{dayFmt.format(new Date(r.ts))}</time></th>
                          <td className="num r">{r.driftBeforePct.toFixed(1)}%</td>
                          <td className="num r">{r.driftAfterPct.toFixed(1)}%</td>
                          <td className="num r">{r.trades}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Appear>
              )}
          </section>

          <section className="sec" aria-labelledby="params-title">
            <div className="sec-h">
              <SplitTitle id="params-title">Parameters</SplitTitle>
              <Appear as="p">Hard limits written into the contract. An admin role sets the actual fees, and they can never go above these.</Appear>
            </div>
            <Appear className="params">
              <div><div className="k">Management fee ceiling</div><div className="v">2.00%<small className="note"> /yr</small></div></div>
              <div><div className="k">Mint fee ceiling</div><div className="v">1.00%</div></div>
              <div><div className="k">Redeem fee ceiling</div><div className="v">1.00%</div></div>
              <div><div className="k">Shares outstanding</div><div className="v">{cordon.totalSupply === null ? <>—<span className="sr-only"> no NAV point yet</span></> : shareFmt.format(cordon.totalSupply)}</div></div>
            </Appear>
          </section>
        </div>

        <aside aria-label="Mint, redeem, and risk" className="stick-col" style={{ paddingTop: 20 }}>
          <MintRedeemPanel symbol={symbol} marketOpen={marketOpen} nextOpen={nextLabel} />
          <p className="hint">{tradeLive(symbol) ? `Transactions are sent from your wallet and settle on-chain. ${web3Env.mode === "testnet" ? "This is a test deployment: use test assets only. " : ""}` : "Simulation only. No transaction is sent in this preview. "}Redeeming in-kind (a share of every component) stays available whenever markets are closed.</p>
        </aside>
      </div>
      <section className="sec" aria-label="Risks"><CordonRisk /></section>
    </div>
  );
}
