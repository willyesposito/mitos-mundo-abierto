// Service worker: deja el juego jugable sin conexión. Subir VERSION en cada deploy real.
const VERSION = '3';
const CACHE = 'mitos-mundo-abierto-' + VERSION;
const ARCHIVOS = [
  './', 'index.html', 'estilos.css', 'principal.js', 'mundo.js', 'dibujo.js', 'interfaz.js', 'controles.js',
  'nucleo.js', 'iconos.js', 'sonido.js', 'manifest.webmanifest',
  'datos/personajes.json', 'datos/coleccionables.json', 'datos/mapa-pruebas.json',
  'iconos/icono.svg', 'iconos/icono-192.png', 'iconos/icono-512.png',
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(caches.match(ev.request, { ignoreSearch: true }).then(r => r || fetch(ev.request)));
});
