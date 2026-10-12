// Palet terang brief §4 (nilai konkret: gambar tidak mengenal CSS variable). Gambar share selalu tema terang.
export const PALETTE = { wall: "#f3eee4", leaf: "#2f4a3a", bark: "#5a4636", wire: "#b8b2a6", fruit: "#c9a227", ink: "#1e2a22" } as const;

// Kisi trellis seperti TrellisBackground (diagonal 24px, wire, opacity rendah), sebagai data URI untuk <img>.
export const TRELLIS_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><pattern id="t" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 0L24 24M24 0L0 24" stroke="${PALETTE.wire}" stroke-width="1" fill="none"/></pattern></defs><rect width="1200" height="630" fill="url(#t)" opacity=".3"/></svg>`,
)}`;

// Palet sheaf untuk gambar share (nilai konkret; tema terang Annona: krem hangat, tinta gelap, aksen oranye). Gambar yang sama dipakai di Fase 8.3.
export const SHEAF_PALETTE = { stroke: "#1C1815", leaf: "#4F7A3E", tie: "#E5642B", grain: "#A87C1A" } as const;

// Palet gelap Annona untuk gambar OG Cordon (nilai konkret: satori tidak mengenal CSS variable). Gambar kartu share lain tetap terang sampai Fase 8.3.
export const ANNONA_DARK = { bg: "#14110F", fg: "#EEE6D9", fg2: "#B4A898", line: "#3B3733", sun: "#E5642B", wheat: "#D8B25E" } as const;
export const SHEAF_PALETTE_DARK = { stroke: "#EEE6D9", leaf: "#8DB37A", tie: "#E5642B", grain: "#D8B25E" } as const;

// Kisi persegi 48px seperti .gridbg, untuk latar OG gelap.
export const GRID_DARK_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" stroke="${ANNONA_DARK.fg}" stroke-opacity=".08" stroke-width="1" fill="none"/></pattern></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`,
)}`;
