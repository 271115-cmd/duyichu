/* ============================================================
   amap.js — interactive China-legal map (高德 / Amap) for the Visit page
   ------------------------------------------------------------
   The Visit map upgrades to a real pan/zoom Amap (street + satellite
   layers) AS SOON AS you paste a free Amap key below. Until then it
   falls back to the keyless drawn vector map (locations.js), so the
   DEFAULT build makes ZERO external network calls and works fully
   inside mainland China (Amap itself is the China-legal provider, so
   when keyed it also works in China — unlike Google/Mapbox/OSM).

   ▸ HOW TO GET A KEY (free, ~2 min):
       1. Sign up / log in at https://console.amap.com
       2. 应用管理 → 我的应用 → 创建新应用
       3. 添加 Key → 服务平台 = "Web端(JS API)"
       4. Copy the Key into AMAP_KEY below. If your key shows a
          "安全密钥(jscode)", paste that into AMAP_SECURITY too.
       5. Add your production domain to the key's 白名单 (allowed
          referrers) before going live.

   Coordinates: BRANCHES are WGS84 (GPS). Amap expects GCJ-02 inside
   China, so each point is converted (≈300–500 m offset in Beijing —
   matters for accurate pins).

   API (drop-in for page.js, same shape as locations.js):
     initVisitMap({ container })
       → { map, branches, focus(i), overview(), setProgress(p), resize(), dispose() }
   ============================================================ */

import { initLocationsMap as initDrawnMap, BRANCHES } from './locations.js';
import { getLang } from './i18n.js';
import { playPluck } from './sound.js';

/* ── PASTE YOUR FREE AMAP KEY HERE ─────────────────────────── */
// Key comes from the build env (.env.local → VITE_AMAP_KEY) so it isn't hard-coded
// in source. Empty → the keyless drawn map is used (graceful). NOTE: a Web JS-API
// key is public by design (Vite inlines it into the bundle) — the real abuse guard
// is the referer/domain whitelist you set in the Amap console for this key.
export const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '';
export const AMAP_SECURITY = '';       // ← optional 安全密钥(jscode); leave '' if none
/* ──────────────────────────────────────────────────────────── */

export { BRANCHES };

/* —— WGS84 (GPS) → GCJ-02 (the datum Amap uses in China) —— */
const GCJ_A = 6378245.0;
const GCJ_EE = 0.00669342162296594323;
function outOfChina(lng, lat) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}
function tLat(x, y) {
  let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3;
  r += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30)) * 2) / 3;
  return r;
}
function tLng(x, y) {
  let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3;
  r += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3;
  return r;
}
function wgs84ToGcj02(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat];
  let dLat = tLat(lng - 105, lat - 35);
  let dLng = tLng(lng - 105, lat - 35);
  const radLat = (lat / 180) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return [lng + dLng, lat + dLat];
}

/* —— load the Amap JS SDK once (only ever called when a key is set) —— */
const AMAP_TIMEOUT = 15000;          // upper bound on the background upgrade attempt
                                     // (the drawn map is already showing, so this
                                     // is generous — it only stops trying, never blanks)
function loadAmapSDK(key, security) {
  return new Promise((resolve, reject) => {
    if (window.AMap) return resolve(window.AMap);
    if (security) window._AMapSecurityConfig = { securityJsCode: security };
    // A stalled script fires NEITHER onload nor onerror, so without this the map
    // container would hang blank up to the browser default (~120s). Bail to the
    // drawn-map fallback after a bounded wait instead.
    let settled = false;
    const finish = (fn, arg) => { if (settled) return; settled = true; clearTimeout(timer); fn(arg); };
    const timer = setTimeout(() => finish(reject, new Error('Amap SDK load timed out')), AMAP_TIMEOUT);
    const ok = () => (window.AMap ? finish(resolve, window.AMap) : finish(reject, new Error('AMap missing after load')));
    const fail = () => finish(reject, new Error('Amap SDK failed to load'));
    const existing = document.getElementById('amap-sdk');
    if (existing) { existing.addEventListener('load', ok); existing.addEventListener('error', fail); return; }
    const s = document.createElement('script');
    s.id = 'amap-sdk';
    s.async = true;
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    s.onload = ok;
    s.onerror = fail;
    document.head.appendChild(s);
  });
}

/* —— brand-styled marker + info-window markup. Brand colours reference the
   :root palette tokens via var() (they cascade into Amap's marker DOM), so the
   pins stay in the design-token system rather than freezing raw hexes here. —— */
function pinHTML(b, isFlag) {
  const body = isFlag ? 'var(--red)' : 'var(--blue-2)';
  const ring = isFlag ? 'var(--yellow)' : 'var(--pink-2)';
  return `<div style="display:flex;flex-direction:column;align-items:center;font-family:'Space Grotesk',system-ui,sans-serif;">
      <span style="background:${body};color:#fff;font-weight:800;font-size:11px;letter-spacing:.02em;padding:3px 9px;border-radius:100px;white-space:nowrap;box-shadow:0 5px 16px rgba(0,0,0,.35);border:1.5px solid ${ring};">${b.cn}</span>
      <span style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${body};margin-top:-1px;"></span>
    </div>`;
}
function infoHTML(b) {
  return `<div style="font-family:'Space Grotesk',system-ui,sans-serif;min-width:184px;padding:6px 8px 4px;">
      <div style="font-weight:800;font-size:15px;color:var(--void,#0E0B08);">都一处 · ${b.cn}</div>
      <div style="font-size:12px;color:#444;margin-top:4px;">${b.addr}</div>
      <div style="font-size:11px;color:#8a8a8a;margin-top:2px;">${b.en}</div>
    </div>`;
}

/* —— build the real Amap; resolves to a control object —— */
async function buildAmap(container) {
  const AMap = await loadAmapSDK(AMAP_KEY, AMAP_SECURITY);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the schematic legend (axis / ring roads / pin) is meaningless on a real
  // map — hide it; Amap brings its own scale + layer controls.
  const legend = container.querySelector('.map-legend');
  if (legend) legend.style.display = 'none';

  const gcj = BRANCHES.map((b) => wgs84ToGcj02(b.lng, b.lat));
  const map = new AMap.Map(container, {
    zoom: 12.5,
    center: gcj[0],
    mapStyle: 'amap://styles/whitesmoke',
    lang: getLang() === 'zh' ? 'zh_cn' : 'en',
    viewMode: '2D',
    showIndoorMap: false,
    animateEnable: !reduced,
    jogEnable: !reduced,
  });

  const markers = BRANCHES.map((b, i) => {
    const pos = gcj[i];
    const m = new AMap.Marker({ position: pos, anchor: 'bottom-center', content: pinHTML(b, i === 0), zIndex: i === 0 ? 130 : 110, title: `都一处 ${b.cn}` });
    // autoMove:false → opening the window must NOT pan the map (that would
    // shift the shop off-centre after we centre it in focus()).
    const info = new AMap.InfoWindow({ content: infoHTML(b), anchor: 'bottom-center', offset: new AMap.Pixel(0, -40), autoMove: false });
    m.on('click', () => focus(i));   // clicking a pin behaves like clicking its card
    return { m, info, pos };
  });
  map.add(markers.map((x) => x.m));

  // zoom toolbar, scale, and the street/satellite layer switcher
  await new Promise((res) => AMap.plugin(['AMap.ToolBar', 'AMap.Scale', 'AMap.MapType'], res));
  try {
    map.addControl(new AMap.ToolBar({ position: { right: '14px', top: '14px' } }));
    map.addControl(new AMap.Scale());
    map.addControl(new AMap.MapType({ defaultType: 0, position: { right: '14px', bottom: '64px' } }));
  } catch (e) { /* controls are non-essential */ }

  document.addEventListener('langchange', () => { try { map.setLang(getLang() === 'zh' ? 'zh_cn' : 'en'); } catch (e) {} });

  const focus = (i) => {
    const x = markers[i];
    if (!x) return;
    markers.forEach((mk) => mk.info.close());
    x.info.open(map, x.pos);                     // autoMove:false → leaves the map put
    map.setZoomAndCenter(16, x.pos, reduced);    // …then centre the shop — the last word
    playPluck(i);
  };
  const overview = () => {
    markers.forEach((mk) => mk.info.close());
    try { map.setFitView(markers.map((x) => x.m), reduced, [90, 90, 90, 90]); } catch (e) {}
  };
  const resize = () => { try { map.resize && map.resize(); } catch (e) {} };
  const dispose = () => { try { map.destroy && map.destroy(); } catch (e) {} };

  return { map, branches: BRANCHES, focus, overview, setProgress() {}, resize, dispose };
}

/* —— public entry: drop-in for the Visit map —— */
export function initVisitMap({ container } = {}) {
  // No key → keyless drawn vector map (sync, zero external calls, China-safe).
  if (!AMAP_KEY) return initDrawnMap({ container });

  // Keyed → show the keyless drawn map IMMEDIATELY (no blank wait / no spinner),
  // then UPGRADE to the live Amap in the background once its SDK is ready. If
  // Amap can't load (blocked / slow / timed out / wrong key), the drawn map
  // simply stays — there's never an empty container or a long hang, and a plain
  // slow-but-working load no longer false-falls-back the user to nothing.
  let real = initDrawnMap({ container });
  const proxy = (m, args) => { try { if (real && typeof real[m] === 'function') real[m](...args); } catch (e) {} };

  buildAmap(container)
    .then((amap) => {
      const svg = container.querySelector('svg.loc-svg'); if (svg) svg.remove();   // drop the placeholder
      real = amap;
      amap.overview();                                                             // settle the live map on all 3 houses
    })
    .catch((err) => console.warn('[duyichu] live map unavailable — keeping the drawn map', err));

  return {
    branches: BRANCHES,
    focus: (i) => proxy('focus', [i]),
    overview: () => proxy('overview', []),
    setProgress: (p) => proxy('setProgress', [p]),
    resize: () => proxy('resize', []),
    dispose: () => proxy('dispose', []),
  };
}

// Back-compat alias so the import name doesn't matter at the call site.
export { initVisitMap as initLocationsMap };
