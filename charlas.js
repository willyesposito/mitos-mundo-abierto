// Motor de charlas: árboles de diálogo con elecciones. Lógica pura, sin DOM y sin guardado.
// Una charla es un dato (datos/charlas/<id>.json, listadas en datos/charlas/indice.json). La sesión recorre sus nodos y
// avisa qué se aprendió (`da`) y qué efectos se alcanzaron; quien la usa se ocupa de guardarlos.
//  - nodo: { texto, opciones, da?, requiere?, efecto? }   opción: { texto, va?, requiere?, sinSaber? }
//  - `requiere` / `sinSaber`: { saber: "x" } (también vale una lista de saberes). Una opción sin `va` termina la charla.
//  - Un nodo con `requiere` sin cumplir esconde las opciones que llevan a él.
//  - En repaso (charla ya resuelta) `sinSaber` no se aplica: se pueden volver a escuchar las respuestas.

const lista = c => c == null ? [] : Array.isArray(c) ? c : c.saberes ? c.saberes : c.saber ? [c.saber] : [];

export function opcionesVisibles(charla, nodo, saberes, repaso = false) {
  const tiene = id => saberes.has(id);
  return (nodo?.opciones || []).filter(o => {
    if (!lista(o.requiere).every(tiene)) return false;
    if (!repaso && lista(o.sinSaber).some(tiene)) return false;
    const destino = o.va && charla.nodos[o.va];
    return !destino || lista(destino.requiere).every(tiene);
  });
}

export function nombreDe(charla) {
  const n = charla.interlocutor || charla.id || '';
  return n.charAt(0).toUpperCase() + n.slice(1);
}

export function tieneEfectos(charla) {
  return Object.values(charla.nodos).some(n => n.efecto);
}

// `saberes` es un objeto id -> true (como lo guarda el perfil); `resuelta` dice si ya se llegó al final de verdad.
export function crearSesion(charla, { saberes = {}, resuelta = false } = {}) {
  const tengo = new Set(Object.keys(saberes).filter(k => saberes[k]));
  let id = charla.inicio, terminada = false;
  const llegada = n => { for (const s of n.da || []) tengo.add(s); return { da: n.da || [], efecto: n.efecto || null, fin: false }; };
  const sesion = {
    charla, nombre: nombreDe(charla),
    get nodoId() { return id; },
    get terminada() { return terminada; },
    get nodo() { return charla.nodos[id]; },
    opciones() { return opcionesVisibles(charla, charla.nodos[id], tengo, resuelta); },
    // Lo aprendido y el efecto del nodo de arranque
    inicial: null,
    // Elige la opción `i` de las visibles. Devuelve lo aprendido, el efecto del nodo al que se llegó (si tiene) y si terminó.
    elegir(i) {
      const o = sesion.opciones()[i];
      if (!o || terminada) return { da: [], efecto: null, fin: terminada };
      if (!o.va || !charla.nodos[o.va]) { terminada = true; return { da: [], efecto: null, fin: true }; }
      id = o.va;
      return llegada(charla.nodos[id]);
    },
    // Salir desde un nodo sin nada que elegir
    seguir() { terminada = true; return { da: [], efecto: null, fin: true }; },
  };
  sesion.inicial = llegada(charla.nodos[id]);
  return sesion;
}

// Revisa que la charla esté bien armada: devuelve la lista de problemas (vacía si está bien).
export function validarCharla(charla) {
  const problemas = [];
  if (!charla.id || !charla.interlocutor || !charla.nodos) return ['faltan id, interlocutor o nodos'];
  if (!charla.nodos[charla.inicio]) problemas.push('el nodo de inicio no existe');
  for (const [nid, n] of Object.entries(charla.nodos)) {
    if (typeof n.texto !== 'string' || !n.texto) problemas.push(`${nid}: sin texto`);
    for (const o of n.opciones || []) {
      if (!o.texto) problemas.push(`${nid}: opción sin texto`);
      if (o.va && !charla.nodos[o.va]) problemas.push(`${nid}: destino ${o.va} no existe`);
    }
  }
  return problemas;
}
