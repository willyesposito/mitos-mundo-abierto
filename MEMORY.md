# Memoria — Mitos: mundo abierto

Leer al inicio de cada sesión. `CLAUDE.md` define el proyecto; acá va lo aprendido. Las decisiones tomadas van en `DECISIONS.md`, el estado de las sesiones en `ROADMAP.md`.

Ante cualquier corrección de Willy sobre formato, criterio o reglas, anotar la norma antes de cerrar, con el porqué en la misma línea: sin el porqué, la próxima sesión no sabe cuándo aplicarla ni cuándo no. Una norma que cambia se corrige en su línea; no se agrega otra al lado.

Las decisiones de arranque (repo propio, todo dibujado por código, perfiles, título provisorio, campo de pruebas) pasaron a `DECISIONS.md`, D9 a D13. El catálogo de marcador se reemplazó por el real.

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
- **Varios mapas:** el perfil guarda `mapa`, `llegada` (dónde aparece al recargar) y `eco` (el sonido de Eco viaja entre mapas). Todos los mapas deben declarar los mismos `sonidos`, o el sonido guardado se pierde al cruzar. El campo de pruebas no se guarda como mapa actual: recargar desde ahí vuelve a la partida.
- Recintos con pared de 3 no se sobrevuelan (vuelo máx. 2,9): sirven para que un desafío sea exclusivo de su personaje.
- **Contador de partida:** cuenta solo puerto, plaza y palacio (7). El campo de pruebas cuenta aparte: en él se oculta el chip Total y la zona muestra 0/3 o 3/3.
- **Fuente que se activa al llegar volando:** `golpea: "volar"` en una fuente `golpe` (vale Pegaso o Fénix en vuelo). Queda vibrando y se guarda.
- **Pared `b` (parapeto bajo) bloquea como pared pero se dibuja baja:** sirve de pantalla delante de una puerta sin taparla. Los desafíos de a dos se verifican con cada personaje solo, en orden que no gaste el paso propio (Fénix y Ariadna al final).
- **Muro agrietado sobre una terraza:** al romperse queda a ras de suelo, así que lo que está detrás debe estar a nivel 0.
- **`probar.js` tarda varios minutos.** Con un límite de 120 s se cortó a mitad ("Target page, context or browser has been closed"); sin límite dio 142 chequeos OK y ninguna falla (observado el 2026-10-03). No correrlo con un límite de tiempo corto.

## Proceso

- **El subagente no ve la conversación.** Un encargo incompleto produce trabajo equivocado: cada encargo trae los archivos a tocar, las reglas que aplican, las decisiones ya tomadas, qué queda fuera y el criterio de terminado.
