/* ============================================================
   transition.js — ink page transition
   ------------------------------------------------------------
   A grid of ink drops, fused by a goo filter and roughened by
   turbulence so every edge bleeds like ink on rice paper:
     • LEAVE   — ink pools outward from the centre until the
                 room is black.
     • HOLD    — the screen stays ink while the next page loads.
     • REVEAL  — the ink evaporates in irregular patches,
                 uncovering the next chamber.
   Needs <div id="page-transition"></div> in the body + CSS.
   ============================================================ */

import { gsap } from 'gsap';

const GOO_ID = 'pt-goo';

function injectGoo() {
  if (document.getElementById(GOO_ID)) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  svg.setAttribute('aria-hidden', 'true');
  // blur + alpha-threshold fuses the drops; turbulence displacement
  // tears the resulting silhouette into a ragged ink bleed
  // Generous filter region so the blurred + displaced ink mass is never
  // clipped at the screen edges (displacement can push it ~46px outward).
  svg.innerHTML =
    `<defs><filter id="${GOO_ID}" color-interpolation-filters="sRGB" x="-30%" y="-30%" width="160%" height="160%">
       <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur"/>
       <feColorMatrix in="blur" mode="matrix"
         values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo"/>
       <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="2" seed="7" result="noise"/>
       <feDisplacementMap in="goo" in2="noise" scale="46" xChannelSelector="R" yChannelSelector="G"/>
     </filter></defs>`;
  document.body.appendChild(svg);
}

function buildBlobs(ov) {
  ov.querySelectorAll('.pt-blob').forEach((b) => b.remove());
  const inCols = window.innerWidth < 720 ? 4 : 6;
  const inRows = window.innerWidth < 720 ? 6 : 4;
  // Extend the grid one cell beyond every edge: this off-screen ring guarantees
  // the fused ink mass over-covers the viewport even after turbulence warps its
  // silhouette inward — so no slivers of background ever show at the edges.
  const cols = inCols + 2, rows = inRows + 2;
  ov.dataset.cols = cols; ov.dataset.rows = rows;   // FULL grid dims (for stagger)
  ov.dataset.inCols = inCols; ov.dataset.inRows = inRows;
  const cellW = window.innerWidth / inCols;
  const cellH = window.innerHeight / inRows;
  const d = Math.max(cellW, cellH) * 1.75;          // drop diameter, grid-relative
  const blobs = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const b = document.createElement('span');
      b.className = 'pt-blob';
      b.style.width = d + 'px';
      b.style.height = d + 'px';
      b.style.margin = `${-d / 2}px 0 0 ${-d / 2}px`;
      // r,c run 0..rows-1 over the extended grid; subtract 1 so the inner cells
      // map to 0..inCols-1 and the borders land off-screen (negative / >100%).
      b.style.left = ((c - 1 + 0.5) / inCols * 100) + '%';
      b.style.top = ((r - 1 + 0.5) / inRows * 100) + '%';
      // each drop is its own irregular pool, not a perfect circle
      const rr = () => 38 + Math.random() * 26;
      b.style.borderRadius = `${rr()}% ${rr()}% ${rr()}% ${rr()}% / ${rr()}% ${rr()}% ${rr()}% ${rr()}%`;
      ov.appendChild(b);
      blobs.push(b);
    }
  }
  return blobs;
}

export function initPageTransition() {
  const ov = document.getElementById('page-transition');
  if (!ov) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { ov.style.display = 'none'; return; }

  injectGoo();
  let blobs = buildBlobs(ov);

  /* — REVEAL: hold until loaded, then let the ink evaporate. — */
  let revealed = false;
  const reveal = () => {
    if (revealed || ov.dataset.leaving) return;
    revealed = true;
    gsap.set(blobs, { scale: 1.5 });         // pools fully merged = solid ink
    ov.classList.add('goo');                 // switch from solid bg to the live ink
    gsap.to(blobs, {
      scale: 0, duration: 1.15, ease: 'power3.inOut',
      rotation: () => gsap.utils.random(-30, 30),
      stagger: { each: 0.035, from: 'random' },
      onComplete: () => { ov.style.display = 'none'; },
    });
  };
  if (document.readyState === 'complete') setTimeout(reveal, 150);
  else window.addEventListener('load', () => setTimeout(reveal, 150));
  setTimeout(reveal, 2600);                  // safety: start the reveal even if load is slow
  setTimeout(() => { if (!ov.dataset.leaving) ov.style.display = 'none'; }, 4400);  // hard fallback

  /* — LEAVE: ink pools from the centre outward, then navigate. — */
  let leaving = false;
  const go = (href) => { if (leaving !== 'done') { leaving = 'done'; window.location.href = href; } };

  document.addEventListener('click', (e) => {
    if (leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href || a.target === '_blank' || a.hasAttribute('data-no-transition')) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;

    let url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;  // same page

    e.preventDefault();
    leaving = true;
    ov.dataset.leaving = '1';
    ov.style.display = 'block';
    ov.style.pointerEvents = 'auto';
    ov.classList.add('goo');                 // transparent bg + filter; the drops are the ink

    // The ink blooms from the link the visitor touched, not from nowhere:
    // find the drop nearest the click and ripple outward from it. The grid is
    // extended by a 1-cell ring, so map the click into inner cells, then shift
    // by +1 to its index in the full (ringed) grid.
    const cols = parseInt(ov.dataset.cols, 10) || 8;
    const rows = parseInt(ov.dataset.rows, 10) || 6;
    const inCols = parseInt(ov.dataset.inCols, 10) || cols - 2;
    const inRows = parseInt(ov.dataset.inRows, 10) || rows - 2;
    const ic = Math.min(inCols - 1, Math.max(0, Math.floor(e.clientX / window.innerWidth * inCols)));
    const ir = Math.min(inRows - 1, Math.max(0, Math.floor(e.clientY / window.innerHeight * inRows)));
    const origin = (ir + 1) * cols + (ic + 1);

    gsap.killTweensOf(blobs);
    gsap.set(blobs, { scale: 0 });
    gsap.to(blobs, {
      scale: 1.5, duration: 0.9, ease: 'power2.inOut',
      stagger: { each: 0.035, from: origin, grid: [rows, cols] },
      onComplete: () => go(a.href),
    });
    setTimeout(() => go(a.href), 1250);      // fallback if the tween can't run
  });

  // rebuild drops on resize so the grid keeps covering
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (!leaving && revealed) blobs = buildBlobs(ov); }, 300);
  });
}
