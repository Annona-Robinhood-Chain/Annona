import { SYMBOL } from "@/lib/api/http";
import { getCordon } from "@/lib/api/queries";
import { BRAND } from "@/components/brand";
import { OG_CACHE, OG_SIZE } from "@/lib/og/copy";
import { BrandImage, CordonImage, renderImage } from "@/lib/og/images";

export const alt = "A Cordon on Annona";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

// Tanpa angka (NAV, TVL): gambar OG tersimpan di cache platform sosial dan bisa basi. Hanya nama dan komposisi.
// Gagal apa pun (symbol aneh, data tidak ada, env kosong) → gambar umum, supaya tautan tetap punya pratinjau.
export default async function Image({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const cordon = SYMBOL.test(symbol) ? await getCordon(symbol).catch(() => null) : null;
  if (!cordon) return renderImage(<BrandImage title={BRAND} subtitle="Cordons, Spurs, and weekly Harvests on Stock Tokens." demo seed="annona" />, OG_CACHE);
  return renderImage(
    <CordonImage symbol={cordon.symbol} name={cordon.name} components={cordon.assets.map((a) => ({ ticker: a.ticker, weightBps: a.weightBps }))} isDemo={cordon.isDemo} />,
    OG_CACHE,
  );
}
