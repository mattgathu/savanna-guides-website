/* Filled by generate-partners-deck.mjs; scoped to this presentation only. */
const VERSION = '2f0300d9b660a1ecd0fc';
const CACHE = `sg-partners-deck-${VERSION}`;
const PREFIX = 'sg-partners-deck-';
const ROOT = '/partners/deck/';
const PRECACHE = ["/partners/deck/","/partners/deck/index.html","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/app-campsite.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/app-discover.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/app-map-aberdare.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/app-park-aberdare.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/app-parks.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/app-trail-elephant-hill.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Caprasimo-latin-ext.woff2","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Caprasimo-latin.woff2","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Forta.woff","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Jost-300-Light.ttf","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Jost-400-Book.ttf","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Jost-400-BookItalic.ttf","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Jost-500-Medium.ttf","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Jost-600-Semi.ttf","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/fonts/Jost-700-Bold.ttf","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/icon-180.png","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/icon-192.png","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/icon-512.png","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/photo-aberdare-moorland.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/photo-acacia-sunset.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/photo-flamingos.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/photo-rhinos.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/photo-tea-waterfall.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/assets/photo-waterfall-pool.webp","/partners/deck/releases/2f0300d9b660a1ecd0fc/deck.css","/partners/deck/releases/2f0300d9b660a1ecd0fc/deck.js","/partners/deck/releases/2f0300d9b660a1ecd0fc/fonts.css","/partners/deck/releases/2f0300d9b660a1ecd0fc/qr-vcard.svg","/partners/deck/releases/2f0300d9b660a1ecd0fc/slides.css","/partners/deck/releases/2f0300d9b660a1ecd0fc/manifest.webmanifest"];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE.map(url => new Request(url, {cache:'reload'})));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
    // Updates wait until the previous presentation's tabs have closed.
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
  // A waiting update may have already cached resources for newer network HTML.
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
        // Never overwrite this release's offline HTML with an incompletely installed update.
        if (html.includes(`<meta name="deck-version" content="${VERSION}">`)) await cache.put(ROOT, response.clone());
        return response;
      } catch {
        return (await cache.match(ROOT)) || Response.error();
      }
    })());
  } else if (url.pathname.startsWith(`${ROOT}releases/`)) {
    event.respondWith((async () => {
      const cached = await cachedAsset(event.request);
      if (cached) return cached;
      return fetch(event.request);
    })());
  }
});
