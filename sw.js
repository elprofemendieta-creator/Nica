// sw.js - Service Worker para Guía Pinolero
const CACHE_NAME = 'guia-pinolero-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/comunidad.html',
  '/mapa.html',
  '/temporal.html',
  '/css/inicio.css',
  '/css/comunidad.css',
  '/js/inicio.js',
  '/logo.gif',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Instalación: guarda los recursos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto, añadiendo recursos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activa el SW inmediatamente
  );
});

// Activación: limpia cachés antiguas
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de las páginas abiertas
  );
});

// Estrategia de caché: "Stale-while-revalidate"
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en caché, devuélvelo y actualiza en segundo plano
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Actualiza la caché con la respuesta de la red (si es válida)
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Si falla la red y no hay caché, puedes devolver una página offline
          if (event.request.mode === 'navigate') {
            // Para navegación, devuelve una página offline personalizada
            return caches.match('/offline.html');
          }
        });

        // Devuelve la respuesta en caché (si existe) o espera la red
        return response || fetchPromise;
      })
  );
});
