import test from "node:test";
import assert from "node:assert/strict";
import { centerOut, generateSheaf, MAX_FRUITS, MAX_LEAVES, MAX_STALKS, sheafSvg, type TreeInput } from "./index.ts";

const base: TreeInput = {
  address: "0xAbC0000000000000000000000000000000000001", totalValueUsd: 12_500,
  positions: [{ id: "cMAG7", weightBps: 6000 }, { id: "sNVDA", weightBps: 4000 }], harvests: 9, streak: 4,
};
const grains = (s: ReturnType<typeof generateSheaf>) => s.stalks.reduce((a, t) => a + t.grains.length, 0);
const leaves = (s: ReturnType<typeof generateSheaf>) => s.stalks.reduce((a, t) => a + t.leaves.length, 0);

test("input sama → sheaf identik", () => assert.deepEqual(generateSheaf(base), generateSheaf({ ...base })));
test("satu tangkai per posisi, satu bulir per Harvest, 3 daun per streak", () => {
  const s = generateSheaf(base);
  assert.deepEqual(s.stalks.map((t) => t.id), ["cMAG7", "sNVDA"]);
  assert.equal(grains(s), 9);
  assert.equal(leaves(s), 12);
});
test("bulir dibagi round-robin: tangkai ke-i mendapat bulir ke-i, i+n, ...", () => {
  const s = generateSheaf({ ...base, harvests: 5 });
  assert.deepEqual(s.stalks.map((t) => t.grains.length), [3, 2]);
});
test("maks. 52 bulir terlihat, sisanya diringkas", () => {
  const s = generateSheaf({ ...base, harvests: 80 });
  assert.equal(grains(s), MAX_FRUITS);
  assert.equal(s.hiddenFruits, 28);
});
test("daun dibatasi MAX_LEAVES", () => assert.equal(leaves(generateSheaf({ ...base, streak: 200 })), MAX_LEAVES));
test("posisi di atas MAX_STALKS dihitung di hiddenCordons", () => {
  const many = Array.from({ length: MAX_STALKS + 3 }, (_, i) => ({ id: `p${i}`, weightBps: 1000 }));
  const s = generateSheaf({ ...base, positions: many });
  assert.equal(s.stalks.length, MAX_STALKS);
  assert.equal(s.hiddenCordons, 3);
});
test("tanpa posisi → satu tangkai bayangan, tanpa bulir, tidak error", () => {
  const s = generateSheaf({ ...base, positions: [] });
  assert.equal(s.stalks.length, 1);
  assert.ok(s.stalks[0].ghost);
  assert.equal(grains(s) + leaves(s), 0);
});
test("centerOut: posisi pertama di tengah, bergantian kanan-kiri", () => {
  assert.deepEqual(centerOut(1), [0]);
  assert.deepEqual(centerOut(3), [0, 1, -1]);
  assert.deepEqual(centerOut(2), [1, -1]);
  assert.equal(centerOut(7).length, 7);
});
test("posisi terbesar menghasilkan tangkai tertinggi (path berawal sama, ujung lebih tinggi)", () => {
  const s = generateSheaf({ ...base, positions: [{ id: "a", weightBps: 9000 }, { id: "b", weightBps: 1000 }] });
  const top = (d: string) => Number(d.split(" ").pop());
  assert.ok(top(s.stalks[0].d) < top(s.stalks[1].d)); // y lebih kecil = lebih tinggi
});

const pal = { stroke: "#EEE6D9", leaf: "#9CC08A", tie: "#E5642B", grain: "#D8B25E" };
test("sheafSvg: deterministik, tanpa var(--) dan tanpa <text>", () => {
  const a = sheafSvg(generateSheaf(base), pal);
  assert.equal(a, sheafSvg(generateSheaf({ ...base }), pal));
  assert.doesNotMatch(a, /var\(|<text/);
  assert.match(a, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 300 300"/);
});
test("sheafSvg: memuat semua tangkai, bulir, daun, dan dua ikatan", () => {
  const s = generateSheaf(base), svg = sheafSvg(s, pal);
  for (const t of s.stalks) assert.ok(svg.includes(`d="${t.d}"`), t.d);
  assert.equal(svg.match(/<ellipse /g)?.length ?? 0, grains(s));
  assert.equal(svg.match(/stroke="#E5642B"/g)?.length, 2);
});
