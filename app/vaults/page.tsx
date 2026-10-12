import type { Metadata } from "next";
import { SessionMeta } from "@/components/cordon-parts";
import { Footer, Header } from "@/components/layout-parts";
import { VaultCard } from "@/components/product";
import { Appear, Empty, Label, PageHead, SplitTitle, Tag } from "@/components/primitives";
import { Ill } from "@/components/sheaf-art";
import { LinkTabs } from "@/components/tabs";
import { ButtonLink } from "@/components/ui";
import { VaultListRisk } from "@/components/vault-parts";
import { ConfigError } from "@/lib/api/http";
import { tokenCopy } from "@/lib/token-copy";
import { marketState, nextChange } from "@/lib/api/market";
import { listVaults } from "@/lib/api/queries";
import { graftLive, spurLive, web3Env } from "@/lib/web3/env";

// Round dan APY berubah tiap minggu: jangan dibekukan saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spurs & Grafts — Annona",
  description: "Weekly vaults. See each vault's realized APY and this week's strike. Demo preview.",
};

type Props = { searchParams: Promise<{ kind?: string | string[] }> };
const FILTERS = [
  { key: "all", label: "All" },
  { key: "spur", label: "Spurs" },
  { key: "graft", label: "Grafts" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];
// Nilai tak dikenal jatuh ke "all".
const parseFilter = (v: string | string[] | undefined): Filter => {
  const k = Array.isArray(v) ? v[0] : v;
  return k === "spur" || k === "graft" ? k : "all";
};

const sessionFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" });

type Vaults = Awaited<ReturnType<typeof listVaults>>;
type Loaded =
  | { kind: "ok"; vaults: Vaults }
  | { kind: "unconfigured" }
  | { kind: "error" };

async function load(): Promise<Loaded> {
  try {
    return { kind: "ok", vaults: await listVaults() };
  } catch (e) {
    if (e instanceof ConfigError) return { kind: "unconfigured" };
    console.error(e);
    return { kind: "error" };
  }
}

// Graft Vault yang belum ada di data dan belum dikonfigurasi tampil sebagai "belum terhubung": tanpa link, tanpa angka.
const plannedGraft = {
  symbol: "gNVDA",
  text: "Graft · Cash-secured put on NVDA",
};

// Vault yang dikonfigurasi live (env + wallet aktif) tetapi belum ada di Supabase (indexer belum jalan): tetap ditampilkan dan
// bisa dibuka (halaman detail punya jalur yang sama), supaya deposit pertama tidak menunggu indexer.
function configuredMissing(kind: "spur" | "graft", vaults: Vaults) {
  const t = kind === "spur" ? web3Env.spur : web3Env.graft;
  if (!t || !(kind === "spur" ? spurLive(t.symbol) : graftLive(t.symbol))) return null;
  return vaults.some((v) => v.symbol === t.symbol) ? null : t.symbol;
}

export default async function VaultsPage({ searchParams }: Props) {
  const filter = parseFilter((await searchParams).kind);
  const data = await load();
  const now = new Date(), next = nextChange(now);
  const nextLabel = next ? `until ${sessionFmt.format(new Date(next))} ET` : undefined;
  const spurs = data.kind === "ok" ? data.vaults.filter((v) => v.kind === "spur") : [];
  const grafts = data.kind === "ok" ? data.vaults.filter((v) => v.kind === "graft") : [];
  const anyDemo = data.kind === "ok" && data.vaults.some((v) => v.isDemo);
  const loaded = data.kind === "ok" ? data.vaults : [];
  const pendingSpur = data.kind === "ok" ? configuredMissing("spur", loaded) : null;
  const pendingGraft = data.kind === "ok" ? configuredMissing("graft", loaded) : null;
  const showPlannedGraft = data.kind === "ok" && !pendingGraft && !grafts.some((g) => g.symbol === plannedGraft.symbol);
  const shownSpurs = filter === "graft" ? [] : spurs,
    shownGrafts = filter === "spur" ? [] : grafts;
  const showPlanned = showPlannedGraft && filter !== "spur";
  const showPendingSpur = pendingSpur !== null && filter !== "graft",
    showPendingGraft = pendingGraft !== null && filter !== "spur";
  const anyCard = shownSpurs.length > 0 || shownGrafts.length > 0 || showPlanned || showPendingSpur || showPendingGraft;
  const tabItems = FILTERS.map((f) => ({ key: f.key, label: f.label, href: f.key === "all" ? "/vaults" : `/vaults?kind=${f.key}` }));
  // Urutan kartu: Spur, Spur yang belum ada di data, Graft, Graft yang belum ada di data, Graft rencana. Offset dipakai untuk jeda animasi masuk.
  const offPendingSpur = shownSpurs.length;
  const offGrafts = offPendingSpur + (showPendingSpur ? 1 : 0);
  const offPendingGraft = offGrafts + shownGrafts.length;
  const offPlanned = offPendingGraft + (showPendingGraft ? 1 : 0);

  return (
    <>
      <Header overlay />
      <main>
        <PageHead
          label="Weekly option vaults"
          title={<>Spurs &amp; <em>Grafts.</em></>}
          lead="Each round, a Picker pays premium up front for a set strike, and you collect it in USDG. Every figure is realized, never projected. Spurs cap your upside."
          meta={<SessionMeta state={marketState(now)} next={nextLabel} demo={anyDemo} />}
        />

        <div className="wrap">
          <section className="sec" aria-label="Vaults">
            <div className="sec-h">
              <LinkTabs label="Filter vaults" active={filter} items={tabItems} />
              <Appear as="p">Rounds run weekly. Pick a kind to filter the list.</Appear>
            </div>

            {data.kind === "ok" && anyCard && (
              <ul className="grid2" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {shownSpurs.map((v, i) => (
                  <li key={v.symbol} className="grid">
                    <VaultCard symbol={v.symbol} kind={v.kind} underlying={v.underlying} apy={v.realizedApy} strike={v.currentRound?.strike ?? null} round={v.currentRound} isDemo={v.isDemo} index={i} />
                  </li>
                ))}
                {showPendingSpur && pendingSpur && (
                  <li className="grid">
                    <VaultCard symbol={pendingSpur} kind="spur" underlying={pendingSpur.slice(1)} apy={null} strike={null} round={null} index={offPendingSpur} />
                  </li>
                )}
                {shownGrafts.map((v, i) => (
                  <li key={v.symbol} className="grid">
                    <VaultCard symbol={v.symbol} kind={v.kind} underlying={v.underlying} apy={v.realizedApy} strike={v.currentRound?.strike ?? null} round={v.currentRound} isDemo={v.isDemo} index={offGrafts + i} />
                  </li>
                ))}
                {showPendingGraft && pendingGraft && (
                  <li className="grid">
                    <VaultCard symbol={pendingGraft} kind="graft" underlying={pendingGraft.slice(1)} apy={null} strike={null} round={null} index={offPendingGraft} />
                  </li>
                )}
                {showPlanned && (
                  <li className="grid">
                    <Appear className="pcard plan" delay={offPlanned * 0.1}>
                      <div className="top">
                        <div><div className="sym">{plannedGraft.symbol}</div><div className="nm">{plannedGraft.text}</div></div>
                        <Tag>Not live</Tag>
                      </div>
                      {tokenCopy(plannedGraft.symbol) && <p className="blurb">{tokenCopy(plannedGraft.symbol)}</p>}
                      <Ill kind="granary" className="vault-ill dimmed" />
                      <div className="row"><span className="k">Collateral</span><span>USDG</span></div>
                      <div className="row"><span className="k">Strike</span><span>Below today’s price</span></div>
                      <div className="row"><span className="k">Status</span><span>Not connected yet</span></div>
                    </Appear>
                  </li>
                )}
              </ul>
            )}
            {data.kind === "ok" && filter !== "graft" && spurs.length === 0 && !showPendingSpur && (
              <div style={shownGrafts.length > 0 || showPlanned || showPendingGraft ? { marginTop: 24 } : undefined}>
                <Empty title="No Spur Vaults planted yet" text="The first vault has not been set. Check back soon.">
                  <ButtonLink href="/docs" variant="ghost" size="sm" arrow className="mt-5">Read how Spurs work</ButtonLink>
                </Empty>
              </div>
            )}
            {data.kind === "ok" && filter === "graft" && shownGrafts.length === 0 && !showPlanned && !showPendingGraft && (
              <Empty title="No Graft Vaults yet" text="Grafts come after the first Spur Vault has run. Check back later." />
            )}
            {data.kind === "unconfigured" && (
              <Empty title="Data is not connected yet" text="This preview could not reach its data source, so no vaults are shown.">
                {process.env.NODE_ENV !== "production" && (
                  <p className="mono dim" style={{ marginTop: 14, fontSize: 12 }}>Dev: fill NEXT_PUBLIC_SUPABASE_URL and a publishable key in .env.local, then apply the migrations.</p>
                )}
              </Empty>
            )}
            {data.kind === "error" && <Empty title="The garden is out of reach" text="We could not load the vaults just now. Try again in a moment." />}
          </section>

          <section className="sec" aria-labelledby="apy-title">
            <div className="grid2">
              <div>
                <Label>Method</Label>
                <SplitTitle id="apy-title">How we read <em>the numbers</em></SplitTitle>
              </div>
              <Appear className="muted method">
                <p><strong style={{ color: "var(--fg)" }}>Realized APY</strong> is the average weekly premium of settled rounds, as a share of the notional at each round’s starting price, times 52. It is simple, not compounded, and looks backward only.</p>
                <p>It counts premium only. It does not subtract payouts from rounds that ended past the strike.</p>
                <p><strong style={{ color: "var(--fg)" }}>Strike this week</strong> is the price set for the round that is open now.</p>
              </Appear>
            </div>
          </section>

          <section className="sec" aria-label="Risks"><VaultListRisk /></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
