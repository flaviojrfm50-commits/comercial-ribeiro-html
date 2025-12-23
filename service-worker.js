const CACHE_NAME = 'catalogo-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/produtos.json',
  '/service-worker.js',
  '/imagens/icon-192.png',
  '/imagens/icon-512.png'
];

// Adicione também as imagens dos produtos ao cache
urlsToCache.push(
  '/imagens/Castanha do Pará.jpg',
  '/imagens/Uva Passa Preta.jpg',
  '/imagens/Pasta de Amendoim.jpg'
);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
