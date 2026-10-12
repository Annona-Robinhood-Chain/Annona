import { BRAND } from "@/components/brand";
import { OG_SIZE } from "@/lib/og/copy";
import { BrandImage, renderImage } from "@/lib/og/images";

export const alt = "Annona. Bind stocks. Reap on Fridays.";
export const size = OG_SIZE;
export const contentType = "image/png";

// Gambar OG bawaan seluruh situs. Statis: tanpa data, dibuat saat build.
export default function Image() {
  return renderImage(
    <BrandImage title={BRAND} subtitle="Cordons, Spurs, and weekly Harvests on Stock Tokens." seed="annona" />,
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  );
}
