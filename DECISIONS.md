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
- **Estado:** tomada (confirmada por Willy el 2026-10-04)
- **Decisión:** la soga solo se tiende entre argollas puestas en el mapa, en línea recta y hasta 5 casillas.
- **Por qué:** era la opción recomendada en el plan; la restricción a argollas evita que la soga se tienda en cualquier lugar.
- **Descartado:** soga libre en cualquier punto.

### D5. Cómo termina la ficha del Minotauro
- **Estado:** tomada (confirmada por Willy el 2026-10-04)
- **Decisión:** la ficha cuenta el mito en tercera persona y termina con que Teseo lo venció.
- **Por qué:** era la opción recomendada: la esencia está y no hay detalle crudo.
- **Descartado:** "Asterión no volvió a salir" (más velado) y cortar en el encierro.

### D6. No explicar por qué el Minotauro anda libre
- **Estado:** tomada
- **Decisión:** no se agrega ninguna explicación.
- **Por qué:** en la prueba con la jugadora no preguntó.
- **Descartado:** una explicación dentro del juego.

### D7. Zonas separadas con paso entre ellas
- **Estado:** reemplazada por D21
- **Decisión:** puerto, plaza y palacio son mapas separados con un paso entre ellos.
- **Por qué:** era la opción recomendada: más simple de construir y de probar.
- **Descartado:** un solo mapa continuo.

### D8. Campo de pruebas
- **Estado:** tomada (2026-10-04): al cerrar la etapa se esconde, no se retira
- **Decisión:** accesible desde el menú durante la etapa 1 y retirado o escondido al cerrarla (S8).
- **Por qué:** sirve para validar poderes en un solo lugar mientras se construye el mapa real.
- **Descartado:** retirarlo antes de cerrar la etapa.

## Arranque del proyecto (2026-10)

### D9. Repo propio, separado de Mundo de Mitos
- **Estado:** tomada
- **Decisión:** repo aparte, sin relación técnica con el otro juego.
- **Por qué:** para no heredar sus reglas (hub, estados de publicación, versión del service worker).

### D10. Todo dibujado por código
- **Estado:** reemplazada por D16
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

## Arte (2026-10-03)

### D16. Sprites embebidos en el repo
- **Estado:** tomada
- **Decisión:** personajes, escenario e interfaz pasan de dibujo por código a sprites guardados en el repo y cacheados por el service worker. Plan en `plan-arte.md`. Reemplaza a D10.
- **Por qué:** el dibujo por código limita el detalle del arte definitivo, y los sprites siguen funcionando sin conexión.
- **Descartado:** seguir dibujando por código; imágenes remotas.

### D17. Fresco con volumen como dirección de arte
- **Estado:** tomada
- **Decisión:** el arte es fresco minoico de color plano por zonas, con tres tonos por material, bisel, textura y desgaste, sobre la paleta cerrada de `plan-arte.md` (A1). El oro pálido queda reservado a los mecanismos.
- **Por qué:** Willy pidió una propuesta más realista y trabajada que el fresco plano de partida, y la aprobó así.
- **Descartado:** fresco plano sin volumen (primera versión de la hoja); degradés.

### D18. Sprites en SVG
- **Estado:** tomada
- **Decisión:** los sprites son SVG vectoriales en `sprites/`, con los pies en (0,0) y 1 unidad = 1 px de juego. Se diseñan en el lienzo de diseño del chat del proyecto.
- **Por qué:** la prueba A0 mostró que el diseño sale como dibujo vectorial: pesa poco, funciona sin red y se ve nítido en cualquier densidad.
- **Descartado:** PNG rasterizados como fuente.

### D19. Pegaso y Fénix son animales
- **Estado:** tomada
- **Decisión:** Pegaso se dibuja como caballo alado y Fénix como ave. Minotauro, Ariadna y Eco conservan cuerpo humano. Cada uno se reconoce por su silueta, no por una base compartida.
- **Por qué:** sus fichas dicen "Caballo con alas" y "Ave de plumas rojas y doradas"; la figura humana contradecía el texto del juego.
- **Descartado:** base humana compartida para los cinco.

### D20. Alas separadas y Fénix de perfil
- **Estado:** tomada
- **Decisión:** las alas de Pegaso y Fénix son piezas SVG aparte (cercana y lejana), con el origen en el hombro, y el aleteo se hace por código. Fénix pasa a ave de perfil con cola larga y cresta que cae hacia atrás, sin las tres puntas. Las alas son una sola forma por pieza, sin plumas dibujadas. Las alas de fuego de Fénix al volar usan estas mismas piezas. Completa D19.
- **Por qué:** el aleteo necesita el ala separada del cuerpo, y el diseño anterior de Fénix no era el que se buscaba.
- **Descartado:** versión de fuego aparte para el vuelo; alas con filas de plumas (se veían recargadas).

## Mundo y arte (2026-10-04)

### D21. Un solo mundo continuo
- **Estado:** tomada
- **Decisión:** puerto, plaza y palacio pasan a ser zonas de un mismo mapa continuo, sin pasos ni cambios de pantalla entre ellas, de sur a norte como se conectan hoy. El progreso ya guardado de cada mapa (muros, rejas, empujables, braseros, sogas, sonidos) se traslada al mapa unido: nada de lo abierto vuelve a cerrarse. Reemplaza a D7.
- **Por qué:** la idea del juego es un mundo abierto; los mapas separados lo cortaban.
- **Descartado:** mapas separados con paso entre ellos (D7); reiniciar los mecanismos al unir, porque choca con "nada se cierra".

### D22. Cuatro direcciones por personaje
- **Estado:** tomada (resuelta por Willy en otro chat)
- **Decisión:** cada personaje se dibuja en cuatro direcciones. Resuelve la decisión pendiente de A2 en `plan-arte.md`.
- **Por qué:** no quedó registrado en este repo.
- **Descartado:** dos direcciones espejadas; ocho.
