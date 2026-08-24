const CACHE_NAME = 'tocc-def-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  // Activa el nuevo SW inmediatamente sin esperar que se cierren las pestañas
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  // Toma control de todas las pestañas abiertas inmediatamente
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // Siempre intenta traer versión nueva de la red en paralelo
      var fetchPromise = fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        return cached;
      });
      // Responde con caché primero (rápido), pero actualiza en segundo plano
      return cached || fetchPromise;
    })
  );
});

// Escucha mensajes de la página (para forzar recarga)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
