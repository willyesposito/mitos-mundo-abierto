// Todo lo que es DOM: contadores, avisos, tira de personajes, perfiles y menú.
import { ICONOS, simboloSvg } from './iconos.js';
import { dibujarPersonaje, alTenerSprites, tieneSpriteObjeto } from './dibujo.js';
import { listarPerfiles, crearPerfil, borrarPerfil, MAX_PERFILES } from './nucleo.js';
import { lugaresPlaza, elegirLugar, objetivoCercano } from './exploracion.js';

const $ = id => document.getElementById(id);

export function crearInterfaz({ personajes, catalogo, mapa }) {   // `mapa` es el actual; ver usarMapa
  const ui = {};
  // La orientación muestra lugares, no la solución ni el personaje que los resuelve.
  const guia=document.createElement('section');guia.id='exploracion';guia.hidden=true;
  const verLugares=document.createElement('button');verLugares.id='btn-explorar';verLugares.textContent='Explorar plaza';
  verLugares.setAttribute('aria-expanded','false');verLugares.setAttribute('aria-controls','lista-lugares');
  const pista=document.createElement('span');pista.id='pista-exploracion';pista.setAttribute('role','status');
  const listaLugares=document.createElement('div');listaLugares.id='lista-lugares';listaLugares.hidden=true;
  guia.append(verLugares,pista,listaLugares);$('hud').append(guia);
  let mundoGuia=null,ultimaGuia='',ultimoTiempoGuia=-1;
  verLugares.addEventListener('click',()=>{listaLugares.hidden=!listaLugares.hidden;verLugares.setAttribute('aria-expanded',String(!listaLugares.hidden));});
  ui.orientar=m=>{
    mundoGuia=m;
    if(m.t-ultimoTiempoGuia<.15&&m.t>=ultimoTiempoGuia)return;ultimoTiempoGuia=m.t;
    const lugares=lugaresPlaza(m);guia.hidden=!lugares.length;
    if(!lugares.length){listaLugares.hidden=true;verLugares.setAttribute('aria-expanded','false');ultimaGuia='';return;}
    const o=objetivoCercano(m);
    const texto=o ? (o.cerca ? o.nombre+': '+o.pista : o.nombre+' · '+o.direccion) : 'Ya exploraste los lugares de la plaza';
    if(pista.textContent!==texto)pista.textContent=texto;
    const clave=lugares.map(l=>l.id+':'+l.pendiente).join('|')+'|'+o?.id;
    if(clave===ultimaGuia)return;ultimaGuia=clave;listaLugares.replaceChildren();
    for(const l of lugares){const b=document.createElement('button');b.dataset.lugar=l.id;b.textContent=l.nombre+(l.pendiente?'':' · Explorado');b.disabled=!l.pendiente;b.setAttribute('aria-pressed',String(l.id===o?.id));
      b.addEventListener('click',()=>{elegirLugar(mundoGuia,l.id);listaLugares.hidden=true;verLugares.setAttribute('aria-expanded','false');ultimaGuia='';ultimoTiempoGuia=-1;ui.orientar(mundoGuia);});listaLugares.append(b);}
  };
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
  $('btn-ficha').innerHTML = ICONOS.ficha;
  $('btn-salto').querySelector('.ico').innerHTML = ICONOS.saltar;
  $('btn-hablar').querySelector('.ico').innerHTML = ICONOS.hablar;
  pintarZona();

  // --- Tira de personajes ---
  const tira = $('tira');
  for (const p of personajes) {
    const b = document.createElement('button');
    b.className = 'pj'; b.dataset.id = p.id; b.setAttribute('aria-label', p.nombre);
    const ret = document.createElement('div'); ret.className = 'retrato';
    const ins = document.createElement('div'); ins.className = 'insignia'; ins.innerHTML = ICONOS['rasgo_' + p.id] || '';
    const c = document.createElement('canvas'); c.width = 112; c.height = 112;
    const cx = c.getContext('2d');
    alTenerSprites(() => {
      cx.clearRect(0, 0, c.width, c.height);
      dibujarPersonaje(cx, p, { x: 56, y: 104, fx: 0, fy: 1, t: 0, caminando: false, volando: false, escala: 2.3, paso: 0 });
    });
    c.style.width = '52px'; c.style.height = '52px';
    const n = document.createElement('span'); n.textContent = p.nombre;
    ret.append(c, ins); b.append(ret, n); tira.append(b);
  }
  // La tira muestra solo a los desbloqueados; los demás quedan escondidos hasta que se ganen.
  let desbloqueados = new Set(personajes.map(p => p.id));
  const visibles = () => personajes.filter(p => desbloqueados.has(p.id));
  ui.mostrarTira = ids => {
    desbloqueados = new Set(ids);
    tira.querySelectorAll('.pj').forEach(b => { b.hidden = !desbloqueados.has(b.dataset.id); });
  };
  ui.desbloqueados = () => visibles().map(p => p.id);
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
  const HABILIDADES = [['fuerza', 'Fuerza'], ['astucia', 'Astucia'], ['valentia', 'Valentía'], ['magia', 'Magia'], ['liderazgo', 'Liderazgo'], ['bondad', 'Bondad'], ['velocidad', 'Velocidad']];
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
    const hab = $('ficha-habilidades'); hab.replaceChildren();
    for (const [clave, nombre] of HABILIDADES) {
      const v = Math.max(0, Math.min(10, (p.habilidades || {})[clave] || 0));
      const li = document.createElement('li'); li.setAttribute('role', 'img'); li.setAttribute('aria-label', `${nombre}: ${v} de 10`);
      const et = document.createElement('span'); et.className = 'hab-nombre'; et.textContent = nombre;
      const barra = document.createElement('span'); barra.className = 'hab-barra'; barra.setAttribute('aria-hidden', 'true');
      for (let k = 1; k <= 10; k++) { const pt = document.createElement('i'); if (k <= v) pt.className = 'lleno'; barra.append(pt); }
      const num = document.createElement('b'); num.className = 'hab-valor'; num.textContent = v;
      li.append(et, barra, num); hab.append(li);
    }
    const sn = $('ficha-senal'); sn.innerHTML = '';
    const bs = document.createElement('b'); bs.textContent = 'Buscá:'; sn.append(bs, ' ' + p.ficha.senal);
    const lista = visibles(), n = lista.length, i = Math.max(0, lista.findIndex(q => q.id === id));
    const ant = lista[(i + n - 1) % n], sig = lista[(i + 1) % n];
    $('ficha-anterior').innerHTML = ICONOS.anterior; $('ficha-anterior').append(ant.nombre);
    $('ficha-siguiente').textContent = sig.nombre; $('ficha-siguiente').insertAdjacentHTML('beforeend', ICONOS.siguiente);
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
  const vecino = d => { const l = visibles(); pintarFicha(l[(Math.max(0, l.findIndex(p => p.id === fichaId)) + d + l.length) % l.length].id); };
  $('ficha-anterior').addEventListener('click', () => vecino(-1));
  $('ficha-siguiente').addEventListener('click', () => vecino(1));
  $('ficha-cerrar').addEventListener('click', () => ui.cerrarMenu());
  $('btn-ficha').addEventListener('click', () => abrirFicha());
  ui.alAbrirFicha = null;

  ui.pistaCambio = visible => { $('pista-cambio').hidden = !visible; document.body.classList.toggle('con-pista', !!visible); };

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
  ui.aviso = (titulo, texto, ms = 3800, spriteId = null) => {
    const a = $('aviso');
    a.innerHTML = '';
    const fila = document.createElement('div'); fila.className = 'aviso-fila';
    const med = document.createElement('div'); med.className = 'medallon';
    if (spriteId) { const im = document.createElement('img'); im.src = `sprites/coleccionables/${spriteId}.svg`; im.alt = ''; med.append(im); }
    else med.innerHTML = ICONOS.objeto;
    const tx = document.createElement('div'); tx.className = 'aviso-texto';
    const h = document.createElement('strong'); h.textContent = titulo; tx.append(h);
    if (texto) { const p = document.createElement('span'); p.textContent = texto; tx.append(p); }
    fila.append(med, tx);
    const cer = document.createElement('div'); cer.className = 'cerrar-aviso'; cer.textContent = 'Tocá para cerrar';
    a.append(fila, cer);
    a.hidden = false; a.classList.remove('entra'); void a.offsetWidth; a.classList.add('entra');
    clearTimeout(avisoTimer); avisoTimer = setTimeout(() => { a.hidden = true; }, ms);
  };
  $('aviso').addEventListener('click', () => { $('aviso').hidden = true; });
  ui.avisoObjeto = id => {
    const o = porObjeto[id];
    ui.aviso('¡Encontraste un objeto!', o ? `${o.nombre}. ${o.texto}` : '', 5200, tieneSpriteObjeto(id) ? id : null);
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
  // Un perfil nuevo elige con quién empezar antes de entrar al mundo; el perfil se crea al elegir.
  const eleccion = $('pantalla-eleccion');
  const ORDEN_ELECCION = ['ariadna', 'minotauro', 'pegaso', 'fenix', 'eco', 'ulises'];
  let nombreNuevo = '';
  function pintarEleccion() {
    const lista = $('eleccion-lista'); lista.replaceChildren();
    const ordenados = [...personajes].sort((a, b) => {
      const ia = ORDEN_ELECCION.indexOf(a.id), ib = ORDEN_ELECCION.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    for (const p of ordenados) {
      const b = document.createElement('button'); b.className = 'carta-eleccion'; b.dataset.id = p.id;
      const c = document.createElement('canvas'); c.width = 168; c.height = 168; c.setAttribute('aria-hidden', 'true');
      const cx = c.getContext('2d');
      alTenerSprites(() => {
        cx.clearRect(0, 0, c.width, c.height);
        dibujarPersonaje(cx, p, { x: 84, y: 156, fx: 0, fy: 1, t: 0, caminando: false, volando: false, escala: 3.4, paso: 0 });
      });
      const n = document.createElement('strong'); n.textContent = p.nombre;
      const q = document.createElement('small'); q.textContent = 'Poder: ' + p.poder.nombre;
      b.append(c, n, q);
      b.addEventListener('click', () => {
        const perfil = crearPerfil(nombreNuevo, { personaje: p.id, personajes });
        if (!perfil) { eleccion.hidden = true; pintarPerfiles(); pantallaPerfiles.hidden = false; return; }
        $('nombre-nuevo').value = '';
        eleccion.hidden = true; ui.alElegirPerfil(perfil);
      });
      lista.append(b);
    }
  }
  $('eleccion-volver').addEventListener('click', () => { eleccion.hidden = true; pantallaPerfiles.hidden = false; });
  $('form-nuevo').addEventListener('submit', ev => {
    ev.preventDefault();
    nombreNuevo = $('nombre-nuevo').value.trim();
    if (!nombreNuevo) return;
    pintarEleccion();
    pantallaPerfiles.hidden = true; eleccion.hidden = false;
    eleccion.querySelector('.tarjeta').scrollTop = 0;
  });

  // --- Charlas: panel inferior sobre el mundo; el juego queda en pausa mientras está abierto ---
  const panelCharla = $('pantalla-charla');
  let sesionCharla = null;
  ui.alPasoCharla = null;
  ui.charlaAbierta = () => !panelCharla.hidden;
  ui.hablarVisible = v => { const b = $('btn-hablar'); if (b.hidden === v) b.hidden = !v; };
  ui.abrirCharla = sesion => {
    sesionCharla = sesion;
    $('charla-nombre').textContent = sesion.nombre;
    const mk = $('charla-marcador'); mk.textContent = sesion.nombre.slice(0, 1).toUpperCase(); mk.style.background = sesion.charla.color || '#5f7a3a';
    $('pista-cambio').style.visibility = 'hidden';   // la pista del primer cambio no se asoma sobre la charla
    panelCharla.hidden = false;
    pintarCharla();
  };
  function pintarCharla() {
    const s = sesionCharla;
    $('charla-texto').textContent = s.nodo.texto;
    const cont = $('charla-opciones'); cont.replaceChildren();
    const ops = s.opciones();
    ops.forEach((o, i) => {
      const b = document.createElement('button'); b.className = 'opcion-charla'; b.dataset.indice = i;
      const num = document.createElement('span'); num.className = 'num'; num.textContent = i + 1;
      const tx = document.createElement('span'); tx.className = 'tx'; tx.textContent = o.texto;
      b.append(num, tx); b.addEventListener('click', () => elegirCharla(i)); cont.append(b);
    });
    if (!ops.length) {   // un nodo sin nada que elegir: un botón para seguir
      const b = document.createElement('button'); b.className = 'opcion-charla seguir'; b.dataset.seguir = '1';
      const tx = document.createElement('span'); tx.className = 'tx'; tx.textContent = 'Seguir';
      b.append(tx); b.addEventListener('click', () => elegirCharla(-1)); cont.append(b);
    }
    panelCharla.querySelector('.tarjeta-charla').scrollTop = 0;
  }
  function elegirCharla(i) {
    if (!sesionCharla) return;
    const r = i < 0 ? sesionCharla.seguir() : sesionCharla.elegir(i);
    if (ui.alPasoCharla) ui.alPasoCharla(r, sesionCharla);
    if (r.fin) ui.cerrarMenu(); else pintarCharla();
  }
  $('charla-cerrar').addEventListener('click', () => ui.cerrarMenu());
  // Teclado (extra): números eligen, Enter o Espacio continúan, Escape cierra. Mientras la charla está abierta nada más llega al juego.
  addEventListener('keydown', ev => {
    if (panelCharla.hidden || ev.code === 'Escape' || ev.code === 'Tab' || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (ev.repeat) return;
    const n = sesionCharla ? sesionCharla.opciones().length : 0;
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(ev.code);
    if (m) { if (Number(m[1]) <= n) elegirCharla(Number(m[1]) - 1); }
    else if (ev.code === 'Enter' || ev.code === 'NumpadEnter' || ev.code === 'Space') { if (n === 0) elegirCharla(-1); else if (n === 1) elegirCharla(0); }
  }, true);

  // --- Menú ---
  const menu = $('pantalla-menu');
  ui.menuAbierto = () => !menu.hidden || !ficha.hidden || !panelCharla.hidden;
  ui.alCerrarMenu = null; ui.alCambiarPerfil = null; ui.alCambiarMapa = null;
  ui.abrirMenu = recogidos => {
    $('menu-pruebas').textContent = mapa.id === 'pruebas' ? 'Salir del campo de pruebas' : 'Campo de pruebas';
    // El campo de pruebas está escondido: solo se ofrece con ?pruebas en la dirección. Dentro, la salida se ve siempre.
    $('menu-pruebas').hidden = mapa.id !== 'pruebas' && !new URLSearchParams(location.search).has('pruebas');
    $('menu-principal').hidden = false; $('menu-lista').hidden = true; $('menu-titulo').textContent = 'Pausa';
    ui.recogidosMenu = recogidos; menu.hidden = false;
  };
  ui.cerrarMenu = () => { menu.hidden = true; ficha.hidden = true; panelCharla.hidden = true; sesionCharla = null; $('pista-cambio').style.visibility = ''; if (ui.alCerrarMenu) ui.alCerrarMenu(); };
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
      const tx = document.createElement('div'); tx.className = 'obj-texto'; tx.append(t, d);
      if (tieneSpriteObjeto(o.id)) { const im = document.createElement('img'); im.className = 'obj-sprite'; im.src = `sprites/coleccionables/${o.id}.svg`; im.alt = ''; li.append(im); }
      li.append(tx); ul.append(li);
    }
    $('menu-titulo').textContent = 'Mis objetos';
    $('menu-principal').hidden = true; $('menu-lista').hidden = false;
  });
  $('menu-volver').addEventListener('click', () => { $('menu-principal').hidden = false; $('menu-lista').hidden = true; $('menu-titulo').textContent = 'Pausa'; });
  $('btn-menu').addEventListener('click', () => { if (panelCharla.hidden) ui.abrirMenu(ui.recogidosMenu || {}); });

  return ui;
}
