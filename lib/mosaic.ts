// Mosaic generatif dari alamat wallet (drawMosaic di annona.html): rangka gelap + isian simetris kiri-kanan dalam 2-4 pita warna
// (satu pita per posisi), dan ubin emas di tepi sebanyak jumlah "measure". Murni dan deterministik: alamat sama → gambar sama.
// Satu perbedaan dari html: urutan pita diacak dengan Fisher-Yates (html memakai sort dengan pembanding acak yang hasilnya
// berbeda antar mesin JS, sehingga HTML server dan klien bisa tidak sama).
export const WHEAT_TILE = "#D8B25E";
const FRAME = "#3B342E", HOLE = "#2A241F", BACK = "#110F0D";
const BANDS = [["#E5642B", "#C9542A", "#F2884F"], ["#D8B25E", "#B8933F", "#E7C77E"], ["#7FA07A", "#5F7F5B", "#9CC08A"], ["#B4A898", "#8C8172", "#D6CCBE"], ["#A85D3E", "#8A4630", "#C27855"]];
const r2 = (n: number) => Math.round(n * 100) / 100;

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export type MosaicTile = { x: number; y: number; w: number; fill: string; delay: number };
export type Mosaic = { viewBox: string; width: number; height: number; back: string; tiles: MosaicTile[]; positions: number; measures: number };

// positions/measures (opsional) memaksa jumlah pita dan ubin emas sesuai data nyata (Wall yang terbuka); tanpa itu keduanya diambil dari alamat
// (pratinjau). Aliran angka acak tidak berubah, jadi bentuk dasar satu alamat tetap sama dengan atau tanpa override.
export function generateMosaic(addr: string, opt: { cols?: number; rows?: number; positions?: number; measures?: number } = {}): Mosaic {
  const r = rng(hash((addr || "").trim().toLowerCase() || "annona"));
  const cols = opt.cols ?? 20, rows = opt.rows ?? 14, sz = 14;
  const rPos = r();
  const nPos = opt.positions == null ? 2 + Math.floor(rPos * 3) : Math.min(BANDS.length, Math.max(1, Math.round(opt.positions)));
  const pool = BANDS.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const order = pool.slice(0, nPos);
  const rMeas = r();
  const maxGold = 2 * (cols + rows) - 4;
  const measures = opt.measures == null ? 4 + Math.floor(rMeas * 18) : Math.min(maxGold, Math.max(0, Math.round(opt.measures)));
  const half = Math.ceil(cols / 2), grid: string[][] = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < half; x++) {
      let c: string;
      if (y === 0 || y === rows - 1 || x === 0) c = FRAME;
      else {
        const band = order[Math.min(nPos - 1, Math.floor((y - 1) / ((rows - 2) / nPos)))];
        c = band[Math.floor(r() * band.length)];
        if (r() < 0.12) c = HOLE;
      }
      grid[y][x] = c;
    }
  }
  const border: [number, number][] = [];
  for (let x = 0; x < cols; x++) border.push([x, 0]);
  for (let y = 1; y < rows; y++) border.push([cols - 1, y]);
  for (let x = cols - 2; x >= 0; x--) border.push([x, rows - 1]);
  for (let y = rows - 2; y > 0; y--) border.push([0, y]);
  const gold = new Set(border.slice(0, measures).map((p) => p[0] + "," + p[1]));
  const cx = cols / 2, cy = rows / 2, tiles: MosaicTile[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const sx = x < half ? x : cols - 1 - x;
    const c = gold.has(x + "," + y) ? WHEAT_TILE : grid[y][sx];
    const j = (r() - 0.5) * 1.2, d = Math.hypot(x - cx, y - cy);
    tiles.push({ x: r2(x * sz + 1 + j), y: r2(y * sz + 1 - j), w: sz - 2, fill: c, delay: r2(d * 0.04) });
  }
  return { viewBox: `0 0 ${cols * sz} ${rows * sz}`, width: cols * sz, height: rows * sz, back: BACK, tiles, positions: nPos, measures };
}

// Mosaic sebagai string SVG mandiri (untuk gambar OG: satori membaca <img> data URI, bukan komponen React).
export function mosaicSvg(m: Mosaic): string {
  const rects = m.tiles.map((t) => `<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.w}" rx="1.6" fill="${t.fill}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m.viewBox}" width="${m.width}" height="${m.height}"><rect width="${m.width}" height="${m.height}" fill="${m.back}"/>${rects}</svg>`;
}
