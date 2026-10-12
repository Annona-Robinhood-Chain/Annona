import test from "node:test";
import assert from "node:assert/strict";
import { generateSheaf, type TreeInput } from "./tree/index.ts";
import { GROUND_Y, layoutSheaf3D, MAX_CORDONS_3D, STALK_MIN, STALK_SPAN } from "./tree3d-layout.ts";

const base: TreeInput = {
  address: "0x0000000000000000000000000000000000000003", totalValueUsd: 1_000_000, harvests: 14, streak: 5,
  positions: [{ id: "cMAG7", weightBps: 5500 }, { id: "sNVDA", weightBps: 3000 }, { id: "gNVDA", weightBps: 1500 }],
};
const many = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, weightBps: 1000 + i }));

test("satu tangkai per posisi; posisi pertama di tengah, lalu kanan-kiri", () => {
  const l = layoutSheaf3D(base);
  assert.deepEqual(l.stalks.map((s) => s.id), ["cMAG7", "sNVDA", "gNVDA"]);
  assert.deepEqual(l.stalks.map((s) => s.slot), [0, 1, -1]);
});

test("jumlah bulir dan daun sama dengan sheaf SVG dan tidak melebihi Harvest", () => {
  const l = layoutSheaf3D(base), svg = generateSheaf(base);
  assert.deepEqual(l.stalks.map((s) => s.grains), svg.stalks.map((s) => s.grains.length));
  assert.deepEqual(l.stalks.map((s) => s.leaves), svg.stalks.map((s) => s.leaves.length));
  assert.equal(l.stalks.reduce((a, s) => a + s.grains, 0), 14);
});

test("bulir dibatasi MAX_FRUITS dan sisanya dihitung tersembunyi", () => {
  const l = layoutSheaf3D({ ...base, harvests: 80 });
  assert.equal(l.stalks.reduce((a, s) => a + s.grains, 0), 52);
  assert.equal(l.hiddenFruits, 28);
});

test("tangkai tertinggi untuk bobot terbesar; tinggi dalam batas", () => {
  const l = layoutSheaf3D(base);
  assert.ok(l.stalks[0].height > l.stalks[1].height && l.stalks[1].height > l.stalks[2].height);
  for (const s of l.stalks) assert.ok(s.height >= STALK_MIN && s.height <= STALK_MIN + STALK_SPAN + 1e-9);
  assert.ok(GROUND_Y + STALK_MIN + STALK_SPAN < 2); // ujung tertinggi tetap di dalam bingkai kamera
});

test("tanpa posisi: tidak ada tangkai dan tidak error", () => {
  const l = layoutSheaf3D({ ...base, positions: [] });
  assert.equal(l.stalks.length, 0);
  assert.equal(l.hiddenCordons, 0);
});

test("lebih dari 8 posisi digambar: satu tangkai per posisi sampai MAX_CORDONS_3D, bulir tidak hilang", () => {
  for (const n of [9, 12, 17, MAX_CORDONS_3D]) {
    const l = layoutSheaf3D({ ...base, positions: many(n) });
    assert.equal(l.stalks.length, n, `n=${n}`);
    assert.equal(l.hiddenCordons, 0);
    assert.equal(l.stalks.reduce((a, s) => a + s.grains, 0), 14);
  }
});

test("posisi di atas MAX_CORDONS_3D dihitung di hiddenCordons, bukan hilang diam-diam", () => {
  const l = layoutSheaf3D({ ...base, positions: many(MAX_CORDONS_3D + 5) });
  assert.equal(l.stalks.length, MAX_CORDONS_3D);
  assert.equal(l.hiddenCordons, 5);
});

test("skala 1 sampai 8 tangkai, mengecil sesudahnya tetapi tidak di bawah 0.55", () => {
  assert.equal(layoutSheaf3D({ ...base, positions: many(8) }).scale, 1);
  const s20 = layoutSheaf3D({ ...base, positions: many(20) }).scale;
  assert.ok(s20 < 1 && s20 >= 0.55);
  assert.equal(layoutSheaf3D({ ...base, positions: many(MAX_CORDONS_3D) }).scale >= 0.55, true);
});

test("deterministik", () => {
  assert.deepEqual(layoutSheaf3D(base), layoutSheaf3D(base));
});
