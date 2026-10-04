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
- **El mundo se guarda por perfil y por mapa** en `perfil.mundos[idMapa]`, con una clave por mecanismo (`muros`, `rejas`, `empujables`). Los empujables se identifican por su casilla original del mapa, así que mover un `B` o `V` en el JSON de un mapa ya jugado deja huérfano su guardado. Un poder nuevo con estado (braseros, sogas, sonidos) suma su propia clave en `estado()` de `mundo.js` y su evento en `procesarEventos`.
- Al restaurar, una reja guardada como abierta se abre sin evento: si no, al volver aparecería otra vez el aviso.
- Para probar toques reales con dos dedos usar CDP: en `touchEnd`, `touchPoints` son los puntos que se sueltan, no los que quedan.
- **Poderes de toque y mantenido (Fénix):** un toque corto (menos de 0,2 s) brilla y mantener vuela; se decide al soltar, y el toque dentro de un mismo cuadro cuenta.
- **Sogas:** el carril de una soga se camina midiendo solo el centro, con tolerancia de desnivel; la escala necesita al menos 2 casillas entre argollas (cada paso sube menos de 0,55).
- **Un muro agrietado se rompe estando en el piso de su casilla vecina**, no solo a ras de suelo: sirve en terrazas.
- **Eco escucha al entrar en alcance** (no mientras está cerca), así guarda lo último que oyó; al cambiar a Eco se reinicia.
- **El pseudoelemento `::after` de `.tarjeta` tapa botones**: en tarjetas con botones abajo ocultarlo.
- **Catálogo real con `"ubicado": false`** no cuenta en contadores hasta que esté puesto en un mapa.
