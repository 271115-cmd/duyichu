/* ============================================================
   locations.js — the three Duyichu houses, drawn from scratch
   ------------------------------------------------------------
   A fully self-contained vector map: NO tile server, NO API key,
   NO external request — so it renders identically inside mainland
   China and anywhere else. The three branches are plotted in their
   true relative geometry (equirectangular projection from WGS84),
   over a stylised central Beijing: the central axis 中轴线, a couple
   of abstracted ring roads, a constellation joining the houses.

   API (unchanged, so main.js doesn't care how it's drawn):
     initLocationsMap({ container })
       → { map, branches, focus(i), overview(), setProgress(p), resize() }
   ============================================================ */

import { t } from './i18n.js';
import { playPluck } from './sound.js';

const SVGNS = 'http://www.w3.org/2000/svg';

export const BRANCHES = [
  { id: 'qianmen',     cn: '前门店',   en: '36 Qianmen St · Since 1738',  addr: '前门大街 36 号',          lng: 116.39204, lat: 39.89473 },
  { id: 'yongdingmen', cn: '永定门店', en: 'Yongdingmen Inner East St',   addr: '永定门内东街中里 15 号',  lng: 116.3955,  lat: 39.8718  },
  { id: 'fangzhuang',  cn: '方庄店',   en: 'Fangzhuang · Pufang Rd',      addr: '蒲芳路 1-6 号',           lng: 116.43067, lat: 39.8647  },
];

// landmarks used only to draw geography (not plotted as markers)
const AXIS_N = { lng: 116.3912, lat: 39.9087 };   // 正阳门 / Tiananmen (axis, north)
const AXIS_S = { lng: 116.3911, lat: 39.8711 };   // 永定门 gate (axis, south)

const VBW = 1000;                                  // viewBox width (height derived)
const PAD = 90;                                    // padding in viewBox units
const LAT0 = 39.88;                                // reference latitude for x-scaling

export function initLocationsMap({ container } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* — project every point to metres, then fit to the viewBox — */
  const cosLat = Math.cos((LAT0 * Math.PI) / 180);
  const toM = (p) => ({ x: p.lng * 111320 * cosLat, y: -p.lat * 110540 });
  const all = [...BRANCHES, AXIS_N, AXIS_S].map(toM);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const m of all) { minX = Math.min(minX, m.x); maxX = Math.max(maxX, m.x); minY = Math.min(minY, m.y); maxY = Math.max(maxY, m.y); }
  const spanX = maxX - minX, spanY = maxY - minY;
  const s = (VBW - PAD * 2) / spanX;
  const VBH = spanY * s + PAD * 2;
  const project = (p) => { const m = toM(p); return { x: (m.x - minX) * s + PAD, y: (m.y - minY) * s + PAD }; };

  const pB = BRANCHES.map(project);
  const pN = project(AXIS_N), pS = project(AXIS_S);

  /* — build the SVG — */
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'loc-svg');
  svg.setAttribute('viewBox', `0 0 ${VBW.toFixed(1)} ${VBH.toFixed(1)}`);
  // "meet" letterboxes the (portrait) map inside landscape screens so every
  // branch stays visible at overview; the margins show the panel gradient.
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  // text alternative so screen-reader users get the map's content, not silence
  svg.setAttribute('role', 'img');
  const titEl = document.createElementNS(SVGNS, 'title');
  titEl.textContent = 'Map of the three 都一处 Duyichu houses in Beijing';
  const descEl = document.createElementNS(SVGNS, 'desc');
  descEl.textContent = 'Three Duyichu restaurants in central Beijing: '
    + BRANCHES.map((b, i) => `${i + 1}. ${b.en}`).join('; ') + '.';
  svg.appendChild(titEl); svg.appendChild(descEl);

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  };

  // backdrop + grid (echoes the .arch-grid blueprint look)
  el('rect', { x: 0, y: 0, width: VBW, height: VBH, class: 'loc-bg' });
  const grid = el('g', { class: 'loc-grid' });
  for (let gx = 0; gx <= VBW; gx += 60) el('line', { x1: gx, y1: 0, x2: gx, y2: VBH }, grid);
  for (let gy = 0; gy <= VBH; gy += 60) el('line', { x1: 0, y1: gy, x2: VBW, y2: gy }, grid);

  // abstracted ring roads — concentric rounded rings around the old-city centre
  const cx = pN.x, cy = (pN.y + pS.y) / 2;
  [1.0, 1.6].forEach((k) => el('ellipse', { cx, cy, rx: (VBW * 0.26) * k, ry: (VBH * 0.34) * k, class: 'loc-ring' }));

  // the central axis 中轴线 — the spine of Beijing, north→south through Qianmen
  el('line', { x1: pN.x, y1: pN.y - 30, x2: pS.x, y2: pS.y + 30, class: 'loc-axis' });
  el('text', { x: pN.x + 10, y: pN.y - 14, class: 'loc-axis-label' }).textContent = '中轴线 · CENTRAL AXIS';

  // constellation joining the three houses
  const dpath = pB.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  el('path', { d: dpath, class: 'loc-link' });

  // markers (numbered dot + CN label + EN sublabel + hover address)
  const markerGroups = BRANCHES.map((b, i) => {
    const p = pB[i];
    const g = el('g', { class: 'loc-mk', 'data-loc': i, transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`, tabindex: '0', role: 'button' });
    el('circle', { r: 26, class: 'loc-halo' }, g);
    el('circle', { r: 13, class: 'loc-dot' }, g);
    el('text', { y: 5, class: 'loc-num' }, g).textContent = String(i + 1);
    g._name = el('text', { x: 22, y: -4, class: 'loc-cn' }, g);
    g._sub  = el('text', { x: 22, y: 16, class: 'loc-sub' }, g);
    const tip = el('g', { class: 'loc-tip' }, g);
    const tw = 250, th = 30;
    el('rect', { x: 22, y: 26, width: tw, height: th, rx: 5, class: 'loc-tip-bg' }, tip);
    g._tip = el('text', { x: 34, y: 46, class: 'loc-tip-tx' }, tip);
    return g;
  });

  // marker labels follow the chosen language (loc.N.name / .desc)
  function relabel() {
    markerGroups.forEach((g, i) => {
      const name = t(`loc.${i + 1}.name`), desc = t(`loc.${i + 1}.desc`);
      g._name.textContent = name;
      g._sub.textContent = desc;
      g._tip.textContent = `都一处 · ${name}`;
      g.setAttribute('aria-label', `${name} — ${desc}`);
    });
  }
  relabel();
  document.addEventListener('langchange', relabel);

  // compass + scale bar (1 km), drawn in projected units
  const km = 1000 * s;
  const sb = el('g', { class: 'loc-scale', transform: `translate(${PAD} ${VBH - 36})` });
  el('line', { x1: 0, y1: 0, x2: km, y2: 0, class: 'loc-scale-line' }, sb);
  el('line', { x1: 0, y1: -5, x2: 0, y2: 5, class: 'loc-scale-line' }, sb);
  el('line', { x1: km, y1: -5, x2: km, y2: 5, class: 'loc-scale-line' }, sb);
  el('text', { x: km / 2, y: -10, class: 'loc-scale-tx' }, sb).textContent = '1 KM';
  const comp = el('g', { class: 'loc-compass', transform: `translate(${VBW - PAD} ${PAD})` });
  el('line', { x1: 0, y1: 18, x2: 0, y2: -18, class: 'loc-scale-line' }, comp);
  el('path', { d: 'M0 -22 L5 -12 L-5 -12 Z', class: 'loc-north' }, comp);
  el('text', { x: 0, y: -28, class: 'loc-scale-tx' }, comp).textContent = 'N';

  container.appendChild(svg);

  /* — viewBox tween (rAF lerp; no gsap dependency) — */
  const full = { x: 0, y: 0, w: VBW, h: VBH };
  const cur = { ...full };
  let target = { ...full };
  let raf = null;
  const apply = () => svg.setAttribute('viewBox', `${cur.x.toFixed(1)} ${cur.y.toFixed(1)} ${cur.w.toFixed(1)} ${cur.h.toFixed(1)}`);
  const tick = () => {
    let moving = false;
    for (const k of ['x', 'y', 'w', 'h']) {
      cur[k] += (target[k] - cur[k]) * 0.12;
      if (Math.abs(target[k] - cur[k]) > 0.4) moving = true;
    }
    apply();
    raf = moving ? requestAnimationFrame(tick) : null;
  };
  const animateTo = (t) => {
    target = t;
    if (reduced) { Object.assign(cur, t); apply(); return; }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  let active = -1;
  const setActive = (i) => {
    if (i !== active && i >= 0) playPluck(i);          // each house its own warm plucked note
    active = i;
    markerGroups.forEach((g, j) => g.classList.toggle('active', j === i));
    document.querySelectorAll('.loc-card').forEach((c, j) => c.classList.toggle('active', j === i));
  };

  function focus(i) {
    const p = pB[i];
    const w = VBW * 0.62, h = w * (VBH / VBW);
    animateTo({ x: p.x - w / 2, y: p.y - h / 2, w, h });
    setActive(i);
  }
  function overview() { animateTo({ ...full }); setActive(-1); }

  // scroll tour: overview while the frame opens, then one house at a time
  function setProgress(pr) {
    if (pr < 0.2) { if (active !== -1) overview(); return; }
    const seg = Math.min(BRANCHES.length - 1, Math.floor((pr - 0.2) / (0.8 / BRANCHES.length)));
    if (seg !== active) focus(seg);
  }

  markerGroups.forEach((g, i) => {
    g.addEventListener('click', () => focus(i));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focus(i); } });
    g.addEventListener('mouseenter', () => g.classList.add('hover'));
    g.addEventListener('mouseleave', () => g.classList.remove('hover'));
  });

  return {
    map: svg,
    branches: BRANCHES,
    focus,
    overview,
    setProgress,
    resize: () => {},          // SVG scales with its container; nothing to do
  };
}
