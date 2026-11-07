# Charla con Dédalo

Primera charla del juego, escrita como ejemplo completo para el motor de charlas del plan de desbloqueo (`plan-desbloqueo.md`, PR #26). Sirve de plantilla: la estructura de datos de abajo es una propuesta para que el motor la lea.

No hay código en este documento. No toca `CLAUDE.md` ni `DECISIONS.md`: la decisión la anota la sesión que construya el motor.

## Tono

Para chicos de 10 años o más. Sin violencia explícita y sin detalle crudo, pero sin esconder lo que pasó: la caída de Ícaro se cuenta y tiene peso. Dédalo habla en voseo rioplatense, directo, como un artesano que explica con las manos. Frases cortas, una idea por pantalla.

Límites para el celular en vertical: cada pantalla de Dédalo tiene hasta unos 220 caracteres; cada opción, hasta unos 60.

## Canon que usa

Todo es de canon firme y está cotejado (ver más abajo).

- Dédalo es un artesano ateniense, el mejor de su tiempo, que trabaja para el rey Minos en Creta.
- Minos le encarga el laberinto para guardar al Minotauro (Asterión). El laberinto es tan intrincado que el propio Dédalo casi no encuentra la salida.
- Dédalo le cuenta a Ariadna el secreto para salir, y ella le da a Teseo el ovillo. Coincide con las fichas ya escritas en `plan-etapa-1.md`.
- Minos no deja que Dédalo y su hijo Ícaro se vayan por tierra ni por mar. Dédalo arma alas con plumas y cera.
- Ícaro vuela demasiado alto, la cera se derrite y cae al mar. Dédalo llega a Sicilia.

**Se deja afuera:** por qué Dédalo salió de Atenas, cómo fue concebido el Minotauro, el tributo de jóvenes y cualquier detalle del enfrentamiento. La charla dice que Teseo lo venció, igual que la ficha del Minotauro.

**Cotejado (2026-11-07):**
- Con la ficha de Dédalo de `JuegoMitosFeli` (`personajes.json`, id `dedalo`, tier plateado): el texto coincide (inventor de Atenas, laberinto, alas de plumas y cera, advertencia a Ícaro, cae al mar que lleva su nombre, llega a Sicilia).
- Con Ovidio, *Metamorfosis* VIII (traducción de David Drake, https://david-drake.com/2007/metamorphoses-daedalus/): las plumas se ordenan de menor a mayor, se cosen al medio con hilo, se fijan en la base con cera y el armazón se curva. La advertencia es volar a media altura: bajo, la espuma pesa las alas; alto, el sol las quema. Dédalo casi no encuentra la salida de su propio laberinto.
- Un ajuste: la ficha dice solo "no vueles demasiado alto". La charla suma lo del mar porque está en Ovidio. Si preferís ceñirte a la ficha, se saca esa mitad de la frase en N4b.

## Habilidades (de la ficha)

Fuerza 3, astucia 10, valentía 6, magia 4, liderazgo 4, bondad 6. Astucia en el máximo de la escala y fuerza baja. Todavía no condicionan nada en esta charla; cuando se diseñe qué habilita cada habilidad, la astucia de Dédalo es la candidata natural para una opción que solo él ofrece.

## Cómo se juega

- Se llega a Dédalo por recomendación de otro personaje (cadena del plan de desbloqueo). Dónde está en el mapa queda abierto (ver preguntas).
- La charla se puede repetir siempre.
- Elegir mal nunca castiga: la rama distinta explica otra vez y vuelve.
- Hay una parte que solo se abre si se aprendió algo antes dentro de la misma charla (el saber `alas`). Es el ejemplo de "un saber abre una charla".

## Árbol

`→` es a dónde lleva la opción. Un nodo sin opciones termina la charla.

**N1 · inicio**
> Dédalo, sin dejar de atar plumas: "Mirá vos, alguien que mira antes de tocar. Soy Dédalo, artesano. ¿Qué querés saber?"
- "¿Qué estás armando?" → N2
- "Dicen que hiciste el laberinto." → N5

**N2 · las plumas**
> "Alas. Se arman de a una pluma, de la más corta a la más larga, como una escalera. ¿Por qué creés que van así?"
- "Para que la ala se curve como la de un pájaro." → N3
- "Para que quede prolija." → N2b

**N2b · rama distinta**
> "Prolija queda, sí. Pero una ala no vuela por prolija. Fijate cómo se curva cuando la ordeno así. Probá de nuevo."
- "Ah, para que se curve." → N3

**N3 · las alas, bien dicho** · da el saber `alas`
> "Eso. La curva agarra el aire. Las plumas se atan con hilo en el medio y se pegan con cera en la base."
- "¿Y para qué las hacés?" → N4
- "Gracias, eso quería saber." → fin

**N4 · el cielo** · solo aparece si se tiene `alas`
> "Minos no nos dejaba salir de Creta, ni por tierra ni por mar. Quedaba el cielo. Eran dos pares: uno para mí y uno para mi hijo, Ícaro."
- "¿Y salió bien?" → N4b
- "Me quedo con la parte del cielo." → fin

**N4b · Ícaro**
> "Le dije que no subiera hacia el sol, que la cera se ablanda, ni bajara al mar, que la espuma moja las plumas. Voló tan contento que subió de más. La cera cedió y cayó al mar."
- "Lo siento." → N4c
- "¿Y vos?" → N4d

**N4c**
> "Gracias. Lo busqué hasta encontrarlo. Ese mar hoy lleva su nombre. Aprendí que un buen invento no alcanza si se olvida la advertencia."
- "Voy a tenerlo presente." → fin

**N4d**
> "Seguí volando, con las alas puestas y el corazón en otra parte. Llegué a Sicilia. Desde ahí se ve lejos todo lo que perdí."
- "Gracias por contármelo." → fin

**N5 · el laberinto**
> "Minos quería un lugar del que nadie saliera. Lo hice tan enredado que casi no encuentro yo mismo la salida."
- "¿Y quién vivía adentro?" → N6
- "¿Cómo se sale de ahí?" → N7

**N6 · el Minotauro**
> "Asterión, hijo de la reina Pasífae, mitad hombre y mitad toro. Minos lo guardaba ahí. Teseo entró y lo venció."
- "¿Y cómo salió Teseo?" → N7
- "Entiendo." → fin

**N7 · el hilo** · da el saber `secreto-del-hilo`
> "Con un hilo. Yo le conté el secreto a Ariadna, la hija de Minos, y ella le dio a Teseo un ovillo para marcar el camino de vuelta."
- "Quiero hablar con ella." → fin (recomienda a Ariadna)
- "Y con Teseo." → fin (recomienda a Teseo)

## Lo que deja la charla

| Saber | Se obtiene en | Para qué sirve |
|---|---|---|
| `alas` | N3 | Abre N4 dentro de esta charla. Propuesta: que Pegaso o Fénix lo reconozcan como guiño (las plumas sueltas del almacén ya existen en `diseno-ambiente.md`). |
| `secreto-del-hilo` | N7 | Propuesta: abre la charla de Ariadna o de Teseo según el plan de la cadena. |

Dédalo recomienda a Ariadna y a Teseo desde N7. Si el plan de desbloqueo ordena la cadena distinto, solo cambian esos dos finales.

## Estructura de datos propuesta

Un archivo por charla en `datos/charlas/`, por ejemplo `dedalo.json`. Texto en español, sin un solo campo visible en inglés. Los identificadores van en minúsculas sin acentos.

```json
{
  "id": "dedalo",
  "interlocutor": "dedalo",
  "inicio": "n1",
  "nodos": {
    "n1": {
      "texto": "…",
      "opciones": [
        { "texto": "…", "va": "n2" },
        { "texto": "…", "va": "n5" }
      ]
    },
    "n3": {
      "texto": "…",
      "da": ["alas"],
      "opciones": [{ "texto": "…", "va": "n4" }]
    },
    "n4": {
      "texto": "…",
      "requiere": { "saber": "alas" },
      "opciones": []
    }
  }
}
```

- `va` apunta a un nodo; sin `va` o con `opciones` vacío, la charla termina.
- `da` lista los saberes que se guardan al llegar a ese nodo.
- `requiere` sobre un nodo o una opción la oculta hasta tener ese saber. Más adelante podría pedir una habilidad (por ejemplo astucia con un mínimo); no se usa acá porque todavía no se diseñó qué habilita cada habilidad.
- Una opción que sale de una rama "distinta" vuelve al nodo bueno con `va`: no hay campo de castigo ni de fracaso.

## Preguntas abiertas

1. **El taller.** Hay que armar un taller para Dédalo, en una habitación o al aire libre (decisión de Guille, 2026-11-07). Falta elegir en qué zona va y construirlo: es un cambio de mapa y de código, no de este documento. Lo que necesita el taller: un banco con plumas y cera visibles y un lugar donde se pueda parar a hablar con él. La regla de la zona elegida (alturas, paredes) se resuelve al diseñarlo.
2. **Guiño de Pegaso o Fénix** a las plumas de N2: aprobado como idea (2026-11-07), sin construir.
3. **Fuera de esta charla, pero en la ficha:** el capítulo "El Hilo y la Caracola" (Dédalo pasa un hilo por una caracola con una hormiga y una gota de miel) sirve para una segunda charla de acertijo si se quiere. No lo agregué.
4. **El otro juego tiene un oráculo** (`oraculo.html`, `oraculo.js`). Conviene mirarlo cuando se diseñe el oráculo de este juego, antes de inventar uno desde cero.
