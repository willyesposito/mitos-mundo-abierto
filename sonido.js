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
      case 'ambiente':
        if (id === 'chasquido') for (const r of [0.3, 0.42, 0.5]) nota(2100, { dur: 0.05, vol: 0.05, retardo: r });
        else if (id === 'canto') for (const [r, f] of [[0.3, 2600], [0.4, 3100], [0.5, 2700], [0.62, 3200]]) nota(f, { dur: 0.07, vol: 0.03, retardo: r });
        else if (id === 'zumbido') { nota(150, { onda: 'sawtooth', dur: 0.9, vol: 0.03, retardo: 0.3 }); nota(158, { onda: 'sawtooth', dur: 0.9, vol: 0.03, retardo: 0.3 }); }
        else if (id === 'balido') for (const [r, f] of [[0.3, 430], [0.5, 400], [0.7, 440]]) nota(f, { onda: 'sawtooth', dur: 0.16, vol: 0.03, retardo: r });
        else if (id === 'graznido') { nota(620, { onda: 'sawtooth', dur: 0.14, vol: 0.035, retardo: 0.3 }); nota(520, { onda: 'sawtooth', dur: 0.2, vol: 0.035, retardo: 0.46 }); }
        break;
      case 'abre': nota(180, { onda: 'triangle', dur: 0.4, vol: 0.12 }); nota(270, { onda: 'triangle', dur: 0.5, vol: 0.1, retardo: 0.12 }); break;
      case 'soga': nota(300, { onda: 'triangle', dur: 0.15, vol: 0.1 }); nota(400, { onda: 'triangle', dur: 0.2, vol: 0.08, retardo: 0.08 }); break;
    }
  }
  return { despertar, tocar, registro };
}
