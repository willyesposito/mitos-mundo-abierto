// Arranque y bucle principal.
import { crearMundo, TW, TH, LH } from './mundo.js';
import { crearDibujo } from './dibujo.js';
import { crearInterfaz } from './interfaz.js';
import { crearControles } from './controles.js';
import { crearSonido } from './sonido.js';
import { actualizarPerfil, registrarObjeto, guardarMundo } from './nucleo.js';

const $ = id => document.getElementById(id);
const pedir = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });

async function arrancar() {
  const IDS_MAPAS = ['puerto', 'plaza', 'pruebas'];
  const [{ personajes }, catalogo, ...listaMapas] = await Promise.all([
    pedir('datos/personajes.json'), pedir('datos/coleccionables.json'), ...IDS_MAPAS.map(i => pedir(`datos/mapa-${i}.json`)),
  ]);
  const mapas = Object.fromEntries(listaMapas.map(m => [m.id, m]));
  let mapa = mapas.puerto;

  const lienzo = $('lienzo');
  const dibujo = crearDibujo(lienzo);
  dibujo.usarPersonajes(personajes);
  const ui = crearInterfaz({ personajes, catalogo, mapa });

  const sonido = crearSonido(mapas.pruebas.sonidos);   // todos los mapas comparten el mismo catálogo de sonidos
  for (const t of ['pointerdown', 'keydown']) document.addEventListener(t, sonido.despertar, { capture: true });
  let mundo = null, perfil = null, corriendo = false, ultimo = 0;
  const vista = { W: 0, H: 0, dpr: 1, esc: 1, camX: 0, camY: 0, focoY: 0 };

  const entrada = crearControles({
    zona: $('zona-joystick'), joystick: $('joystick'), palanca: $('palanca'),
    btnSalto: $('btn-salto'), btnPoder: $('btn-poder'),
    alCambiar(i) {
      if (!mundo || ui.menuAbierto()) return;
      const k = i < 0 ? (personajes.findIndex(p => p.id === mundo.jugador.personaje) + 1) % personajes.length : i;
      elegirPersonaje(personajes[k].id);
    },
    alMenu() { if (!mundo) return; ui.menuAbierto() ? ui.cerrarMenu() : abrirMenu(); },
    alFicha() { if (!mundo) return; ui.fichaAbierta() ? ui.cerrarMenu() : (ui.menuAbierto() || (corriendo = false, entrada.x = entrada.y = 0, ui.abrirFicha())); },
  });

  function elegirPersonaje(id) {
    if (!mundo) return;
    mundo.cambiarPersonaje(id);
  }
  ui.alElegirPersonaje = elegirPersonaje;

  function abrirMenu() { corriendo = false; ui.abrirMenu(perfil.objetos); }
  ui.alCerrarMenu = () => { if (mundo) reanudar(); };
  ui.alAbrirFicha = () => { corriendo = false; entrada.x = entrada.y = 0; entrada.poderMantenido = false; };
  ui.alCambiarPerfil = () => { corriendo = false; mundo = null; entrada.x = entrada.y = 0; ui.mostrarPerfiles(iniciar); };

  // Arma el mundo de un mapa para este perfil. Eco y el personaje viajan con la jugadora entre mapas.
  function cargarMapa(id, llegada, personaje, fundido) {
    mapa = mapas[id];
    const guardado = { ...((perfil.mundos || {})[id] || {}), eco: perfil.eco || ((perfil.mundos || {})[id] || {}).eco };
    mundo = crearMundo(mapa, perfil.objetos, guardado, llegada);
    mundo.jugador.personaje = personajes.some(x => x.id === personaje) ? personaje : 'pegaso';
    if (fundido) { mundo.jugador.estado = 'volviendo'; mundo.velo = 1; }
    ui.usarMapa(mapa);
    ui.sonidoEco(mundo.eco);
    ui.marcarPersonaje(mundo.jugador.personaje);
    ui.contadores(perfil.objetos);
    ajustar(); centrarCamara(true);
    exponer();
  }
  function exponer() { if (new URLSearchParams(location.search).has('prueba')) { window.__mundo = mundo; window.__sonidos = sonido.registro; } }

  // Cambio de mapa. `id` nulo es volver al mapa de la partida desde el campo de pruebas.
  function cambiarMapa(id, llegada) {
    guardarMundo(perfil, mapa.id, mundo.estado());
    const pj = mundo.jugador.personaje;
    entrada.x = entrada.y = 0; entrada.poderMantenido = false;
    if (id === null) { id = perfil.mapa || 'puerto'; llegada = perfil.llegada; }
    else if (id !== 'pruebas') actualizarPerfil(perfil, { mapa: id, llegada: llegada || null });
    cargarMapa(id, llegada, pj, true);
    reanudar();
  }
  ui.alCambiarMapa = id => cambiarMapa(id, id === 'pruebas' ? mapas.pruebas.inicio : null);

  function iniciar(p) {
    perfil = p;
    const id = mapas[perfil.mapa] && perfil.mapa !== 'pruebas' ? perfil.mapa : 'puerto';
    cargarMapa(id, id === perfil.mapa ? perfil.llegada : null, perfil.personaje, false);
    ui.marcarPersonaje(mundo.jugador.personaje);
    ui.marcarPersonaje(mundo.jugador.personaje);
    ui.pistaCambio(!perfil.vistoCambio);
    ui.recogidosMenu = perfil.objetos;
    reanudar();
  }

  function reanudar() { if (corriendo || !mundo) return; corriendo = true; ultimo = performance.now(); requestAnimationFrame(bucle); }

  function procesarEventos() {
    let cambioMundo = false;
    for (const e of mundo.eventos.splice(0)) {
      if (e.tipo === 'salida') {
        // Se vuelve a la entrada del mapa vecino que corresponde a este mapa
        const destino = mapas[e.a];
        cambiarMapa(e.a, destino.entradas && destino.entradas[mapa.id]);
        return;
      }
      if (['muro', 'reja', 'empuje', 'brasero', 'sol', 'golpe', 'puerta', 'escucha', 'soga'].includes(e.tipo)) cambioMundo = true;
      if (e.tipo === 'objeto') {
        registrarObjeto(perfil, e.id);
        ui.contadores(perfil.objetos); ui.pulsarContadores(); ui.avisoObjeto(e.id);
      } else if (e.tipo === 'cambio') {
        ui.marcarPersonaje(e.id);
        actualizarPerfil(perfil, { personaje: e.id, vistoCambio: true });
        ui.pistaCambio(false);
      } else if (e.tipo === 'reja') { ui.aviso('¡Se abrió una reja!', '', 2600); sonido.tocar('abre'); }
      else if (e.tipo === 'brillo') sonido.tocar('brillo');
      else if (e.tipo === 'brasero') { ui.aviso('¡Se encendió un brasero!', '', 2200); sonido.tocar('brasero'); }
      else if (e.tipo === 'sol') { ui.aviso('¡Se abrió la puerta del sol!', '', 2800); sonido.tocar('abre'); }
      else if (e.tipo === 'escucha') { actualizarPerfil(perfil, { eco: mundo.eco }); ui.sonidoEco(e.id); ui.aviso(`Eco escuchó: ${ui.nombreSonido(e.id)}`, 'Solo guarda el último sonido que escucha.', 2800); sonido.tocar('escucha', e.id); }
      else if (e.tipo === 'eco') sonido.tocar('eco', e.id);
      else if (e.tipo === 'golpe') { ui.aviso(`¡Sonó: ${ui.nombreSonido(e.id)}!`, 'Va a seguir vibrando.', 3000); sonido.tocar('golpe', e.id); }
      else if (e.tipo === 'resuena') sonido.tocar('resuena', e.id);
      else if (e.tipo === 'puerta') { ui.aviso('¡Se abrió una puerta!', '', 2600); sonido.tocar('abre'); }
      else if (e.tipo === 'soga') { ui.aviso('¡Se tendió una soga!', 'Queda para siempre y la usan todos.', 3000); sonido.tocar('soga'); }
      else if (e.tipo === 'pista') ui.aviso(e.texto, '', 3600);
    }
    if (cambioMundo) guardarMundo(perfil, mapa.id, mundo.estado());
  }

  function ajustar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const W = innerWidth, H = innerHeight;
    lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
    lienzo.style.width = W + 'px'; lienzo.style.height = H + 'px';
    const inferior = $('controles').offsetHeight, superior = $('hud').offsetHeight + 8;
    vista.W = W; vista.H = H; vista.dpr = dpr;
    vista.esc = Math.min(W / (9.5 * TW), (H - inferior - superior) / (11 * TH));
    vista.focoY = superior + (H - inferior - superior) / 2;
    vista.inferior = inferior; vista.superior = superior;
    document.documentElement.style.setProperty('--alto-controles', inferior + 'px');
  }

  function objetivoCamara() {
    const j = mundo.jugador;
    const g = Math.max(mundo.suelo(j.x, j.y), 0);
    const alto = Math.max(0, j.z - g);
    let x = j.x * TW, y = j.y * TH - (g + alto * 0.5) * LH;
    const v = vista, mitadW = v.W / 2 / v.esc;
    const mapaW = mundo.cols * TW, mapaH = mundo.rows * TH;
    x = mapaW <= mitadW * 2 ? mapaW / 2 : Math.max(mitadW, Math.min(mapaW - mitadW, x));
    const minY = -3 * LH + (v.focoY - v.superior) / v.esc;
    const maxY = mapaH + 6 - (v.H - v.inferior - v.focoY) / v.esc;
    y = minY > maxY ? (minY + maxY) / 2 : Math.max(minY, Math.min(maxY, y));
    return { x, y };
  }
  function centrarCamara(brusco, dt = 0) {
    const o = objetivoCamara();
    if (brusco) { vista.camX = o.x; vista.camY = o.y; return; }
    const k = 1 - Math.exp(-7 * dt);
    vista.camX += (o.x - vista.camX) * k; vista.camY += (o.y - vista.camY) * k;
  }

  function bucle(ts) {
    if (!corriendo) return;
    const total = Math.min(0.05, (ts - ultimo) / 1000); ultimo = ts;
    let dt = total;
    while (dt > 0) { const s = Math.min(dt, 1 / 60); mundo.actualizar(s, entrada); dt -= s; }
    procesarEventos();
    const j = mundo.jugador;
    centrarCamara(j.estado === 'volviendo' && j.estadoT < 0.02, total);
    dibujo.dibujar(mundo, vista);
    requestAnimationFrame(bucle);
  }

  addEventListener('resize', () => { ajustar(); if (mundo) centrarCamara(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mundo && !ui.menuAbierto()) { entrada.x = entrada.y = 0; } });
  document.addEventListener('contextmenu', ev => ev.preventDefault());
  ajustar();
  ui.mostrarPerfiles(iniciar);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

arrancar().catch(err => {
  document.body.insertAdjacentHTML('beforeend', '<p style="color:#f4ecd8;padding:24px">No se pudo cargar el juego. Revisá la conexión y probá de nuevo.</p>');
  console.error(err);
});
