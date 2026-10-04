// Joystick táctil, botones y teclado. Todo termina en un único objeto `entrada`.
export function crearControles({ zona, joystick, palanca, btnSalto, btnPoder, alCambiar, alMenu, alFicha }) {
  const entrada = { x: 0, y: 0, saltoPulsado: false, poderPulsado: false, poderMantenido: false };

  // --- Joystick ---
  let punteroJoy = null;
  const RADIO = 46;
  function mover(ev) {
    const r = joystick.getBoundingClientRect();
    let dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > RADIO) { dx = dx / l * RADIO; dy = dy / l * RADIO; }
    palanca.style.transform = `translate(${dx}px, ${dy}px)`;
    const k = Math.hypot(dx, dy) / RADIO;
    if (k < 0.15) { entrada.x = 0; entrada.y = 0; }
    else { entrada.x = dx / RADIO; entrada.y = dy / RADIO; }
  }
  function soltarJoy() {
    punteroJoy = null; entrada.x = 0; entrada.y = 0;
    palanca.style.transform = 'translate(0px, 0px)';
  }
  zona.addEventListener('pointerdown', ev => {
    if (punteroJoy !== null) return;
    punteroJoy = ev.pointerId; zona.setPointerCapture(ev.pointerId); mover(ev); ev.preventDefault();
  });
  zona.addEventListener('pointermove', ev => { if (ev.pointerId === punteroJoy) mover(ev); });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture'])
    zona.addEventListener(t, ev => { if (ev.pointerId === punteroJoy) soltarJoy(); });

  // --- Botones ---
  function boton(el, abajo, arriba) {
    let activo = null;
    el.addEventListener('pointerdown', ev => {
      if (activo !== null) return;
      activo = ev.pointerId; el.setPointerCapture(ev.pointerId); el.classList.add('apretado');
      abajo(); ev.preventDefault();
    });
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture'])
      el.addEventListener(t, ev => {
        if (ev.pointerId !== activo) return;
        activo = null; el.classList.remove('apretado'); if (arriba) arriba();
      });
  }
  boton(btnSalto, () => { entrada.saltoPulsado = true; });
  boton(btnPoder, () => { entrada.poderPulsado = true; entrada.poderMantenido = true; }, () => { entrada.poderMantenido = false; });

  // --- Teclado (extra) ---
  const teclas = new Set();
  function recalcular() {
    const h = (teclas.has('ArrowRight') || teclas.has('KeyD') ? 1 : 0) - (teclas.has('ArrowLeft') || teclas.has('KeyA') ? 1 : 0);
    const v = (teclas.has('ArrowDown') || teclas.has('KeyS') ? 1 : 0) - (teclas.has('ArrowUp') || teclas.has('KeyW') ? 1 : 0);
    if (punteroJoy === null) { entrada.x = h; entrada.y = v; }
  }
  const PODER = ['KeyE', 'KeyJ', 'ShiftLeft', 'ShiftRight'];
  addEventListener('keydown', ev => {
    if (ev.target instanceof HTMLInputElement) return;
    if (ev.repeat) { if (ev.code === 'Space' || ev.code.startsWith('Arrow')) ev.preventDefault(); return; }
    if (ev.code === 'Space') { entrada.saltoPulsado = true; ev.preventDefault(); }
    else if (PODER.includes(ev.code)) { entrada.poderPulsado = true; entrada.poderMantenido = true; }
    else if (/^Digit[1-5]$/.test(ev.code)) alCambiar(Number(ev.code.slice(5)) - 1);
    else if (ev.code === 'KeyC') alCambiar(-1);
    else if (ev.code === 'Escape') alMenu();
    else if (ev.code === 'KeyI' && alFicha) alFicha();
    else { teclas.add(ev.code); recalcular(); if (ev.code.startsWith('Arrow')) ev.preventDefault(); }
  });
  addEventListener('keyup', ev => {
    if (PODER.includes(ev.code)) entrada.poderMantenido = false;
    teclas.delete(ev.code); recalcular();
  });
  addEventListener('blur', () => { teclas.clear(); entrada.poderMantenido = false; recalcular(); });

  return entrada;
}
