import type { Metadata } from 'next';
import Link from 'next/link';
import { RiskCallout } from '@/components/data';
import { DocSec, DocsNav } from '@/components/docs-nav';
import { Footer, Header } from '@/components/layout-parts';
import { PayoffChart } from '@/components/payoff-chart';
import { Appear, PageHead } from '@/components/primitives';
import { ButtonLink } from '@/components/ui';
import { explorerAddressUrl } from '@/lib/web3/explorer';

export const metadata: Metadata = {
  title: 'Docs & Risk — Annona',
  description:
    'How Annona works, what the numbers mean, and what can go wrong. Live on mainnet, not audited. Read this before you deposit.',
};

// Daftar isi berkelompok (.toc di annona.html). Id harus sama dengan id bagian di bawah.
const tocGroups = [
  {
    label: 'Start here',
    items: [
      ['short', 'The short version'],
      ['words', 'The garden’s words'],
      ['week', 'A week in a vault'],
    ],
  },
  {
    label: 'The products',
    items: [
      ['spur', 'Spur Vaults'],
      ['graft', 'Graft Vaults'],
      ['cordon', 'Cordons'],
      ['numbers', 'Reading the numbers'],
      ['contracts', 'Contracts on mainnet'],
    ],
  },
  {
    label: 'Risk and access',
    items: [
      ['risks', 'Risks in full'],
      ['access', 'Who can use Annona'],
      ['open', 'Still being decided'],
    ],
  },
] as const;

const glossary = [
  ['Cordon', 'A basket token. One token holds several stocks, such as cMAG7.'],
  [
    'Spur',
    'A covered-call vault. You deposit a Stock Token and collect premium. Share token: sNVDA.',
  ],
  [
    'Graft',
    'A cash-secured put vault. You deposit USDG and collect premium while you wait to buy lower. Share token: gNVDA.',
  ],
  ['Gardener', 'You: anyone who holds a position.'],
  ['Picker', 'A market maker who buys the option and pays premium up front.'],
  ['Harvest', 'The weekly round: premium is settled and shared out.'],
  ['Pruning', 'Rebalancing a Cordon back to its target weights.'],
  [
    'Trellis',
    'The frame that holds it up: price oracle, keeper bots, and risk limits.',
  ],
  ['The Wall', 'Your portfolio, drawn as a tree.'],
] as const;

const week = [
  [
    'The round opens',
    'Queued deposits join the vault. The strike for the week is set.',
  ],
  [
    'A Picker pays',
    'At launch, one approved Picker quotes a price. Adding more Pickers goes through the 48-hour timelock. The Picker pays the premium before anything else happens.',
  ],
  [
    'The round expires',
    'Exact expiry and settlement price rules are not final yet. See Still being decided.',
  ],
  [
    'The vault settles',
    'The vault compares the settlement price with the strike and pays the Picker only if the option finished in the money.',
  ],
  [
    'Harvest',
    'Premium is shared out as claimable USDG. Your Harvest Card shows what was realized, never a projection.',
  ],
] as const;

const spurRows = [
  [
    'The price at expiry is at or below the strike',
    'The Picker receives nothing. You keep your tokens and the premium.',
  ],
  [
    'The price at expiry is above the strike',
    'The vault pays the Picker the gain above the strike, in tokens: amount × (price − strike) ÷ price. You end up with fewer tokens, plus the premium.',
  ],
] as const;

const graftRows = [
  [
    'The price at expiry is at or above the strike',
    'The Picker receives nothing. You keep your USDG and the premium.',
  ],
  [
    'The price at expiry is below the strike',
    'The vault pays the Picker the shortfall in USDG: amount × (strike − price). You end up with less USDG, plus the premium.',
  ],
] as const;

const numbers = [
  [
    'Realized APY',
    'The average weekly premium of settled rounds, as a share of what backs the round, times 52. For a Spur that is the tokens’ value at the start of the round. For a Graft it is the strike value held as backing. Simple, without compounding. It looks backward only. It is not a rate and it is not promised.',
  ],
  [
    'Strike this week',
    'The price set for the round that is open now. It is per token.',
  ],
  [
    'NAV per share',
    'The value of everything a Cordon holds, divided by its shares. It uses oracle prices, so it moves when those prices move.',
  ],
  [
    'Token price, not stock price',
    'A Stock Token’s price is the stock’s price times a multiplier. Dividends are reinvested through that multiplier, so the token price drifts above the raw stock price over time. Strikes and premiums are set per token.',
  ],
  [
    'Demo labels',
    'Figures for the products live on mainnet come from the chain through the indexer. Anything still drawn from sample data is labelled demo and is not a live price.',
  ],
] as const;

const risks = [
  [
    'Stock Tokens are not shares',
    'They are tokenised debt securities. They give economic exposure to a stock, not legal rights to the shares and not a vote.',
  ],
  [
    'The issuer matters',
    'A Stock Token’s value depends on its issuer. The issuer can pause a token or block transfers. A paused token can hold up a vault, which is why a Cordon lets you redeem one component at a time.',
  ],
  [
    'Spurs cap your upside',
    'If the stock ends above the strike, you give up the gain above it. A Spur still falls with the stock. The premium cushions a drop slightly, nothing more.',
  ],
  [
    'Grafts pay out when the price falls',
    'If the price ends below the strike, the vault pays out the shortfall from your USDG. You can lose more than the premium you collected.',
  ],
  [
    'Prices pause when sessions close',
    'Stock Token prices run 24 hours a day, 5 days a week. When a session closes, the feed holds its last price and does not update. After-hours prices can be thin and can differ from the closing price. Actions that need a fresh price are switched off while prices are not live.',
  ],
  [
    'Oracles can be wrong or late',
    'The design checks every price for age and sanity. On mainnet no sequencer uptime feed is set yet, so the sequencer check is switched off. Checks reduce the risk. They do not remove it.',
  ],
  [
    'Corporate actions can delay a round',
    'Splits and dividends change a token’s multiplier. During a large corporate action the price feed may be paused, and rounds may wait until it returns.',
  ],
  [
    'Few Pickers means thin demand',
    'Early rounds rely on a small set of Pickers. If none quotes a price, that week earns no premium.',
  ],
  [
    'Contracts can have bugs',
    'These contracts are live on mainnet with real assets and have not been externally audited. Spur and Graft vaults have deposit caps. An audit lowers the chance of a bug. It does not rule it out. Deposit only what you can afford to lose.',
  ],
  [
    'Mainnet is new',
    'Very little has run on these contracts so far. Unexpected behaviour is more likely here than in a mature protocol.',
  ],
  [
    'Admin and pause powers',
    'Changes to parameters, Pickers, and fees go through a 48-hour timelock. A separate guardian can pause an asset’s price handling to stop rounds. It cannot move assets or change parameters.',
  ],
  [
    'Entering and leaving costs something',
    'A Cordon buys its tokens at market prices, so thin markets mean slippage, paid by the person minting. Vault deposits and withdrawals wait for the next round.',
  ],
  [
    'Rules can change',
    'Options are derivatives, and the rules for them differ by place and can change. Access can be restricted as a result.',
  ],
  [
    'Past rounds do not predict future ones',
    'A good week says nothing about the next.',
  ],
] as const;

const open = [
  [
    'Expiry and settlement price',
    'How a round ends when prices run around the clock, and what to do if no price arrives right after expiry.',
  ],
  [
    'Strike rule',
    'A fixed distance above the price, or a target based on volatility.',
  ],
  [
    'Fee levels',
    'Every Cordon fee starts at 0%. Each has a maximum written into the contract, and any change waits 48 hours.',
  ],
  [
    'More Pickers',
    'One Picker is registered at launch. Who else joins, and the smallest size they will quote, is not decided.',
  ],
  [
    'Pruning venue',
    'Pruning needs a trading venue set by the admin through the timelock. Which venue, and when, is not decided.',
  ],
  [
    'How access is checked',
    'Annona does not check location or identity today. Whether it will, including for the option vaults, is not decided.',
  ],
] as const;

// Alamat mainnet (chain 4663), disalin dari contracts/deployments/*-mainnet.json. Ubah di sini bila redeploy.
const contracts = [
  ['cMAG7 Cordon', '0x814C595c09ffDe30f8089E11Df50D99D0d1aa195'],
  ['cCHIP Cordon', '0xE75388EEC5b7D76932f61BFB861a16d4C1404604'],
  ['cVOLT Cordon', '0x2D4e49a71f4F3dd1C1DfE1D21e7e00636F2b712A'],
  ['Spur Vault (NVDA)', '0xde42B2355E0Ef2e6D181af88eE6BB42a5EDB63e5'],
  ['Graft Vault (NVDA)', '0xD146CDA52b467DF833CE463511630aff9582345E'],
  ['Harvest auction', '0xb471Fb2AEfdcB87E6EfA0c5fCFb542c9f4c32A53'],
  ['Oracle router', '0xd4C6d51BabB29948eBc9a5e899272FA94C2ABaD8'],
  ['Settlement oracle', '0xF7B65F9a5Ff3aB75661347CB27f05a1DF3ba56e0'],
  ['Timelock (admin)', '0x03549BC22531f26722CC815d32F9548E4ba6A534'],
] as const;

// Token saham dibagikan per istilah (kolom kecil di glosarium, seperti html).
const shareToken: Record<string, string> = { Cordon: 'cMAG7', Spur: 'sNVDA', Graft: 'gNVDA' };

function Outcomes({ caption, left, rows }: { caption: string; left: string; rows: readonly (readonly [string, string])[] }) {
  return (
    <div className="dtable-wrap">
      <table className="dtable">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{left}</th>
            <th scope="col">What happens</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <th scope="row">{a}</th>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <>
      <Header overlay />
      <main>
        <PageHead
          label="Docs & Risk"
          title={<>How it works. <em>What can go wrong.</em></>}
          lead="How Annona works, what its numbers mean, and what can go wrong. Read the risk section before you plant."
          meta={<span className="badge"><span className="pulse" aria-hidden="true" />Live on mainnet · not audited</span>}
        />

        <div className="wrap">
          <div className="docs">
            <DocsNav groups={tocGroups} />

            <div className="doc">
              <DocSec id="short" groups={tocGroups}>
                <ul>
                  <li>Stock Tokens are tokenised debt securities. They follow a stock’s price. They are not shares.</li>
                  <li>Spurs cap your upside. Grafts pay out when the price falls below the strike. You can lose money in both.</li>
                  <li>Premium is payment for taking those trades. It is not a rate and it is not promised.</li>
                  <li>Prices come from an oracle that can pause or go quiet when market sessions close.</li>
                  <li>The contracts are live on mainnet (chain 4663) and are <strong>not audited</strong>. Deposit only what you can afford to lose.</li>
                </ul>
              </DocSec>

              <DocSec id="words" groups={tocGroups}>
                <p>The names of Cordons, Spurs, and Grafts borrow from espalier, the craft of training a tree against a wall.</p>
                <dl className="gl">
                  {glossary.map(([t, d]) => (
                    <div key={t}>
                      <dt>{t}</dt>
                      <dd>{d}</dd>
                      {shareToken[t] && <em>{shareToken[t]}</em>}
                    </div>
                  ))}
                </dl>
              </DocSec>

              <DocSec id="week" groups={tocGroups}>
                <p>Spurs and Grafts run in weekly rounds. One round is one Harvest.</p>
                <ol>
                  {week.map(([t, d]) => (
                    <li key={t}><strong>{t}.</strong> {d}</li>
                  ))}
                </ol>
                <p>Deposits and withdrawals wait for the next round. Instant withdrawal is only for assets that have not entered a round yet.</p>
              </DocSec>

              <DocSec id="spur" groups={tocGroups}>
                <p>Deposit a Stock Token such as NVDA. Each round, the vault sells the upside above a strike. A Picker pays you premium for it. Spurs cap your upside. That is the trade.</p>
                <figure>
                  <PayoffChart kind="spur" titleId="spur-chart-title" />
                  <figcaption>Result per token at expiry, against the start price. Dashed: holding the stock. Solid: a Spur Vault. The dot marks the premium. Illustrative: start 100, strike 110, premium 0.9%. Not a forecast.</figcaption>
                </figure>
                <Outcomes caption="At expiry" left="If…" rows={spurRows} />
                <p>Settlement is paid in Stock Tokens, so the Picker does not need to send USDG at expiry.</p>
              </DocSec>

              <DocSec id="graft" groups={tocGroups}>
                <p>Deposit USDG. Each round, the vault agrees to take the loss if a stock ends below a strike. You are paid premium to wait.</p>
                <figure>
                  <PayoffChart kind="graft" titleId="graft-chart-title" />
                  <figcaption>Result per token at expiry, against the start price. Dashed: buying the stock at the start price. Solid: a Graft Vault. Illustrative: start 100, strike 90, premium 0.9%. Not a forecast.</figcaption>
                </figure>
                <Outcomes caption="At expiry" left="If…" rows={graftRows} />
                <p>The vault holds strike × amount in USDG as backing for each round. In this version it settles in USDG and never buys the stock.</p>
              </DocSec>

              <DocSec id="cordon" groups={tocGroups}>
                <p>One token, one basket. cMAG7 holds AAPL, MSFT, GOOGL, AMZN, META, NVDA, and TSLA at equal weight. cCHIP holds semiconductors and cVOLT holds electric-vehicle and frontier tech names. A Cordon has no premium: you keep the basket’s ups and its downs.</p>
                <p className="formula">NAV per share = Σ(balance × price) ÷ total shares</p>
                <dl className="dl-list">
                  <div><dt>Minting</dt><dd>Pay with USDG. The vault buys each Stock Token at market prices and issues shares for the value it actually received. Slippage falls on the person minting, not on existing holders.</dd></div>
                  <div><dt>Redeeming</dt><dd>In kind: you receive your share of every token, and this is always available. To USDG: only while prices are live.</dd></div>
                  <div><dt>Pruning</dt><dd>On a schedule, and only while prices are live, the basket trades back to its target weights. Each trade is checked against the oracle price with a slippage limit. Pruning needs a trading venue that the admin sets through the timelock. Until one is set, weights drift with prices.</dd></div>
                  <div><dt>Fees</dt><dd>A management fee and mint and redeem fees. All three start at 0%. The contract caps them at 1% to mint, 1% to redeem, and 2% a year for management. A change waits 48 hours.</dd></div>
                </dl>
              </DocSec>

              <DocSec id="numbers" groups={tocGroups}>
                <dl className="dl-list">
                  {numbers.map(([t, d]) => (
                    <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
                  ))}
                </dl>
              </DocSec>

              <DocSec id="contracts" groups={tocGroups}>
                <p>Mainnet, chain 4663. Check an address here against the one in your wallet before you sign anything. Each one links to the block explorer.</p>
                <div role="list" aria-label="Annona contracts on mainnet">
                  {contracts.map(([name, addr]) => (
                    <div key={name} role="listitem" className="addr-row">
                      <span>{name}</span>
                      <code>
                        <a href={explorerAddressUrl(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                      </code>
                    </div>
                  ))}
                </div>
              </DocSec>

              <DocSec id="risks" groups={tocGroups}>
                <p>You can lose some or all of what you put in. These are the ways it can happen.</p>
                <ul>
                  {risks.map(([t, d]) => (
                    <li key={t}><strong>{t}.</strong> {d}</li>
                  ))}
                </ul>
              </DocSec>

              <DocSec id="access" groups={tocGroups}>
                <p>Stock Tokens are not offered to US persons. Other places are restricted too, including Canada, the UK, and Switzerland. The issuer’s own terms hold the full list, and it can change.</p>
                <p>
                  Annona does not check where you are or who you are. You are responsible for knowing whether you may use it.{' '}
                  <Link href="/restricted">See where Annona is restricted</Link>.
                </p>
              </DocSec>

              <DocSec id="open" groups={tocGroups}>
                <p>These rules are not final. This page will change as they are settled.</p>
                <ul>
                  {open.map(([t, d]) => (
                    <li key={t}><strong>{t}.</strong> {d}</li>
                  ))}
                </ul>
              </DocSec>

              <Appear>
                <RiskCallout>
                  Stock Tokens are tokenised debt securities: economic exposure to a stock, not legal rights to the shares. Options can lose value, and a Spur gives up upside above its strike. Past rounds do not predict future ones. Not offered to US persons; other regions are restricted.
                </RiskCallout>
              </Appear>

              <Appear className="doc-cta">
                <ButtonLink href="/cordons" magnet arrow>See Cordons</ButtonLink>
                <ButtonLink href="/vaults" variant="ghost" magnet>See Spurs &amp; Grafts</ButtonLink>
              </Appear>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
