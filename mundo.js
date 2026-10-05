// Reglas y física del mundo: alturas, salto, vuelo, empujar, embestir, objetos.
// No dibuja nada y no toca el DOM. Habla con la interfaz por la cola `eventos`.

import { crearAmbiente } from './ambiente.js';

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
// D21: Fénix llega a una terraza (1) con margen y nunca a un techo (2): un techo bloquea si z + PASO < 2
const VUELO_MAX_FENIX = 1.6;
const VUELO_ACEL = 18;
const VUELO_VEL = 3.4;
const PLANEO_CAIDA = 2.3;
const EMPUJE_ESPERA = 0.22;
const EMPUJE_DURACION = 0.2;
const TAP_MAX = 0.2;        // Fénix: un toque más corto que esto brilla; mantener más tiempo vuela
const RADIO_BRILLO = 2.2;   // alcance de la luz de Fénix sobre los braseros
const RADIO_OIDO = 2.6;     // distancia a la que Eco escucha una fuente de sonido
const ALCANCE_ECO = 6;      // casillas que llega el eco repetido (atraviesa paredes)
const RADIO_ARGOLLA = 1.3;  // distancia a la argolla para tender la soga
const TOL_SOGA = 0.55;      // cuánto se puede subir de golpe sobre una soga
const MAX_SOGA = 5;

export function alturaCelda(c) {
  switch (c) {
    case '#': case 'b': case 'M': case 'G': case 'D': case 'O': return ALTURA_PARED;
    case '~': return ABISMO;
    case 'a': return 1;
    case 'A': return 2;
    default: return 0;
  }
}

// `guardado` es el estado del mapa para este perfil (ver `estado()` abajo). Puede venir vacío.
// `llegada` es [x, y] donde se aparece (la última posición firme guardada); si falta, se empieza en `inicio`.
export function crearMundo(mapa, recogidos, guardado = {}, llegada = null) {
  const arranque = llegada || mapa.inicio;
  const filas = mapa.filas;
  const rows = filas.length, cols = filas[0].length;
  const celdas = [], empujables = [];
  for (let y = 0; y < rows; y++) {
    celdas.push([]);
    for (let x = 0; x < cols; x++) {
      let c = filas[y][x];
      if (c === 'B' || c === 'V') {
        empujables.push({
          origen: x + ',' + y,   // identifica al objeto en el guardado aunque se mueva
          tipo: c === 'B' ? 'bloque' : 'vasija',
          tx: x, ty: y, ox: x, oy: y, px: x, py: y, t: 1,
          alto: c === 'B' ? 0.9 : 1.1,
        });
        c = ',';
      } else if (c === 'S') c = '.';
      celdas[y].push(c);
    }
  }

  const origen = celdas.map(f => f.slice());   // para el dibujo: qué había antes de abrir o romper (solo lectura)

  // Lo que la jugadora cambió en este mapa queda como lo dejó: nada se cierra ni se arma de nuevo.
  const rotos = new Set();
  for (const k of guardado.muros || []) {
    const [x, y] = k.split(',').map(Number);
    if (celdas[y] && celdas[y][x] === 'M') { celdas[y][x] = '.'; rotos.add(k); }
  }
  const movidos = guardado.empujables || {};
  const ubicar = (e, x, y) => { e.tx = e.ox = e.px = x; e.ty = e.oy = e.py = y; };
  for (const e of empujables) {
    const pos = movidos[e.origen];
    const c = pos && celdas[pos[1]] && celdas[pos[1]][pos[0]];
    if (c === ',' || c === 'p') ubicar(e, pos[0], pos[1]);
  }
  // Si el mapa cambió y dos quedan en la misma baldosa, el que se había movido vuelve a su lugar original
  const movido = e => e.origen !== e.tx + ',' + e.ty;
  let choque;
  while ((choque = empujables.find(e => movido(e) && empujables.some(o => o !== e && o.tx === e.tx && o.ty === e.ty))))
    ubicar(choque, ...choque.origen.split(',').map(Number));
  const rejasAbiertas = new Set(guardado.rejas || []);
  const enlaces = (mapa.enlaces || []).map(e => {
    const abierto = rejasAbiertas.has(e.abre.join(','));
    if (abierto) celdas[e.abre[1]][e.abre[0]] = '.';
    return { placa: e.placa, abre: e.abre, abierto };
  });
  // Fénix: braseros y puertas del sol
  const brasasGuardadas = new Set(guardado.braseros || []);
  const braseros = (mapa.braseros || []).map(b => ({ x: b.x, y: b.y, encendido: brasasGuardadas.has(b.x + ',' + b.y), zBase: alturaCelda(celdas[b.y][b.x]) }));
  const solesAbiertos = new Set(guardado.soles || []);
  const soles = (mapa.soles || []).map(s => {
    const lista = s.braseros.map(([x, y]) => braseros.find(b => b.x === x && b.y === y)).filter(Boolean);
    const abierto = solesAbiertos.has(s.abre.join(',')) || (lista.length > 0 && lista.every(b => b.encendido));
    if (abierto) celdas[s.abre[1]][s.abre[0]] = '.';
    return { braseros: lista, abre: s.abre, abierto };
  });

  // Eco: fuentes de sonido y puertas que responden a un sonido
  const sonidos = mapa.sonidos || {};
  const fuentesVibrando = new Set(guardado.fuentes || []);
  const fuentes = (mapa.fuentes || []).filter(f => sonidos[f.sonido]).map(f => ({
    x: f.x + 0.5, y: f.y + 0.5, tx: f.x, ty: f.y, sonido: f.sonido, modo: f.modo, golpea: f.golpea || null,
    zBase: alturaCelda(celdas[f.y][f.x]),
    activa: f.modo === 'sola' || fuentesVibrando.has(f.x + ',' + f.y), oida: false, fase: 0,
  }));
  const puertasAbiertas = new Set(guardado.puertas || []);
  const puertasSonido = (mapa.puertasSonido || []).filter(p => sonidos[p.sonido] && celdas[p.y][p.x] === 'O').map(p => {
    const abierta = puertasAbiertas.has(p.x + ',' + p.y);
    if (abierta) celdas[p.y][p.x] = '.';
    return { x: p.x, y: p.y, sonido: p.sonido, abierta };
  });

  // Ariadna: sogas entre argollas. Solo en línea recta y de hasta MAX_SOGA casillas.
  const cuerdas = new Map();   // casilla -> altura por la que se camina
  const sogasTendidas = new Set(guardado.sogas || []);
  const sogas = (mapa.sogas || []).map(s => {
    const [ax, ay] = s.a, [bx, by] = s.b;
    const n = Math.abs(bx - ax) + Math.abs(by - ay);
    const ha = alturaCelda(celdas[ay][ax]), hb = alturaCelda(celdas[by][bx]);
    if ((ax !== bx && ay !== by) || n < 1 || n > MAX_SOGA || Math.abs(hb - ha) / n > TOL_SOGA) return null;
    const casillas = [];
    for (let i = 0; i <= n; i++) casillas.push({ x: ax + Math.sign(bx - ax) * i, y: ay + Math.sign(by - ay) * i, h: ha + (hb - ha) * i / n });
    return { a: s.a, b: s.b, ha, hb, casillas, tendida: false, prog: 1, desde: 0 };
  }).filter(Boolean);
  function tenderEn(s) { s.tendida = true; for (const c of s.casillas) cuerdas.set(c.x + ',' + c.y, c.h); }
  for (const s of sogas) if (sogasTendidas.has(s.a.join(','))) tenderEn(s);

  const coleccionables = (mapa.objetos || []).filter(o => o.tipo === 'coleccionable').map(o => ({
    id: o.id, x: o.x + 0.5, y: o.y + 0.5,
    zBase: alturaCelda(celdas[o.y][o.x]),
    recogido: !!recogidos[o.id],
  }));

  const amb = crearAmbiente(mapa.ambiente, celdas);   // fauna y detalles: no bloquean ni se guardan

  const m = {
    id: mapa.id, barcas: mapa.barcas || [], ambiente: amb.items, bloqueos: amb.bloqueos,
    cols, rows, celdas, origen, empujables, coleccionables, enlaces, braseros, soles, fuentes, puertasSonido, sogas, sonidos, ondas: [], eco: sonidos[guardado.eco] ? guardado.eco : null,
    particulas: [], senales: [], eventos: [], t: 0, velo: 0,
    jugador: {
      x: arranque[0], y: arranque[1], z: 0, vz: 0,
      enSuelo: true, coyote: 0, buffer: 0, planeo: false,
      fx: 0, fy: 1, camina: false, paso: 0,
      personaje: 'pegaso', embiste: null, embCool: 0,
      empuje: { e: null, t: 0 }, pistaCool: 0, tap: false, poderT: 0, brillo: 0, ecoCool: 0, esfuerzo: 0, senalT: 0, reverencia: 0, reverenciaDir: 1,
      seguro: { x: arranque[0], y: arranque[1], z: 0 },
      estado: 'jugando', estadoT: 0,
    },
    suelo, alturaTile, actualizar, cambiarPersonaje, estado,
  };

  // Estado persistente del mapa. Una clave por mecanismo: los poderes nuevos suman la suya.
  function estado() {
    const empuj = {};
    for (const e of empujables) if (movido(e)) empuj[e.origen] = [e.tx, e.ty];
    return {
      muros: [...rotos],
      rejas: enlaces.filter(l => l.abierto).map(l => l.abre.join(',')),
      empujables: empuj,
      braseros: braseros.filter(b => b.encendido).map(b => b.x + ',' + b.y),
      soles: soles.filter(s => s.abierto).map(s => s.abre.join(',')),
      fuentes: fuentes.filter(f => f.modo === 'golpe' && f.activa).map(f => f.tx + ',' + f.ty),
      puertas: puertasSonido.filter(p => p.abierta).map(p => p.x + ',' + p.y),
      eco: m.eco,
      sogas: sogas.filter(s => s.tendida).map(s => s.a.join(',')),
    };
  }

  function empujableEn(tx, ty) {
    for (const e of empujables) if (e.tx === tx && e.ty === ty) return e;
    return null;
  }

  function alturaTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return ALTURA_PARED;
    if (amb.bloqueos.has(tx + ',' + ty)) return ALTURA_PARED;   // el olivo es el único ambiente con cuerpo
    const hc = cuerdas.get(tx + ',' + ty);
    if (hc !== undefined) return hc;
    const h = alturaCelda(celdas[ty][tx]);
    if (h <= ABISMO) return ABISMO;
    const e = empujableEn(tx, ty);
    return e ? h + e.alto : h;
  }

  function suelo(x, y) { return alturaTile(Math.floor(x), Math.floor(y)); }

  function libre(x, y, z) {
    // Sobre una soga se camina por su carril: se mide solo el centro y se tolera un desnivel de escala.
    const hc = cuerdas.get(Math.floor(x) + ',' + Math.floor(y));
    if (hc !== undefined) return hc <= z + TOL_SOGA;
    for (const cx of [x - MEDIO, x + MEDIO])
      for (const cy of [y - MEDIO, y + MEDIO]) {
        const tx = Math.floor(cx), ty = Math.floor(cy);
        if (alturaTile(tx, ty) > z + (cuerdas.has(tx + ',' + ty) ? TOL_SOGA : PASO)) return false;
      }
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

  // Señales visuales de los poderes (solo se dibujan; no tocan la física). Posición en casillas, z en niveles.
  // tipo: 'polvo' (nubecita), 'rafaga' (arcos de aire a los costados), 'brasa' (partícula que cae).
  function senal(tipo, x, y, z, dur, extra = {}) {
    if (m.senales.length > 70) m.senales.shift();
    m.senales.push({ tipo, x, y, z, t: 0, dur, ...extra });
  }
  function polvo(x, y, z, n = 3, dispersion = 0.25) {
    for (let i = 0; i < n; i++) {
      const lado = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
      senal('polvo', x + lado * dispersion, y + (Math.random() - 0.5) * 0.12, z, 0.5 + Math.random() * 0.2, { vx: lado * 0.5, r: 5 + Math.random() * 3 });
    }
  }
  function actualizarSenales(dt) {
    for (const q of m.senales) {
      q.t += dt;
      if (q.tipo === 'polvo') { q.x += q.vx * dt; q.z += 0.25 * dt; }
      else if (q.tipo === 'brasa') { q.x += q.vx * dt; q.z = Math.max(q.z - 0.9 * dt, Math.max(suelo(q.x, q.y), 0)); }
    }
    m.senales = m.senales.filter(q => q.t < q.dur);
  }

  function cambiarPersonaje(id) {
    const j = m.jugador;
    if (j.estado !== 'jugando' || j.personaje === id) return;
    j.personaje = id;
    j.embiste = null; j.tap = false; j.poderT = 0;
    for (const f of fuentes) f.oida = false;   // al volver a Eco, vuelve a escuchar lo que tiene cerca
    chispas(j.x, j.y, j.z + 0.6, '#f4ecd8', 14, 2.4);
    m.eventos.push({ tipo: 'cambio', id });
  }

  function romperMuro(tx, ty) {
    celdas[ty][tx] = '.';
    rotos.add(tx + ',' + ty);
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
      if (e.t < 1) {
        const paso = Math.floor(e.t * 4);
        if (paso !== e.pasoPolvo) { e.pasoPolvo = paso; polvo(e.px + 0.5, e.py + 0.95, alturaCelda(celdas[e.ty][e.tx]), 2, 0.3); }
      }
    }
    for (const l of enlaces) {
      if (l.abierto) continue;
      const e = empujableEn(l.placa[0], l.placa[1]);
      if (e && e.t >= 1) abrirReja(l);
    }
  }

  // --- Fénix ---
  function brillar() {
    const j = m.jugador;
    j.brillo = 1;
    chispas(j.x, j.y, j.z + 0.8, '#ffd36a', 16, 2.2);
    m.eventos.push({ tipo: 'brillo' });
    amb.brillo(j);
    for (const b of braseros) {
      if (b.encendido) continue;
      if (Math.hypot(b.x + 0.5 - j.x, b.y + 0.5 - j.y) < RADIO_BRILLO && Math.abs(j.z - b.zBase) < 1.5) {
        b.encendido = true;
        chispas(b.x + 0.5, b.y + 0.5, b.zBase + 0.6, '#ff9a3c', 22, 2.4);
        m.eventos.push({ tipo: 'brasero' });
      }
    }
  }

  // --- Eco ---
  function escuchar() {
    const j = m.jugador;
    for (const f of fuentes) {
      const cerca = f.activa && Math.hypot(f.x - j.x, f.y - j.y) < RADIO_OIDO;
      if (cerca && !f.oida && m.eco !== f.sonido) {
        m.eco = f.sonido;
        m.ondas.push({ x: j.x, y: j.y, z: j.z, color: sonidos[f.sonido].color, t: 0, dur: 0.6, alcance: 1.6 });
        m.eventos.push({ tipo: 'escucha', id: f.sonido });
      }
      f.oida = cerca;
    }
  }
  function repetir() {
    const j = m.jugador;
    if (!m.eco) {
      if (j.pistaCool <= 0) { j.pistaCool = 6; m.eventos.push({ tipo: 'pista', texto: 'Eco todavía no escuchó ningún sonido. Acercate a algo que suene.' }); }
      return;
    }
    if (j.ecoCool > 0) return;
    j.ecoCool = 0.8;
    m.ondas.push({ x: j.x, y: j.y, z: j.z, color: sonidos[m.eco].color, t: 0, dur: 0.9, alcance: ALCANCE_ECO });
    m.eventos.push({ tipo: 'eco', id: m.eco });
    const resp = amb.voz(j);
    if (resp.delfin) m.eventos.push({ tipo: 'ambiente', id: 'chasquido' });
    if (resp.gaviota) m.eventos.push({ tipo: 'ambiente', id: 'graznido' });
    if (resp.cabra) m.eventos.push({ tipo: 'ambiente', id: 'balido' });
    if (resp.golondrina) m.eventos.push({ tipo: 'ambiente', id: 'canto' });
    if (resp.abeja) m.eventos.push({ tipo: 'ambiente', id: 'zumbido' });
    for (const p of puertasSonido) {
      if (p.abierta || p.sonido !== m.eco) continue;
      if (Math.hypot(p.x + 0.5 - j.x, p.y + 0.5 - j.y) <= ALCANCE_ECO) {
        p.abierta = true; celdas[p.y][p.x] = '.';
        chispas(p.x + 0.5, p.y + 0.5, 0.8, sonidos[p.sonido].color, 24, 2.6);
        m.eventos.push({ tipo: 'puerta' });
      }
    }
  }
  function actualizarFuentes(dt) {
    const j = m.jugador;
    for (const f of fuentes) {
      // Golpear una fuente: un címbalo suena para siempre una vez que lo golpea quien corresponde
      if (!f.activa && f.modo === 'golpe' && j.estado === 'jugando') {
        const d = Math.hypot(f.x - j.x, f.y - j.y);
        const vuelaAhora = j.personaje === 'pegaso' || (j.personaje === 'fenix' && j.planeo && f.zBase <= VUELO_MAX_FENIX - 0.5);
        const golpe = f.golpea === 'volar' ? (vuelaAhora && d < 0.8 && Math.abs(j.z - f.zBase) < 1)
          : f.golpea === 'pegaso' ? (j.personaje === 'pegaso' && d < 0.8 && Math.abs(j.z - f.zBase) < 1)
          : f.golpea === 'minotauro' ? (j.personaje === 'minotauro' && !!j.embiste && d < 1.3) : false;
        if (golpe) {
          f.activa = true;
          chispas(f.x, f.y, f.zBase + 0.6, sonidos[f.sonido].color, 22, 2.6);
          m.eventos.push({ tipo: 'golpe', id: f.sonido });
        }
      }
      // Latido de las fuentes que suenan, para quien esté cerca (solo se oye; se ve siempre)
      if (f.activa) {
        const fase = Math.floor(m.t / 2.6);
        if (fase !== f.fase) { f.fase = fase; if (Math.hypot(f.x - j.x, f.y - j.y) < 7) m.eventos.push({ tipo: 'resuena', id: f.sonido }); }
      }
    }
  }
  function actualizarMecanismos(dt) {
    for (const s of soles) {
      if (s.abierto || !s.braseros.length || !s.braseros.every(b => b.encendido)) continue;
      s.abierto = true; celdas[s.abre[1]][s.abre[0]] = '.';
      chispas(s.abre[0] + 0.5, s.abre[1] + 0.5, 0.8, '#ffd36a', 26, 2.8);
      m.eventos.push({ tipo: 'sol' });
    }
    for (const s of sogas) if (s.prog < 1) s.prog = Math.min(1, s.prog + dt / 0.5);
    for (const o of m.ondas) o.t += dt;
    m.ondas = m.ondas.filter(o => o.t < o.dur);
    m.jugador.brillo = Math.max(0, m.jugador.brillo - dt / 0.9);
    m.jugador.ecoCool = Math.max(0, m.jugador.ecoCool - dt);
    actualizarFuentes(dt);
  }

  // --- Ariadna ---
  function tender() {
    const j = m.jugador;
    let mejor = null, dm = RADIO_ARGOLLA;
    for (const s of sogas) {
      if (s.tendida) continue;
      for (const [p, h] of [[s.a, s.ha], [s.b, s.hb]]) {
        const d = Math.hypot(p[0] + 0.5 - j.x, p[1] + 0.5 - j.y);
        if (d < dm && Math.abs(j.z - h) < 1) { dm = d; mejor = s; }
      }
    }
    if (!mejor) {
      if (j.pistaCool <= 0) { j.pistaCool = 6; m.eventos.push({ tipo: 'pista', texto: 'Ariadna tiende la soga parada junto a una argolla de bronce.' }); }
      return;
    }
    // La soga se puede pisar desde ya; el desenrollo es solo visual y parte de la argolla más cercana a Ariadna
    const da = Math.hypot(mejor.a[0] + 0.5 - j.x, mejor.a[1] + 0.5 - j.y), db = Math.hypot(mejor.b[0] + 0.5 - j.x, mejor.b[1] + 0.5 - j.y);
    mejor.desde = da <= db ? 0 : 1; mejor.prog = 0;
    tenderEn(mejor);
    for (const c of mejor.casillas) chispas(c.x + 0.5, c.y + 0.5, c.h + 0.4, '#b5482e', 6, 1.6);
    amb.hilo(j);
    m.eventos.push({ tipo: 'soga' });
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
    e.ox = e.tx; e.oy = e.ty; e.tx = tx; e.ty = ty; e.t = 0; e.pasoPolvo = -1; m.jugador.esfuerzo = 0.45;
    chispas(e.ox + 0.5, e.oy + 0.5, 0.1, '#cbb994', 5, 1.2);
    m.eventos.push({ tipo: 'empuje' });
    return true;
  }

  function iniciarCaida() {
    const j = m.jugador;
    j.estado = 'cayendo'; j.estadoT = 0; j.embiste = null;
  }

  function reaparecer() {
    const j = m.jugador;
    let s = j.seguro;
    if (empujableEn(Math.floor(s.x), Math.floor(s.y))) s = { x: arranque[0], y: arranque[1], z: 0 };
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
    actualizarMecanismos(dt);
    actualizarParticulas(dt);
    actualizarSenales(dt);
    amb.actualizar(dt, m.t, j);
    j.esfuerzo = Math.max(0, j.esfuerzo - dt);

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
      if (celdas[ty] && celdas[ty][tx] === 'M' && j.z - suelo(j.x, j.y) < 0.5) romperMuro(tx, ty);
      j.senalT -= dt;
      if (j.senalT <= 0) { j.senalT = 0.06; polvo(j.x - em.dx * 0.3, j.y - em.dy * 0.3 + 0.05, j.z, 1); }
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
    if (intento && j.personaje === 'minotauro') j.esfuerzo = 0.3;
    if (intento && intento.e === j.empuje.e) j.empuje.t += dt;
    else { j.empuje.e = intento ? intento.e : null; j.empuje.t = 0; }
    if (intento && j.personaje === 'minotauro' && j.empuje.t > EMPUJE_ESPERA) {
      intentarEmpuje(intento.e, intento.dx, intento.dy);
      j.empuje.t = 0;
    } else if (intento && j.personaje !== 'minotauro' && j.empuje.t > 0.4 && j.pistaCool <= 0) {
      j.pistaCool = 8;
      m.eventos.push({ tipo: 'pista', texto: 'Pesa muchísimo. Quizás alguien más fuerte pueda moverlo.' });
    }

    // Poderes de toque: Fénix (tocar brilla, mantener vuela), Eco (repetir) y Ariadna (tender)
    if (control && j.personaje === 'fenix') {
      if (poderPulsado) { j.tap = true; j.poderT = 0; }
      if (entrada.poderMantenido) { j.poderT += dt; if (j.poderT > TAP_MAX) j.tap = false; }
      else { if (j.tap) brillar(); j.tap = false; j.poderT = 0; }
    } else { j.tap = false; j.poderT = 0; }
    if (control && j.personaje === 'eco') { escuchar(); if (poderPulsado) repetir(); }
    if (control && j.personaje === 'ariadna' && poderPulsado) tender();

    // Vertical: salto, vuelo, caída
    const vuela = control && entrada.poderMantenido &&
      (j.personaje === 'pegaso' || (j.personaje === 'fenix' && j.poderT > TAP_MAX));
    const g0 = suelo(j.x, j.y);
    if (j.enSuelo) {
      if (g0 < j.z - 0.02) { j.enSuelo = false; j.coyote = COYOTE; }
      else j.z = g0;
    }
    if (j.buffer > 0 && (j.enSuelo || j.coyote > 0) && !vuela) {
      j.vz = SALTO; j.enSuelo = false; j.coyote = 0; j.buffer = 0;
    }
    if (vuela) {
      if (!j.planeo && j.enSuelo) senal('rafaga', j.x, j.y, j.z, 0.45, { fx: j.fx || 1 });   // despegue desde el piso
      j.enSuelo = false; j.planeo = true;
      if (j.personaje === 'fenix') {
        j.senalT -= dt;
        if (j.senalT <= 0) { j.senalT = 0.14; senal('brasa', j.x + (Math.random() - 0.5) * 0.3, j.y + 0.05, j.z + 0.35, 0.7 + Math.random() * 0.3, { vx: (Math.random() - 0.5) * 0.6, oxido: Math.random() < 0.5 }); }
      }
      j.vz = Math.min(VUELO_VEL, j.vz + VUELO_ACEL * dt);
    }
    if (!j.enSuelo) {
      if (!vuela) j.vz -= GRAVEDAD * dt;
      if (j.planeo && !vuela) j.vz = Math.max(j.vz, -PLANEO_CAIDA);
      j.z += j.vz * dt;
      const tope = j.personaje === 'fenix' ? VUELO_MAX_FENIX : VUELO_MAX;
      if (vuela && j.z >= tope) { j.z = tope; j.vz = Math.min(j.vz, 0); }
      const g = suelo(j.x, j.y);
      if (j.vz <= 0 && j.z <= g && g > ABISMO) {
        if ((j.vz < -2.5 || j.planeo) && j.estado === 'jugando') polvo(j.x, j.y + 0.05, g, 4, 0.35);   // aterriza en piso firme
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
