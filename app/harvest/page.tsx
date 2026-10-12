import type { Metadata } from "next";
import { SessionMeta } from "@/components/cordon-parts";
import { DemoCountdown } from "@/components/demo-countdown";
import { HarvestPlanCard, HarvestRecords, HarvestRoundCard, HarvestRoundsTable, type HarvestRow } from "@/components/harvest-parts";
import { Footer, Header } from "@/components/layout-parts";
import { LiveUpdates } from "@/components/live-updates";
import { Appear, Countdown, Empty, Label, PageHead, SplitTitle } from "@/components/primitives";
import { ROUND_STATUS } from "@/components/product";
import { Timeline, type TimelineStep } from "@/components/timeline";
import { ConfigError } from "@/lib/api/http";
import { marketState, nextChange } from "@/lib/api/market";
import { getVault, listVaults } from "@/lib/api/queries";
import { usd } from "@/lib/format";
import { vaultTopics } from "@/lib/realtime/live";
import { graftLive, spurLive, web3Env } from "@/lib/web3/env";

// Round berubah tiap minggu: jangan dibekukan saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Harvest — Annona",
  description: "The weekly round: when it opens, when it expires, and how it settles.",
};

type Vault = NonNullable<Awaited<ReturnType<typeof getVault>>>;
type Loaded = { kind: "ok"; spur: Vault | null; graft: Vault | null } | { kind: "unconfigured" } | { kind: "error" };

// Halaman ini membaca satu Spur dan satu Graft Vault: yang punya round aktif, kalau tidak ada maka yang pertama.
async function load(): Promise<Loaded> {
  try {
    const all = await listVaults();
    const pick = (kind: "spur" | "graft") => { const vs = all.filter((v) => v.kind === kind); return vs.find((v) => v.currentRound) ?? vs[0]; };
    const [s, g] = [pick("spur"), pick("graft")];
    const [spur, graft] = await Promise.all([s ? getVault(s.symbol) : null, g ? getVault(g.symbol) : null]);
    return { kind: "ok", spur, graft };
  } catch (e) {
    if (e instanceof ConfigError) return { kind: "unconfigured" };
    console.error(e);
    return { kind: "error" };
  }
}

// Vault yang dikonfigurasi live (env + wallet aktif) tetapi belum ada di Supabase (indexer belum jalan): tetap tampil sebagai
// vault tanpa round, sama seperti halaman /vaults, jadi tidak jatuh ke placeholder "after MVP".
const configuredSymbol = (kind: "spur" | "graft") => {
  const t = kind === "spur" ? web3Env.spur : web3Env.graft;
  return t && (kind === "spur" ? spurLive(t.symbol) : graftLive(t.symbol)) ? t.symbol : null;
};

// Kata-kata sengaja netral soal hari dan jam: aturan settlement belum final. Padanan "weekly ritual" di annona.html (istilah K5: Picker, Harvest Card).
const ritual: TimelineStep[] = [
  { when: "Start of round", title: "Round opens", text: "Queued deposits join and the strike is set." },
  { when: "Same round", title: "A Picker pays", text: "The premium arrives up front, in USDG." },
  { when: "At expiry", title: "Expiry", text: "The bell rings. The round stops growing." },
  { when: "After the close", title: "Settlement", text: "The round settles at the first oracle price after expiry. Settlement rules are not final yet." },
  { when: "Next morning in Asia", title: "Harvest Card", text: "A card with your realized result, ready to share." },
];

const sessionFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" });
const expiryFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const whenFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const HISTORY_MAX = 20;

// Judul "Friday, 16:00 ET." dari waktu expiry nyata (ET). Tanpa round: jadwal ilustratif Jumat 16:00 ET.
function whenParts(iso: string | null): { day: string; time: string } {
  if (!iso) return { day: "Friday", time: "16:00" };
  const p = Object.fromEntries(whenFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: p.weekday, time: `${p.hour}:${p.minute}` };
}

// Kalimat untuk pembaca layar saat data round berubah (hanya diumumkan bila isinya berubah setelah refresh).
function announcement(vs: Vault[]) {
  return vs.map((v) => {
    const r = v.currentRound ?? v.rounds[0];
    if (!r) return `${v.symbol}: no rounds yet`;
    return `${v.symbol} round ${r.no} is ${ROUND_STATUS[r.status] ?? r.status}${r.premiumUsdg === null ? "" : `, premium ${usd(r.premiumUsdg)}`}${v.currentRound ? "" : ". No round is open"}`;
  }).join(". ");
}

export default async function HarvestPage() {
  const data = await load();
  const spur = data.kind === "ok" ? data.spur : null;
  const graft = data.kind === "ok" ? data.graft : null;
  const spurFallback = data.kind === "ok" ? configuredSymbol("spur") : null;
  const graftFallback = data.kind === "ok" ? configuredSymbol("graft") : null;
  const present = [spur, graft].filter((v): v is Vault => v !== null);
  const anyDemo = present.some((v) => v.isDemo);

  const now = new Date(), next = nextChange(now);
  const nextLabel = next ? `until ${sessionFmt.format(new Date(next))} ET` : undefined;
  const topics = present.flatMap((v) => (v.id !== "" ? vaultTopics(v.id) : []));

  // Round terdekat yang belum berakhir (sama dengan aturan "nextRound" di Home): dipakai hitung mundur dan judul "Friday, 16:00 ET."
  const upcoming = present
    .flatMap((v) => (v.currentRound && new Date(v.currentRound.expiry).getTime() > now.getTime() ? [{ symbol: v.symbol, no: v.currentRound.no, expiry: v.currentRound.expiry }] : []))
    .sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
  const soonest = upcoming[0] ?? null;
  const when = whenParts(soonest?.expiry ?? null);

  // Riwayat gabungan: HISTORY_MAX terbaru per vault, lalu diurutkan dari yang terbaru.
  const shownRows: HarvestRow[] = present
    .flatMap((v) => v.rounds.slice(0, HISTORY_MAX).map((r) => ({ symbol: v.symbol, no: r.no, strike: r.strike, expiry: r.expiry, premiumUsdg: r.premiumUsdg, settlementPrice: r.settlementPrice, status: r.status })))
    .sort((a, b) => new Date(b.expiry).getTime() - new Date(a.expiry).getTime());
  const totalRounds = present.reduce((n, v) => n + v.rounds.length, 0);

  return (
    <>
      <Header overlay />
      <main>
        <PageHead
          label="Harvest · Weekly payout"
          title={<>One round, <em>one week.</em></>}
          lead="The garden harvests one round per week: one expiry, one settlement price, one Harvest Card."
          meta={(
            <>
              <SessionMeta state={marketState(now)} next={nextLabel} demo={anyDemo} />
              {topics.length > 0 && <LiveUpdates topics={topics} announcement={announcement(present)} />}
            </>
          )}
        />

        <div className="wrap">
          {data.kind === "unconfigured" && (
            <section className="sec" aria-label="Status">
              <Empty title="Data is not connected yet" text="This preview could not reach its data source, so no round is shown.">
                {process.env.NODE_ENV !== "production" && (
                  <p className="mono dim" style={{ marginTop: 14, fontSize: 12 }}>Dev: fill NEXT_PUBLIC_SUPABASE_URL and a publishable key in .env.local, then apply the migrations.</p>
                )}
              </Empty>
            </section>
          )}
          {data.kind === "error" && (
            <section className="sec" aria-label="Status"><Empty title="The garden is out of reach" text="We could not load the round just now. Try again in a moment." /></section>
          )}

          {data.kind === "ok" && (
            <>
              <section className="sec" aria-labelledby="next-title">
                <div className="grid2 hr-next">
                  <div>
                    <Label>Next Harvest</Label>
                    <SplitTitle id="next-title">{when.day}, <em>{when.time} ET.</em></SplitTitle>
                    <Appear as="p" className="lead">
                      {soonest
                        ? "The nearest open round expires then. Exchange holidays aren’t counted in the schedule yet."
                        : "The US market close, as a demo schedule. Exchange holidays aren’t counted in it yet."}
                    </Appear>
                  </div>
                  <Appear variant="scale">
                    {soonest ? (
                      <>
                        <Countdown to={soonest.expiry} big />
                        <p className="note" style={{ marginTop: 12, textAlign: "center" }}>
                          to {soonest.symbol} round #{soonest.no}, which expires <time dateTime={soonest.expiry}>{expiryFmt.format(new Date(soonest.expiry))} ET</time>.
                        </p>
                      </>
                    ) : <DemoCountdown big />}
                  </Appear>
                </div>
              </section>

              <section className="sec" aria-labelledby="rounds-title">
                <h2 id="rounds-title" className="sr-only">Current rounds</h2>
                <div className="grid2">
                  {spur
                    ? <HarvestRoundCard symbol={spur.symbol} kind="spur" underlying={spur.underlying} round={spur.currentRound} index={0} />
                    : spurFallback
                      ? <HarvestRoundCard symbol={spurFallback} kind="spur" underlying={spurFallback.slice(1)} round={null} index={0} />
                      : <HarvestPlanCard kind="spur" index={0} />}
                  {graft
                    ? <HarvestRoundCard symbol={graft.symbol} kind="graft" underlying={graft.underlying} round={graft.currentRound} index={1} />
                    : graftFallback
                      ? <HarvestRoundCard symbol={graftFallback} kind="graft" underlying={graftFallback.slice(1)} round={null} index={1} />
                      : <HarvestPlanCard kind="graft" index={1} />}
                </div>
              </section>

              <section className="sec" aria-labelledby="ritual-title">
                <div className="split">
                  <div>
                    <div className="sec-h">
                      <div>
                        <Label>The weekly ritual</Label>
                        <SplitTitle id="ritual-title">Five beats, <em>every week.</em></SplitTitle>
                      </div>
                    </div>
                    <Timeline steps={ritual} />
                    <Appear as="p" className="note" style={{ marginTop: 24 }}>The schedule follows the US market clock. It is illustrative until finalised.</Appear>
                  </div>
                  <aside aria-label="What a round records" className="stick-col">
                    <HarvestRecords />
                  </aside>
                </div>
              </section>

              <section className="sec" aria-labelledby="past-title">
                <div className="sec-h">
                  <SplitTitle id="past-title">Past <em>rounds</em></SplitTitle>
                  <Appear as="p">Premium is the total the Picker pays the vault.</Appear>
                </div>
                <HarvestRoundsTable rows={shownRows} />
                {totalRounds > shownRows.length && <p className="note" style={{ marginTop: 12 }}>Showing the latest {HISTORY_MAX} rounds of each vault ({shownRows.length} of {totalRounds}).</p>}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
