// Todo lo que es DOM: contadores, avisos, tira de personajes, perfiles y menú.
import { ICONOS, simboloSvg } from './iconos.js';
import { dibujarPersonaje, alTenerSprites } from './dibujo.js';
import { listarPerfiles, crearPerfil, borrarPerfil, MAX_PERFILES } from './nucleo.js';

const $ = id => document.getElementById(id);

export function crearInterfaz({ personajes, catalogo, mapa }) {   // `mapa` es el actual; ver usarMapa
  const ui = {};
  const porId = Object.fromEntries(personajes.map(p => [p.id, p]));
  const porObjeto = Object.fromEntries(catalogo.objetos.map(o => [o.id, o]));
  let zonaId = mapa.zona || null;   // en el mundo continuo la zona es donde está parado el personaje (ver usarZona)
  let avisoTimer = null;

  // Solo cuentan los objetos que ya están puestos en algún mapa
  const contables = catalogo.objetos.filter(o => o.ubicado !== false);
  // La partida cuenta puerto, plaza y palacio; el campo de pruebas cuenta aparte (su total es el de su zona)
  const partida = contables.filter(o => o.zona !== 'pruebas');
  document.querySelectorAll('[data-icono]').forEach(el => { el.innerHTML = ICONOS[el.dataset.icono]; });
  $('btn-menu').innerHTML = ICONOS.menu;
  $('btn-ficha').innerHTML = ICONOS.info;
  $('btn-salto').querySelector('.ico').innerHTML = ICONOS.saltar;
  pintarZona();

  // --- Tira de personajes ---
  const tira = $('tira');
  for (const p of personajes) {
    const b = document.createElement('button');
    b.className = 'pj'; b.dataset.id = p.id; b.setAttribute('aria-label', p.nombre);
    const c = document.createElement('canvas'); c.width = 112; c.height = 112;
    const cx = c.getContext('2d');
    alTenerSprites(() => {
      cx.clearRect(0, 0, c.width, c.height);
      dibujarPersonaje(cx, p, { x: 56, y: 104, fx: 0, fy: 1, t: 0, caminando: false, volando: false, escala: 2.3, paso: 0 });
    });
    c.style.width = '52px'; c.style.height = '52px';
    const n = document.createElement('span'); n.textContent = p.nombre;
    b.append(c, n); tira.append(b);
  }
  ui.alElegirPersonaje = null;
  // Tocar elige; mantener apretado abre la ficha
  let largo = null, fueLargo = false;
  const cancelarLargo = () => { clearTimeout(largo); largo = null; };
  tira.addEventListener('pointerdown', ev => {
    const b = ev.target.closest('.pj'); if (!b) return;
    fueLargo = false; cancelarLargo();
    largo = setTimeout(() => { fueLargo = true; abrirFicha(b.dataset.id); }, 550);
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) tira.addEventListener(t, cancelarLargo);
  tira.addEventListener('click', ev => {
    const b = ev.target.closest('.pj');
    if (fueLargo) { fueLargo = false; return; }
    if (b && ui.alElegirPersonaje) ui.alElegirPersonaje(b.dataset.id);
  });

  ui.marcarPersonaje = id => {
    tira.querySelectorAll('.pj').forEach(b => b.classList.toggle('activo', b.dataset.id === id));
    const p = porId[id];
    const btn = $('btn-poder');
    btn.querySelector('.ico').innerHTML = ICONOS[p.poder.id] || '';
    btn.querySelector('.etiqueta').textContent = p.poder.nombre;
    btn.classList.toggle('apagado', !p.poder.activo);
    btn.setAttribute('aria-label', p.poder.nombre);
    personajeActual = id; pintarChipEco();
  };

  // --- Sonido guardado por Eco (se ve siempre: color y símbolo) ---
  let personajeActual = null, sonidoEco = null;
  function pintarChipEco() {
    const chip = $('chip-eco');
    const s = sonidoEco && (mapa.sonidos || {})[sonidoEco];
    chip.hidden = !s && personajeActual !== 'eco';
    chip.style.setProperty('--eco', s ? s.color : '#b5482e');
    $('eco-simbolo').innerHTML = s ? simboloSvg(s.simbolo, s.color) : ICONOS.voz;
    $('eco-texto').textContent = s ? `Eco guarda: ${s.nombre}` : 'Eco: sin sonido guardado';
    chip.dataset.sonido = s ? sonidoEco : '';
  }
  function pintarZona() {
    const z = catalogo.zonas.find(q => q.id === zonaId);
    $('zona-nombre').textContent = z ? z.nombre : '';
  }
  ui.usarMapa = m => {
    mapa = m; zonaId = m.zona || null;
    pintarZona();
    pintarChipEco();
  };
  // Cambia la zona que muestra el HUD (al cruzar caminando de una zona a otra del mismo mapa)
  ui.usarZona = id => { zonaId = id; pintarZona(); };
  ui.sonidoEco = id => { sonidoEco = id || null; pintarChipEco(); };
  ui.nombreSonido = id => ((mapa.sonidos || {})[id] || {}).nombre || '';

  // --- Fichas de personaje ---
  const ficha = $('pantalla-ficha');
  let fichaId = null;
  function pintarFicha(id) {
    const p = porId[id]; if (!p || !p.ficha) return;
    fichaId = id;
    const c = $('ficha-retrato'), cx = c.getContext('2d');
    cx.clearRect(0, 0, c.width, c.height);
    alTenerSprites(() => {
      if (fichaId !== id) return;
      cx.clearRect(0, 0, c.width, c.height);
      dibujarPersonaje(cx, p, { x: 84, y: 156, fx: 0, fy: 1, t: 0, caminando: false, volando: false, escala: 3.4, paso: 0 });
    });
    $('ficha-nombre').textContent = p.nombre;
    $('ficha-texto').textContent = p.ficha.texto;
    $('ficha-poder-titulo').textContent = 'Poder: ' + p.poder.nombre;
    const caja = $('ficha-poder'); caja.innerHTML = '';
    let ul = null;
    for (const linea of p.ficha.poder) {
      if (linea.startsWith('- ')) {
        if (!ul) { ul = document.createElement('ul'); caja.append(ul); }
        const li = document.createElement('li'); li.textContent = linea.slice(2); ul.append(li);
      } else { ul = null; const q = document.createElement('p'); q.textContent = linea; caja.append(q); }
    }
    $('ficha-senal').textContent = 'Señal en el mapa: ' + p.ficha.senal;
    ficha.querySelector('.tarjeta').scrollTop = 0;
  }
  function abrirFicha(id) {
    if (ui.menuAbierto() && ficha.hidden) return;
    const ya = !ficha.hidden;
    pintarFicha(id || personajeActual || personajes[0].id);
    ficha.hidden = false;
    if (!ya && ui.alAbrirFicha) ui.alAbrirFicha();
  }
  ui.abrirFicha = abrirFicha;
  ui.fichaAbierta = () => !ficha.hidden;
  const vecino = d => pintarFicha(personajes[(personajes.findIndex(p => p.id === fichaId) + d + personajes.length) % personajes.length].id);
  $('ficha-anterior').addEventListener('click', () => vecino(-1));
  $('ficha-siguiente').addEventListener('click', () => vecino(1));
  $('ficha-cerrar').addEventListener('click', () => ui.cerrarMenu());
  $('btn-ficha').addEventListener('click', () => abrirFicha());
  ui.alAbrirFicha = null;

  ui.pistaCambio = visible => { $('pista-cambio').hidden = !visible; };

  // --- Contadores (solo suben) ---
  ui.contadores = recogidos => {
    const total = partida.length;
    const enTotal = partida.filter(o => recogidos[o.id]).length;
    const deZona = contables.filter(o => o.zona === zonaId);
    const enZona = deZona.filter(o => recogidos[o.id]).length;
    $('zona-n').textContent = `${enZona}/${deZona.length}`;
    $('total-n').textContent = `${enTotal}/${total}`;
    $('total-n').closest('.chip').style.display = zonaId === 'pruebas' ? 'none' : '';
  };
  ui.pulsarContadores = () => {
    const el = $('contadores'); el.classList.remove('pulso'); void el.offsetWidth; el.classList.add('pulso');
  };

  // --- Avisos ---
  ui.aviso = (titulo, texto, ms = 3800) => {
    const a = $('aviso');
    a.innerHTML = '';
    const h = document.createElement('strong'); h.textContent = titulo; a.append(h);
    if (texto) { const p = document.createElement('span'); p.textContent = texto; a.append(p); }
    a.hidden = false; a.classList.remove('entra'); void a.offsetWidth; a.classList.add('entra');
    clearTimeout(avisoTimer); avisoTimer = setTimeout(() => { a.hidden = true; }, ms);
  };
  $('aviso').addEventListener('click', () => { $('aviso').hidden = true; });
  ui.avisoObjeto = id => {
    const o = porObjeto[id];
    ui.aviso('¡Encontraste un objeto!', o ? `${o.nombre}. ${o.texto}` : '', 5200);
  };

  // --- Perfiles ---
  const pantallaPerfiles = $('pantalla-perfiles');
  ui.mostrarPerfiles = alElegir => {
    ui.alElegirPerfil = alElegir;
    pintarPerfiles();
    pantallaPerfiles.hidden = false;
  };
  function pintarPerfiles() {
    const lista = $('lista-perfiles'); lista.innerHTML = '';
    const perfiles = listarPerfiles();
    for (const p of perfiles) {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.className = 'boton-grande perfil';
      const hechos = partida.filter(o => p.objetos[o.id]).length;
      b.innerHTML = '<span class="nombre"></span><small></small>';
      b.querySelector('.nombre').textContent = p.nombre;
      b.querySelector('small').textContent = `${hechos}/${partida.length} objetos`;
      b.addEventListener('click', () => { pantallaPerfiles.hidden = true; ui.alElegirPerfil(p); });
      const x = document.createElement('button'); x.className = 'borrar'; x.textContent = 'Borrar'; x.setAttribute('aria-label', `Borrar perfil ${p.nombre}`);
      x.addEventListener('click', () => {
        if (x.dataset.seguro) { borrarPerfil(p.id); pintarPerfiles(); return; }
        x.dataset.seguro = '1'; x.textContent = '¿Seguro?';
        setTimeout(() => { if (x.isConnected) { delete x.dataset.seguro; x.textContent = 'Borrar'; } }, 3000);
      });
      li.append(b, x); lista.append(li);
    }
    const lleno = perfiles.length >= MAX_PERFILES;
    $('form-nuevo').hidden = lleno;
    const msg = $('msg-perfiles'); msg.hidden = !lleno;
    msg.textContent = lleno ? 'Hay cinco perfiles. Para crear otro, borrá uno.' : '';
  }
  $('form-nuevo').addEventListener('submit', ev => {
    ev.preventDefault();
    const p = crearPerfil($('nombre-nuevo').value);
    if (!p) return;
    $('nombre-nuevo').value = '';
    pantallaPerfiles.hidden = true; ui.alElegirPerfil(p);
  });

  // --- Menú ---
  const menu = $('pantalla-menu');
  ui.menuAbierto = () => !menu.hidden || !ficha.hidden;
  ui.alCerrarMenu = null; ui.alCambiarPerfil = null; ui.alCambiarMapa = null;
  ui.abrirMenu = recogidos => {
    $('menu-pruebas').textContent = mapa.id === 'pruebas' ? 'Salir del campo de pruebas' : 'Campo de pruebas';
    $('menu-principal').hidden = false; $('menu-lista').hidden = true; $('menu-titulo').textContent = 'Pausa';
    ui.recogidosMenu = recogidos; menu.hidden = false;
  };
  ui.cerrarMenu = () => { menu.hidden = true; ficha.hidden = true; if (ui.alCerrarMenu) ui.alCerrarMenu(); };
  $('menu-seguir').addEventListener('click', ui.cerrarMenu);
  $('menu-perfiles').addEventListener('click', () => { menu.hidden = true; if (ui.alCambiarPerfil) ui.alCambiarPerfil(); });
  $('menu-pruebas').addEventListener('click', () => { menu.hidden = true; if (ui.alCambiarMapa) ui.alCambiarMapa(mapa.id === 'pruebas' ? null : 'pruebas'); });
  $('menu-objetos').addEventListener('click', () => {
    const ul = $('lista-objetos'); ul.innerHTML = '';
    const hechos = catalogo.objetos.filter(o => ui.recogidosMenu[o.id]);
    if (!hechos.length) { const li = document.createElement('li'); li.className = 'vacio'; li.textContent = 'Todavía no encontraste ninguno.'; ul.append(li); }
    for (const o of hechos) {
      const li = document.createElement('li');
      const t = document.createElement('strong'); t.textContent = o.nombre;
      const d = document.createElement('span'); d.textContent = o.texto;
      li.append(t, d); ul.append(li);
    }
    $('menu-titulo').textContent = 'Mis objetos';
    $('menu-principal').hidden = true; $('menu-lista').hidden = false;
  });
  $('menu-volver').addEventListener('click', () => { $('menu-principal').hidden = false; $('menu-lista').hidden = true; $('menu-titulo').textContent = 'Pausa'; });
  $('btn-menu').addEventListener('click', () => ui.abrirMenu(ui.recogidosMenu || {}));

  return ui;
}
