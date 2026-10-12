import { MARK_COLORS, MARK_PATHS, MARK_VIEWBOX } from "../brand-mark";

// Tanda merek untuk gambar OG (satori tidak mengenal CSS variable): SVG warna tema gelap sebagai data URI.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}"><path fill="${MARK_COLORS.moon}" fill-rule="evenodd" d="${MARK_PATHS.moon}"/><path fill="${MARK_COLORS.wheat}" fill-rule="evenodd" d="${MARK_PATHS.wheat}"/><path fill="${MARK_COLORS.sun}" fill-rule="evenodd" d="${MARK_PATHS.sun}"/></svg>`;
export const MARK_URI = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
