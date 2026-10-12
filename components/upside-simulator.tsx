"use client";
import { useId, useState } from "react";
import { graftResult, spurResult } from "@/lib/docs/payoff";
import { Appear, RangeSlider } from "./primitives";

// Simulator hasil seminggu untuk halaman vault (Fase 6.3), gaya Annona: slider, grafik garis (memegang saham vs vault), dua kotak hasil.
// Rumus tetap lib/docs/payoff (spurResult / graftResult), sama dengan sebelum redesain dan dengan diagram di Docs.
// Geometri grafik mengikuti sim() di annona.html; sumbu y melebar bila hasil vault keluar dari -20..+20.
const LO = -20, HI = 40;
const sign = (v: number, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;
const f2 = (n: number) => Math.round(n * 100) / 100;

// spotLabel: acuan harga untuk strike. Default "today"; halaman vault memakai harga awal round.
// kind "spur" (covered call): upside dibatasi di strike. kind "graft" (cash-secured put): di bawah strike vault membayar selisihnya.
export function UpsideSimulator({ symbol, spot, strike, weeklyPremiumPct, spotLabel = "today", kind = "spur" }: {
  symbol: string; spot: number; strike: number; weeklyPremiumPct: number; spotLabel?: string; kind?: "spur" | "graft";
}) {
  const id = useId();
  const isGraft = kind === "graft";
  // Graft dibuka di sisi turun supaya risikonya langsung terlihat; Spur di sisi naik supaya batasnya terlihat.
  const [move, setMove] = useState(isGraft ? -15 : 20);
  const input = { start: spot, strike, premiumPct: weeklyPremiumPct };
  const strikePct = (strike / spot - 1) * 100;
  const fn = isGraft ? graftResult : spurResult;
  const res = (p: number) => fn(spot * (1 + p / 100), input);
  const resNow = res(move);

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
  const holdLabel = isGraft ? "Buying the stock" : "Holding the stock";
  const vaultLabel = isGraft ? "In a Graft Vault" : "In a Spur Vault";
  const desc = `Chart comparing ${isGraft ? "buying" : "holding"} ${symbol} with a ${isGraft ? "Graft" : "Spur"} Vault. Strike is ${sign(strikePct)} from ${spotLabel}.`;

  return (
    <Appear className="panel" variant="scale">
      <label htmlFor={id} className="muted" style={{ fontSize: 14 }}>
        {symbol} move this week: <b className="num" style={{ color: "var(--fg)" }}>{sign(move, 0)}</b>
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
        <div><small>{holdLabel}</small><b>{sign(move)}</b></div>
        <div><small>{vaultLabel}</small><b style={{ color: "var(--leaf)" }}>{sign(resNow)}</b></div>
      </div>
      <p className="note" style={{ margin: "12px 0 0" }}>
        {isGraft
          ? `Grafts take the downside below the strike (${Math.abs(strikePct).toFixed(1)}% ${strikePct < 0 ? "below" : "above"} ${spotLabel}): the vault pays out the shortfall. That is the trade.`
          : `Spurs cap your upside at the strike (${strikePct.toFixed(1)}% above ${spotLabel}). That is the trade.`}
        {" "}Premium {weeklyPremiumPct.toFixed(2)}%. Illustrative, not a forecast.
      </p>
    </Appear>
  );
}
