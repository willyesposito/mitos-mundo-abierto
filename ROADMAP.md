# Roadmap: Mitos, mundo abierto

Estado de las sesiones. El contenido de cada una (fichas, catálogo, desafíos) está en `plan-etapa-1.md` y las decisiones en `DECISIONS.md`: acá no se repiten.

Estados: **pendiente**, **construida** (`probar.js` pasa) y **validada** (la jugadora lo usó en el celular). Solo Willy marca "validada".

Última verificación: 2026-10-04, `probar.js` sin fallas tras unir A4 con A5 y el aleteo.

## Etapa 1: primer mapa completo (puerto, plaza, palacio)

Se cierra con el criterio de terminado de `CLAUDE.md`.

- [x] **S0 Prueba con la jugadora**: validada.
- [x] **S1 El mundo se guarda**: construida. Falta probarla en el celular.
- [x] **S2 Poder de Fénix**: construida. Decisión: D2.
- [x] **S3 Poder de Eco**: construida. Decisión: D3.
- [x] **S4 Poder de Ariadna**: construida. Decisión: D4.
- [x] **S5 Fichas y catálogo**: construida. Decisiones: D5, D6.
- [x] **S6 Puerto y plaza**: construida. Decisión: D7.
- [x] **S7 Palacio en terrazas**: construida. Sin decisión nueva. Falta probarla en el celular.
- [ ] **S8 Cierre de etapa**: pendiente. Decisión: D8 (retirar el campo de pruebas).

Siguiente: S8.

## Arte: sprites embebidos

Plan en `plan-arte.md`. Decisiones: D16 a D22. Orden de inicio a definir por Willy.

- [x] **A0 Prueba de tubería**: construida. Decisiones: D18, D19. Cinco personajes quietos en SVG. Falta que Willy lo vea en el celular, a tamaño real y sin conexión.
- [x] **A1 Dirección de arte**: construida y aprobada por Willy. Decisión: D17. Resultado en `plan-arte.md`.
- [ ] **A2 Personajes quietos y caminando**: pendiente. Poses quietas de los cinco hechas en A0; faltan caminar y direcciones. Cuatro direcciones (D22); los diseños salen del chat de diseño de Willy.
- [ ] **A3 Movimiento y poderes**: pendiente. Aleteo de Pegaso y Fénix hecho (D20); faltan las ondas de Eco y las señales de los demás poderes.
- [x] **A4 Interfaz**: construida. Maqueta aprobada en el lienzo de Design "Mitos: interfaz" (privado de Willy). Íconos en tres tonos, tira con insignia de rasgo, aviso con medallón, pista con velo y ficha nueva. Falta que la jugadora lo pruebe en el celular.
- [x] **A5 Escenario y mecanismos**: construida (`probar.js`: 193 OK tras unir con el aleteo). Decisión: D17. Falta la animación de la reja al abrirse y ver techo, reja y puerta de sonido en el celular.
- [ ] **A6 Coleccionables y ambiente**: pendiente.

## Abierto

- Validar S1 a S6 en el celular con la jugadora, siguiendo la lista de observación del final de `plan-etapa-1.md`.
- Confirmar D4, D5, D7 y D8: están vigentes en el código pero sin confirmación de Willy registrada (ver `DECISIONS.md`).

## Fuera de la etapa 1

Etapa 2: laberinto, cueva del monte y personajes nuevos. Sin fecha: taller de Dédalo y Talos.
