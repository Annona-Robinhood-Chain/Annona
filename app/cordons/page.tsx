import type { Metadata } from "next";
import { SessionMeta, CordonRisk } from "@/components/cordon-parts";
import { Footer, Header } from "@/components/layout-parts";
import { CordonCard } from "@/components/product";
import { Appear, Empty, PageHead, SplitTitle, Tag } from "@/components/primitives";
import { ButtonLink } from "@/components/ui";
import { ConfigError } from "@/lib/api/http";
import { marketState, nextChange } from "@/lib/api/market";
import { getNav, listCordons } from "@/lib/api/queries";

// Data berubah (NAV, sesi pasar): jangan dibekukan saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cordons — Annona",
  description: "One token, one basket. See the NAV and composition of each Cordon. Demo preview.",
};

const sessionFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" });

// Basket pasca-MVP. Komposisi = mainnet (cCHIP: NVDA AMD TSM MU; cVOLT: TSLA PLTR RKLB IONQ, bobot 25% x 4 = asumsi). Bukan produk live: tanpa link, tanpa angka.
const planned = [
  { symbol: "cCHIP", name: "Semiconductors", chips: ["NVDA", "AMD", "TSM", "MU"], weighting: "Equal" },
  { symbol: "cVOLT", name: "Volt", chips: ["TSLA", "PLTR", "RKLB", "IONQ"], weighting: "Equal" },
];

type Loaded = { kind: "ok"; cordons: Awaited<ReturnType<typeof listCordons>>; trends: Record<string, number[]> } | { kind: "unconfigured" } | { kind: "error" };

async function load(): Promise<Loaded> {
  try {
    const cordons = await listCordons();
    // Tren 3 bulan untuk grafik kartu. Kegagalan satu Cordon hanya menghilangkan garisnya, bukan halaman.
    const navs = await Promise.allSettled(cordons.map((c) => getNav(c.symbol, 90)));
    const trends: Record<string, number[]> = {};
    navs.forEach((r, i) => { if (r.status === "fulfilled" && r.value) trends[cordons[i].symbol] = r.value.points.map((p) => p.nav); });
    return { kind: "ok", cordons, trends };
  }
  catch (e) {
    if (e instanceof ConfigError) return { kind: "unconfigured" };
    console.error(e);
    return { kind: "error" };
  }
}

export default async function CordonsPage() {
  const data = await load();
  const now = new Date(), next = nextChange(now);
  const nextLabel = next ? `until ${sessionFmt.format(new Date(next))} ET` : undefined;
  const anyDemo = data.kind === "ok" && data.cordons.some((c) => c.isDemo);
  // Basket yang sudah ada di database (mis. cCHIP setelah indexer menulisnya) pindah ke "In the garden", bukan lagi "Not yet planted".
  const live = new Set(data.kind === "ok" ? data.cordons.map((c) => c.symbol) : []);
  const stillPlanned = planned.filter((p) => !live.has(p.symbol));

  return (
    <>
      <Header overlay />
      <main>
        <PageHead
          label="Cordons"
          title={<>One token, <em>one basket.</em></>}
          lead="Cordons are disciplined stock baskets. One token holds the whole basket, its value follows the stocks inside, and it is pruned on a schedule, so you do not have to."
          meta={<SessionMeta state={marketState(now)} next={nextLabel} demo={anyDemo} />}
        />

        <div className="wrap">
          <section className="sec" aria-labelledby="live-title">
            <div className="sec-h">
              <SplitTitle id="live-title">In the <em>garden</em></SplitTitle>
              <Appear as="p">Values below are read from the live data source.</Appear>
            </div>
            {data.kind === "ok" && data.cordons.length > 0 && (
              <ul className="grid3" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {data.cordons.map((c, i) => (
                  <li key={c.symbol} className="grid">
                    <CordonCard symbol={c.symbol} name={c.name} nav={c.navPerShare} change={c.change} assets={c.assets} tvlUsd={c.tvlUsd} index={i}
                      composition={c.composition.map((x) => ({ label: x.ticker, weightBps: x.weightBps }))} trend={data.trends[c.symbol]} isDemo={c.isDemo} />
                  </li>
                ))}
              </ul>
            )}
            {data.kind === "ok" && data.cordons.length === 0 && (
              <Empty title="No Cordons planted yet" text="The first basket has not been set. Check back soon.">
                <ButtonLink href="/docs" variant="ghost" size="sm" arrow className="mt-5">Read how Cordons work</ButtonLink>
              </Empty>
            )}
            {data.kind === "unconfigured" && (
              <Empty title="Data is not connected yet" text="This preview could not reach its data source, so no baskets are shown.">
                {process.env.NODE_ENV !== "production" && (
                  <p className="mono dim" style={{ marginTop: 14, fontSize: 12 }}>Dev: fill NEXT_PUBLIC_SUPABASE_URL and a publishable key in .env.local, then apply the migrations.</p>
                )}
              </Empty>
            )}
            {data.kind === "error" && <Empty title="The garden is out of reach" text="We could not load the baskets just now. Try again in a moment." />}
          </section>

          <section className="sec" aria-labelledby="planned-title">
            <div className="sec-h">
              <SplitTitle id="planned-title">Not yet <em>planted</em></SplitTitle>
              <Appear as="p">Planned baskets. Not live, and not available to mint.</Appear>
            </div>
            {stillPlanned.length > 0 ? (
              <ul className="grid3" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {stillPlanned.map((p, i) => (
                  <li key={p.symbol} className="grid">
                    <Appear className="pcard plan" delay={i * 0.1}>
                      <div className="top">
                        <div><div className="sym">{p.symbol}</div><div className="nm">{p.name}</div></div>
                        <Tag>After MVP</Tag>
                      </div>
                      <ul className="tickers" aria-label="Planned components">{p.chips.map((c) => <li key={c}>{c}</li>)}</ul>
                      <div className="row"><span className="k">Status</span><span>Not planted yet</span></div>
                      <div className="row"><span className="k">Weighting</span><span>{p.weighting}</span></div>
                    </Appear>
                  </li>
                ))}
              </ul>
            ) : <Empty title="Nothing planned right now" text="New Cordons appear here before they go live." />}
          </section>

          <section className="sec" aria-label="Risks"><CordonRisk /></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
