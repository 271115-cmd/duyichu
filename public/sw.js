/* ============================================================
   sw.js — 都一处 Duyichu service worker
   ------------------------------------------------------------
   Makes the site installable, fast on repeat visits, and usable
   offline — all same-origin, no external requests (China-safe).
   Strategy:
     • navigations (HTML)  → network-first, fall back to cache,
       then a branded offline page. Pages stay FRESH online.
     • static assets       → stale-while-revalidate: serve the
       cached copy instantly, refresh it in the background.
   Cache is versioned; bump VERSION to invalidate on deploy.
   ============================================================ */

const VERSION = 'duyichu-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll([OFFLINE, '/icon.svg', '/icon-192.png'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;        // only ever touch same-origin

  // HTML navigations — always try the network first so content stays fresh
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(OFFLINE)))
    );
    return;
  }

  // Everything else (CSS/JS/fonts/models/images/SVG) — stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// let the page trigger an immediate activation after an update
self.addEventListener('message', (e) => { if (e.data === 'skip-waiting') self.skipWaiting(); });
