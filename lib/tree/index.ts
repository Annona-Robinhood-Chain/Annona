// Sheaf (berkas gandum) deterministik dari data akun: input sama → output sama (server, browser, gambar share).
// Satu tangkai per posisi (cordon), satu bulir per Harvest, satu helai daun per 1/3 streak. Sama dengan pohon 3D (lib/tree3d-layout).
// Bentuk dasar diport dari drawSheaf() di annona.html: tangkai menyilang di bawah, mengipas di atas, diikat dua pita oranye.
export type TreeInput = {
  address: string;
  totalValueUsd: number;
  positions: { id: string; weightBps: number }[];
  harvests: number; // jumlah Harvest yang diterima
  streak: number; // streak panen tanpa putus
};
export type Grain = { x: number; y: number; rot: number; rx: number; ry: number; ax: number; ay: number };
export type SheafStalk = { id: string; d: string; len: number; grains: Grain[]; leaves: string[]; ghost: boolean };
export type Sheaf = { viewBox: string; sw: number; stalks: SheafStalk[]; tie: string[]; hiddenFruits: number; hiddenCordons: number };

export const MAX_FRUITS = 52;
export const MAX_STALKS = 24;
export const MAX_LEAVES = 60;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Urutan tangkai dari tengah ke tepi (kanan dulu): posisi pertama (biasanya terbesar) berada di tengah berkas. */
export function centerOut(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const slots = Array.from({ length: n }, (_, i) => (i / (n - 1)) * 2 - 1);
  return slots.sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
}
/** Pembagian round-robin: item ke-i dari n mendapat total/n, sisanya ke yang pertama. */
export const share = (total: number, n: number, i: number) => (n === 0 ? 0 : Math.floor(total / n) + (i < total % n ? 1 : 0));

export function generateSheaf(input: TreeInput): Sheaf {
  const pos = input.positions.slice(0, MAX_STALKS);
  const n = pos.length;
  const baseY = 280, cx = 150;
  const H = 190 + 60 * Math.min(1, Math.log10(Math.max(input.totalValueUsd, 1)) / 6); // skala log
  const tieY = baseY - H * 0.42;
  const maxW = Math.max(1, ...pos.map((p) => p.weightBps));
  const slots = centerOut(n);
  const fruitTotal = Math.min(Math.max(input.harvests, 0), MAX_FRUITS);
  const leafTotal = Math.min(Math.max(input.streak, 0) * 3, MAX_LEAVES);
  const sw = 1.4;

  const mk = (id: string, t: number, h: number, grains: number, leaves: number, ghost: boolean): SheafStalk => {
    const topX = cx + t * h * 0.36, topY = baseY - h + Math.abs(t) * h * 0.16;
    const botX = cx - t * h * 0.12, botY = baseY - Math.abs(t) * 4;
    const qx = cx + t * 3;
    const d = `M${r1(botX)} ${r1(botY)}Q${r1(qx)} ${r1(tieY)} ${r1(topX)} ${r1(topY)}`;
    const dx = topX - qx, dy = topY - tieY, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const ang = (Math.atan2(uy, ux) * 180) / Math.PI + 90;
    const gs: Grain[] = [];
    const step = Math.min(h * 0.03, (h * 0.24) / Math.max(grains, 1));
    for (let k = 0; k < grains; k++) {
      const side = k % 2 ? 1 : -1, off = k * step;
      const ex = topX - ux * off + -uy * side * h * 0.012, ey = topY - uy * off + ux * side * h * 0.012;
      gs.push({ x: r1(ex), y: r1(ey), rot: r1(ang + side * 18), rx: r1(h * 0.012), ry: r1(h * 0.026),
        ax: r1(ex + ux * h * 0.06 + -uy * side * h * 0.03), ay: r1(ey + uy * h * 0.06 + ux * side * h * 0.03) });
    }
    // Daun: bilah melengkung di bagian bawah tangkai (di antara pangkal dan ikatan), bergantian kiri-kanan.
    const lv: string[] = [];
    for (let k = 0; k < leaves; k++) {
      const u = 0.18 + (0.34 * (k + 0.5)) / leaves; // posisi di sepanjang kurva (0 pangkal, 1 ujung)
      const px = (1 - u) * (1 - u) * botX + 2 * (1 - u) * u * qx + u * u * topX;
      const py = (1 - u) * (1 - u) * botY + 2 * (1 - u) * u * tieY + u * u * topY;
      const side = k % 2 ? 1 : -1, len = h * 0.13;
      lv.push(`M${r1(px)} ${r1(py)}q${r1(side * len * 0.55)} ${r1(-len * 0.1)} ${r1(side * len)} ${r1(-len * 0.55)}q${r1(-side * len * 0.4)} ${r1(len * 0.35)} ${r1(-side * len)} ${r1(len * 0.55)}z`);
    }
    return { id, d, len: Math.round(h * 1.3), grains: gs, leaves: lv, ghost };
  };

  const stalks: SheafStalk[] = n === 0
    ? [mk("ghost", 0, H * 0.7, 0, 0, true)] // dinding kosong: satu tangkai putus-putus
    : pos.map((p, i) => mk(p.id, slots[i], H * (0.62 + 0.38 * (Math.max(p.weightBps, 0) / maxW)), share(fruitTotal, n, i), share(leafTotal, n, i), false));

  const tie = [[-4, 6], [6, 16]].map(([a, b]) => `M${r1(cx - H * 0.07)} ${r1(tieY + a)}Q${cx} ${r1(tieY + b)} ${r1(cx + H * 0.07)} ${r1(tieY + a)}`);
  return { viewBox: "0 0 300 300", sw, stalks, tie, hiddenFruits: Math.max(0, input.harvests - MAX_FRUITS), hiddenCordons: Math.max(0, input.positions.length - MAX_STALKS) };
}

// SVG mandiri (string) dari sheaf yang sama, dengan warna konkret: tanpa CSS variable dan tanpa <text>.
// Dipakai route handler gambar (next/og memrasterkan SVG di dalam <img>, yang tidak mengenal var(--…) maupun font halaman).
export type SheafPalette = { stroke: string; leaf: string; tie: string; grain: string };
export function sheafSvg(s: Sheaf, p: SheafPalette): string {
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" fill="none" stroke-linecap="round" stroke-linejoin="round">`];
  for (const st of s.stalks) {
    out.push(`<path d="${st.d}" stroke="${p.stroke}" stroke-width="${s.sw}"${st.ghost ? ' stroke-dasharray="3 6" opacity=".5"' : ""}/>`);
    for (const l of st.leaves) out.push(`<path d="${l}" fill="${p.leaf}" fill-opacity=".35" stroke="${p.leaf}" stroke-width="${r1(s.sw * 0.6)}"/>`);
    for (const g of st.grains) {
      out.push(`<ellipse cx="${g.x}" cy="${g.y}" rx="${g.rx}" ry="${g.ry}" transform="rotate(${g.rot} ${g.x} ${g.y})" fill="${p.grain}" fill-opacity=".85" stroke="${p.stroke}" stroke-width="${r1(s.sw * 0.8)}"/>`);
      out.push(`<line x1="${g.x}" y1="${g.y}" x2="${g.ax}" y2="${g.ay}" stroke="${p.stroke}" stroke-width="${r1(s.sw * 0.5)}" opacity=".7"/>`);
    }
  }
  for (const t of s.tie) out.push(`<path d="${t}" stroke="${p.tie}" stroke-width="${r1(s.sw * 3)}"/>`);
  out.push("</svg>");
  return out.join("");
}
