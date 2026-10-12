"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { shortAddr } from "@/lib/format";
import { web3Enabled, web3Env } from "@/lib/web3/env";
import { Badge } from "./ui";

// Tombol wallet bergaya Annona (.btn .btn-sun/.btn-ghost .btn-sm). Logika wagmi/AppKit tidak berubah.
// className tambahan dari pemanggil (mis. "mag hide-sm" di nav, atau lebar penuh di menu).
const sun = "btn btn-sun btn-sm";
const ghost = "btn btn-ghost btn-sm";

// Hanya dirender bila web3Enabled (nilainya konstan per build), jadi hook wagmi selalu punya WagmiProvider.
function ConnectedWalletButton({ className }: { className: string }) {
  const { open } = useAppKit();
  const { address, isConnected, status, chain } = useAccount();

  if (status === "connecting" || status === "reconnecting") {
    return <button type="button" disabled aria-busy="true" className={`${sun} ${className}`}>Connecting…</button>;
  }
  if (isConnected && address) {
    if (!chain) {
      // Jaringan wallet bukan Robinhood Chain: bukan hanya warna, ada ikon dan teks.
      return <button type="button" onClick={() => open({ view: "Networks" })} className={`${ghost} !border-blight !text-blight ${className}`}><span aria-hidden>△</span>Wrong network</button>;
    }
    return (
      <button type="button" className={`${ghost} font-mono ${className}`} onClick={() => open({ view: "Account" })} aria-label={`Wallet ${address}. Open account`}>
        <span aria-hidden className="size-2 rounded-full bg-gain" />{shortAddr(address)}
      </button>
    );
  }
  return <button type="button" onClick={() => open()} className={`${sun} ${className}`}>Connect<span className="max-[480px]:hidden"> wallet</span></button>;
}

export function WalletButton({ className = "" }: { className?: string }) {
  if (!web3Enabled) {
    // NEXT_MODE kosong = simulasi yang disengaja: tidak ada yang perlu dihubungkan, jadi bukan tombol mati.
    if (!web3Env.mode) {
      return <span title="Simulation mode: no wallet needed and no transaction is sent." className={className}><Badge className="!px-3 !py-1.5 !text-[.8rem]">Simulation<span className="max-[480px]:hidden"> mode</span></Badge></span>;
    }
    // NEXT_MODE terisi tapi konfigurasinya belum lengkap (project ID, atau RPC testnet): ini salah konfigurasi.
    return <button type="button" disabled title="Wallet connection is not configured in this build." className={`${sun} ${className}`}>Connect<span className="max-[480px]:hidden"> wallet</span></button>;
  }
  return <ConnectedWalletButton className={className} />;
}
