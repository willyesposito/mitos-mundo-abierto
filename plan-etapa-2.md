# Plan etapa 2

Diseño y contenido definidos en Chat. Por ahora trae a Ulises (D29) y el canal entre el puerto y la plaza (D30). El laberinto y la cueva del monte se diseñan aparte y se suman a este archivo.

## Elenco: Ulises

Sexto personaje. Su verbo es **navegar**, y no repite el de ningún otro: subir (Pegaso), mover y romper (Minotauro), tender (Ariadna), encender (Fénix), repetir (Eco).

### Texto

En griego se llama Odiseo; Ulises es su nombre en latín. Era rey de Ítaca, una isla rocosa, y fue uno de los que entraron a Troya escondidos en el caballo de madera. Volver a casa le llevó diez años de mar. Al cíclope Polifemo le dijo que se llamaba Nadie, y se hizo atar al mástil para oír a las sirenas sin peligro. Llegó a Ítaca disfrazado de mendigo y contó que venía de Creta, pero era otro de sus inventos. Su perro Argos lo reconoció igual.

### Poder, Navegar

Parado junto a una barca con remo, el botón lo sube a la barca. Con el joystick la barca anda por el agua, y no sale de ella. Junto a tierra firme, el botón lo baja.

- La barca queda donde la dejó, para siempre (se guarda como un empujable).
- La barca es piso firme para cualquier personaje, pero solo Ulises la mueve. Cambiar de personaje arriba de la barca está permitido: el que aparece queda parado en ella.
- Si alguien cae al agua desde la barca, reaparece en la barca, no en el último suelo de tierra. Así una barca nunca queda varada lejos de quien la necesita, y caer sigue sin castigar.
- Solo navegan las barcas con remo. Las barcas que hoy adornan el puerto siguen siendo adorno.

Texto de la ficha en el juego (campo `poder` de `personajes.json`):

> Parado junto a una barca con remo, el botón lo sube. Con la barca anda por el agua; junto a tierra firme, el botón lo baja. La barca queda donde la dejó. Cualquiera puede pararse en ella, pero solo Ulises la mueve.

**Señal en el mapa:** barcas con un remo apoyado, amarradas al muelle.

### Lo que se omite del mito

Qué le hizo a Polifemo para escapar, los compañeros que pierde en el viaje (el cíclope, Escila, los lestrigones) y cómo termina con los pretendientes de Penélope. Circe tampoco aparece.

### Rasgo visual

**Pilos**, el gorro cónico de navegante. Es el atributo con que Ulises aparece en la cerámica y la escultura griegas: firme en la iconografía. Cuerpo humano, como Minotauro, Ariadna y Eco (D19). El diseño, el color dentro de la paleta cerrada de D17 y las cuatro direcciones (D22) estaban previstos para el chat de diseño; el usuario autorizó después diseñarlos aquí en Codex (D33). SVG integrados; validación visual en dispositivo pendiente.

| Personaje | Firme en el mito | Lo decide el diseño |
|---|---|---|
| Ulises | Hombre adulto, rey de Ítaca y navegante; el pilos en la iconografía | Ropa, barba, color, pose |

### Canon: qué es firme y qué no

- Firme en la Odisea: rey de Ítaca, dentro del caballo (cantos 4 y 8), diez años de vuelta, "Nadie" ante el cíclope (canto 9), atado al mástil frente a las sirenas (canto 12), vuelve disfrazado de mendigo (cantos 13 y siguientes), dice ser cretense (cantos 13, 14 y 19), Argos lo reconoce (canto 17), se construye su balsa (canto 5).
- **No se usa "tuvo la idea del caballo":** Homero lo pone adentro del caballo, pero atribuirle la idea viene de fuentes posteriores (Apolodoro). Por eso la ficha dice que entró escondido.
- **Ulises no tiene relación con Creta.** El único lazo es la mentira cretense, y la ficha la cuenta como mentira.

## Zona nueva: el canal, entre el puerto y la plaza

El agua del puerto hoy solo sirve de borde. El canal la convierte en camino: es la única unión entre el puerto y la plaza, y se cruza solo en la barca de Ulises.

### Por qué hace falta cerrarlo al vuelo

Pegaso vuela sobre el agua y el cambio de personaje es en el lugar: todo lo que alcanza una barca lo alcanza Pegaso, que después cambia. Para que el canal sea de Ulises, el vuelo no tiene que poder entrar.

### Cómo es

- **Paredes de 3 a los dos lados** y en los dos bordes, el del puerto y el de la plaza. El vuelo llega a 2,9, así que nadie las pasa por arriba (MEMORY, "Recintos con pared de 3").
- **Dos bocas bajas**, una en cada borde: el agua pasa por debajo de la pared, con techo de roca a poca altura. Es una casilla nueva: ahí no se vuela ni se salta, y solo pasa la barca. Pegaso que llega volando choca como contra una pared.
- **Una barca con remo en cada orilla:** una amarrada en el muelle del puerto y otra en el muelle de la plaza. Con dos, nadie queda del lado sin barca: un perfil que hoy está en la plaza o el palacio puede volver al puerto, y quien cruza siempre tiene la barca con la que llegó.
- **Adentro, cielo abierto.** Una vez en el canal se puede cambiar a cualquier personaje, pero ninguno sale sin la barca.
- **El camino a pie entre el puerto y la plaza se cierra.** La abertura de hoy entre las dos zonas pasa a ser el muelle de la plaza.

### Qué enseña

Es el primer desafío de Ulises, y es solo de él, como los de la plaza. Para una jugadora nueva pasa a ser **el primer poder obligatorio del juego**: para salir del puerto hay que cambiar a Ulises. Por eso la barca con remo tiene que verse muy clara desde el muelle, y si otro personaje intenta empujarla aparece una pista ("La barca la mueve Ulises"), igual que la que ya existe cuando alguien que no es el Minotauro empuja un bloque.

### Coleccionables del canal

Dos, a los que solo se llega navegando. Los dos son objetos reales, verificados (D27). El sprite se modela sobre la pieza citada.

| id | Cómo se encuentra | Nombre | Texto |
|---|---|---|---|
| `frasco-pulpo` | A la vista, sobre una roca en medio del agua. Se ve desde el muelle y se agarra bajando de la barca | Frasco del pulpo | Un frasco de barro con un pulpo pintado que lo abraza entero, rodeado de erizos, corales y caracolas. Lo encontraron en Palaikastro, en la costa este de Creta. Sus asas ayudaban a controlar cómo salía el líquido, que quizás era aceite. Los arqueólogos llaman a este estilo "marino". |
| `sello-barco` | Escondido: no se dibuja hasta que la barca pasa a 2 casillas o menos. Desde ahí queda visible para siempre (se guarda) | Sello con barco | Una piedra tallada del tamaño de una uña, con un barco de remos y vela. Los sellos se apretaban sobre arcilla blanda para cerrar un recipiente o marcar lo que era de cada uno. En Creta se encontraron muchos, y varios muestran barcos. |

Fuentes:
- **Frasco del pulpo:** Museo Arqueológico de Heraclión, hallado en Palaikastro, unos 27 cm de alto, hacia 1500 a. C. ([Smarthistory](https://smarthistory.org/?p=31724)). El nombre de "Maestro del estilo marino" para su pintor es una atribución discutida: no va en el texto.
- **Sello con barco:** modelo, el sello del Ashmolean (AN1938.958), de esteatita negra, de 1,6 a 2 cm, hallado en Creta central, con casco en media luna, remos, timones y mástil ([AncMed](https://ancmed.ulb.be/details.php?row=89)). Su fecha está discutida, así que el texto no la da. Hay otro parecido en Boston, sin lugar de hallazgo ([MFA 63.482](https://collections.mfa.org/objects/150520)).

La pista de que falta uno es el contador de la zona (1 de 2), que nunca baja. Con estos dos, el contador de partida pasa de 7 a 9 y suma la zona `canal` (Canal).

### Guardado: paso riesgoso

Para meter el canal hay que **correr el puerto hacia abajo**: hoy la plaza termina en la fila 73 y el puerto empieza en la 74. Se corre el puerto, no la plaza ni el palacio, porque el puerto casi no tiene estado guardado (no tiene desafíos). Lo guardado en filas del puerto (`llegada` y cualquier mecanismo) se traslada las filas que ocupe el canal, con una migración de una sola vez como `migrarAlMundo`. Tiene que correr **después** de esa migración, para no romper los perfiles de antes de D23. CLAUDE.md lo marca como paso riesgoso: corrida completa de `probar.js` y confirmación de Willy antes del merge.

Al dibujar el mapa, respetar MEMORY: una pared de 3 tapa unas dos filas hacia el norte, así que las dos primeras filas del canal y de la plaza, al norte de cada pared, no llevan nada importante.

## Encaje en el cambio de personaje

- La tira pasa de cinco a seis lugares. Hoy está fija en cinco columnas (`#tira` en `estilos.css`); al construir, verificar en el celular que seis entren en vertical con botones grandes.
- Los seis siguen disponibles desde el inicio (CLAUDE.md, Reglas del juego).
- Señal de que hace falta Ulises: la barca con remo en el muelle, frente a la boca baja del canal.

## Abierto

- **Cómo se ve la boca baja:** implementada con SVG de roca y transparencia permanente de 0,55, conservando el tratamiento de U1 (D33). Lectura real en dispositivo pendiente.
- **Ficha nueva:** implementado el aviso una sola vez en perfiles anteriores con progreso, con pruebas de conservación, acceso a ficha y ausencia de repetición. Los perfiles nuevos no reciben un aviso de novedad histórica. Validación de uso en dispositivo pendiente.

## Sesiones de Code

Cada sesión se construye cuando `node herramientas/probar.js` pasa y se valida cuando Willy la probó en el celular. El estado vive en `ROADMAP.md`. Los sprites de Ulises, la barca con remo, la boca baja y los dos objetos tienen que estar antes de U2 (U1 corre con marcadores, como en A0). Fueron diseñados aquí con autorización posterior del usuario (D33); sigue pendiente cotejar visualmente los dos objetos con las piezas originales antes de publicar.

### U1: poder de Ulises en el campo de pruebas
- **Alcance:**
  - Sexto personaje en `datos/personajes.json` (id `ulises`, poder `navegar`, rasgo `pilos`) con el texto de la ficha de este documento.
  - La tira de personajes pasa a seis columnas.
  - Barca con remo como objeto del mapa (letra o lista en el JSON, a decidir por Code): subir, navegar por agua, bajar junto a tierra firme.
  - Estado: posición de la barca guardada por perfil y por mapa, con clave propia en `estado()`; una barca restaurada arranca en su lugar guardado.
  - Reglas de la ficha: la barca es piso firme para cualquier personaje, solo Ulises la mueve (los demás reciben la pista "La barca la mueve Ulises"), cambiar de personaje arriba de la barca deja al nuevo parado en ella, y quien cae al agua desde la barca reaparece en ella.
  - La boca baja como casilla nueva: bloquea vuelo y salto, deja pasar la barca.
  - Campo de pruebas con una barca, una boca baja y una orilla enfrente.
- **Fuera de alcance:** el canal, el puerto corrido, los dos coleccionables y los sprites definitivos.
- **Terminado (`probar.js`):**
  - Ulises sube a la barca, cruza hasta la otra orilla, baja y recarga: la barca sigue donde la dejó.
  - Pegaso en vuelo no pasa por la boca baja y la barca sí.
  - Un personaje distinto de Ulises parado en la barca no la mueve y recibe la pista.
  - Caer al agua desde la barca reaparece en la barca y no pierde nada.
  - Con la barca de un perfil restaurado, nadie queda varado sin barca.
  - Seis personajes en la tira, todos seleccionables, ninguno con texto en inglés.
- **Decisión previa:** D29.

### U2: el canal entre el puerto y la plaza
- **Alcance:**
  - La zona `canal` en `datos/mapa-mundo.json`: se corre el puerto hacia abajo, paredes de 3, una boca baja en cada borde, una barca en cada orilla.
  - Migración del guardado del puerto, una sola vez y después de `migrarAlMundo` (marca propia en el perfil).
  - Los dos coleccionables del canal: `frasco-pulpo` a la vista y `sello-barco` que se dibuja recién con la barca a 2 casillas o menos y queda visible para siempre.
  - Zona `canal` en `coleccionables.json`; el contador de partida pasa de 7 a 9.
- **Terminado (`probar.js`):**
  - Un recorrido completo desde el inicio que pasa por el canal con Ulises, junta los dos objetos y llega a la plaza.
  - Ningún otro personaje cruza el canal (Pegaso volando, el Minotauro, Ariadna con soga, Fénix, Eco).
  - Un perfil guardado antes del cambio, con progreso en puerto, plaza y palacio, carga con todo en su lugar y puede volver al puerto.
  - Corrida completa de `probar.js` (paso riesgoso) y confirmación de Willy antes del merge.
- **Decisión previa:** D30.

### Validación en el celular
- ¿Entiende sola que tiene que cambiar a Ulises para salir del puerto? ¿Cuánto tarda y qué toca antes?
- ¿La barca con remo se lee como "subir acá"?
- ¿Cabe la tira de seis con botones grandes?
- ¿Descubre el sello escondido, o solo lo nota por el contador?
- ¿Pegaso le choca contra la boca baja y entiende por qué?
