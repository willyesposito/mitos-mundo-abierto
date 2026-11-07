# Charla con Dédalo

Primera charla del juego, escrita como ejemplo completo para el motor de charlas del plan de desbloqueo (`plan-desbloqueo.md`, PR #26). Sirve de plantilla: la estructura de datos de abajo es una propuesta para que el motor la lea.

No hay código en este documento. No toca `CLAUDE.md` ni `DECISIONS.md`: la decisión la anota la sesión que construya el motor.

## Tono

Para chicos de 10 años o más. Sin violencia explícita y sin detalle crudo, pero sin esconder lo que pasó: la caída de Ícaro se cuenta y tiene peso. Dédalo habla en voseo rioplatense, directo, como un artesano que explica con las manos. Frases cortas, una idea por pantalla.

Límites para el celular en vertical: cada pantalla de Dédalo tiene hasta unos 220 caracteres; cada opción, hasta unos 60.

## Canon que usa

Todo es de canon firme, salvo lo marcado en "A verificar".

- Dédalo es un artesano ateniense, el mejor de su tiempo, que trabaja para el rey Minos en Creta.
- Minos le encarga el laberinto para guardar al Minotauro (Asterión). El laberinto es tan intrincado que el propio Dédalo casi no encuentra la salida.
- Dédalo le cuenta a Ariadna el secreto para salir, y ella le da a Teseo el ovillo. Coincide con las fichas ya escritas en `plan-etapa-1.md`.
- Minos no deja que Dédalo y su hijo Ícaro se vayan por tierra ni por mar. Dédalo arma alas con plumas y cera.
- Ícaro vuela demasiado alto, la cera se derrite y cae al mar. Dédalo llega a Sicilia.

**Se deja afuera:** por qué Dédalo salió de Atenas, cómo fue concebido el Minotauro, el tributo de jóvenes y cualquier detalle del enfrentamiento. La charla dice que Teseo lo venció, igual que la ficha del Minotauro.

**A verificar antes de publicar:**
- El armado de las alas (plumas de menor a mayor, atadas con hilo y fijadas con cera, con una curva suave) está en Ovidio, *Metamorfosis*, libro VIII. Hay que cotejarlo contra una edición antes de dejarlo escrito así.
- La ficha de Dédalo de `JuegoMitosFeli` no está en este repo. El texto sale del canon general, no de la ficha: hay que cotejarlo con ella.

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
- `requiere` sobre un nodo o una opción la oculta hasta tener ese saber. Más adelante podría pedir una habilidad (por ejemplo astucia con un mínimo); no se usa acá porque las habilidades de Dédalo no están definidas.
- Una opción que sale de una rama "distinta" vuelve al nodo bueno con `va`: no hay campo de castigo ni de fracaso.

## Preguntas abiertas

1. **Dónde está Dédalo.** El taller de Dédalo está "sin fecha" en el roadmap. Alguna zona del mapa tiene que alojarlo. No lo resuelvo acá.
2. **Habilidades de Dédalo.** Las fichas no las traen acá y no las invento.
3. **Cotejo con la ficha** de `JuegoMitosFeli` y con la edición de Ovidio (ver "A verificar").
4. **¿Querés que Pegaso o Fénix reaccionen** a las plumas de N2? Es un guiño con lo que ya hay en el ambiente; lo dejo como idea, no lo construyo.
