import { Ill, type IllKind } from "./sheaf-art";

// Ilustrasi tiga cara mengikat di Landing: Cordon = berkas, Spur = lumbung, Graft = timbangan (ill() di annona.html).
// Server component, SVG polos, dekoratif; cakram matahari dan cincin berputar pelan (mati bila reduced-motion).
const KIND: Record<"cordon" | "spur" | "graft", IllKind> = { cordon: "sheaf", spur: "granary", graft: "scale" };

export function WayArt({ kind }: { kind: "cordon" | "spur" | "graft" }) {
  return <Ill kind={KIND[kind]} className="mb-4 block h-auto w-full max-w-[220px]" />;
}
