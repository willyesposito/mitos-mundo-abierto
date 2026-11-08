// Ambiente sin colisiones ni guardado. Las posiciones se filtran para respetar cada acertijo.
const grupos = [
  ['redes', 9, 89.4], ['anforas', 14.5, 89.8], ['anforas', 5.2, 82.5],
  ['gaviota', 9.1, 89.3], ['gaviota', 14.8, 89.1], ['gaviota', 17.7, 91.4],
  ['pulpo', 18.2, 94], ['delfin', 5.6, 94], ['delfin', 17.5, 96],
  ['olivo', 3.3, 67.8], ['lirios', 4.5, 68.6], ['gato', 6.1, 68.8],
  ['laurel', 2.1, 69], ['anforas', 4.1, 69.8],
  ['olivo', 19.8, 68.5], ['lirios', 20.8, 69.1], ['cabra', 18.8, 70.1],
  ['laurel', 21.8, 67.7], ['lirios', 21.5, 52.8],
  ['anforas', 2.2, 53.6], ['lirios', 3.5, 54.1], ['gato', 4.4, 53.8],
  ['olivo', 18.4, 52], ['lirios', 19.5, 52.2], ['gaviota', 18.8, 50.4],
  ['laurel', 2.8, 37], ['laurel', 20.3, 37], ['anforas', 20.5, 35.7],
  ['laurel', 2.5, 25.4], ['fresco', 3.7, 25.2], ['golondrina', 4.6, 24.2],
  ['laurel', 20.3, 23.2], ['cabra', 18.7, 21.6], ['lirios', 20.5, 21.7],
  ['fresco', 4.2, 11.8], ['laurel', 2.6, 11.8], ['golondrina', 3.9, 10.8],
  ['laurel', 9.6, 3.8], ['lirios', 10.4, 4.1], ['golondrina', 9.4, 2.8],
];
export const TIPOS_AMBIENTE = [...new Set(grupos.map(g => g[0]))];
const agua = new Set(['delfin', 'pulpo']);
const aves = new Set(['gaviota', 'golondrina']);
const vivos = new Set(['gato', 'cabra', 'gaviota', 'golondrina', 'delfin', 'pulpo', 'lirios']);
const estados = new WeakMap();

export function crearAmbiente(m) {
  if (m.id !== 'mundo') return [];
  const cerca = (x, y, a, b, r) => Math.hypot(x - a, y - b) < r;
  const especiales = [...m.coleccionables.map(c => [c.x, c.y]), ...m.braseros.map(c => [c.x + .5, c.y + .5]), ...m.fuentes.map(c => [c.x, c.y]), ...(m.interactivos || []).map(c => [c.x, c.y])];
  const puerto = m.zonas?.find(z => z.id === 'puerto');
  const desplazamiento = puerto ? puerto.desde - 74 : 0;
  return grupos.map(([tipo, x, y]) => [tipo, x, y >= 74 ? y + desplazamiento : y]).filter(([tipo, x, y]) => {
    const celda = m.origen[Math.floor(y)]?.[Math.floor(x)];
    if (agua.has(tipo)) return celda === '~';
    if (celda !== '.') return false;
    // Un anillo libre alrededor de placas, empujables y puertas, incluso después de resolverlos.
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const c = m.origen[Math.floor(y) + dy]?.[Math.floor(x) + dx];
      if (',pMDOG'.includes(c || '!')) return false;
    }
    if (especiales.some(([a, b]) => cerca(x, y, a, b, 1.65))) return false;
    if (m.sogas.some(s => {
      const minX = Math.min(s.a[0], s.b[0]) - 1.2, maxX = Math.max(s.a[0], s.b[0]) + 1.7;
      const minY = Math.min(s.a[1], s.b[1]) - 1.2, maxY = Math.max(s.a[1], s.b[1]) + 1.7;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    })) return false;
    return true;
  }).map(([tipo, x, y], i) => ({ tipo, x, y, z: agua.has(tipo) ? -.12 : 0, fase: i * 1.93, reaccion: 0, llamado: 0, poderActivo: false }));
}

export function ambienteDe(m) {
  if (!estados.has(m)) estados.set(m, { elementos: crearAmbiente(m), ultimo: m.t });
  return estados.get(m);
}

const RADIO_LLAMADO = 1.7, DURACION_LLAMADO = 1.5;

// Llamado (D35): el botón de poder también llama al animal vivo más cercano. Solo marca el gesto;
// no toca la física ni el guardado. Un animal no se vuelve a llamar mientras dura su gesto.
export function llamarAmbiente(m) {
  const j = m.jugador;
  let mejor = null, dist = RADIO_LLAMADO;
  for (const e of ambienteDe(m).elementos) {
    if (!vivos.has(e.tipo) || e.llamado > 0) continue;
    const d = Math.hypot(j.x - e.x, j.y - e.y);
    if (d < dist) { dist = d; mejor = e; }
  }
  if (mejor) mejor.llamado = 1;
  return mejor;
}

export function actualizarAmbiente(m, reducir) {
  const estado = ambienteDe(m), dt = Math.max(0, Math.min(.1, m.t - estado.ultimo));
  estado.ultimo = m.t;
  for (const e of estado.elementos) {
    e.llamado = Math.max(0, e.llamado - dt / DURACION_LLAMADO);
    const j = m.jugador, cerca = Math.hypot(j.x - e.x, j.y - e.y) < 1.7;
    const poder = (j.personaje === 'eco' && m.ondas?.length > 0 && (aves.has(e.tipo)||['cabra','delfin'].includes(e.tipo)))
      || (j.personaje === 'fenix' && j.brillo > 0 && ['lirios','pulpo'].includes(e.tipo))
      || (j.personaje === 'minotauro' && (j.embiste || j.esfuerzo > 0) && ['gato','cabra'].includes(e.tipo))
      || (j.personaje === 'ariadna' && m.sogas.some(s => s.prog < 1) && e.tipo === 'gato')
      || (j.personaje === 'pegaso' && j.planeo && (aves.has(e.tipo)||e.tipo==='delfin'));
    e.poderActivo = !!poder;
    const objetivo = !reducir && cerca && vivos.has(e.tipo) ? (poder ? 1 : .45) : 0;
    e.reaccion += (objetivo - e.reaccion) * Math.min(1, dt * 4);
  }
  return estado.elementos;
}

// Gesto del llamado: sube y baja una vez en ~1,5 s. Si el poder ya hace reaccionar al animal, esa reacción manda.
function gestoLlamado(e, t) {
  const s = Math.sin((1 - e.llamado) * Math.PI), z = { dx: 0, dy: 0, giro: 0, escala: 1 };
  switch (e.tipo) {
    case 'gato': z.escala = 1 + s * .14; z.giro = s * .12; z.dx = s * 2; break;
    case 'cabra': z.dy = -s * 14; break;
    case 'gaviota': z.dy = -s * 10; z.escala = 1 + s * .12; z.giro = Math.sin(t * 22) * s * .08; break;
    case 'golondrina': z.dx = Math.sin(t * 18) * s * 4; z.dy = -s * 9; z.giro = Math.sin(t * 26) * s * .12; break;
    case 'delfin': z.dy = -s * 22; z.giro = -s * .3; break;
    case 'pulpo': z.dy = -s * 8; z.escala = 1 + s * .1; break;
    case 'lirios': z.escala = 1 + s * .18; break;
  }
  return z;
}

export function movimientoAmbiente(e, t, reducir) {
  const g = e.llamado > 0 && !e.poderActivo ? gestoLlamado(e, t) : null;
  if (reducir) {
    // Con movimiento reducido el gesto se atenúa (el sonido suena igual)
    return g ? { dx: g.dx * .25, dy: g.dy * .25, giro: g.giro * .25, escala: 1 + (g.escala - 1) * .25 } : { dx: 0, dy: 0, giro: 0, escala: 1 };
  }
  const b = movimientoBase(e, t);
  return g ? { dx: b.dx + g.dx, dy: b.dy + g.dy, giro: b.giro + g.giro, escala: b.escala * g.escala } : b;
}

function movimientoBase(e, t) {
  const fase = t + e.fase, r = e.reaccion;
  if (aves.has(e.tipo)) return { dx: Math.sin(fase * 1.3) * r * 12, dy: -r * (12 + 5 * Math.sin(fase * 2)), giro: Math.sin(fase * 2) * .04, escala: 1 };
  if (e.tipo === 'delfin') return { dx: Math.sin(fase * .8) * 7, dy: -Math.max(0, Math.sin(fase * .8)) * 8, giro: Math.sin(fase * .8) * .15, escala: 1 };
  if (e.tipo === 'gato' || e.tipo === 'cabra') return { dx: Math.sin(fase * 1.5) * r * 5, dy: -Math.abs(Math.sin(fase * 2)) * r * 2, giro: Math.sin(fase) * r * .06, escala: 1 };
  if (e.tipo === 'pulpo') return { dx: 0, dy: r * 5, giro: 0, escala: 1 - r * .15 };
  const vegetal = ['olivo', 'laurel', 'lirios'].includes(e.tipo);
  return { dx: 0, dy: 0, giro: vegetal ? Math.sin(fase * .85) * .018 : 0, escala: 1 + (e.tipo === 'lirios' ? r * .08 : 0) };
}
