/* Filled by generate-mck.mjs; scoped to the MCK deck only. Supabase and esm.sh requests are not intercepted. */
const VERSION = '96681e2639024151fecc';
const CACHE = `sg-mck-deck-${VERSION}`;
const PREFIX = 'sg-mck-deck-';
const ROOT = '/mck/deck/';
const PRECACHE = ["/mck/deck/","/mck/deck/index.html","/mck/deck/releases/96681e2639024151fecc/assets/app-campsite.webp","/mck/deck/releases/96681e2639024151fecc/assets/app-discover.webp","/mck/deck/releases/96681e2639024151fecc/assets/app-guide.webp","/mck/deck/releases/96681e2639024151fecc/assets/app-map.webp","/mck/deck/releases/96681e2639024151fecc/assets/app-park.webp","/mck/deck/releases/96681e2639024151fecc/assets/app-parks.webp","/mck/deck/releases/96681e2639024151fecc/assets/app-route3d.webp","/mck/deck/releases/96681e2639024151fecc/assets/app-trail.webp","/mck/deck/releases/96681e2639024151fecc/assets/app-trails.webp","/mck/deck/releases/96681e2639024151fecc/assets/fonts/Forta.woff","/mck/deck/releases/96681e2639024151fecc/assets/fonts/Jost-400-Book.ttf","/mck/deck/releases/96681e2639024151fecc/assets/fonts/Jost-500-Medium.ttf","/mck/deck/releases/96681e2639024151fecc/assets/fonts/Jost-600-Semi.ttf","/mck/deck/releases/96681e2639024151fecc/assets/fonts/Jost-700-Bold.ttf","/mck/deck/releases/96681e2639024151fecc/assets/icon-180.png","/mck/deck/releases/96681e2639024151fecc/assets/icon-192.png","/mck/deck/releases/96681e2639024151fecc/assets/icon-512.png","/mck/deck/releases/96681e2639024151fecc/assets/photo-aberdare-moorland.webp","/mck/deck/releases/96681e2639024151fecc/assets/photo-gps-phones.webp","/mck/deck/releases/96681e2639024151fecc/assets/photo-junction-sign.webp","/mck/deck/releases/96681e2639024151fecc/assets/photo-log-bridge.webp","/mck/deck/releases/96681e2639024151fecc/assets/photo-summit-kipipiri.webp","/mck/deck/releases/96681e2639024151fecc/assets/photo-trail-marker.webp","/mck/deck/releases/96681e2639024151fecc/deck.css","/mck/deck/releases/96681e2639024151fecc/deck.js","/mck/deck/releases/96681e2639024151fecc/fonts.css","/mck/deck/releases/96681e2639024151fecc/slides.css","/mck/deck/releases/96681e2639024151fecc/manifest.webmanifest"];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE.map(url => new Request(url, {cache:'reload'})));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
async function cachedAsset(request) {
  const names = await caches.keys();
  for (const name of [CACHE, ...names.filter(name => name.startsWith(PREFIX) && name !== CACHE)]) {
    const response = await (await caches.open(name)).match(request);
    if (response) return response;
  }
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(ROOT)) return;
  const isPage = event.request.mode === 'navigate' && [ROOT, `${ROOT}index.html`].includes(url.pathname);
  if (isPage) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request);
        if (!response.ok) throw new Error('Deck navigation failed');
        const html = await response.clone().text();
        if (html.includes(`<meta name="deck-version" content="${VERSION}">`)) await cache.put(ROOT, response.clone());
        return response;
      } catch {
        return (await cache.match(ROOT)) || Response.error();
      }
    })());
  } else if (url.pathname.startsWith(`${ROOT}releases/`)) {
    event.respondWith((async () => (await cachedAsset(event.request)) || fetch(event.request))());
  }
});
