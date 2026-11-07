# Ambiente interactivo: llamar a los animales

Extiende `diseno-ambiente.md`. Todas sus reglas siguen vigentes (no bloquea, no se guarda, nadie sufre, sin texto, todo lo que suena también se ve).

## Qué se quiere

Que los animales del mapa respondan con sonido y gesto cuando la jugadora los llama, por ejemplo el gato que maúlla. Sin premio, sin guardado, sin aviso de texto.

## Cómo se llama

El botón de poder hace dos cosas con un mismo apretón: usa el poder del personaje y, si hay un animal a menos de 1,7 casillas, lo llama. No hay botón nuevo ni modo nuevo. El llamado no gasta nada ni interfiere con el poder.

El botón pierde sus palabras: queda solo el ícono del poder y la letra del atajo (E), como el joystick. Toca `index.html` (`#btn-poder`, quitar `.etiqueta`) y el CSS de `.boton-accion`.

## Respuestas

El sonido es sintetizado en `sonido.js` (Web Audio, sin archivos ni red). Suena a juego, no a grabación. Cada llamado además hace un gesto visible (regla 6).

| Animal | Sonido sintetizado | Gesto |
|---|---|---|
| Gato | maullido: tono que sube y baja, onda triangular | se estira y gira la cabeza hacia la jugadora |
| Cabra | balido: tono vibrado y nasal | salta un paso |
| Gaviota | graznido: dos notas cortas descendentes | abre las alas un instante |
| Golondrina | trino: tres notas agudas y rápidas | aletea y da una vuelta corta |
| Delfín | chasquido agudo | salta fuera del agua |
| Pulpo | sin sonido | asoma el ojo |
| Lirios | sin sonido | se abren un instante |

Cuando el poder ya hace reaccionar al animal (por ejemplo Ariadna con el hilo y el gato), esa reacción manda. Un animal no se llama de nuevo hasta que termina su gesto (unos 1,5 s).

## Decorado

Olivo, laurel, ánforas, redes y fresco siguen sin interacción.

## Técnica (para el encargo)

- `ambiente.js`: campo `llamado` (0 a 1, decae solo) en cada elemento vivo; `movimientoAmbiente` lo suma al gesto.
- `controles.js` / `principal.js`: al pulsar poder, buscar el animal vivo más cercano a menos de 1,7 y marcarlo.
- `sonido.js`: casos nuevos en `tocar` (`maulla`, `bala`, `grazna`, `trina`, `chasquea`), registrados en `registro` para `probar.js`.
- Respetar `reducirMovimiento()`: el sonido suena, el gesto se atenúa.
- Sin claves nuevas en el perfil. Sin recursos nuevos en `sw.js`.
- Verificación: `probar.js --rapido` más un chequeo por animal (apretar poder cerca, el registro de sonidos suma la entrada). Captura del botón sin palabras en vertical y horizontal.

## Fuera de alcance

Sonido grabado; toque directo sobre el mapa; premios o contadores; ambiente nuevo.

## Terminado

La jugadora, sin que se lo expliquen, llama a un animal, se ríe o lo repite, y el botón sin palabras no le genera dudas sobre el poder.

