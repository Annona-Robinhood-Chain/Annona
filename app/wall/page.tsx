import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/components/brand';
import { HarvestCard } from '@/components/harvest-card';
import { Footer, Header } from '@/components/layout-parts';
import { Mosaic } from '@/components/mosaic';
import {
  Appear,
  Empty,
  GridBg,
  Label,
  PageHead,
  RiskBox,
  SplitTitle,
  Tag,
  TextInput,
} from '@/components/primitives';
import { PositionList } from '@/components/product';
import { ShareActions } from '@/components/share-actions';
import { Tilt } from '@/components/tilt';
import { Timeline, type TimelineStep } from '@/components/timeline';
import { ButtonAnchor, ButtonLink } from '@/components/ui';
import { WallAccount } from '@/components/wall-account';
import { WallVisual } from '@/components/wall-visual';
import { WallWallet } from '@/components/wall-wallet';
import { ADDRESS, ConfigError } from '@/lib/api/http';
import {
  getOwnPrivacy,
  getViewer,
  loadWall,
  type Viewer,
} from '@/lib/auth/server';
import type { Access } from '@/lib/auth/wallets';
import { pct, shortAddr, usd } from '@/lib/format';
import { TAGLINE } from '@/lib/og/copy';
import { web3Enabled } from '@/lib/web3/env';

// Posisi dan Harvest berubah tiap minggu: jangan dibekukan saat build.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Wall — Annona',
  description:
    'Your portfolio laid as a mosaic: one band per position, one gold tile per Harvest. Shared only when you choose. Demo preview.',
};

type Props = { searchParams: Promise<{ address?: string | string[] }> };
type Wall = Extract<
  Awaited<ReturnType<typeof loadWall>>,
  { kind: 'ok' }
>['wall'];
type Loaded =
  | { kind: 'ok'; wall: Wall; access: Exclude<Access, { kind: 'private' }> }
  | { kind: 'private' }
  | { kind: 'unconfigured' }
  | { kind: 'error' };

// Akses diperiksa di database (RLS) dan di loadWall: Wall milik orang lain hanya terbaca bila pemiliknya memilih publik.
async function load(address: string, viewer: Viewer): Promise<Loaded> {
  try {
    const r = await loadWall(address, viewer);
    return r.kind === 'private'
      ? { kind: 'private' }
      : { kind: 'ok', wall: r.wall, access: r.access };
  } catch (e) {
    if (e instanceof ConfigError) return { kind: 'unconfigured' };
    console.error(e);
    return { kind: 'error' };
  }
}

// Penonton (sesi login dari cookie) dibaca sekali; panel "Sign in" membutuhkannya walau belum ada alamat yang dicari.
async function loadAll(input: string, valid: boolean) {
  let viewer: Viewer;
  try {
    viewer = await getViewer();
  } catch (e) {
    const unconfigured = e instanceof ConfigError;
    if (!unconfigured) console.error(e);
    const data: Loaded | null =
      valid && input !== ''
        ? { kind: unconfigured ? 'unconfigured' : 'error' }
        : null;
    return { viewer: null, ownPrivacy: null, data };
  }
  const [data, ownPrivacy] = await Promise.all([
    valid && input !== '' ? load(input, viewer) : Promise.resolve(null),
    getOwnPrivacy(viewer).catch((e) => {
      console.error(e);
      return null;
    }),
  ]);
  return { viewer, ownPrivacy, data };
}

const Dev = () =>
  process.env.NODE_ENV !== 'production' ? (
    <p className="mono dim" style={{ marginTop: 14, fontSize: 12 }}>
      Dev: fill NEXT_PUBLIC_SUPABASE_URL and a publishable key in .env.local,
      then apply the migrations.
    </p>
  ) : null;

// Alamat contoh untuk pratinjau mosaic selama belum ada alamat yang dicari.
const SAMPLE_ADDRESS = '0x7a3f…c41e';

// Alur singkat produk (Timeline bernomor). Selalu tampil, bukan hanya saat Wall kosong.
const FLOW: TimelineStep[] = [
  { when: 'Step 1', title: 'Plant', text: 'Mint a Cordon, or deposit into a Spur or Graft vault.' },
  { when: 'Step 2', title: 'Train', text: 'Cordons are rebalanced on schedule. Vault deposits wait for the next round.' },
  { when: 'Step 3', title: 'Harvest', text: 'Each week the round settles. Your premium is ready to claim in USDG.' },
  { when: 'Step 4', title: 'Grow', text: 'The Wall adds one band per position and one gold tile per Harvest. A Harvest Card is made after each settlement.' },
  { when: 'Step 5', title: 'Share', text: 'Your garden is private by default. Sign in with your wallet to open it, and choose whether others can.' },
];

export default async function WallPage({ searchParams }: Props) {
  const { address: raw } = await searchParams;
  const input = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';
  const invalid = input !== '' && !ADDRESS.test(input);
  const { viewer, ownPrivacy, data } = await loadAll(input, !invalid);
  const signedInAs = viewer?.wallets[0] ?? null;
  const wall = data?.kind === 'ok' ? data.wall : null;
  const access = data?.kind === 'ok' ? data.access : null;
  const planted = wall && wall.positions.length > 0 ? wall : null;
  const h = planted?.lastHarvest ?? null;
  const shareText =
    planted && h
      ? `My garden harvested ${pct(h.pct)} this week. Realized, round #${h.round}${planted.isDemo ? ' · demo data' : ''}. ${TAGLINE}`
      : '';
  // Mosaic: data nyata bila Wall terbuka; selain itu pratinjau dari alamat yang diketik (atau alamat contoh), tanpa angka.
  const seed = planted ? planted.address : input !== '' && !invalid ? input : SAMPLE_ADDRESS;
  const caption = planted
    ? 'Each band is a position (up to 5 drawn). Each gold tile is a Harvest (up to 52 drawn). The same address always lays the same mosaic.'
    : input !== '' && !invalid
      ? 'Preview drawn from the address only. Real positions show once the owner opens the Wall.'
      : 'Sample preview. Paste an address to lay its mosaic.';

  return (
    <>
      <Header overlay />
      <main>
        <PageHead
          label="The Wall"
          title={
            <>
              Set in <em>stone.</em>
            </>
          }
          lead="Your portfolio, laid as tesserae. One band per position, one gold tile per Harvest. Shared only when you choose."
          meta={wall?.isDemo ? <Tag>Demo data · not live prices</Tag> : undefined}
        />

        <div className="wrap">
          <section
            className="sec"
            style={{ paddingTop: 20 }}
            aria-label="Your garden"
          >
            <div className="split">
              <div>
                <Appear variant="scale">
                  <div className="stage wall-stage">
                    <GridBg />
                    <div className="wall-in">
                      <WallVisual
                        mosaic={
                          <Mosaic
                            address={seed}
                            positions={planted?.positions.length}
                            measures={planted ? Math.min(52, planted.harvests) : undefined}
                          />
                        }
                        tree={planted?.tree}
                      />
                      <div className="wall-rows">
                        <div className="row">
                          <span className="k">Bands (positions)</span>
                          <span className="num">{planted ? planted.positions.length : '—'}</span>
                        </div>
                        <div className="row">
                          <span className="k">Gold tiles (Harvests)</span>
                          <span className="num">{planted ? planted.harvests : '—'}</span>
                        </div>
                        {planted && (
                          <div className="row">
                            <span className="k">Harvest streak</span>
                            <span className="num">
                              {planted.streak} {planted.streak === 1 ? 'week' : 'weeks'}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="note wall-note">{caption}</p>
                      {access?.kind === 'owner' && (
                        <p className="note wall-note">
                          This is your garden.{' '}
                          {access.isPrivate
                            ? 'It is private: only you can see it while signed in.'
                            : 'It is public: anyone with the address can open it.'}
                        </p>
                      )}
                      {planted && (
                        <div className="wall-actions">
                          <ButtonAnchor
                            href={`/api/accounts/${planted.address}/wall.png`}
                            download={`${BRAND.toLowerCase()}-wall.png`}
                            variant="ghost"
                            size="sm"
                          >
                            Download image
                          </ButtonAnchor>
                          <span className="note">
                            Counts only: no amounts and no address on the picture.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Appear>

                <div className="wall-status">
                  {data?.kind === 'private' && (
                    <Empty
                      title="This garden is private"
                      text="A garden stays private until its owner chooses to share it. If this address is yours, connect that wallet and sign in below to open it."
                    />
                  )}
                  {data?.kind === 'unconfigured' && (
                    <Empty
                      title="Data is not connected yet"
                      text="This preview could not reach its data source, so this garden cannot be shown."
                    >
                      <Dev />
                    </Empty>
                  )}
                  {data?.kind === 'error' && (
                    <Empty
                      title="The garden is out of reach"
                      text="We could not load this garden just now. Try again in a moment."
                    />
                  )}
                  {wall && wall.positions.length === 0 && (
                    <Empty
                      title="Nothing planted at this address yet"
                      text={`${shortAddr(wall.address)} holds no Cordons or vault shares. Plant something and a mosaic will grow here.`}
                    >
                      <div className="cta-row" style={{ justifyContent: 'center', marginTop: 18 }}>
                        <ButtonLink href="/cordons" size="sm">See Cordons</ButtonLink>
                        <ButtonLink href="/vaults" variant="ghost" size="sm">
                          See Spurs & Grafts
                        </ButtonLink>
                      </div>
                    </Empty>
                  )}
                </div>
              </div>

              <aside aria-label="Open a Wall" className="stick-col">
                <Appear>
                  <form className="form" action="/wall" method="get">
                    <label className="note" htmlFor="address">
                      Wallet address
                    </label>
                    <TextInput
                      id="address"
                      name="address"
                      defaultValue={input}
                      placeholder="0x…"
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? 'address-error' : 'address-help'}
                    />
                    <button type="submit" className="wbtn">
                      Lay the mosaic
                    </button>
                    {invalid ? (
                      <p id="address-error" role="alert" className="hint wall-err">
                        <span aria-hidden>△ </span>That does not look like a
                        wallet address. It starts with 0x and has 42 characters.
                      </p>
                    ) : (
                      <p id="address-help" className="hint">
                        {web3Enabled
                          ? 'Paste an address. A garden opens when its owner has made it public, or when it is yours and you are signed in below.'
                          : 'Wallet connection is not set up in this preview. Paste an address.'}
                      </p>
                    )}
                    <WallWallet current={input} />
                  </form>
                </Appear>
              </aside>
            </div>
          </section>

          {planted && <Body wall={planted} />}

          <section className="sec" aria-labelledby="flow-title">
            <div className="sec-h">
              <div>
                <Label>How the Wall grows</Label>
                <SplitTitle id="flow-title">
                  Five steps, <em>tile by tile.</em>
                </SplitTitle>
              </div>
            </div>
            <Timeline steps={FLOW} />
          </section>

          <section className="sec" aria-labelledby="card-title">
            <div className="grid2 wall-card">
              <div>
                <Label>Harvest Card</Label>
                <SplitTitle id="card-title">
                  Your card, <em>after each Harvest.</em>
                </SplitTitle>
                <Appear as="p" className="lead">
                  Made after every settlement. Realized numbers only, as a
                  percent and your sheaf. Never dollar amounts.
                </Appear>
                <Appear as="p" className="note" style={{ marginTop: 14 }}>
                  Pictures are drawn only when asked for. For a private garden,
                  only its owner can ask, while signed in.
                </Appear>
              </div>
              {planted && h ? (
                <Appear variant="scale">
                  <Tilt max={9} rz="-1.2deg" className="rounded-[18px]">
                    <HarvestCard
                      percent={h.pct}
                      round={h.round}
                      tree={planted.tree}
                      isDemo={planted.isDemo}
                    />
                  </Tilt>
                  <ShareActions
                    text={shareText}
                    imageHref={`/api/accounts/${planted.address}/card.png`}
                  />
                </Appear>
              ) : (
                <Empty
                  title="No Harvest Card yet"
                  text={
                    planted
                      ? 'Your first Harvest Card appears after your first settled round.'
                      : 'Open a Wall with a settled Harvest to see its card here.'
                  }
                />
              )}
            </div>
          </section>

          <section className="sec" aria-labelledby="signin-title">
            <div className="grid2" style={{ alignItems: 'start' }}>
              <div>
                <Label>Sign in</Label>
                <SplitTitle id="signin-title">
                  Private <em>by default.</em>
                </SplitTitle>
                <Appear as="p" className="lead">
                  Signing proves you own the address. It sends no transaction
                  and costs no gas.
                </Appear>
                <Appear style={{ marginTop: 24 }}>
                  <WallAccount
                    key={signedInAs ?? 'anon'}
                    signedInAs={signedInAs}
                    isPrivate={ownPrivacy}
                  />
                </Appear>
              </div>
              <RiskBox
                items={[
                  'Harvests are premiums already paid, not a forecast. Past weeks do not predict future ones.',
                  'Spurs cap your upside. That is the trade.',
                  'Stock Tokens are tokenised debt securities: economic exposure to a stock, not legal rights to the shares.',
                  <>
                    Not offered to US persons. Other regions are restricted. See{' '}
                    <Link href="/restricted">where {BRAND} is restricted</Link>.
                  </>,
                ]}
              />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Body({ wall }: { wall: NonNullable<Wall> }) {
  const items = [...wall.positions]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .map((p) => ({
      id: p.id,
      label: p.id,
      valueUsd: p.valueUsd,
      weightBps: p.weightBps,
    }));
  const atCost = wall.positions.some((p) => p.valueBasis === 'cost');
  const h = wall.lastHarvest;

  return (
    <section className="sec" aria-labelledby="pos-title">
      <div className="sec-h">
        <div>
          <Label>The garden</Label>
          <SplitTitle id="pos-title">
            Positions, <em>largest first.</em>
          </SplitTitle>
        </div>
        <Appear as="p">Public data for this address. Realized, never projected.</Appear>
      </div>
      <div className="grid2">
        <Appear className="panel">
          <h3 className="wall-h">Positions</h3>
          <PositionList items={items} />
          {atCost && (
            <p className="note wall-note">
              Vault positions are shown at cost basis until vault share prices
              are available. Cordons are shown at NAV.
            </p>
          )}
        </Appear>
        <Appear className="panel" delay={0.1}>
          <h3 className="wall-h">Garden at a glance</h3>
          <div className="plist">
            <div className="row">
              <span className="k">Total value</span>
              <span className="num">{usd(wall.totalValueUsd)}</span>
            </div>
            <div className="row">
              <span className="k">Harvests received</span>
              <span className="num">{wall.harvests}</span>
            </div>
            <div className="row">
              <span className="k">Harvest streak</span>
              <span className="num">
                {wall.streak} {wall.streak === 1 ? 'week' : 'weeks'}
              </span>
            </div>
            {h && (
              <div className="row">
                <span className="k">Latest Harvest</span>
                <span className="num">
                  <span aria-hidden className="dot-gold">
                    ●
                  </span>{' '}
                  {pct(h.pct)} · round #{h.round}
                </span>
              </div>
            )}
          </div>
          <p className="note wall-note">
            {h
              ? 'Latest Harvest is the premium paid out in the most recent week, as a share of total value.'
              : 'No Harvest yet. The first one will show up here.'}
          </p>
        </Appear>
      </div>
    </section>
  );
}
