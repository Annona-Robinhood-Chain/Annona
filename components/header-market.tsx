"use client";
import { useSyncExternalStore } from "react";
import { marketState } from "@/lib/api/market";
import { MarketStatusPill } from "./data";

// Chip status pasar AS. annona.html tidak punya chip di nav (sesi pasar ada di header halaman dan footer), jadi chip ini pindah
// ke kolom Status di footer. Server tidak tahu jam klien, jadi snapshot server null: chip muncul setelah hidrasi dan diperbarui tiap menit.
const subscribe = (cb: () => void) => { const id = setInterval(cb, 60_000); return () => clearInterval(id); };
export function MarketChip() {
  const state = useSyncExternalStore(subscribe, () => marketState(new Date()), () => null);
  if (!state) return null;
  return <div className="mt-3"><MarketStatusPill state={state} prefix="US market" /></div>;
}
