// Reglas y física del mundo: alturas, salto, vuelo, empujar, embestir, objetos.
// No dibuja nada y no toca el DOM. Habla con la interfaz por la cola `eventos`.

export const TW = 44;   // ancho de baldosa en pantalla
export const TH = 36;   // profundidad de baldosa en pantalla
export const LH = 30;   // píxeles por nivel de altura
export const ABISMO = -9;

const ALTURA_PARED = 3;
const VEL = 4.2;
const VEL_EMBESTIDA = 9.5;
const GRAVEDAD = 22;
const SALTO = 5.6;          // apex ≈ 0.71 niveles: salta obstáculos bajos, no sube un nivel entero
const PASO = 0.06;          // tolerancia para subir a una baldosa pegada
const COYOTE = 0.12;
const BUFFER = 0.14;
const MEDIO = 0.27;         // semiancho de la caja del personaje
const VUELO_MAX = 2.9;
const VUELO_ACEL = 18;
const VUELO_VEL = 3.4;
const PLANEO_CAIDA = 2.3;
const EMPUJE_ESPERA = 0.22;
const EMPUJE_DURACION = 0.2;

export function alturaCelda(c) {
  switch (c) {
    case '#': case 'b': case 'M': case 'G': return ALTURA_PARED;
    case '~': return ABISMO;
    case 'a': return 1;
    case 'A': return 2;
    default: return 0;
  }
}

export function crearMundo(mapa, recogidos) {
  const filas = mapa.filas;
  const rows = filas.length, cols = filas[0].length;
  const celdas = [], empujables = [];
  for (let y = 0; y < rows; y++) {
    celdas.push([]);
    for (let x = 0; x < cols; x++) {
      let c = filas[y][x];
      if (c === 'B' || c === 'V') {
        empujables.push({
          tipo: c === 'B' ? 'bloque' : 'vasija',
          tx: x, ty: y, ox: x, oy: y, px: x, py: y, t: 1,
          alto: c === 'B' ? 0.9 : 1.1,
        });
        c = ',';
      } else if (c === 'S') c = '.';
      celdas[y].push(c);
    }
  }

  const enlaces = (mapa.enlaces || []).map(e => ({ placa: e.placa, abre: e.abre, abierto: false }));
  const coleccionables = (mapa.objetos || []).filter(o => o.tipo === 'coleccionable').map(o => ({
    id: o.id, x: o.x + 0.5, y: o.y + 0.5,
    zBase: alturaCelda(celdas[o.y][o.x]),
    recogido: !!recogidos[o.id],
  }));

  const m = {
    cols, rows, celdas, empujables, coleccionables, enlaces,
    particulas: [], eventos: [], t: 0, velo: 0,
    jugador: {
      x: mapa.inicio[0], y: mapa.inicio[1], z: 0, vz: 0,
      enSuelo: true, coyote: 0, buffer: 0, planeo: false,
      fx: 0, fy: 1, camina: false, paso: 0,
      personaje: 'pegaso', embiste: null, embCool: 0,
      empuje: { e: null, t: 0 }, pistaCool: 0,
      seguro: { x: mapa.inicio[0], y: mapa.inicio[1], z: 0 },
      estado: 'jugando', estadoT: 0,
    },
    suelo, alturaTile, actualizar, cambiarPersonaje,
  };

  function empujableEn(tx, ty) {
    for (const e of empujables) if (e.tx === tx && e.ty === ty) return e;
    return null;
  }

  function alturaTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return ALTURA_PARED;
    const h = alturaCelda(celdas[ty][tx]);
    if (h <= ABISMO) return ABISMO;
    const e = empujableEn(tx, ty);
    return e ? h + e.alto : h;
  }

  function suelo(x, y) { return alturaTile(Math.floor(x), Math.floor(y)); }

  function libre(x, y, z) {
    for (const cx of [x - MEDIO, x + MEDIO])
      for (const cy of [y - MEDIO, y + MEDIO])
        if (alturaTile(Math.floor(cx), Math.floor(cy)) > z + PASO) return false;
    return true;
  }

  function esquinasFirmes(x, y, g) {
    for (const dx of [-0.45, 0.45])
      for (const dy of [-0.45, 0.45])
        if (Math.abs(suelo(x + dx, y + dy) - g) > 0.01) return false;
    return true;
  }

  function chispas(x, y, z, color, n, fuerza = 2) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * fuerza;
      m.particulas.push({ x, y, z, vx: Math.cos(a) * v * 0.5, vy: Math.sin(a) * v * 0.35, vz: 1.5 + Math.random() * 2, vida: 0.5 + Math.random() * 0.4, vida0: 0.9, color });
    }
  }

  function cambiarPersonaje(id) {
    const j = m.jugador;
    if (j.estado !== 'jugando' || j.personaje === id) return;
    j.personaje = id;
    j.embiste = null;
    chispas(j.x, j.y, j.z + 0.6, '#f4ecd8', 14, 2.4);
    m.eventos.push({ tipo: 'cambio', id });
  }

  function romperMuro(tx, ty) {
    celdas[ty][tx] = '.';
    chispas(tx + 0.5, ty + 0.5, 0.8, '#cbb994', 26, 3.2);
    m.eventos.push({ tipo: 'muro' });
  }

  function abrirReja(e) {
    e.abierto = true;
    const [x, y] = e.abre;
    celdas[y][x] = '.';
    chispas(x + 0.5, y + 0.5, 0.8, '#d9a441', 22, 2.6);
    m.eventos.push({ tipo: 'reja' });
  }

  function actualizarEmpujables(dt) {
    for (const e of empujables) {
      if (e.t < 1) e.t = Math.min(1, e.t + dt / EMPUJE_DURACION);
      const k = e.t * e.t * (3 - 2 * e.t);
      e.px = e.ox + (e.tx - e.ox) * k;
      e.py = e.oy + (e.ty - e.oy) * k;
    }
    for (const l of enlaces) {
      if (l.abierto) continue;
      const e = empujableEn(l.placa[0], l.placa[1]);
      if (e && e.t >= 1) abrirReja(l);
    }
  }

  function actualizarParticulas(dt) {
    for (const p of m.particulas) {
      p.vida -= dt; p.vz -= 9 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.z < 0) { p.z = 0; p.vz *= -0.3; }
    }
    m.particulas = m.particulas.filter(p => p.vida > 0);
  }

  function jugadorSolapa(tx, ty) {
    const j = m.jugador;
    return j.x + MEDIO > tx && j.x - MEDIO < tx + 1 && j.y + MEDIO > ty && j.y - MEDIO < ty + 1;
  }

  function intentarEmpuje(e, dx, dy) {
    const tx = e.tx + dx, ty = e.ty + dy;
    if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return false;
    const c = celdas[ty][tx];
    if (c !== ',' && c !== 'p') return false;
    if (empujableEn(tx, ty) || jugadorSolapa(tx, ty)) return false;
    if (alturaCelda(c) !== alturaCelda(celdas[e.ty][e.tx])) return false;
    e.ox = e.tx; e.oy = e.ty; e.tx = tx; e.ty = ty; e.t = 0;
    chispas(e.ox + 0.5, e.oy + 0.5, 0.1, '#cbb994', 5, 1.2);
    return true;
  }

  function iniciarCaida() {
    const j = m.jugador;
    j.estado = 'cayendo'; j.estadoT = 0; j.embiste = null;
  }

  function reaparecer() {
    const j = m.jugador;
    let s = j.seguro;
    if (empujableEn(Math.floor(s.x), Math.floor(s.y))) s = { x: mapa.inicio[0], y: mapa.inicio[1], z: 0 };
    j.x = s.x; j.y = s.y; j.z = suelo(s.x, s.y); j.vz = 0;
    j.enSuelo = true; j.planeo = false; j.coyote = 0; j.buffer = 0;
  }

  function actualizar(dt, entrada) {
    const j = m.jugador;
    m.t += dt;
    j.embCool = Math.max(0, j.embCool - dt);
    j.coyote = Math.max(0, j.coyote - dt);
    j.buffer = Math.max(0, j.buffer - dt);
    j.pistaCool = Math.max(0, j.pistaCool - dt);

    const saltoPulsado = entrada.saltoPulsado, poderPulsado = entrada.poderPulsado;
    entrada.saltoPulsado = false; entrada.poderPulsado = false;
    actualizarEmpujables(dt);
    actualizarParticulas(dt);

    if (j.estado === 'volviendo') {
      j.estadoT += dt; m.velo = Math.max(0, 1 - j.estadoT / 0.3);
      if (j.estadoT >= 0.3) { j.estado = 'jugando'; m.velo = 0; }
    }
    const control = j.estado === 'jugando';
    if (control && saltoPulsado) j.buffer = BUFFER;

    // Movimiento horizontal
    let ix = control ? entrada.x : 0, iy = control ? entrada.y : 0;
    const largo = Math.hypot(ix, iy), mag = Math.min(1, largo);
    if (largo > 0.0001) { ix /= largo; iy /= largo; }
    if (mag > 0.2) { j.fx = ix; j.fy = iy; }

    if (control && poderPulsado && j.personaje === 'minotauro' && !j.embiste && j.embCool <= 0 && j.enSuelo) {
      const l = Math.hypot(j.fx, j.fy) || 1;
      j.embiste = { t: 0.26, dx: j.fx / l, dy: j.fy / l };
      j.embCool = 0.5;
    }

    let vx = ix * VEL * mag, vy = iy * VEL * mag;
    if (j.embiste) {
      const em = j.embiste;
      vx = em.dx * VEL_EMBESTIDA; vy = em.dy * VEL_EMBESTIDA;
      const sx = j.x + em.dx * (MEDIO + 0.2), sy = j.y + em.dy * (MEDIO + 0.2);
      const tx = Math.floor(sx), ty = Math.floor(sy);
      if (celdas[ty] && celdas[ty][tx] === 'M' && j.z < 0.5) romperMuro(tx, ty);
      em.t -= dt;
      if (em.t <= 0) j.embiste = null;
    }

    const antes = { x: j.x, y: j.y };
    let choco = false;
    if (vx) { const nx = j.x + vx * dt; if (libre(nx, j.y, j.z)) j.x = nx; else choco = true; }
    if (vy) { const ny = j.y + vy * dt; if (libre(j.x, ny, j.z)) j.y = ny; else choco = true; }
    if (choco && j.embiste) j.embiste = null;
    const mov = Math.hypot(j.x - antes.x, j.y - antes.y);
    j.camina = mov > 0.001;
    j.paso += mov;

    // Empujar (Minotauro) o avisar que pesa (los demás)
    let intento = null;
    if (control && j.enSuelo && !j.embiste && (Math.abs(ix * mag) > 0.4 || Math.abs(iy * mag) > 0.4)) {
      let dx = 0, dy = 0;
      if (Math.abs(ix) >= Math.abs(iy)) dx = Math.sign(ix); else dy = Math.sign(iy);
      const tx = Math.floor(j.x + dx * (MEDIO + 0.1)), ty = Math.floor(j.y + dy * (MEDIO + 0.1));
      const e = empujableEn(tx, ty);
      if (e && e.t >= 1) {
        const lat = dx ? Math.abs(j.y - (ty + 0.5)) : Math.abs(j.x - (tx + 0.5));
        if (lat < 0.42 && Math.abs(j.z - alturaCelda(celdas[ty][tx])) < 0.3) intento = { e, dx, dy };
      }
    }
    if (intento && intento.e === j.empuje.e) j.empuje.t += dt;
    else { j.empuje.e = intento ? intento.e : null; j.empuje.t = 0; }
    if (intento && j.personaje === 'minotauro' && j.empuje.t > EMPUJE_ESPERA) {
      intentarEmpuje(intento.e, intento.dx, intento.dy);
      j.empuje.t = 0;
    } else if (intento && j.personaje !== 'minotauro' && j.empuje.t > 0.4 && j.pistaCool <= 0) {
      j.pistaCool = 8;
      m.eventos.push({ tipo: 'pista', texto: 'Pesa muchísimo. Quizás alguien más fuerte pueda moverlo.' });
    }

    // Vertical: salto, vuelo, caída
    const vuela = control && j.personaje === 'pegaso' && entrada.poderMantenido;
    const g0 = suelo(j.x, j.y);
    if (j.enSuelo) {
      if (g0 < j.z - 0.02) { j.enSuelo = false; j.coyote = COYOTE; }
      else j.z = g0;
    }
    if (j.buffer > 0 && (j.enSuelo || j.coyote > 0) && !vuela) {
      j.vz = SALTO; j.enSuelo = false; j.coyote = 0; j.buffer = 0;
    }
    if (vuela) {
      j.enSuelo = false; j.planeo = true;
      j.vz = Math.min(VUELO_VEL, j.vz + VUELO_ACEL * dt);
    }
    if (!j.enSuelo) {
      if (!vuela) j.vz -= GRAVEDAD * dt;
      if (j.planeo && !vuela) j.vz = Math.max(j.vz, -PLANEO_CAIDA);
      j.z += j.vz * dt;
      if (vuela && j.z >= VUELO_MAX) { j.z = VUELO_MAX; j.vz = Math.min(j.vz, 0); }
      const g = suelo(j.x, j.y);
      if (j.vz <= 0 && j.z <= g && g > ABISMO) {
        j.z = g; j.vz = 0; j.enSuelo = true; j.planeo = false;
      } else if (g <= ABISMO && j.z < -2.4 && control) iniciarCaida();
    }

    if (j.estado === 'cayendo') {
      j.estadoT += dt; m.velo = Math.min(1, j.estadoT / 0.3);
      if (j.estadoT >= 0.3) { reaparecer(); j.estado = 'volviendo'; j.estadoT = 0; }
    }

    // Último piso firme
    if (control && j.enSuelo && !empujableEn(Math.floor(j.x), Math.floor(j.y)) && esquinasFirmes(j.x, j.y, j.z))
      j.seguro = { x: j.x, y: j.y, z: j.z };

    // Objetos
    if (control) {
      for (const c of coleccionables) {
        if (c.recogido) continue;
        if (Math.hypot(c.x - j.x, c.y - j.y) < 0.6 && Math.abs(j.z - c.zBase) <= 1.0) {
          c.recogido = true;
          chispas(c.x, c.y, c.zBase + 0.6, '#d9a441', 24, 2.8);
          m.eventos.push({ tipo: 'objeto', id: c.id });
        }
      }
    }
  }

  return m;
}
