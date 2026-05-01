const CACHE = 'quran-pwa-v1';
const SHELL = [
  '/favicon.svg',
  '/icons/icon.svg',
  '/manifest.json',
  '/quran_motivation_ar.html',
  '/3amal-ayat/',
  '/3amal-ayat/index.html',
  '/3amal-ayat/manifest.json',
  '/3amal-ayat/amal_data.json',
  '/3amal-ayat/quran-tadabbur-wa-amal.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] install cache error:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin or the icon
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: serve cached page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/3amal-ayat/index.html')
            .then(r => r || caches.match('/quran_motivation_ar.html'));
        }
      });
    })
  );
});
