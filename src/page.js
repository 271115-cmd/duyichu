/**
 * DUYICHU - Sub-page Handler
 * Fluid background, smooth scroll, cursor, text reveals, image reveals
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initStoryReel } from './storyreel.js';
import { initCommon } from './bootstrap.js';

gsap.registerPlugin(ScrollTrigger);

// Shared chrome (SW registration · console signature · page-transition · i18n ·
// sound · scroll-progress) — identical on every page, lives in one module.
initCommon();

// Gentle page fade-in for polish (content is visible by default via CSS)
const mainContent = document.getElementById('main-content');
if (mainContent) {
  gsap.fromTo(mainContent, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
}

// Visit page: interactive China-legal map (高德 Amap, street + satellite). It
// upgrades the moment an Amap key is set in amap.js; until then it renders the
// keyless drawn vector map — so the default build makes zero external calls.
const visitMap = document.getElementById('visit-map');
if (visitMap) {
  import('./amap.js').then(({ initVisitMap }) => {
    const ctl = initVisitMap({ container: visitMap });
    document.querySelectorAll('.visit-map-hud .loc-card').forEach((card) => {
      card.addEventListener('click', () => ctl.focus(parseInt(card.dataset.loc, 10)));
    });
    ctl.overview();
    window.addEventListener('pagehide', () => { try { ctl.dispose(); } catch (e) {} }, { once: true });
  }).catch(() => {});
}

// Spatial depth — planes separate under the mouse AND drift on scroll, so the
// sub-page sections read as stacked, parallaxing layers. One transform writer
// per element (mouse + scroll combined) so nothing fights.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 768px)').matches) return;
  const groups = [
    { sel: '.arch-grid', d: -34, sd: 0.06 },
    { sel: '.story-seal, .huge-number', d: -52, sd: 0.11 },
    { sel: '.block-title, .block-display, .contact-brand', d: 18, sd: 0.035 },
    { sel: '.block-label, .chapter-index, .chapter-tag, .hero-sub', d: 10, sd: 0.02 },
    { sel: '.marquee', d: 30, sd: 0.07 },
  ];
  const items = [];
  groups.forEach((g) => document.querySelectorAll(g.sel).forEach((el) => items.push({ el, d: g.d, sd: g.sd })));
  if (!items.length) return;
  const docY = (el) => { let y = 0, n = el; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };
  const measure = () => items.forEach((it) => { it.base = docY(it.el); });
  measure();
  document.fonts?.ready.then(measure);
  window.addEventListener('resize', () => measure());
  window.addEventListener('load', measure);
  let tx = 0, ty = 0, x = 0, y = 0;
  window.addEventListener('mousemove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  let rafId = 0;
  const loop = () => {
    x += (tx - x) * 0.07; y += (ty - y) * 0.07;
    const vh = window.innerHeight;
    const sc = window.scrollY + vh * 0.5;
    for (const it of items) {
      const delta = Math.max(-vh, Math.min(vh, sc - (it.base || 0)));
      it.el.style.transform = `translate3d(${(x * it.d).toFixed(2)}px, ${(y * it.d + delta * it.sd).toFixed(2)}px, 0)`;
    }
    rafId = requestAnimationFrame(loop);
  };
  // run only while the tab is visible; stop cleanly on navigation away
  const start = () => { if (!rafId) rafId = requestAnimationFrame(loop); };
  const stop = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } };
  start();
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  window.addEventListener('pagehide', stop, { once: true });
})();

// Custom cursor recolours to match the section at viewport centre
(() => {
  const sections = [...document.querySelectorAll('[data-cursor]')];
  if (!sections.length) return;
  const root = document.documentElement;
  let current = '';
  const update = () => {
    const mid = window.innerHeight / 2;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) {
        const c = s.getAttribute('data-cursor');
        if (c && c !== current) { current = c; root.style.setProperty('--cursor-color', c); }
        break;
      }
    }
  };
  // Coalesce to one layout-reading pass per frame (Lenis fires scroll at frame rate).
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
})();

// ── Smooth scroll ───────────────────────────────────────────────────────────
const lenis = new Lenis({ duration: 1.2, smooth: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ── Heritage story reel: full-screen scenes that cross-dissolve on scroll ────
initStoryReel({ lenis });

// (velocity skew is handled by the cinematic layer below)

// Cinematic 3D scroll layer (WebGL background + depth transitions + char reveals).
// Lazy-loaded; degrades silently to the solid-colour chapters without WebGL.
import('./cinematic.js')
  .then(({ initCinematic }) => initCinematic({ root: document, lenis, hero: document.body.dataset.hero || 'shaomai' }))
  .catch((e) => console.warn('[duyichu] cinematic layer unavailable — falling back to flat chapters', e));

// ── Custom cursor ───────────────────────────────────────────────────────────
const cursor = document.getElementById('cursor');
const cursorText = document.getElementById('cursor-text');
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

window.addEventListener('mousemove', (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; });

let cursorRaf = 0;
function tickCursor() {
  mouse.x += (mouse.tx - mouse.x) * 0.15;
  mouse.y += (mouse.ty - mouse.y) * 0.15;
  if (cursor)     { cursor.style.left = `${mouse.x}px`;     cursor.style.top = `${mouse.y}px`; }
  if (cursorText) { cursorText.style.left = `${mouse.x}px`; cursorText.style.top = `${mouse.y}px`; }
  cursorRaf = requestAnimationFrame(tickCursor);
}
// run only while the tab is visible; stop cleanly on navigation away
const startCursor = () => { if (!cursorRaf) cursorRaf = requestAnimationFrame(tickCursor); };
const stopCursor = () => { if (cursorRaf) { cancelAnimationFrame(cursorRaf); cursorRaf = 0; } };
startCursor();
document.addEventListener('visibilitychange', () => { if (document.hidden) stopCursor(); else startCursor(); });
window.addEventListener('pagehide', stopCursor, { once: true });

// ── Magnetic hover elements ─────────────────────────────────────────────────
document.querySelectorAll('[data-magnetic]').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor?.classList.add('hovering');
    if (cursorText) { cursorText.classList.add('visible'); cursorText.textContent = 'Explore'; }
  });
  el.addEventListener('mouseleave', () => {
    cursor?.classList.remove('hovering');
    cursorText?.classList.remove('visible');
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
  });
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist < 100) {
      const s = 0.3 * (1 - dist / 100);
      gsap.to(el, { x: dx * s, y: dy * s, duration: 0.3, ease: 'power2.out' });
    }
  });
});

// ── Split slide-in (a distinct entrance: the two columns arrive from opposite
//    sides, for storyboard beats that want a more cinematic reveal) ──────────
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.utils.toArray('[data-slide]').forEach((el) => {
    const dir = el.dataset.slide === 'left' ? -90 : 90;
    gsap.from(el, {
      x: dir, opacity: 0, duration: 1.15, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 84%', once: true },
    });
  });
}

// ── Text reveals ────────────────────────────────────────────────────────────
// With the home-only slide-up no longer shifting sub-page layout, trigger
// positions are accurate and reveals fire exactly as elements enter view.
gsap.utils.toArray('.reveal-text').forEach((text) => {
  gsap.fromTo(text, { y: 16, opacity: 0 }, {
    y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: text.parentElement, start: 'top 92%', once: true },
  });
});

// ── Image reveals ───────────────────────────────────────────────────────────
gsap.utils.toArray('img[data-webgl]').forEach((img) => {
  gsap.to(img, {
    opacity: 1, duration: 1.6, ease: 'power2.inOut',
    scrollTrigger: { trigger: img.parentElement, start: 'top 88%', once: true },
  });
});

// Recompute trigger positions once fonts load (they shift layout)
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());

// ── Fluid WebGL background ──────────────────────────────────────────────────
(function initFluid() {
  return; // replaced by the cinematic background in cinematic.js
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  const vert = /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `;

  const frag = /* glsl */ `
    uniform float uTime;
    uniform vec2  uRes;
    varying vec2  vUv;

    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
      vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m*=m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }

    void main(){
      vec2 uv=vUv;
      float aspect=uRes.x/uRes.y;
      float noise=snoise(vec3(uv*2.2,uTime*0.10))*0.5+0.5;
      vec3 c1=vec3(0.925,0.890,0.824); // #ece3d2
      vec3 c2=vec3(0.890,0.843,0.753); // #e3d7c0
      vec3 col=mix(c1,c2,noise*0.5);
      float vig=1.0-length((uv-0.5)*vec2(aspect,1.0))*0.18;
      col*=vig;
      float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
      col+=(grain-0.5)*0.02;
      gl_FragColor=vec4(col,1.0);
    }
  `;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  cam.position.z = 1;

  const uniforms = {
    uTime: { value: 0 },
    uRes:  { value: new THREE.Vector2(innerWidth, innerHeight) },
  };

  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms })
  ));

  const clock = new THREE.Clock();
  (function render() {
    requestAnimationFrame(render);
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, cam);
  })();

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    uniforms.uRes.value.set(innerWidth, innerHeight);
  });
})();
