# Recomendaciones gráficas de ChatGPT / Codex

Autoría: ChatGPT / Codex (OpenAI).
Fecha: 2026-11-02.
Estado: propuestas para discutir. Su publicación no implica aprobación de la dirección de arte ni autorización para implementar.
Repositorio: mitos-mundo-abierto. Base revisada: main, commit 44ae7fe5c9a420b547e9d652ccaa55a8a3a49fab.

## Diagnóstico

Recomiendo conservar la identidad de fresco minoico con volumen sencillo y mejorar la composición, la presencia de los personajes y la vida del escenario. El salto visual más útil vendría de una escena mejor compuesta y animada.

Base de esta revisión: observación del juego publicado en navegador de escritorio, en la plaza central; lectura de CLAUDE.md, MEMORY.md, ROADMAP.md, plan-arte.md, diseno-ambiente.md, dibujo.js, estilos.css, datos/personajes.json y del SVG de Pegaso. No es una prueba completa del mapa ni una validación en un celular físico. Los lienzos privados de Design no fueron inspeccionados.

En la vista observada, los grandes paños de suelo amarillo y paredes marrones pesan más que el personaje. La repetición de losas y los límites rectos hacen visible la estructura del mapa. Pegaso se reconoce, pero tiene poca presencia frente a esas superficies. La ausencia de ambiente alrededor del desafío hace que la plaza se lea principalmente como un espacio de mecanismos.

Ya funcionan como base la paleta consistente, los frisos que distinguen alturas y el contraste entre objetos y suelo. El código ya incluye sombras, variación determinista de losas, animación de agua, aleteo y señales de poder: las propuestas de abajo buscan afinarlos, no presentarlos como funciones ausentes.

## Prioridades

| Orden | Recomendación | Resultado buscado | Relación con lo existente |
|---|---|---|---|
| 1 | Completar las direcciones y la animación de los personajes | Que parezcan habitantes del mundo y comuniquen hacia dónde se mueven | A2 sigue pendiente en ROADMAP.md |
| 2 | Componer ambiente en grupos y dar identidad a cada zona | Que explorar resulte atractivo entre los acertijos | Completa A6 y diseno-ambiente.md |
| 3 | Afinar sombras de contacto y bordes de altura | Distinguir piso, terraza y techo de inmediato | Ajuste de A5 y del render existente |
| 4 | Reducir el protagonismo de las juntas del piso | Que personajes y mecanismos destaquen sobre la arquitectura | Conserva la grilla lógica y las baldosas empujables |
| 5 | Pulir las transiciones y reacciones | Que las acciones tengan peso y un resultado visible | Extiende A3 y la apertura visual pendiente de A5 |
| 6 | Revisar escala de cámara y ocupación de controles en vertical | Dar más espacio útil y presencia al personaje en celular | Hipótesis pendiente de medición en dispositivo |

## 1. Personajes con movimiento propio

Completar frente, espalda y costado espejado, como ya fija D22. El ciclo debe mover partes del cuerpo: patas y cuello en Pegaso; piernas y brazos en los humanoides. Un balanceo del sprite entero puede acompañar, pero no reemplazar la caminata.

Probar reposos discretos y distintos: respiración del Minotauro, movimiento leve de la cola de Pegaso y de las plumas del Fénix, un gesto de Ariadna con el ovillo. Son propuestas de actuación visual, no afirmaciones sobre el mito.

Antes de agregar detalles de ropa o rostro, revisar silueta, proporciones y contraste a tamaño real. El ovillo, los cuernos y las alas deben sobrevivir a la reducción. El diseño de los personajes se resuelve en el espacio de diseño que establece MEMORY.md, antes de su integración.

## 2. Lugares con identidad y puntos de referencia

Usar el catálogo existente de diseno-ambiente.md y agruparlo en escenas:

- Puerto: una barca junto a redes y ánforas, postes con aves y una orilla con actividad.
- Plaza: un olivo y un cantero que enmarquen un espacio abierto, con los gatos en un rincón tranquilo.
- Palacio: frescos, cerámica y vegetación de terraza organizados alrededor de accesos y patios.

La recomendación nueva es la composición: alternar áreas de descanso visual, grupos decorativos y un punto reconocible por sector. Evitar repartir adornos uniformemente o llenar cada casilla vacía.

Mantener libres los recorridos, las baldosas empujables y los carriles de las sogas. La decoración no usa el oro pálido ni los símbolos reservados a mecanismos. Las propuestas arqueológicas nuevas se verifican antes de incorporarlas.

## 3. Profundidad legible sin cambiar de motor

Conservar los tres niveles y la luz pareja aprobada. Afinar la sombra al pie de muros, bloques, vasijas y vegetación para que se apoyen visualmente en el suelo; mantener una dirección y una intensidad coherentes.

Hacer que el borde superior, la cara frontal y el contacto con el piso describan el mismo volumen. Revisar especialmente los encuentros entre terrazas, esquinas y sogas. Conservar la sombra del personaje durante el vuelo y evitar que nuevos adornos tapen superficies de aterrizaje.

No propongo iluminación nocturna, luces dinámicas ni un cambio a 3D para esta mejora.

## 4. Un piso que acompañe la acción

Ya existen variantes de losas. Probar juntas de menor contraste y desgaste en manchas más amplias para que la superficie no compita con los objetos pequeños. Mantener contornos más fuertes en personajes, objetos y mecanismos.

Romper la repetición visual en bordes decorativos con vegetación, rocas o transiciones de material compatibles con el diseño. Esto no cambia la geometría caminable ni las colisiones. Las baldosas sobre las que se empuja deben seguir siendo explícitas.

## 5. Acciones que se entiendan al verlas

Priorizar la animación de apertura de la reja, pendiente en el roadmap. Agregar o afinar anticipación y asentamiento en embestidas, empujes y aterrizajes: un gesto antes, una reacción al contacto y una vuelta al reposo.

El aleteo, las olas y las partículas ya existen. Ajustarlos para que no se muevan todos con el mismo ritmo ni llamen continuamente la atención. Reservar los efectos más intensos para la acción del personaje.

Las transiciones visuales no deben demorar la apertura lógica de un mecanismo, exigir precisión temporal ni reintroducir obstáculos resueltos. Revisar una alternativa con movimiento reducido para los nuevos efectos.

## 6. Cámara e interfaz: probar antes de ajustar

En escritorio se observa una gran diferencia entre el tamaño del mundo y el personaje. No alcanza para concluir que la cámara esté mal en celular.

Comparar en vertical la escala actual con un acercamiento moderado. Revisar simultáneamente cuánto recorrido puede anticiparse y cuánto escenario útil queda libre de joystick, botones y tira de personajes. No agrandar personajes ni reducir controles sin esa comparación.

Conservar nombres, insignias y selección clara del personaje. Cualquier reducción del peso visual de los controles debe mantener áreas táctiles cómodas y texto legible.

## Primera prueba recomendada

Elegir un único encuadre de la plaza con personaje, suelo, muro, terraza y mecanismo. Preparar una comparación antes/después con menor contraste de juntas, sombras afinadas y un grupo ambiental de los ya previstos. Mantener idénticos cámara, posiciones, colisiones y estado de los mecanismos para poder juzgar el cambio.

Esta es una propuesta de prueba, no una tarea implementada. Antes de construir, definir cuánto se quiere conservar del aspecto actual y aprobar una referencia visual de ese encuadre.

La comparación se acepta cuando, en celular real:
- El personaje se distingue del escenario sin buscarlo.
- Suelo, terraza y techo se reconocen al primer vistazo.
- La decoración no se confunde con premios ni mecanismos.
- La escena gana identidad sin ocultar caminos.
- El movimiento sigue siendo fluido y los recursos cargan sin conexión.

No se midieron rendimiento, contraste ni ergonomía táctil en esta revisión. Esas comprobaciones quedan para la prueba de implementación.

## Alcance de la publicación

Este archivo contiene recomendaciones propias de ChatGPT / Codex. No reemplaza D17, D22, plan-arte.md ni diseno-ambiente.md; distingue trabajo ya previsto de ajustes nuevos. No marca tareas como construidas o validadas y no introduce decisiones aprobadas.
