/* ============================================================
   Post-build: generate per-LANGUAGE static HTML so crawlers index
   each language (not just English) and non-English searchers land
   on a pre-translated page.

   For every page it emits, at build time, a fully translated copy
   under /<lang>/ (e.g. dist/zh/menu.html → served at /zh/menu.html),
   with the visible [data-i18n] text, placeholders, aria-labels and
   <title> baked in, internal links rewritten to stay in-language,
   and reciprocal hreflang + canonical links. English stays at the
   root (/, /menu.html …) as x-default. The runtime i18n still drives
   the in-session chrome; the language switcher NAVIGATES between
   these URLs (see i18n.js), which is consistent with the site's
   full-page-load navigation.

   Set SITE_URL=https://your-domain to emit ABSOLUTE hreflang/canonical
   (recommended for production); unset → relative URLs.
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { T, CODES, FOUNDED } from '../src/i18n.js';

const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || '').replace(/\/$/, '');
const YEAR = new Date().getFullYear();
const fillTokens = (s) => (s.indexOf('{') === -1 ? s : s.replace(/\{YEARS\}/g, YEAR - FOUNDED).replace(/\{NOW\}/g, YEAR));

// the five entry pages; `seg` is the path after the language prefix
const PAGES = [
  { file: 'index.html', seg: '', desc: 'meta.home' },
  { file: 'heritage.html', seg: 'heritage', desc: 'meta.heritage' },
  { file: 'menu.html', seg: 'menu', desc: 'meta.menu' },
  { file: 'gifts.html', seg: 'gifts', desc: 'meta.gifts' },
  { file: 'contact.html', seg: 'contact', desc: 'meta.contact' },
];
const SEGS = PAGES.map((p) => p.seg);

const urlFor = (seg, lang) => SITE_URL + (lang === 'en' ? '/' + seg : '/' + lang + '/' + seg);
const htmlLangAttr = (lang) => (lang === 'zh' ? 'zh-CN' : lang);

// Rewrite a source internal link ("/menu.html", "/menu.html#x", "/") to the
// EXTENSIONLESS, in-language form Cloudflare static-assets serves at 200
// ("/zh/menu", "/zh/") so navigation never 307-redirects. Anchors (#x),
// tel:/mailto:/http(s) and unknown paths are left untouched.
const PAGE_FILES = PAGES.filter((p) => p.file !== 'index.html').map((p) => p.file);
function rewriteHref(href, lang) {
  if (typeof href !== 'string' || !href.startsWith('/')) return href;
  const pre = lang === 'en' ? '' : '/' + lang;
  if (href === '/' || href === '/index.html') return pre + '/';
  for (const f of PAGE_FILES) {
    const base = '/' + f;                        // "/menu.html"
    const ext = '/' + f.replace(/\.html$/, '');  // "/menu"
    if (href === base) return pre + ext;
    if (href.startsWith(base + '#') || href.startsWith(base + '?')) return pre + ext + href.slice(base.length);
  }
  return href;
}

let written = 0;
for (const page of PAGES) {
  const srcPath = 'dist/' + page.file;
  if (!existsSync(srcPath)) { console.warn('[prerender] missing', srcPath); continue; }
  const original = readFileSync(srcPath, 'utf8');
  const m = original.match(/^\s*<!doctype html>/i);
  const doctype = m ? m[0].trim() + '\n' : '<!doctype html>\n';

  for (const lang of CODES) {
    const root = parse(original, { comment: true, voidTag: { closingSlash: true } });
    const htmlEl = root.querySelector('html');
    const head = root.querySelector('head');
    const body = root.querySelector('body');
    if (!htmlEl || !head) continue;

    htmlEl.setAttribute('lang', htmlLangAttr(lang));
    htmlEl.setAttribute('data-prelang', lang);

    if (lang !== 'en') {
      // visible translatable text
      root.querySelectorAll('[data-i18n]').forEach((el) => {
        const tr = T[el.getAttribute('data-i18n')];
        if (tr && tr[lang] != null) el.set_content(fillTokens(tr[lang]));
      });
      // placeholders / aria-labels / alt
      root.querySelectorAll('[data-i18n-ph]').forEach((el) => {
        const tr = T[el.getAttribute('data-i18n-ph')]; if (tr && tr[lang] != null) el.setAttribute('placeholder', fillTokens(tr[lang]));
      });
      root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        const tr = T[el.getAttribute('data-i18n-aria')]; if (tr && tr[lang] != null) el.setAttribute('aria-label', fillTokens(tr[lang]));
      });
      root.querySelectorAll('[data-i18n-alt]').forEach((el) => {
        const tr = T[el.getAttribute('data-i18n-alt')]; if (tr && tr[lang] != null) el.setAttribute('alt', fillTokens(tr[lang]));
      });
      // <title> (+ og:title / twitter:title) from the page's data-title-key
      const tk = body && body.getAttribute('data-title-key');
      if (tk && T[tk] && T[tk][lang] != null) {
        const lt = fillTokens(T[tk][lang]);
        const titleEl = root.querySelector('title');
        if (titleEl) titleEl.set_content(lt);
        root.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((mt) => mt.setAttribute('content', lt));
      }
      // meta description (+ og:description / twitter:description)
      if (page.desc && T[page.desc] && T[page.desc][lang] != null) {
        const ld = fillTokens(T[page.desc][lang]);
        root.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach((mt) => mt.setAttribute('content', ld));
      }
    }
    // Rewrite ALL internal page links to the extensionless, in-language form —
    // runs for en too, so en pages link to /menu (not /menu.html) → no 307 hop.
    root.querySelectorAll('a[href]').forEach((a) => { a.setAttribute('href', rewriteHref(a.getAttribute('href'), lang)); });

    // hreflang alternates + x-default + self canonical
    const links = [`<link rel="canonical" href="${urlFor(page.seg, lang)}">`];
    for (const c of CODES) links.push(`<link rel="alternate" hreflang="${c}" href="${urlFor(page.seg, c)}">`);
    links.push(`<link rel="alternate" hreflang="x-default" href="${urlFor(page.seg, 'en')}">`);
    head.insertAdjacentHTML('beforeend', '\n  ' + links.join('\n  ') + '\n');

    const out = doctype + root.toString();
    if (lang === 'en') {
      writeFileSync(srcPath, out);                       // overwrite root page (adds hreflang/canonical)
    } else {
      mkdirSync('dist/' + lang, { recursive: true });
      writeFileSync('dist/' + lang + '/' + page.file, out);
    }
    written++;
  }
}
console.log(`[prerender] wrote ${written} localized page(s) across ${CODES.length} languages (SITE_URL="${SITE_URL || '(relative)'}")`);

// A proper multilingual sitemap (with per-URL hreflang alternates) requires
// ABSOLUTE same-host URLs — only emit it when SITE_URL is set; otherwise the
// public/sitemap.xml template (fill in your domain) is shipped as-is.
if (SITE_URL) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = PAGES.flatMap((page) => CODES.map((lang) => {
    const alts = CODES.map((c) => `    <xhtml:link rel="alternate" hreflang="${c}" href="${urlFor(page.seg, c)}"/>`).join('\n');
    return `  <url>\n    <loc>${urlFor(page.seg, lang)}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alts}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(page.seg, 'en')}"/>\n  </url>`;
  })).join('\n');
  writeFileSync('dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`);
  console.log(`[prerender] wrote multilingual dist/sitemap.xml (${PAGES.length * CODES.length} URLs)`);
}
