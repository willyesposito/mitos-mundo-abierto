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
  objeto:   f('<path d="M12 3l7 9-7 9-7-9z" fill="currentColor" fill-opacity=".25"/>'),
};
