// 版本：v2　每次改版換新版本號，手機下次連網會自動更新
const CACHE = 'bd-notes-v2';
const FILES = [["a/index.json", "311d096988"], ["a/names.mp3", "ff24d518ca"], ["apple-touch-icon.png", "ba56aa96ad"], ["icon-192.png", "7e29e8527a"], ["icon-512.png", "08349ef569"], ["index.html", "fb4234d77b"], ["manifest.webmanifest", "867d6b8a75"], ["../fonts/fonts.css", "939240119c"], ["../fonts/noto-sans-bengali-bengali-400-normal.woff2", "adb805ae2e"], ["../fonts/noto-sans-bengali-bengali-600-normal.woff2", "abfa65f4f7"], ["../fonts/source-serif-4-latin-400-italic.woff2", "882b7c150c"], ["../fonts/source-serif-4-latin-400-normal.woff2", "02194deb92"], ["../fonts/source-serif-4-latin-600-normal.woff2", "f2b7e1cf1d"]];   // [路徑, 雜湊]
const SKIP = [];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const old = (await caches.keys()).filter(k => k !== CACHE && k.startsWith('bd-notes-'));
    for (const [p, h] of FILES) {
      const url = p + '?h=' + h;
      if (await c.match(url)) continue;
      let hit = null;
      for (const k of old) { hit = await (await caches.open(k)).match(url); if (hit) break; }   // 沒改的檔案不用重新下載
      if (hit) { await c.put(url, hit); continue; }
      const r = await fetch(url, { cache: 'no-cache' });
      if (!r.ok) throw new Error(p + ' ' + r.status);
      await c.put(url, r);
    }
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('bd-notes-')) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => {
  if (e.data === 'status') caches.open(CACHE).then(c => c.keys()).then(ks => e.source.postMessage({ type: 'status', have: ks.length, total: FILES.length, rel: 'v2' }));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;
  const sp = new URL(self.registration.scope).pathname;
  let p;
  if (u.pathname.startsWith(sp)) p = decodeURIComponent(u.pathname.slice(sp.length));
  else { const par = sp.replace(/[^/]+\/$/, ''); if (!u.pathname.startsWith(par)) return; p = '../' + decodeURIComponent(u.pathname.slice(par.length)); }
  if (SKIP.some(s => p.startsWith(s))) return;
  if (p === '' || p.endsWith('/')) p += 'index.html';
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const ent = FILES.find(f => f[0] === p);
    if (ent) { const hit = await c.match(ent[0] + '?h=' + ent[1]); if (hit) return hit; }
    try { return await fetch(req); }
    catch (err) {
      if (req.mode === 'navigate') { const h = await c.match('index.html?h=' + (FILES.find(f => f[0] === 'index.html') || [])[1]); if (h) return h; }
      throw err;
    }
  })());
});
