# Plan etapa 1: primer mapa (puerto, plaza y palacio)

Diseño y contenido definidos en Chat. Code ejecuta sesión por sesión, en este orden, y no arranca una sesión sin la decisión marcada como previa.

## Qué es la etapa 1

Un solo mapa jugable de punta a punta (puerto, plaza central, palacio en terrazas) con los cinco personajes y sus cinco poderes funcionando, y el catálogo real de coleccionables. Se cierra con el criterio de `CLAUDE.md`: la jugadora lo usó en el celular, entendió cómo cambiar de personaje sin que se lo expliquen dos veces y volvió a jugar por decisión propia.

Pasan a etapa 2: laberinto, cueva del monte y personajes nuevos. Siguen fuera: taller de Dédalo y Talos.

## Premisas revisadas

**1. "Descubrir qué personaje usar" hoy no es un desafío.** En el campo de pruebas cada obstáculo tiene un único dueño: lo alto es de Pegaso, lo que se empuja o rompe es del Minotauro. Alcanza con reconocer el tipo de obstáculo. El desafío intelectual aparece cuando un lugar necesita **dos personajes en secuencia** y el primero que se te ocurre no alcanza (Pegaso llega a la terraza, pero arriba hay un muro que solo rompe el Minotauro, que no vuela). Por eso la plaza enseña poderes de a uno y el palacio solo tiene desafíos de a dos.

**2. Hoy se rompe una regla dura: el mundo no se guarda.** `nucleo.js` guarda solo los objetos recogidos. `crearMundo` arranca cada reja cerrada, cada muro entero y cada bloque en su lugar. Al recargar, lo abierto se cierra y lo roto vuelve. Contradice "nada se cierra ni se pierde" y todo poder nuevo (braseros, sogas, sonidos) depende de que esto se resuelva primero.

**3. Ariadna no puede tener un desafío propio.** Pegaso ya cruza y sube a todo lo que una soga podría alcanzar. El valor del hilo es habilitar a los que no vuelan. Su primer desafío va en pareja con el Minotauro.

**4. Eco en un celular sin sonido.** Si el poder depende de oír, falla con el volumen en cero, que en celular es lo más común. El sonido tiene que verse siempre (ondas de color con un símbolo). El audio es un extra.

**5. Fénix no viene del fuego en las fuentes clásicas.** Heródoto y Ovidio lo asocian al Sol (Heliópolis, la ciudad del Sol) y a un nido de especias; renacer entre llamas es una versión más tardía. Un poder de luz se sostiene en el canon; uno de fuego, menos.

**6. Un Minotauro jugable choca con el mito.** En el mito está encerrado y Teseo lo vence. Acá anda libre y ayuda. Se resuelve con la ficha en tercera persona (cuenta el mito, no la historia del juego), pero conviene ver si la jugadora pregunta.

**7. Tres coleccionables no sostienen "volver a jugar".** El catálogo de la etapa 1 sube a siete, repartidos para que cada zona tenga algo.

**8. Un elegible sin poder confunde.** Hoy Ariadna, Fénix y Eco se eligen y el botón no hace nada. Hasta que tengan poder, es lo primero que hay que mirar en la prueba (ver al final).

## Elenco: fichas definitivas

Cada ficha tiene el texto que se muestra en el juego y la regla exacta del poder. Ningún poder repite el verbo de otro: **subir** (Pegaso), **mover y romper** (Minotauro), **tender** (Ariadna), **encender** (Fénix), **repetir** (Eco).

### Pegaso

**Texto:** Caballo con alas. Nació cuando el héroe Perseo venció a Medusa. De un golpe de casco hizo brotar una fuente en el monte Helicón, la fuente de las Musas. Llevó los rayos de Zeus y hoy es una constelación.

**Poder, Volar (sin cambios):** mantener el botón para subir a terrazas y techos. No atraviesa paredes. No empuja ni rompe.

**Señal en el mapa:** algo visible sobre una terraza o un techo.

### Minotauro

**Texto:** Su nombre era Asterión, que quiere decir "el estrellado". Era hijo de la reina Pasífae, medio hermano de Ariadna, y tenía cabeza de toro. El rey Minos le encargó a Dédalo un laberinto para encerrarlo. Teseo entró con el hilo de Ariadna, lo venció y encontró la salida.

(Ver decisión D5 sobre la última oración.)

**Poder, Fuerza (sin cambios):** empujar bloques y vasijas sobre baldosas; embestir para romper muros agrietados. No sube a terrazas por sí solo.

**Señal en el mapa:** baldosas, bloques, vasijas, grietas.

**Lo que se omite del mito:** cómo fue concebido, el tributo de jóvenes de Atenas y cualquier detalle del enfrentamiento.

### Ariadna

**Texto:** Hija del rey Minos de Creta. Dédalo le contó el secreto del laberinto, y ella le dio a Teseo un ovillo de hilo para encontrar el camino de vuelta. Después vivió en la isla de Naxos y se casó con el dios Dioniso, que puso su corona entre las estrellas.

**Poder, Hilo:** parada junto a una argolla de bronce, el botón tiende una soga hasta otra argolla a la vista, en línea recta y hasta 5 casillas (D4). La soga queda para siempre y la usan todos los personajes:
- entre suelo y terraza, es una escala: se sube caminando contra ella;
- entre dos puntos de la misma altura, es un puente.

Las argollas están puestas en el mapa; la soga no se tiende en cualquier lugar.

**Señal en el mapa:** pares de argollas de bronce.

**Variante descartada:** en algunas versiones Ariadna le da a Teseo una corona luminosa para ver en el laberinto. No se usa: pisaría a Fénix.

### Fénix

**Texto:** Ave de plumas rojas y doradas. Heródoto cuenta que vive en Arabia y que cada quinientos años viaja a Heliópolis, la ciudad del Sol, en Egipto. Aclara que él nunca la vio, solo pinturas. Ovidio cuenta que al final de su vida arma un nido de especias en una palmera y que de ahí nace un fénix nuevo. Lo de renacer entre llamas lo agregaron relatos posteriores.

**Poder, Luz:** el botón la hace brillar y enciende los braseros cercanos. Un brasero encendido no se apaga más. Una puerta del sol (disco solar en la pared) se abre cuando están encendidos todos los braseros enlazados a ella. Técnicamente es el mismo mecanismo que placa → reja, con braseros en lugar de placas.

**Vuela como Pegaso** (D2): mantener el botón vuela; tocar brilla y enciende.

**Señal en el mapa:** braseros apagados y discos de sol.

### Eco

**Texto:** Ninfa de los montes. Hablaba tanto que la diosa Hera la castigó: desde entonces solo puede repetir las últimas palabras que escucha. Se enamoró de Narciso, que no le hizo caso, y se fue apagando hasta que de ella quedó solo la voz. Por eso, en los montes y las cuevas, todavía contesta.

**Poder, Voz:** Eco guarda **un solo** sonido, el último que escuchó (fiel al castigo de Hera). Escucha un sonido acercándose a algo que suena. Con el botón lo repite, y su eco se multiplica: llega hasta 6 casillas y **atraviesa paredes**. Si alcanza un mecanismo que responde a ese sonido, el mecanismo se abre y queda abierto.

Fuentes de sonido:
- algunas suenan solas mientras ella esté cerca (la caracola del puerto);
- otras hay que hacerlas sonar con otro personaje (un címbalo de bronce que golpea el Minotauro o al que llega Pegaso). Una vez que sonó, sigue vibrando para siempre.

Cada sonido tiene un color y un símbolo; el mecanismo que le responde lleva el mismo. El poder se entiende con el volumen en cero (D3).

**Señal en el mapa:** objetos con ondas y puertas con el símbolo de un sonido.

**Por qué no "revelar pasajes":** la ficha anterior habla de una voz que se multiplica. Repetir lo último que oyó es el castigo del mito; multiplicarse y atravesar paredes es lo que hace un eco de verdad. Revelar pasajes no tiene base y se superpondría con Fénix.

## El mapa

Inspiración: Cnosos y su puerto. Sin nombres de lugares reales en pantalla salvo en los textos de coleccionables.

### Puerto (inicio, sin desafíos)

Muelle, barcas, agua. Enseña a moverse, saltar, caer al agua y reaparecer, y cambiar de personaje. Tiene la **caracola** (fuente de sonido que suena sola, la primera que Eco puede guardar) y un coleccionable a la vista que se agarra caminando. Sale hacia la plaza.

### Plaza central (un poder por desafío)

Tres desafíos, cada uno exclusivo de un personaje:
- **Pórtico del sol (Fénix):** dos braseros, una puerta del sol. Detrás, un coleccionable.
- **Puerta del mar (Eco):** puerta con el símbolo de la caracola, en un patio cerrado. Eco trae el sonido desde el puerto y lo repite desde afuera del patio.
- **Muro agrietado (Minotauro):** detrás, un coleccionable.

Pegaso se usa libremente en terrazas bajas sin premio, para practicar. Ariadna no tiene desafío en la plaza (premisa 3), pero hay un par de argollas sin función crítica para que vea qué hace.

La entrada al palacio es una rampa ancha, caminable por todos.

### Palacio en terrazas (dos poderes por desafío)

Cada desafío usa un par distinto y entre los tres aparecen los cinco personajes. Respetar la regla de `MEMORY.md`: nada de muros altos al sur que tapen la zona.

- **Almacenes (Fénix, después Minotauro):** pasillo con tinajas. Fénix enciende los braseros y abre la puerta del sol del depósito; adentro, el Minotauro empuja una vasija sobre una placa que abre la reja del coleccionable.
- **Terraza de los frescos (Ariadna, después Minotauro):** el coleccionable está detrás de un muro agrietado arriba de una terraza. Pegaso llega pero no rompe; el Minotauro rompe pero no llega. Ariadna tiende la escala desde el suelo y el Minotauro sube.
- **Sala de los címbalos (Pegaso, después Eco):** el címbalo de bronce está en un techo. Pegaso vuela y lo hace sonar; queda vibrando. Eco lo escucha desde abajo, cruza el palacio y lo repite contra la puerta de bronce, que está detrás de una pared.

## Catálogo de coleccionables

Siete en total, aprobado. Todo lo que dicen es arqueología o testimonio antiguo verificable; donde los estudiosos no están de acuerdo, el texto lo dice.

| id | Zona | Desafío | Nombre | Texto |
|---|---|---|---|---|
| `ancla-piedra` | puerto | ninguno | Ancla de piedra | Una piedra pesada con un agujero para pasar la soga. Así anclaban los barcos de Creta hace más de tres mil años. Los griegos contaban que el rey Minos tuvo la primera flota que dominó el mar. |
| `tablero-juego` | plaza | Fénix | Tablero de juego | Lo encontraron en el palacio de Cnosos, decorado con marfil, cristal de roca, oro y plata. Es un tablero para jugar, pero nadie sabe cuáles eran las reglas. |
| `fresco-delfines` | plaza | Eco | Fresco de los delfines | Un pedazo de pintura con delfines y peces nadando. Una copia decora hoy una sala del palacio, aunque hay estudiosos que creen que el original no estaba en esa pared sino en el piso de una sala de arriba. |
| `riton-toro` | plaza | Minotauro | Ritón con cabeza de toro | Una vasija de piedra con forma de cabeza de toro. Se usaba para verter líquidos en ceremonias. En Creta el toro aparece en todas partes: en pinturas, en vasijas y en los mitos. |
| `tablilla-arcilla` | palacio | Fénix y Minotauro | Tablilla de arcilla | En los almacenes del palacio había cientos de tinajas enormes para granos y aceite. En tablillas como esta anotaban lo que había, con una escritura de signos llamada lineal B. Se conservaron porque el incendio que destruyó el palacio las coció como ladrillos. |
| `hacha-doble` | palacio | Ariadna y Minotauro | Hacha doble | Un hacha con dos filos iguales, que en griego se dice labrys. Aparece grabada en paredes y pilares de Cnosos. Algunos estudiosos creen que de ahí viene la palabra laberinto, "la casa del hacha doble". Nadie lo sabe con seguridad. |
| `figura-serpientes` | palacio | Pegaso y Eco | Figura con serpientes | Una figura de cerámica brillante que sostiene una serpiente en cada mano. Estaba guardada en unos cofres de piedra escondidos bajo el piso del palacio. Nadie sabe si representa a una diosa o a una sacerdotisa. |

Zonas para `coleccionables.json`: `puerto` (Puerto), `plaza` (Plaza central), `palacio` (Palacio). La zona `pruebas` se mantiene mientras exista el campo de pruebas (D8).

## Sesiones de Code

Cada sesión se construye cuando `node herramientas/probar.js` pasa y se valida cuando Willy lo probó en el celular. El estado de cada una está en `ROADMAP.md`. La sesión 0 no es de Code.

### Sesión 0: prueba con la jugadora (sin Code)
- **Alcance:** jugar el campo de pruebas actual en un celular real.
- **Terminado:** observaciones anotadas fuera del repo (ver lista al final).
- **Decisión previa:** ninguna.

### Sesión 1: el mundo se guarda
- **Alcance:** guardar por perfil y por mapa los muros rotos, las rejas abiertas y la posición de bloques y vasijas. Formato pensado para sumar braseros, sogas y sonidos sin migrar de nuevo. Más los arreglos puntuales que salgan de la sesión 0, si son chicos.
- **Terminado:** en `probar.js`, romper un muro, abrir una reja, mover un bloque, recargar: todo sigue igual. En el celular, lo mismo cerrando y abriendo la app.
- **Decisión previa:** resuelta, los perfiles de prueba se pueden borrar. Igual no hizo falta: los perfiles viejos cargan con el mundo intacto.

### Sesión 2: poder de Fénix
- **Alcance:** braseros (apagado y encendido, permanente), puertas del sol enlazadas a uno o varios braseros, en el campo de pruebas.
- **Terminado:** en `probar.js`, Fénix enciende dos braseros, la puerta se abre, se recarga y sigue abierta; ningún otro personaje enciende braseros.
- **Decisión previa:** D2.

### Sesión 3: poder de Eco
- **Alcance:** fuentes de sonido (sola y activada por otro personaje), un único sonido guardado visible en la interfaz, repetir con alcance a través de paredes, mecanismos por símbolo, todo visible sin audio. Audio solo si D3 lo pide, sintetizado en el navegador sin archivos.
- **Terminado:** en `probar.js`, Eco guarda el sonido A, guarda el B (el A se pierde, porque ella solo repite lo último), repite B a través de una pared y abre su puerta; la puerta de A no se abre con B. Probado en el celular con el volumen en cero.
- **Decisión previa:** D3.

### Sesión 4: poder de Ariadna
- **Alcance:** argollas, soga escala (suelo a terraza) y soga puente (misma altura), permanentes, usables por los cinco.
- **Terminado:** en `probar.js`, Ariadna tiende una escala, el Minotauro sube por ella y embiste un muro en la terraza; se recarga y la soga sigue.
- **Decisión previa:** D4.

### Sesión 5: fichas y catálogo
- **Alcance:** cargar las fichas de este documento (texto y poder) accesibles desde la tira de personajes, y el catálogo real en `coleccionables.json`.
- **Terminado:** las cinco fichas se abren en el celular y se leen sin cortarse; ningún texto en inglés.
- **Decisión previa:** D5 y D6.

### Sesión 6: puerto y plaza
- **Alcance:** los dos mapas, el paso entre ellos y los cuatro coleccionables de esas zonas.
- **Terminado:** en `probar.js`, un recorrido completo desde el inicio que junta los cuatro con los personajes correctos, y verifica que ningún desafío de la plaza se puede resolver con otro personaje.
- **Decisión previa:** D7.

### Sesión 7: palacio
- **Alcance:** el palacio en terrazas con los tres desafíos de a dos.
- **Terminado:** en `probar.js`, los tres desafíos resueltos en secuencia, y verificado que ninguno se resuelve con un solo personaje.
- **Decisión previa:** ninguna nueva.

### Sesión 8: cierre de etapa
- **Alcance:** prueba integral con la jugadora y arreglos menores. Retirar o esconder el campo de pruebas según D8.
- **Terminado:** criterio de terminado de `CLAUDE.md`.

## Orden recomendado

1. **Sesión 0, prueba con la jugadora.** Cuesta cero sesiones de Code, y lo que más riesgo tiene (si entiende el cambio de personaje, si el joystick funciona en su mano) ya está construido. Si eso falla, todo lo demás se apoya en algo roto.
2. **Sesión 1, el mundo se guarda.** Es una regla dura rota hoy, y cada poder nuevo agrega estado para guardar: cuanto antes, menos para migrar.
3. **Sesión 2, Fénix.** El poder más barato (reusa el mecanismo placa → reja) y saca a un personaje de la lista de "elijo y no hace nada".
4. **Sesión 3, Eco.** Exclusivo y el más rico para desafíos, pero el más caro. Va antes que Ariadna porque no depende de terrazas.
5. **Sesión 4, Ariadna.** Solo vale en combinación con el Minotauro y sobre terrazas: se prueba mejor cuando los demás ya andan.
6. **Sesión 5, fichas y catálogo.** Es carga de texto. Puede adelantarse a cualquier punto si en la prueba la jugadora pregunta por los personajes.
7. **Sesión 6, puerto y plaza.** Construir el mapa recién cuando los cinco poderes existen evita rehacerlo.
8. **Sesión 7, palacio.**
9. **Sesión 8, cierre.**

## Decisiones

Viven en `DECISIONS.md` (D1 a D8 y las posteriores), con su estado y el porqué. El estado de cada sesión vive en `ROADMAP.md`.

## Qué observar en la prueba con la jugadora

Anotar fuera del repo. No hace falta preguntarle nada mientras juega.

- **Cambio de personaje:** ¿lo descubre sola? ¿Cuánto tarda? ¿Toca la tira o busca otra cosa? → Si necesita que se lo expliquen dos veces, la sesión 1 incluye arreglarlo antes que nada.
- **Personajes sin poder:** ¿elige a Ariadna, Fénix o Eco y aprieta el botón? ¿Qué esperaba que hicieran? Anotar sus palabras. → Si insiste con alguno, ese poder sube en el orden; si lo que esperaba contradice la ficha, se revisa la ficha.
- **Lectura de obstáculos:** ¿se da cuenta sola de que la terraza es de Pegaso y el muro agrietado del Minotauro, o salta una y otra vez contra la terraza? → Si no lee las señales, los desafíos de a dos van a frustrar; reforzar señales antes de la sesión 7.
- **Joystick y botones:** ¿el pulgar tapa al personaje? ¿Le sale mantener apretado para volar? ¿Embestir le sale sin querer?
- **Caídas:** ¿se ríe o se frustra cuando cae al agua?
- **Personaje detrás de paredes:** ¿se pierde cuando queda tapado?
- **Sonido:** ¿juega con el volumen activado o en silencio? → Define D3.
- **Coleccionables:** ¿lee el texto de marcador o lo cierra rápido? ¿Pregunta qué son? → Define cuánto texto aguanta cada ficha y cada objeto.
- **Minotauro:** ¿pregunta quién es o por qué ayuda? → Define D6.
- **Al terminar los tres:** ¿pide más, explora sin objetivo o deja el celular? ¿Vuelve otro día sin que se lo propongan? → Si se aburre rápido, el mapa (sesión 6) se adelanta y los poderes entran después en el mapa directamente.
