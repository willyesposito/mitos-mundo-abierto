# Mitos: mundo abierto

Juego de exploración de mitología griega, aparte de Mundo de Mitos. Toma prestados cinco personajes de ese juego pero no comparte progreso, colección ni reglas de módulo. Sin relación técnica con el otro repo.

## Qué es

Vista cenital inclinada con alturas visibles, al estilo LEGO Marvel Super Heroes: un mapa lleno de cosas para hacer, cada personaje con un poder distinto, y lugares que solo alcanza el personaje correcto. La jugadora cambia de personaje cuando quiere. El desafío es descubrir qué personaje usar y dónde, no la puntería.

Audiencia, en términos de diseño: lectora fuerte, disfruta el desafío intelectual, curiosa por los mitos.

**Criterio de terminado:** la jugadora lo usó en el celular, entendió cómo cambiar de personaje sin que se lo expliquen dos veces, y volvió a jugar por decisión propia. No cuando compila.

## Reglas del juego

- Un lugar puede requerir un poder. Los 5 personajes están disponibles desde el inicio: requerir un poder significa cambiar de personaje, no conseguir uno.
- Saltos generosos, caer no castiga: si cae al vacío o al agua, reaparece en el último piso firme sin perder nada. Un coleccionable obtenido nunca se pierde.
- Sin timers ni cuentas regresivas. Nada se derrumba si no llega a tiempo.
- La sombra bajo el personaje es siempre visible al saltar o volar.
- Máximo tres niveles de altura en el primer mapa: suelo, terraza, techo.
- Ningún contador visible baja.
- Nada se cierra ni se pierde: una reja abierta queda abierta, un muro roto queda roto.

## Restricciones duras

- Vanilla JS + HTML + CSS. Sin frameworks, sin librerías, sin build.
- Cero dependencias de red en runtime: tiene que correr sin conexión (service worker). Sin fuentes, CDNs ni imágenes remotas.
- Mobile-first: celular Android en vertical. Joystick táctil y botones grandes. Teclado como extra.
- Cero texto visible en inglés. Español rioplatense, sin diminutivos forzados.
- **Sin datos personales de ningún tipo** en código, comentarios, nombres de archivo, commits, PRs o issues: ni nombres de la jugadora o su familia, ni edades, ni escuela, ni ubicación, ni etiquetas de perfil. La audiencia se describe solo en términos de diseño. Repo público.
- Contenido mítico fuerte (el Minotauro, por ejemplo) se cuenta suavizado: la esencia existe, el detalle crudo no.
- No inventar mitos. Si falta información de canon, frenar y preguntar.
- Nunca incluir credenciales, tokens ni claves.

## Elenco (fijo)

| Personaje | Poder | Rasgo visual |
|---|---|---|
| Pegaso | Volar a terrazas y techos (mantener el botón) | alas |
| Minotauro | Fuerza: empujar bloques y vasijas; embestir para romper muros agrietados | cuernos |
| Ariadna | Hilo: tender sogas entre argollas (escala o puente, hasta 5 casillas) | ovillo |
| Fénix | Luz: tocar brilla y enciende braseros; mantener vuela como Pegaso | llama |
| Eco | Voz: guarda un sonido y lo repite a 6 casillas, atravesando paredes | ondas de voz |

Todos caminan, corren y saltan. El poder es lo único que los distingue en mecánica. Los personajes se dibujan por código: base compartida más un rasgo propio. El arte definitivo lo resuelve Claude Design más adelante.

## Mapa de archivos

Código en la raíz, datos en `datos/`.

| Archivo | Qué hace |
|---|---|
| `index.html`, `estilos.css` | Pantalla y estética (Creta minoica: frescos planos, olas, espirales) |
| `principal.js` | Arranque, bucle, cámara |
| `mundo.js` | Física y reglas: alturas, salto, vuelo, empujar, embestir, objetos. No dibuja |
| `dibujo.js` | Render en canvas y personajes |
| `interfaz.js` | HUD, avisos, tira de personajes, perfiles, menú |
| `controles.js` | Joystick, botones, teclado |
| `nucleo.js` | Guardado local con varios perfiles (clave `mitos-mundo-abierto-v1`): objetos y estado del mundo por mapa |
| `iconos.js` | Íconos de interfaz |
| `sonido.js` | Audio sintetizado (Web Audio), un extra: todo lo que suena también se ve |
| `datos/personajes.json` | Elenco y poderes |
| `datos/coleccionables.json` | Catálogo de objetos y zonas. El catálogo real lo define Chat |
| `datos/mapa-puerto.json`, `datos/mapa-plaza.json` | Puerto (inicio) y plaza. Cada mapa trae `salidas` (celdas que llevan a otro mapa) y `entradas` (dónde se aparece viniendo de cada mapa). Los dos comparten el catálogo de `sonidos` |
| `datos/mapa-pruebas.json` | Campo de pruebas, se abre desde el menú. Leyenda abajo |
| `sw.js` | Service worker. **Subir `VERSION` en cada deploy real** |
| `herramientas/probar.js` | No es parte del juego. Juega el juego en un navegador sin pantalla, con teclado y toques, y verifica todo |

Leyenda del mapa: `.` suelo, `,` baldosa (única donde se puede empujar), `~` agua, `a` terraza (1), `A` techo (2), `#` pared, `b` parapeto bajo, `M` muro agrietado, `G` reja, `p` placa, `B` bloque, `V` vasija, `S` inicio, `D` puerta del sol, `O` puerta de sonido. Braseros, soles, fuentes de sonido, puertas de sonido y sogas (argollas) van en listas del JSON del mapa, no en letras. Las filas deben tener el mismo largo.

## Flujo

Diseño y canon en Chat, ejecución en Code. Antes de construir algo nuevo, confirmar el alcance con una frase y esperar. Alcance mínimo: lo no pedido se nombra en una línea al final, no se construye.

Antes de dar algo por hecho, correr `node herramientas/probar.js`. Todo cambio de reglas o de mapa se verifica ahí.

Subir la rama y abrir el PR. El merge lo confirma Willy hasta que indique lo contrario.
