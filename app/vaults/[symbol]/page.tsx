import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionMeta } from "@/components/cordon-parts";
import { LiveUpdates } from "@/components/live-updates";
import { Footer, Header } from "@/components/layout-parts";
import { NavChart } from "@/components/nav-chart";
import { Appear, Empty, Label, PageHead, SplitTitle } from "@/components/primitives";
import { ROUND_STATUS, RoundHistoryTable } from "@/components/product";
import { RoundCountdown } from "@/components/round-countdown";
import { Timeline } from "@/components/timeline";
import { DepositWithdrawPanel } from "@/components/trade-panels";
import { UpsideSimulator } from "@/components/upside-simulator";
import { VaultRisk } from "@/components/vault-parts";
import { ConfigError, SYMBOL } from "@/lib/api/http";
import { marketState, nextChange } from "@/lib/api/market";
import { getVault } from "@/lib/api/queries";
import { graftLive, spurLive } from "@/lib/web3/env";
import { vaultTopics } from "@/lib/realtime/live";
import { pct, usd } from "@/lib/format";

// Round, strike, dan APY berubah tiap minggu: jangan dibekukan saat build.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ symbol: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const safe = SYMBOL.test(symbol) ? symbol : "Vault";
  return {
    title: `${safe} — Annona`,
    description: `Harvest history, deposit, and withdraw for ${safe}. Demo preview.`,
  };
}

const sessionFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" });
const expiryFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const qtyFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
const HISTORY_MAX = 20;

type Vault = NonNullable<Awaited<ReturnType<typeof getVault>>>;
type Loaded =
  | { kind: "ok"; vault: Vault }
  | { kind: "missing" }
  | { kind: "unconfigured" }
  | { kind: "error" };

// Kalimat untuk pembaca layar saat data round berubah: round aktif (status, premium) atau round terakhir.
function roundAnnouncement(v: Vault) {
  const r = v.currentRound ?? v.rounds[0];
  if (!r) return "No rounds yet";
  const status = ROUND_STATUS[r.status] ?? r.status;
  return `${v.symbol} round ${r.no} is ${status}${r.premiumUsdg === null ? "" : `, premium ${usd(r.premiumUsdg)}`}${v.currentRound ? "" : ". No round is open"}`;
}

async function load(symbol: string): Promise<Loaded> {
  try {
    const vault = await getVault(symbol);
    return vault ? { kind: "ok", vault } : { kind: "missing" };
  } catch (e) {
    if (e instanceof ConfigError) return { kind: "unconfigured" };
    console.error(e);
    return { kind: "error" };
  }
}

// Vault yang dikonfigurasi live (env + wallet aktif) tetapi belum punya baris di Supabase, karena indexer belum jalan atau belum
// melihat event pertama. Halaman tetap dibuka (tanpa round/riwayat) supaya deposit pertama, yang memulai round pertama, bisa dilakukan.
// Underlying diturunkan dari simbol (s/g + ticker, aturan simbol bawaan indexer). id kosong = tanpa Realtime.
function configuredVault(symbol: string): Vault | null {
  const kind = spurLive(symbol) ? "spur" : graftLive(symbol) ? "graft" : null;
  if (!kind) return null;
  return {
    id: "",
    symbol,
    kind,
    underlying: symbol.slice(1),
    address: "",
    isDemo: false,
    realizedApy: null,
    settledRounds: 0,
    currentRound: null,
    premiumHint: null,
    rounds: [],
  };
}

export default async function VaultDetailPage({ params }: Props) {
  const { symbol } = await params;
  if (!SYMBOL.test(symbol)) notFound();
  const data = await load(symbol);
  const fallback = data.kind === "missing" ? configuredVault(symbol) : null;
  if (data.kind === "missing" && !fallback) notFound();
  const vault = data.kind === "ok" ? data.vault : fallback;
  const now = new Date(), next = nextChange(now);
  const nextLabel = next ? `until ${sessionFmt.format(new Date(next))} ET` : undefined;
  const spur = vault?.kind === "spur";

  return (
    <>
      <Header overlay />
      <main>
        <PageHead
          crumb={<><Link href="/vaults">Spurs &amp; Grafts</Link><span>/</span><span aria-current="page">{symbol}</span></>}
          label={vault ? (spur ? "Spur · Covered call" : "Graft · Cash-secured put") : "Vault"}
          title={symbol}
          lead={vault ? `${spur ? "Spur Vault. Covered call" : "Graft Vault. Cash-secured put"} on ${vault.underlying}. A Picker pays premium up front each round.` : undefined}
          meta={vault ? (
            <>
              <span className="big-num">
                {vault.realizedApy === null ? <>—<span className="sr-only"> no settled rounds yet</span></> : pct(vault.realizedApy, 1)}
              </span>
              <span className="note">
                Realized APY ·{" "}
                {vault.settledRounds > 0
                  ? `average of ${vault.settledRounds} settled ${vault.settledRounds === 1 ? "round" : "rounds"}. Not a forecast.`
                  : "no settled rounds yet."}{" "}
                Premium only: payouts from rounds that end past the strike are not deducted.
              </span>
              <SessionMeta state={marketState(now)} next={nextLabel} demo={vault.isDemo} />
              {vault.id !== "" && <LiveUpdates topics={vaultTopics(vault.id)} announcement={roundAnnouncement(vault)} />}
            </>
          ) : undefined}
        />

        {data.kind === "unconfigured" && (
          <div className="wrap"><div className="sec">
            <Empty title="Data is not connected yet" text="This preview could not reach its data source, so this vault cannot be shown.">
              {process.env.NODE_ENV !== "production" && (
                <p className="mono dim" style={{ marginTop: 14, fontSize: 12 }}>Dev: fill NEXT_PUBLIC_SUPABASE_URL and a publishable key in .env.local, then apply the migrations.</p>
              )}
            </Empty>
          </div></div>
        )}
        {data.kind === "error" && (
          <div className="wrap"><div className="sec"><Empty title="The garden is out of reach" text="We could not load this vault just now. Try again in a moment." /></div></div>
        )}

        {vault && <Body vault={vault} />}
      </main>
      <Footer />
    </>
  );
}

// Langkah "How a round works" (annona.html: Roll / Sell / Settle / Measure, istilah produk K5: Picker, Harvest).
const roundSteps = [
  { when: "Roll", title: "Round opens", text: "Queued deposits join and the strike is set." },
  { when: "Sell", title: "A Picker pays", text: "A Picker fills a signed quote and pays premium up front." },
  { when: "Settle", title: "Round ends", text: "The round ends at its expiry. Settlement rules are not final yet." },
  { when: "Harvest", title: "You claim", text: "Claim your premium in USDG." },
];

function Body({ vault }: { vault: Vault }) {
  const { kind, underlying, symbol, currentRound: cur, rounds, premiumHint } = vault;
  const isSpur = kind === "spur";
  // Simulator wajib sebelum deposit ke Spur (brief §4), dan sama pentingnya untuk Graft karena risiko turunnya lebih besar.
  // Butuh strike dan harga awal round aktif.
  const sim = cur && cur.spotStart ? { spot: cur.spotStart, strike: cur.strike, premiumPct: premiumHint?.pct ?? 0 } : null;
  // Panel live: deposit hanya mengantre untuk roll berikutnya, dan vault yang baru di-deploy (atau yang sedang di antara dua
  // round) tidak punya round aktif. Tanpa pengecualian ini round pertama tidak pernah bisa dimulai lewat UI (roll tanpa share
  // dilewati). Simulator tetap tampil bila ada round aktif; bila tidak ada, panel menjelaskan bahwa strike ditetapkan saat roll.
  const live = isSpur ? spurLive(symbol) : graftLive(symbol);
  const canDeposit = !isSpur || sim !== null || live;
  const shown = rounds.slice(0, HISTORY_MAX);
  // Premium kumulatif dari round settled (lama ke baru). Garis hanya digambar bila ada minimal dua titik.
  const settledAsc = [...rounds]
    .filter((r) => r.status === "settled" && r.premiumUsdg !== null)
    .sort((x, y) => new Date(x.expiry).getTime() - new Date(y.expiry).getTime());
  const cumulative = settledAsc.map((r, i) => ({
    ts: new Date(r.expiry).getTime(),
    nav: settledAsc.slice(0, i + 1).reduce((acc, x) => acc + (x.premiumUsdg ?? 0), 0),
  }));
  const payoutRule = isSpur
    ? "If the price at settlement ends above the strike, the vault pays the Picker the difference in tokens. At or below the strike, nothing is paid and you keep your tokens and the premium."
    : "If the price at settlement ends below the strike, the vault pays the Picker the shortfall in USDG. At or above the strike, nothing is paid and you keep your USDG and the premium.";

  return (
    <div className="wrap">
      <div className="split" style={{ paddingTop: 60 }}>
        <div>
          <section className="sec" style={{ paddingTop: 20 }} aria-labelledby="round-title">
            <div className="sec-h">
              <SplitTitle id="round-title">Current <em>round</em></SplitTitle>
              {cur && <Appear as="p">Round #{cur.no} · {ROUND_STATUS[cur.status] ?? cur.status}</Appear>}
            </div>
            {cur ? (
              <>
                <Appear className="params two">
                  <div><div className="k">Strike</div><div className="v">{usd(cur.strike)}</div></div>
                  <div><div className="k">Expires</div><div className="v vsm"><time dateTime={cur.expiry}>{expiryFmt.format(new Date(cur.expiry))} ET</time></div></div>
                  <div><div className="k">Notional</div><div className="v">{qtyFmt.format(cur.notional)}<small className="note"> {underlying}</small></div></div>
                  <div><div className="k">Premium</div><div className="v">{cur.premiumUsdg === null ? <span className="vsm">Not auctioned yet</span> : usd(cur.premiumUsdg)}</div></div>
                </Appear>
                <RoundCountdown expiry={cur.expiry} label="Time to expiry" />
              </>
            ) : (
              <Empty title="No round is open" text="A deposit now joins the next round. Its strike and premium are fixed when that round starts." />
            )}
            <Appear className="risk" role="note" style={{ marginTop: 18 }}><b>Payout rule.</b> {payoutRule} Premium is paid in USDG. Settlement rules are not final yet.</Appear>
          </section>

          <section className="sec" aria-labelledby="history-title">
            <div className="sec-h">
              <SplitTitle id="history-title">Harvest history</SplitTitle>
              <Appear as="p">Realized results, round by round.</Appear>
            </div>
            {cumulative.length >= 2 && (
              <Appear style={{ marginBottom: 18 }}>
                <div className="chartbox"><NavChart points={cumulative} harvests={cumulative.map((c) => c.ts)} label="Cumulative premium harvested, USDG" /></div>
                <p className="note" style={{ marginTop: 8 }}>Cumulative premium from settled rounds. Dots mark each Harvest.</p>
              </Appear>
            )}
            <RoundHistoryTable rounds={shown} />
            {rounds.length > shown.length && <p className="note" style={{ marginTop: 12 }}>Showing the latest {shown.length} of {rounds.length} rounds.</p>}
          </section>

          <section className="sec" aria-labelledby="works-title">
            <div className="sec-h"><SplitTitle id="works-title">How a round <em>works</em></SplitTitle></div>
            <Timeline steps={roundSteps} />
          </section>
        </div>

        <aside aria-label="Deposit, withdraw, and risk" className="stick-col" style={{ paddingTop: 20 }}>
          {canDeposit ? (
            <DepositWithdrawPanel symbol={symbol} asset={isSpur ? "stock" : "USDG"} unit={isSpur ? underlying : undefined} />
          ) : (
            <Empty title="Deposits open soon" text="Deposits open once a round is set with a strike and a starting price. You will see the upside simulator first." />
          )}
          {kind === "graft" && !live && (
            <p className="hint"><b>Preview.</b> This Graft panel is a simulation until its vault is connected to a wallet network.</p>
          )}
          {live && sim === null && (
            <p className="hint">
              {isSpur
                ? "No round is open right now. A deposit made now joins the next round. Its strike (set above the price when that round starts) and premium are fixed at that moment, and any gain above the strike goes to the Picker."
                : "No round is open right now. A deposit made now joins the next round as collateral. Its strike (set below the price when that round starts) and premium are fixed at that moment, and any fall below the strike is paid to the Picker out of the collateral."}
            </p>
          )}
          <p className="hint">{live ? "Transactions are sent from your wallet and settle on-chain." : "Simulation only. No transaction is sent in this preview."}</p>
        </aside>
      </div>

      <section className="sec" aria-labelledby="sim-title">
        <div className="sim-grid">
          <div>
            <Label>Know the trade</Label>
            <SplitTitle id="sim-title">{isSpur ? <>See the Spur <em>before you pay it.</em></> : <>See the Graft <em>before you fill it.</em></>}</SplitTitle>
            <Appear as="p" className="lead">
              {isSpur
                ? "A Spur Vault earns premium and gives up the top of a big week. In a falling week, the premium softens the drop but does not stop it."
                : "A Graft Vault earns premium while it waits. If the price ends below the strike, the vault pays the shortfall from your USDG, and that can be more than the premium."}{" "}
              Slide to see how one week plays out.
            </Appear>
            <Appear as="p" className="note" style={{ marginTop: 14 }}>
              Illustrative only, not a forecast.{" "}
              {sim === null && "It uses the strike and premium of an open round, and none is open right now."}
              {sim && premiumHint?.source === "round" && "Uses this round’s premium."}
              {sim && premiumHint?.source === "last" && "This round has no premium yet, so this uses the last settled round’s premium."}
              {sim && !premiumHint && "No premium is set for this round yet, so this shows the payoff without premium."}
            </Appear>
          </div>
          {sim ? (
            <UpsideSimulator symbol={underlying} spot={sim.spot} strike={sim.strike} weeklyPremiumPct={sim.premiumPct} spotLabel="the round’s starting price" kind={isSpur ? "spur" : "graft"} />
          ) : (
            <Empty title="No round is open." text="The simulator needs the strike and starting price of an open round. It shows up here as soon as one opens." />
          )}
        </div>
      </section>

      <section className="sec" aria-label="Risks"><VaultRisk kind={kind} /></section>
    </div>
  );
}
