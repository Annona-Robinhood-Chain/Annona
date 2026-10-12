"use client";
import { useState } from "react";
import { Button, ButtonLink, Badge } from "@/components/ui";
import {
  Accordion, Appear, ChartEmpty, Chip, Countdown, Empty, Eyebrow, Field, FillList, Label, Note, Pill, RangeSlider, RiskBox,
  SplitTitle, Tag, TextInput, TiltCard, WordFill,
} from "@/components/primitives";
import { SheafPaths } from "@/components/sheaf-art";

// Galeri primitif Fase 2 (halaman sementara, dihapus di Fase 10). Bandingkan dengan annona.html di tema gelap dan terang (toggle di nav).
function Glyph() {
  return <svg className="glyph" viewBox="0 0 300 300" aria-hidden="true"><SheafPaths cx={150} baseY={270} h={220} n={9} stroke="currentColor" sw={1.6} /></svg>;
}
const Sec = ({ id, label, title, children }: { id: string; label: string; title: React.ReactNode; children: React.ReactNode }) => (
  <section id={id} className="border-b border-line py-20 max-md:py-14">
    <div className="wrap">
      <Label>{label}</Label>
      <SplitTitle level={3}>{title}</SplitTitle>
      <div className="mt-8">{children}</div>
    </div>
  </section>
);

export function PrimitivesGallery() {
  const [move, setMove] = useState(20);
  return (
    <>
      <Sec id="p-btn" label="2.1 · Buttons" title={<>Buttons, <em>pills</em> and tags.</>}>
        <div className="flex flex-wrap items-center gap-3">
          <Button arrow magnet>Bind your first Sheaf</Button>
          <Button variant="ghost" magnet>How the granary works</Button>
          <Button size="sm">Small</Button>
          <Button variant="ghost" size="sm" arrow>Small ghost</Button>
          <Button disabled>Disabled</Button>
          <ButtonLink href="/cordons" variant="ghost" arrow>Link button</ButtonLink>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Pill kind="open">Regular session</Pill><Pill kind="pre">Pre-market</Pill><Pill kind="after">After hours</Pill><Pill kind="night">Overnight</Pill><Pill>Closed</Pill>
          <Tag>4 assets</Tag><Tag sun>5 assets</Tag><Badge>Simulation mode</Badge>
          <Eyebrow>Stock Tokens · Weekly premium · Onchain</Eyebrow>
        </div>
        <div className="mt-8 chips"><Chip href="/cordons">cMAG7</Chip><Chip href="/cordons">cCHIP</Chip><Chip href="/vaults">sNVDA</Chip></div>
        <div className="mt-8"><Label reveal={false}>Label</Label><p className="lead">Lead paragraph in the muted tone.</p><Note className="mt-2">Note: small, dim text for fine print.</Note></div>
      </Sec>

      <Sec id="p-reveal" label="2.2 · Reveal" title={<>Split text, <em>reveal</em> and word-fill.</>}>
        <div className="grid gap-4 md:grid-cols-3">
          <Appear className="rounded-3xl border border-line p-6">Default reveal (fade + rise)</Appear>
          <Appear variant="scale" delay={0.1} className="rounded-3xl border border-line p-6">Scale reveal</Appear>
          <Appear variant="clip" delay={0.2} className="rounded-3xl border border-line p-6">Clip reveal</Appear>
        </div>
        <SplitTitle level={2} className="mt-12">Own it, <em>tithe it,</em> or wait for it.</SplitTitle>
        <WordFill className="mt-10" text="A wild field scatters its seed and keeps little. Rome learned to bind the harvest, store it, and measure it out on a fixed day. They called the whole of it the [annona.] Markets are wild fields. We bind the world’s great companies into sheaves. No noise. No gambling. Just a [full granary.]" />
      </Sec>

      <Sec id="p-cards" label="2.3 · Cards" title={<>Tilt cards, <em>glance</em> columns.</>}>
        <div className="cards3">
          <TiltCard href="/cordons" className="tcard"><Glyph /><span className="tk">01 · Cordon</span><h3>Own it</h3><div className="ty">Basket token</div><p>Own a basket of Stock Tokens in one token. Redeem in kind any time.</p><p className="tr">The trade-off: you hold the basket’s risk.</p><span className="go">View Cordons <i>→</i></span></TiltCard>
          <TiltCard href="/vaults" className="tcard" delay={0.1}><Glyph /><span className="tk">02 · Spur</span><h3>Tithe it</h3><div className="ty">Covered-call vault</div><p>Sell the gains above a strike for a weekly premium.</p><p className="tr">You give up the top of a big week.</p><span className="go">View Spurs <i>→</i></span></TiltCard>
          <TiltCard href="/vaults" className="tcard" delay={0.2}><Glyph /><span className="tk">03 · Graft</span><h3>Wait for it</h3><div className="ty">Cash-secured vault</div><p>Get paid to wait for a lower price.</p><p className="tr">If it falls past the strike, you buy.</p><span className="go">View Grafts <i>→</i></span></TiltCard>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TiltCard href="/cordons" className="pcard"><div className="top"><div><div className="sym">cMAG7</div><div className="nm">Magnificent Seven</div></div><Tag sun>7 assets</Tag></div><ChartEmpty label="No NAV history yet" /><div className="row"><span className="k">NAV per share</span><span className="num">$0.00</span></div><div className="row"><span className="k">Total value</span><span className="num">$0.00</span></div><span className="btn btn-ghost btn-sm mt-4 self-start">View Cordon <span className="arr">→</span></span></TiltCard>
          <div className="glance" style={{ gridTemplateColumns: "1fr" }}>
            <TiltCard className="gcol"><span className="gk">Spur</span><h3>sNVDA</h3><div className="row"><span className="k">Strike this week</span><span>No round open</span></div><div className="row"><span className="k">Realized APY</span><span className="num">—</span></div><ButtonLink href="/vaults" variant="ghost" size="sm" arrow>Open vault</ButtonLink></TiltCard>
          </div>
        </div>
      </Sec>

      <Sec id="p-steps" label="2.3 · Steps" title={<>Paths and <em>timeline.</em></>}>
        <div className="paths">
          <Appear className="path"><h3>Cordons are winnowed</h3><p className="muted m-0">Scheduled rebalance back to target weights.</p>
            <FillList className="psteps">
              <li><span className="n">1</span><span className="h">Bind</span><b>Mint a Cordon</b><p>Deposit USDG and receive shares at NAV.</p></li>
              <li><span className="n">2</span><span className="h">Drift</span><b>Weights move</b><p>Prices move the weights away from target.</p></li>
              <li><span className="n">3</span><span className="h">Winnow</span><b>Trim back</b><p>The keeper trims positions back to target.</p></li>
            </FillList>
          </Appear>
          <Appear className="path" delay={0.1}><h3>Vaults are measured</h3><p className="muted m-0">Weekly rounds, settled every Friday.</p>
            <FillList as="ol" className="timeline">
              <li><span className="dotn">1</span><span className="when">Roll</span><b>Round opens</b><p>Queued deposits join and the strike is set.</p></li>
              <li><span className="dotn">2</span><span className="when">Sell</span><b>A Merchant pays</b><p>Premium is paid up front.</p></li>
              <li><span className="dotn">3</span><span className="when">Measure</span><b>You claim</b><p>Claim your premium in USDG.</p></li>
            </FillList>
          </Appear>
        </div>
      </Sec>

      <Sec id="p-boxes" label="2.3 · Boxes" title={<>FAQ, <em>risk</em> and empty states.</>}>
        <div className="grid gap-8 lg:grid-cols-2">
          <div><Accordion startOpen={[0]} items={[{ q: "Do I own the stocks inside a Cordon?", a: "You own a token backed by the Stock Tokens the Cordon holds, onchain. You can redeem in kind for your share of each stock at any time." }, { q: "When is premium paid?", a: "Premium is paid up front by the Merchant when a round opens and claimable after it settles." }, { q: "What can go wrong?", a: "Prices move, oracles can pause, and a Graft can be assigned below market." }]} /></div>
          <div className="grid content-start gap-5">
            <RiskBox items={["Stock Tokens give economic exposure, not legal rights to the shares.", "Spurs cap your upside."]} />
            <Empty title="Nothing planned right now" text="New Cordons appear here before they go live." />
            <ChartEmpty tall label="NAV history appears after the first mint" />
          </div>
        </div>
      </Sec>

      <Sec id="p-cd" label="2.4 · Countdown" title={<>Friday, <em>16:00 ET.</em></>}>
        <div className="grid items-center gap-8 md:grid-cols-2"><Countdown big /><Countdown /></div>
        <Note className="mt-4">Tanpa prop `to`: menghitung ke Jumat 16:00 ET berikutnya. Dengan `to`: ke waktu itu.</Note>
      </Sec>

      <Sec id="p-form" label="2.5 · Form" title={<>Inputs and <em>sliders.</em></>}>
        <div className="grid items-start gap-8 md:grid-cols-2">
          <div>
            <label htmlFor="g-addr" className="note">Wallet address</label>
            <TextInput id="g-addr" className="mt-2" placeholder="0x…" spellCheck={false} autoComplete="off" />
            <Field label="Amount" aside="Balance 0.00" asset="USDG"><input inputMode="decimal" placeholder="0.00" /></Field>
          </div>
          <div>
            <label htmlFor="g-range" className="muted text-sm">NVDA move this week: <b className="num text-ink">{move > 0 ? "+" : ""}{move}%</b></label>
            <RangeSlider id="g-range" min={-30} max={30} value={move} onValueChange={setMove} />
            <div className="sim-scale"><span>-30%</span><span>0%</span><span>+30%</span></div>
          </div>
        </div>
      </Sec>
    </>
  );
}
