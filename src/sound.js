/* ============================================================
   sound.js — the Duyichu soundscape (synthesized, opt-in)
   ------------------------------------------------------------
   PHILOSOPHY (the WHY): a visitor should feel they have stepped
   past a heavy door into a quiet, 288-year-old hall — not into a
   UI that beeps. One warm room-tone hush always breathes
   underneath; a small family of struck bronze & stone voices
   speaks ONLY at the few moments that carry narrative weight.
   Silence is the negative space that makes the bell matter.

   Everything is SYNTHESIZED with the Web Audio API — no files,
   no network, China-safe. Default OFF; the visitor invites sound
   in with the toggle, and the AudioContext only resumes after a
   real gesture (autoplay policy).

   The full sound map (WHEN / WHERE / HOW MUCH / INTENT):
     • Temple bell (bianzhong) — ENTRY threshold, the 1752 imperial
       decree scene, and the opt-in toggle. The rarest, loudest,
       signature voice. ~3× a session, no more.
     • Gong wash — RESERVED for the 2008 National-Heritage scene only.
     • Qing stone chime — arriving at a story-reel scene; reservation
       confirmed. Bright, brief.
     • Muyu woodblock — a home chapter snapping into place; an era-dot
       click. Dry, tactile, no reverb.
     • Guzheng pluck — focusing each of the three branch houses on the
       map (a tiny 3-note melody emerges as you tour them).
     • Silk swish — a panel/modal/menu opening. Almost subliminal.
   DELIBERATELY SILENT: hovers, cursor moves, scroll-in-progress,
   nav clicks, page transitions, form typing. (Restraint budget.)
   ============================================================ */

const STORE = 'duyichu_sound';
let ctx = null, enabled = false;
let master = null, comp = null, convolver = null, reverbReturn = null;
let amb = null, btn = null, suspendTimer = null;

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mGain = (g) => g * (isMobile() ? 0.7 : 1);          // trim one-shots on mobile

/* per-voice cooldown so nothing machine-guns */
const lastPlayed = Object.create(null);
function canPlay(name, cooldownMs) {
  const t = ctx ? ctx.currentTime : 0;
  if (lastPlayed[name] != null && t - lastPlayed[name] < cooldownMs / 1000) return false;
  lastPlayed[name] = t;
  return true;
}

/* ── engine: master bus → brickwall limiter → out; + a shared reverb ── */
function ensureCtx() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain(); master.gain.value = 0.9;
    comp = ctx.createDynamicsCompressor();                 // safety ceiling: overlapping partials can't clip
    comp.threshold.value = -20; comp.knee.value = 8; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    // procedural "stone hall" reverb — a decaying noise impulse, no audio file
    convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(2.2, 2.4);
    reverbReturn = ctx.createGain(); reverbReturn.gain.value = 0.4;
    convolver.connect(reverbReturn); reverbReturn.connect(master);
    // free CPU when the tab is hidden; resume when it comes back (if still on)
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else if (enabled) ctx.resume();
    });
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function makeImpulse(seconds, decay) {
  const rate = ctx.sampleRate, len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  const fade = Math.floor(rate * 0.001);                   // 1ms fade-in kills the sample-0 click
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const env = Math.pow(1 - i / len, decay);
      d[i] = (Math.random() * 2 - 1) * env;
      if (i < fade) d[i] *= i / fade;
    }
  }
  return buf;
}

/* a one-shot output: its own gain → master, plus an optional reverb send */
function voiceOut(peak, send) {
  const out = ctx.createGain(); out.gain.value = mGain(peak); out.connect(master);
  if (send > 0 && convolver) { const s = ctx.createGain(); s.gain.value = send; out.connect(s); s.connect(convolver); }
  return out;
}

/* duck the hush out of the way of a struck voice (sidechain-by-hand) */
function duck() {
  if (!amb || !ctx) return;
  const now = ctx.currentTime;
  [[amb.ng, 0.018], [amb.dg, 0.02]].forEach(([g, base]) => {
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
    g.gain.linearRampToValueAtTime(0.006, now + 0.08);     // dip in 80ms
    g.gain.linearRampToValueAtTime(base, now + 0.68);      // recover over 600ms
  });
}

const cleanup = (nodes, after) => setTimeout(() => nodes.forEach((n) => { try { n.disconnect(); } catch (e) {} }), after);

/* ── VOICES ───────────────────────────────────────────────── */

/* bianzhong temple bell — inharmonic bronze, long tail. The signature. */
export function playBell(opts = {}) {
  if (!enabled) return;
  const c = ensureCtx(); if (!c) return;
  if (!canPlay('bell', 1500)) return;
  duck();
  const now = c.currentTime;
  const cents = opts.cents != null ? opts.cents : (Math.random() * 40 - 20);   // ±20 cents
  const pitch = Math.pow(2, cents / 1200);
  const ampJ = 1 + (Math.random() * 0.2 - 0.1);                                // ±10% amp
  const out = voiceOut(0.25, 0.18);
  [[1, 1, 9], [2.0, 0.55, 7], [2.67, 0.34, 5.5], [4.0, 0.2, 3.8], [5.33, 0.12, 2.6], [8.0, 0.06, 1.5]]
    .forEach(([ratio, amp, dur]) => {
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.value = 110 * ratio * pitch * (1 + (Math.random() - 0.5) * 0.004);
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(amp * ampJ, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(out);
      o.start(now); o.stop(now + dur + 0.1);
    });
  cleanup([out], 9500);
}

/* qing stone chime — bright, harmonic, short. The everyday milestone. */
export function playChime(opts = {}) {
  if (!enabled) return;
  const c = ensureCtx(); if (!c) return;
  if (!canPlay('chime', opts.cooldown || 1200)) return;
  duck();
  const now = c.currentTime;
  const semis = opts.semis != null ? opts.semis : (Math.random() * 4 - 2);     // ±2 semitones
  const base = 650 * Math.pow(2, semis / 12);
  const out = voiceOut(0.14, 0.12);
  [[1, 0.30, 3.0], [2, 0.22, 2.2], [3, 0.15, 1.8], [4, 0.10, 1.0]].forEach(([ratio, amp, dur]) => {
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.value = base * ratio * (1 + (Math.random() - 0.5) * 0.003);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(out);
    o.start(now); o.stop(now + dur + 0.1);
  });
  cleanup([out], 3500);
}

/* muyu woodblock — dry hollow tock, no reverb. A tactile marker. */
export function playWoodblock() {
  if (!enabled) return;
  const c = ensureCtx(); if (!c) return;
  if (!canPlay('woodblock', 400)) return;
  duck();
  const now = c.currentTime;
  const out = c.createGain(); out.gain.value = mGain(0.10);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300; hp.Q.value = 0.7;
  hp.connect(out); out.connect(master);                                        // dry on purpose
  // (A) short noise burst — the "attack"
  const nlen = Math.floor(c.sampleRate * 0.02);
  const nbuf = c.createBuffer(1, nlen, c.sampleRate); const nd = nbuf.getChannelData(0);
  for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource(); noise.buffer = nbuf;
  const ng = c.createGain(); ng.gain.setValueAtTime(0.5, now); ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  noise.connect(ng); ng.connect(hp); noise.start(now); noise.stop(now + 0.1);
  // (B) pitched body — the hollow "tok"
  const semis = Math.random() * 4 - 2;
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 750 * Math.pow(2, semis / 12);
  const og = c.createGain();
  og.gain.setValueAtTime(0, now);
  og.gain.linearRampToValueAtTime(0.25 * (0.85 + Math.random() * 0.3), now + 0.01);
  og.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  o.connect(og); og.connect(hp); o.start(now); o.stop(now + 0.55);
  cleanup([out, hp], 800);
}

/* guzheng pluck — a single warm plucked note (Karplus-Strong) */
const PENT = [220, 247, 294];                                                  // a small pentatonic set, one note per branch
export function playPluck(idx = 0) {
  if (!enabled) return;
  const c = ensureCtx(); if (!c) return;
  if (!canPlay('pluck', 500)) return;
  duck();
  const now = c.currentTime;
  const pitch = PENT[((idx % PENT.length) + PENT.length) % PENT.length];
  const out = voiceOut(0.11, 0.10);
  const delay = c.createDelay(0.05); delay.delayTime.value = 1 / pitch;
  const fb = c.createGain(); fb.gain.value = 0.972;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000; lp.Q.value = 0.6;
  delay.connect(lp); lp.connect(fb); fb.connect(delay); delay.connect(out);
  // excite the string with a 20ms noise pluck
  const elen = Math.floor(c.sampleRate * 0.02);
  const ebuf = c.createBuffer(1, elen, c.sampleRate); const ed = ebuf.getChannelData(0);
  for (let i = 0; i < elen; i++) ed[i] = (Math.random() * 2 - 1) * 0.8;
  const ex = c.createBufferSource(); ex.buffer = ebuf; ex.connect(delay); ex.start(now); ex.stop(now + 0.02);
  out.gain.setValueAtTime(out.gain.value, now + 3.0);
  out.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);
  setTimeout(() => { try { fb.gain.value = 0; } catch (e) {} }, 3700);
  cleanup([out, delay, fb, lp], 4000);
}

/* gong wash — slow inharmonic bronze swell + shimmer. Reserved, rare. */
export function playGong() {
  if (!enabled) return;
  const c = ensureCtx(); if (!c) return;
  if (!canPlay('gong', 3000)) return;
  duck();
  const now = c.currentTime;
  const out = voiceOut(0.12, 0.15);
  // 2Hz tremolo shimmer on the whole wash
  const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 2;
  const lfoG = c.createGain(); lfoG.gain.value = mGain(0.12) * 0.04;
  lfo.connect(lfoG); lfoG.connect(out.gain); lfo.start(now); lfo.stop(now + 10.5);
  [[1, 0.22, 10], [1.5, 0.15, 8.5], [2.2, 0.12, 7], [3, 0.10, 5.5], [4.5, 0.08, 4]].forEach(([ratio, amp, dur]) => {
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.value = 120 * ratio * (1 + (Math.random() - 0.5) * 0.005);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.1);                            // slow swell, not a strike
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(out); o.start(now); o.stop(now + dur + 0.1);
  });
  // high shimmer wash
  const slen = Math.floor(c.sampleRate * 5.5);
  const sbuf = c.createBuffer(1, slen, c.sampleRate); const sd = sbuf.getChannelData(0);
  for (let i = 0; i < slen; i++) sd[i] = Math.random() * 2 - 1;
  const sh = c.createBufferSource(); sh.buffer = sbuf;
  const shHp = c.createBiquadFilter(); shHp.type = 'highpass'; shHp.frequency.value = 2500; shHp.Q.value = 0.5;
  const shg = c.createGain();
  shg.gain.setValueAtTime(0, now); shg.gain.linearRampToValueAtTime(0.05, now + 0.15);
  shg.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);
  sh.connect(shHp); shHp.connect(shg); shg.connect(out); sh.start(now); sh.stop(now + 5.6);
  cleanup([out], 10800);
}

/* silk swish — a whisper of moving silk for a panel sliding in */
export function playSwish(durMs = 300) {
  if (!enabled) return;
  const c = ensureCtx(); if (!c) return;
  if (!canPlay('swish', 500)) return;
  const now = c.currentTime, dur = durMs / 1000;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.1 * w) / 1.1; d[i] = last * 3; }
  const src = c.createBufferSource(); src.buffer = buf;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200; hp.Q.value = 0.8;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; lp.Q.value = 0.6;
  const out = c.createGain();
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(mGain(0.05), now + 0.03);
  out.gain.linearRampToValueAtTime(0.0001, now + dur);
  const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 3;
  const lfoG = c.createGain(); lfoG.gain.value = 0.003; lfo.connect(lfoG); lfoG.connect(out.gain);
  lfo.start(now); lfo.stop(now + dur + 0.05);
  src.connect(hp); hp.connect(lp); lp.connect(out); out.connect(master);
  src.start(now); src.stop(now + dur + 0.05);
  cleanup([out, hp, lp], (dur + 0.2) * 1000);
}

/* ── room-tone bed (the hush everything floats on) ── */
function startAmbient() {
  const c = ensureCtx(); if (!c || amb) return;
  if (isMobile()) return;                                                      // no bed on mobile (battery/data)
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
  const noise = c.createBufferSource(); noise.buffer = buf; noise.loop = true;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.6;
  const ng = c.createGain(); ng.gain.value = 0.0;
  noise.connect(lp); lp.connect(ng); ng.connect(master);
  if (convolver) { const send = c.createGain(); send.gain.value = 0.22; ng.connect(send); send.connect(convolver); }  // spatial thickness
  const drone = c.createOscillator(); drone.type = 'sine'; drone.frequency.value = 55;
  const dg = c.createGain(); dg.gain.value = 0.0; drone.connect(dg); dg.connect(master);
  const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07;            // slow breathing
  const lfoG = c.createGain(); lfoG.gain.value = 0.006; lfo.connect(lfoG); lfoG.connect(ng.gain);
  const now = c.currentTime;
  ng.gain.setValueAtTime(0.0, now); ng.gain.linearRampToValueAtTime(0.018, now + 2.5);
  dg.gain.setValueAtTime(0.0, now); dg.gain.linearRampToValueAtTime(0.02, now + 2.5);
  noise.start(); drone.start(); lfo.start();
  amb = { noise, drone, lfo, ng, dg };
}
function stopAmbient() {
  if (!amb || !ctx) return;
  const now = ctx.currentTime;
  amb.ng.gain.cancelScheduledValues(now); amb.ng.gain.linearRampToValueAtTime(0, now + 0.6);
  amb.dg.gain.cancelScheduledValues(now); amb.dg.gain.linearRampToValueAtTime(0, now + 0.6);
  const a = amb; amb = null;
  setTimeout(() => { try { a.noise.stop(); a.drone.stop(); a.lfo.stop(); } catch (e) {} }, 800);
}

function paint() {
  if (!btn) return;
  btn.classList.toggle('on', enabled);
  btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  btn.setAttribute('aria-label', enabled ? 'Sound on' : 'Sound off');
  btn.innerHTML = enabled
    ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4 4 0 0 1 0 7"/><path d="M18.5 6a7 7 0 0 1 0 12"/></svg>'
    : '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';
}

function setEnabled(on, withBell) {
  enabled = on;
  try { localStorage.setItem(STORE, on ? 'on' : 'off'); } catch (e) {}
  paint();
  if (on) {
    clearTimeout(suspendTimer);
    ensureCtx(); startAmbient();
    if (withBell) playBell();
  } else {
    stopAmbient();
    suspendTimer = setTimeout(() => { try { if (ctx && !enabled) ctx.suspend(); } catch (e) {} }, 1000);
  }
}

export function initSound() {
  try { enabled = localStorage.getItem(STORE) === 'on'; } catch (e) {}
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'sound-toggle';
    btn.addEventListener('click', (e) => { e.stopPropagation(); setEnabled(!enabled, !enabled); });
    document.body.appendChild(btn);
    paint();
  }
  // if sound was left on, the loop must wait for the first gesture (autoplay policy)
  if (enabled) {
    const kick = () => { ensureCtx(); startAmbient(); window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
  }
}

export function soundEnabled() { return enabled; }
