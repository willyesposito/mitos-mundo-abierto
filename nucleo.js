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
    nombre, objetos: {}, mundos: {}, personaje: 'pegaso', vistoCambio: false, mapa: 'mundo', llegada: null, eco: null, mundoUnido: true,
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
    const t = trasladarEstado(viejos[z.id], z.dx, z.dy);
    for (const [clave, v] of Object.entries(t)) {
      if (Array.isArray(v)) unido[clave] = [...new Set([...(unido[clave] || []), ...v])];
      else if (v && typeof v === 'object') unido[clave] = { ...(unido[clave] || {}), ...v };
      else if (clave === 'eco') unido.eco = unido.eco || v;
    }
  }
  const zona = zonas.find(z => z.id === perfil.mapa);
  if (zona) perfil.llegada = perfil.llegada ? [perfil.llegada[0] + zona.dx, perfil.llegada[1] + zona.dy] : [...zona.inicio];
  perfil.mapa = 'mundo';
  perfil.mundos = { ...viejos, mundo: unido };
  perfil.mundoUnido = true;
  guardar();
  return true;
}
