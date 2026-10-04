// Íconos de interfaz: relleno en tres tonos por material (luz, base, sombra) y contorno tinta.
const S = body => `<svg viewBox="0 0 24 24" stroke="#3b2b1d" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${body}</svg>`;

const roseta = (() => {
  let pet = '';
  for (let a = 0; a < 360; a += 45) {
    pet += `<path transform="rotate(${a} 12 12)" d="M12 11C10.2 8.6 10.4 4.6 12 2.6c1.6 2 1.8 6 0 8.4z" fill="#e6b866"/><path transform="rotate(${a} 12 12)" d="M12 10.4c-.9-1.9-.8-4.8 0-6.4" fill="none" stroke="#fff3c8" stroke-width="1.1"/>`;
  }
  return S(pet + '<circle cx="12" cy="12" r="3.4" fill="#d9a441"/><path d="M10.4 11.2a1.8 1.8 0 012-1.4" fill="none" stroke="#fff3c8" stroke-width="1.2"/>');
})();

const ala = '<path d="M11.4 16C9.5 10 5.5 6.4 1.5 5.5c.4 2.2 1.3 3.8 2.5 5-1 .2-1.8.1-2.6-.1.9 2 2.3 3.3 4 4-.8.3-1.6.4-2.4.3 1.9 1.9 5 2.6 8.4 1.3z" fill="#fff3c8"/><path d="M10.2 14.6c-1.3-3.3-3.4-5.7-6-7.2M8.8 15.6c-1.6-1.6-3.4-2.6-5.4-3" fill="none" stroke="#e6b866" stroke-width="1.2"/>';
const voz = S('<path d="M3 9.5h3l4-3.5v12l-4-3.5H3z" fill="#fff3c8"/><path d="M14 9a4.5 4.5 0 010 6" fill="none" stroke="#fff3c8" stroke-width="2.2"/><path d="M17 6.2a8.5 8.5 0 010 11.6" fill="none" stroke="#fff3c8" stroke-width="2.2" opacity="0.75"/><path d="M20 3.5a12.5 12.5 0 010 17" fill="none" stroke="#fff3c8" stroke-width="2.2" opacity="0.5"/>');
const llama = S('<path d="M12 21.5c-4.2 0-6.5-3-6.5-6.4 0-3.4 2.6-5.3 3.4-8.6 1.3 1.4 1.8 2.8 1.7 4.3 1.6-1.6 2.4-4 1.9-7.3 3.4 2.4 6 6.4 6 11.2 0 4-2.8 6.8-6.5 6.8z" fill="#e8892a"/><path d="M12 21.5c-1.9 0-3-1.4-3-3 0-1.9 1.6-3 2.2-4.8 1 1 1.6 2 1.6 3 .8-.6 1.3-1.4 1.4-2.5 1 1 1.8 2.4 1.8 4 0 1.9-1.6 3.3-4 3.3z" fill="#fff3c8"/>');
const cuernos = S('<path d="M8 15c-4-1-6-5-5-10 1.5 3 3.5 4.5 6.5 5M16 15c4-1 6-5 5-10-1.5 3-3.5 4.5-6.5 5" fill="#f4ecd8"/><path d="M7.5 11h9v4a4.5 4.5 0 01-9 0z" fill="#8a5a3c"/>');
const ovillo = S('<circle cx="11" cy="12" r="6.5" fill="#d9a441"/><path d="M6 9.5c3 1 7 1 10 0M5 13c3.5 1.5 8 1.5 12 0M8 17c2-3 3-7 2.5-11.3M13.5 18c.5-4 0-8.5-1.5-12" fill="none" stroke="#8f3a24" stroke-width="1"/><path d="M17.5 12c2 1 3.5 3 3.5 6" fill="none"/>');
const chev = (izq, fill) => S(`<path d="${izq ? 'M15.5 3.5L7 12l8.5 8.5 2.5-2.5-6-6 6-6z' : 'M8.5 3.5L17 12l-8.5 8.5L6 18l6-6-6-6z'}" fill="${fill}"/>`);

export const ICONOS = {
  saltar:   S('<ellipse cx="12" cy="21" rx="5.5" ry="1.6" fill="#3b2b1d" opacity="0.28" stroke="none"/><path d="M12 3l7 7.5h-4.2V17H9.2v-6.5H5z" fill="#f4ecd8"/><path d="M9.2 14h5.6v3H9.2z" fill="#cbb994"/>'),
  volar:    S(ala + `<g transform="translate(24 0) scale(-1 1)">${ala}</g><ellipse cx="12" cy="16.2" rx="1.6" ry="2.8" fill="#e6b866"/>`),
  embestir: S('<path d="M2 8h5M1 12h6M2 16h5" fill="none" stroke="#cbb994" stroke-width="1.8"/><path d="M11 15c-3-1-4.5-4.5-3.5-9 1 2.5 2.5 3.8 5 4.200M19 15c3-1 4.5-4.5 3.5-9-1 2.5-2.5 3.8-5 4.2" fill="#f4ecd8" transform="translate(-1 0)"/><path d="M9.5 11h9v4a4.5 4.5 0 01-9 0z" fill="#8a5a3c" transform="translate(-1 0)"/>'),
  hilo:     S('<circle cx="10.5" cy="11" r="7" fill="#d9a441"/><path d="M5 8.500c3 1.2 7.5 1.2 11 0M4 12c3.5 1.8 9 1.8 13 0M7 16.500c2.2-3 3.2-7 2.7-11M13 17.500c.6-4 .1-8.5-1.5-12" fill="none" stroke="#8f3a24" stroke-width="1"/><path d="M15 17c3 1.5 5 3 7 3.5" fill="none" stroke="#b5482e" stroke-width="2"/>'),
  luz:      llama,
  voz:      voz,
  menu:     S([4, 10.4, 15.8].map(y => `<rect x="4" y="${y}" width="16" height="3.2" rx="1.6" fill="#b5482e"/>`).join('')),
  ficha:    S('<path d="M6 4h11a2 2 0 012 2v12H8a2 2 0 01-2-2z" fill="#f4ecd8"/><path d="M6 16a2 2 0 002 2h11v2H8a4 4 0 01-4-4V6a2 2 0 012-2z" fill="#cbb994"/><path d="M9.5 8h6M9.5 11h6M9.5 14h4" fill="none" stroke="#b5482e" stroke-width="1.6"/>'),
  cerrar:   S('<path d="M7 4.500L12 9.500l5-5L19.5 7l-5 5 5 5-2.5 2.5-5-5-5 5L4.5 17l5-5-5-5z" fill="#f4ecd8"/>'),
  anterior: chev(true, '#b5482e'),
  siguiente: chev(false, '#f4ecd8'),
  flecha:   S('<path d="M12 21.500l-7.5-8.500h4.600V2.500h5.800V13h4.600z" fill="#fff3c8"/><path d="M9.1 13V2.500h2.200V13z" fill="#ffffff" stroke="none" opacity="0.6"/>'),
  objeto:   roseta,
  zona:     roseta,
  rasgo_pegaso: S('<path d="M12 15C10 9.5 6 6.5 2 6c.5 3 2 5.5 4.5 7-1 .4-2 .5-3 .3 2 2.2 5.5 3 8.5 1.700zM12 15c2-5.5 6-8.5 10-9-.5 3-2 5.5-4.5 7 1 .4 2 .5 3 .3-2 2.2-5.5 3-8.5 1.700z" fill="#f4ecd8"/>'),
  rasgo_minotauro: cuernos,
  rasgo_ariadna: ovillo,
  rasgo_fenix: llama,
  rasgo_eco: S('<circle cx="6" cy="12" r="2.6" fill="#1f6f9c"/><path d="M10.5 8a5.5 5.5 0 010 8M14.5 5a10 10 0 010 14M18.5 2.500a14 14 0 010 19" fill="none" stroke="#1f6f9c" stroke-width="2"/>'),
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
