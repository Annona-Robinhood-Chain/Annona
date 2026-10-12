"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LIVE_TEXT, POLL_MS, createRefreshScheduler, statusFromSubscribe, type LiveStatus, type LiveTopic } from "@/lib/realtime/live";
import { getRealtimeClient } from "@/lib/supabase/realtime";
import { Pill, type PillKind } from "./primitives";

// Pembaruan langsung untuk halaman detail (Fase 1 item 20). Berlangganan perubahan tabel lewat Supabase Realtime
// dan meminta server merender ulang halaman ini (router.refresh): angka berubah tanpa muat ulang browser,
// state klien (mis. isi kolom mint) dan posisi gulir tetap.
//
// `announcement` dihitung server dari data yang baru dibaca. Hanya bila isinya BERUBAH setelah refresh, teks itu
// diumumkan ke pembaca layar (aria-live). Jadi pengumuman selalu mengikuti data nyata, bukan sekadar "ada event".
export function LiveUpdates({ topics, announcement }: { topics: LiveTopic[]; announcement: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [, startTransition] = useTransition();

  // Pola React untuk "menyesuaikan state saat prop berubah": dilakukan saat render, bukan di effect.
  const [seen, setSeen] = useState(announcement);
  const [spoken, setSpoken] = useState("");
  if (announcement !== seen) { setSeen(announcement); setSpoken(announcement); }

  // topics datang sebagai objek baru di tiap render server; kunci string menjaga langganan tidak diulang tiap refresh.
  const topicsKey = JSON.stringify(topics);

  useEffect(() => {
    const list: LiveTopic[] = JSON.parse(topicsKey);
    if (list.length === 0) return;
    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let client: Awaited<ReturnType<typeof getRealtimeClient>> = null;
    let dropped = false;

    const refresh = () => startTransition(() => { router.refresh(); });
    const scheduler = createRefreshScheduler(refresh);

    getRealtimeClient().then((c) => {
      if (cancelled || !c) return;
      client = c;
      let ch = c.channel(`live:${list.map((t) => `${t.table}:${t.filter}`).join("|")}`);
      for (const t of list) {
        ch = ch.on("postgres_changes", { event: "*", schema: "public", table: t.table, filter: t.filter }, () => scheduler.schedule());
      }
      channel = ch;
      ch.subscribe((s) => {
        if (cancelled) return;
        const next = statusFromSubscribe(s);
        setStatus(next);
        if (next === "paused") dropped = true;
        // Tersambung lagi setelah putus: event yang terlewat tidak dikirim ulang, jadi baca ulang sekali.
        else if (dropped) { dropped = false; scheduler.schedule(); }
      });
    });

    return () => {
      cancelled = true;
      scheduler.cancel();
      if (channel && client) client.removeChannel(channel);
    };
  }, [topicsKey, router]);

  // Saat koneksi tidak tersambung, periksa sendiri tiap menit selama tab terlihat.
  useEffect(() => {
    if (status !== "paused") return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") startTransition(() => { router.refresh(); });
    }, POLL_MS);
    return () => clearInterval(id);
  }, [status, router]);

  // Chip status gaya Annona (.pill, Fase 7.2): titik hijau berpendar saat tersambung, gandum saat jeda, abu-abu saat menyambung.
  const { text } = LIVE_TEXT[status];
  const kind: PillKind | undefined = status === "live" ? "open" : status === "paused" ? "after" : undefined;
  return (
    <div>
      <Pill kind={kind} data-live-status={status}>{text}</Pill>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{spoken}</p>
    </div>
  );
}
