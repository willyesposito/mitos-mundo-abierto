// Todo lo que es DOM: contadores, avisos, tira de personajes, perfiles y menú.
import { ICONOS } from './iconos.js';
import { dibujarPersonaje } from './dibujo.js';
import { listarPerfiles, crearPerfil, borrarPerfil, MAX_PERFILES } from './nucleo.js';

const $ = id => document.getElementById(id);

export function crearInterfaz({ personajes, catalogo, mapa }) {
  const ui = {};
  const porId = Object.fromEntries(personajes.map(p => [p.id, p]));
  const porObjeto = Object.fromEntries(catalogo.objetos.map(o => [o.id, o]));
  const zona = catalogo.zonas.find(z => z.id === mapa.zona);
  let avisoTimer = null;

  document.querySelectorAll('[data-icono]').forEach(el => { el.innerHTML = ICONOS[el.dataset.icono]; });
  $('btn-menu').innerHTML = ICONOS.menu;
  $('btn-salto').querySelector('.ico').innerHTML = ICONOS.saltar;
  $('zona-nombre').textContent = zona ? zona.nombre : '';

  // --- Tira de personajes ---
  const tira = $('tira');
  for (const p of personajes) {
    const b = document.createElement('button');
    b.className = 'pj'; b.dataset.id = p.id; b.setAttribute('aria-label', p.nombre);
    const c = document.createElement('canvas'); c.width = 112; c.height = 112;
    const cx = c.getContext('2d');
    dibujarPersonaje(cx, p, { x: 56, y: 104, fx: 0, fy: 1, t: 0.3, caminando: false, volando: false, escala: 2.3, paso: 0 });
    c.style.width = '52px'; c.style.height = '52px';
    const n = document.createElement('span'); n.textContent = p.nombre;
    b.append(c, n); tira.append(b);
  }
  ui.alElegirPersonaje = null;
  tira.addEventListener('click', ev => {
    const b = ev.target.closest('.pj');
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
  };

  ui.pistaCambio = visible => { $('pista-cambio').hidden = !visible; };

  // --- Contadores (solo suben) ---
  ui.contadores = recogidos => {
    const total = catalogo.objetos.length;
    const enTotal = catalogo.objetos.filter(o => recogidos[o.id]).length;
    const deZona = catalogo.objetos.filter(o => o.zona === mapa.zona);
    const enZona = deZona.filter(o => recogidos[o.id]).length;
    $('zona-n').textContent = `${enZona}/${deZona.length}`;
    $('total-n').textContent = `${enTotal}/${total}`;
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
      const hechos = catalogo.objetos.filter(o => p.objetos[o.id]).length;
      b.innerHTML = '<span class="nombre"></span><small></small>';
      b.querySelector('.nombre').textContent = p.nombre;
      b.querySelector('small').textContent = `${hechos}/${catalogo.objetos.length} objetos`;
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
  ui.menuAbierto = () => !menu.hidden;
  ui.alCerrarMenu = null; ui.alCambiarPerfil = null;
  ui.abrirMenu = recogidos => {
    $('menu-principal').hidden = false; $('menu-lista').hidden = true; $('menu-titulo').textContent = 'Pausa';
    ui.recogidosMenu = recogidos; menu.hidden = false;
  };
  ui.cerrarMenu = () => { menu.hidden = true; if (ui.alCerrarMenu) ui.alCerrarMenu(); };
  $('menu-seguir').addEventListener('click', ui.cerrarMenu);
  $('menu-perfiles').addEventListener('click', () => { menu.hidden = true; if (ui.alCambiarPerfil) ui.alCambiarPerfil(); });
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
