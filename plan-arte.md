# Plan de arte: sprites embebidos

Reemplaza el dibujo por código de personajes, escenario e interfaz por sprites que viven en el repo. Decisión: D16 (reemplaza a D10). Las reglas del juego y las restricciones duras de `CLAUDE.md` no cambian.

## Reparto

- **Chat:** dirección de arte y diseño en Claude Design. Entrega por paso una hoja de referencia aprobada y la especificación en este archivo.
- **Code:** convierte la referencia en sprites, los integra al render y extiende `probar.js`. Opus decide el formato técnico dentro de lo que fija este plan.

## Requisitos que valen para todos los pasos

- **Sin red:** los sprites viven en el repo y el service worker los cachea. Subir `VERSION` de `sw.js` cada vez que cambian.
- **Escala:** casilla de 44 × 36 px y 30 px por nivel de altura, con pantallas de hasta 2,5× de densidad. Cada sprite se diseña a 3× y se revisa a tamaño real en el celular.
- **Legible antes que lindo:** a tamaño real, cada personaje se distingue de los otros cuatro por silueta, sin depender del color.
- **Código visual de mecanismos reservado:** brillo de coleccionable, argolla, placa, brasero y fuente de sonido no se parecen a nada del ambiente ni de la decoración (regla 1 de `diseno-ambiente.md`).
- **Sombra bajo el personaje** dibujada aparte del sprite, siempre visible al saltar o volar.
- **Siluetas tenues detrás de paredes:** cada sprite de personaje y de objeto necesita su versión silueta, o un modo de generarla.
- **Estética:** Creta minoica, frescos planos, olas y espirales. Paleta de partida: la actual de `dibujo.js` (cal, óxido, egeo, ocre).
- **Minotauro suavizado:** se lee como toro y persona, nada amenazante ni cruento.
- **Sin texto dentro de los sprites.** Todo texto visible sale de la interfaz, en español.

## Canon visual

| Personaje | Firme en el mito | Lo decide el diseño |
|---|---|---|
| Pegaso | Caballo alado, tradición iconográfica blanco | Pose, proporciones |
| Minotauro | Cuerpo de hombre y cabeza de toro | Ropa, gesto, grado de suavizado |
| Ariadna | Princesa cretense, hija de Minos; el hilo | Vestimenta (inspirada en frescos minoicos, sin pretender canon) |
| Fénix | Ave; las fuentes antiguas varían en el plumaje, el rojo y dorado es lo más difundido | Forma de la llama |
| Eco | Ninfa; no tiene iconografía antigua fija | Todo su aspecto. Elegirlo como decisión de diseño, no presentarlo como canon |

## Pasos

Cada paso termina cuando se cumple su criterio, no cuando está la hoja. El orden de abajo es una propuesta; Willy decide por cuál se empieza.

### A0. Prueba de tubería
- **Qué:** un solo personaje (el Minotauro, por tener la silueta más fácil de comparar) recorre todo el camino: diseño en Claude Design, sprite en el repo, dibujado en el juego, cacheado sin red.
- **Por qué primero:** no está verificado que de Claude Design salga algo que se convierta limpio en sprite. Si la tubería falla, conviene saberlo antes de diseñar veinte cosas.
- **Termina cuando:** Willy lo ve en su celular a tamaño real, sin conexión, y el resto del juego sigue igual.

### A1. Dirección de arte
- **Qué:** hoja de estilo: paleta cerrada, grosor de línea, tratamiento de luz y sombra, cómo se ven los tres niveles de altura.
- **Termina cuando:** Willy aprueba una maqueta de una pantalla del puerto a tamaño real del celular.
- **Resultado (aprobado 2026-10-04):** hoja de estilo, maqueta del puerto y 17 piezas del escenario en el lienzo de Design "Mitos: dirección de arte" (privado de Willy). Decisión: D17. Lo que vale para los pasos que siguen:
  - **Paleta cerrada:** cal `#f4ecd8`, cal sombra `#cbb994`, arena `#e6c88a` y `#e2c383`, ocre `#d9a441`, óxido `#b5482e`, óxido oscuro `#8f3a24`, egeo `#1f6f9c`, agua `#2d79a8`, espuma `#7fb8d8`, piedra `#a9764a`, piedra tope `#7a5236`, tinta `#3b2b1d`. Bronce `#a8742e` con luz `#e6b866`. Cada material usa tres tonos (luz, base, sombra) derivados de su color.
  - **Oro pálido `#fff3c8` reservado para mecanismos:** argolla, placa, brasero, fuente de sonido, coleccionable, puerta del sol. Los destellos del ambiente (agua) van en blanco azulado.
  - **Línea:** contorno tinta de 2 px a tamaño real solo en personajes y objetos; las baldosas se separan por tono y junta.
  - **Fresco con volumen:** color plano por zonas, sin degradés. Bisel de luz arriba y a la izquierda, sombra abajo; textura de grano, mortero y desgaste.
  - **Luz cenital pareja:** cara sur un paso más oscura que el tope, franja de sombra al pie. Sombra del personaje aparte, elipse que se achica con la altura.
  - **Niveles:** suelo en losas de arena trabadas (una losa mide casilla y media, no marca la grilla); terraza en losas de yeso con friso rojo de espirales; techo en losas rojas con bandas egeo de olas y cuernos de consagración.
  - **Baldosa empujable:** cuadrada, de una casilla, con marco propio, para no confundirse con el suelo.
  - **Siluetas detrás de paredes:** relleno cal al 35 % y contorno cal punteado, generadas por código desde el mismo sprite.

### A2. Los cinco personajes, quietos y caminando
- **Qué:** base compartida más rasgo propio (alas, cuernos, ovillo, llama, ondas de voz). Quieto y ciclo de caminar.
- **Direcciones (D22):** cuatro. Frente, espalda y costado espejado: tres dibujos por pose.
- **Termina cuando:** la jugadora, en el celular, nombra a cada personaje sin ayuda.

### A3. Movimiento y poderes
- **Qué:** salto, vuelo (Pegaso y Fénix), empujar, embestir, tender el hilo, brillar, guardar y repetir la voz. Las señales de poder siguen la regla "todo lo que suena también se ve".
- **Termina cuando:** la jugadora usa los cinco poderes en el celular y ninguno se ve como otro.

### A4. Interfaz
- **Qué:** tira de personajes, botones de acción por poder, joystick, avisos y fichas. Reemplaza `iconos.js` donde corresponda.
- **Termina cuando:** la jugadora cambia de personaje sin que se lo expliquen dos veces (criterio de terminado del proyecto).

### A5. Escenario y mecanismos
- **Qué:** suelo, baldosa, agua, terraza, techo, pared, parapeto, muro agrietado (sano y roto), reja (cerrada y abierta), placa, bloque, vasija, puertas del sol y de sonido, braseros (apagados y encendidos), argollas y sogas, fuentes de sonido.
- **Termina cuando:** la jugadora reconoce sola qué personaje pide cada obstáculo.

### A6. Coleccionables y ambiente
- **Qué:** objetos del catálogo y elementos de `diseno-ambiente.md` (decorado y vivo), con sus reacciones por personaje.
- **Termina cuando:** la jugadora no confunde ningún elemento de ambiente con un desafío.

## Riesgos

- **Calidad de exportación de Claude Design:** puede dar referencias buenas pero no sprites listos (fondo, bordes, tamaño exacto). A0 lo resuelve; si falla, Code redibuja a partir de la referencia.
- **Coherencia entre pasos:** sin la hoja de A1 aprobada, cada tanda sale con otro estilo.
- **Mapas ya jugados:** cambiar sprites no toca el guardado; cambiar tamaños de colisión sí podría. El arte no cambia colisiones.
