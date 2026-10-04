# Decisiones: Mitos, mundo abierto

Una entrada por decisión, con el porqué. Solo se agregan entradas: si una decisión cambia, se escribe una nueva que reemplaza a la anterior (con el porqué del cambio) y la vieja queda marcada como reemplazada, sin borrarla ni reescribirla.

Estados: **tomada** (Willy la resolvió), **vigente sin confirmar** (está así en el código o en el plan pero no hay confirmación de Willy registrada) y **reemplazada**.

Formato: título, estado, decisión, por qué, qué se descartó. Donde el porqué no quedó registrado, lo dice.

## Etapa 1

### D1. Alcance de la etapa 1
- **Estado:** tomada
- **Decisión:** un primer mapa jugable (puerto, plaza, palacio) con los cinco personajes y sus cinco poderes. Laberinto, cueva del monte y personajes nuevos pasan a la etapa 2.
- **Por qué:** primero tiene que ser divertido un mapa con cinco personajes; después se agranda.
- **Descartado:** sumar más contenido en esta etapa.

### D2. Fénix vuela igual que Pegaso
- **Estado:** tomada
- **Decisión:** mantener el botón vuela, tocar brilla y enciende braseros.
- **Por qué:** no quedó registrado. Antes de resolverla, la recomendación era que Fénix no volara, para que subir siguiera siendo solo de Pegaso.
- **Descartado:** que planee o no vuele.

### D3. Eco con audio sintetizado y señal visual siempre
- **Estado:** tomada
- **Decisión:** el audio existe, sintetizado en el navegador sin archivos. Todo lo que suena también se ve.
- **Por qué:** con el volumen en cero, que en el celular es lo más común, el poder tiene que entenderse igual (plan, premisa 4). Por qué se agregó el audio: no quedó registrado.
- **Descartado:** Eco solo visual.

### D4. Soga de Ariadna: hasta 5 casillas, en línea recta, entre argollas
- **Estado:** vigente sin confirmar (así está en `CLAUDE.md` y en el código)
- **Decisión:** la soga solo se tiende entre argollas puestas en el mapa, en línea recta y hasta 5 casillas.
- **Por qué:** era la opción recomendada en el plan; la restricción a argollas evita que la soga se tienda en cualquier lugar.
- **Descartado:** soga libre en cualquier punto.

### D5. Cómo termina la ficha del Minotauro
- **Estado:** vigente sin confirmar (la ficha del juego termina en "Teseo lo venció")
- **Decisión:** la ficha cuenta el mito en tercera persona y termina con que Teseo lo venció.
- **Por qué:** era la opción recomendada: la esencia está y no hay detalle crudo.
- **Descartado:** "Asterión no volvió a salir" (más velado) y cortar en el encierro.

### D6. No explicar por qué el Minotauro anda libre
- **Estado:** tomada
- **Decisión:** no se agrega ninguna explicación.
- **Por qué:** en la prueba con la jugadora no preguntó.
- **Descartado:** una explicación dentro del juego.

### D7. Zonas separadas con paso entre ellas
- **Estado:** vigente sin confirmar (cada mapa trae `salidas` y `entradas`)
- **Decisión:** puerto, plaza y palacio son mapas separados con un paso entre ellos.
- **Por qué:** era la opción recomendada: más simple de construir y de probar.
- **Descartado:** un solo mapa continuo.

### D8. Campo de pruebas
- **Estado:** vigente sin confirmar (hoy se abre desde el menú)
- **Decisión:** accesible desde el menú durante la etapa 1 y retirado o escondido al cerrarla (S8).
- **Por qué:** sirve para validar poderes en un solo lugar mientras se construye el mapa real.
- **Descartado:** retirarlo antes de cerrar la etapa.

## Arranque del proyecto (2026-10)

### D9. Repo propio, separado de Mundo de Mitos
- **Estado:** tomada
- **Decisión:** repo aparte, sin relación técnica con el otro juego.
- **Por qué:** para no heredar sus reglas (hub, estados de publicación, versión del service worker).

### D10. Todo dibujado por código
- **Estado:** tomada
- **Decisión:** personajes y mapa sin imágenes; el arte definitivo se resuelve después.
- **Por qué:** cambiarlo a spritesheet más adelante es barato.

### D11. Varios perfiles locales
- **Estado:** tomada
- **Decisión:** hasta 5 perfiles, cada uno con su guardado.

### D12. Título provisorio
- **Estado:** tomada
- **Decisión:** "Mitos: mundo abierto". Vive en `index.html`, `manifest.webmanifest`, `interfaz.js` (pantalla de perfiles) y `README.md`.

### D13. Campo de pruebas antes del puerto, la plaza y el palacio
- **Estado:** tomada
- **Decisión:** la primera sesión construyó un campo de pruebas.
- **Por qué:** validar movimiento, salto, vuelo, empujar, embestir, coleccionables y guardado en un solo lugar.

## Proceso (2026-10-03)

### D14. Opus decide y Sonnet programa (5.5 o superior)
- **Estado:** tomada
- **Decisión:** el hilo principal (Opus 5.5 o superior) decide, escribe el encargo, verifica y actualiza los `.md`. Todo cambio de código o de mapas lo hace el subagente `programador` (Sonnet 5.5 o superior, fijado como `claude-sonnet-5-5`), definido en `.claude/agents/programador.md`.
- **Por qué:** no ensuciar el contexto. Lo que el subagente lee y prueba queda en su propia conversación y al hilo principal solo vuelve su reporte final.
- **Descartado:** subagentes para verificar o revisar. Opus corre `probar.js` él mismo una vez al recibir el reporte.

### D15. Una sola confirmación por sesión
- **Estado:** tomada
- **Decisión:** Opus confirma con Willy el alcance y el criterio al empezar la sesión y después trabaja hasta terminar. Frena solo por una decisión de Willy o antes de un paso riesgoso.
- **Por qué:** el plan ya trae alcance y criterio por sesión, y confirmar paso por paso corta el trabajo a la mitad.
- **Descartado:** confirmar y esperar en cada paso.
