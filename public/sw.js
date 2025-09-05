const CACHE_NAME = 'rosa-amiga-v1';
const RUNTIME_CACHE = 'runtime-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/manifest.webmanifest',
    ]))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (k !== CACHE_NAME && k !== RUNTIME_CACHE) ? caches.delete(k) : Promise.resolve())
    )).then(() => self.clients.claim())
  );
});

// Basic routing strategies
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Runtime cache for third-party model files and fonts
  const isModelOrFont = (
    url.hostname.endsWith('googleapis.com') ||
    url.hostname.endsWith('gstatic.com') ||
    url.hostname.endsWith('storage.googleapis.com')
  );

  if (isModelOrFont || req.destination === 'script' || req.destination === 'style') {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Images (stickers): cache-first
  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Navigation requests: network-first with cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((res) => {
    cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // fallback to app shell
    return caches.match('/index.html');
  }
}

