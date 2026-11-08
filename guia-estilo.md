# Guía de estilo visual

Reglas comunes para todo lo que se dibuja: personajes, escenario, objetos y ambiente. Completa a `plan-arte.md` (A1, D17) y manda sobre cualquier sprite anterior que la contradiga. Decisión: D38.

Problema que resuelve: el arte lo hicieron varias manos sin reglas compartidas y en pantalla se veía como un collage. Había contornos de cuatro grosores y dos colores, paredes con textura casi realista al lado de personajes planos, y objetos dibujados a otra escala y desde otro ángulo que los personajes.

## Unidad

Todo se mide en px de juego a escala 1: casilla de 44 × 36, nivel de altura de 30. Si un sprite se dibuja escalado (por ejemplo el ambiente a 0,8), los valores de esta guía valen **después** de la escala: el SVG compensa.

## Escala

Alto de pies a punta, en px de juego.

| Qué | Alto | Ancho máximo |
|---|---|---|
| Personaje humano | 46 a 50 | 36 |
| Pegaso (sin alas abiertas) | 40 a 44 | 44 |
| Fénix | 40 a 46 | 36 |
| Mesa, banco, mostrador | 20 a 24 (cintura del personaje) | 66 (1,5 casillas) |
| Ánfora grande | 30 a 34 | 22 |
| Ánfora o vasija chica | 16 a 22 | 16 |
| Grupo de ánforas o redes | igual que sus piezas | 66 |
| Gato, gaviota, golondrina | 12 a 16 | 26 |
| Cabra | 26 a 30 | 40 |
| Pulpo, delfín (en el agua) | 18 a 26 | 52 |
| Olivo, laurel | 70 a 80 | 72 |
| Barca de adorno | 26 a 32 | 96 |

## Línea

- Un solo color de contorno: tinta `#3b2b1d`.
- Contorno exterior de 1,6 px en personajes, objetos, animales y mecanismos. Detalle interior de 0,9 px.
- Suelo, losas, sillares, topes y caras de altura no llevan contorno: se separan por tono y junta.
- Uniones y puntas redondeadas (`stroke-linejoin` y `stroke-linecap` en `round`).

## Detalle por plano

Lo que importa para jugar se lee primero; el fondo acompaña.

1. **Fondo** (suelo, paredes, terrazas, techos, agua): contraste bajo. Cada pieza varía como mucho un 6 % de luminosidad respecto de su vecina, sin textura de ladrillo marcada ni grietas decorativas oscuras. Las juntas van en tono, nunca en tinta.
2. **Objetos y ambiente:** tres tonos por material (luz, base, sombra) y contorno.
3. **Personajes, interlocutores y mecanismos:** tres tonos, contorno y un acento de color saturado. Son lo más contrastado de la pantalla.

## Luz y sombra

- La luz viene de arriba a la izquierda: tono de luz en la cara superior y el lado izquierdo, sombra abajo y a la derecha.
- Sombra de contacto en el piso: elipse `rgba(20,10,30,.35)`, ancha como el 60 % de la pieza, achatada a 0,4. No se dibuja dentro del SVG; la pone el juego.

## Punto de vista

- Todo se ve desde el sur con la misma inclinación de tres cuartos: se ve la tapa y el frente. Una boca o una tapa redonda es una elipse achatada a 0,45.
- Nada de vista lateral pura en objetos (una mesa muestra su tablero, no solo el canto).
- Los personajes miran a la derecha en `costado` y se espejan con fx < 0 (ver `MEMORY.md`).

## Formas

- Esquinas redondeadas, sin rectángulos perfectos ni cajas.
- En los personajes, cabeza de alrededor de un tercio del alto: se reconocen por silueta y por su rasgo (alas, cuernos, ovillo, llama, ondas, pilos).

## Paleta

La cerrada de `plan-arte.md`. El oro pálido `#fff3c8` sigue reservado a mecanismos.
