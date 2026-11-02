# Mejora gráfica integral — ChatGPT / Codex

Autoría: ChatGPT / Codex (OpenAI). Implementación autorizada el 2026-11-02. Base: main 44ae7fe5. Entrega por PR; validación en celular real pendiente.

## Implementado

- Cinco personajes con frente, espalda, costados y dos pasos por vista; reposo y alas animadas.
- Ambiente agrupado en puerto, plaza y palacio, con flora, fauna y reacciones visuales. Se mantienen libres mecanismos y carriles de sogas.
- Sombras de contacto, bordes de alturas y juntas más suaves; baldosas empujables explícitas.
- Apertura visual de puertas y rejas, inclinación al empujar y embestir, asentamiento al aterrizar. La apertura lógica es inmediata.
- Cámara vertical más cercana y controles separados con áreas táctiles amplias; movimiento reducido.
- Recursos locales incluidos en caché y service worker versión 13.

## Verificación

17 chequeos rápidos y 366 invariantes gráficas aprobados. Render revisado en vertical (390×844 y 360×640), escritorio y movimiento reducido: 56 sprites de personajes y 70 recursos de escenario, sin errores ni faltantes. Capturas reales inspeccionadas.

Prueba integral: 240 chequeos aprobados, cero fallas y sin errores de consola (`node herramientas/probar.js --sin-servidor`). La red local directa devuelve ERR_NETWORK_ACCESS_DENIED: las pruebas usan intercepción de archivos locales. Permite verificar el juego, pero no instalación y recarga real del service worker. Esta comprobación y la prueba en celular físico quedan pendientes. No se afirma medición de rendimiento ni validación por la jugadora.

## Alcance

Presentación: conserva mapa, colisiones, reglas, poderes y formato del guardado. La implementación no reemplaza la aprobación visual en dispositivo.
