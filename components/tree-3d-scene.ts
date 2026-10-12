// Pembangun scene three.js untuk sheaf gandum 3D (menggantikan pohon espalier). Dipisah dari React supaya komponen hanya mengurus siklus hidup.
// Bahasa visual Annona: berkas tangkai menyilang di bawah dan mengipas di atas, bulir di ujung, dua pita oranye (--sun) sebagai ikatan,
// cakram matahari berarsir + cincin orbit di belakang. Bentuk berasal dari layoutSheaf3D(input), bukan angka tetap.
// Warna diambil dari token CSS (--fg, --wheat, --gain, --sun, --bg) sehingga ikut tema gelap dan terang.
import * as THREE from "three";
import { GROUND_Y, type Layout3D } from "@/lib/tree3d-layout";

type TubeObj = { mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshStandardMaterial>; total: number; rad: number };
type Anim =
  | { kind: "tube"; o: TubeObj; start: number; dur: number }
  | { kind: "pop"; o: THREE.Object3D; s: THREE.Vector3; start: number; dur: number };
type Grain = { m: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> };

export type TreeScene = { replant(): void; setReduced(v: boolean): void; dispose(): void };
export type SceneOptions = { reduced: boolean; onContextLost?: () => void; onReady?: () => void };

function mulberry(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeBack = (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (a: number, b: number, x: number) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };

const SUN_Y = -0.15, SUN_R = 2.3, SUN_Z = -0.9; // cakram matahari di belakang berkas
const SUN_PX = 512, SUN_DISC = SUN_PX / 2 / 1.55; // kanvas memuat glow (r × 1.55); jari-jari cakram dalam piksel

export function createTreeScene(host: HTMLElement, layout: Layout3D, opts: SceneOptions): TreeScene {
  const T = THREE;
  const root = document.documentElement;
  let reduced = opts.reduced;

  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); // melempar bila WebGL tidak ada: ditangani pemanggil
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%;cursor:grab;touch-action:pan-y;opacity:0;transition:opacity .5s ease";
  host.insertBefore(canvas, host.firstChild);
  // Pengait untuk tes browser (scripts/e2e-tree3d.mjs): ringkasan isi scene, dan penanda setelah frame pertama tergambar.
  host.dataset.cordons = String(layout.stalks.length);
  host.dataset.fruits = String(layout.stalks.reduce((a, s) => a + s.grains, 0)); host.dataset.treeReady = "0";

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
  const hemi = new T.HemisphereLight(0xfff1dc, 0x6b4a32, 0.9 * Math.PI); scene.add(hemi);
  const key = new T.DirectionalLight(0xffe7c4, 0.9 * Math.PI);
  key.position.set(-3.5, 5, 7); scene.add(key);
  const rim = new T.PointLight(0xe5642b, 7, 9, 1.4); rim.position.set(0.4, 0.9, -0.4); scene.add(rim); // cahaya dari cakram matahari

  const rig = new T.Group(); scene.add(rig);

  // ---- Cakram matahari: glow + isian + garis arsir bergerak (sunDisc di annona.html), digambar di kanvas 2D ----
  const sunCv = document.createElement("canvas"); sunCv.width = sunCv.height = SUN_PX;
  const sctx = sunCv.getContext("2d")!;
  const sunTex = new T.CanvasTexture(sunCv); sunTex.colorSpace = T.SRGBColorSpace;
  const sunMat = new T.MeshBasicMaterial({ map: sunTex, transparent: true, depthWrite: false, toneMapped: false });
  const sunMesh = new T.Mesh(new T.PlaneGeometry(SUN_R * 1.55 * 2, SUN_R * 1.55 * 2), sunMat);
  sunMesh.position.set(0, SUN_Y, SUN_Z); sunMesh.renderOrder = -1; rig.add(sunMesh);
  let sunCss = "#E5642B", hatchCss = "#14110F";
  function drawSun(t: number) {
    const c = SUN_PX / 2, R = SUN_DISC;
    sctx.clearRect(0, 0, SUN_PX, SUN_PX);
    const g = sctx.createRadialGradient(c, c, 0, c, c, R * 1.55);
    g.addColorStop(0, "rgba(229,100,43,.55)"); g.addColorStop(1, "rgba(229,100,43,0)");
    sctx.fillStyle = g; sctx.fillRect(0, 0, SUN_PX, SUN_PX);
    sctx.fillStyle = sunCss; sctx.beginPath(); sctx.arc(c, c, R, 0, Math.PI * 2); sctx.fill();
    sctx.save(); sctx.beginPath(); sctx.arc(c, c, R, 0, Math.PI * 2); sctx.clip();
    const gap = (8 / 68) * R, off = ((t * 8 / 2.4) % 8) / 68 * R; // 8 satuan per 2.4 dtk, sama dengan animasi .hatch
    sctx.strokeStyle = hatchCss; sctx.lineWidth = (2 / 68) * R;
    for (let y = c - R - gap * 2 + off; y < c + R + gap; y += gap) {
      const a = 0.7 * smooth(0.45, 1, (y - (c - R)) / (2 * R)); // pudar dari atas (mask gradien)
      if (a <= 0.01) continue;
      sctx.globalAlpha = a; sctx.beginPath(); sctx.moveTo(c - R, y); sctx.lineTo(c + R, y); sctx.stroke();
    }
    sctx.restore(); sctx.globalAlpha = 1;
    sunTex.needsUpdate = true;
  }

  // ---- Cincin orbit (orbits() di annona.html): cincin titik + bulir emas, dan lingkar tanda + titik oranye berputar berlawanan ----
  const orbitMats: THREE.Material[] = [];
  const orbit1 = new T.Group(), orbit2 = new T.Group();
  orbit1.position.set(0, SUN_Y, SUN_Z + 0.02); orbit2.position.set(0, SUN_Y, SUN_Z + 0.02);
  const ringPts: number[] = [];
  const R1 = SUN_R * 1.22, R2 = SUN_R * 1.42;
  for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2; ringPts.push(Math.cos(a) * R1, Math.sin(a) * R1, 0); }
  const ringGeo = new T.BufferGeometry(); ringGeo.setAttribute("position", new T.Float32BufferAttribute(ringPts, 3));
  const ringMat = new T.PointsMaterial({ size: 0.035, transparent: true, opacity: 0.45, depthWrite: false }); orbitMats.push(ringMat);
  orbit1.add(new T.Points(ringGeo, ringMat));
  const wheatDot = new T.Mesh(new T.SphereGeometry(0.055, 12, 10), new T.MeshBasicMaterial({ toneMapped: false }));
  wheatDot.position.set(R1, 0, 0); orbit1.add(wheatDot);
  const tickPts: number[] = [];
  for (let a = 0; a < 360; a += 6) { const r = (a * Math.PI) / 180, l = a % 30 === 0 ? 0.16 : 0.065; tickPts.push(Math.cos(r) * R2, Math.sin(r) * R2, 0, Math.cos(r) * (R2 + l), Math.sin(r) * (R2 + l), 0); }
  const tickGeo = new T.BufferGeometry(); tickGeo.setAttribute("position", new T.Float32BufferAttribute(tickPts, 3));
  const tickMat = new T.LineBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false }); orbitMats.push(tickMat);
  orbit2.add(new T.LineSegments(tickGeo, tickMat));
  const sunDot = new T.Mesh(new T.SphereGeometry(0.05, 12, 10), new T.MeshBasicMaterial({ toneMapped: false }));
  sunDot.position.set(0, R2, 0); orbit2.add(sunDot);
  rig.add(orbit1, orbit2);

  // ---- Sheaf ----
  const stalkMat = new T.MeshStandardMaterial({ roughness: 0.7, metalness: 0 });
  const grainMat = new T.MeshStandardMaterial({ roughness: 0.42, metalness: 0.12 });
  const leafMat = new T.MeshStandardMaterial({ roughness: 0.55, metalness: 0, side: T.DoubleSide });
  const tieMat = new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2 });

  const anim: Anim[] = [];
  const K = layout.scale;
  const rand = mulberry(layout.seed);
  const grains: Grain[] = [];
  const grainGeo = new T.SphereGeometry(1, 14, 10), leafGeo = new T.SphereGeometry(1, 12, 8);
  const awnGeo = new T.CylinderGeometry(0.0045, 0.0045, 1, 5);
  const leafScale = new T.Vector3(0.2 * K, 0.042 * K, 0.02 * K);
  const tieY = layout.tieY, n = layout.stalks.length;
  const GROW = 0.9; // jeda awal: cakram matahari muncul dulu

  layout.stalks.forEach((s, i) => {
    const h = s.height, t = s.slot, z = ((i * 5) % 7 - 3) * 0.04;
    // Sama dengan drawSheaf: pangkal sedikit menyilang, ujung mengipas lebar, lengkung melewati titik ikatan.
    const bot = new T.Vector3(-t * h * 0.12, GROUND_Y + Math.abs(t) * 0.05, z);
    const top = new T.Vector3(t * h * 0.36, GROUND_Y + h - Math.abs(t) * h * 0.16, z + t * 0.05);
    const ctrl = new T.Vector3(t * 0.12, tieY, z * 0.4); // titik kontrol di ikatan, seperti Q di drawSheaf
    const curve = new T.QuadraticBezierCurve3(bot, ctrl, top);
    const geo = new T.TubeGeometry(curve, 72, 0.042 * K, 8, false);
    const mesh = new T.Mesh(geo, stalkMat); rig.add(mesh);
    const st = GROW + i * 0.05, du = 0.9;
    anim.push({ kind: "tube", o: { mesh, total: 72, rad: 8 }, start: st, dur: du });

    // Bulir: pasangan bergantian kiri-kanan di ujung atas tangkai, masing-masing dengan sungut tipis.
    const step = Math.min(0.03, 0.24 / Math.max(s.grains, 1));
    for (let k = 0; k < s.grains; k++) {
      const u = 0.985 - k * step, p = curve.getPointAt(clamp(u, 0, 1)), tg = curve.getTangentAt(clamp(u, 0, 1));
      const side = k % 2 ? 1 : -1, a = Math.atan2(tg.y, tg.x);
      const grp = new T.Group();
      grp.position.set(p.x + -tg.y * side * 0.045 * K, p.y + tg.x * side * 0.045 * K, p.z + (k % 3) * 0.012);
      grp.rotation.z = a - Math.PI / 2 + side * 0.32;
      const gm = new T.Mesh(grainGeo, grainMat.clone()); gm.scale.set(0.058 * K, 0.14 * K, 0.054 * K); grp.add(gm);
      const awn = new T.Mesh(awnGeo, stalkMat); awn.scale.y = 0.2 * K; awn.position.y = 0.14 * K + 0.1 * K; grp.add(awn);
      grp.scale.setScalar(0.0001); rig.add(grp);
      grains.push({ m: gm });
      anim.push({ kind: "pop", o: grp, s: new T.Vector3(1, 1, 1), start: st + du * 0.7 + k * 0.04 + rand() * 0.1, dur: 0.5 });
    }
    // Daun: bilah pipih di bagian bawah tangkai, miring keluar bergantian.
    for (let k = 0; k < s.leaves; k++) {
      const u = 0.18 + (0.34 * (k + 0.5)) / s.leaves, p = curve.getPointAt(u), tg = curve.getTangentAt(u);
      const side = k % 2 ? 1 : -1, ang = Math.atan2(tg.y, tg.x) + side * 0.8;
      const m = new T.Mesh(leafGeo, leafMat);
      m.position.set(p.x + Math.cos(ang) * 0.2 * K, p.y + Math.sin(ang) * 0.2 * K, p.z + (k % 3) * 0.02 - 0.01);
      m.rotation.set(k % 2 ? 0.3 : -0.3, ((k % 3) - 1) * 0.35, ang);
      m.scale.setScalar(0.0001); rig.add(m);
      anim.push({ kind: "pop", o: m, s: leafScale, start: st + du * u * 0.9, dur: 0.5 });
    }
  });

  // Dua pita oranye pengikat (garis tebal di drawSheaf): cincin pipih mengelilingi berkas di titik ikatan.
  const tieR = 0.13 + Math.min(0.1, 0.012 * n);
  [0.04, -0.07].forEach((dy, j) => {
    const ring = new T.Mesh(new T.TorusGeometry(tieR, 0.034, 10, 36), tieMat);
    ring.position.set(0, tieY + dy, 0); ring.rotation.x = Math.PI / 2 - 0.12;
    ring.scale.setScalar(0.0001); rig.add(ring);
    anim.push({ kind: "pop", o: ring, s: new T.Vector3(1, 1, 1), start: GROW + 0.7 + n * 0.03 + j * 0.12, dur: 0.5 });
  });

  // Serbuk sari yang melayang naik (kilau emas kecil, seperti partikel hero).
  const PN = 90, pPos = new Float32Array(PN * 3), pSpd = new Float32Array(PN);
  const seedR = mulberry(7);
  for (let i = 0; i < PN; i++) { pPos[i * 3] = (seedR() - 0.5) * 8; pPos[i * 3 + 1] = (seedR() - 0.5) * 7; pPos[i * 3 + 2] = seedR() * 1.6 - 0.2; pSpd[i] = 0.08 + seedR() * 0.18; }
  const pGeo = new T.BufferGeometry(); pGeo.setAttribute("position", new T.BufferAttribute(pPos, 3));
  const dot = document.createElement("canvas"); dot.width = dot.height = 64;
  const dc = dot.getContext("2d")!, grd = dc.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.4, "rgba(255,255,255,.6)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  dc.fillStyle = grd; dc.fillRect(0, 0, 64, 64);
  const dotTex = new T.CanvasTexture(dot); dotTex.colorSpace = T.SRGBColorSpace;
  const pMat = new T.PointsMaterial({ size: 0.07, map: dotTex, transparent: true, opacity: 0.6, depthWrite: false });
  rig.add(new T.Points(pGeo, pMat));

  // Warna mengikuti tema halaman (token CSS yang sama dengan komponen SVG).
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  function themeColours() {
    const cs = getComputedStyle(root), c = (nm: string, fb = "#888888") => new T.Color(cs.getPropertyValue(nm).trim() || fb);
    const dark = isDark(), fg = c("--fg"), wheat = c("--wheat", "#D8B25E"), sun = c("--sun", "#E5642B");
    stalkMat.color = fg.clone().lerp(wheat, 0.3);
    grainMat.color = wheat; grainMat.emissive = wheat.clone().multiplyScalar(dark ? 0.12 : 0.05);
    grains.forEach((o) => { o.m.material.color = wheat; o.m.material.emissive = wheat.clone().multiplyScalar(dark ? 0.12 : 0.05); });
    leafMat.color = c("--gain", "#9CC08A");
    tieMat.color = sun; tieMat.emissive = sun.clone().multiplyScalar(0.25);
    pMat.color = wheat;
    ringMat.color = fg; tickMat.color = fg;
    ringMat.opacity = dark ? 0.45 : 0.55; tickMat.opacity = dark ? 0.3 : 0.4;
    (wheatDot.material as THREE.MeshBasicMaterial).color = wheat; (sunDot.material as THREE.MeshBasicMaterial).color = sun;
    hemi.intensity = (dark ? 0.55 : 0.95) * Math.PI; hemi.groundColor = new T.Color(dark ? 0x4a3524 : 0x9a7a58);
    key.intensity = (dark ? 0.8 : 0.9) * Math.PI;
    rim.color = sun; rim.intensity = dark ? 7 : 3.5;
    sunCss = "#" + sun.getHexString(); hatchCss = "#" + c("--bg", "#14110F").getHexString();
    drawSun(performance.now() / 1000);
    redraw();
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const k = Math.tan((16 * Math.PI) / 180);
    camera.position.set(0, 0.15, Math.max(3.95 / k, 4.15 / (k * camera.aspect)));
    camera.updateProjectionMatrix(); redraw();
  }

  // Interaksi: parallax mengikuti kursor, seret untuk memutar.
  let mx = 0, my = 0, drag = 0, dragging = false, lastX = 0;
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    mx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 0.8), -1, 1);
    my = clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 0.8), -1, 1);
    if (dragging) { drag = clamp(drag + (e.clientX - lastX) * 0.006, -1.1, 1.1); lastX = e.clientX; if (reduced) redraw(); }
  };
  const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; canvas.style.cursor = "grabbing"; };
  const onUp = () => { dragging = false; canvas.style.cursor = "grab"; };
  window.addEventListener("pointermove", onMove, { passive: true });
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  function applyGrowth(t: number) {
    sunMat.opacity = easeOut(clamp(t / GROW, 0, 1));
    for (const a of anim) {
      const p = clamp((t - a.start) / a.dur, 0, 1);
      if (a.kind === "tube") a.o.mesh.geometry.setDrawRange(0, Math.ceil(easeOut(p) * a.o.total) * a.o.rad * 6);
      else { const s = p <= 0 ? 0.0001 : easeBack(p); a.o.scale.set(a.s.x * s, a.s.y * s, a.s.z * s); }
    }
  }

  let t0 = performance.now(), last = t0, visible = true, raf = 0, shown = false, pulse: { g: Grain; s: number } | null = null, nextPulse = 5;
  const reveal = () => { if (!shown) { shown = true; canvas.style.opacity = "1"; host.dataset.treeReady = "1"; opts.onReady?.(); } };
  function frame(now: number) {
    raf = 0;
    const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    applyGrowth(t);
    if (!dragging) drag *= 0.96;
    rig.rotation.y = lerp(rig.rotation.y, mx * 0.32 + drag + Math.sin(t * 0.35) * 0.05, 0.06);
    rig.rotation.x = lerp(rig.rotation.x, my * 0.1 - 0.02, 0.06);
    rig.position.y = lerp(rig.position.y, 0.55 + Math.min(1.2, window.scrollY * 0.0012), 0.1);
    orbit1.rotation.z += (dt * Math.PI * 2) / 60; orbit2.rotation.z -= (dt * Math.PI * 2) / 90; // 60 dtk dan 90 dtk per putaran (.spin di annona.html)
    drawSun(t);
    for (let i = 0; i < PN; i++) {
      pPos[i * 3 + 1] += pSpd[i] * dt; pPos[i * 3] += Math.sin(t * 0.5 + i) * 0.0015;
      if (pPos[i * 3 + 1] > 3.6) pPos[i * 3 + 1] = -3.6;
    }
    pGeo.attributes.position.needsUpdate = true;
    // Kilau panen yang pelan pada satu bulir setiap kali.
    if (grains.length && t > nextPulse) { pulse = { g: grains[Math.floor(rand() * grains.length)], s: t }; nextPulse = t + 4.5; }
    if (pulse) {
      const k = (t - pulse.s) / 1.6;
      if (k < 1) pulse.g.m.material.emissiveIntensity = 1 + Math.sin(k * Math.PI) * 4;
      else { pulse.g.m.material.emissiveIntensity = 1; pulse = null; }
    }
    renderer.render(scene, camera); reveal();
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  // Mode reduced-motion: tanpa animasi; gambar utuh sekali, ulang hanya saat ada perubahan (resize, tema, seret).
  function redraw() {
    if (!reduced) return;
    applyGrowth(99); drawSun(0);
    rig.rotation.y = drag; rig.rotation.x = -0.02; rig.position.y = 0.55;
    renderer.render(scene, camera); reveal();
  }
  function start() { if (!reduced && visible && !document.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  themeColours(); resize();
  const ro = new ResizeObserver(resize); ro.observe(host);
  const mql = matchMedia("(prefers-color-scheme: dark)");
  const themeObs = new MutationObserver(themeColours); themeObs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  mql.addEventListener("change", themeColours);
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); }); io.observe(host);
  const onVis = () => { if (!document.hidden) start(); };
  document.addEventListener("visibilitychange", onVis);
  const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; opts.onContextLost?.(); };
  canvas.addEventListener("webglcontextlost", onLost);
  if (reduced) redraw(); else start();

  return {
    replant() { t0 = performance.now(); nextPulse = 5; pulse = null; if (reduced) redraw(); else start(); },
    setReduced(v) { if (v === reduced) return; reduced = v; if (v) { cancelAnimationFrame(raf); raf = 0; redraw(); } else { t0 = performance.now(); start(); } },
    dispose() {
      cancelAnimationFrame(raf); raf = 0; ro.disconnect(); io.disconnect(); themeObs.disconnect();
      mql.removeEventListener("change", themeColours); document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("webglcontextlost", onLost);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      dotTex.dispose(); sunTex.dispose(); renderer.dispose(); canvas.remove();
      for (const k of ["cordons", "fruits", "treeReady"]) delete host.dataset[k];
    },
  };
}
