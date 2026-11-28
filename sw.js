// 版本：r2　每次改版換新版本號，手機下次連網會自動更新
const CACHE = 'bd-app-r2';
const FILES = [["bible/a/bn-jhn8.mp3", "ed608de223"], ["bible/a/bn-mat1.mp3", "f30f6cfa1a"], ["bible/a/bn-mat2.mp3", "055d8c87d2"], ["bible/a/bn-mat3.mp3", "8a0eaf175e"], ["bible/a/bn-mat4.mp3", "9475c24696"], ["bible/a/en-jhn8.mp3", "0bff5c450d"], ["bible/a/en-mat1.mp3", "571aa68543"], ["bible/a/en-mat2.mp3", "30d754331d"], ["bible/a/en-mat3.mp3", "d940f3cf46"], ["bible/a/en-mat4.mp3", "4f437d08c1"], ["bible/a/words-en.mp3", "0f80482e4e"], ["bible/index.html", "269b2f221d"], ["fonts/barlow-condensed-latin-600-normal.woff2", "215a93c696"], ["fonts/barlow-condensed-latin-700-normal.woff2", "3787a5a419"], ["fonts/fonts.css", "7f1c98726a"], ["fonts/noto-sans-bengali-bengali-400-normal.woff2", "adb805ae2e"], ["fonts/noto-sans-bengali-bengali-600-normal.woff2", "abfa65f4f7"], ["fonts/source-serif-4-latin-400-italic.woff2", "882b7c150c"], ["fonts/source-serif-4-latin-400-normal.woff2", "02194deb92"], ["fonts/source-serif-4-latin-600-normal.woff2", "f2b7e1cf1d"], ["icons/apple-touch-icon.png", "65759c1b47"], ["icons/icon-192.png", "cef1e18387"], ["icons/icon-512.png", "dfcfe9871c"], ["index.html", "3e3d6d430c"], ["install.html", "4a8a18b49c"], ["manifest.webmanifest", "ea5dddfb7d"], ["phrases/a/index.json", "cbc98a7540"], ["phrases/a/nums.mp3", "4c9ad7ae08"], ["phrases/a/p-air.mp3", "34ca00aa5a"], ["phrases/a/p-campus.mp3", "3d7d6b1867"], ["phrases/a/p-food.mp3", "0b9096a519"], ["phrases/a/p-friend.mp3", "bef527a76f"], ["phrases/a/p-go.mp3", "00e97c3bfc"], ["phrases/a/p-gospel.mp3", "3da640563a"], ["phrases/a/p-greet.mp3", "0eae82c6b7"], ["phrases/a/p-sos.mp3", "9978ca48eb"], ["phrases/index.html", "3569354a78"], ["qr-app.png", "e78cb09c01"]];   // [路徑, 雜湊]
const SKIP = ["n-r8d2/", "t-6w4j/"];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const old = (await caches.keys()).filter(k => k !== CACHE && k.startsWith('bd-app-'));
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
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('bd-app-')) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => {
  if (e.data === 'status') caches.open(CACHE).then(c => c.keys()).then(ks => e.source.postMessage({ type: 'status', have: ks.length, total: FILES.length, rel: 'r2' }));
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
