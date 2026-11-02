// Presentación pura: no modifica física, entradas ni progreso.
export function posePersonaje(id, o, reducir = false) {
  const vertical = Math.abs(o.fy || 0) > Math.abs(o.fx || 0);
  const vista = vertical ? ((o.fy || 0) < 0 ? 'espalda' : 'frente') : 'costado';
  let nombre = id + (vista === 'costado' ? (['ariadna', 'eco', 'minotauro'].includes(id) ? '-costado' : '') : '-' + vista);
  if (o.volando && vista !== 'costado' && ['pegaso', 'fenix'].includes(id)) nombre += '-vuelo';
  else if (o.caminando && !reducir) {
    // Los cuadros siguen la distancia recorrida: al soltar el control los pies se detienen.
    const paso = Math.sin((o.paso || 0) * 5) >= 0 ? 1 : 2;
    nombre = id + (vista === 'costado' ? '' : '-' + vista) + '-paso-' + paso;
  }
  return { nombre, vista, espejo: vista === 'costado' && (o.fx || 0) < 0 };
}

export function encuadre(W, H, inferior, superior, TW, TH) {
  const alto = Math.max(120, H - inferior - superior);
  const vertical = H > W;
  // En vertical se ven nueve casillas de ancho y nueve de fondo; antes el alto reducía demasiado al personaje.
  const esc = Math.max(0.32, Math.min(W / ((vertical ? 9 : 17) * TW), alto / ((vertical ? 9 : 12) * TH)));
  return { esc, focoY: superior + alto * (vertical ? 0.57 : 0.53) };
}
