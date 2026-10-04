# Ambiente: flora, fauna y detalles

Qué poner en los mapas para que no se sientan vacíos, sin tocar el progreso. Ningún elemento de este documento es requisito para avanzar, da coleccionables ni se cuenta en ningún lado.

## Dos tipos

- **Decorado:** solo se ve. Puede moverse solo (olas, hojas, un pájaro que cruza), pero no reacciona.
- **Vivo:** reacciona a la jugadora. Al pasar cerca reacciona igual con cualquier personaje; con el poder de un personaje reacciona distinto.

## Reglas

1. **No parece un acertijo.** Nada de ambiente usa el código visual de los mecanismos (brillo de coleccionable, argolla, placa, brasero, fuente de sonido). Si algo del ambiente puede confundirse con un desafío, se cambia el ambiente, no el desafío.
2. **No bloquea.** Animales y flores no tienen colisión. Árboles y macetas grandes sí pueden ser obstáculo, pero nunca en una casilla de desafío, de baldosas `,` o de su anillo, ni en el carril de una soga.
3. **No se guarda.** Las reacciones son momentáneas y el ambiente vuelve a su estado al rato o al salir del mapa. No suma claves al perfil. (No choca con "nada se cierra": eso rige para mecanismos, no para ambiente.)
4. **Ningún animal sufre ni desaparece.** Espantar es que se vaya volando o corriendo y vuelva. El Minotauro nunca lastima nada.
5. **El mito lo cuenta la reacción, no un texto.** Sin carteles ni avisos explicativos.
6. **Todo lo que suena también se ve** (misma regla de `sonido.js`).
7. **Densidad:** que se sienta habitado sin tapar el piso. Agrupar en manchas (un cantero, una bandada) en vez de repartir de a uno.

## Reacciones por personaje

Cada elemento vivo tiene una reacción común (al pasar) y, si corresponde, una propia del poder. No todos tienen las cinco.

| Personaje | Patrón de reacción con su poder |
|---|---|
| Pegaso | Al volar cerca, las aves levantan vuelo y lo acompañan un tramo |
| Minotauro | Al embestir o empujar cerca, los animales de suelo se apartan; los grandes lo miran y bajan la cabeza |
| Ariadna | Al tender o pasar con el hilo, los gatos lo persiguen y juegan |
| Fénix | Al brillar, flores se abren y lo cerrado se ilumina |
| Eco | Al usar la voz, aves y animales que hacen ruido responden repitiendo |

## Catálogo por mapa

Columna **Base**: *arqueología* (está en frescos, cerámica o restos minoicos) o *mito* (con la fuente). Columna **Firme**: si el canon alcanza o si hay que confirmar antes de construir.

### Puerto

| Elemento | Tipo | Base | Firme | Reacción |
|---|---|---|---|---|
| Delfines en el agua | Vivo | Arqueología (fresco de los delfines, Cnosos) y mito (Apolo tomó forma de delfín para guiar a marinos cretenses, Himno homérico a Apolo) | Sí | Saltan solos cada tanto. Pegaso o Fénix volando sobre el agua: saltan siguiéndolo. Eco: responden con un chasquido |
| Pulpo en las rocas de la orilla | Vivo | Arqueología (cerámica de estilo marino) | Sí | Al pasar se esconde y asoma un ojo. Fénix: cambia de color con el brillo |
| Gaviotas en los postes | Vivo | Genérico | Sí | Al pasar se corren. Pegaso: vuelan con él. Eco: repiten el graznido |
| Toro blanco en una lomada junto al mar | Vivo | Mito (el toro que Poseidón hizo salir del mar para Minos) | Sí, contado suavizado: solo es un toro blanco hermoso mirando el mar | Minotauro cerca: los dos bajan la cabeza a la vez. Nadie más le hace nada |
| Redes, ánforas apiladas, conchas | Decorado | Arqueología | Sí | — |

### Plaza

| Elemento | Tipo | Base | Firme | Reacción |
|---|---|---|---|---|
| Lirios en canteros | Vivo | Arqueología (fresco de los lirios, Amnisos) | Sí | Se mecen al pasar. Fénix: se abren |
| Azafrán | Decorado | Arqueología (fresco de las recolectoras de azafrán, Akrotiri) | Sí | — |
| Narcisos junto a la fuente | Vivo | Mito (Eco y Narciso, Ovidio) | Sí | Solo con Eco: al usar la voz cerca, las flores se inclinan hacia el agua. Con el resto, nada especial |
| Olivo | Decorado (obstáculo) | Mito (regalo de Atenea) | Sí | Pegaso volando cerca: caen hojas |
| Granado | Vivo | Mito (Perséfone y las semillas) | Sí | Minotauro empujando cerca: se mueve y cae una granada que rueda y desaparece. Sin premio |
| Cabras sueltas | Vivo | Arqueología (cabra salvaje cretense en sellos y cerámica) | Sí | Al pasar se apartan. Minotauro: salen corriendo y vuelven. Eco: balan en respuesta |
| Gatos al sol | Vivo | Arqueología (gato cazando en frescos de Hagia Triada) | Sí | Al pasar se estiran. Ariadna con el hilo: lo persiguen |

### Palacio

| Elemento | Tipo | Base | Firme | Reacción |
|---|---|---|---|---|
| Colmenas y abejas en las terrazas | Vivo | Mito (Zeus de bebé, escondido en una cueva de Creta, alimentado con miel y la leche de la cabra Amaltea) y arqueología (colgante de las abejas, Malia) | Sí | Zumban alrededor. Eco: el zumbido se repite y las abejas se ordenan en ronda. Fénix: brillan |
| Una cabra en una terraza alta | Vivo | Mito (Amaltea, misma historia) | Sí, pero sin poner el nombre en pantalla (regla 5) | Solo se llega volando. Pegaso o Fénix al aterrizar cerca: se acerca y se echa al lado |
| Plumas sueltas en un rincón de los almacenes | Vivo | Mito (Dédalo armó alas con plumas y cera) | Sí | Pegaso o Fénix al pasar volando: se arremolinan y vuelven a caer |
| Monos azules en un friso | Decorado | Arqueología (fresco de los monos azules, Akrotiri) | Sí | — |
| Golondrinas en los aleros | Vivo | Arqueología (fresco de la primavera, Akrotiri) | Sí | Pegaso: vuelan con él. Eco: repiten el canto |
| Laurel en macetas | Decorado | Mito (Dafne) | Sí | — |
| Hachas dobles talladas y cuernos de consagración en los techos | Decorado | Arqueología | Sí | — |

## Pendiente de canon (no construir hasta confirmar)

- **Cigarras con relación a Titono.** Las versiones del mito no coinciden en que se convierta en cigarra. Como insecto genérico de verano sí sirve, sin mito.
- **Flor que gira hacia el sol (Clitia).** El mito es firme (Ovidio), pero la especie es dudosa: el girasol es americano y queda afuera. Si se usa, que sea una flor sin especie.
- **Talos, el gigante de bronce que cuidaba Creta.** Canon firme, pero es un personaje, no ambiente. Queda fuera de este documento.
- **Golondrinas o ruiseñores con relación a Procne y Filomela.** Mito violento, descartado como referencia. Las golondrinas quedan solo por el fresco.

## Terminado

La jugadora, sin que se lo expliquen, descubrió al menos una reacción propia de un personaje y la repitió a propósito, y en ningún momento se quedó buscando un premio en un elemento de ambiente. Si pasa lo segundo, se baja la reacción de ese elemento.
