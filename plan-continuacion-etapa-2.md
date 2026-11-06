# Continuación de etapa 2

Pedido: armar el plan de pendientes y empezar. Autoría: Codex. No reemplaza D29–D32 ni marca validación en dispositivo.

Actualización: el usuario autorizó diseñar acá los sprites previos a U2. Se conserva la paleta y se documentan los apartamientos; esta autorización reemplaza para estos recursos la dependencia del chat de diseño externo. No autoriza publicación ni merge.

## Avance de implementación

- Aviso de ficha de Ulises construido: una vez para perfiles anteriores con progreso, sin modal ni cambio de personaje.
- Arte integrado: 14 SVG de Ulises, barca con remo, boca baja y objetos; lámina y capturas revisadas. D33 registra decisiones y límite del cotejo externo de piezas.
- U2 implementado según D34: canal, dos amarres, dos rocas, objetos, revelado persistente y migración idempotente. Pruebas dirigidas aprobadas: 76 motor/migración, 478 gráficas, 22 exploración y 9 de navegador U2. Suite completa final: **293 OK, 0 fallas, 0 pendientes del runner**, incluido arranque offline real. La primera corrida detectó una expectativa de esquema sin la clave nueva `revelados`; se corrigió manteniendo igualdad exacta y se repitió la completa. Comparación de píxeles trasladada al navegador, con fórmula y umbrales conservados.
- Laberinto y cueva: borradores en `propuestas-laberinto-cueva.md`; pendientes decisiones de jugabilidad antes de construir mapas.
- No se hizo publicación, merge ni validación física.

## Orden de trabajo

1. **Aviso de Ulises, independiente del canal.** Reproducir con perfil anterior, implementar aviso de ficha nueva sin interrumpir el juego y sin repetirlo al recargar. Mantener progreso y acceso a la ficha. Probar perfil anterior, nuevo y recarga con la suite rápida. No mover coordenadas.
2. **Arte previo a U2.** Diseñar aquí Ulises, barca con remo, boca baja y dos coleccionables, conforme a la autorización posterior del usuario. Integrar SVG locales, revisar tamaño real, cuatro direcciones y caché offline. No dar marcadores por sprites terminados.
3. **Canal U2.** Construir mapa, dos bocas y dos barcas; trasladar solo el puerto; sumar los dos objetos y contador de nueve. Implementar y probar migración idempotente después de la unión de mapas antiguos. Suite completa una vez sobre el árbol final. Preparar PR; merge con OK explícito.
4. **Validación física.** U1 puede probarse ya con `?pruebas`; U2 después de construirse. Revisar seis botones en vertical, embarque, desembarque, lectura de boca baja y descubrimiento del sello. Solo la prueba real permite marcar validado.
5. **Laberinto y cueva.** Diseñar por separado antes de programar: recorrido, personaje/poder que aporta, desafíos, salida, objetos reales con fuentes y efecto sobre progreso existente. No hay todavía un diseño aprobado para construirlos.

## Evidencia inicial

- Checkout revisado: U1 y plaza adaptable integrados; no están los sprites de Ulises, frasco ni sello. La barca navegable y la boca baja se dibujan con marcadores/código de U1; el SVG decorativo de barca no reemplaza el arte navegable.
- Entorno: pruebas rápidas aprobadas, 22 chequeos de exploración, 372 gráficos y controles en 11 pantallas. Arranque offline real probado. No equivalen a validación física.
- Perfil anterior sintético con un objeto: Ulises se selecciona, la ficha abre y el objeto permanece; no aparece aviso de ficha nueva. Este es el primer trabajo de implementación.

## Brief de arte pendiente

Conservar D17, D19, D22 y D27: SVG sin texto ni recursos remotos; paleta cerrada; pies en el origen; sombra por código; lectura a tamaño de casilla 44 × 36. Frente, espalda y costado derecho espejado cubren cuatro direcciones. Revisar quieto y pasos para Ulises conforme al sistema de animación existente.

- **Ulises:** hombre adulto con pilos reconocible. Ropa, barba, color y pose requieren referencia del diseño; no inferirlos como canon obligatorio.
- **Barca con remo:** distinguirla de las barcas decorativas desde el muelle. Remo legible y espacio para el personaje embarcado; revisar superposición y orientación al navegar.
- **Boca baja:** U1 ya dibuja un techo translúcido permanente con opacidad 0,55 en `dibujarTechoBoca`; el pendiente es validar y terminar el arte. Propuesta a revisar: roca opaca al estar vacía; atenuar solo el techo que tapa a la barca mientras cruza, conservando contorno y paredes para que se entienda el límite. Revisar contra la silueta existente. Este cambio condicional es propuesta, no decisión aprobada.
- **Frasco del pulpo:** modelar sobre la pieza de Palaikastro citada en `plan-etapa-2.md`, no sobre una vasija genérica. Verificar asas y decoración con la fuente antes del sprite.
- **Sello con barco:** referencia AN1938.958 del Ashmolean citada en el plan; conservar casco, remos y mástil legibles sin inventar inscripciones. Verificar la fuente antes del sprite.

## Contrato de migración U2

El mapa actual mide 98 filas: palacio 0–39, plaza 40–73, puerto 74–97. Elegir la altura del canal al dibujar su recorrido y usar un único desplazamiento compartido; no fijar uno arbitrario antes del mapa.

- Mantener palacio y plaza en sus coordenadas. Trasladar puerto, inicio, adornos, fuentes y todas sus referencias de mapa, no solo las filas.
- Migrar solo estado de `mundos.mundo` que corresponda al puerto antiguo: listas `muros`, `rejas`, `braseros`, `soles`, `fuentes`, `puertas`, `sogas`; claves y posiciones de `empujables` y `barcas`; `llegada` cuando esté en puerto. Conservar IDs de objetos y sonido de Eco.
- Para perfiles anteriores a D23, ejecutar primero la unión con los desplazamientos originales. Usar directamente el nuevo `dy` del puerto y después desplazarlo otra vez produciría un traslado doble: cubrir explícitamente este caso.
- No tocar estado de `pruebas` ni claves de mapas viejos conservadas como respaldo. No transformar claves desconocidas como si fueran coordenadas.
- Marca propia de migración tras completar el traslado; perfiles nuevos nacen en el mapa nuevo con esa marca. Recargar no vuelve a desplazar nada.
- Probar perfiles anteriores a D23, mundo unido antes de U2, recién creados y ya migrados; llegadas en las tres zonas; objetos y mecanismos persistidos; retorno desde plaza y palacio con barca accesible.

## Criterio de terminado de U2

Recorrido desde puerto a plaza usando Ulises, ambos objetos recogibles y sello revelado a distancia de dos casillas desde la barca y persistido. Sin paso a pie, volando, saltando ni con soga. Dos barcas no pueden dejar varado un perfil al restaurar. Contador 9 y canal 2; inventario, render y caché incluyen ambos objetos. Guardado anterior conservado y migración repetida inocua. Suite completa y prueba offline aprobadas; revisión visual en vertical y horizontal. Validación física y merge se reportan por separado.

## Diseño posterior

Para laberinto y cueva, preparar primero dos fichas de diseño con objetivo, entrada y salida, mapa esquemático, poderes, pistas sin revelar solución, persistencia y fuentes de canon. Elegir con el usuario el desafío central de cada uno antes de convertirlo en mapa o inventar contenido mítico. Su construcción no bloquea U2.

## Plano de implementación del canal

Propuesta técnica dentro de D30: insertar 14 filas (74–87), puerto desde 88, conservando dimensiones de plaza y palacio. Canal con paredes completas de altura 3 en filas 74 y 87 y bordes laterales. Bocas bajas en columna 11. Los bolsillos exteriores de agua abarcan columnas 10–12 en filas 73 y 88, con una barca amarrada en columna 10 y muelles de tierra en filas 72 y 89. Dejar libre columna 11 permite entrar con una barca sin chocar con la que espera en la otra orilla. Interior a cielo abierto, agua navegable continua, con dos rocas de suelo bajo: frasco cerca del muelle sur (aproximadamente 15,84), sello alejado hacia el noroeste (aproximadamente 6,78). Ajustar la geometría si las pruebas reales de visibilidad o desembarque lo requieren; las dos filas que tapa la pared sur quedan sin objetos importantes.

La barca debe poder acercarse y dejar bajar a tierra en cada roca. El sello se revela por distancia desde una barca, no por cercanía de un personaje volando, y su revelado se guarda separado de la recolección. El frasco debe verse antes de salir del muelle sur.

El rescate de U1 solo busca una barca cuyo origen toque la tierra alcanzable. U2 introduce islas sin origen de barca: probar recarga en ambas rocas cuando las barcas guardadas están lejos. Si no se puede llegar a ninguna, ubicar una barca en agua libre adyacente a la tierra alcanzable, sin perder objetos ni volver a cerrar mecanismos. Mantener posiciones guardadas cuando ya hay una barca accesible.

Trasladar también el ambiente decorativo del puerto en `ambiente.js`, hoy expresado con coordenadas absolutas. Los tests antiguos de puerto deben derivar su coordenada de la zona nueva; los tests explícitos de migración deben conservar las coordenadas anteriores para detectar desplazamientos dobles.
