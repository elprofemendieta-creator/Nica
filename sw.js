const CACHE_NAME = 'guia-pinolera-v1';

const urlsToCache = [
  // PÁGINA PRINCIPAL
  '/',
  '/index.html',
  '/css/inicio.css',
  '/js/inicio.js',
  '/logo+.png',
  '/carga.gif',
  '/offline.html',
  
  // ===== MAPAS =====
  '/mapa.html',
  '/css/mapa.css',        // ← Si tienes CSS específico
  '/js/mapa.js',          // ← Si tienes JS específico
  '/mapa/',
  
  // ===== JUEGOS =====
  '/juegos/juegos.html',
  '/juegos/juegos.css',   // ← Si tienes CSS específico
  '/juegos/juegos.js',     // ← Si tienes JS específico
  '/juegos/',
  
  // ===== VISITAS =====
  '/visitas/index.html',
  '/visitas/',
  
  // ===== DESTINOS (subpáginas) =====
  '/lugares/granada.html',
  '/lugares/ometepe.html',
  '/lugares/diriamba.html',
  '/lugares/sanjuan.html',
  '/lugares/indiomaiz.html',
  '/lugares/masaya.html',
  '/lugares/',
  
  // ===== NEGOCIOS =====
  '/negocios/el-churrasco.html',
  '/negocios/artesanias-nica.html',
  '/negocios/turismo-express.html',
  '/negocios/spa-natural.html',
  '/negocios/cafe-central.html',
  '/negocios/',
  
  // ===== COMUNIDAD =====
  '/comunidad.html',
  
  // ===== RECURSOS EXTERNOS =====
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js',
  'https://udify.app/embed.min.js'
];

// INSTALAR
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cacheando archivos de Guía Pinolera (incluye mapas y juegos)');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVAR
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH - Caché primero, luego red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match('/offline.html');
          });
      })
  );
});
