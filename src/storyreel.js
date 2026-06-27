/* ============================================================
   storyreel.js — Apple-style pinned full-screen story reel
   ------------------------------------------------------------
   Pins a `.story-reel` section and cross-dissolves its full-screen
   `.reel-scene` panels as you scroll: each scene holds, then the next
   rises into focus while the current recedes (scale + blur + drift).
   One scene fills the viewport at a time — a chronological journey,
   not a side-by-side text/image split.

   Degrades gracefully: with reduced-motion (or no JS) the scenes stay
   as normal stacked, readable full-height sections.
   ============================================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { playBell, playChime, playGong, playWoodblock } from './sound.js';

gsap.registerPlugin(ScrollTrigger);

export function initStoryReel({ lenis } = {}) {
  const reel = document.querySelector('.story-reel');
  if (!reel) return null;
  const scenes = [...reel.querySelectorAll('.reel-scene')];
  const dots = [...reel.querySelectorAll('.reel-dot')];
  const N = scenes.length;
  if (N < 2) return null;

  // Reduced motion → leave the scenes stacked & readable (CSS fallback). No pin.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reel.classList.add('reel-static');
    return null;
  }

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
  const root = document.documentElement;

  const apply = (el, st) => {
    el.style.opacity = st.o.toFixed(3);
    el.style.transform = `translate3d(0, ${st.y.toFixed(1)}px, 0) scale(${st.s.toFixed(3)})`;
    // blur is costly on full-screen layers — skip it on phones
    el.style.filter = (st.b > 0.05 && !isMobile()) ? `blur(${st.b.toFixed(1)}px)` : 'none';
    el.style.visibility = st.o < 0.012 ? 'hidden' : 'visible';
    el.style.pointerEvents = st.o > 0.6 ? 'auto' : 'none';
    // --p (presence 0→1) drives the per-scene CONTENT scrub: the giant numeral
    // settles + the headline/body rise in as the scene comes into focus. Only
    // the scoped `.home-reel` CSS reads it — Heritage's reel ignores it.
    el.style.setProperty('--p', st.o.toFixed(3));
  };

  // Activate: scenes become absolutely-stacked full-screen layers.
  reel.classList.add('reel-active');

  // Stack-reveal cross-dissolve: the current (lower) scene stays fully opaque
  // so there's never a gap to the dark base; the next scene — which sits ABOVE
  // it in the DOM — rises and fades in over it (and, scrolling back, fades out
  // to reveal it again). Gap-free in both directions.
  const TRANS = 0.36;            // the last 36% of each scene's slot dissolves to the next
  let activeIdx = -1;
  const render = (p) => {
    const seg = Math.min(N - 1e-6, Math.max(0, p * N));
    const idx = Math.floor(seg);
    const frac = seg - idx;
    const hasNext = idx + 1 < N;
    const tt = frac <= (1 - TRANS) ? 0 : (frac - (1 - TRANS)) / TRANS;   // 0→1 dissolve fraction

    for (let s = 0; s < N; s++) {
      let st;
      if (s === idx) {
        // current scene — opaque; recedes a touch (scale up + soft blur) as the next arrives
        st = hasNext ? { o: 1, s: 1 + 0.05 * tt, b: 6 * tt, y: -12 * tt } : { o: 1, s: 1, b: 0, y: 0 };
      } else if (hasNext && s === idx + 1) {
        // incoming scene — rises from below and fades in on top
        st = { o: tt, s: 0.94 + 0.06 * tt, b: 12 * (1 - tt), y: 32 * (1 - tt) };
      } else {
        st = { o: 0, s: 0.94, b: 0, y: 0 };   // covered / not yet arrived
      }
      apply(scenes[s], st);
    }

    // ken-burns drift: the in-focus scene's giant numeral creeps as you scroll
    // through it (read by `.home-reel` CSS only).
    for (let s = 0; s < N; s++) scenes[s].style.setProperty('--d', s === idx ? frac.toFixed(3) : '0');

    const act = (hasNext && tt > 0.5) ? idx + 1 : idx;
    if (act !== activeIdx) {
      const firstSet = activeIdx === -1;
      activeIdx = act;
      reel.dataset.scene = String(act);
      dots.forEach((d, i) => {
        const on = i === act;
        d.classList.toggle('active', on);
        d.setAttribute('aria-current', on ? 'true' : 'false');
      });
      // recolour the custom cursor to the active scene's accent
      const c = scenes[act] && scenes[act].dataset.cursor;
      if (c) root.style.setProperty('--cursor-color', c);
      // a struck voice marks arriving at each scene (not on the initial load set)
      if (!firstSet) {
        const voice = scenes[act] && scenes[act].dataset.sound;
        if (voice === 'bell') playBell();          // the 1752 imperial decree
        else if (voice === 'gong') playGong();     // the 2008 national-heritage scene
        else playChime();                          // every other chapter turning over
      }
    }
  };

  const trigger = ScrollTrigger.create({
    trigger: reel,
    start: 'top top',
    end: () => '+=' + Math.round(N * 0.9 * window.innerHeight),
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
  });
  render(0);

  // Click an era marker → glide to that scene.
  dots.forEach((d, i) => {
    d.addEventListener('click', () => {
      playWoodblock();                              // tactile tock; the destination scene then sounds its own voice
      const target = trigger.start + ((i + 0.4) / N) * (trigger.end - trigger.start);
      if (lenis && typeof lenis.scrollTo === 'function') lenis.scrollTo(target, { duration: 1.0 });
      else window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });

  ScrollTrigger.refresh();
  return { trigger, render };
}
