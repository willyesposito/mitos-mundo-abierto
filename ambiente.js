// Ambiente: fauna y detalles que viven en el mapa sin ser mecanismos. Reglas (diseno-ambiente.md):
// no bloquea, no se guarda, no da premio ni es requisito, ningún animal sufre ni desaparece.
// Solo estado y reacciones: no dibuja (eso es de dibujo.js) y no toca la física ni el guardado.
// Los datos vienen de la lista `ambiente` del mapa: { tipo, x, y, ... } con x, y de casilla.

export const ALCANCE_VOZ = 6;      // casillas a las que responden a la voz de Eco (igual que el eco)
const R_DELFIN_VUELO = 4.5;        // un delfín sigue a Pegaso o Fénix si vuelan sobre el agua a esta distancia
const R_PULPO = 2.6;               // el pulpo se esconde si alguien pasa a esta distancia
const R_BRILLO = 4.5;              // el pulpo ve el brillo de Fénix a esta distancia
const R_GAVIOTA = 1.7;             // la gaviota se corre si alguien pasa a esta distancia
const R_PEGASO = 3.2;              // las gaviotas se suman al vuelo de Pegaso a esta distancia
const R_TORO = 3.4;                // el toro y el Minotauro se saludan a esta distancia
const ALTO_POSTE = 1.1;            // niveles (el poste mide unos 33 px)
const SIGUE_DUR = 4.5;             // cuánto acompañan las gaviotas a Pegaso

const azar = (a, b) => a + Math.random() * (b - a);

export function crearAmbiente(lista, celdas) {
  const agua = (x, y) => { const f = celdas[Math.floor(y)]; return !!f && f[Math.floor(x)] === '~'; };
  const items = (lista || []).map((d, i) => {
    const it = { tipo: d.tipo, x: d.x + 0.5, y: d.y + 0.5, hx: d.x + 0.5, hy: d.y + 0.5, i, v: d.v || 0, mira: d.mira || 1 };
    if (d.tipo === 'delfin') Object.assign(it, { salto: null, prox: 1.5 + (i * 1.7) % 5 + Math.random() * 3, listo: 0, anillos: [] });
    else if (d.tipo === 'pulpo') Object.assign(it, { esc: 0, curioso: 0, azul: 0 });
    else if (d.tipo === 'gaviota') Object.assign(it, { estado: 'posada', t: 0, reposo: 0, px: it.x, py: it.y, pz: ALTO_POSTE, grazna: 0, vuela: false, cara: i % 2 ? -1 : 1, fase: i * 2.1 });
    else if (d.tipo === 'toro') Object.assign(it, { cabeza: 0, cara: it.mira });
    return it;
  });

  function anillo(f, x, y, tipo, dur = 0.8) { f.anillos.push({ x, y, tipo, t: 0, dur }); }

  // Salto de delfín de una casilla de agua a otra cercana; sin agua donde caer, no salta.
  function saltar(f, haciaX, haciaY, corto) {
    const dir = haciaX === undefined ? (Math.random() < 0.5 ? -1 : 1) : (Math.sign(haciaX - f.x) || 1);
    for (const s of [dir, -dir]) {
      const x1 = f.x + s * 1.4;
      const y1 = f.y + (haciaY === undefined ? 0 : Math.max(-0.8, Math.min(0.8, haciaY - f.y)));
      if (!agua(x1, y1) || !agua((f.x + x1) / 2, (f.y + y1) / 2)) continue;
      f.salto = { t: 0, dur: corto ? 0.55 : 1.0, x0: f.x, y0: f.y, x1, y1, alto: corto ? 0.5 : 1.15, dir: s };
      anillo(f, f.x, f.y, 'chapoteo');
      return true;
    }
    return false;
  }

  const dist = (a, x, y) => Math.hypot(x - a.x, y - a.y);

  function actualizarDelfin(f, dt, t, j) {
    for (const a of f.anillos) a.t += dt;
    f.anillos = f.anillos.filter(a => a.t < a.dur);
    if (f.salto) {
      f.salto.t += dt;
      if (f.salto.t >= f.salto.dur) {
        anillo(f, f.salto.x1, f.salto.y1, 'chapoteo');
        f.salto = null; f.x = f.hx; f.y = f.hy;   // vuelve a su rincón bajo el agua
        f.prox = t + azar(5, 11);
      }
      return;
    }
    const sigue = (j.personaje === 'pegaso' || j.personaje === 'fenix') && j.planeo && j.estado === 'jugando'
      && agua(j.x, j.y) && dist(j, f.x, f.y) < R_DELFIN_VUELO;
    if (sigue && t >= f.listo) { if (saltar(f, j.x, j.y)) f.listo = t + azar(1.2, 2); }
    else if (t >= f.prox) { if (!saltar(f)) f.prox = t + 3; }
  }

  function actualizarPulpo(p, dt, j) {
    p.curioso = Math.max(0, p.curioso - dt); p.azul = Math.max(0, p.azul - dt);
    const cerca = dist(j, p.x, p.y) < R_PULPO && p.curioso <= 0;
    p.esc = cerca ? Math.min(1, p.esc + dt * 4) : Math.max(0, p.esc - dt * 0.5);
  }

  function actualizarGaviota(g, dt, j) {
    g.reposo = Math.max(0, g.reposo - dt); g.grazna = Math.max(0, g.grazna - dt);
    const d = dist(j, g.hx, g.hy);
    const pegaso = j.personaje === 'pegaso' && d < R_PEGASO && j.estado === 'jugando';
    if (g.estado !== 'sigue' && g.reposo <= 0) {
      if (pegaso) { g.estado = 'sigue'; g.t = 0; }
      else if (g.estado === 'posada' && d < R_GAVIOTA && j.personaje !== 'pegaso') { g.estado = 'aparta'; g.t = 0; }
    }
    let tx = g.hx, ty = g.hy, tz = ALTO_POSTE, k = 2.5;
    if (g.estado === 'aparta') {
      const l = Math.hypot(g.hx - j.x, g.hy - j.y) || 1;
      tx = g.hx + (g.hx - j.x) / l * 2.2; ty = g.hy + (g.hy - j.y) / l * 1.2 - 0.6; tz = ALTO_POSTE + 0.8;
      g.t += dt; if (g.t > 1.3) g.estado = 'vuelve';
    } else if (g.estado === 'sigue') {
      tx = j.x + Math.cos(g.fase + g.t * 1.6) * 1.2; ty = j.y - 0.4 + Math.sin(g.fase + g.t * 1.6) * 0.5; tz = Math.max(j.z, 0) + 1.3 + Math.sin(g.t * 3 + g.fase) * 0.15; k = 3.5;
      g.t += dt; if (g.t > SIGUE_DUR) { g.estado = 'vuelve'; g.reposo = 3; }
    }
    const kk = 1 - Math.exp(-dt * k), antes = g.px;
    g.px += (tx - g.px) * kk; g.py += (ty - g.py) * kk; g.pz += (tz - g.pz) * kk;
    if (Math.abs(g.px - antes) > 0.002) g.cara = Math.sign(g.px - antes);
    if (g.estado === 'vuelve' && Math.hypot(g.px - g.hx, g.py - g.hy) < 0.06 && Math.abs(g.pz - ALTO_POSTE) < 0.06) {
      g.estado = 'posada'; g.px = g.hx; g.py = g.hy; g.pz = ALTO_POSTE; g.reposo = Math.max(g.reposo, 1.5);
    }
    g.vuela = g.estado !== 'posada';
  }

  // Devuelve cuánto se inclina el Minotauro hacia el toro (0 a 1) y hacia qué lado
  function actualizarToro(b, dt, j) {
    const cerca = j.personaje === 'minotauro' && j.estado === 'jugando' && dist(j, b.x, b.y) < R_TORO;
    b.cabeza += ((cerca ? 1 : 0) - b.cabeza) * Math.min(1, dt * 4);
    if (cerca) b.cara = Math.sign(j.x - b.x) || b.mira;
    else if (b.cabeza < 0.05) b.cara = b.mira;
    return cerca ? b.cabeza : 0;
  }

  function actualizar(dt, t, j) {
    let rev = 0, dirRev = j.reverenciaDir || 1;
    for (const it of items) {
      if (it.tipo === 'delfin') actualizarDelfin(it, dt, t, j);
      else if (it.tipo === 'pulpo') actualizarPulpo(it, dt, j);
      else if (it.tipo === 'gaviota') actualizarGaviota(it, dt, j);
      else if (it.tipo === 'toro') { const r = actualizarToro(it, dt, j); if (r > rev) { rev = r; dirRev = Math.sign(it.x - j.x) || 1; } }
    }
    j.reverencia += (rev - j.reverencia) * Math.min(1, dt * 4);
    if (rev > 0) j.reverenciaDir = dirRev;
  }

  // Eco usó la voz: responden los delfines (chasquido) y las gaviotas (graznido) a su alcance.
  // Devuelve qué respondió para que el mundo avise (sonido sintetizado; siempre también se ve).
  function voz(j) {
    const res = { delfin: false, gaviota: false };
    for (const it of items) {
      if (dist(j, it.x, it.y) > ALCANCE_VOZ) continue;
      if (it.tipo === 'delfin') {
        anillo(it, it.x, it.y, 'chasquido', 0.9);
        if (!it.salto) saltar(it, undefined, undefined, true);
        res.delfin = true;
      } else if (it.tipo === 'gaviota') { it.grazna = 1.2; res.gaviota = true; }
    }
    return res;
  }

  // Fénix brilló: el pulpo cambia de color un rato y se asoma
  function brillo(j) {
    for (const it of items) if (it.tipo === 'pulpo' && dist(j, it.x, it.y) < R_BRILLO) { it.azul = 3.5; it.curioso = 3; }
  }

  return { items, actualizar, voz, brillo };
}
