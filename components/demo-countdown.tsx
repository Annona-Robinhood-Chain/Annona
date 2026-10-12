"use client";
import { useSyncExternalStore } from "react";
import { nextHarvestClose, whenLabels } from "@/lib/schedule";
import { Countdown, Tag } from "./primitives";

// Hitung mundur ILUSTRATIF ke Jumat 16:00 ET (Fase 7.2: kotak `.cd` dari primitif Countdown + catatan jam ET dan WIB).
// Dipakai saat tidak ada round berjalan. Ini bukan aturan settlement: lihat lib/schedule.ts.
// Server dan hidrasi awal memakai snapshot null (label ET saja), supaya HTML server tidak berbeda dari klien.
// Label hanya berubah seminggu sekali, jadi snapshot per menit cukup.
const subscribe = (cb: () => void) => { const id = setInterval(cb, 60_000); return () => clearInterval(id); };

export function DemoCountdown({ big = false, className }: { big?: boolean; className?: string }) {
  const now = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 60_000) * 60, () => null);
  const when = now === null ? null : whenLabels(nextHarvestClose(new Date(now * 1000)));
  return (
    <div className={className}>
      <Countdown big={big} />
      <p className="note dcd-note">
        <Tag>Illustrative schedule</Tag>{" "}
        {when ? <>{when.et} · {when.wib}</> : "Friday 16:00 ET"}. No round is open right now, so this is a demo schedule, not a real expiry.
      </p>
    </div>
  );
}
