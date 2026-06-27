/* ============================================================
   scrollprogress.js — a slim reading-progress bar
   ------------------------------------------------------------
   A subtle 3px bar across the top that fills as you scroll —
   an orientation aid (helpful at any age) that also tints to the
   current section's colour. Works with or without Lenis/WebGL.
   ============================================================ */

export function initScrollProgress() {
  if (document.getElementById('scroll-progress')) return;
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? window.scrollY / h : 0;
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p)).toFixed(4)})`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  document.fonts && document.fonts.ready.then(update);
  update();
}
