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

Todos caminan, corren y saltan. El poder es lo único que los distingue en mecánica. Pegaso es un caballo alado y Fénix un ave; Minotauro, Ariadna y Eco tienen cuerpo humano (D18). El arte son sprites SVG en `sprites/personajes/` (D16, D17, `plan-arte.md`).

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
| `sprites/personajes/` | Sprites SVG de los cinco personajes. Pies en (0,0), mirando a la derecha |
| `iconos.js` | Íconos de interfaz |
| `sonido.js` | Audio sintetizado (Web Audio), un extra: todo lo que suena también se ve |
| `datos/personajes.json` | Elenco y poderes |
| `datos/coleccionables.json` | Catálogo de objetos y zonas. El catálogo real lo define Chat |
| `datos/mapa-puerto.json`, `datos/mapa-plaza.json` | Puerto (inicio) y plaza. Cada mapa trae `salidas` (celdas que llevan a otro mapa) y `entradas` (dónde se aparece viniendo de cada mapa). Los dos comparten el catálogo de `sonidos` |
| `datos/mapa-palacio.json` | Palacio en terrazas (se entra desde la plaza por el norte): almacenes, terraza de los frescos y sala de los címbalos, tres desafíos de a dos. Mismo catálogo de `sonidos` |
| `datos/mapa-pruebas.json` | Campo de pruebas, se abre desde el menú. Leyenda abajo |
| `ROADMAP.md` | Estado de las sesiones de la etapa. Se actualiza al cerrar cada sesión |
| `DECISIONS.md` | Decisiones tomadas, con el porqué. Solo se agregan entradas |
| `MEMORY.md` | Reglas aprendidas de diseño, técnica y proceso. Se anota ante cada corrección de Willy |
| `plan-etapa-1.md` | Diseño y contenido de la etapa 1: fichas, catálogo, desafíos y sesiones |
| `plan-arte.md` | Plan de arte con sprites embebidos: requisitos, canon visual y pasos A0 a A6 |
| `.claude/agents/programador.md` | Subagente (Sonnet 5.5) que programa los encargos que escribe Opus |
| `sw.js` | Service worker. **Subir `VERSION` en cada deploy real** |
| `herramientas/probar.js` | No es parte del juego. Juega el juego en un navegador sin pantalla, con teclado y toques, y verifica todo |

Leyenda del mapa: `.` suelo, `,` baldosa (única donde se puede empujar), `~` agua, `a` terraza (1), `A` techo (2), `#` pared, `b` parapeto bajo, `M` muro agrietado, `G` reja, `p` placa, `B` bloque, `V` vasija, `S` inicio, `D` puerta del sol, `O` puerta de sonido. Braseros, soles, fuentes de sonido, puertas de sonido y sogas (argollas) van en listas del JSON del mapa, no en letras. Las filas deben tener el mismo largo.

## Flujo

Diseño y canon en Chat, ejecución en Code. Nada de esta sección cambia las reglas de arriba.

### Al empezar una sesión

1. Leer `MEMORY.md` y `ROADMAP.md`. De `DECISIONS.md`, solo las D que el roadmap cita para la sesión en curso. De `plan-etapa-1.md`, solo el contenido de esa sesión.
2. Confirmar con Willy, en una frase, el alcance y el criterio de terminado: "Sesión N: hago X, termina cuando Y. ¿Va?". Esperar el OK. Es la única confirmación de la sesión.

### Roles

El reparto supone Opus 5.5 o superior en el hilo principal. Si el hilo principal es otro modelo o una versión anterior, avisar a Willy antes de empezar.

- **Opus decide y coordina.** Lee, resuelve el diseño dentro de lo que el plan y `DECISIONS.md` ya fijan, escribe el encargo, verifica lo que vuelve, actualiza `ROADMAP.md`, `DECISIONS.md` y `MEMORY.md`, y abre el PR. No programa.
- **Sonnet 5.5 programa**, a través del subagente `programador`. Todo cambio en `.js`, `.css`, `.html` y `datos/` va con un encargo al `programador`. Opus edita directamente solo los `.md` del repo.
- Delegar siempre el código, aunque el cambio parezca chico: el contexto de Opus se mantiene limpio porque las lecturas y pruebas del subagente quedan en el suyo y solo vuelve su reporte.
- Un subagente a la vez. Dos en paralelo solo si tocan archivos distintos y ninguno depende del otro.
- El subagente no ve esta conversación. El encargo trae todo lo que necesita: los archivos a tocar, las reglas del juego que aplican, las decisiones ya tomadas, qué queda fuera y el criterio de terminado verificable.
- No lanzar subagentes para verificar ni para revisar el trabajo de otro subagente.
- Si el encargo no se puede escribir completo porque falta una decisión que no está en `DECISIONS.md`, es una pregunta para Willy, no un encargo.

### Ritmo

Con el OK de la sesión, trabajar hasta terminarla, sin consultas intermedias. No cerrar un turno con un resumen que anuncia el próximo paso: hacerlo. Frenar solo si falta una decisión de Willy o antes de un paso riesgoso: merge, borrar archivos, cambiar el formato del guardado de un mapa ya jugado.

Si lo pedido parece equivocado o hay un camino mejor, decirlo en una frase y seguir con lo pedido.

### Alcance

Hecho lo pedido y verificado, parar y reportar. Lo extra (funciones, tests, archivos, docs, refactors) se nombra en una línea al final y no se construye. Si Willy pide ideas, opciones o un plan, dárselos y parar.

### Verificar de verdad

- El `programador` corre `node herramientas/probar.js` y devuelve cuántos chequeos pasaron.
- Opus lo corre una vez más al recibir el reporte. Es el mismo comando, no una segunda opinión.
- Un chequeo de sintaxis no cuenta. Si el chequeo real no puede correr, decir cuál faltó y por qué, y no dar la sesión por hecha.

### Reportar

La primera frase dice qué pasó. El detalle viene después y solo si hace falta. Los documentos del repo llevan lo que la tarea necesita, sin secciones de relleno.

### Al cerrar una sesión

- `ROADMAP.md`: marcar la sesión como *construida*. *Validada* la marca solo Willy, cuando la jugadora lo usó.
- Decisión nueva: entrada en `DECISIONS.md`. Corrección o norma nueva de Willy: línea en `MEMORY.md`, con el porqué. Antes de cerrar, no después.
- Subir la rama y abrir el PR. El merge lo confirma Willy hasta que indique lo contrario.
