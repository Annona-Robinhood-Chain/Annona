/* eslint-disable @next/next/no-img-element -- satori (next/og) hanya memahami <img>, bukan next/image */
import { ImageResponse } from "next/og";
import { BRAND } from "@/components/brand";
import { generateMosaic, mosaicSvg } from "@/lib/mosaic";
import { generateSheaf, sheafSvg, type TreeInput } from "@/lib/tree";
import { harvestHeadline, harvestSub, OG_SIZE, TAGLINE, wallHeadline, wallStats } from "./copy";
import { ogFonts } from "./fonts";
import { MARK_URI } from "./mark";
import { ANNONA_DARK as D, GRID_DARK_URI, SHEAF_PALETTE_DARK } from "./palette";

// Semua gambar share dan OG memakai gaya Annona gelap (Fase 8.3): kisi, cakram matahari oranye, merek + tagline, aksen emas.
// Aturan satori: setiap <div> dengan lebih dari satu anak harus display:flex; tanpa CSS variable. Font gambar masih Fraunces/Inter/JetBrains Mono
// (satori butuh TTF; Cormorant belum diubah ke TTF di assets/og-fonts).
const GLOW = "radial-gradient(circle at 40% 40%, rgba(229,100,43,0.45), rgba(229,100,43,0.06) 60%, rgba(229,100,43,0) 72%)";
const dataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const sheafImage = (input: TreeInput) => {
  const t = generateSheaf(input);
  return { uri: dataUri(sheafSvg(t, SHEAF_PALETTE_DARK)), hidden: t.hiddenFruits };
};

// glow: sisi tempat cakram matahari memancar (sisi gambar utama).
function Frame({ children, glow = "right" }: { children: React.ReactNode; glow?: "left" | "right" }) {
  return (
    <div style={{ display: "flex", position: "relative", width: OG_SIZE.width, height: OG_SIZE.height, background: D.bg, color: D.fg, fontFamily: "Inter" }}>
      <img src={GRID_DARK_URI} width={OG_SIZE.width} height={OG_SIZE.height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ display: "flex", position: "absolute", top: 40, ...(glow === "right" ? { right: 20 } : { left: 20 }), width: 560, height: 560, borderRadius: 280, background: GLOW }} />
      {children}
    </div>
  );
}
const Wordmark = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Fraunces", fontSize: 40 }}>
    <img src={MARK_URI} width={52} height={52} alt="" />
    {BRAND}
  </div>
);
const Tagline = () => <div style={{ display: "flex", fontSize: 26, color: D.fg2 }}>{TAGLINE}</div>;
const Pill = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", border: `2px solid ${D.sun}`, borderRadius: 999, padding: "6px 18px", fontSize: 24, color: D.wheat }}>{children}</div>
);
const Chip = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", border: `2px solid ${D.line}`, borderRadius: 8, padding: "4px 12px", fontFamily: "JetBrains Mono", fontSize: 24, color: D.fg2 }}>{children}</div>
);
const Dot = () => <div style={{ display: "flex", width: 18, height: 18, borderRadius: 9, background: D.wheat }} />;
function Sheaf({ input, size }: { input: TreeInput; size: number }) {
  const { uri, hidden } = sheafImage(input);
  return (
    <div style={{ display: "flex", position: "relative", width: size, height: size }}>
      <img src={uri} width={size} height={size} alt="" />
      {hidden > 0 && <div style={{ display: "flex", position: "absolute", top: 0, right: 0, fontFamily: "JetBrains Mono", fontSize: 26, color: D.fg2 }}>+{hidden}</div>}
    </div>
  );
}

// Harvest Card: persen realized + sheaf. Tanpa nominal dolar dan tanpa alamat (keputusan item 16).
export function HarvestCardImage({ percent, round, tree, isDemo }: { percent: number; round: number; tree: TreeInput; isDemo: boolean }) {
  return (
    <Frame>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 740, padding: 64 }}>
        <Wordmark />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 66, lineHeight: 1.12 }}>{harvestHeadline(percent)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, color: D.fg2 }}><Dot />{harvestSub(round, isDemo)}</div>
        </div>
        <Tagline />
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 40 }}><Sheaf input={tree} size={440} /></div>
    </Frame>
  );
}

// Gambar The Wall: mosaic akun (pita = posisi, ubin emas = Harvest, sama dengan halaman) + hitungan. Tanpa nominal dolar dan tanpa alamat:
// alamat hanya menjadi benih bentuk mosaic, tidak pernah ditulis.
export function WallImage({ tree, positions, harvests, streak, isDemo }: { tree: TreeInput; positions: number; harvests: number; streak: number; isDemo: boolean }) {
  const m = generateMosaic(tree.address, { positions, measures: Math.min(52, harvests) });
  const w = 540, h = Math.round((w * m.height) / m.width);
  return (
    <Frame glow="left">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 600, paddingLeft: 48 }}>
        <img src={dataUri(mosaicSvg(m))} width={w} height={h} alt="" style={{ borderRadius: 14, border: `2px solid ${D.line}` }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "64px 64px 64px 32px" }}>
        <Wordmark />
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 88, lineHeight: 1.05 }}>{wallHeadline}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {wallStats({ positions, harvests, streak }).map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, color: D.fg2 }}><Dot />{s}</div>
            ))}
          </div>
          {isDemo && <div style={{ display: "flex" }}><Pill>Demo data</Pill></div>}
        </div>
        <Tagline />
      </div>
    </Frame>
  );
}

// Gambar OG umum: nama halaman, baris pendukung, dan chip (mis. ticker). Sheaf dekoratif, diseed dari `seed`.
export function BrandImage({ title, subtitle, chips = [], demo = false, seed }: { title: string; subtitle: string; chips?: string[]; demo?: boolean; seed: string }) {
  const tree: TreeInput = { address: seed, totalValueUsd: 50_000, positions: [{ id: "a", weightBps: 4000 }, { id: "b", weightBps: 3500 }, { id: "c", weightBps: 2500 }], harvests: 9, streak: 4 };
  return (
    <Frame>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 740, padding: 64 }}>
        <Wordmark />
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: title.length > 12 ? 72 : 96, lineHeight: 1.05 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.25, color: D.fg2 }}>{subtitle}</div>
          {chips.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{chips.map((c) => <Chip key={c}>{c}</Chip>)}</div>}
          {demo && <div style={{ display: "flex" }}><Pill>Demo preview</Pill></div>}
        </div>
        <Tagline />
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 32 }}><Sheaf input={tree} size={400} /></div>
    </Frame>
  );
}

// Gambar OG sebuah Cordon (Fase 5.3): simbol besar, chip ticker. Satu tangkai per komponen basket (bobot menentukan tinggi).
// Tanpa angka (NAV/TVL): gambar OG tersimpan di cache dan bisa basi. Bulir hanya hiasan.
export function CordonImage({ symbol, name, components, isDemo }: { symbol: string; name: string; components: { ticker: string; weightBps: number }[]; isDemo: boolean }) {
  const input: TreeInput = {
    address: symbol, totalValueUsd: 50_000, positions: components.map((c) => ({ id: c.ticker, weightBps: c.weightBps })),
    harvests: Math.min(components.length * 4, 52), streak: 4,
  };
  return (
    <Frame>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 740, padding: 64 }}>
        <Wordmark />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: symbol.length > 8 ? 84 : 112, lineHeight: 1 }}>{symbol}</div>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 40, lineHeight: 1.2, color: D.fg2 }}>{`${name}. A basket of ${components.length} Stock Tokens.`}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{components.map((c) => <Chip key={c.ticker}>{c.ticker}</Chip>)}</div>
          {isDemo && <div style={{ display: "flex" }}><Pill>Demo preview</Pill></div>}
        </div>
        <Tagline />
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 32 }}><Sheaf input={input} size={420} /></div>
    </Frame>
  );
}

export async function renderImage(el: React.ReactElement, cacheControl: string) {
  return new ImageResponse(el, { ...OG_SIZE, fonts: await ogFonts(), headers: { "Cache-Control": cacheControl } });
}
