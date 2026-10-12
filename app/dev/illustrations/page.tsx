import { notFound } from "next/navigation";
import { GardenArt } from "@/components/garden-art";
import { HarvestCard } from "@/components/harvest-card";
import { HeroParticles } from "@/components/hero-particles";
import { Footer, Header } from "@/components/layout-parts";
import { Mosaic } from "@/components/mosaic";
import { CordonDivider } from "@/components/motif";
import { Appear, PageHead } from "@/components/primitives";
import { Ill, Orbits, SheafPaths, SunDisc, type IllKind } from "@/components/sheaf-art";
import { WallTree } from "@/components/wall-tree";
import { WayArt } from "@/components/way-art";

export const metadata = { robots: { index: false } };

const KINDS: IllKind[] = ["sheaf", "winnow", "sickle", "granary", "scale", "mosaic"];
const pos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, weightBps: Math.max(100, 6000 - i * 400) }));
const tree = (n: number, harvests: number, streak: number) => ({ address: "0x0000000000000000000000000000000000000003", totalValueUsd: 250_000, harvests, streak, positions: pos(n) });

// Halaman pemeriksaan Fase 3 (ilustrasi 2D, partikel, mosaic, sheaf SVG). Seperti /dev/components: hapus sebelum rilis.
// /dev/illustrations?addr=0x… menggambar mosaic untuk alamat itu.
export default async function Illustrations({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_PAGES !== "1") notFound();
  const q = await searchParams;
  const addr = (Array.isArray(q.addr) ? q.addr[0] : q.addr) ?? "0x7a3f0000000000000000000000000000000c41e";
  return (
    <>
      <Header overlay />
      <PageHead crumb={<><span>Dev</span><span>/</span><span>Illustrations</span></>} label="Fase 3 · Illustrations" title={<>Sheaf, sun &amp; <em>mosaic.</em></>} lead="Ilustrasi 2D, partikel hero, sheaf SVG dari data akun, dan mosaic. Sheaf 3D ada di /dev/tree3d. Ganti tema lewat toggle di nav." />
      <section className="border-b border-line py-16">
        <div className="wrap">
          <p className="label">3.1 · ill() ×6</p>
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">{KINDS.map((k) => <figure key={k} className="m-0"><Ill kind={k} className="w-full max-w-[300px]" /><figcaption className="font-mono text-xs text-fg-3">{k}</figcaption></figure>)}</div>
          <p className="label mt-12">WayArt (Landing)</p>
          <div className="mt-4 flex flex-wrap gap-8"><WayArt kind="cordon" /><WayArt kind="spur" /><WayArt kind="graft" /></div>
        </div>
      </section>
      <section className="relative overflow-hidden border-b border-line py-16">
        <HeroParticles />
        <div className="wrap relative">
          <p className="label">3.1 · orbits + sunDisc + sheaf animasi · 3.4 · partikel (gerakkan kursor)</p>
          <Appear><svg viewBox="0 0 600 600" aria-hidden className="mx-auto mt-6 block w-full max-w-[560px]">
            <Orbits cx={320} cy={260} r={190} />
            <SunDisc cx={320} cy={260} r={190} id="devhero" hatch="var(--bg)" />
            <g className="sheaf-grow"><SheafPaths cx={290} baseY={518} h={420} n={15} stroke="var(--fg)" sw={1.6} animate /></g>
            <g className="sheaf-grow" opacity={0.7}><SheafPaths cx={470} baseY={518} h={250} n={9} stroke="var(--fg)" sw={1.3} animate /></g>
          </svg></Appear>
        </div>
      </section>
      <section className="border-b border-line py-16">
        <div className="wrap">
          <p className="label">3.6 · WallTree (sheaf SVG dari data akun; cadangan bila WebGL tidak ada)</p>
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {([[0, 0, 0], [1, 3, 2], [3, 14, 5], [12, 40, 12]] as const).map(([n, h, s]) => <figure key={n} className="m-0"><WallTree input={tree(n, h, s)} animate className="w-full" /><figcaption className="font-mono text-xs text-fg-3">{n} posisi · {h} harvest · streak {s}</figcaption></figure>)}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-8"><HarvestCard percent={0.42} round={4} tree={tree(3, 14, 5)} isDemo /></div>
          <CordonDivider />
          <div className="grid gap-6 sm:grid-cols-2"><GardenArt variant="bare" /><GardenArt variant="cut" /></div>
        </div>
      </section>
      <section className="py-16">
        <div className="wrap">
          <p className="label">3.5 · Mosaic (?addr=…)</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Mosaic address={addr} />
            <Mosaic address="" cols={16} rows={10} />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
