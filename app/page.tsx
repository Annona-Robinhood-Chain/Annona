import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { BRAND } from '@/components/brand';
import { HeroParticles } from '@/components/hero-particles';
import { HeroArt, NyTime, StatsGrid } from '@/components/home-hero';
import { Pinned, type PinnedLive } from '@/components/home-pinned';
import { HomeSim } from '@/components/home-sim';
import { Footer, Header } from '@/components/layout-parts';
import {
  Accordion,
  Appear,
  Chip,
  Countdown,
  Eyebrow,
  FillList,
  GridBg,
  Label,
  RiskBox,
  SplitTitle,
  TiltCard,
  WordFill,
} from '@/components/primitives';
import { Ill, type IllKind } from '@/components/sheaf-art';
import { ButtonLink } from '@/components/ui';
import { ConfigError } from '@/lib/api/http';
import type { HomeData } from '@/lib/api/home-derive';
import { getHomeData } from '@/lib/api/queries';
import { pct, usd } from '@/lib/format';
import { TOKEN_COPY } from '@/lib/token-copy';
import { web3Env } from '@/lib/web3/env';

// Angka di halaman ini dibaca dari data nyata dan berubah tiap round: jangan dibekukan saat build.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Annona | Weekly yield on Robinhood Chain',
  description:
    'Earn weekly yield on your tokenized stocks on Robinhood Chain. Stock baskets and weekly vaults, paid in USDG every Friday.',
  openGraph: { siteName: 'Annona', type: 'website', title: 'Annona | Weekly yield on Robinhood Chain', description: 'Earn weekly yield on your tokenized stocks on Robinhood Chain. Stock baskets and weekly vaults, paid in USDG every Friday.' },
  twitter: { title: 'Annona | Weekly yield on Robinhood Chain', description: 'Earn weekly yield on your tokenized stocks on Robinhood Chain. Stock baskets and weekly vaults, paid in USDG every Friday.' },
};

type Loaded =
  | { kind: 'ok'; home: HomeData }
  | { kind: 'unconfigured' }
  | { kind: 'error' };
async function load(): Promise<Loaded> {
  try {
    return { kind: 'ok', home: await getHomeData() };
  } catch (e) {
    if (e instanceof ConfigError) return { kind: 'unconfigured' };
    console.error(e);
    return { kind: 'error' };
  }
}

const products: {
  glyph: IllKind;
  name: string;
  sym: string;
  kind: string;
  href: string;
  cta: string;
  text: string;
  trade?: string;
}[] = [
  {
    glyph: 'sheaf',
    name: 'Cordon',
    sym: 'cMAG7',
    kind: 'Stock basket',
    href: '/cordons',
    cta: 'Explore Cordons',
    text: TOKEN_COPY.cMAG7,
  },
  {
    glyph: 'sickle',
    name: 'Spur',
    sym: 'sNVDA',
    kind: 'Covered call',
    href: '/vaults?kind=spur',
    cta: 'Explore Spurs',
    text: TOKEN_COPY.sNVDA,
    trade: 'Spurs cap your upside. That is the trade.',
  },
  {
    glyph: 'granary',
    name: 'Graft',
    sym: 'gNVDA',
    kind: 'Cash-secured put',
    href: '/vaults?kind=graft',
    cta: 'Explore Grafts',
    text: TOKEN_COPY.gNVDA,
  },
];

const paths = [
  {
    label: 'The Cordon path',
    sub: 'For holding a basket.',
    steps: [
      {
        when: 'Plant',
        title: 'Mint cMAG7',
        text: 'Pay USDG while the market is open. The vault holds the seven stocks for you.',
      },
      {
        when: 'Train',
        title: 'Hold one token',
        text: 'Its NAV follows the basket. Redeem in-kind any time.',
      },
      {
        when: 'Prune',
        title: 'Rebalanced on schedule',
        text: 'Weights drift. The keeper trims them back to equal.',
      },
    ],
  },
  {
    label: 'The vault path',
    sub: 'For a weekly harvest.',
    steps: [
      {
        when: 'Deposit',
        title: 'Join a round',
        text: 'NVDA into a Spur, or USDG into a Graft. Deposits are queued for the next round.',
      },
      {
        when: 'Sell',
        title: 'A Picker pays up front',
        text: 'The premium lands in the vault the moment the option is sold.',
      },
      {
        when: 'Harvest',
        title: 'The round settles',
        text: 'Your premium is ready to claim in USDG. Settlement rules are not final yet.',
      },
    ],
  },
];

const today: {
  kind: string;
  sym: string;
  href: string;
  cta: string;
  type: 'cordon' | 'spur' | 'graft';
  rows: [string, string][];
}[] = [
  {
    kind: 'Cordon',
    sym: 'cMAG7',
    href: '/cordons',
    cta: 'View Cordons',
    type: 'cordon',
    rows: [
      ['Holds', '7 stocks'],
      ['Weights', 'Equal'],
      ['Pays premium', 'No'],
    ],
  },
  {
    kind: 'Spur Vault',
    sym: 'sNVDA',
    href: '/vaults?kind=spur',
    cta: 'View Spurs',
    type: 'spur',
    rows: [
      ['Deposit', 'NVDA'],
      ['Sells', 'Upside above a strike'],
      ['Pays', 'Premium in USDG'],
    ],
  },
  {
    kind: 'Graft Vault',
    sym: 'gNVDA',
    href: '/vaults?kind=graft',
    cta: 'View Grafts',
    type: 'graft',
    rows: [
      ['Collateral', 'USDG'],
      ['Strike', 'Below today’s price'],
      ['Settlement', 'Cash'],
    ],
  },
];

// Baris angka hidup untuk satu kartu "at a glance". Produk yang belum ada di data tampil "Not live yet", bukan angka.
function liveRows(
  t: (typeof today)[number],
  home: HomeData | null,
): [string, string][] {
  if (!home) return [['Live figures', 'Unavailable']];
  if (t.type === 'cordon') {
    const c = home.cordons.find((x) => x.symbol === t.sym);
    return c
      ? [
          ['NAV per share', c.navPerShare === null ? '—' : usd(c.navPerShare)],
          ['Total value', c.tvlUsd === null ? '—' : usd(c.tvlUsd)],
        ]
      : [['Status', 'Not live yet']];
  }
  const v = home.vaults.find((x) => x.symbol === t.sym);
  return v
    ? [
        ['Realized APY', v.apy === null ? '—' : pct(v.apy, 1)],
        [
          'Strike this week',
          v.strike === null ? 'No round open' : usd(v.strike),
        ],
      ]
    : [['Status', 'Not live yet']];
}

const faq = [
  {
    q: 'Do I own the stocks inside a Cordon?',
    a: 'You own a token backed by the Stock Tokens the Cordon holds, onchain, not the shares themselves. You can redeem in-kind for your share of each stock at any time, even when prices aren’t live.',
  },
  {
    q: 'Where does the premium come from?',
    a: 'From Pickers, the market makers who buy the weekly options. They pay up front, in the same transaction that sells the option.',
  },
  {
    q: 'What do I give up in a Spur Vault?',
    a: 'The gain above the strike. If the stock ends above it, the vault pays the Picker the difference in stock. In a big week you earn less than holding the stock. That is the trade.',
  },
  {
    q: 'Can a Graft Vault lose money?',
    a: 'Yes. If the price ends below the strike, the vault pays the shortfall in USDG, and that can be more than the premium you collected.',
  },
  {
    q: 'What happens on weekends and holidays?',
    a: 'Anything that needs a live price, such as minting with USDG, redeeming to USDG, or pruning, waits for the market to open. In-kind redeem stays available. Exchange holidays aren’t counted in the schedule yet.',
  },
  {
    q: 'Is the APY a projection?',
    a: `Never. ${BRAND} only shows realized APY, built from premium already paid in settled rounds, and labels it as such.`,
  },
  {
    q: `Is ${BRAND} audited?`,
    a: 'Not yet. Contracts are capped by deposit limits. Read the full list of risks in Docs before you deposit anything.',
  },
];

const expiryFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const etLabel = (iso: string) => `${expiryFmt.format(new Date(iso))} ET`;

const MARQUEE: [string, boolean][] = [
  ['cMAG7', true],
  ['Bind stocks', false],
  ['cCHIP', true],
  ['Reap on Fridays', false],
  ['sNVDA', true],
  ['Spurs cap your upside', false],
  ['gNVDA', true],
  ['No noise. No gambling.', false],
  ['cVOLT', true],
];
function MarqueeSet() {
  return (
    <>
      {MARQUEE.map(([t, ticker]) => (
        <Fragment key={t}>
          <span className={ticker ? 't' : undefined}>{t}</span>
          <span className="s">✦</span>
        </Fragment>
      ))}
    </>
  );
}

export default async function Landing() {
  const data = await load();
  const home = data.kind === 'ok' ? data.home : null;
  const next = home?.nextRound ?? null;
  const dataNote =
    data.kind === 'ok'
      ? `Live figures${web3Env.mode === 'testnet' ? ' on testnet' : ''}. They change as rounds settle.`
      : data.kind === 'unconfigured'
        ? 'Live figures are not connected yet.'
        : 'Live figures are not available right now.';

  // Tautan chip dan tombol widget: halaman detail bila produknya ada di data, kalau tidak ke daftar (tidak menuju 404).
  const cordonHref = (s: string) =>
    home?.cordons.some((c) => c.symbol === s) ? `/cordons/${s}` : '/cordons';
  const vaultHref = (s: string, kind: 'spur' | 'graft') =>
    home?.vaults.some((v) => v.symbol === s) ? `/vaults/${s}` : `/vaults?kind=${kind}`;
  const cm = home?.cordons.find((c) => c.symbol === 'cMAG7');
  const sn = home?.vaults.find((v) => v.symbol === 'sNVDA');
  const gn = home?.vaults.find((v) => v.symbol === 'gNVDA');
  const live: PinnedLive = {
    cordonHref: cordonHref('cMAG7'),
    spurHref: vaultHref('sNVDA', 'spur'),
    graftHref: vaultHref('gNVDA', 'graft'),
    nav: cm?.navPerShare != null ? usd(cm.navPerShare) : '—',
    cordonLive: !!cm,
    spurStrike: sn?.strike != null ? usd(sn.strike) : 'No round open',
    spurApy: sn?.apy != null ? pct(sn.apy, 1) : '—',
    spurLive: !!sn,
    graftStrike: gn?.strike != null ? usd(gn.strike) : 'No round open',
    graftApy: gn?.apy != null ? pct(gn.apy, 1) : '—',
    graftLive: !!gn,
    graftOpen: gn?.strike != null,
    expiry: next?.expiry ?? null,
  };

  return (
    <>
      <Header overlay />
      <main className="home">
        {/* 4.1 Hero */}
        <section className="hero" id="hero" aria-labelledby="hero-title">
          <HeroParticles />
          <GridBg />
          <div className="hud tl" aria-hidden="true">
            Roma <b>41.90°N 12.49°E</b>
          </div>
          <div className="hud tr" aria-hidden="true">
            New York <NyTime /> ET
          </div>
          <div className="hud bl" aria-hidden="true">
            <span className="scroll-cue">
              <i />
              Scroll
            </span>
          </div>
          <div className="hud br" aria-hidden="true">
            Next Harvest · <b>Fri 16:00 ET</b>
          </div>
          <div className="wrap">
            <div>
              <Appear>
                <Eyebrow>Robinhood Chain · Weekly yield · USDG</Eyebrow>
              </Appear>
              <SplitTitle level={1} id="hero-title">
                Reap on <em>Fridays.</em>
              </SplitTitle>
              <Appear as="p" className="lead" delay={0.5}>
                Earn weekly yield on your tokenized stocks on Robinhood Chain.
                Paid in USDG every Friday.
              </Appear>
              <Appear className="cta-row" delay={0.65}>
                <ButtonLink href="/cordons" magnet arrow>
                  Start earning
                </ButtonLink>
                <ButtonLink href="#how" variant="ghost" magnet>
                  How it works
                </ButtonLink>
              </Appear>
              <Appear as="p" className="note hero-risk" delay={0.72}>
                Yield comes from selling options and is not guaranteed. Stock
                Tokens carry risk of loss.
              </Appear>
              <Appear className="chips" delay={0.8}>
                <Chip href={cordonHref('cMAG7')}>cMAG7</Chip>
                <Chip href={cordonHref('cCHIP')}>cCHIP</Chip>
                <Chip href={cordonHref('cVOLT')}>cVOLT</Chip>
                <Chip href={vaultHref('sNVDA', 'spur')}>sNVDA</Chip>
                <Chip href={vaultHref('gNVDA', 'graft')}>gNVDA</Chip>
              </Appear>
            </div>
            <HeroArt />
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="mq">
            <MarqueeSet />
            <MarqueeSet />
          </div>
        </div>

        <div className="wrap">
          <Appear className="notice" role="status">
            <span className="ring" aria-hidden="true" />
            {next ? (
              <span>
                Next round: {next.symbol} #{next.no} ·{' '}
                <time dateTime={next.expiry}>expires {etLabel(next.expiry)}</time>
                .
              </span>
            ) : (
              'No round is open right now. The next one shows up here.'
            )}
          </Appear>
        </div>
        <div className="wrap">
          <StatsGrid stats={home?.stats ?? null} />
          <p className="note" style={{ padding: '12px 0 0' }}>
            {dataNote}
          </p>
        </div>

        {/* 4.2 The granary + Three ways to bind */}
        <section id="how" aria-labelledby="how-label">
          <div className="wrap">
            <Label>
              <span id="how-label">The granary</span>
            </Label>
            <WordFill text="A wild field scatters its seed and keeps little. Rome learned to bind the harvest, store it, and measure it out on a fixed day. They called the whole of it the [annona.] Markets are wild fields. We bind the world’s great companies into Cordons. We prune them on schedule. We harvest the premium every [Friday.] No noise. No gambling. Just a [full granary.]" />
          </div>
        </section>

        <section className="hair" aria-labelledby="ways-title">
          <div className="wrap">
            <div className="sec-h">
              <div>
                <Label>Three ways to bind</Label>
                <SplitTitle id="ways-title">
                  Own it, <em>cap it,</em> or wait for it.
                </SplitTitle>
              </div>
              <Appear as="p">
                Own a basket in one token. Sell the gains above a strike for a
                weekly premium. Or get paid to wait for a lower price. Each
                comes with its trade-off in plain words.
              </Appear>
            </div>
            <div className="cards3">
              {products.map((p) => (
                <TiltCard key={p.name} href={p.href} className="tcard">
                  <Ill kind={p.glyph} className="glyph" />
                  <span className="tk">{p.sym}</span>
                  <h3>{p.name}</h3>
                  <div className="ty">{p.kind}</div>
                  <p>{p.text}</p>
                  {p.trade && <p className="tr">{p.trade}</p>}
                  <span className="go">
                    {p.cta} <i aria-hidden="true">→</i>
                  </span>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* 4.3 Pinned scenes */}
        <section
          className="hair"
          style={{ paddingTop: 60 }}
          aria-label="How each product works"
        >
          <div className="wrap">
            <Pinned live={live} />
          </div>
        </section>

        {/* 4.4 Two paths + At a glance */}
        <section className="hair" aria-labelledby="paths-title">
          <div className="wrap">
            <div className="sec-h">
              <div>
                <Label>How the granary works</Label>
                <SplitTitle id="paths-title">
                  Two paths, <em>one granary.</em>
                </SplitTitle>
              </div>
              <Appear as="p">
                Cordons are pruned. Vaults are harvested. Holding a Cordon does
                not pay premium on its own.
              </Appear>
            </div>
            <div className="paths">
              {paths.map((path) => (
                <Appear key={path.label} className="path">
                  <h3>{path.label}</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    {path.sub}
                  </p>
                  <FillList className="psteps">
                    {path.steps.map((s, i) => (
                      <li key={s.when}>
                        <span className="n">{i + 1}</span>
                        <span className="h">{s.when}</span>
                        <b>{s.title}</b>
                        <p>{s.text}</p>
                      </li>
                    ))}
                  </FillList>
                </Appear>
              ))}
            </div>
          </div>
        </section>

        <section className="hair" aria-labelledby="glance-title">
          <div className="wrap">
            <div className="sec-h">
              <div>
                <Label>At a glance</Label>
                <SplitTitle id="glance-title">
                  Three plants, <em>side by side.</em>
                </SplitTitle>
              </div>
              <Appear as="p">
                Live figures where the product is live. APY is realized from
                premiums already paid, never projected.
              </Appear>
            </div>
            <div className="glance">
              {today.map((t) => (
                <TiltCard key={t.sym} className="gcol">
                  <span className="gk">{t.kind}</span>
                  <h3>{t.sym}</h3>
                  {[...t.rows, ...liveRows(t, home)].map(([k, v]) => (
                    <div key={k} className="row">
                      <span className="k">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  <ButtonLink href={t.href} variant="ghost" size="sm" arrow>
                    {t.cta}
                  </ButtonLink>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* 4.5 The Harvest band, simulator, risk, FAQ, closing CTA */}
        <div className="band">
          <div className="sunring" aria-hidden="true" />
          <section aria-labelledby="band-title">
            <div className="wrap">
              <div>
                <Label>Harvest · Weekly payout</Label>
                <SplitTitle id="band-title">
                  Every Friday, <em>the harvest comes in.</em>
                </SplitTitle>
                <Appear as="p" className="lead">
                  When a round ends, premium is settled and shared out as USDG
                  you can claim. Your Harvest Card shows the result as a
                  percentage, never a promise.
                </Appear>
                <Appear className="cta-row" style={{ marginTop: 28 }}>
                  <ButtonLink href="/harvest" magnet arrow>
                    View current round
                  </ButtonLink>
                </Appear>
              </div>
              <Appear variant="scale">
                {next ? <Countdown to={next.expiry} big /> : <Countdown big />}
                <p
                  className="note"
                  style={{ marginTop: 12, textAlign: 'center' }}
                >
                  {next ? (
                    <>
                      to {next.symbol} round #{next.no}, which expires{' '}
                      <time dateTime={next.expiry}>{etLabel(next.expiry)}</time>
                      .
                    </>
                  ) : (
                    'to Friday 16:00 ET. Illustrative schedule: no round is open right now.'
                  )}{' '}
                  Times are approximate. Exchange holidays aren’t counted yet.
                </p>
              </Appear>
            </div>
          </section>
        </div>

        <section aria-label="Simulator and risk">
          <div className="wrap">
            <HomeSim sim={home?.sim ?? null} />
            <div style={{ marginTop: 44 }}>
              <RiskBox
                lead="Risk."
                items={[
                  'Stock Tokens are tokenised debt securities. They give economic exposure to a stock, not legal rights to the shares.',
                  'They are not offered to US persons, and other regions are restricted.',
                  <>
                    Options can lose value. Read{' '}
                    <Link href="/docs">Docs &amp; Risk</Link> and check{' '}
                    <Link href="/restricted">where {BRAND} is restricted</Link>{' '}
                    before you start.
                  </>,
                ]}
              />
            </div>
          </div>
        </section>

        <section className="hair" aria-labelledby="faq-title">
          <div className="wrap">
            <div className="acc-head">
              <SplitTitle id="faq-title" style={{ margin: 0 }}>
                Questions and <em>answers</em>
              </SplitTitle>
              <Appear className="acc-tag">
                <b>Q</b> Straight answers · <b>A</b> No fine print
              </Appear>
            </div>
            <Accordion items={faq} />
          </div>
        </section>

        <section className="close hair" aria-labelledby="close-title">
          <div className="wrap">
            <Label>Bind with discipline</Label>
            <SplitTitle id="close-title">
              Bind stocks.
              <br />
              <em>Reap on Fridays.</em>
            </SplitTitle>
            <Appear
              as="p"
              className="lead"
              style={{ margin: '0 auto 34px' }}
            >
              Pick a Cordon. Watch it for a week. Add a Spur when you are
              ready.
            </Appear>
            <Appear className="cta-row">
              <ButtonLink href="/cordons" magnet arrow>
                Bind your first Cordon
              </ButtonLink>
              <ButtonLink href="/docs" variant="ghost" magnet>
                Read the docs
              </ButtonLink>
            </Appear>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
