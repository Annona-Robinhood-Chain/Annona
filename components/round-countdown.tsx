"use client";
import { useSyncExternalStore } from "react";
import { Countdown } from "./primitives";

const subscribe = (cb: () => void) => { const id = setInterval(cb, 1000); return () => clearInterval(id); };

// Hitung mundur ke expiry round (Fase 6.3): 4 kotak `.cd` dari primitif Countdown. Server dan hidrasi awal menampilkan "--"
// (now = null) supaya HTML sama dengan klien. Setelah expiry tampil "Harvesting now" sebagai ganti kotak nol.
export function RoundCountdown({ expiry, label = "Next harvest in" }: { expiry: string; label?: string }) {
  const now = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 1000), () => null);
  const over = now !== null && Math.floor(new Date(expiry).getTime() / 1000) <= now;
  return (
    <div className="rcd">
      <p className="note">{label}</p>
      {over ? <p className="rcd-done"><time dateTime={expiry}>Harvesting now</time></p> : <Countdown to={expiry} />}
    </div>
  );
}
