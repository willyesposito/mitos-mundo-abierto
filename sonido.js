// Sonido sintetizado con Web Audio: sin archivos ni red. Es un extra: todo lo que suena también se ve.
export function crearSonido(sonidos = {}) {
  let ac = null;
  const registro = [];   // lo que sonó, para la herramienta de pruebas

  // Los navegadores solo dejan sonar después de un toque o una tecla.
  function despertar() {
    try {
      if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); }
      if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    } catch (e) { ac = null; }
  }

  function nota(frecuencia, { onda = 'sine', dur = 0.5, vol = 0.12, retardo = 0 } = {}) {
    if (!ac || ac.state !== 'running') return;
    try {
      const t0 = ac.currentTime + retardo;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = onda; o.frequency.value = frecuencia;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* sin audio: se juega igual */ }
  }

  // Nota cuyo tono viaja de una frecuencia a otra; con `vibrado` (Hz) tiembla, para el balido
  function glisar(desde, hasta, dur, { onda = 'sine', vol = 0.1, retardo = 0, vibrado = 0 } = {}) {
    if (!ac || ac.state !== 'running') return;
    try {
      const t0 = ac.currentTime + retardo;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = onda; o.frequency.setValueAtTime(desde, t0); o.frequency.linearRampToValueAtTime(hasta, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      if (vibrado) {
        const l = ac.createOscillator(), lg = ac.createGain();
        l.frequency.value = vibrado; lg.gain.value = desde * 0.08;
        l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05);
      }
      o.connect(g); g.connect(ac.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* sin audio: se juega igual */ }
  }

  function tocar(tipo, id) {
    registro.push(tipo + (id ? ':' + id : ''));
    const s = sonidos[id] || { frecuencia: 440, onda: 'sine' };
    switch (tipo) {
      case 'brillo': nota(660, { dur: 0.3, vol: 0.08 }); nota(990, { dur: 0.4, vol: 0.07, retardo: 0.09 }); break;
      case 'brasero': nota(220, { onda: 'triangle', dur: 0.5, vol: 0.1 }); break;
      case 'escucha': nota(s.frecuencia, { onda: s.onda, dur: 0.35, vol: 0.09 }); break;
      case 'eco': for (let i = 0; i < 4; i++) nota(s.frecuencia, { onda: s.onda, dur: 0.35, vol: 0.14 * Math.pow(0.55, i), retardo: i * 0.2 }); break;
      case 'golpe': for (const k of [1, 1.51, 2.32, 3.1]) nota(s.frecuencia * k, { onda: 'triangle', dur: 1.2, vol: 0.06 }); break;
      case 'resuena': nota(s.frecuencia, { onda: s.onda, dur: 0.9, vol: 0.03 }); break;
      case 'abre': nota(180, { onda: 'triangle', dur: 0.4, vol: 0.12 }); nota(270, { onda: 'triangle', dur: 0.5, vol: 0.1, retardo: 0.12 }); break;
      case 'maulla': glisar(520, 780, 0.2, { onda: 'triangle', vol: 0.1 }); glisar(780, 430, 0.3, { onda: 'triangle', vol: 0.1, retardo: 0.2 }); break;
      case 'bala': glisar(330, 290, 0.6, { onda: 'sawtooth', vol: 0.05, vibrado: 28 }); break;
      case 'grazna': nota(700, { onda: 'square', dur: 0.14, vol: 0.05 }); nota(520, { onda: 'square', dur: 0.2, vol: 0.05, retardo: 0.17 }); break;
      case 'trina': for (let i = 0; i < 3; i++) nota(2200 + i * 260, { dur: 0.08, vol: 0.06, retardo: i * 0.1 }); break;
      case 'chasquea': glisar(2600, 3400, 0.06, { vol: 0.07 }); glisar(2600, 3400, 0.06, { vol: 0.07, retardo: 0.1 }); break;
      case 'soga': nota(300, { onda: 'triangle', dur: 0.15, vol: 0.1 }); nota(400, { onda: 'triangle', dur: 0.2, vol: 0.08, retardo: 0.08 }); break;
    }
  }
  return { despertar, tocar, registro };
}
