import { useId } from "react";
import type { TreeInput } from "@/lib/tree";
import { usd } from "@/lib/format";
import { harvestHeadline, harvestSub } from "@/lib/og/copy"; // satu sumber teks dengan gambar PNG (route handler next/og)
import { BRAND } from "./brand";
import { SunDisc } from "./sheaf-art";
import { WallTree } from "./wall-tree";

// Kartu gelap rasio 1200:630: cakram matahari + sheaf akun di kanan, persen realized di kiri (sama dengan gambar PNG yang dibagikan).
// Warna tetap (tidak mengikuti tema halaman) karena kartu ini dibagikan sebagai gambar. Angka selalu realized.
// Nominal dolar hanya tampil jika amountUsd diberikan (opt-in pengguna).
export function HarvestCard({ percent, round, tree, amountUsd, isDemo }: { percent: number; round: number; tree: TreeInput; amountUsd?: number; isDemo?: boolean }) {
  const id = "hc" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <figure className="relative m-0 grid aspect-[1200/630] w-full max-w-xl grid-cols-[1.1fr_.9fr] overflow-hidden rounded-[18px] border border-[#3B342E] bg-[#14110F] text-[#EEE6D9] shadow-[0_24px_48px_-28px_rgba(229,100,43,.45)]">
      <figcaption className="relative z-[1] flex flex-col justify-between py-[7%] pr-0 pl-[8%]">
        <span aria-hidden className="font-serif text-[clamp(.9rem,1.6vw,1.1rem)] opacity-85">{BRAND}</span>
        <div>
          <p className="m-0 font-serif text-[clamp(1.1rem,2.6vw,1.9rem)] leading-[1.12] tracking-[-.015em]">{harvestHeadline(percent)}</p>
          {amountUsd !== undefined && <p className="m-0 mt-1 font-mono text-[clamp(.8rem,1.4vw,1rem)]">{usd(amountUsd)}</p>}
        </div>
        <span className="font-mono text-[clamp(.62rem,1.1vw,.8rem)] opacity-80">{harvestSub(round, !!isDemo)}</span>
      </figcaption>
      <div className="relative">
        <svg aria-hidden viewBox="0 0 300 300" className="absolute inset-0 h-full w-full"><SunDisc cx={150} cy={118} r={84} id={id} /></svg>
        <WallTree input={tree} tone="card" className="absolute inset-[4%_2%_0_0] h-[96%] w-[98%]" />
      </div>
    </figure>
  );
}
