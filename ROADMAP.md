# Roadmap: Mitos, mundo abierto

Estado de las sesiones. El contenido de cada una (fichas, catálogo, desafíos) está en `plan-etapa-1.md` y las decisiones en `DECISIONS.md`: acá no se repiten.

Estados: **pendiente**, **construida** (`probar.js` pasa) y **validada** (la jugadora lo usó en el celular). Solo Willy marca "validada".

Última verificación: 2026-11-08, `probar.js` completo con 413 chequeos OK y ninguna falla (desbloqueo, sesión 2).

## Etapa 1: primer mapa completo (puerto, plaza, palacio)

Se cierra con el criterio de terminado de `CLAUDE.md`. **Validada por Willy el 2026-11-02.**

- [x] **S0 Prueba con la jugadora**: validada.
- [x] **S1 El mundo se guarda**: construida. Falta probarla en el celular.
- [x] **S2 Poder de Fénix**: construida. Decisión: D2.
- [x] **S3 Poder de Eco**: construida. Decisión: D3.
- [x] **S4 Poder de Ariadna**: construida. Decisión: D4.
- [x] **S5 Fichas y catálogo**: construida. Decisiones: D5, D6.
- [x] **S6 Puerto y plaza**: construida. Decisión: D7.
- [x] **S7 Palacio en terrazas**: construida. Sin decisión nueva. Falta probarla en el celular.
- [x] **S7b Un solo mundo**: construida. Decisión: D23. Falta probarla en el celular, en especial un perfil con progreso de antes.
- [x] **S8 Cierre de etapa**: construida la parte de código. Decisiones: D8, D24 (campo de pruebas solo con `?pruebas`). Falta la prueba integral con la jugadora y los arreglos menores que salgan de ella; la etapa se cierra cuando Willy la marque validada.

Siguiente: prueba integral en el celular (S1 a S8, A0, A3 a A5). Para abrir el campo de pruebas, agregar `?pruebas` a la dirección.

## Arte: sprites embebidos

Plan en `plan-arte.md`. Decisiones: D16 a D22. Orden de inicio a definir por Willy.

- [x] **A0 Prueba de tubería**: construida. Decisiones: D18, D19. Cinco personajes quietos en SVG. Falta que Willy lo vea en el celular, a tamaño real y sin conexión.
- [x] **A1 Dirección de arte**: construida y aprobada por Willy. Decisión: D17. Resultado en `plan-arte.md`.
- [ ] **A2 Personajes quietos y caminando**: pendiente. Poses quietas de los cinco hechas en A0; faltan caminar y direcciones. Cuatro direcciones (D22); los diseños salen del chat de diseño de Willy.
- [x] **A3 Movimiento y poderes**: construida. Decisiones: D20, D25. Aleteo de Pegaso y Fénix, más señales de los cinco poderes y de despegue y aterrizaje. Falta que la jugadora use los cinco en el celular y ninguno se vea como otro.
- [x] **A4 Interfaz**: construida. Maqueta aprobada en el lienzo de Design "Mitos: interfaz" (privado de Willy). Íconos en tres tonos, tira con insignia de rasgo, aviso con medallón, pista con velo y ficha nueva. Falta que la jugadora lo pruebe en el celular.
- [x] **A5 Escenario y mecanismos**: construida (`probar.js`: 193 OK tras unir con el aleteo). Decisión: D17. Falta la animación de la reja al abrirse y ver techo, reja y puerta de sonido en el celular.
- [ ] **A6 Coleccionables y ambiente**: en curso. Decisión: D27. Tanda 1 (los 7 coleccionables con sprite propio, verificados contra fuentes) construida y en el juego. Faltan las tandas 2 a 4 (ambiente de puerto, plaza y palacio) y sus reacciones. Diseños en el lienzo de Design "Mitos: coleccionables y ambiente" (privado de Willy).

## Abierto

- Validar S1 a S6 en el celular con la jugadora, siguiendo la lista de observación del final de `plan-etapa-1.md`.

## Etapa 2: personajes nuevos, laberinto y cueva del monte

Contenido en `plan-etapa-2.md`.

Continuación: orden, dependencias de arte y contrato de migración en `plan-continuacion-etapa-2.md`.

- [x] **Aviso de ficha de Ulises en perfiles anteriores:** construido para revisión. Aviso una sola vez si hay progreso, sin interrumpir ni cambiar personaje; marca aditiva sin mover coordenadas. Suite rápida: 50 OK, 0 fallas (15 chequeos nuevos). Captura revisada; validación física pendiente. No incluye U2.

- [x] **U1 Poder de Ulises**: construida (`probar.js --rapido` con los chequeos de U1). Decisiones: D29, D31. Corrió con marcadores, sin esperar los sprites. **Validada por Willy en el celular el 2026-11-07.**
- [x] **U2 El canal**: construido para revisión. Decisiones: D30, D33 y D34. Arte local autorizado (14 SVG), canal, dos barcas, objetos y migración implementados. Suite completa final: 293 OK, 0 fallas, incluye arranque offline; además 76 chequeos de canal/migración, 478 gráficos y 22 de exploración aprobados. Capturas revisadas. **Validado en el celular el 2026-11-07.** Pendiente cotejo visual externo del frasco y sello por HTTP 403 de fuentes citadas. No publicado ni mergeado.
- [x] **Ambiente interactivo**: construido. Decisión: D35. El botón de poder, sin palabras, también llama al animal cercano (sonido sintetizado y gesto). `probar.js --rapido` pasa con 29 chequeos nuevos. Falta probarlo en el celular.
- [x] **Desbloqueo con charlas, sesión 1**: construida para revisión. Decisión: D36. Elección del personaje inicial, tira con solo los desbloqueados, motor de charlas, Teseo (dorado) que desbloquea al Minotauro, habilidades en la ficha. Falta probarla en el celular. Plan en `plan-desbloqueo.md`. Siguientes: charla de Dédalo (PR #27), cadenas de Pegaso, Fénix, Eco y Ulises, habilidades con efecto.
- [x] **Desbloqueo con charlas, sesión 2**: construida para revisión. Decisión: D37. Los seis se desbloquean (Teseo, Dédalo con taller, Narciso, Nausícaa, fuente de las Musas, cenizas), todo en el puerto y a pie. Falta probarla en el celular. Siguientes: familias de poder, habilidades con efecto, "Mis cartas".
- [ ] **Laberinto**: pendiente de diseño.
- [ ] **Cueva del monte**: pendiente de diseño.

Sin fecha: taller de Dédalo y Talos.

- [ ] **Idea: personas con las que conversar y oráculos** (2026-11-07): sin sesión asignada ni diseño. Aprobada por la jugadora como idea. Personas en el mapa con las que se puede interactuar: charlas, cuentos ligados a los mitos y personajes del juego, y oráculos que hacen preguntas y ayudan a descubrir algo. Mecánica de referencia: elegir entre dos respuestas y que cambie lo que sigue (diálogo con opciones, sin copiar ningún juego). Abierto: qué mitos y personajes hablan, cómo se muestran los textos en el celular (el juego tiene cero texto en inglés y lectora fuerte), si el oráculo se apoya en Delfos (canon a confirmar antes de escribir nada) y cómo se relaciona con la interacción con animales. Al diseñarla, anotar la decisión en `DECISIONS.md`.

## Mejora gráfica de ChatGPT / Codex (2026-11-02)

Construida: 240 chequeos integrales, 17 rápidos y 366 invariantes gráficas aprobados. Implementados A2 (vistas y pasos), ambiente y reacciones de A6, apertura visual de A5 y ajustes de profundidad, pisos, cámara y controles (D28). Verificación y límites en `plan-mejora-grafica-codex.md`. Validación en celular real pendiente; no se marca validada ninguna sesión.


## Jugabilidad y plaza adaptable (D32)

**Construida para revisión:** controles de PC y táctiles, superficie visible, orientación hacia actividades y primera revisión de espacios de la plaza. Pruebas y límites en `jugabilidad-adaptable-codex.md`. Pendiente: prueba de uso en dispositivo, especialmente encontrar actividades sin ayuda externa. Puerto y palacio conservan su distribución.

## Guía de estilo visual (D38)

- [x] **Pase de estilo en el puerto**: construido para revisión. Reglas en `guia-estilo.md`. Seis personajes en todas sus poses, cuatro interlocutores, escenario, mecanismos, objetos y ambiente con un mismo contorno, escala, luz y nivel de detalle. Paredes como fondo calmo con altura legible. `probar.js --rapido` y `probar-graficos.mjs` (492) pasan. Puerto visto por Guille en el celular (2026-11-08): más foco y menos cansancio visual. Segunda tanda: plaza y palacio con la guía (caminos de bajo contraste, terrazas y techos con volumen) y mejoras en Pegaso y Fénix de espaldas y en los perfiles humanos. Falta ver la segunda tanda en el celular.
- Tercera tanda: gato, gaviota, golondrina, cabra, delfín y pulpo rediseñados con las formas de los personajes y contorno de los coleccionables normalizado (sin tocar formas, verificadas en D27). Falta verlo en el celular.
