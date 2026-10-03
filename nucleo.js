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
    nombre, objetos: {}, personaje: 'pegaso', vistoCambio: false,
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

export function actualizarPerfil(perfil, cambios) {
  Object.assign(perfil, cambios);
  guardar();
}
