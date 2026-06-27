/* Shared bootstrap run by BOTH entry points (main.js + page.js): service-worker
   registration, the console signature, and the always-on chrome (page-transition
   cover, the 8-language chooser, opt-in sound, the reading-progress bar). One
   copy so a fix lands once instead of being maintained in two places. */
import { initPageTransition } from './transition.js';
import { initI18n } from './i18n.js';
import { initSound } from './sound.js';
import { initScrollProgress } from './scrollprogress.js';

export function initCommon() {
  // PWA: register the service worker (production only — never the dev server, so
  // HMR is never cached).
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  }

  // a quiet hello for anyone who opens the console
  try {
    console.log('%c都一处 %cDuyichu · The Only Place',
      'color:#F4FF1E;font:900 24px Archivo,system-ui,sans-serif',
      'color:#FF1EC7;font:700 15px Archivo,system-ui,sans-serif');
    console.log('%cProcedural Three.js · GSAP · a synthesized soundscape · 8 languages · zero external dependencies · installable & offline. Built to run anywhere.',
      'color:#5196E8;font:13px/1.6 Archivo,system-ui,sans-serif');
  } catch (e) {}

  initPageTransition();   // pull-up page-transition cover (reveals on arrival, covers on nav)
  initI18n();             // language chooser (8 languages) — modal on first visit + toggles
  initSound();            // opt-in ambient sound (synthesized room tone), default off
  initScrollProgress();   // slim reading-progress bar
}
