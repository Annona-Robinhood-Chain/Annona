// Tata letak sheaf 3D dari TreeInput yang sama dengan sheaf SVG (lib/tree): satu tangkai per posisi (cordon),
// satu bulir per Harvest (maks MAX_FRUITS), daun bertambah bersama streak. Deterministik dan murni, tanpa three.js, jadi bisa diuji.
// Satuan = unit dunia three.js (cakram matahari di tengah, pangkal berkas di GROUND_Y).
import { centerOut, MAX_FRUITS, MAX_LEAVES, share, type TreeInput } from "./tree/index.ts";

export const MAX_CORDONS_3D = 24; // jumlah tangkai tergambar; sisanya dihitung di hiddenCordons, bukan dibuang diam-diam.
export const GROUND_Y = -2.95;
export const STALK_MIN = 3.0; // tinggi tangkai terpendek
export const STALK_SPAN = 1.4; // tambahan tinggi untuk bobot terbesar
export const TIE_FRAC = 0.42; // tinggi ikatan sebagai pecahan dari tinggi dasar berkas (3.4), sama dengan drawSheaf

export type Stalk3D = { id: string; slot: number; height: number; grains: number; leaves: number };
// scale: pengali tebal tangkai, bulir, dan daun; mengecil bila tangkai banyak supaya berkas tetap terbaca.
export type Layout3D = { stalks: Stalk3D[]; tieY: number; scale: number; hiddenFruits: number; hiddenCordons: number; seed: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (const c of s.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function layoutSheaf3D(input: TreeInput): Layout3D {
  const pos = input.positions.slice(0, MAX_CORDONS_3D);
  const n = pos.length;
  const slots = centerOut(n);
  const maxW = Math.max(1, ...pos.map((p) => p.weightBps));
  const fruitTotal = Math.min(Math.max(input.harvests, 0), MAX_FRUITS);
  const leafTotal = Math.min(Math.max(input.streak, 0) * 3, MAX_LEAVES);
  const stalks: Stalk3D[] = pos.map((p, i) => ({
    id: p.id,
    slot: slots[i],
    height: STALK_MIN + STALK_SPAN * (Math.max(p.weightBps, 0) / maxW),
    // round-robin seperti generateSheaf: tangkai ke-i mendapat bulir ke-i, i+n, i+2n, ...
    grains: share(fruitTotal, n, i),
    leaves: share(leafTotal, n, i),
  }));
  const scale = Math.round(clamp(Math.sqrt(8 / Math.max(n, 1)), 0.55, 1) * 1000) / 1000;
  return {
    stalks, tieY: GROUND_Y + (STALK_MIN + 0.4) * TIE_FRAC, scale,
    hiddenFruits: Math.max(0, input.harvests - MAX_FRUITS), hiddenCordons: Math.max(0, input.positions.length - MAX_CORDONS_3D), seed: hashSeed(input.address),
  };
}
