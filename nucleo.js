// Guardado local con varios perfiles. Clave propia: no comparte nada con Mundo de Mitos.
const CLAVE = 'mitos-mundo-abierto-v1';
export const MAX_PERFILES = 5;

let datos = leer();

function leer() {
  try {
    const t = localStorage.getItem(CLAVE);
    if (t) {
      const d = JSON.parse(t);
      if (d && Array.isArray(d.perfiles)) return d;
    }
  } catch (e) { /* sin almacenamiento: se juega igual, sin guardar */ }
  return { version: 1, perfiles: [] };
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* idem */ }
}

export function listarPerfiles() { return datos.perfiles; }

export function crearPerfil(nombre) {
  nombre = (nombre || '').trim().slice(0, 14);
  if (!nombre || datos.perfiles.length >= MAX_PERFILES) return null;
  const p = {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    nombre, objetos: {}, mundos: {}, personaje: 'pegaso', vistoCambio: false, mapa: 'mundo', llegada: null, eco: null, mundoUnido: true, canalIncorporado: true, fichaUlisesPresentada: true,
  };
  datos.perfiles.push(p);
  guardar();
  return p;
}

export function borrarPerfil(id) {
  datos.perfiles = datos.perfiles.filter(p => p.id !== id);
  guardar();
}

export function registrarObjeto(perfil, id) {
  if (perfil.objetos[id]) return false;
  perfil.objetos[id] = true;   // un objeto encontrado queda para siempre
  guardar();
  return true;
}

// Estado de un mapa (muros rotos, rejas abiertas, objetos movidos), por perfil y por mapa.
export function guardarMundo(perfil, mapaId, estado) {
  if (!perfil.mundos) perfil.mundos = {};
  perfil.mundos[mapaId] = estado;
  guardar();
}

export function actualizarPerfil(perfil, cambios) {
  Object.assign(perfil, cambios);
  guardar();
}

// Puerto, plaza y palacio eran tres mapas; ahora son un solo mapa continuo (`mundo`). Esto traslada el
// progreso ya guardado de cada mapa viejo al mundo unido, con el desplazamiento de su zona (`zonas` del
// mapa del mundo: id, dx, dy, inicio). Corre una sola vez por perfil y no borra las claves viejas.
const ES_CASILLA = /^-?\d+,-?\d+$/;
function trasladarEstado(estado, dx, dy) {
  const casilla = k => { const [x, y] = k.split(',').map(Number); return (x + dx) + ',' + (y + dy); };
  const sal = {};
  for (const [clave, v] of Object.entries(estado || {})) {
    if (Array.isArray(v)) sal[clave] = v.map(k => (typeof k === 'string' && ES_CASILLA.test(k)) ? casilla(k) : k);
    else if (v && typeof v === 'object') {
      sal[clave] = {};
      for (const [k, p] of Object.entries(v)) {
        const nk = ES_CASILLA.test(k) ? casilla(k) : k;
        sal[clave][nk] = Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) ? [p[0] + dx, p[1] + dy] : p;
      }
    } else if (clave === 'eco') sal.eco = v;
  }
  return sal;
}
export function migrarAlMundo(perfil, zonas) {
  if (perfil.mundoUnido) return false;
  const viejos = perfil.mundos || {};
  const unido = { ...(viejos.mundo || {}) };
  for (const z of zonas) {
    const t = trasladarEstado(viejos[z.id], z.dx, z.dyAnterior ?? z.dy);
    for (const [clave, v] of Object.entries(t)) {
      if (Array.isArray(v)) unido[clave] = [...new Set([...(unido[clave] || []), ...v])];
      else if (v && typeof v === 'object') unido[clave] = { ...(unido[clave] || {}), ...v };
      else if (clave === 'eco') unido.eco = unido.eco || v;
    }
  }
  const zona = zonas.find(z => z.id === perfil.mapa);
  if (zona) perfil.llegada = perfil.llegada ? [perfil.llegada[0] + zona.dx, perfil.llegada[1] + (zona.dyAnterior ?? zona.dy)] : [...(zona.inicioAnterior || zona.inicio)];
  perfil.mapa = 'mundo';
  perfil.mundos = { ...viejos, mundo: unido };
  perfil.mundoUnido = true;
  guardar();
  return true;
}

// U2 desplaza solo las coordenadas que pertenecían al puerto del mundo unido.
// Primero debe correr migrarAlMundo con los desplazamientos originales (dyAnterior).
export function migrarAlCanal(perfil, mapa) {
  if (perfil.canalIncorporado || !mapa.migracionCanal) return false;
  const { desde, hasta, desplazamiento } = mapa.migracionCanal;
  const esPuerto = y => Number.isFinite(y) && y >= desde && y < hasta + 1;
  const casilla = k => {
    if (typeof k !== 'string' || !ES_CASILLA.test(k)) return k;
    const [x, y] = k.split(',').map(Number);
    return esPuerto(y) ? x + ',' + (y + desplazamiento) : k;
  };
  const posicion = v => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) && esPuerto(v[1]) ? [v[0], v[1] + desplazamiento] : v;
  const previo = perfil.mundos?.mundo;
  if (previo) {
    const estado = { ...previo };
    for (const k of ['muros', 'rejas', 'braseros', 'soles', 'fuentes', 'puertas', 'sogas'])
      if (Array.isArray(previo[k])) estado[k] = previo[k].map(casilla);
    for (const k of ['empujables', 'barcas'])
      if (previo[k] && typeof previo[k] === 'object' && !Array.isArray(previo[k]))
        estado[k] = Object.fromEntries(Object.entries(previo[k]).map(([origen, pos]) => [casilla(origen), posicion(pos)]));
    perfil.mundos = { ...perfil.mundos, mundo: estado };
  }
  perfil.llegada = posicion(perfil.llegada);
  // El paso viejo se convierte en agua: reaparecer en su muelle contiguo, nunca en un bucle de caída.
  if (Array.isArray(perfil.llegada)) {
    const [x, y] = perfil.llegada, tx = Math.floor(x), ty = Math.floor(y);
    if (mapa.filas[ty]?.[tx] === '~' && tx >= 10 && tx <= 12) {
      if (ty === desde - 1) perfil.llegada = [x, desde - 1.5];
      if (ty === desde + desplazamiento) perfil.llegada = [x, desde + desplazamiento + 1.5];
    }
  }
  perfil.canalIncorporado = true;
  guardar();
  return true;
}
