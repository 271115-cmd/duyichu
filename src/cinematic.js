/* ============================================================
   cinematic.js — drop-in 3D cinematic scroll system
   --------------------------------------------------------
   Layers:
     • Background  : WebGL animated gradient (scroll + velocity + mouse reactive)
     • Midground   : DOM chapters with depth transitions (scale / blur / fade)
     • Foreground  : layered type + per-character reveals
   Public API:
     initCinematic({ root, lenis, sections? }) -> controller
   Degrades gracefully: if WebGL is unavailable it does nothing destructive,
   and the caller keeps the solid-colour fallback (no `.cinematic` class added).
   ============================================================ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { playWoodblock } from './sound.js';
gsap.registerPlugin(ScrollTrigger);

/* Per-theme gradient endpoints [bright, deep] */
const THEME_COLORS = {
  'theme-hero':    ['#2C77FF', '#0A3AA0'],
  'theme-history': ['#F4FF1E', '#C9D400'],
  'theme-story':   ['#8A1A2C', '#3D0A13'],
  'theme-craft':   ['#FF4283', '#B81E59'],
  'theme-arch':    ['#0B6BC0', '#063A6B'],
  'theme-contact': ['#16881E', '#0A3D06'],
};
const DEFAULT_COLORS = ['#2C77FF', '#0A3AA0'];

function colorsForChapter(ch) {
  for (const cls in THEME_COLORS) if (ch.classList.contains(cls)) return THEME_COLORS[cls];
  return DEFAULT_COLORS;
}

/* ----------------------------------------------------------
   3D MODEL SCENE — floating Chinese-dining props
   (procedural geometry; replaces the gradient background)
   ---------------------------------------------------------- */
const mat = (o) => new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.1, envMapIntensity: 0.28, roughnessMap: sharedRough(), ...o });
const phys = (o) => new THREE.MeshPhysicalMaterial({ roughness: 0.62, metalness: 0.0, envMapIntensity: 0.28, roughnessMap: sharedRough(), ...o });

/* — procedural canvas textures (CPU-cheap surface detail) — */
function canvasTex(draw, size = 256, repeat) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function bambooTex() {
  return canvasTex((x, s) => {
    x.fillStyle = '#c49a52'; x.fillRect(0, 0, s, s);
    const n = 22, w = s / n;
    for (let i = 0; i < n; i++) {
      const v = 0.72 + Math.random() * 0.5;
      x.fillStyle = `rgb(${(150 * v) | 0},${(112 * v) | 0},${(58 * v) | 0})`;
      x.fillRect(i * w, 0, w * 0.86, s);
      x.fillStyle = 'rgba(64,42,14,0.4)'; x.fillRect(i * w + w * 0.86, 0, w * 0.14, s);
    }
    x.strokeStyle = 'rgba(58,38,12,0.45)'; x.lineWidth = s * 0.014;
    [0.18, 0.5, 0.82].forEach((y) => { x.beginPath(); x.moveTo(0, y * s); x.lineTo(s, y * s); x.stroke(); });
  }, 256, [4, 1]);
}
function sealTex(ch) {
  return canvasTex((x, s) => {
    x.fillStyle = '#b30f1e'; x.fillRect(0, 0, s, s);
    x.strokeStyle = '#f4edde'; x.lineWidth = s * 0.045; x.strokeRect(s * 0.1, s * 0.1, s * 0.8, s * 0.8);
    x.fillStyle = '#f4edde'; x.font = `900 ${s * 0.6}px "Noto Serif SC", serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, s / 2, s * 0.55);
  });
}
// 乾隆通寶 — read top, bottom, right, left (Qing cash-coin convention)
const COIN_CHARS = [['乾', 0.5, 0.17], ['隆', 0.5, 0.83], ['通', 0.83, 0.5], ['寶', 0.17, 0.5]];

function coinTex() {                              // aged-bronze face with relief characters
  return canvasTex((x, s) => {
    const g = x.createRadialGradient(s * 0.4, s * 0.34, s * 0.05, s / 2, s / 2, s * 0.72);
    g.addColorStop(0, '#cda955'); g.addColorStop(0.7, '#a07d2e'); g.addColorStop(1, '#7c5e1c');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 130; i++) {              // verdigris patina mottle
      x.fillStyle = `rgba(${50 + Math.random() * 50 | 0},${75 + Math.random() * 45 | 0},${35 + Math.random() * 30 | 0},${Math.random() * 0.09})`;
      x.beginPath(); x.arc(Math.random() * s, Math.random() * s, 2 + Math.random() * 11, 0, Math.PI * 2); x.fill();
    }
    // raised outer rim
    x.strokeStyle = '#dcbe6c'; x.lineWidth = s * 0.045; x.beginPath(); x.arc(s / 2, s / 2, s * 0.44, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(60,44,14,0.55)'; x.lineWidth = s * 0.012; x.beginPath(); x.arc(s / 2, s / 2, s * 0.405, 0, Math.PI * 2); x.stroke();
    // raised square border + dark hole
    const h = s * 0.145;
    x.strokeStyle = '#dcbe6c'; x.lineWidth = s * 0.038; x.strokeRect(s / 2 - h, s / 2 - h, h * 2, h * 2);
    x.fillStyle = '#1a140a'; x.fillRect(s / 2 - h * 0.8, s / 2 - h * 0.8, h * 1.6, h * 1.6);
    // four characters in relief (engraved shadow + raised highlight)
    x.textAlign = 'center'; x.textBaseline = 'middle';
    COIN_CHARS.forEach(([ch, cx, cy]) => {
      x.font = `900 ${s * 0.21}px "Noto Serif SC", serif`;
      x.fillStyle = 'rgba(48,34,8,0.85)'; x.fillText(ch, cx * s + s * 0.006, cy * s + s * 0.006);
      x.fillStyle = '#e7cd86'; x.fillText(ch, cx * s - s * 0.004, cy * s - s * 0.004);
      x.fillStyle = '#b8923c'; x.fillText(ch, cx * s, cy * s);
    });
  });
}

function coinBump() {                             // height map: rims + chars raised, hole recessed
  return canvasTex((x, s) => {
    x.fillStyle = '#6b6b6b'; x.fillRect(0, 0, s, s);
    x.strokeStyle = '#ffffff'; x.lineWidth = s * 0.045; x.beginPath(); x.arc(s / 2, s / 2, s * 0.44, 0, Math.PI * 2); x.stroke();
    const h = s * 0.145;
    x.strokeStyle = '#ffffff'; x.lineWidth = s * 0.038; x.strokeRect(s / 2 - h, s / 2 - h, h * 2, h * 2);
    x.fillStyle = '#000000'; x.fillRect(s / 2 - h * 0.8, s / 2 - h * 0.8, h * 1.6, h * 1.6);
    x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    COIN_CHARS.forEach(([ch, cx, cy]) => { x.font = `900 ${s * 0.21}px "Noto Serif SC", serif`; x.fillText(ch, cx * s, cy * s); });
  });
}
function lanternTex() {
  return canvasTex((x, s) => {
    x.fillStyle = '#d11b27'; x.fillRect(0, 0, s, s);
    x.strokeStyle = '#e6b23a'; x.lineWidth = s * 0.03;
    for (let i = 0; i <= 10; i++) { const px = i / 10 * s; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, s); x.stroke(); }
    x.fillStyle = '#f6da82'; x.font = `900 ${s * 0.5}px "Noto Serif SC", serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('福', s / 2, s / 2);
  }, 256, [6, 1]);
}
function grainTex(size = 256, rep = 3) {          // fine grayscale noise → micro-surface bump
  return canvasTex((x, s) => {
    const img = x.getImageData(0, 0, s, s);
    for (let i = 0; i < img.data.length; i += 4) { const v = 150 + Math.random() * 105; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
  }, size, [rep, rep]);
}

// shared gentle roughness grain so gloss is never perfectly uniform (subtle)
let _rough;
function sharedRough() {
  return _rough || (_rough = canvasTex((x, s) => {
    const img = x.getImageData(0, 0, s, s);
    for (let i = 0; i < img.data.length; i += 4) { const v = 198 + Math.random() * 57; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
  }, 256, [3, 3]));
}

// subtle near-white paper mottle → multiplies a flat colour so it isn't dead-flat
function paperTex() {
  return canvasTex((x, s) => {
    x.fillStyle = '#efe9dd'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) {
      const a = 0.03 + Math.random() * 0.05;
      x.fillStyle = Math.random() < 0.5 ? `rgba(120,108,86,${a})` : `rgba(255,255,255,${a})`;
      x.beginPath(); x.arc(Math.random() * s, Math.random() * s, 6 + Math.random() * 28, 0, Math.PI * 2); x.fill();
    }
    x.strokeStyle = 'rgba(150,140,120,0.05)'; x.lineWidth = 1;
    for (let i = 0; i < 36; i++) { const yy = Math.random() * s; x.beginPath(); x.moveTo(0, yy); x.lineTo(s, yy + (Math.random() - 0.5) * 18); x.stroke(); }
  }, 256, [2, 2]);
}
const shadowed = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

function buildSteamer() {                       // 蒸笼 bamboo steamer
  const g = new THREE.Group();
  const tex = bambooTex();
  const bamboo = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.03, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  const bind = mat({ color: 0x6f4d22, roughness: 0.7 });
  const ringGeo = new THREE.CylinderGeometry(1, 1, 0.5, 64, 1, true);
  for (let i = 0; i < 2; i++) {
    const y = i * 0.54 - 0.27;
    const ring = new THREE.Mesh(ringGeo, bamboo); ring.position.y = y; g.add(ring);
    [0.23, -0.23].forEach((dy) => { const b = new THREE.Mesh(new THREE.TorusGeometry(1.012, 0.032, 12, 72), bind); b.rotation.x = Math.PI / 2; b.position.y = y + dy; g.add(b); });
  }
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.07, 0.1, 64), bamboo); lid.position.y = 0.56; g.add(lid);
  const dome = new THREE.Mesh(new THREE.ConeGeometry(1.03, 0.34, 64, 1, false), bamboo); dome.position.y = 0.76; g.add(dome);  // shallow conical lid, flush on the body
  for (let i = 0; i < 3; i++) { const r = 0.78 - i * 0.26; const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.016, 10, 64), bind); t.rotation.x = Math.PI / 2; t.position.y = 0.64 + i * 0.085; g.add(t); }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 18), bind); knob.position.y = 0.95; g.add(knob);
  return shadowed(g);
}

function buildShaomai() {                       // 烧卖 dumpling (pleated + lumpy filling)
  const g = new THREE.Group();
  const prof = [[0.03,-0.5],[0.22,-0.49],[0.34,-0.4],[0.41,-0.24],[0.42,-0.04],[0.37,0.14],[0.40,0.3],[0.46,0.42],[0.33,0.5],[0.12,0.52]];
  const geo = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), 80);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x);
    let s = 1;
    if (y > -0.12) s += (0.05 + (y + 0.12) * 0.22) * Math.sin(a * 12);   // vertical pleats
    if (y > 0.34) s += 0.05 * Math.sin(a * 26);                           // fine rim ruffle
    pos.setX(i, x * s); pos.setZ(i, z * s);
  }
  geo.computeVertexNormals();
  const dough = phys({
    color: 0xEEE4C8, map: paperTex(), roughness: 0.66, clearcoat: 0.15, clearcoatRoughness: 0.7,
    sheen: 0.8, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xfff3d8),
    transmission: 0.16, thickness: 0.7, ior: 1.36,             // translucent steamed dough
    bumpMap: grainTex(256, 4), bumpScale: 0.012,
  });
  g.add(new THREE.Mesh(geo, dough));
  const fGeo = new THREE.IcosahedronGeometry(0.21, 4); const fp = fGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) { const v = new THREE.Vector3(fp.getX(i), fp.getY(i), fp.getZ(i)); v.multiplyScalar(1 + 0.2 * Math.sin(v.x * 13) * Math.sin(v.y * 13) * Math.sin(v.z * 13)); fp.setXYZ(i, v.x, v.y, v.z); }
  fGeo.computeVertexNormals();
  const fill = new THREE.Mesh(fGeo, phys({ color: 0xD9602F, map: paperTex(), roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.5, bumpMap: grainTex(128, 2), bumpScale: 0.025 }));
  fill.position.y = 0.46; fill.scale.y = 0.7; g.add(fill);
  return shadowed(g);
}

function buildLantern() {                        // 灯笼 red lantern
  const g = new THREE.Group();
  const prof = [[0.0,0.54],[0.2,0.48],[0.38,0.28],[0.46,0.05],[0.46,-0.05],[0.38,-0.28],[0.2,-0.48],[0.0,-0.54]];
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), 48),
    new THREE.MeshPhysicalMaterial({ map: lanternTex(), roughnessMap: sharedRough(), emissive: 0xc8121f, emissiveIntensity: 0.5, roughness: 0.58, clearcoat: 0.22, clearcoatRoughness: 0.6, transmission: 0.28, thickness: 0.5, ior: 1.3, envMapIntensity: 0.3 }));
  g.add(body);
  const gold = mat({ color: 0xE6B23A, metalness: 0.55, roughness: 0.5 });
  const capT = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 24), gold); capT.position.y = 0.56; g.add(capT);
  const capB = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.12, 24), gold); capB.position.y = -0.56; g.add(capB);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 8), gold); rod.position.y = -0.7; g.add(rod);
  const fringe = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 18, 1, true), mat({ color: 0xC01018, roughness: 0.6, side: THREE.DoubleSide })); fringe.position.y = -0.92; g.add(fringe);
  g.add(new THREE.PointLight(0xff5a3c, 2.5, 4, 2));
  return shadowed(g);
}

function buildCoin() {                           // 铜钱 coin (ring + square hole)
  const shape = new THREE.Shape(); shape.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); const h = 0.15;
  hole.moveTo(-h, -h); hole.lineTo(h, -h); hole.lineTo(h, h); hole.lineTo(-h, h); hole.lineTo(-h, -h);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 3, curveSegments: 56 });
  geo.center();
  // ExtrudeGeometry's default cap UVs are raw vertex coords (−0.5…0.5), so only a
  // quadrant of the texture lands on the face. Remap every vertex's UV to a centred
  // 0–1 range by its (x,y) so the full 乾隆通寶 face texture maps cleanly.
  geo.computeBoundingBox();
  const bb = geo.boundingBox, sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y;
  const pos = geo.attributes.position, uvA = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uvA.setXY(i, (pos.getX(i) - bb.min.x) / sx, (pos.getY(i) - bb.min.y) / sy);
  uvA.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({ map: coinTex(), bumpMap: coinBump(), bumpScale: 0.06, roughnessMap: sharedRough(), color: 0xC9A24E, metalness: 0.6, roughness: 0.5, envMapIntensity: 0.32 });
  const coin = new THREE.Mesh(geo, m);
  // ExtrudeGeometry caps lie in the XY plane (normals ±Z) → natural orientation already
  // faces the camera so the 乾隆通寶 engraving reads. A small tilt adds dimensionality.
  coin.rotation.x = -0.12;
  return shadowed(coin);
}

function buildSeal() {                           // 印章 carved seal
  const g = new THREE.Group();
  const lac = phys({ color: 0xCE1126, map: paperTex(), roughness: 0.5, clearcoat: 0.28, clearcoatRoughness: 0.5 });
  const face = new THREE.MeshPhysicalMaterial({ map: sealTex('都'), roughnessMap: sharedRough(), roughness: 0.6, clearcoat: 0.12, envMapIntensity: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.0, 0.42), [lac, lac, lac, lac, face, face]); g.add(body);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.46), mat({ color: 0xE6B23A, metalness: 0.55, roughness: 0.5 })); band.position.y = 0.36; g.add(band);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.34, 24), lac); knob.position.y = 0.66; g.add(knob);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 18), lac); ball.position.y = 0.84; g.add(ball);
  return shadowed(g);
}

const BUILDERS = { steamer: buildSteamer, shaomai: buildShaomai, lantern: buildLantern, seal: buildSeal, coin: buildCoin };
const ALL_PROPS = ['steamer', 'shaomai', 'lantern', 'seal', 'coin'];
// per-prop scale so each reads at a similar on-screen size
const HERO_SCALE = { steamer: 1.0, shaomai: 1.9, lantern: 1.45, seal: 1.5, coin: 1.9 };

// four background slots — filled with the four props that AREN'T the page's hero,
// so all five distinct props are on screen with no repeats.
const ACCENT_SLOTS = [
  { pos: [-3.9, 1.7, -3.0],  s: 0.5,  spin: 1.0 },
  { pos: [3.7, 1.9, -3.6],   s: 0.45, spin: 0.4 },
  { pos: [-3.5, -1.7, -3.2], s: 0.5,  spin: 0.25 },
  { pos: [3.5, -1.9, -3.4],  s: 0.45, spin: 0.15 },
];

class CinematicBG {
  constructor(heroName = 'shaomai') {
    this.ok = false; this.heroName = heroName;
    const canvas = document.createElement('canvas');
    canvas.id = 'cinematic-bg';
    document.body.insertBefore(canvas, document.body.firstChild);
    this.canvas = canvas;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    } catch (e) { return; }
    // Pause this layer on GPU context loss (this is the 2nd live WebGL context on
    // the page); preventDefault lets the browser restore it rather than blanking.
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ok = false; console.warn('[duyichu] cinematic WebGL context lost'); }, false);
    canvas.addEventListener('webglcontextrestored', () => { this.ok = true; }, false);
    this.renderer.setClearColor(0x000000, 0);                 // transparent → props can float over the DOM
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    // No shadow map / no hard sun — soft even lighting keeps the props matte.

    // Flat colour layer behind the (transparent) prop canvas
    this.bgEl = document.createElement('div');
    this.bgEl.id = 'scene-bg';
    document.body.insertBefore(this.bgEl, document.body.firstChild);

    this.scene = new THREE.Scene();
    this.bgColor = new THREE.Color(DEFAULT_COLORS[0]);
    this.targetBg = new THREE.Color(DEFAULT_COLORS[0]);
    this.scene.fog = new THREE.Fog(this.bgColor, 9, 24);       // (no scene.background — canvas stays transparent)

    // Heavily blurred env (just enough so metals aren't black) — no mirror reflections.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.6).texture;

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0, 8.5);

    // Soft, diffuse, even illumination — matte, no specular hotspots
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x6b5640, 1.8));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const soft = new THREE.DirectionalLight(0xffffff, 0.6); soft.position.set(3, 6, 5); this.scene.add(soft);
    this.lights = [];
    [['#FF1EC7', [-5, 2, 3]], ['#F4FF1E', [5, -1, 4]], ['#2C77FF', [0, 4, -2]]].forEach(([c, p]) => {
      const l = new THREE.PointLight(new THREE.Color(c), 7, 26, 2); l.position.set(p[0], p[1], p[2]);
      this.scene.add(l); this.lights.push(l);
    });

    this.props = new THREE.Group(); this.scene.add(this.props);
    const wrap = (inner, pos, s, spin) => {   // wrapper group preserves each prop's built orientation
      const m = new THREE.Group(); m.add(inner);
      m.position.set(pos[0], pos[1], pos[2]); m.scale.setScalar(s);
      m.userData = { spin, bob: Math.random() * 6.28, baseY: pos[1] };
      this.props.add(m); return m;
    };
    // featured HERO prop for this page (front + centre, large)
    this.hero = wrap((BUILDERS[heroName] || buildShaomai)(), [0, -0.7, 1.2], HERO_SCALE[heroName] || 1.5, 0.3);
    // background props = the four props that aren't the hero (no repeats, all 5 shown)
    const accentProps = ALL_PROPS.filter((p) => p !== heroName);
    ACCENT_SLOTS.forEach((slot, i) => {
      const p = accentProps[i % accentProps.length];
      wrap(BUILDERS[p](), slot.pos, slot.s * (HERO_SCALE[p] || 1.4), slot.spin);
    });

    // ZOOM-IN intro on page enter: camera dollies in while the hero prop pops up
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.from(this.camera.position, { z: '+=9', duration: 1.8, ease: 'power3.out' });
      gsap.from(this.hero.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 1.3, ease: 'back.out(1.5)', delay: 0.15 });
    }

    this.clock = new THREE.Clock();
    this._running = false; this._scroll = 0; this._vel = 0;
    this._mx = 0; this._my = 0; this._tmx = 0; this._tmy = 0;
    this.resize = this.resize.bind(this); this._tick = this._tick.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.stop(); else this.start(); });
    this.ok = true;
  }
  resize() {
    if (!this.renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  setColors(a) { this.targetBg.set(a); }
  snapColors(a) {
    this.targetBg.set(a); this.bgColor.set(a);
    if (this.scene.fog) this.scene.fog.color.copy(this.bgColor);
    if (this.bgEl) this.bgEl.style.backgroundColor = '#' + this.bgColor.getHexString();
    if (this.ok) this.renderer.render(this.scene, this.camera);
  }
  setScroll(progress, velocity) { this._scroll = progress; this._vel = velocity; }
  setMouse(x, y) { this._tmx = x - 0.5; this._tmy = y - 0.5; }
  start() { if (this.ok && !this._running) { this._running = true; this.clock.start(); this._raf = requestAnimationFrame(this._tick); } }
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); }
  _tick() {
    if (!this._running) return;
    const t = this.clock.getElapsedTime();
    this.bgColor.lerp(this.targetBg, 0.04);
    if (this.scene.fog) this.scene.fog.color.copy(this.bgColor);
    if (this.bgEl) this.bgEl.style.backgroundColor = '#' + this.bgColor.getHexString();
    this._mx += (this._tmx - this._mx) * 0.06; this._my += (this._tmy - this._my) * 0.06;

    this.props.children.forEach((m) => {
      if (m === this.hero) return;                  // hero handled separately below
      m.rotation.y += m.userData.spin * 0.006;
      m.rotation.x = Math.sin(t * 0.4 + m.userData.bob) * 0.12;
      m.position.y = m.userData.baseY + Math.sin(t * 0.6 + m.userData.bob) * 0.2;
    });
    // Hero prop follows the cursor (buttermax-style) with a gentle idle drift
    if (this.hero) {
      this.hero.rotation.y = this._mx * 0.85 + Math.sin(t * 0.3) * 0.18;   // gentle wobble, stays facing forward
      this.hero.rotation.x = -this._my * 0.55 + Math.sin(t * 0.45) * 0.05;
      this.hero.position.x = 0 + this._mx * 0.7;
      this.hero.position.y = -0.7 + this._my * 0.5 + Math.sin(t * 0.6) * 0.12;
    }
    this.lights.forEach((l, i) => { const a = t * 0.3 + i * 2.1; l.position.x = Math.cos(a) * 5; l.position.z = Math.sin(a) * 5 + 1; });

    // Push the whole prop cluster back into the distance as the page scrolls away from the hero
    this.props.position.z = -this._scroll * 7;
    this.camera.position.x = this._mx * 1.6;
    this.camera.position.y = -this._my * 1.1 - this._scroll * 0.5;
    this.props.rotation.y = this._scroll * 0.5;
    this.camera.lookAt(0, -this._scroll * 0.4, 0);
    if (this.ok) this.renderer.render(this.scene, this.camera);   // skip while context is lost; loop stays alive to resume on restore
    this._raf = requestAnimationFrame(this._tick);
  }
  dispose() { this.stop(); window.removeEventListener('resize', this.resize); this.renderer?.dispose(); this.canvas?.remove(); }
}

/* ----------------------------------------------------------
   Per-character reveal (preserves <br>/<em>, handles CJK)
   ---------------------------------------------------------- */
const isCJK = (ch) => /[　-ヿ㐀-鿿豈-﫿]/.test(ch);

function splitChars(el) {
  if (el.dataset.split === 'done') return [...el.querySelectorAll('.c-char')];
  const chars = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        let word = null;   // Latin runs group into an unbreakable word; CJK wraps per character
        for (const ch of [...child.textContent]) {
          if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); word = null; continue; }
          const span = document.createElement('span');
          span.className = 'c-char';
          span.style.display = 'inline-block';
          span.textContent = ch;
          if (isCJK(ch)) {
            frag.appendChild(span); word = null;
          } else {
            if (!word) {
              word = document.createElement('span');
              word.className = 'c-word';
              word.style.display = 'inline-block';
              frag.appendChild(word);
            }
            word.appendChild(span);
          }
          chars.push(span);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  el.dataset.split = 'done';
  return chars;
}

/* ----------------------------------------------------------
   Orchestrator
   ---------------------------------------------------------- */
/* Film-grain overlay — a STATIC grain that drifts almost imperceptibly (CSS).
   The scene shows through it; motion is only noticeable on very close inspection. */
function startFilmGrain() {
  if (document.getElementById('film-grain')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'film-grain';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const render = () => {
    canvas.width = Math.max(2, Math.ceil(window.innerWidth / 2));
    canvas.height = Math.max(2, Math.ceil(window.innerHeight / 2));
    const img = ctx.createImageData(canvas.width, canvas.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = (74 + Math.random() * 108) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }  // softer mid-range grain
    ctx.putImageData(img, 0, 0);
  };
  render();
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(render, 200); });
}

export function initCinematic({ root = document, lenis, sections = '.chapter', hero = 'shaomai' } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Capability gate: the home already runs the GLB model (and, when keyed, the
  // Amap map). On a very constrained device, skip this SECOND WebGL/prop context
  // — three concurrent GPU contexts risk context loss — and let the flat
  // colour-block chapters stand (the same path as no-WebGL).
  const conn = navigator.connection || navigator.webkitConnection;
  const weakDevice = (navigator.deviceMemory && navigator.deviceMemory <= 2)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
    || (conn && conn.saveData);
  if (weakDevice) { console.info('[duyichu] constrained device — skipping the cinematic prop layer'); return { ok: false }; }
  startFilmGrain();
  const bg = new CinematicBG(hero);
  if (!bg.ok) return { ok: false };          // no WebGL → caller keeps solid fallback
  bg.start();
  document.documentElement.classList.add('cinematic');

  const chapters = [...root.querySelectorAll(sections)];

  /* — Background colour follows the chapter at viewport centre — */
  chapters.forEach((ch) => {
    const [a, b] = colorsForChapter(ch);
    ScrollTrigger.create({
      trigger: ch, start: 'top center', end: 'bottom center',
      onToggle: (self) => { if (self.isActive) bg.setColors(a, b); },
    });
  });
  if (chapters[0]) { const [a, b] = colorsForChapter(chapters[0]); bg.snapColors(a, b); }

  /* — Scroll drives the prop depth (and, on the home hero, foreground props) — */
  const isHome = !!document.querySelector('[data-barba-namespace="home"]');
  const onScroll = () => {
    const heroP = Math.min(1, window.scrollY / window.innerHeight);   // 0 at hero, 1 once scrolled a screen
    bg.setScroll(heroP, 0);
    // Foreground props only on the home hero; sub-pages keep props in the background.
    document.documentElement.classList.toggle('props-front', isHome && window.scrollY < window.innerHeight * 0.5);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  if (lenis) lenis.on('scroll', onScroll);
  onScroll();

  /* — Mouse light — */
  window.addEventListener('mousemove', (e) => bg.setMouse(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight));

  if (reduced) return { ok: true, bg };

  /* — Depth transitions: each chapter recedes (scale + fade) as it leaves the
       viewport centre and advances as it returns. One timeline per chapter,
       plain opacity with a visible floor (never visibility:hidden) so content
       can't get trapped invisible if scrub timing is imperfect. — */
  /* — Layered section transitions (the Apple-product-page feel):
       each chapter is its own plane. It rises into place as it enters,
       then recedes — smaller, dimmer, drifting up — while the next
       section arrives over it. Asymmetric in/out values make the two
       planes read as separate layers rather than one crossfade. — */
  chapters.forEach((ch, i) => {
    if (ch.classList.contains('map-chapter') || ch.classList.contains('reel-chapter')) return;   // pinned by ScrollTrigger — leave it be
    const first = i === 0;
    gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } })
      .fromTo(ch,
        { opacity: first ? 1 : 0.15, scale: first ? 1 : 0.92, yPercent: first ? 0 : 8 },
        { opacity: 1, scale: 1, yPercent: 0, ease: 'power2.out', duration: 0.5 })
      .to(ch, { opacity: 0.2, scale: 0.95, yPercent: -5, ease: 'power1.in', duration: 0.5 });
  });

  /* — Section snap: when scrolling settles near a chapter boundary, the
       page eases onto it — sections feel like discrete screens, not one
       long scroll. Proximity-based (never hijacks mid-section reading),
       desktop only, and inert inside pinned regions. — */
  // Section-snap is for the home editorial's discrete full-screen chapters only.
  // On sub-pages (varying-height content + the full-screen map) it yanks things
  // out of place, so it's gated to home.
  if (isHome && lenis && window.matchMedia('(min-width: 769px)').matches) {
    let idleTimer, lastSnap = null;
    const trySnap = () => {
      if (Math.abs(lenis.velocity) > 0.2) return;
      const y = window.scrollY;
      let best = null, bestDist = window.innerHeight * 0.45;
      for (const ch of chapters) {
        if (ch.classList.contains('map-chapter') || ch.classList.contains('reel-chapter')) continue;  // pinned — don't snap
        const top = ch.getBoundingClientRect().top + y;
        const d = Math.abs(top - y);
        if (d > 4 && d < bestDist) { bestDist = d; best = top; }
      }
      if (best !== null) {
        if (Math.abs((lastSnap ?? -1e9) - best) > 8) { playWoodblock(); lastSnap = best; }   // a felt 'click into place' on a NEW chapter only
        lenis.scrollTo(best, { duration: 0.85, easing: (t) => 1 - Math.pow(1 - t, 3) });
      }
    };
    lenis.on('scroll', () => { clearTimeout(idleTimer); idleTimer = setTimeout(trySnap, 180); });
  }

  /* — Per-character reveals for big titles — */
  root.querySelectorAll('.block-title, .block-display').forEach((title) => {
    const chars = splitChars(title);
    gsap.from(chars, {
      yPercent: 120, opacity: 0, rotateX: -80, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.025,
      scrollTrigger: { trigger: title, start: 'top 85%', once: true },
    });
  });

  /* — Velocity skew for marquees — */
  if (lenis) {
    const setters = gsap.utils.toArray(root.querySelectorAll('.marquee-track'))
      .map((el) => gsap.quickTo(el, 'skewX', { duration: 0.5, ease: 'power3' }));
    lenis.on('scroll', () => {
      const sk = gsap.utils.clamp(-12, 12, lenis.velocity * 0.6);
      setters.forEach((s) => s(sk));
    });
  }

  /* — Motion texture: a fine hatch that only surfaces while the page is
       travelling. At rest it's invisible; the faster you scroll the more it
       blooms (and drifts), so movement between sections gains a tactile,
       layered grain without ever obscuring the content beneath. — */
  if (lenis && !reduced) {
    let tex = document.getElementById('scroll-tex');
    if (!tex) { tex = document.createElement('div'); tex.id = 'scroll-tex'; document.body.appendChild(tex); }
    const setOpacity = gsap.quickTo(tex, 'opacity', { duration: 0.4, ease: 'power2' });
    let shift = 0;
    lenis.on('scroll', () => {
      const v = Math.abs(lenis.velocity);
      setOpacity(gsap.utils.clamp(0, 0.16, v * 0.012));
      shift = (shift + lenis.velocity * 0.15) % 14;
      tex.style.backgroundPosition = `0 ${shift.toFixed(1)}px`;
    });
  }

  ScrollTrigger.refresh();
  return { ok: true, bg };
}
