// ============================================================
// SERVICE WORKER — Dashboard Keuangan Mushola
// Strategi:
//  - App shell (html/css/js/ikon buatan sendiri) -> cache-first,
//    supaya tetap kebuka meski offline/koneksi lemot di dalam mushola.
//  - Data Supabase & library CDN (unpkg dsb) -> selalu network,
//    TIDAK di-cache. Data keuangan harus selalu yang terbaru.
// ============================================================

const CACHE_NAME = 'kas-mushola-v5';
const APP_SHELL = [
  './index.html',
  './css/style.css',
  './js/supabase-client.js',
  './js/public.js',
  './js/admin.js',
  './js/pwa.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cuma tangani request GET ke origin sendiri (app shell).
  // Request ke Supabase/CDN pihak lain dibiarkan lewat browser apa adanya.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request, { redirect: 'follow' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached || new Response(
          'Sedang offline dan halaman ini belum tersimpan di cache.',
          { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        ));

      // Cache-first: langsung balikin versi cache kalau ada, sambil
      // diam-diam update cache di background dari network.
      return cached || fetchPromise;
    })
  );
});
