// Íconos de interfaz (trazo simple, un solo color heredado con currentColor).
const f = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICONOS = {
  saltar:   f('<path d="M12 19V6"/><path d="M6 11l6-6 6 6"/>'),
  volar:    f('<path d="M3 16c5 1 8-2 9-9 1 7 4 10 9 9-3 4-9 5-18 0z" fill="currentColor" fill-opacity=".25"/>'),
  embestir: f('<path d="M4 12h13"/><path d="M13 6l6 6-6 6"/><path d="M4 7h5"/><path d="M4 17h5"/>'),
  hilo:     f('<path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/><path d="M12 12a3 3 0 1 1 3 3 6 6 0 1 1-6-6"/>'),
  luz:      f('<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z" fill="currentColor" fill-opacity=".25"/>'),
  voz:      f('<path d="M8 8a6 6 0 0 1 0 8"/><path d="M12 5a10 10 0 0 1 0 14"/><path d="M16 2a14 14 0 0 1 0 20"/>'),
  menu:     f('<path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/>'),
  espiral:  f('<path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6"/>'),
  info:     f('<path d="M12 11v6"/><path d="M12 7.2v.1"/><circle cx="12" cy="12" r="9"/>'),
  objeto:   f('<path d="M12 3l7 9-7 9-7-9z" fill="currentColor" fill-opacity=".25"/>'),
};

// Símbolos de los sonidos (se pintan con el color del sonido).
export function simboloSvg(id, color) {
  const formas = {
    circulo: '<circle cx="12" cy="12" r="8"/>',
    triangulo: '<path d="M12 3.5 21 19H3z"/>',
    cuadrado: '<rect x="4.5" y="4.5" width="15" height="15"/>',
    rombo: '<path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${color}" stroke="#2a2230" stroke-width="2" stroke-linejoin="round">${formas[id] || formas.rombo}</svg>`;
}
