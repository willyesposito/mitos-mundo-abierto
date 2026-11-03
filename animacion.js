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
  // Reserva el espacio del HUD y los controles antes de elegir cuanto mundo entra.
  const columnas = vertical ? (W >= 600 ? 12 : 9) : 20;
  const filas = vertical ? 10 : (H <= 520 ? 6 : 13);
  const esc = Math.max(0.32, Math.min(1.65, W / (columnas * TW), alto / (filas * TH)));
  return { esc, focoY: superior + alto * (vertical ? 0.57 : 0.53) };
}
