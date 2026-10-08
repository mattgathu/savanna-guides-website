/* Filled by generate-mck.mjs; scoped to the MCK deck only. Supabase and esm.sh requests are not intercepted. */
const VERSION = '9acb533cabcb606fd8ab';
const CACHE = `sg-mck-deck-${VERSION}`;
const PREFIX = 'sg-mck-deck-';
const ROOT = '/mck/deck/';
const PRECACHE = ["/mck/deck/","/mck/deck/index.html","/mck/deck/releases/9acb533cabcb606fd8ab/assets/app-campsite.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/app-discover.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/app-guide.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/app-map.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/app-park.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/app-parks.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/app-route3d.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/app-trail.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/fonts/Forta.woff","/mck/deck/releases/9acb533cabcb606fd8ab/assets/fonts/Jost-400-Book.ttf","/mck/deck/releases/9acb533cabcb606fd8ab/assets/fonts/Jost-500-Medium.ttf","/mck/deck/releases/9acb533cabcb606fd8ab/assets/fonts/Jost-600-Semi.ttf","/mck/deck/releases/9acb533cabcb606fd8ab/assets/fonts/Jost-700-Bold.ttf","/mck/deck/releases/9acb533cabcb606fd8ab/assets/icon-180.png","/mck/deck/releases/9acb533cabcb606fd8ab/assets/icon-192.png","/mck/deck/releases/9acb533cabcb606fd8ab/assets/icon-512.png","/mck/deck/releases/9acb533cabcb606fd8ab/assets/photo-aberdare-moorland.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/photo-acacia-sunset.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/photo-flamingos.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/photo-rhinos.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/photo-tea-waterfall.webp","/mck/deck/releases/9acb533cabcb606fd8ab/assets/photo-waterfall-pool.webp","/mck/deck/releases/9acb533cabcb606fd8ab/deck.css","/mck/deck/releases/9acb533cabcb606fd8ab/deck.js","/mck/deck/releases/9acb533cabcb606fd8ab/fonts.css","/mck/deck/releases/9acb533cabcb606fd8ab/slides.css","/mck/deck/releases/9acb533cabcb606fd8ab/manifest.webmanifest"];

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
