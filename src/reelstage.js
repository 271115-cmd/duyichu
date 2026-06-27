/* ============================================================
   reelstage.js — ONE pinned, scroll-scrubbed STAGE that drives many
   depth layers on a SINGLE master timeline with OVERLAPPING ranges.
   ------------------------------------------------------------
   The fix for the "slideshow" feel: instead of cross-dissolving
   full-screen panels, the stage pins ONCE for the whole narrative
   span and one scrubbed timeline animates every region's layers
   (far numeral · mid seal · foreground copy) on ranges that OVERLAP
   the next region's — so layers physically ZOOM / SLIDE PAST each
   other as you scroll up and down (cryptowl / copula / elvalabs feel).
   Geometry carries the transition (scale 0.3→2.6 zoom-through,
   ±22% slide); opacity is only the tail. Differential layer speeds
   (numeral slow · copy fast) = depth. scrub is a NUMBER (settle on
   top of Lenis), nothing snaps → one continuous shot.

   Reduced-motion / mobile → no pin; regions stack as readable
   full-height panels (.reel-static fallback).
   ============================================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { playBell, playChime, playWoodblock } from './sound.js';

gsap.registerPlugin(ScrollTrigger);

// the theme background colours the stage continuously travels THROUGH
// (history yellow → story cherry → craft pink), tweened by the scrub.
const STAGE_BG = ['#F4FF1E', '#6E1221', '#FF4283'];

export function initReelStage({ lenis } = {}) {
  const stage = document.querySelector('.reel-stage');
  if (!stage) return null;
  const regions = [...stage.querySelectorAll('.rs-region')];
  const dots = [...stage.querySelectorAll('.reel-dot')];
  const N = regions.length;
  if (N < 2) return null;

  const root = document.documentElement;

  // Fallback: no pin — regions stack & read as normal full-height panels.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      (window.matchMedia('(max-width: 768px)').matches && window.innerWidth > 0)) {
    stage.classList.add('reel-static');
    return null;
  }

  stage.classList.add('reel-stage-active');
  stage.style.backgroundColor = STAGE_BG[0];

  let lastRegion = -1;
  const setActiveDot = (i) => dots.forEach((d, j) => {
    const on = j === i;
    d.classList.toggle('active', on);
    d.setAttribute('aria-current', on ? 'true' : 'false');
  });

  const OVER = 0.34;                         // hand-off overlap (a region's exit shares this window with the next's entrance)
  const tl = gsap.timeline({ defaults: { ease: 'none' } });   // ease:'none' on every scrubbed tween

  // --- the stage background colour travels with the scrub ---
  for (let i = 1; i < N; i++) {
    tl.to(stage, { backgroundColor: STAGE_BG[i % STAGE_BG.length], duration: OVER }, i - OVER);
  }

  // --- per region: FAR numeral (slow, zoom-through) · MID seal · FORE copy (fast, slide) ---
  regions.forEach((region, i) => {
    const bgnum = region.querySelector('.rs-bgnum');
    const seal = region.querySelector('.rs-seal');
    const fg = region.querySelector('.rs-fg');
    const chips = [...region.querySelectorAll('.rs-chip')];
    const start = i;                         // each region owns one unit of timeline time
    const first = i === 0;
    const last = i === N - 1;

    // FAR — giant numeral. First region is already settled (you just scrolled
    // onto it); later ones grow in from small. All but the last zoom THROUGH
    // the camera + fade as the next region arrives (the depth "travel").
    if (bgnum) {
      if (first) gsap.set(bgnum, { scale: 1.04, opacity: 0.16, yPercent: 0 });
      else tl.fromTo(bgnum, { scale: 0.55, opacity: 0, yPercent: 10 },
                            { scale: 1.04, opacity: 0.16, yPercent: 0, duration: OVER }, start - OVER);
      if (!last) tl.to(bgnum, { scale: 1.38, opacity: 0, yPercent: -6, duration: OVER }, (start + 1) - OVER);
    }

    // MID — the lacquer seal (R2): grows from a point, then zooms THROUGH into
    // the next region — a shared object crossing the seam (kills the "cut").
    if (seal) {
      tl.fromTo(seal, { scale: 0.25, opacity: 0, filter: 'blur(8px)' },
                      { scale: 1, opacity: 1, filter: 'blur(0px)', duration: OVER }, start - OVER + 0.04);
      if (!last) tl.to(seal, { scale: 2.6, opacity: 0, filter: 'blur(3px)', duration: OVER }, (start + 1) - OVER);
    }

    // FORE — copy. Rises in fast, HOLDS across the middle, slides out (the last
    // region holds to the end and hands off to the next chapter).
    if (fg) {
      if (first) gsap.set(fg, { yPercent: 0, autoAlpha: 1 });
      else tl.fromTo(fg, { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.32 }, start - OVER + 0.06);
      if (!last) tl.to(fg, { yPercent: -22, autoAlpha: 0, duration: OVER }, (start + 1) - OVER);
    }

    // chips — staggered depth (alternating ±x), inside the foreground
    if (chips.length && !first) {
      tl.fromTo(chips, { yPercent: 20, autoAlpha: 0, x: (j) => (j % 2 ? 16 : -16) },
                       { yPercent: 0, autoAlpha: 1, x: 0, duration: 0.34, stagger: 0.04 }, start - OVER + 0.12);
    }

    // recolour the custom cursor + sound a voice when this region takes focus
    const cursor = region.dataset.cursor;
    const sound = region.dataset.sound;
    tl.call(() => {
      if (cursor) root.style.setProperty('--cursor-color', cursor);
      setActiveDot(i);
      if (lastRegion !== i) {
        if (lastRegion !== -1) (sound === 'bell' ? playBell() : playChime());
        lastRegion = i;
      }
    }, [], start + 0.5);
  });

  // a final hold so the last region rests on screen before the stage unpins
  tl.to(stage, { duration: 0.9 });

  const stageH = () => Math.round((N + 1) * 0.95 * (window.innerHeight || 900));

  const trigger = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => '+=' + stageH(),
    pin: true, pinSpacing: true, anticipatePin: 1,
    scrub: 1,                                // NUMBER → ScrollTrigger adds a ~1s settle on top of Lenis
    invalidateOnRefresh: true,
    animation: tl,
  });

  // era dots → glide to a region's start
  dots.forEach((d, i) => {
    d.addEventListener('click', () => {
      playWoodblock();
      const target = trigger.start + (i / (N + 1)) * (trigger.end - trigger.start) + 24;
      if (lenis && typeof lenis.scrollTo === 'function') lenis.scrollTo(target, { duration: 1.0 });
      else window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });

  setActiveDot(0);
  ScrollTrigger.refresh();
  return { trigger, timeline: tl };
}
