# Plan: desbloquear personajes con charlas

Diseño de la sesión 1 del desbloqueo. Reglas de fondo en `CLAUDE.md` (sección Reglas del juego). Falta la entrada en `DECISIONS.md`: se agrega al cerrar la sesión con el número libre en ese momento.

## Qué se decidió

- Mecánica base: árboles de diálogo con elecciones (elegir una réplica cambia lo que sigue). Solo la mecánica genérica, sin copiar ningún juego.
- Los personajes salen de las 85 fichas de `JuegoMitosFeli`. Entran las griegas (66). Nórdicas y romanas quedan afuera por ahora.
- No se comparte progreso con el juego de cartas.
- Se llega a cada personaje por una cadena de recomendaciones: una charla manda a otro ("preguntale a X por Y"). Lo aprendido en una charla (un saber) puede abrir otra.
- Elegir mal nunca castiga: lleva a otra rama y la charla se puede repetir.
- Se avanza por tandas chicas para probar. Cada tanda incluye algún dorado.
- Poder nuevo: solo los dorados tienen poder propio. Los plateados prestan uno de los existentes o ninguno. Los normales dan solo charla y carta.
- Habilidades: fuerza, astucia, valentía, magia, liderazgo y bondad (1 a 10), copiadas de las fichas. Se suma **velocidad**, que las fichas no tienen. Condicionan opciones en las charlas y qué situaciones resuelve cada personaje. No tocan salto ni velocidad de caminar (el poder sigue siendo lo que distingue en física).
- Los 6 actuales conservan su poder. Los poderes ya validados no cambian.

## Sesión 1 (propuesta)

Termina cuando la jugadora, en el celular, empieza el juego, llega a una charla, elige entre dos respuestas, ve que cambia lo que sigue, y la carta queda desbloqueada y guardada al volver a abrir.

1. **Guardado.** El perfil suma qué personajes están desbloqueados, qué saberes tiene y qué charlas resolvió. Migración de perfiles anteriores: los 6 pasan a estar desbloqueados, para no quitar nada de lo ya jugado.
2. **Inicio.** Pantalla de elección del personaje inicial y tira de personajes que muestra solo los desbloqueados. Ver pregunta abierta 1.
3. **Motor de charlas.** Pantalla de diálogo con elecciones, que lee charlas de archivos de datos. Texto legible en celular vertical, sin texto en inglés.
4. **Tanda 1 (pocas).** Cadena corta del laberinto, escrita desde las fichas (historia, "¿Por qué?", pistas) y desde las fichas del propio juego: Ariadna (inicio) → Teseo (dorado) → Minotauro, que es el primer personaje que queda bajo llave. Sin mitos inventados; lo que no esté en una ficha se pregunta antes de escribirlo. La charla de Dédalo la escribe otro hilo y entra cuando esté lista, usando el mismo formato de datos.
5. **Habilidades en la ficha.** Se muestran en la ficha del personaje. Todavía no condicionan nada: eso viene con la segunda charla jugable.

Fuera de esta sesión: poderes nuevos de dorados, las demás tandas, oráculo como brújula, velocidad con efecto en el juego.

## Sesión 2 (propuesta, pendiente de OK)

Objetivo (Guille, 2026-11-07): que los 6 personajes se puedan desbloquear de verdad, con Dédalo ya jugable. Se empieza con un solo personaje y los otros 5 quedan bajo llave. Una sola de las 5 se desbloquea con un objeto interactivo (recompensa fácil); las otras 4 con charlas.

### Cadena propuesta (todo de fichas de `JuegoMitosFeli` y del propio juego)

| Se desbloquea | Cómo | Base en las fichas |
|---|---|---|
| Minotauro | Charla de Teseo (ya hecha) | Teseo lo venció y salió con el hilo |
| Ariadna | Charla de Dédalo (`charla-dedalo.md`, falta pasarla a datos): su final recomienda a Ariadna | Dédalo le contó el secreto; ella le dio el hilo a Teseo |
| Pegaso | **Objeto interactivo:** la fuente que brotó del casco de Pegaso (fuente de las Musas) | "De una patada de su casco brotó una fuente" |
| Eco | Charla de Narciso (normal) | Narciso se quedó mirando su reflejo; Eco solo podía repetir lo que él decía |
| Ulises | Charla de Nausícaa (normal) | Nausícaa encontró a Odiseo náufrago, le dio ropa y comida y lo guió al palacio |
| Fénix | **Sin cadena todavía.** Las fichas no lo vinculan con ningún otro personaje. Hay que decidir con qué se conecta antes de escribir nada | — |

Quién empieza determina qué cadenas se abren primero: cada personaje es interlocutor de las charlas que no son la suya, así que nadie queda sin ruta (hay que verificar que cada elegido tenga un camino a los otros 5).

### Poderes agrupados por lo que destraban (para evaluar)

Un personaje desbloqueado hereda el poder de su familia, según su habilidad más alta. Los dorados pueden sumar un poder propio.

| Familia | Qué destraba | Hoy | Se podría sumar |
|---|---|---|---|
| Fuerza | Romper muros agrietados, empujar bloques y vasijas | Minotauro | Heracles, Aquiles |
| Astucia | Tender sogas entre argollas | Ariadna | Penélope, Odiseo |
| Vuelo | Subir a terrazas (Fénix) y techos (Pegaso) | Pegaso, Fénix | Belerofonte (con Pegaso), Perseo |
| Luz | Encender braseros y puertas del sol | Fénix | Helios |
| Voz | Sonidos que atraviesan paredes | Eco | — |
| Agua | Navegar barcas | Ulises | Poseidón |

Abierto: cuánto de esta tabla se construye. Cada familia nueva que se suma obliga a que haya desafíos del mapa que la usen, así que se agrega de a una.

### Qué incluye la sesión 2 (mínimo)

1. Pasar la charla de Dédalo a `datos/charlas/dedalo.json` y ubicarlo en el mapa (su taller es una habitación, ver `charla-dedalo.md`).
2. Poner a los 5 restantes bajo llave y ajustar la elección inicial.
3. La fuente de Pegaso como objeto interactivo que lo desbloquea.
4. Charlas de Narciso y Nausícaa, con el mismo formato.
5. Aún no: poderes nuevos ni la cadena de Fénix.

### Preguntas

1. ¿Va la cadena de la tabla (Pegaso por la fuente; Eco por Narciso; Ulises por Nausícaa)?
2. Fénix: ¿con qué personaje querés conectarlo? Si no hay canon claro, puede ser el último en desbloquearse por un objeto o quedar libre hasta decidirlo.
3. ¿Los desbloqueados de las 85 serán jugables? Para esta sesión no hace falta decidirlo.

## Escala de velocidad (1 a 10)

Las fichas no traen velocidad. Esta escala es un criterio de juego mío, no canon: sigue la naturaleza de cada ser, y se ajusta si no te convence.

| Personaje | Velocidad | Criterio |
|---|---|---|
| Pegaso | 9 | caballo alado |
| Fénix | 8 | ave que vuela |
| Minotauro | 6 | bestia grande, fuerte antes que veloz |
| Eco | 6 | ninfa de los montes, liviana |
| Teseo | 6 | héroe entrenado |
| Ariadna | 5 | humana, sin rasgo de carrera |
| Ulises | 5 | humano, su fuerte es la astucia |
| Dédalo | 4 | inventor, su fuerte es el ingenio |

Las otras seis habilidades de los 6 jugables se copian tal cual de las fichas (Ulises toma las de Odiseo).

## Preguntas abiertas

1. Leí "Ariadna va a estar al principio" como una de dos cosas, y hay que confirmar cuál: (a) todo perfil nuevo empieza con Ariadna y no hay pantalla de elección por ahora, o (b) Ariadna es la primera de la tira y la elección entre los 6 sigue. Cambia el paso 2.
2. Velocidad: hay que definir el valor de cada personaje de la tanda. Las fichas no la traen y no la invento.
3. ¿Teseo gana un poder en la tanda 1, o la tanda 1 solo desbloquea cartas y charla? Su poder tendría que definirse antes (no está en las fichas).
