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
- **Estado:** reemplazada por D23
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

### D21. Fénix vuela hasta terrazas, Pegaso hasta techos
- **Estado:** tomada
- **Decisión:** el vuelo de Fénix llega a la altura de una terraza (nivel 1) y no a un techo (nivel 2). Pegaso sigue llegando a techos.
- **Por qué:** Willy pidió que Pegaso tenga cosas para hacer que Fénix no. Con tres niveles, la única división que separa a los dos es terraza contra techo.
- **Descartado:** el mismo vuelo para los dos.

### D22. Cuatro direcciones por personaje
- **Estado:** tomada (Willy, 2026-10-04)
- **Decisión:** cada personaje tiene cuatro direcciones: frente (abajo), espalda (arriba) y costado. El costado mira a la derecha y se espeja para la izquierda, así que son tres dibujos por pose (quieto y caminar).
- **Por qué:** caminando hacia arriba se tiene que ver la espalda, no la cara. Ocho direcciones duplican el trabajo de diseño y en el celular casi no se notan.
- **Descartado:** dos direcciones espejadas y ocho direcciones.

## Mundo (2026-10-04)

### D23. Un solo mundo continuo
- **Estado:** tomada
- **Decisión:** puerto, plaza y palacio pasan a ser zonas de un mismo mapa continuo, sin pasos ni cambios de pantalla entre ellas, de sur a norte como se conectan hoy. El progreso ya guardado de cada mapa (muros, rejas, empujables, braseros, sogas, sonidos) se traslada al mapa unido: nada de lo abierto vuelve a cerrarse. Reemplaza a D7.
- **Por qué:** la idea del juego es un mundo abierto; los mapas separados lo cortaban.
- **Descartado:** mapas separados con paso entre ellos (D7); reiniciar los mecanismos al unir, porque choca con "nada se cierra".

## Cierre de etapa y arte (2026-10-04)

### D24. Campo de pruebas detrás de `?pruebas`
- **Estado:** tomada (Willy, 2026-10-04)
- **Decisión:** el botón del campo de pruebas sale del menú y solo aparece si la dirección lleva `?pruebas`. Adentro del campo, la salida se ve siempre. El mapa y su lógica quedan intactos. Completa D8.
- **Por qué:** la jugadora no lo ve, pero Willy lo conserva para probar poderes sueltos en el celular durante la prueba integral.
- **Descartado:** retirarlo del juego; esconderlo con un gesto secreto, porque sería difícil de recordar y de probar.

### D25. Señales de poder dibujadas por código
- **Estado:** tomada (Willy, 2026-10-04)
- **Decisión:** las señales de poder de A3 (ondas y símbolo de Eco, halo y brasas de Fénix, polvo y esfuerzo del Minotauro, soga que se desenrolla de Ariadna, ráfaga al despegar, polvo al aterrizar) se dibujan por código con la paleta de D17, en color plano y sin oro pálido. No son sprites.
- **Por qué:** son efectos que se mueven y no tienen forma fija, y los sprites de personajes se diseñan fuera de Code.
- **Descartado:** el brillo de Fénix con degradé (D17 los descarta).

### D26. Verificación en dos velocidades y cambios mínimos sin subagente
- **Estado:** tomada (Willy, 2026-10-04)
- **Decisión:** por cambio se corre `probar.js --rapido` (menos de un minuto). La corrida completa (unos 10 minutos) queda para el cierre de una etapa grande o antes de un paso riesgoso, y la corre una sola vez quien cierra. Opus no repite la corrida del subagente. Subir `VERSION` de `sw.js` y resolver conflictos de un merge los hace Opus directo, sin subagente. En cambios visuales el `programador` deja capturas y Opus las mira. Opus avisa a Willy cuando una sesión pasa los 250 mil tokens de contexto o repite trabajo sin aportar.
- **Por qué:** una revisión de las sesiones del 2026-10-04 mostró que cada delegación costaba dos corridas completas seguidas (subagente y Opus) sobre el mismo código, y que subir una versión de una línea tomó unos 19 minutos. El contexto de Opus no se ensucia con una línea; sí con esperas repetidas.
- **Descartado:** quitar la prueba por completo en el día a día, porque un chequeo de sintaxis no cuenta; saltear secciones de la suite a mano, porque dependen del estado que dejan las anteriores.

### D27. Un sprite por coleccionable, verificado contra el objeto real
- **Estado:** tomada (Willy, 2026-10-04)
- **Decisión:** cada objeto del catálogo se dibuja con su propio sprite (`sprites/coleccionables/<id>.svg`), en el mundo, en el medallón del aviso y en "Mis objetos". Atrás va un brillo plano de oro pálido (`brillo.svg`), sin degradé, que sigue siendo la señal de "esto se junta". Los detalles se verificaron contra fuentes de museo (Museo de Heraclión y otras). Hay tres apartamientos deliberados: la figura con serpientes lleva el corpiño cerrado (regla de suavizar), las serpientes van en bronce porque la paleta cerrada no tiene verde, y los signos de la tablilla imitan formas del lineal B sin formar un texto legible.
- **Por qué:** un ícono genérico no enseñaba nada del objeto, y los objetos son reales: el dibujo no puede contradecir al original.
- **Descartado:** dibujar de memoria sin verificar; sumar un verde a la paleta solo para las serpientes.

### D28. El ambiente es un sistema aparte, dirigido por datos y sin guardado
- **Estado:** tomada (Willy, 2026-10-05: "sigamos con las otras tandas")
- **Decisión:** el ambiente (`diseno-ambiente.md`) vive en `ambiente.js` (lógica, sin dibujar), se declara en la lista `ambiente` de `datos/mapa-mundo.json` y se dibuja en `dibujo.js` entre los objetos y el personaje. Sus sprites están en `sprites/ambiente/`. No suma claves al perfil, no bloquea y no usa el código visual de los mecanismos. Cada tipo nuevo (plaza, palacio) suma su `case` en `ambiente.js` y en `dibujarAmbiente`. El campo de pruebas no lleva ambiente.
- **Por qué:** una sola forma de agregar elementos vivos evita que cada tanda invente la suya, y no guardar nada respeta "nada se cierra ni se pierde" sin tocar el formato del guardado.
- **Descartado:** ambiente dentro de `mundo.js` mezclado con la física; guardar el estado de las reacciones.
