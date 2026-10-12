"use client";
import { useId, useState } from "react";
import { spurResult } from "@/lib/docs/payoff";
import { Appear, Empty, Label, RangeSlider, SplitTitle } from "./primitives";

// Simulator Spur di Home (Fase 4.5), gaya Annona: slider, grafik garis (menahan saham vs Spur), dua kotak hasil.
// Rumus tetap lib/docs/payoff (spurResult), sama dengan sebelum redesain; angka strike dan premium dari round hidup.
// Halaman vault memakai UpsideSimulator (Fase 6.3), yang berbagi geometri grafik dan rumus yang sama dan mendukung Spur serta Graft.
const LO = -20, HI = 40;
const sign = (v: number, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;
const f2 = (n: number) => Math.round(n * 100) / 100;
type Sim = { symbol: string; spot: number; strike: number; premiumPct: number; source: "round" | "last" | null };

export function HomeSim({ sim }: { sim: Sim | null }) {
  const id = useId();
  const [move, setMove] = useState(20);
  const copy = (
    <div>
      <Label>Know the trade</Label>
      <SplitTitle>See it <em>before you make it.</em></SplitTitle>
      <Appear as="p" className="lead">
        A Spur Vault earns premium and gives up the top of a big week. In a falling week, the premium softens the drop but does not stop it. Slide to see how one week plays out.
      </Appear>
      <Appear as="p" className="note" style={{ marginTop: 14 }}>
        Illustrative only, not a forecast.{" "}
        {sim === null && "It uses the strike and premium of an open Spur round, and none is open right now."}
        {sim?.source === "round" && "Uses this round’s live strike and premium."}
        {sim?.source === "last" && "This round has no premium yet, so it uses the last settled round’s premium."}
        {sim && sim.source === null && "No premium is set for this round yet, so it shows the cap only."}
      </Appear>
    </div>
  );
  if (!sim) {
    return (
      <div className="sim-grid">
        {copy}
        <Empty title="No Spur round is open." text="The simulator uses the strike and premium of an open round. It shows up here as soon as one opens." />
      </div>
    );
  }

  const input = { start: sim.spot, strike: sim.strike, premiumPct: sim.premiumPct };
  const strikePct = (sim.strike / sim.spot - 1) * 100;
  const res = (p: number) => spurResult(sim.spot * (1 + p / 100), input);
  const resNow = res(move);

  // Geometri grafik (port sim() di annona.html). Sumbu y melebar bila hasil Spur keluar dari -20..+20.
  const W = 420, H = 230, P = 30;
  const kx = Math.min(HI, Math.max(LO, strikePct));
  const vals = [LO, kx, HI].map(res);
  const ymin = Math.min(LO, -20, Math.floor(Math.min(...vals) / 10) * 10), ymax = Math.max(HI, 20, Math.ceil(Math.max(...vals) / 10) * 10);
  const X = (x: number) => f2(P + ((x - LO) / (HI - LO)) * (W - P * 2));
  const Y = (y: number) => f2(H - P - ((y - ymin) / (ymax - ymin)) * (H - P * 2));
  const grid: number[] = [];
  for (let t = Math.ceil(ymin / 10) * 10; t <= ymax; t += 10) grid.push(t);
  const pts = [LO, kx, HI].map((x) => `${X(x)} ${Y(res(x))}`);
  const showStrike = strikePct >= LO && strikePct <= HI;
  const desc = `Chart comparing holding ${sim.symbol} with a Spur Vault. Strike is ${sign(strikePct)} from the round’s starting price.`;

  return (
    <div className="sim-grid">
      {copy}
      <Appear className="panel" variant="scale">
        <label htmlFor={id} className="muted" style={{ fontSize: 14 }}>
          {sim.symbol} move this week: <b className="num" style={{ color: "var(--fg)" }}>{sign(move, 0)}</b>
        </label>
        <RangeSlider id={id} value={move} min={LO} max={HI} step={1} onValueChange={setMove} aria-valuetext={sign(move, 0)} />
        <div className="sim-scale" aria-hidden="true"><span>{sign(LO, 0)}</span><span>0%</span><span>{sign(HI, 0)}</span></div>
        <svg className="simchart" viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", marginTop: 16 }} role="img" aria-label={desc}>
          <g stroke="var(--line)">
            {grid.map((t) => (
              <g key={t}>
                <line x1={P} y1={Y(t)} x2={W - P} y2={Y(t)} strokeDasharray={t === 0 ? undefined : "2 5"} stroke={t === 0 ? "var(--line-2)" : undefined} />
                <text x={2} y={Y(t) + 4} fill="var(--fg-3)" fontSize={10} stroke="none">{(t > 0 ? "+" : "") + t}</text>
              </g>
            ))}
          </g>
          {showStrike && (
            <>
              <line x1={X(strikePct)} y1={P - 6} x2={X(strikePct)} y2={H - P} stroke="var(--fg-3)" strokeDasharray="3 3" />
              <text x={X(strikePct) + 5} y={P + 4} fill="var(--fg-2)" fontSize={10} style={{ fontFamily: "var(--sans)" }}>Strike</text>
            </>
          )}
          <path d={`M${X(LO)} ${Y(LO)} L${X(HI)} ${Y(HI)}`} stroke="var(--fg-2)" strokeWidth={1.6} fill="none" strokeDasharray="6 5" />
          <path d={`M${pts.join(" L")} L${X(HI)} ${Y(0)} L${X(LO)} ${Y(0)}Z`} fill="rgba(229,100,43,.08)" stroke="none" />
          <path className="lineA" d={`M${pts.join(" L")}`} stroke="var(--sun)" strokeWidth={2.6} fill="none" />
          <line x1={X(move)} y1={P - 6} x2={X(move)} y2={H - P} stroke="var(--line-2)" />
          <circle cx={X(move)} cy={Y(move)} r={5} fill="var(--fg)" />
          <circle cx={X(move)} cy={Y(resNow)} r={14} fill="rgba(229,100,43,.2)" />
          <circle cx={X(move)} cy={Y(resNow)} r={6} fill="var(--sun)" stroke="var(--bg-2)" strokeWidth={2} />
        </svg>
        <div className="sim-out" aria-live="polite">
          <div><small>Holding the stock</small><b>{sign(move)}</b></div>
          <div><small>In a Spur Vault</small><b style={{ color: "var(--leaf)" }}>{sign(resNow)}</b></div>
        </div>
        <p className="note" style={{ margin: "12px 0 0" }}>{`Strike ${sign(strikePct)} from the round’s starting price · premium ${sim.premiumPct.toFixed(2)}%`}</p>
      </Appear>
    </div>
  );
}
