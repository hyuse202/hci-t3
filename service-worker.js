const CACHE_NAME = 't3-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  // CSS modules
  './css/tokens.css',
  './css/layout.css',
  './css/topbar.css',
  './css/panel.css',
  './css/buttons.css',
  './css/route-info.css',
  './css/voucher.css',
  './css/edit-mode.css',
  './css/map.css',
  './css/markers.css',
  './css/floor-tabs.css',
  './css/search.css',
  './css/route-card.css',
  // JS modules
  './js/config.js',
  './js/data.js',
  './js/state.js',
  './js/pathfinding.js',
  './js/map.js',
  './js/markers.js',
  './js/selection.js',
  './js/route.js',
  './js/gps.js',
  './js/custom-nodes.js',
  './js/search.js',
  './js/ui.js',
  './js/sw-register.js',
  './js/app.js',
  // PWA assets
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/assets/floor-')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') || url.pathname.endsWith('.json') || url.pathname.endsWith('.png')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
