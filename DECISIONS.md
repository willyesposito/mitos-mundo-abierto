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

### D28. Mejora gráfica integral de ChatGPT / Codex (2026-11-02)
- **Estado:** implementación autorizada; validación visual en dispositivo pendiente.
- **Decisión:** avanzar con vistas y pasos, ambiente agrupado, sombras y juntas afinadas, transiciones visuales, cámara vertical y controles. Recursos locales con movimiento reducido. Se conservan identidad minoica, reglas, física y guardado.
- **Por qué:** mejorar presencia del personaje, identidad de zonas y lectura de alturas. Detalle en `plan-mejora-grafica-codex.md`.

## Etapa 2 (2026-11)

### D29. Ulises, sexto personaje: navegar
- **Estado:** tomada (Willy, 2026-11-02)
- **Decisión:** Ulises entra al elenco como sexto personaje, con el poder Navegar: sube a una barca con remo, la mueve por el agua y baja en tierra firme. La barca queda donde la dejó, cualquiera puede pararse en ella y solo Ulises la mueve; quien cae al agua desde la barca reaparece en ella. Rasgo visual: el pilos. Se diseña ahora y se construye en la etapa 2. Ficha en `plan-etapa-2.md`. Completa D1.
- **Por qué:** navegar es lo más firme del personaje en la Odisea, no repite el verbo de ningún otro y le da uso al agua del puerto, que hoy es solo borde. Se construye en la etapa 2 porque D1 deja ahí los personajes nuevos.
- **Descartado:** el arco (la prueba de las hachas tiene un detalle de canon discutido y se cruza con las argollas de Ariadna y el alcance de Eco); el disfraz y la astucia, porque el juego no tiene guardias ni enemigos sobre los que usarlos.

### D30. El canal: zona nueva entre el puerto y la plaza
- **Estado:** tomada (Willy, 2026-11-02)
- **Decisión:** entre el puerto y la plaza va una zona nueva, el canal, que es la única unión entre las dos y se cruza solo en la barca de Ulises. Paredes de 3 alrededor y una boca baja en cada borde: una casilla nueva de agua con techo de roca, donde no se vuela ni se salta. Una barca con remo amarrada en cada orilla. Dos coleccionables a los que solo se llega navegando: el frasco del pulpo, a la vista, y el sello con barco, que se dibuja recién cuando la barca pasa a 2 casillas o menos. Para hacer lugar se corre el puerto hacia abajo y su guardado se migra una vez. Diseño en `plan-etapa-2.md`.
- **Por qué:** Willy quiso que Ulises sea necesario para avanzar, y Pegaso cruza cualquier agua abierta. La boca baja es la forma de cerrarle el canal al vuelo. Dos barcas evitan que un perfil quede del lado sin barca. Se corre el puerto porque casi no tiene estado guardado.
- **Descartado:** una gruta suelta en el puerto, sin ser paso obligado; una sola barca; correr la plaza y el palacio.

### D31. Cómo se construyó la barca (U1)
- **Estado:** tomada (Code, 2026-11-03), para revisar con Willy en el PR
- **Decisión:** la barca con remo va en la lista `barcasRemo` del JSON del mapa (no en una letra), y es una pieza libre: el joystick la mueve de a poco, no casilla por casilla, y con el botón Ulises sube o baja. La boca baja es la letra `r`: agua con techo de roca, que solo cruza la barca; bajo ella no se salta ni se vuela (techo a 0,45 niveles). El guardado suma la clave `barcas` en `estado()`, con la posición de cada barca movida por su casilla original. Al restaurar un perfil, si ninguna barca toca la tierra que alcanza quien aparece, la primera vuelve a su lugar de origen: así nadie queda varado, aunque la barca pueda no estar donde se la dejó si nadie podía llegar a ella.
- **Por qué:** el plan dejaba estos puntos a Code. Mover la barca libre se siente como navegar y no obliga a alinear el joystick; el techo de 0,45 cierra el vuelo y el salto sin tocar las paredes de 3. La regla del varado es la forma de cumplir "nadie queda sin barca" con una sola barca en el campo de pruebas.
- **Descartado:** mover la barca casilla por casilla; guardarla en letras del mapa; dejarla varada y confiar en que quien la necesita la encuentre.

### D32. Teclado en PC, orientación y plaza menos rígida
- **Estado:** implementación autorizada y construida para revisión; prueba en dispositivo pendiente.
- **Decisión:** adaptar HUD, cámara y controles a la superficie visible; ocultar joystick en PC con puntero fino y mantener interacción táctil en tablet y celular. Priorizar encontrar actividades con lugares elegibles y pistas que no revelan la solución. Primera revisión espacial: plaza, con senderos curvos y dos recovecos laterales.
- **Compatibilidad:** mecanismos y objetos conservan coordenadas; solo se abren 16 casillas de parapeto. La guía usa progreso existente, sin modificar guardados.
- **Detalle:** `jugabilidad-adaptable-codex.md`.

### D33. Arte de Ulises y del canal diseñado en Codex
- **Estado:** autorizado por el usuario en esta conversación; propuesta integrada para revisión, sin publicación.
- **Decisión:** diseñar aquí los SVG de Ulises, barca con remo, boca baja y dos coleccionables, en lugar de esperar al chat de diseño. Se conserva la paleta D17 y el sistema de poses D22. Ulises lleva pilos ocre con banda egeo, barba, túnica óxido y capa corta de lino; son decisiones visuales, no afirmaciones de canon. La barca navegable tiene casco abierto y remo diagonal, diferenciada de las decorativas. El techo de roca conserva la transparencia 0,55 de U1.
- **Objetos:** frasco y sello se proponen según las descripciones y referencias verificadas del plan de etapa 2. El acceso actual a Smarthistory y AncMed respondió HTTP 403; no se afirma una nueva comparación visual con las piezas originales. Antes de publicar estos objetos queda ese cotejo visual externo. No se agregan inscripciones.
- **Alcance:** 14 SVG locales, seis personajes con sprites y caché offline. La autorización no implica aprobación visual en dispositivo, merge ni publicación.

### D34. Encaje técnico del canal y compatibilidad del guardado
- **Estado:** implementación de D30 para revisión; sin merge ni publicación.
- **Decisión:** canal en filas 74–87 y puerto desplazado 14 filas; plaza y palacio conservan coordenadas. Bocas en columna 11 y amarres en columna 10 de bolsillos de agua de tres casillas para poder cruzar sin chocar con la barca de la otra orilla. Frasco en una roca cerca del muelle sur; sello al noroeste, revelado por una barca a dos casillas o menos y guardado separado de la recolección.
- **Compatibilidad:** la unión de mapas anteriores a D23 usa el desplazamiento original del puerto; después `migrarAlCanal` traslada una sola vez el estado y la llegada del puerto. Las llegadas antiguas sobre casillas convertidas en agua se llevan al muelle firme contiguo. No se alteran mapas antiguos de respaldo ni el campo de pruebas. Si una recarga en una roca deja todas las barcas inaccesibles, se acerca una a una orilla libre de esa roca; si ya hay una accesible se conserva su posición.
- **Por qué:** evita el desplazamiento doble, el bloqueo entre dos barcas y que un perfil quede varado en una roca. Todo ello mantiene las reglas de D29–D31.

### D35. Llamar a los animales con el botón de poder
- **Estado:** tomada (Willy, 2026-11-07), construida para revisión.
- **Decisión:** el botón de poder también llama al animal vivo más cercano (menos de 1,7 casillas), con sonido sintetizado y gesto. El botón queda sin palabras, solo ícono (la letra del atajo se ve en escritorio).
- **Por qué:** el juego ya tenía audio sintetizado y animales que reaccionaban por cercanía, pero no respondían a la jugadora. Reusar el botón evita sumar controles al celular.
- **Descartado:** toque directo sobre el mapa (detección nueva, compite con el joystick); sonidos grabados (rompen "sin archivos").
- **Abierto:** en el celular nada indica que el botón también llama; lo valida la jugadora.
- **Detalle:** `plan-ambiente-interactivo.md`.

### D36. Desbloquear personajes con charlas y habilidades
- **Estado:** tomada (Guille, 2026-11-07), sesión 1 construida para revisión.
- **Decisión:** la jugadora elige 1 de los 6 personajes al empezar y desbloquea al resto conversando con personas del mapa (árboles de diálogo con elecciones; lo aprendido, un "saber", abre opciones). Resolver la cadena de un personaje le da su poder. Los personajes tienen siete habilidades (fuerza, astucia, valentía, magia, liderazgo, bondad y velocidad, de 1 a 10), copiadas de las fichas de `JuegoMitosFeli` salvo velocidad, que es criterio propio. Nórdicos y romanos quedan afuera por ahora; no se comparte progreso con ese juego.
- **Por qué:** el desafío es descubrir y conversar, no la puntería, y las fichas del otro repo ya traen historia, "¿Por qué?" y pistas para escribir las charlas sin inventar mitos.
- **Alcance de la sesión 1:** solo el Minotauro queda bajo llave (campo `bajoLlave`); Pegaso, Fénix, Eco y Ulises siguen libres hasta tener su cadena. Cadena: Ariadna al inicio, Teseo (dorado) y Minotauro. Las habilidades solo se muestran en la ficha, todavía no condicionan nada. Perfiles anteriores: los 6 desbloqueados.
- **Formato de charla:** un archivo por charla en `datos/charlas/`, con índice. Nodos con `texto`, `opciones` (`va`, `requiere`, `sinSaber`), `da` y `efecto`. Elegir mal nunca castiga.
- **Tono:** sin suavizar de más, pero sin violencia explícita, apto para 10 años o más (Guille, 2026-11-07).
- **Abierto:** los textos de Teseo están en borrador; la charla de Dédalo (PR #27) entra con este formato; poderes nuevos solo para dorados; qué habilidad habilita qué; la escala de velocidad es mía, no canon.
- **Detalle:** `plan-desbloqueo.md`.

### D37. Cadena de desbloqueo de los seis personajes
- **Estado:** tomada (Guille, 2026-11-08), construida para revisión.
- **Decisión:** un perfil nuevo arranca solo con el personaje elegido. Los otros cinco se desbloquean por separado, sin orden: Minotauro con la charla de Teseo, Ariadna con la de Dédalo, Eco con la de Narciso, Ulises con la de Nausícaa, Pegaso con la fuente de las Musas (objeto interactivo) y Fénix con las cenizas (objeto interactivo). El botón de hablar (tecla T) sirve para el interlocutor u objeto más cercano. Perfiles anteriores: todo desbloqueado.
- **Por qué:** Guille pidió empezar con uno y desbloquear el resto conversando, con un objeto como recompensa más fácil; con dos objetos (Pegaso y Fénix) las cadenas que salen de las fichas de `JuegoMitosFeli` quedan completas sin inventar mitos.
- **Dónde:** todo lo desbloqueable está en el puerto, en suelo y alcanzable a pie sin poderes (hay prueba de alcance). El resto del mundo exige poderes o la barca, así que ponerlo más lejos habría trabado a algunos perfiles.
- **Abierto:** los textos de Narciso y Nausícaa y el taller de Dédalo son borrador; el botón dice "Hablar" también para objetos; falta "Mis cartas"; familias de poder y habilidades con efecto siguen pendientes.
- **Detalle:** `plan-desbloqueo.md`, `charla-dedalo.md`.

### D38. Guía de estilo visual y pase sobre todo el arte
- **Estado:** tomada (Guille, 2026-11-08), en construcción.
- **Decisión:** reglas comunes de escala, línea, detalle por plano, luz y punto de vista en `guia-estilo.md`, aplicadas a todo lo que se ve en el puerto, incluidos los seis personajes jugables y sus poses. Guille autorizó rediseñar aquí los personajes para unificarlos; se conservan su identidad, su rasgo y la paleta de D17.
- **Por qué:** en el celular el arte se veía "como un collage de recortes": cuatro manos sin reglas compartidas dejaron contornos de distinto grosor y color, paredes con textura casi realista al lado de personajes planos, y objetos a otra escala y desde otro ángulo.
- **Descartado:** pasar a 3D (la evaluación de octubre lo estimó en meses y la grilla seguiría viéndose cuadrada); generar imágenes con IA (cuesta mantener el mismo personaje en todas las poses).
- **Abierto:** plaza y palacio. Si tras el pase sigue pareciendo collage, el siguiente paso es otra fuente de arte (ilustrador o paquete con licencia).
