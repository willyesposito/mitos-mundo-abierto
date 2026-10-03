# Memoria — Mitos: mundo abierto

Leer al inicio de cada sesión. `CLAUDE.md` define el proyecto; acá va lo aprendido. Ante cualquier corrección de Willy sobre formato, criterio o reglas, anotar la norma antes de cerrar.

## Decisiones de arranque (2026-10)

- Repo propio, separado de Mundo de Mitos, para no heredar sus reglas (hub, estados de publicación, versión del service worker).
- Todo dibujado por código, sin imágenes. Cambiarlo a spritesheet después es barato.
- Varios perfiles locales (hasta 5), con clave de guardado propia.
- Título provisorio "Mitos: mundo abierto". Vive en `index.html`, `manifest.webmanifest`, `interfaz.js` (pantalla de perfiles) y `README.md`.
- La primera sesión construyó un **campo de pruebas** antes del puerto, la plaza y el palacio, para validar movimiento, salto, vuelo, empujar, embestir, coleccionables y guardado en un solo lugar.
- El catálogo de coleccionables es de marcador ("Objeto de prueba N"). El real lo define Chat.

## Reglas aprendidas de diseño y técnica

- **Un muro alto al sur de una zona la tapa.** En esta vista, una pared de tres niveles oculta unas dos filas hacia el norte. El borde sur del mapa es un parapeto bajo (`b`) por eso. Lo que debe verse detrás de una pared se resuelve con siluetas tenues del personaje y de los objetos dibujadas encima de todo.
- **Empujar solo sobre baldosas `,`**, con anillo de suelo común alrededor de cada zona de baldosas: así un bloque nunca queda trabado en una esquina sin salida.
- **Los saltos no alcanzan una terraza completa** (apex 0.71 niveles): subir a terrazas y techos es del vuelo. Las paredes miden 3 y el vuelo llega a 2.9, así que ningún poder las salta.
- Playwright vive fuera del repo (`/opt/node22/lib/node_modules/playwright`); `herramientas/probar.js` ya busca esa ruta.
- Para probar toques reales con dos dedos usar CDP: en `touchEnd`, `touchPoints` son los puntos que se sueltan, no los que quedan.
