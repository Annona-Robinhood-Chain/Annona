import Link from "next/link";
import { BRAND } from "./brand";
import { RiskBox } from "./primitives";

// Potongan halaman Vaults (Spur & Graft) yang dipakai daftar dan detail (Fase 6).

const common = [
  "Past rounds do not predict future ones.",
  "Stock Tokens are tokenised debt securities: economic exposure to a stock, not legal rights to the shares.",
  "Token prices can sit above the raw share price because dividends are reinvested.",
  <>Not offered to US persons. Other regions are restricted. See <Link href="/restricted">where {BRAND} is restricted</Link>.</>,
];

/** Kotak risiko halaman daftar: kedua jenis vault. Butir seperti `riskBox()` di annona.html, kata Annona dipetakan ke istilah produk (K5). */
export function VaultListRisk() {
  return (
    <RiskBox
      items={[
        "In a Spur, if the stock ends above the strike, the vault pays the difference in tokens. Your upside is capped at the strike. You keep the premium.",
        "In a Graft, if the price ends below the strike, the vault pays out the shortfall in USDG. That can be more than the premium.",
        ...common,
      ]}
    />
  );
}

/** Kotak risiko halaman detail: butir pertama khusus jenis vault. */
export function VaultRisk({ kind }: { kind: "spur" | "graft" }) {
  return (
    <RiskBox
      items={[
        kind === "graft"
          ? "If the price ends below the strike, the vault pays out the shortfall in USDG, and you keep only what is left plus the premium. That can be more than the premium."
          : "Your upside is capped. If the stock ends above the strike, the vault pays the difference in tokens, and you keep the premium.",
        ...common,
      ]}
    />
  );
}
