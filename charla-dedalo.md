# Charla con Dédalo

Primera charla del juego, escrita como ejemplo completo para el motor de charlas del plan de desbloqueo (`plan-desbloqueo.md`, PR #26). Sirve de plantilla y ya está en el formato del motor construido en el PR #28.

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

Fuerza 3, astucia 10, valentía 6, magia 4, liderazgo 4, bondad 6. Velocidad 4, de la escala de `plan-desbloqueo.md` (las fichas no la traen). Astucia en el máximo de la escala y fuerza baja. Todavía no condicionan nada en esta charla; cuando se diseñe qué habilita cada habilidad, la astucia de Dédalo es la candidata natural para una opción que solo él ofrece.

## Cómo se juega

- Se llega a Dédalo por recomendación de otro personaje (cadena del plan de desbloqueo). Dónde está en el mapa queda abierto (ver preguntas).
- La charla se puede repetir siempre.
- Elegir mal nunca castiga: la rama distinta explica otra vez y vuelve.
- Hay una parte que solo se abre si se aprendió algo antes dentro de la misma charla (el saber `alas`). Es el ejemplo de "un saber abre una charla".

## Recorrido

Cuatro caminos, todos vuelven a N1 con "Seguir" salvo el final:

- **Alas:** N1 → N2 (pregunta sobre las plumas; la respuesta equivocada pasa por N2b y vuelve) → N3, que da el saber `alas`. Desde N3, N4 y N4b cuentan la historia de Ícaro (solo se ve con `alas`); N4c y N4d son las dos formas de cerrarla.
- **Laberinto:** N1 → N5 → N6 (el Minotauro, con Teseo que lo venció) o N7 (el hilo), que da `secreto-del-hilo`.
- **Final:** con `alas` y `secreto-del-hilo`, N1 ofrece "Ya entendí" → N8, que entrega la carta de Dédalo.
- "¿Qué estás armando?" desaparece de N1 una vez que se aprendió `alas`, igual que las opciones ya resueltas de Teseo.

## Saberes

| Saber | Se obtiene en | Para qué sirve |
|---|---|---|
| `alas` | N3 | Abre N4 y, junto con el otro, el final N8. Propuesta: que Pegaso o Fénix lo reconozcan como guiño (las plumas sueltas del almacén están en `diseno-ambiente.md`). |
| `secreto-del-hilo` | N7 | Abre el final N8. Propuesta: abre también la charla de Ariadna o de Teseo según el plan de la cadena. |

## Datos

Está en el formato del motor de charlas de PR #28 (`charlas.js`, `datos/charlas/teseo.json`), con `interlocutor` con el nombre, `nivel`, `habilidades` de la ficha y `estado: "borrador"`. La velocidad (4) viene de la escala de `plan-desbloqueo.md` (PR #26), no de la ficha; es un criterio de juego, no canon. Quedaría como `datos/charlas/dedalo.json`, más su entrada en `datos/charlas/indice.json`. Pasa `validarCharla` del motor sin problemas y se recorrió completa con `crearSesion` (alas, rama equivocada, laberinto, hilo y final).

```json
{
  "id": "dedalo",
  "interlocutor": "Dédalo",
  "color": "#B0803A",
  "nivel": "plateado",
  "habilidades": {"fuerza": 3, "astucia": 10, "valentia": 6, "magia": 4, "liderazgo": 4, "bondad": 6, "velocidad": 4},
  "estado": "borrador",
  "inicio": "n1",
  "nodos": {
    "n1": {
      "texto": "Soy Dédalo, artesano. Mirá vos, alguien que mira antes de tocar. ¿Qué querés saber?",
      "opciones": [
        {"texto": "¿Qué estás armando?", "va": "n2", "sinSaber": {"saber": "alas"}},
        {"texto": "Dicen que hiciste el laberinto.", "va": "n5"},
        {"texto": "Ya entendí", "va": "n8", "requiere": {"saberes": ["alas", "secreto-del-hilo"]}}
      ]
    },
    "n2": {
      "texto": "Alas. Se arman de a una pluma, de la más corta a la más larga, como una escalera. ¿Por qué creés que van así?",
      "opciones": [
        {"texto": "Para que la ala se curve como la de un pájaro.", "va": "n3"},
        {"texto": "Para que quede prolija.", "va": "n2b"}
      ]
    },
    "n2b": {
      "texto": "Prolija queda, sí. Pero una ala no vuela por prolija. Fijate cómo se curva cuando la ordeno así. Probá de nuevo.",
      "opciones": [{"texto": "Ah, para que se curve.", "va": "n3"}]
    },
    "n3": {
      "texto": "Eso. La curva agarra el aire. Las plumas se cosen con hilo en el medio y se fijan con cera en la base.",
      "da": ["alas"],
      "opciones": [
        {"texto": "¿Y para qué las hacés?", "va": "n4"},
        {"texto": "Seguir", "va": "n1"}
      ]
    },
    "n4": {
      "texto": "Minos no nos dejaba salir de Creta, ni por tierra ni por mar. Quedaba el cielo. Eran dos pares: uno para mí y otro para mi hijo, Ícaro.",
      "requiere": {"saber": "alas"},
      "opciones": [
        {"texto": "¿Y salió bien?", "va": "n4b"},
        {"texto": "Seguir", "va": "n1"}
      ]
    },
    "n4b": {
      "texto": "Le dije que volara a media altura: arriba el sol ablanda la cera, abajo la espuma moja las plumas. Voló tan contento que subió de más. La cera cedió y cayó al mar.",
      "opciones": [
        {"texto": "Lo siento.", "va": "n4c"},
        {"texto": "¿Y vos?", "va": "n4d"}
      ]
    },
    "n4c": {
      "texto": "Gracias. Lo busqué hasta encontrarlo. Ese mar hoy lleva su nombre. Un buen invento no alcanza si se olvida la advertencia.",
      "opciones": [{"texto": "Seguir", "va": "n1"}]
    },
    "n4d": {
      "texto": "Seguí volando, con las alas puestas y el corazón en otra parte. Llegué a Sicilia. Desde ahí se ve lejos todo lo que perdí.",
      "opciones": [{"texto": "Seguir", "va": "n1"}]
    },
    "n5": {
      "texto": "Minos quería un lugar del que nadie saliera. Lo hice tan enredado que casi no encuentro yo mismo la salida.",
      "opciones": [
        {"texto": "¿Y quién vivía adentro?", "va": "n6"},
        {"texto": "¿Cómo se sale de ahí?", "va": "n7"}
      ]
    },
    "n6": {
      "texto": "Asterión, hijo de la reina Pasífae, mitad hombre y mitad toro. Minos lo guardaba ahí. Teseo entró y lo venció.",
      "opciones": [
        {"texto": "¿Y cómo salió Teseo?", "va": "n7"},
        {"texto": "Seguir", "va": "n1"}
      ]
    },
    "n7": {
      "texto": "Con un hilo. Yo le conté el secreto a Ariadna, la hija de Minos, y ella le dio a Teseo un ovillo para marcar el camino de vuelta.",
      "da": ["secreto-del-hilo"],
      "opciones": [{"texto": "Seguir", "va": "n1"}]
    },
    "n8": {
      "texto": "Ya conocés mis dos mitades: lo que inventé y lo que perdí. Con eso podés llevarte mi carta.",
      "requiere": {"saberes": ["alas", "secreto-del-hilo"]},
      "efecto": {"carta": "dedalo"},
      "opciones": [{"texto": "Gracias"}]
    }
  }
}
```

El efecto `{"carta": "dedalo"}` de N8 sigue el de Teseo (`"carta": "teseo"`). Si la carta de Dédalo se llama distinto en el catálogo, solo cambia ese valor.

## Preguntas abiertas

1. **El taller.** Hay que armar un taller para Dédalo, en una habitación o al aire libre (decisión de Guille, 2026-11-07). Falta elegir en qué zona va y construirlo: es un cambio de mapa y de código, no de este documento. Lo que necesita el taller: un banco con plumas y cera visibles y un lugar donde se pueda parar a hablar con él. La regla de la zona elegida (alturas, paredes) se resuelve al diseñarlo.
2. **Guiño de Pegaso o Fénix** a las plumas de N2: aprobado como idea (2026-11-07), sin construir.
3. **Fuera de esta charla, pero en la ficha:** el capítulo "El Hilo y la Caracola" (Dédalo pasa un hilo por una caracola con una hormiga y una gota de miel) sirve para una segunda charla de acertijo si se quiere. No lo agregué.
4. **El otro juego tiene un oráculo** (`oraculo.html`, `oraculo.js`). Conviene mirarlo cuando se diseñe el oráculo de este juego, antes de inventar uno desde cero.
