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
- **Un solo mundo (D23):** el perfil guarda `mapa` (`mundo` o, solo de paso, `pruebas`), `llegada` y `eco`. Como ya no hay cruces, `llegada` es el último piso firme: se guarda al cruzar de zona, al abrir el menú, al esconder la página, tras cada cambio del mundo y cada 2 casillas. La zona sale de la fila donde está parado el personaje (`zonas` del mapa). Los perfiles de antes se migran una vez en `nucleo.js` (`migrarAlMundo`, marca `perfil.mundoUnido`) sumando el desplazamiento de cada zona; las claves viejas de `mundos` quedan sin borrar. El mundo y el campo de pruebas deben declarar los mismos `sonidos`, o el sonido de Eco se pierde al ir y volver. Mover una zona dentro del mundo después de esto rompe la migración de quien no jugó desde antes.
- Recintos con pared de 3 no se sobrevuelan (vuelo máx. 2,9): sirven para que un desafío sea exclusivo de su personaje.
- **Contador de partida:** cuenta solo puerto, plaza y palacio (7). El campo de pruebas cuenta aparte: en él se oculta el chip Total y la zona muestra 0/3 o 3/3.
- **Fuente que se activa al llegar volando:** `golpea: "volar"` en una fuente `golpe` (vale Pegaso o Fénix en vuelo). Queda vibrando y se guarda.
- **Pared `b` (parapeto bajo) bloquea como pared pero se dibuja baja:** sirve de pantalla delante de una puerta sin taparla. Los desafíos de a dos se verifican con cada personaje solo, en orden que no gaste el paso propio (Fénix y Ariadna al final).
- **Muro agrietado sobre una terraza:** al romperse queda a ras de suelo, así que lo que está detrás debe estar a nivel 0.
- **`probar.js` tarda varios minutos.** Con un límite de 120 s se cortó a mitad ("Target page, context or browser has been closed"); sin límite dio 237 chequeos OK y ninguna falla (2026-10-04). No correrlo con un límite de tiempo corto.
- **Vuelo por personaje (D21):** Fénix tope 1.6 (una casilla bloquea si su altura supera z + 0.06: llega a terraza, nunca a techo); Pegaso 2.9. Fénix solo golpea fuentes `volar` con `zBase <= 1.1`. Un chequeo que deja una fuente apagada rompe en cascada los que vienen después: restaurarla en el mismo chequeo.
- **Escenario en sprites (A5):** `sprites/escenario/` se rasteriza una vez al cargar a min(3, dpr) y se dibuja con drawImage; mientras no cargó todo, solo se pinta el fondo. Puertas y muro agrietado son superposiciones de 44×90 alineadas al pie de la cara. `m.origen` es copia de solo lectura de las celdas originales: sin ella no se puede dibujar el muro roto ni el umbral de una reja abierta, porque la casilla pasa a `.`. Un SVG reeditado obliga a subir `VERSION` de `sw.js`.
- **Ambiente (flora, fauna, detalles):** decorado o vivo, nunca requisito ni recompensa, no se guarda en el perfil. Cada personaje tiene su propia reacción con el poder. Mezcla base arqueológica minoica y mitos; el mito se cuenta con la reacción, sin texto. Diseño en `diseno-ambiente.md`.
- **Los sprites miran a la derecha y se espejan con fx < 0:** si un sprite nuevo mira a la izquierda, queda al revés en el juego.
- **Un ala que aletea es un SVG aparte con el origen en el hombro:** el juego carga cada SVG como imagen entera y no puede mover una parte. Va una cercana (encima del cuerpo) y una lejana (detrás, desfasada), y el aleteo es girarlas sobre ese punto.

- **Íconos de interfaz con relleno en tres tonos por material (luz, base, sombra) y contorno tinta**, como los objetos del juego, nunca de trazo fino solo. Por qué: Willy pidió íconos más pulidos en la maqueta de A4 (2026-10-04).
- **Señales de poder (A3):** viven en `m.senales` (polvo, ráfaga, brasas) y `j.esfuerzo`, en `mundo.js`, y se dibujan en `dibujo.js`. No tocan física ni guardado. La soga tiene `prog` (0 a 1) y `desde`: es caminable desde el instante en que se tiende, la animación es solo visual, y una soga restaurada del guardado arranca con `prog` 1. El polvo de aterrizaje también sale al bajar caminando de una terraza.
- **Campo de pruebas (D24):** el menú lo ofrece solo con `?pruebas` en la dirección. `probar.js` carga `?prueba&pruebas`: `prueba` en singular expone `window.__mundo` y es otra cosa.
- **En `probar.js`, después de mandar al personaje al agua, esperar `estado === 'jugando' && enSuelo`, no un tiempo fijo.** Si sigue apretando hacia el agua, cae, reaparece y vuelve a entrar en ciclo; una espera fija mide en cualquier fase y falla al azar (visto el 2026-10-04: 244 OK y 1 falla, después 245 OK).

## Proceso

- **Objetos y lugares reales se verifican contra fuentes antes de publicarlos** (museo, sitio arqueológico), y lo que se aparta del original se dice explícitamente. Por qué: Willy condicionó la publicación de los coleccionables a que estuvieran basados en información verificada (2026-10-04); la verificación encontró tres errores de memoria (medallones del tablero, fondo del fresco, orejas del ritón).
- **Los personajes se diseñan fuera de Code**, en otro chat de Willy. Code no los diseña ni los redibuja: en maquetas van como lugar marcado. Por qué: Willy lo pidió al arrancar el plan de arte (2026-10-04). Excepción: cuando Willy pide diseñar acá, en el lienzo de Design, y aprueba ahí; así se hicieron las alas de Pegaso y Fénix.
- **El subagente no ve la conversación.** Un encargo incompleto produce trabajo equivocado: cada encargo trae los archivos a tocar, las reglas que aplican, las decisiones ya tomadas, qué queda fuera y el criterio de terminado.
- **La corrida completa de `probar.js` es para cerrar etapas; por cambio va `--rapido` (D26).** Por qué: Willy pidió acortar la verificación el 2026-10-04 después de ver que cada delegación corría dos veces los 10 minutos. Si Willy vuelve a quejarse del tiempo o del contexto, avisarle el gasto en una línea.
- **Cada respuesta cierra con `Título: MAM <decisión o foco>`.** Por qué: Willy maneja varios chats del proyecto a la vez y se perdía entre ellos (pedido del 2026-10-04).
- **`probar.js --rapido` (17 chequeos, unos 4 s) es la verificación por cambio.** No correr dos pruebas a la vez.
