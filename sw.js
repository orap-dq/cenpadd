// =============================================================
//  sw.js — Service worker del CENPADD
//  Es el "ayudante de guardia": guarda una copia de la app en el
//  celular para que abra aunque no haya internet.
// =============================================================

// Cada vez que cambies cualquier archivo de la app, sube este número
// (v1 → v2 → v3...). Así los celulares saben que hay versión nueva.
const VERSION = 'cenpadd-v2';

// Archivos que se guardan en el celular
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// 1) Instalación: se descarga y guarda la copia
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ARCHIVOS))
  );
  self.skipWaiting(); // activar la versión nueva sin esperar
});

// 2) Activación: se borran las copias de versiones anteriores
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// 3) Cada vez que la app pide un archivo:
//    primero intenta internet (para tener lo más nuevo);
//    si no hay señal, usa la copia guardada.
self.addEventListener('fetch', (evento) => {
  // Solo archivos de la propia app. Las peticiones a CENPADD Central (POST a Google)
  // pasan directo, sin guardarse.
  if (evento.request.method !== 'GET') return;
  if (new URL(evento.request.url).origin !== self.location.origin) return;
  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(VERSION).then((cache) => cache.put(evento.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(evento.request))
  );
});
