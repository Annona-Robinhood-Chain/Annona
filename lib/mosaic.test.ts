import test from "node:test";
import assert from "node:assert/strict";
import { generateMosaic, mosaicSvg } from "./mosaic.ts";

const A = "0x" + "a".repeat(40);

test("mosaic: alamat sama menghasilkan gambar sama, alamat lain berbeda", () => {
  assert.deepEqual(generateMosaic(A), generateMosaic(A));
  assert.notDeepEqual(generateMosaic(A).tiles, generateMosaic("0x" + "b".repeat(40)).tiles);
});
test("mosaic: positions dan measures memaksa jumlah pita dan ubin emas", () => {
  const m = generateMosaic(A, { positions: 3, measures: 10 });
  assert.equal(m.positions, 3);
  assert.equal(m.measures, 10);
  assert.equal(m.tiles.filter((t) => t.fill === "#D8B25E").length, 10);
});
test("mosaic: override dibatasi (1-5 pita, ubin emas tidak melebihi tepi)", () => {
  assert.equal(generateMosaic(A, { positions: 0 }).positions, 1);
  assert.equal(generateMosaic(A, { positions: 99 }).positions, 5);
  assert.equal(generateMosaic(A, { measures: 999 }).measures, 2 * (20 + 14) - 4);
  assert.equal(generateMosaic(A, { measures: -4 }).measures, 0);
});
test("mosaic: override tidak mengubah ubin yang bukan emas pada pita yang sama", () => {
  const base = generateMosaic(A), over = generateMosaic(A, { positions: base.positions, measures: base.measures });
  assert.deepEqual(over.tiles, base.tiles);
});
test("mosaicSvg: string SVG mandiri dengan satu rect per ubin", () => {
  const m = generateMosaic(A), svg = mosaicSvg(m);
  assert.match(svg, /^<svg xmlns=/);
  assert.equal(svg.match(/<rect /g)?.length, m.tiles.length + 1);
});
