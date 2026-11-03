# Jugabilidad adaptable y primera revisión de la plaza

Autoría: ChatGPT / Codex (OpenAI). Implementación autorizada en la conversación. Estado: construida para revisión, pendiente de prueba de uso en dispositivos físicos.

## Cambios

- PC con teclado: barra de personajes compacta, cinco nombres y atajos visibles, acciones clickeables, sin joystick táctil. Tablet y celular conservan controles táctiles; en horizontal las acciones quedan a los lados.
- Canvas, HUD y controles usan la superficie visible del navegador, con ajuste ante cambio de orientación, tamaño, barras y visualViewport. Se miden los controles después de cambiar su contenido.
- La plaza tiene un sendero curvo con ramales hacia lugares de actividad y zonas de tierra y vegetación asimétricas. Dos recovecos amplían su borde oriental; se abren 16 casillas de parapeto, sin agregar obstáculos.
- «Explorar plaza» muestra cuatro lugares: Patio del toro, Terrazas del jardín, Patio del sol y Galería del sonido. Se puede elegir un lugar, seguir una referencia visible y recibir una pista al acercarse. No revela qué personaje resuelve cada desafío. Los pendientes se deducen de objetos y sogas ya guardados; no se agrega un formato de progreso.
- La orientación mantiene el destino elegido al caminar y calcula un tramo caminable para el texto direccional. El marcador se desplaza a un costado del destino para no tapar su mecanismo.

## Compatibilidad

No se mueven objetos, braseros, puertas, sogas, zonas ni coordenadas de mecanismos. No se agrega ninguna pared ni se altera la física. Las posiciones antiguas siguen siendo transitables. La selección temporal de destino y sus rutas no se guardan. Los módulos nuevos están incluidos en la caché, versión 14.

## Verificación

- 22 chequeos de exploración: destinos elegibles, ruta por piso, avance tras recoger, completados restaurados, guía limitada a plaza y dimensiones del mundo.
- 372 verificaciones gráficas y de recursos locales aprobadas.
- 17 chequeos rápidos del juego aprobados.
- Matriz final de 11 pantallas aprobada, incluidas PC 1890×1040 con densidad 1.25 y PC 800×480, tablet y celular en ambas orientaciones. Controles completos, cinco nombres visibles, teclado, selección de personaje, salto, menú, apertura de la guía con Espacio sin saltar y rotación dinámica comprobados. Capturas revisadas en PC grande, celular vertical y horizontal pequeño.

El recorte exacto de la captura reportada no se reprodujo en las primeras dimensiones de PC. Sí se midió una barra que consumía 234 px (39 % de un alto de 600 px); la nueva barra ocupa 120 px. En horizontal táctil pasa de 171 a 76 px, con las acciones a los lados del escenario. La validación no equivale a probar un dispositivo físico. Instalación y recarga real offline del service worker pendientes por restricción de red local del entorno; las pruebas de navegador usan intercepción de archivos locales.
