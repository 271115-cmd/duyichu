/* Post-build: stamp a fresh VERSION into dist/sw.js so the service worker
   invalidates its caches on every deploy (returning visitors get the new
   assets instead of a stale 'duyichu-v1'). Source public/sw.js keeps a
   placeholder; only the built copy is stamped, so source stays clean. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = new URL('../dist/sw.js', import.meta.url);
if (!existsSync(FILE)) {
  console.warn('[stamp-sw] dist/sw.js not found — skipped');
  process.exit(0);
}
const stamp = 'duyichu-' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
let src = readFileSync(FILE, 'utf8');
const next = src.replace(/const VERSION = ['"][^'"]*['"]/, `const VERSION = '${stamp}'`);
if (next === src) {
  console.warn("[stamp-sw] no `const VERSION = '...'` line found in dist/sw.js — skipped");
} else {
  writeFileSync(FILE, next);
  console.log('[stamp-sw] dist/sw.js VERSION →', stamp);
}
