// Service worker: deja el juego jugable sin conexión. Subir VERSION en cada deploy real.
const VERSION = '9';
const CACHE = 'mitos-mundo-abierto-' + VERSION;
const ARCHIVOS = [
  './', 'index.html', 'estilos.css', 'principal.js', 'mundo.js', 'dibujo.js', 'interfaz.js', 'controles.js',
  'nucleo.js', 'iconos.js', 'sonido.js', 'manifest.webmanifest',
  'datos/personajes.json', 'datos/coleccionables.json', 'datos/mapa-pruebas.json', 'datos/mapa-puerto.json', 'datos/mapa-plaza.json', 'datos/mapa-palacio.json',
  'sprites/personajes/pegaso.svg', 'sprites/personajes/minotauro.svg', 'sprites/personajes/ariadna.svg', 'sprites/personajes/fenix.svg', 'sprites/personajes/eco.svg',
  'sprites/escenario/argolla-viva.svg', 'sprites/escenario/argolla.svg', 'sprites/escenario/baldosa-0.svg', 'sprites/escenario/baldosa-1.svg', 'sprites/escenario/barca.svg', 'sprites/escenario/bloque.svg', 'sprites/escenario/brasero-apagado.svg', 'sprites/escenario/brasero-encendido.svg', 'sprites/escenario/cara-techo-0.svg', 'sprites/escenario/cara-techo-1.svg', 'sprites/escenario/cara-terraza.svg', 'sprites/escenario/coleccionable.svg', 'sprites/escenario/escombros.svg', 'sprites/escenario/fuente-caracola.svg', 'sprites/escenario/fuente-cimbalo.svg', 'sprites/escenario/grieta.svg', 'sprites/escenario/llama.svg', 'sprites/escenario/losa-suelo-0.svg', 'sprites/escenario/losa-suelo-1.svg', 'sprites/escenario/losa-suelo-2.svg', 'sprites/escenario/losa-suelo-3.svg', 'sprites/escenario/losa-techo-0.svg', 'sprites/escenario/losa-techo-1.svg', 'sprites/escenario/losa-techo-2.svg', 'sprites/escenario/losa-terraza-0.svg', 'sprites/escenario/losa-terraza-1.svg', 'sprites/escenario/losa-terraza-2.svg', 'sprites/escenario/mar.svg', 'sprites/escenario/placa-activa.svg', 'sprites/escenario/placa.svg', 'sprites/escenario/puerta-sol.svg', 'sprites/escenario/puerta-sonido.svg', 'sprites/escenario/reja-cerrada.svg', 'sprites/escenario/sillar-0.svg', 'sprites/escenario/sillar-1.svg', 'sprites/escenario/sillar-2.svg', 'sprites/escenario/sillar-3.svg', 'sprites/escenario/sillar-claro-0.svg', 'sprites/escenario/sillar-claro-1.svg', 'sprites/escenario/sillar-claro-2.svg', 'sprites/escenario/sillar-claro-3.svg', 'sprites/escenario/tope-0.svg', 'sprites/escenario/tope-1.svg', 'sprites/escenario/tope-2.svg', 'sprites/escenario/tope-3.svg', 'sprites/escenario/tope-claro-0.svg', 'sprites/escenario/tope-claro-1.svg', 'sprites/escenario/umbral-reja.svg', 'sprites/escenario/umbral-sol.svg', 'sprites/escenario/vasija.svg',
  'sprites/personajes/pegaso-ala-cerca.svg', 'sprites/personajes/pegaso-ala-lejos.svg', 'sprites/personajes/fenix-ala-cerca.svg', 'sprites/personajes/fenix-ala-lejos.svg',
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
