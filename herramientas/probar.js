// No es parte del juego. Herramienta de Claude Code: abre el juego en un navegador sin pantalla
// con tamaño de celular, lo juega con el teclado y verifica de punta a punta que todo funcione.
// Uso: node herramientas/probar.js [--rapido] [carpeta-de-capturas]
// --rapido: corrida corta (menos de un minuto) con lo que más se rompe; la completa corre sin bandera.
const http = require('http'), fs = require('fs'), path = require('path');
let pw;
for (const r of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { pw = require(r); break; } catch (e) {} }
if (!pw) { console.error('Falta playwright'); process.exit(2); }

const RAIZ = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2), RAPIDO = ARGS.includes('--rapido');
// Modo para entornos sin sockets: sirve recursos locales por intercepción de Playwright.
// Verifica juego y render; la instalación real del service worker queda explícitamente pendiente.
const SIN_SERVIDOR = ARGS.includes('--sin-servidor');
const SALIDA = ARGS.find(a => !a.startsWith('--')) || path.join(RAIZ, 'capturas');
fs.mkdirSync(SALIDA, { recursive: true });
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const servidor = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(RAIZ, p);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

let fallos = 0;
function ok(cond, msg) { console.log((cond ? 'OK    ' : 'FALLA ') + msg); if (!cond) fallos++; }
const espera = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  await new Promise(r => servidor.listen(0, r));
  const url = `http://localhost:${servidor.address().port}/?prueba&pruebas`;
  const browser = await pw.chromium.launch({ executablePath: process.env.MITOS_BROWSER || undefined });
  const ctx = await browser.newContext({ ...pw.devices['Pixel 7'], serviceWorkers: SIN_SERVIDOR ? 'block' : 'allow' });
  if (SIN_SERVIDOR) await ctx.route('**/*', async route => {
    let p = decodeURIComponent(new URL(route.request().url()).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.resolve(RAIZ, '.' + p);
    if (!f.startsWith(RAIZ + path.sep) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
    await route.fulfill({ status: 200, contentType: TIPOS[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });

  // Mundo continuo: las coordenadas de las pruebas son locales a la zona donde se juega (OFF = desplazamiento de la zona).
  // Se suman al hablar con el mundo (tp, celda, ir) y se restan al leer (est). En el campo de pruebas OFF es [0, 0].
  const datosMundo = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos/mapa-mundo.json'), 'utf8'));
  const ZONAS = Object.fromEntries(datosMundo.zonas.map(z => [z.id, [z.dx, z.dy]]));
  let OFF = ZONAS.puerto;
  const zona = n => { OFF = ZONAS[n]; };
  const est = () => page.evaluate(([ox, oy]) => {
    const m = window.__mundo, j = m.jugador;
    return { x: j.x - ox, y: j.y - oy, z: j.z, vz: j.vz, enSuelo: j.enSuelo, pj: j.personaje, estado: j.estado,
      recogidos: m.coleccionables.filter(c => c.recogido).map(c => c.id),
      celda: (x, y) => null };
  }, OFF);
  const celda = (x, y) => page.evaluate(([x, y]) => window.__mundo.celdas[y][x], [x + OFF[0], y + OFF[1]]);
  const abiertas = () => page.evaluate(() => window.__mundo.enlaces.map(e => e.abierto));
  const foto = n => page.screenshot({ path: path.join(SALIDA, n + '.png') });

  const teclas = new Set();
  async function poner(deseadas) {
    for (const t of [...teclas]) if (!deseadas.has(t)) { await page.keyboard.up(t); teclas.delete(t); }
    for (const t of deseadas) if (!teclas.has(t)) { await page.keyboard.down(t); teclas.add(t); }
  }
  async function soltarTodo() { await poner(new Set()); }
  async function ir(tx, ty, { tol = 0.12, orden = 'xy', extra = [], max = 9000 } = {}) {
    const t0 = Date.now();
    for (const eje of orden.split('')) {
      while (Date.now() - t0 < max) {
        const s = await est();
        const d = eje === 'x' ? tx - s.x : ty - s.y;
        if (Math.abs(d) <= tol) break;
        const w = new Set(extra);
        if (eje === 'x') w.add(d > 0 ? 'ArrowRight' : 'ArrowLeft'); else w.add(d > 0 ? 'ArrowDown' : 'ArrowUp');
        await poner(w); await espera(25);
      }
      await poner(new Set(extra));
    }
    await soltarTodo();
  }
  const saltar = () => page.keyboard.press('Space');
  // Mantiene una tecla hasta que se cumpla la condición (o se agote el tiempo) y la suelta enseguida.
  async function hasta(tecla, cond, max = 4000) {
    const t0 = Date.now(); await poner(new Set([tecla]));
    while (Date.now() - t0 < max && !(await page.evaluate(cond, OFF))) await espera(20);
    await soltarTodo(); await espera(150);
  }
  // El campo de pruebas se abre desde el menú (no es el inicio)
  const entrarPruebas = async () => {
    await page.click('#btn-menu'); await page.click('#menu-pruebas');
    await page.waitForFunction(() => window.__mundo && window.__mundo.id === 'pruebas'); await espera(500);
    OFF = [0, 0];
  };
  // Un perfil nuevo pasa por la elección del personaje inicial. Las pruebas viejas empiezan con Pegaso y, salvo que se
  // pida lo contrario, con los seis ya desbloqueados (la tira de seis), como antes de que hubiera que ganarlos.
  const nuevoPerfil = async (pg, nombre, elegido = 'pegaso', conTodos = true) => {
    await pg.fill('#nombre-nuevo', nombre); await pg.click('#form-nuevo button[type=submit]');
    await pg.waitForSelector('#pantalla-eleccion:not([hidden])');
    await pg.click(`#pantalla-eleccion .carta-eleccion[data-id=${elegido}]`);
    if (conTodos) await pg.evaluate(() => ['pegaso', 'minotauro', 'ariadna', 'fenix', 'eco', 'ulises'].forEach(id => window.__desbloquear(id)));
  };
  const bloque = () => page.evaluate(() => window.__mundo.empujables.filter(e => e.tipo === 'bloque').map(e => [e.tx, e.ty])[0]);



  // U1: poder de Ulises (D29). La barca con remo, la boca baja y la tira de seis, en el campo de pruebas.
  async function seccionU1() {
    const eng = /\b(the|and|you|with|press|hold|power|button|close|next|previous)\b/i;
    const J = () => page.evaluate(() => {
      const m = window.__mundo, j = m.jugador, b = m.barcasRemo[0];
      return { id: m.id, x: j.x, y: j.y, z: j.z, pj: j.personaje, aBordo: !!j.aBordo, enSuelo: j.enSuelo, estado: j.estado, bx: b && b.x, by: b && b.y, recogidos: m.coleccionables.filter(c => c.recogido).length };
    });
    const ponerEn = (x, y) => page.evaluate(([x, y]) => { const m = window.__mundo, j = m.jugador; j.x = x; j.y = y; j.z = m.suelo(x, y); j.vz = 0; j.enSuelo = true; j.planeo = false; j.estado = 'jugando'; j.aBordo = null; j.seguro = { x, y, z: j.z }; j.seguroBarca = null; }, [x, y]);
    const barcaA = (x, y) => page.evaluate(([x, y]) => { const b = window.__mundo.barcasRemo[0]; b.x = x; b.y = y; }, [x, y]);
    const elegirU = async id => { await page.click(`.pj[data-id=${id}]`); await espera(150); };
    const enJuego = () => page.waitForFunction(() => { const j = window.__mundo.jugador; return j.estado === 'jugando' && j.enSuelo; }, null, { timeout: 9000 });
    const recargar = async () => {
      // Vuelve al perfil que movió la barca (con varios perfiles guardados, el primero puede ser otro)
      const idx = await page.evaluate(() => {
        const d = JSON.parse(localStorage.getItem('mitos-mundo-abierto-v1')), i = d.perfiles.findIndex(p => p.mundos && p.mundos.pruebas && p.mundos.pruebas.barcas && Object.keys(p.mundos.pruebas.barcas).length);
        return Math.max(0, i);
      });
      await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
      await page.locator('.perfil').nth(idx).click(); await page.waitForFunction(() => window.__mundo); await espera(300);
    };
    await soltarTodo();
    if (await page.evaluate(() => window.__mundo.id) !== 'pruebas') await entrarPruebas();
    OFF = [0, 0];

    // La tira de seis: todos entran, se pueden elegir y ninguno tiene texto en inglés
    const medir = () => page.evaluate(() => {
      const t = document.getElementById('tira').getBoundingClientRect(), bs = [...document.querySelectorAll('#tira .pj')];
      return { ids: bs.map(b => b.dataset.id), dentro: bs.every(b => { const r = b.getBoundingClientRect(); return r.left >= t.left - 1 && r.right <= t.right + 1 && r.width >= 44 && r.height >= 44; }), desborda: document.documentElement.scrollWidth > innerWidth, texto: document.getElementById('tira').innerText };
    });
    let t6 = await medir();
    ok(t6.ids.join() === 'pegaso,minotauro,ariadna,fenix,eco,ulises' && t6.dentro && !t6.desborda, `la tira tiene seis personajes que entran en el celular: ${t6.ids.join()}`);
    const vp = page.viewportSize();
    await page.setViewportSize({ width: 360, height: 640 }); await espera(200);
    t6 = await medir();
    ok(t6.dentro && !t6.desborda, 'los seis entran también en un celular chico (360 de ancho), con botones de 44 px o más');
    await foto('u1-tira-360'); await page.setViewportSize(vp); await espera(200);
    let todos = true;
    for (const id of t6.ids) { await elegirU(id); if ((await J()).pj !== id) todos = false; }
    ok(todos, 'los seis personajes se pueden elegir tocando la tira');
    ok((await page.getAttribute('#btn-poder', 'aria-label')) === 'Navegar', 'con Ulises elegido el botón de poder se llama Navegar (aria-label)');
    const pxU = await page.evaluate(() => { const c = document.querySelector('.pj[data-id=ulises] canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; return k; });
    ok(pxU > 500, `la tira muestra el sprite de Ulises (${pxU} píxeles)`);
    await page.click('#btn-ficha');
    const fU = await page.evaluate(() => ({ nombre: document.getElementById('ficha-nombre').textContent, texto: document.getElementById('ficha-texto').textContent, poder: document.getElementById('ficha-poder-titulo').textContent, todo: document.getElementById('pantalla-ficha').innerText }));
    ok(fU.nombre === 'Ulises' && fU.texto.startsWith('En griego se llama Odiseo') && fU.poder === 'Poder: Navegar' && !eng.test(fU.todo + ' ' + t6.texto), 'la ficha de Ulises se abre en español, sin texto en inglés');
    await page.keyboard.press('KeyI'); await espera(200);

    // Subir, cruzar la boca baja, bajar y recargar: la barca sigue donde se la dejó
    await barcaA(13.5, 32.5);
    await elegirU('ulises'); await ponerEn(12.5, 32.5); await espera(100);
    await page.keyboard.press('KeyE'); await espera(200);
    let s = await J();
    ok(s.aBordo && Math.abs(s.x - s.bx) < 0.01 && Math.abs(s.y - s.by) < 0.01 && s.enSuelo, 'Ulises sube a la barca parado junto a ella');
    await hasta('ArrowRight', () => window.__mundo.barcasRemo[0].x >= 27.6, 11000);
    await foto('u1-orilla-enfrente');
    s = await J();
    ok(s.aBordo && s.bx >= 27.5 && Math.abs(s.by - 32.5) < 0.2 && Math.abs(s.x - s.bx) < 0.01, `la barca cruza la boca baja y llega a la otra orilla (x=${s.bx.toFixed(2)})`);
    await page.keyboard.press('KeyE'); await espera(250);
    s = await J();
    ok(!s.aBordo && s.x > 28 && s.z === 0 && s.enSuelo && s.bx >= 27.5, 'junto a la orilla el botón baja a Ulises y la barca queda en el agua');
    const dejada = s.bx;
    const claves = await page.evaluate(() => Object.keys(window.__mundo.estado().barcas));
    ok(claves.length === 1 && claves[0] === '13,32', 'la barca movida se guarda con clave propia en el estado del mapa');
    await recargar(); await entrarPruebas();
    s = await J();
    ok(Math.abs(s.bx - dejada) < 0.05 && Math.abs(s.by - 32.5) < 0.05, `tras recargar la barca sigue donde la dejó (x=${s.bx.toFixed(2)})`);

    // La boca baja cierra el vuelo
    await elegirU('pegaso'); await ponerEn(12.5, 32.5); await espera(100);
    await poner(new Set(['KeyE', 'ArrowRight'])); await espera(3200); await soltarTodo();
    s = await J();
    ok(s.x < 20 && s.x > 15, `Pegaso en vuelo no pasa por la boca baja (x=${s.x.toFixed(2)})`);
    await enJuego();
    await barcaA(20.5, 32.5);
    await page.evaluate(() => { const j = window.__mundo.jugador; j.x = 18.8; j.y = 32.5; j.z = 1.5; j.vz = 0; j.enSuelo = false; j.planeo = true; j.estado = 'jugando'; j.seguro = { x: 12.5, y: 32.5, z: 0 }; });
    await poner(new Set(['KeyE', 'ArrowRight'])); await espera(1500); await soltarTodo();
    s = await J();
    ok(s.x < 20, `ni siquiera con la barca justo en la boca baja pasa volando (x=${s.x.toFixed(2)})`);
    await enJuego();

    // Cualquiera se para en la barca, pero solo Ulises la mueve; caer al agua devuelve a la barca
    await barcaA(13.5, 32.5);
    await elegirU('minotauro'); await ponerEn(13.5, 32.5); await espera(150);
    const antesM = await J();
    await poner(new Set(['ArrowDown'])); await espera(450); await soltarTodo();
    const aviso = await page.evaluate(() => document.getElementById('aviso').innerText);
    s = await J();
    ok(/La barca la mueve Ulises/.test(aviso) && Math.abs(s.bx - 13.5) < 0.01 && Math.abs(s.by - 32.5) < 0.01, 'otro personaje en la barca no la mueve y recibe la pista "La barca la mueve Ulises"');
    await enJuego(); await espera(150);
    s = await J();
    ok(Math.abs(s.x - 13.5) < 0.1 && Math.abs(s.y - 32.5) < 0.1 && s.recogidos === antesM.recogidos && Math.abs(s.bx - 13.5) < 0.01, 'caer al agua desde la barca reaparece en la barca y no pierde nada');

    // Cambiar de personaje arriba de la barca: el que aparece queda parado en ella
    await elegirU('ulises'); await ponerEn(12.5, 32.5); await espera(100);
    await page.keyboard.press('KeyE'); await espera(200);
    await poner(new Set(['ArrowRight'])); await espera(500); await soltarTodo();
    await elegirU('eco'); await espera(200);
    s = await J();
    ok(s.pj === 'eco' && !s.aBordo && s.enSuelo && Math.abs(s.x - s.bx) < 0.01 && Math.abs(s.y - s.by) < 0.01 && s.bx > 13.6, 'al cambiar de personaje arriba de la barca el nuevo queda parado en ella');

    // Perfil restaurado: una barca guardada donde nadie la alcanza vuelve a su lugar; nadie queda sin barca
    const guardarBarca = pos => page.evaluate(pos => {
      const K = 'mitos-mundo-abierto-v1', d = JSON.parse(localStorage.getItem(K));
      for (const p of d.perfiles) { p.mundos = p.mundos || {}; p.mundos.pruebas = { ...(p.mundos.pruebas || {}), barcas: { '13,32': pos } }; }
      localStorage.setItem(K, JSON.stringify(d));
    }, pos);
    await guardarBarca([16.5, 32.5]); await recargar(); await entrarPruebas();
    s = await J();
    ok(Math.abs(s.bx - 13.5) < 0.01 && Math.abs(s.by - 32.5) < 0.01, 'con la barca restaurada en medio del agua, lejos de la orilla, vuelve a su lugar: nadie queda varado');
    await guardarBarca([27.7, 32.5]); await recargar(); await entrarPruebas();
    s = await J();
    ok(Math.abs(s.bx - 27.7) < 0.01, 'una barca restaurada en una orilla que se alcanza a pie se queda donde estaba');
    await guardarBarca([13.5, 32.5]);
  }
  // La ficha nueva se presenta una sola vez a perfiles anteriores con progreso real.
  async function seccionFichaUlises() {
    const clave = 'mitos-mundo-abierto-v1';
    async function probarPerfil(nombre, cambios, esperaAviso) {
      const c = await browser.newContext({ ...pw.devices['Pixel 7'], serviceWorkers: 'block' });
      const p = await c.newPage();
      p.on('pageerror', e => errores.push(e.message));
      try {
        await p.goto(url);
        const perfil = { id: 'anterior', nombre: 'Anterior', objetos: {}, mundos: {}, personaje: 'eco', vistoCambio: true, mapa: 'mundo', llegada: [11.5, 95.5], eco: null, mundoUnido: true, ...cambios };
        await p.evaluate(([k, perfil]) => localStorage.setItem(k, JSON.stringify({ version: 1, perfiles: [perfil] })), [clave, perfil]);
        await p.reload(); await p.click('.perfil');
        await p.waitForFunction(() => window.__mundo);
        ok(await p.isVisible('#aviso') === esperaAviso && (!esperaAviso || (await p.textContent('#aviso')).includes('Nueva ficha: Ulises')), nombre + ': aviso según progreso');
        if (esperaAviso) {
          ok((await p.evaluate(() => window.__mundo.jugador.personaje)) === 'eco' && !(await p.isVisible('#pantalla-ficha')), nombre + ': el aviso no cambia personaje ni interrumpe con una ficha');
          const guardado = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).perfiles[0], clave);
          ok(JSON.stringify(guardado.objetos) === JSON.stringify(perfil.objetos) && JSON.stringify(guardado.mundos) === JSON.stringify(perfil.mundos) && guardado.fichaUlisesPresentada === true, nombre + ': conserva objetos y mecanismos y guarda la marca');
          if (nombre === 'perfil con objetos') await p.screenshot({ path: path.join(SALIDA, 'ulises-ficha-nueva.png') });
          await p.click('.pj[data-id=ulises]'); await p.click('#btn-ficha');
          ok((await p.textContent('#ficha-nombre')) === 'Ulises' && await p.isVisible('#pantalla-ficha'), nombre + ': se puede consultar la ficha anunciada');
        }
        await p.reload(); await p.click('.perfil'); await p.waitForFunction(() => window.__mundo);
        ok(!(await p.isVisible('#aviso')), nombre + ': no repite el aviso tras recargar');
      } finally { await c.close(); }
    }
    await probarPerfil('perfil con objetos', { objetos: { 'hacha-doble': true } }, true);
    await probarPerfil('perfil con mecanismos', { mundos: { mundo: { muros: ['5,62'], rejas: [], empujables: {} } } }, true);
    await probarPerfil('perfil anterior sin progreso', { mundos: { mundo: { muros: [], rejas: [], empujables: {} } } }, false);
    await probarPerfil('perfil ya informado', { objetos: { 'hacha-doble': true }, fichaUlisesPresentada: true }, false);
  }
  await seccionFichaUlises();

  // Desbloqueo de personajes con charlas: elección inicial, tira, habilidades, motor de charlas, Teseo y migración.
  async function seccionDesbloqueo() {
    const clave = 'mitos-mundo-abierto-v1';
    const eng = /\b(the|and|you|with|press|hold|power|button|close|next|previous|talk|speak)\b/i;
    const nuevaPag = async () => {
      const c = await browser.newContext({ ...pw.devices['Pixel 7'], serviceWorkers: 'block' });
      const p = await c.newPage();
      p.on('pageerror', e => errores.push(e.message));
      p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
      return { c, p };
    };
    const tira = p => p.evaluate(() => [...document.querySelectorAll('#tira .pj')].filter(b => !b.hidden).map(b => b.dataset.id));
    const guardado = (p, nombre) => p.evaluate(([k, n]) => JSON.parse(localStorage.getItem(k)).perfiles.find(q => q.nombre === n), [clave, nombre]);
    const activo = p => p.evaluate(() => window.__mundo.jugador.personaje);
    const junto = p => p.evaluate(() => { const m = window.__mundo, q = m.interlocutores[0], j = m.jugador; j.x = q.x - 1.0; j.y = q.y; j.z = 0; j.vz = 0; j.enSuelo = true; j.estado = 'jugando'; j.seguro = { x: j.x, y: j.y, z: 0 }; });
    const lejos = p => p.evaluate(() => { const m = window.__mundo, j = m.jugador; j.x = m.interlocutores[0].x - 7; j.y = m.interlocutores[0].y + 4; j.z = 0; j.vz = 0; j.enSuelo = true; j.estado = 'jugando'; j.seguro = { x: j.x, y: j.y, z: 0 }; });
    const opciones = p => p.evaluate(() => [...document.querySelectorAll('#charla-opciones .opcion-charla')].map(b => b.querySelector('.tx').textContent));
    const abrirCharla = async p => { await p.waitForSelector('#btn-hablar:not([hidden])', { timeout: 3000 }); await p.click('#btn-hablar'); await p.waitForSelector('#pantalla-charla:not([hidden])'); };
    const elegir = async (p, texto) => { await p.click(`#charla-opciones .opcion-charla:has-text("${texto}")`); };
    const entrar = async (p, nombre) => { await p.reload(); await p.waitForSelector('#pantalla-perfiles:not([hidden])'); await p.click(`.perfil:has-text("${nombre}")`); await p.waitForFunction(() => window.__mundo); await espera(300); };

    // (e) Datos: las siete habilidades de los seis y el Minotauro bajo llave por un campo de datos
    const ESPERADAS = {
      pegaso: [7, 5, 8, 8, 2, 7, 9], minotauro: [9, 3, 7, 2, 1, 3, 6], ariadna: [3, 10, 8, 2, 4, 8, 5],
      fenix: [4, 6, 7, 10, 2, 7, 8], eco: [1, 5, 4, 7, 2, 6, 6], ulises: [5, 10, 8, 1, 8, 6, 5],
    };
    const CLAVES = ['fuerza', 'astucia', 'valentia', 'magia', 'liderazgo', 'bondad', 'velocidad'];
    const pj = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos/personajes.json'), 'utf8')).personajes;
    ok(Object.entries(ESPERADAS).every(([id, v]) => { const h = pj.find(q => q.id === id)?.habilidades; return h && CLAVES.every((k, i) => h[k] === v[i]) && Object.keys(h).length === 7; }),
      'los seis personajes traen las siete habilidades (con velocidad) con los valores pedidos');
    ok(!pj.some(q => q.bajoLlave), 'ningún personaje trae marca de bajo llave: el perfil nuevo empieza solo con el elegido');

    let { c, p } = await nuevaPag();
    try {
      // Motor de charlas (lógica pura) y datos de Teseo
      await p.goto(url); await p.waitForSelector('#pantalla-perfiles:not([hidden])');
      const motor = await p.evaluate(async () => {
        const ch = await import('./charlas.js'), ind = await (await fetch('datos/charlas/indice.json')).json(), cs = await Promise.all(ind.charlas.map(async i => (await fetch(`datos/charlas/${i}.json`)).json())), d = { charlas: cs }, t = cs.find(q => q.id === 'teseo');
        const txt = s => s.opciones().map(o => o.texto);
        const s0 = ch.crearSesion(t), a = txt(s0);
        const s1 = ch.crearSesion(t, { saberes: { hilo: true, asterion: true } }), b = txt(s1);
        const s2 = ch.crearSesion(t, { saberes: { hilo: true, asterion: true }, resuelta: true }), r = txt(s2);
        const e = ch.crearSesion(t); e.elegir(0); e.elegir(0); e.elegir(0); e.elegir(0);
        const f = e.elegir(0);
        return { problemas: d.charlas.flatMap(q => ch.validarCharla(q)), a, b, r, nodo: e.nodoId, efecto: f.efecto, fin: f.fin, nivel: t.nivel, estado: t.estado, hab: t.habilidades };
      });
      ok(motor.problemas.length === 0, 'las charlas de datos están bien armadas (destinos y textos)' + (motor.problemas.length ? ': ' + motor.problemas.join('; ') : ''));
      ok(motor.a.join('|') === '¿Cómo pensabas salir?|¿Quién vivía en el laberinto?' && motor.b.join('|') === 'Ya entendí' && motor.r.join('|') === '¿Cómo pensabas salir?|¿Quién vivía en el laberinto?|Ya entendí',
        'motor: las preguntas contestadas se ocultan, "Ya entendí" pide los dos saberes y, resuelta, se ofrece el repaso completo');
      ok(motor.nodo === 'n4' && motor.efecto && motor.efecto.desbloquea[0] === 'minotauro' && motor.efecto.carta === 'teseo' && motor.fin === false && motor.nivel === 'dorado' && motor.estado === 'borrador' && motor.hab.astucia === 9,
        'motor: llegar a cierre trae el efecto (desbloquea al Minotauro, carta de Teseo) y Teseo es dorado, en borrador, con sus habilidades');

      // (a) Elección inicial: perfil nuevo -> seis tarjetas, Ariadna primera
      await p.fill('#nombre-nuevo', 'Eleg'); await p.click('#form-nuevo button[type=submit]');
      await p.waitForSelector('#pantalla-eleccion:not([hidden])'); await espera(300);
      const ids = await p.evaluate(() => [...document.querySelectorAll('#eleccion-lista .carta-eleccion')].map(b => b.dataset.id));
      ok(ids.join() === 'ariadna,minotauro,pegaso,fenix,eco,ulises', `un perfil nuevo muestra la elección de los seis, con Ariadna primera (${ids.join()})`);
      ok(await p.evaluate(([k]) => !localStorage.getItem(k) || JSON.parse(localStorage.getItem(k)).perfiles.length === 0, [clave]) && await p.evaluate(() => !window.__mundo), 'el perfil no se crea ni se entra al mundo hasta elegir');
      ok(!eng.test(await p.evaluate(() => document.getElementById('pantalla-eleccion').innerText)), 'la elección inicial no tiene texto en inglés');
      const tam = await p.evaluate(() => { const b = document.querySelector('#eleccion-lista .carta-eleccion').getBoundingClientRect(), d = document.documentElement; return { w: b.width, h: b.height, desborda: d.scrollWidth > innerWidth }; });
      ok(tam.w >= 120 && tam.h >= 120 && !tam.desborda, `las tarjetas son grandes (${Math.round(tam.w)}x${Math.round(tam.h)}) y no desbordan`);
      ok(await p.evaluate(() => { const c = document.querySelector('.carta-eleccion[data-id=pegaso] canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; return k > 500; }), 'las tarjetas traen el retrato dibujado');
      await foto('desbloqueo-eleccion');
      await p.click('.carta-eleccion[data-id=ariadna]'); await p.waitForFunction(() => window.__mundo); await espera(300);
      ok(await activo(p) === 'ariadna' && (await tira(p)).join() === 'ariadna', `elegir Ariadna la deja activa y la tira muestra solo a Ariadna (${(await tira(p)).join()})`);
      let g = await guardado(p, 'Eleg');
      ok(g.personaje === 'ariadna' && g.desbloqueados.join() === 'ariadna', 'el perfil guarda como único desbloqueado al personaje elegido');
      ok(g.desbloqueoIncorporado === true && typeof g.saberes === 'object' && typeof g.charlas === 'object' && typeof g.cartas === 'object', 'el perfil trae saberes, charlas y cartas');
      await p.keyboard.press('Digit1'); await espera(100);
      const d1 = await activo(p); await p.keyboard.press('Digit6'); await espera(100);
      ok(d1 === 'ariadna' && await activo(p) === 'ariadna', 'los números eligen solo entre los desbloqueados (con uno solo, no cambian nada)');

      // Ficha con las siete habilidades; las flechas no revelan al que sigue bajo llave
      await p.click('#btn-ficha'); await espera(150);
      const fh = await p.evaluate(() => [...document.querySelectorAll('#ficha-habilidades li')].map(li => [li.querySelector('.hab-nombre').textContent, +li.querySelector('.hab-valor').textContent, li.querySelectorAll('.hab-barra i.lleno').length, li.querySelectorAll('.hab-barra i').length]));
      ok(fh.map(f => f[0]).join() === 'Fuerza,Astucia,Valentía,Magia,Liderazgo,Bondad,Velocidad' && fh.map(f => f[1]).join() === ESPERADAS.ariadna.join() && fh.every(f => f[2] === f[1] && f[3] === 10),
        `la ficha de Ariadna muestra las siete habilidades con nombre en español y barras de 1 a 10 (${fh.map(f => f[1]).join(' ')})`);
      await p.click('#ficha-siguiente'); await espera(100);
      ok((await p.textContent('#ficha-nombre')) === 'Ariadna', 'con un solo desbloqueado las flechas de la ficha no muestran a nadie más');
      ok(!eng.test(await p.evaluate(() => document.getElementById('pantalla-ficha').innerText)), 'la ficha con habilidades no tiene texto en inglés');
      await p.click('#ficha-cerrar'); await espera(200);

      // (c) Teseo: el botón aparece solo cerca
      await lejos(p); await espera(250);
      ok(!(await p.isVisible('#btn-hablar')), 'lejos de Teseo no aparece el botón de hablar');
      await junto(p); await espera(250);
      ok(await p.isVisible('#btn-hablar') && (await p.getAttribute('#btn-hablar', 'aria-label')) === 'Hablar' && (await p.textContent('#btn-hablar')).replace(/\s+/g, '').replace(/T$/, '') === '',
        'junto a Teseo aparece el botón de hablar, solo con ícono (nombre accesible "Hablar")');
      await p.evaluate(() => window.__desbloquear('pegaso'));
      await p.click('#btn-ficha'); await espera(150);
      const visto = [];
      for (let i = 0; i < 2; i++) { visto.push(await p.textContent('#ficha-nombre')); await p.click('#ficha-siguiente'); }
      ok(new Set(visto).size === 2 && !visto.includes('Minotauro'), `las fichas recorren solo a los desbloqueados (${visto.join(', ')})`);
      await p.click('#ficha-cerrar'); await espera(200);
      // (g) El poder se comporta igual: Pegaso sigue volando con el botón de poder aunque haya un interlocutor cerca
      await p.click('.pj[data-id=pegaso]'); await espera(100);
      await p.keyboard.down('KeyE'); await espera(700);
      const zVuelo = await p.evaluate(() => window.__mundo.jugador.z);
      await p.keyboard.up('KeyE');
      ok(zVuelo > 0.5 && !(await p.isVisible('#pantalla-charla')) && (await p.getAttribute('#btn-poder', 'aria-label')) === 'Volar', `el poder de Pegaso vuela igual junto a un interlocutor (z ${zVuelo.toFixed(2)}) y no abre la charla`);
      await p.waitForFunction(() => { const j = window.__mundo.jugador; return j.enSuelo && j.estado === 'jugando'; }, null, { timeout: 8000 });
      await p.click('.pj[data-id=ariadna]'); await junto(p); await espera(250);
      const antes = await p.evaluate(() => ({ x: window.__mundo.jugador.x, y: window.__mundo.jugador.y }));
      await abrirCharla(p);
      const t0 = await p.textContent('#charla-texto');
      ok(t0.startsWith('Soy Teseo, príncipe de Atenas.') && (await p.textContent('#charla-nombre')) === 'Teseo', 'hablar abre la charla con el texto del nodo inicial y el nombre de Teseo');
      ok((await opciones(p)).join('|') === '¿Cómo pensabas salir?|¿Quién vivía en el laberinto?', 'el nodo inicial ofrece las dos preguntas (todavía no "Ya entendí")');
      const bs = await p.evaluate(() => [...document.querySelectorAll('#charla-opciones .opcion-charla')].map(b => { const r = b.getBoundingClientRect(); return [r.height, r.width, r.top]; }));
      ok(bs.every(b => b[0] >= 48) && bs[1][2] > bs[0][2] && !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `las opciones son botones de 48 px o más, apilados (${bs.map(b => Math.round(b[0])).join(', ')} px)`);
      ok(!eng.test(await p.evaluate(() => document.getElementById('pantalla-charla').innerText)), 'la charla no tiene texto en inglés');
      await foto('desbloqueo-charla-1');
      // El juego queda en pausa mientras dura la charla
      await p.keyboard.down('ArrowUp'); await espera(300); await p.keyboard.up('ArrowUp');
      const pausa = await p.evaluate(() => ({ x: window.__mundo.jugador.x, y: window.__mundo.jugador.y }));
      ok(Math.abs(pausa.x - antes.x) < 0.01 && Math.abs(pausa.y - antes.y) < 0.01, 'con la charla abierta el juego está en pausa (el personaje no se mueve)');
      await elegir(p, '¿Cómo pensabas salir?');
      ok((await p.textContent('#charla-texto')).includes('ovillo de hilo') && (await opciones(p)).join() === 'Seguir', 'la primera pregunta lleva a su nodo, con un botón para seguir');
      await foto('desbloqueo-charla-2');
      // Cerrar a mitad no pierde lo aprendido (f): vuelve a empezar, pero la pregunta ya contestada no se ofrece
      await p.keyboard.press('Escape'); await espera(200);
      ok(!(await p.isVisible('#pantalla-charla')), 'Escape cierra la charla y el juego sigue');
      g = await guardado(p, 'Eleg');
      ok(g.saberes.hilo === true && !g.saberes.asterion && !g.charlas.teseo, 'lo aprendido se guarda al momento (el saber del hilo) y la charla sigue sin resolver');
      await entrar(p, 'Eleg');
      g = await guardado(p, 'Eleg');
      ok(g.saberes.hilo === true, 'un saber no se pierde al recargar la página');
      await junto(p); await espera(250);
      await p.keyboard.press('KeyT'); await p.waitForSelector('#pantalla-charla:not([hidden])');
      ok((await p.textContent('#charla-texto')).startsWith('Soy Teseo') && (await opciones(p)).join() === '¿Quién vivía en el laberinto?', 'la tecla T también abre la charla, que arranca de nuevo con la pregunta que falta');
      await p.keyboard.press('Digit1');
      ok((await p.textContent('#charla-texto')).includes('Asterión'), 'las teclas numéricas eligen la opción');
      await p.keyboard.press('Enter');
      ok((await opciones(p)).join() === 'Ya entendí', 'con los dos saberes se habilita "Ya entendí"');
      ok(!(await p.isVisible('#aviso')) && !(await tira(p)).includes('minotauro'), 'hasta entonces el Minotauro sigue sin aparecer');
      await p.keyboard.press('Space');
      ok((await p.textContent('#charla-texto')).includes('Asterión no eligió su laberinto'), 'el nodo de cierre llega con Enter o Espacio');
      const jAntes = await activo(p);
      await p.keyboard.press('Digit1'); await espera(250);
      ok(!(await p.isVisible('#pantalla-charla')), 'la charla termina con "Gracias"');
      ok((await tira(p)).join() === 'pegaso,minotauro,ariadna' && await activo(p) === jAntes, 'al cerrar el Minotauro aparece en la tira sin cambiar al personaje activo');
      ok(await p.isVisible('#aviso') && (await p.textContent('#aviso')).includes('Se suma un personaje') && (await p.textContent('#aviso')).includes('Minotauro'), 'aparece el aviso "Se suma un personaje" con el nombre');
      await foto('desbloqueo-tira-con-minotauro');
      g = await guardado(p, 'Eleg');
      ok(g.desbloqueados.includes('minotauro') && g.cartas.teseo === true && g.charlas.teseo?.resuelta === true && g.saberes.asterion === true, 'se guardan el Minotauro desbloqueado, la carta de Teseo y la charla resuelta');
      await entrar(p, 'Eleg');
      ok((await tira(p)).includes('minotauro') && !(await p.isVisible('#aviso')), 'tras recargar el Minotauro sigue en la tira y no se repite el aviso');
      await p.click('.pj[data-id=minotauro]'); await espera(100);
      ok(await activo(p) === 'minotauro' && (await p.getAttribute('#btn-poder', 'aria-label')) === 'Embestir', 'el Minotauro desbloqueado se puede elegir');
      // Repaso: la charla resuelta ofrece las preguntas y "Ya entendí" sin dar nada nuevo
      await junto(p); await espera(250); await abrirCharla(p);
      ok((await opciones(p)).join('|') === '¿Cómo pensabas salir?|¿Quién vivía en el laberinto?|Ya entendí', 'después de resuelta, Teseo ofrece repasar: las dos preguntas y "Ya entendí"');
      const antesRepaso = JSON.stringify(await guardado(p, 'Eleg'));
      await elegir(p, '¿Quién vivía en el laberinto?'); await elegir(p, 'Seguir'); await elegir(p, 'Ya entendí'); await elegir(p, 'Gracias'); await espera(200);
      ok(JSON.stringify(await guardado(p, 'Eleg')) === antesRepaso && !(await p.isVisible('#aviso')), 'repasar no cambia nada del guardado ni repite el aviso');
      await p.click('#btn-menu'); await p.click('#menu-seguir'); await espera(100);
    } finally { await c.close(); }

    // (b) Elegir al Minotauro al empezar lo deja en la tira (los seis) y activo
    ({ c, p } = await nuevaPag());
    try {
      await p.goto(url); await p.waitForSelector('#pantalla-perfiles:not([hidden])');
      await p.fill('#nombre-nuevo', 'Mino'); await p.click('#form-nuevo button[type=submit]');
      await p.waitForSelector('#pantalla-eleccion:not([hidden])');
      await p.click('#eleccion-volver');
      ok(await p.isVisible('#pantalla-perfiles') && (await p.inputValue('#nombre-nuevo')) === 'Mino', 'volver de la elección regresa a los perfiles sin perder el nombre');
      await p.click('#form-nuevo button[type=submit]'); await p.waitForSelector('#pantalla-eleccion:not([hidden])');
      await p.click('.carta-eleccion[data-id=minotauro]'); await p.waitForFunction(() => window.__mundo); await espera(300);
      ok(await activo(p) === 'minotauro' && (await tira(p)).join() === 'minotauro', 'elegir al Minotauro al inicio lo deja activo y solo en la tira');
      // Ya lo tiene: terminar la charla no repite el aviso, pero guarda la carta
      await junto(p); await espera(250); await abrirCharla(p);
      await elegir(p, '¿Quién vivía en el laberinto?'); await elegir(p, 'Seguir'); await elegir(p, '¿Cómo pensabas salir?'); await elegir(p, 'Seguir');
      await elegir(p, 'Ya entendí'); await elegir(p, 'Gracias'); await espera(250);
      const gm = await guardado(p, 'Mino');
      ok(!(await p.isVisible('#aviso')) && gm.cartas.teseo === true && gm.charlas.teseo?.resuelta === true && gm.desbloqueados.length === 1, 'si ya tiene al Minotauro, la charla (en el otro orden) no repite el aviso y guarda la carta');
    } finally { await c.close(); }

    // (d) Un perfil anterior, sin las claves nuevas, se migra con los seis y entra directo
    ({ c, p } = await nuevaPag());
    try {
      await p.goto(url);
      const viejo = { id: 'anterior', nombre: 'Anterior', objetos: { 'hacha-doble': true }, mundos: { mundo: { muros: ['5,62'], rejas: [], empujables: {} } }, personaje: 'eco', vistoCambio: true, mapa: 'mundo', llegada: [11.5, 109.5], eco: null, mundoUnido: true, canalIncorporado: true, fichaUlisesPresentada: true };
      await p.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify({ version: 1, perfiles: [v] })), [clave, viejo]);
      await p.reload(); await p.waitForSelector('#pantalla-perfiles:not([hidden])');
      await p.click('.perfil'); await p.waitForFunction(() => window.__mundo); await espera(300);
      ok(!(await p.isVisible('#pantalla-eleccion')) && await activo(p) === 'eco', 'un perfil existente entra directo, sin la pantalla de elección');
      g = await guardado(p, 'Anterior');
      ok(g.desbloqueados.slice().sort().join() === ['ariadna', 'eco', 'fenix', 'minotauro', 'pegaso', 'ulises'].join() && g.desbloqueoIncorporado === true && g.saberes && g.charlas && g.cartas
        && JSON.stringify(g.mundos) === JSON.stringify(viejo.mundos) && JSON.stringify(g.objetos) === JSON.stringify(viejo.objetos), 'la migración deja los seis desbloqueados y las claves nuevas sin tocar objetos ni mundos');
      ok((await tira(p)).join() === 'pegaso,minotauro,ariadna,fenix,eco,ulises', 'el perfil migrado ve los seis en la tira');
      await junto(p); await espera(250); await abrirCharla(p);
      await elegir(p, '¿Quién vivía en el laberinto?'); await elegir(p, 'Seguir'); await elegir(p, '¿Cómo pensabas salir?'); await elegir(p, 'Seguir');
      await elegir(p, 'Ya entendí'); await elegir(p, 'Gracias'); await espera(250);
      g = await guardado(p, 'Anterior');
      ok(!(await p.isVisible('#aviso')) && g.cartas.teseo === true && g.charlas.teseo?.resuelta === true, 'en el perfil migrado (el Minotauro ya está) la charla no repite el aviso y guarda la carta');
      await entrar(p, 'Anterior');
      g = await guardado(p, 'Anterior');
      ok(g.desbloqueados.length === 6 && g.saberes.hilo === true && g.saberes.asterion === true && g.cartas.teseo === true, 'lo aprendido y ganado sigue ahí tras recargar');
    } finally { await c.close(); }

    // ---- Sesión 2: los seis se desbloquean de verdad ----
    const juntoA = (p, id) => p.evaluate(i => {
      const m = window.__mundo, q = [...m.interlocutores, ...m.interactivos].find(z => z.id === i), j = m.jugador;
      j.x = q.x - 1.0; j.y = q.y; j.z = 0; j.vz = 0; j.enSuelo = true; j.estado = 'jugando'; j.seguro = { x: j.x, y: j.y, z: 0 };
    }, id);
    const crearYEntrar = async (p, nombre, elegido) => {
      await p.goto(url); await p.waitForSelector('#pantalla-perfiles:not([hidden])');
      await p.fill('#nombre-nuevo', nombre); await p.click('#form-nuevo button[type=submit]');
      await p.waitForSelector('#pantalla-eleccion:not([hidden])');
      await p.click(`.carta-eleccion[data-id=${elegido}]`); await p.waitForFunction(() => window.__mundo); await espera(300);
    };

    // (a) Cada uno de los seis, elegido al empezar, arranca solo en la tira
    for (const id of ['pegaso', 'minotauro', 'ariadna', 'fenix', 'eco', 'ulises']) {
      ({ c, p } = await nuevaPag());
      try {
        await crearYEntrar(p, 'Solo', id);
        const g = await guardado(p, 'Solo');
        ok((await tira(p)).join() === id && g.desbloqueados.join() === id && await activo(p) === id, `un perfil nuevo que elige a ${id} arranca con solo ${id} en la tira`);
      } finally { await c.close(); }
    }

    // (b) Todo lo que desbloquea se alcanza a pie desde el inicio, sin poderes: búsqueda por casillas de suelo común
    ({ c, p } = await nuevaPag());
    try {
      await crearYEntrar(p, 'Alcance', 'ulises');
      const r = await p.evaluate(() => {
        const m = window.__mundo, firmes = new Set(['.', ',', 'p', 'S']);
        const firme = (x, y) => x >= 0 && y >= 0 && x < m.cols && y < m.rows && firmes.has(m.origen[y][x]);
        const ini = [Math.floor(m.jugador.x), Math.floor(m.jugador.y)], vistos = new Set([ini.join()]), cola = [ini];
        while (cola.length) {
          const [x, y] = cola.shift();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const a = x + dx, b = y + dy;
            if (!vistos.has(a + ',' + b) && firme(a, b)) { vistos.add(a + ',' + b); cola.push([a, b]); }
          }
        }
        const blancos = [...m.interlocutores, ...m.interactivos].map(q => {
          const cx = Math.floor(q.x), cy = Math.floor(q.y);
          const hablable = [...vistos].some(k => { const [a, b] = k.split(',').map(Number); return Math.hypot(a + 0.5 - q.x, b + 0.5 - q.y) <= 1.5; });
          return { id: q.id, enSuelo: firme(cx, cy) && m.origen[cy][cx] !== 'b', alcanzable: vistos.has(cx + ',' + cy), hablable };
        });
        return blancos;
      });
      const necesarios = ['teseo', 'dedalo', 'narciso', 'nausicaa', 'fuente-musas', 'cenizas'];
      ok(necesarios.every(id => r.some(q => q.id === id)), `el mundo trae los seis puntos de desbloqueo (${r.map(q => q.id).join(', ')})`);
      for (const q of r) ok(q.enSuelo && q.alcanzable && q.hablable, `a pie y sin poderes se llega a ${q.id} (suelo firme: ${q.enSuelo}, alcanzable: ${q.alcanzable})`);
      // Caminando de verdad: entrar al taller de Dédalo por su puerta abierta y poder hablarle
      await p.evaluate(() => { const j = window.__mundo.jugador; j.x = 6.5; j.y = 97.5; j.z = 0; j.vz = 0; j.enSuelo = true; j.estado = 'jugando'; });
      await espera(200);
      ok(!(await p.isVisible('#btn-hablar')), 'afuera del taller el botón de hablar no aparece');
      await p.keyboard.down('ArrowUp');
      const t0 = Date.now();
      while (Date.now() - t0 < 4000 && !(await p.isVisible('#btn-hablar'))) await espera(30);
      await p.keyboard.up('ArrowUp');
      const yd = await p.evaluate(() => window.__mundo.jugador.y);
      ok(await p.isVisible('#btn-hablar') && yd < 95, `caminando por la entrada se llega a Dédalo dentro del taller (y ${yd.toFixed(2)})`);
    } finally { await c.close(); }

    // (c) y (e) Cada charla, completada, desbloquea a su personaje, guarda la carta y queda tras recargar; si ya está, sin aviso
    const CHARLAS = [
      { id: 'dedalo', suma: 'ariadna', elegido: 'pegaso', carta: 'dedalo', pasos: ['¿Qué estás armando?', 'Para que la ala se curve', 'Seguir', 'Dicen que hiciste el laberinto.', '¿Cómo se sale de ahí?', 'Seguir', 'Ya entendí', 'Gracias'] },
      { id: 'narciso', suma: 'eco', elegido: 'pegaso', carta: 'narciso', pasos: ['¿Qué ves?', 'Seguir', '¿Conocés a una ninfa llamada Eco?', 'Seguir', 'Creo que ya entendí', 'Voy a buscarla'] },
      { id: 'nausicaa', suma: 'ulises', elegido: 'pegaso', carta: 'nausicaa', pasos: ['¿Quién era?', 'Seguir', '¿Y qué hiciste?', 'Seguir', 'Creo que ya entendí', 'Gracias'] },
    ];
    for (const ch of CHARLAS) {
      ({ c, p } = await nuevaPag());
      try {
        const nom = 'C' + ch.id.slice(0, 5);
        await crearYEntrar(p, nom, ch.elegido);
        await juntoA(p, ch.id); await espera(250); await abrirCharla(p);
        ok((await p.textContent('#charla-nombre')).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === ch.id, `hablar cerca abre la charla de ${ch.id}`);
        for (let i = 0; i < ch.pasos.length; i++) {
          if (ch.id === 'narciso' && i === 4) ok(!(await tira(p)).includes(ch.suma), `${ch.id}: antes del cierre ${ch.suma} sigue bajo llave`);
          await elegir(p, ch.pasos[i]); await espera(60);
        }
        await espera(250);
        let g = await guardado(p, nom);
        ok((await tira(p)).includes(ch.suma) && g.desbloqueados.includes(ch.suma) && g.cartas[ch.carta] === true && g.charlas[ch.id]?.resuelta === true, `la charla de ${ch.id} desbloquea a ${ch.suma}, guarda la carta y queda resuelta`);
        ok(await p.isVisible('#aviso') && (await p.textContent('#aviso')).includes('Se suma un personaje'), `${ch.id}: aparece el aviso de personaje nuevo`);
        await entrar(p, nom); g = await guardado(p, nom);
        ok((await tira(p)).includes(ch.suma) && !(await p.isVisible('#aviso')) && g.cartas[ch.carta] === true, `${ch.id}: tras recargar ${ch.suma} sigue en la tira y no se repite el aviso`);
      } finally { await c.close(); }
      // (e) Si ya se tiene a ese personaje, la charla no repite el aviso
      ({ c, p } = await nuevaPag());
      try {
        const nom = 'Y' + ch.id.slice(0, 5);
        await crearYEntrar(p, nom, ch.suma);
        await juntoA(p, ch.id); await espera(250); await abrirCharla(p);
        for (const t of ch.pasos) { await elegir(p, t); await espera(60); }
        await espera(250);
        const g = await guardado(p, nom);
        ok(!(await p.isVisible('#aviso')) && g.desbloqueados.length === 1 && g.cartas[ch.carta] === true && g.charlas[ch.id]?.resuelta === true, `${ch.id}: si ya tiene a ${ch.suma} no hay aviso repetido y igual guarda la carta`);
      } finally { await c.close(); }
    }

    // (d) La fuente de las Musas y las cenizas: objetos que desbloquean a Pegaso y Fénix, y quedan usados
    ({ c, p } = await nuevaPag());
    try {
      await crearYEntrar(p, 'Objetos', 'ariadna');
      await juntoA(p, 'fuente-musas'); await espera(250);
      // (g) el botón de poder no usa el objeto
      await p.keyboard.down('KeyE'); await espera(300); await p.keyboard.up('KeyE'); await espera(150);
      let g = await guardado(p, 'Objetos');
      ok(!(await tira(p)).includes('pegaso') && !(g.usados || {})['fuente-musas'] && (await p.getAttribute('#btn-poder', 'aria-label')) === 'Hilo', 'junto a la fuente el botón de poder sigue siendo el poder y no la usa');
      ok(await p.isVisible('#btn-hablar'), 'junto a la fuente aparece el botón de interacción');
      await p.keyboard.press('KeyT'); await espera(250);
      g = await guardado(p, 'Objetos');
      ok(await p.isVisible('#aviso') && (await p.textContent('#aviso')).includes('Una fuente brota') && (await p.textContent('#aviso')).includes('Pegaso se suma'), 'usar la fuente muestra su aviso');
      ok((await tira(p)).join() === 'pegaso,ariadna' && g.usados['fuente-musas'] === true && g.desbloqueados.includes('pegaso'), 'la fuente desbloquea a Pegaso y queda usada en el perfil');
      await juntoA(p, 'cenizas'); await espera(250);
      await p.click('#btn-hablar'); await espera(250);
      g = await guardado(p, 'Objetos');
      ok(await p.isVisible('#aviso') && (await p.textContent('#aviso')).includes('Entre las cenizas') && (await tira(p)).join() === 'pegaso,ariadna,fenix' && g.usados.cenizas === true, 'las cenizas muestran su aviso, desbloquean al Fénix y quedan usadas');
      ok(!eng.test(await p.evaluate(() => document.getElementById('aviso').innerText)), 'los avisos de los objetos no tienen texto en inglés');
      await entrar(p, 'Objetos'); g = await guardado(p, 'Objetos');
      ok((await tira(p)).join() === 'pegaso,ariadna,fenix' && !(await p.isVisible('#aviso')) && g.usados['fuente-musas'] === true && g.usados.cenizas === true
        && await p.evaluate(() => window.__mundo.interactivos.every(q => q.usado)), 'tras recargar siguen desbloqueados y usados, sin aviso, y los objetos no desaparecen');
      await juntoA(p, 'fuente-musas'); await espera(250);
      ok(!(await p.isVisible('#aviso')), 'usado, el objeto sigue ahí y no repite nada');
      await p.keyboard.press('KeyT'); await espera(250);
      ok(!(await p.isVisible('#aviso')) && (await tira(p)).length === 3, 'volver a usar un objeto ya usado no cambia nada');
    } finally { await c.close(); }
    ({ c, p } = await nuevaPag());
    try {
      await crearYEntrar(p, 'Dos', 'pegaso');
      await juntoA(p, 'fuente-musas'); await espera(250); await p.keyboard.press('KeyT'); await espera(250);
      const g = await guardado(p, 'Dos');
      ok(!(await p.isVisible('#aviso')) && g.desbloqueados.join() === 'pegaso' && g.usados['fuente-musas'] === true, 'si ya tiene a Pegaso, la fuente no repite el aviso ni duplica nada');
    } finally { await c.close(); }

    // (f) Un perfil existente no pierde nada con lo nuevo
    ({ c, p } = await nuevaPag());
    try {
      await p.goto(url);
      const viejo = { id: 'previo', nombre: 'Previo', objetos: { 'hacha-doble': true }, mundos: { mundo: { muros: ['5,62'], rejas: [], empujables: {} } }, personaje: 'eco', vistoCambio: true, mapa: 'mundo', llegada: [11.5, 109.5], eco: null, mundoUnido: true, canalIncorporado: true, fichaUlisesPresentada: true,
        desbloqueoIncorporado: true, desbloqueados: ['pegaso', 'fenix', 'ariadna', 'eco', 'ulises'], saberes: { hilo: true }, charlas: {}, cartas: {} };
      await p.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify({ version: 1, perfiles: [v] })), [clave, viejo]);
      await p.reload(); await p.waitForSelector('#pantalla-perfiles:not([hidden])');
      await p.click('.perfil'); await p.waitForFunction(() => window.__mundo); await espera(300);
      const g = await guardado(p, 'Previo');
      ok(g.desbloqueados.join() === viejo.desbloqueados.join() && JSON.stringify(g.mundos) === JSON.stringify(viejo.mundos) && JSON.stringify(g.objetos) === JSON.stringify(viejo.objetos) && g.saberes.hilo === true,
        'un perfil guardado antes (cinco desbloqueados) conserva exactamente lo suyo');
      ok((await tira(p)).join() === 'pegaso,ariadna,fenix,eco,ulises', 'su tira sigue igual: nada se bloquea ni se agrega');
    } finally { await c.close(); }

    // (h) Los textos de las charlas y de los objetos caben en el celular
    {
      const dir = path.join(RAIZ, 'datos/charlas'), ind = JSON.parse(fs.readFileSync(path.join(dir, 'indice.json'), 'utf8')).charlas;
      let pasadas = [];
      for (const id of ind) {
        const ch = JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8'));
        for (const [nid, n] of Object.entries(ch.nodos)) {
          if (n.texto.length > 220) pasadas.push(`${id}.${nid} (${n.texto.length})`);
          for (const o of n.opciones) if (o.texto.length > 60) pasadas.push(`${id}.${nid} opción (${o.texto.length})`);
        }
      }
      ok(ind.join() === 'teseo,dedalo,narciso,nausicaa' && pasadas.length === 0, 'las cuatro charlas respetan ~220 caracteres por pantalla y ~60 por opción' + (pasadas.length ? ': ' + pasadas.join(', ') : ''));
      const inter = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos/mapa-mundo.json'), 'utf8')).interactivos;
      ok(inter.length === 2 && inter.every(q => q.titulo.length <= 60 && q.texto.length <= 220 && !eng.test(q.titulo + ' ' + q.texto)), 'los textos de los objetos interactivos caben y no están en inglés');
    }
  }
  await seccionDesbloqueo();
  await require('./probar-canal-navegador')(browser, url, SALIDA, ok);
  // Ambiente interactivo (D35): el botón de poder también llama al animal más cercano. Corre en el mundo, con Pegaso.
  async function seccionAmbiente() {
    ok((await page.$('#btn-poder .etiqueta')) === null && (await page.getAttribute('#btn-poder', 'aria-label')).length > 0
      && (await page.evaluate(() => [...document.querySelectorAll('#btn-poder *')].every(n => n.tagName === 'KBD' || n.className === 'ico' || n.closest('.ico')) && document.querySelector('#btn-poder').textContent.replace(document.querySelector('#btn-poder kbd').textContent, '').trim() === '')),
      'el botón de poder no tiene texto visible: solo ícono y atajo, con aria-label');
    const previo = await page.evaluate(() => { const j = window.__mundo.jugador; return [j.x, j.y, j.z, window.__mundo.jugador.personaje]; });
    const elementos = () => page.evaluate(async () => { const a = await import('./ambiente.js'); return a.ambienteDe(window.__mundo).elementos.map(e => ({ tipo: e.tipo, x: e.x, y: e.y, z: e.z })); });
    const lista = await elementos();
    const SONIDO = { gato: 'maulla', cabra: 'bala', gaviota: 'grazna', golondrina: 'trina', delfin: 'chasquea', pulpo: null, lirios: null };
    for (const [tipo, sn] of Object.entries(SONIDO)) {
      const idx = lista.findIndex(e => e.tipo === tipo);
      if (idx < 0) { ok(false, `ambiente: hay un ${tipo} en el mundo`); continue; }
      await page.evaluate(([i]) => { window.__mundo.cambiarPersonaje('pegaso'); }, [idx]);
      // Se pone al personaje a ~0,8 casillas del animal y se pulsa el poder en el mismo cuadro
      const r = await page.evaluate(async ([i, sn]) => {
        const a = await import('./ambiente.js'), m = window.__mundo, j = m.jugador, e = a.ambienteDe(m).elementos[i];
        e.llamado = 0; j.x = e.x + 0.8; j.y = e.y; j.z = Math.max(0, e.z); j.vz = 0; j.enSuelo = true; j.estado = 'jugando'; j.seguro = { x: j.x, y: j.y, z: j.z };
        const antes = window.__sonidos.length;
        return { antes };
      }, [idx, sn]);
      await page.keyboard.press('KeyE'); await espera(120);
      const d = await page.evaluate(async ([i]) => {
        const a = await import('./ambiente.js'), e = a.ambienteDe(window.__mundo).elementos[i];
        return { llamado: e.llamado, sonidos: window.__sonidos.slice() };
      }, [idx]);
      const nuevos = d.sonidos.slice(r.antes);
      ok(d.llamado > 0, `ambiente: ${tipo} responde al llamado (llamado ${d.llamado.toFixed(2)})`);
      ok(sn ? nuevos.includes(sn) : !nuevos.some(n => ['maulla', 'bala', 'grazna', 'trina', 'chasquea'].includes(n)),
        sn ? `ambiente: ${tipo} suena "${sn}"` : `ambiente: ${tipo} se llama en silencio`);
      if (tipo === 'gato') {
        await page.keyboard.press('KeyE'); await espera(80);
        const n2 = await page.evaluate(() => window.__sonidos.filter(n => n === 'maulla').length);
        ok(n2 === nuevos.filter(n => n === 'maulla').length + d.sonidos.slice(0, r.antes).filter(n => n === 'maulla').length, 'ambiente: no se vuelve a llamar mientras dura el gesto');
        const bk = await page.evaluate(async () => { const a = await import('./ambiente.js'); const e = a.ambienteDe(window.__mundo).elementos.find(q => q.tipo === 'gato'); const g = a.movimientoAmbiente({ ...e, llamado: .5, poderActivo: false, reaccion: 0 }, 1, false), q = a.movimientoAmbiente({ ...e, llamado: .5, poderActivo: false, reaccion: 0 }, 1, true); return { gx: Math.abs(g.escala - 1) + Math.abs(g.giro), qx: Math.abs(q.escala - 1) + Math.abs(q.giro) }; });
        ok(bk.gx > 0 && bk.qx > 0 && bk.qx < bk.gx, 'ambiente: con movimiento reducido el gesto se atenúa');
      }
      await page.waitForFunction(async ([i]) => { const a = await import('./ambiente.js'); return a.ambienteDe(window.__mundo).elementos[i].llamado === 0; }, [idx], { timeout: 4000 }).then(() => ok(true, `ambiente: ${tipo} vuelve a su reposo`), () => ok(false, `ambiente: ${tipo} vuelve a su reposo`));
    }
    await page.evaluate(([x, y, z, pj]) => { const m = window.__mundo, j = m.jugador; m.cambiarPersonaje(pj); j.x = x; j.y = y; j.z = z; j.vz = 0; j.enSuelo = true; j.estado = 'jugando'; j.seguro = { x, y, z }; }, previo);
    await espera(200);
  }

  // Modo rápido: chequeos propios y cortos sobre un perfil nuevo (contexto limpio). No toca el resto de las secciones.
  if (RAPIDO) {
    const eng = /\b(the|and|you|with|press|hold|power|button|close|next|previous)\b/i;
    const IDR = ['pegaso', 'minotauro', 'ariadna', 'fenix', 'eco', 'ulises'];
    const texto = () => page.evaluate(() => document.body.innerText);
    await page.goto(url); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
    ok(true, 'carga la pantalla de perfiles');
    ok(!eng.test(await texto()), 'la pantalla de perfiles no tiene texto en inglés');
    await nuevoPerfil(page, 'Rapida');
    await page.waitForFunction(() => window.__mundo); await espera(400);
    ok(!(await page.isVisible('#aviso')) && await page.evaluate(() => JSON.parse(localStorage.getItem('mitos-mundo-abierto-v1')).perfiles[0].fichaUlisesPresentada === true), 'perfil nuevo: la ficha de Ulises no se anuncia como novedad');
    let s = await est();
    ok(s.pj === 'pegaso' && s.enSuelo && (await page.evaluate(() => window.__mundo.id)) === 'mundo', 'arranca en el mundo con Pegaso en el suelo');
    ok(!eng.test(await texto()), 'la pantalla de juego no tiene texto en inglés');
    const yA = s.y; await poner(new Set(['ArrowUp'])); await espera(400); await soltarTodo();
    ok((await est()).y < yA - 0.5, 'el personaje se mueve con el teclado');
    await page.click('#btn-menu');
    ok(await page.isVisible('#menu-seguir') && await page.isVisible('#menu-pruebas'), 'el menú abre y ofrece el campo de pruebas');
    const tm = await texto();
    await page.click('#menu-objetos'); const tl = await texto();
    await page.click('#menu-volver');
    ok(!eng.test(tm + ' ' + tl), 'el menú y la lista de objetos no tienen texto en inglés');
    await page.click('#menu-seguir'); await espera(200);
    await page.click('.pj[data-id=minotauro]'); await espera(200);
    ok((await est()).pj === 'minotauro' && (await page.getAttribute('#btn-poder', 'aria-label')) === 'Embestir', 'cambia de personaje tocando su botón');
    await page.click('#btn-menu'); await page.click('#menu-perfiles');
    ok(await page.isVisible('#pantalla-perfiles'), 'el menú abre la pantalla de perfiles');
    await page.click('.perfil'); await page.waitForFunction(() => window.__mundo); await espera(300);
    const sp = await page.evaluate(() => window.__sprites());
    ok(sp.listos && IDR.every(id => sp.imagenes[id] && sp.imagenes[id][0] > 0 && sp.imagenes[id][1] > 0), 'los seis sprites cargan');
    ok(sp.listos && sp.fallidos.length === 0 && sp.esperados > 40 && Object.keys(sp.escenario).length === sp.esperados, 'los sprites del escenario cargan sin fallidos');
    for (const id of IDR) {
      const n = await page.evaluate(id => {
        const c = document.createElement('canvas'); c.width = 120; c.height = 120; const cx = c.getContext('2d');
        window.__dibujarPersonaje(cx, { id }, { x: 60, y: 90, fx: 1, fy: 1, t: 0, caminando: false, volando: false, embistiendo: false, escala: 1, paso: 0 });
        const d = cx.getImageData(0, 0, 120, 120).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; return k;
      }, id);
      const t = await page.evaluate(id => { const c = document.querySelector(`.pj[data-id=${id}] canvas`); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; return k; }, id);
      ok(n > 500 && t > 500, `se dibuja ${id} (${n} píxeles en el lienzo, ${t} en la tira)`);
    }
    await seccionAmbiente();
    await seccionU1();
    ok(errores.length === 0, 'sin errores en consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
    await browser.close(); servidor.close();
    console.log(fallos ? `\n${fallos} verificación(es) fallaron (rápido)` : '\nTodo en orden (rápido)');
    process.exit(fallos ? 1 : 0);
  }

  // 1. Perfiles
  await page.goto(url); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  ok(true, 'carga la pantalla de perfiles');
  await foto('01-perfiles');
  await nuevoPerfil(page, 'Prueba');
  await page.waitForFunction(() => window.__mundo); await espera(400);
  await seccionAmbiente();
  await foto('02-inicio');
  let s = await est();
  ok(s.pj === 'pegaso' && s.enSuelo && Math.abs(s.x - 10.5) < 0.01 && Math.abs(s.y - 21.5) < 0.01, 'arranca con Pegaso en el muelle del puerto');
  ok(await page.evaluate(() => window.__mundo.id) === 'mundo' && (await page.textContent('#zona-nombre')) === 'Puerto', 'el juego arranca en el mundo unido, en la zona del puerto');
  ok(await page.isVisible('#pista-cambio'), 'se ve la pista de cambio de personaje la primera vez');

  // 1b. Toques reales: joystick + botones a la vez
  const cdp = await ctx.newCDPSession(page);
  const centro = sel => page.evaluate(q => { const r = document.querySelector(q).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
  const toque = (type, puntos) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: puntos });
  const J = await centro('#joystick'), BS = await centro('#btn-salto'), BP = await centro('#btn-poder');
  const y0 = (await est()).y;
  await toque('touchStart', [{ x: J.x, y: J.y - 44, id: 1 }]); await espera(300);
  let s1 = await est();
  ok(s1.y < y0 - 0.5, `el joystick táctil mueve al personaje (y ${y0.toFixed(2)} a ${s1.y.toFixed(2)})`);
  await toque('touchStart', [{ x: J.x, y: J.y - 44, id: 1 }, { x: BS.x, y: BS.y, id: 2 }]);
  let zmax = 0; for (let i = 0; i < 6; i++) { zmax = Math.max(zmax, (await est()).z); await espera(30); }
  ok(zmax > 0.3, `saltar con un dedo mientras el otro mueve (z máx ${zmax.toFixed(2)})`);
  await toque('touchEnd', [{ x: J.x, y: J.y - 44, id: 1 }, { x: BS.x, y: BS.y, id: 2 }]); await espera(600);
  const quieto = await est(); await espera(200);
  ok(Math.abs((await est()).y - quieto.y) < 0.01, 'al soltar el joystick el personaje se detiene');
  await toque('touchStart', [{ x: BP.x, y: BP.y, id: 3 }]); await espera(600);
  const vz = await est(); ok(vz.z > 1, `el botón Volar, mantenido con el dedo, eleva a Pegaso (z ${vz.z.toFixed(2)})`);
  await toque('touchEnd', []); await espera(1500);
  ok((await est()).enSuelo, 'al soltar Volar, Pegaso baja planeando');

  // 2. Campo de pruebas desde el menú (escondido: solo con ?pruebas)
  {
    const sin = await ctx.newPage();
    await sin.goto(url.replace('&pruebas', '')); await sin.waitForSelector('#pantalla-perfiles:not([hidden])');
    await sin.click('.perfil'); await sin.waitForFunction(() => window.__mundo); await espera(300);
    await sin.click('#btn-menu');
    ok(await sin.isVisible('#menu-seguir') && !(await sin.isVisible('#menu-pruebas')), 'sin ?pruebas el menú no muestra el campo de pruebas');
    await sin.close();
  }
  await page.click('#btn-menu');
  ok((await page.textContent('#menu-pruebas')) === 'Campo de pruebas' && await page.isVisible('#menu-pruebas'), 'con ?pruebas el menú ofrece el campo de pruebas');
  await page.click('#menu-seguir'); await espera(200);
  await entrarPruebas();
  s = await est();
  ok(await page.evaluate(() => window.__mundo.id) === 'pruebas' && Math.abs(s.x - 10.5) < 0.2 && Math.abs(s.y - 24.5) < 0.2 && (await page.textContent('#zona-nombre')) === 'Campo de pruebas', 'el campo de pruebas se abre desde el menú, en su inicio');

  // 2b. Caer al agua y reaparecer sin perder nada
  await ir(10.5, 20.9, { orden: 'y', tol: 0.15 });
  await poner(new Set(['ArrowUp'])); await espera(500);
  await foto('03-cayendo');
  await poner(new Set(['ArrowUp'])); await espera(1400); await soltarTodo();
  // Mismo motivo que en la sesión 4: puede soltar a mitad de una caída, que dura más que 700 ms de pared
  await page.waitForFunction(() => { const j = window.__mundo.jugador; return j.estado === 'jugando' && j.enSuelo; }, null, { timeout: 8000 }); await espera(100);
  s = await est();
  ok(s.estado === 'jugando' && s.enSuelo && s.y > 20.9, `cae al agua y reaparece en suelo firme (y=${s.y.toFixed(2)})`);

  // 3. Cruzar el agua saltando
  await ir(10.5, 21.2, { orden: 'y', tol: 0.15 });
  await poner(new Set(['ArrowUp'])); await espera(60); await saltar(); await espera(900); await soltarTodo(); await espera(300);
  s = await est();
  ok(s.y < 20 && s.enSuelo && s.estado === 'jugando', `salta el agua de un tramo (y=${s.y.toFixed(2)})`);
  await foto('04-cruzado');

  // 4. Pegaso: vuelo hasta el techo
  await ir(4.5, 18.7, { orden: 'yx' });
  // Contra la terraza sin volar: no puede subir caminando ni saltando
  await poner(new Set(['ArrowUp'])); await espera(150); await saltar(); await espera(1100); await soltarTodo();
  s = await est();
  ok(s.y > 17.9 && s.z < 0.1, `no sube a la terraza caminando ni saltando (y=${s.y.toFixed(2)})`);
  await foto('05-contra-terraza');
  await ir(4.5, 18.7, { orden: 'yx' });
  // Vuela: mantiene el poder, sube, avanza
  await poner(new Set(['KeyE'])); await espera(700);
  s = await est(); ok(s.z > 1.2, `vuela: altura ${s.z.toFixed(2)}`);
  await foto('06-vuelo');
  await poner(new Set(['KeyE', 'ArrowUp'])); await espera(700);
  s = await est(); ok(s.y < 17.3 && s.z >= 1, `llega a la terraza volando (y=${s.y.toFixed(2)}, z=${s.z.toFixed(2)})`);
  await ir(4.5, 15.55, { extra: ['KeyE'], tol: 0.2, orden: 'yx' });
  await espera(300); await foto('07-techo');
  s = await est();
  ok(s.recogidos.includes('prueba-1'), 'recoge el objeto 1 sobre el techo');
  ok(await page.evaluate(() => !!document.querySelector('#aviso .medallon svg') && !document.querySelector('#aviso .medallon img')), 'el aviso de un objeto de prueba conserva el ícono genérico');
  await soltarTodo(); await espera(900);
  s = await est();
  ok(s.enSuelo && Math.abs(s.z - 2) < 0.05, `aterriza en el techo (z=${s.z.toFixed(2)})`);

  // 5. Cambio de personaje
  await page.click('.pj[data-id=minotauro]'); await espera(200);
  s = await est(); ok(s.pj === 'minotauro', 'cambia a Minotauro tocando su botón');
  ok(!(await page.isVisible('#pista-cambio')), 'la pista de cambio desaparece tras cambiar');
  ok((await page.getAttribute('#btn-poder', 'aria-label')) === 'Embestir', 'el botón de poder pasa a "Embestir"');
  await foto('08-minotauro');

  // 6. Minotauro: bloque a la placa, reja, objeto 2
  await ir(4.5, 14.4, { orden: 'y' });          // se baja del techo hacia el norte
  await ir(12.5, 14.5, { orden: 'x', tol: 0.15 });
  await ir(12.5, 17.5, { orden: 'y', tol: 0.15 });
  await ir(13.5, 17.5, { orden: 'x', tol: 0.12 });
  await hasta('ArrowRight', () => window.__mundo.empujables.some(e => e.tipo === 'bloque' && e.tx === 16));
  let b = [await bloque()];
  ok(b[0][0] === 16 && b[0][1] === 17, `empuja el bloque dos baldosas al este (${b[0]})`);
  await ir(16.5, 18.5, { orden: 'yx', tol: 0.12 });
  await foto('09-bloque');
  await hasta('ArrowUp', () => window.__mundo.empujables.some(e => e.tipo === 'bloque' && e.ty === 16)); await espera(400);
  b = [await bloque()];
  ok(b[0][0] === 16 && b[0][1] === 16, `el bloque queda sobre la placa (${b[0]})`);
  ok((await abiertas())[0] === true && (await celda(15, 13)) === '.', 'la reja se abre');
  await foto('10-reja-abierta');
  await ir(15.5, 14.5, { orden: 'xy', tol: 0.15 });
  await ir(15.5, 11.5, { orden: 'y', tol: 0.15 });
  await espera(300); s = await est();
  ok(s.recogidos.includes('prueba-2'), 'recoge el objeto 2 detrás de la reja');

  // 7. Un personaje sin fuerza no mueve nada
  // (se verifica con la vasija de la esquina: Pegaso la empuja y no se mueve)
  await page.click('.pj[data-id=pegaso]'); await espera(150);
  await ir(15.5, 14.5, { orden: 'y', tol: 0.15 });
  await ir(18.5, 14.5, { orden: 'x', tol: 0.15 });
  await ir(18.5, 15.5, { orden: 'y', tol: 0.15 });
  await poner(new Set(['ArrowLeft'])); await espera(1200); await soltarTodo();
  const v = await page.evaluate(() => window.__mundo.empujables.filter(e => e.tipo === 'vasija').map(e => [e.tx, e.ty]));
  ok(v.some(p => p[0] === 17 && p[1] === 15), 'Pegaso no mueve la vasija');
  ok(await page.isVisible('#aviso'), 'aparece una pista al empujar sin fuerza');
  await foto('11-pista');

  // 8. Minotauro rompe el muro agrietado
  await page.click('.pj[data-id=minotauro]'); await espera(150);
  await ir(11.5, 14.5, { orden: 'yx', tol: 0.15 });
  await ir(11.5, 7.0, { orden: 'y', tol: 0.15 });
  await foto('12-muro');
  ok((await celda(11, 5)) === 'M', 'el muro agrietado sigue entero antes de embestir');
  await poner(new Set(['ArrowUp'])); await espera(40);
  await page.keyboard.press('KeyE'); await espera(700); await soltarTodo();
  ok((await celda(11, 5)) === '.', 'el muro se rompe al embestir');
  await foto('13-muro-roto');
  await ir(11.5, 3.5, { orden: 'y', tol: 0.2 });
  await espera(300); s = await est();
  ok(s.recogidos.includes('prueba-3'), 'recoge el objeto 3 detrás del muro');
  await foto('14-final');

  // 9. Contadores y guardado
  ok((await page.textContent('#zona-n')) === '3/3' && !(await page.isVisible('#total-n')), 'en el campo de pruebas el contador de la zona llega a 3/3 y el total de la partida no se muestra');
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  const lista = await page.textContent('#lista-perfiles');
  ok(lista.includes('Prueba') && lista.includes('0/9'), 'los objetos de prueba no suman a la partida (0/9 en el perfil)');
  await page.click('.perfil'); await page.waitForFunction(() => window.__mundo); await espera(300);
  ok(await page.evaluate(() => window.__mundo.id) === 'mundo', 'tras recargar desde el campo de pruebas, se vuelve al mundo de la partida');
  await entrarPruebas();
  s = await est();
  ok(s.recogidos.length === 3 && (await page.textContent('#zona-n')) === '3/3', 'los objetos de prueba siguen recogidos y no reaparecen');
  ok(s.pj === 'minotauro', 'recuerda el último personaje elegido');
  // El mundo queda como lo dejó: nada se cierra ni se arma de nuevo
  ok((await celda(11, 5)) === '.', 'tras recargar, el muro sigue roto');
  ok((await abiertas())[0] === true && (await celda(15, 13)) === '.', 'tras recargar, la reja sigue abierta');
  b = [await bloque()];
  ok(b[0][0] === 16 && b[0][1] === 16, `tras recargar, el bloque sigue sobre la placa (${b[0]})`);
  const vas = await page.evaluate(() => window.__mundo.empujables.filter(e => e.tipo === 'vasija').map(e => e.tx + ',' + e.ty).sort().join(' '));
  ok(vas === '13,15 17,15', `las vasijas que no se movieron siguen en su lugar (${vas})`);
  ok(!(await page.isVisible('#aviso')), 'al volver no aparece de nuevo el aviso de la reja');
  await foto('15-recargado');

  // 10. Varios perfiles
  await page.click('#btn-menu'); await page.click('#menu-perfiles');
  await nuevoPerfil(page, 'Otra');
  await page.waitForFunction(() => window.__mundo && window.__mundo.coleccionables.every(c => !c.recogido)); await espera(200);
  ok((await page.textContent('#total-n')) === '0/9', 'un perfil nuevo arranca en 0/9 y el otro no se toca');
  await entrarPruebas();
  ok((await celda(11, 5)) === 'M' && (await abiertas())[0] === false, 'un perfil nuevo arranca con el muro entero y la reja cerrada');
  b = [await bloque()];
  ok(b[0][0] === 14 && b[0][1] === 17, `un perfil nuevo arranca con el bloque en su lugar (${b[0]})`);
  await page.click('#btn-menu'); await page.click('#menu-perfiles');
  await page.click('.perfil'); await page.waitForFunction(() => window.__mundo); await espera(300);
  await entrarPruebas();
  ok((await celda(11, 5)) === '.' && (await abiertas())[0] === true, 'el primer perfil conserva su mundo después de usar otro');

  // --- Ayudas para las sesiones de poderes: reubicar al personaje y elegirlo ---
  const tp = (x, y) => page.evaluate(([x, y]) => { const m = window.__mundo, j = m.jugador; j.x = x; j.y = y; j.z = m.suelo(x, y); j.vz = 0; j.enSuelo = true; j.planeo = false; j.estado = 'jugando'; j.seguro = { x, y, z: j.z }; }, [x + OFF[0], y + OFF[1]]);
  const elegir = async id => { await page.click(`.pj[data-id=${id}]`); await espera(150); };
  const tocar = async (tecla = 'KeyE') => { await page.keyboard.press(tecla); await espera(250); };
  const sonidos = () => page.evaluate(() => window.__sonidos.slice());
  const M = fn => page.evaluate(fn);

  // 12. Sesión 5: fichas y catálogo
  const plan = fs.readFileSync(path.join(RAIZ, 'plan-etapa-1.md'), 'utf8');
  const cat = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos/coleccionables.json'), 'utf8'));
  const pers = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos/personajes.json'), 'utf8')).personajes;
  const filasPlan = [...plan.matchAll(/^\| `([a-z-]+)` \| (\w+) \| [^|]*\| ([^|]+) \| ([^|]+) \|$/gm)];
  ok(filasPlan.length === 7, `el plan tiene 7 coleccionables (${filasPlan.length})`);
  ok(filasPlan.every(f => { const o = cat.objetos.find(q => q.id === f[1]); return o && o.zona === f[2] && o.nombre === f[3].trim() && o.texto === f[4].trim(); }),
    'el catálogo repite exactos id, zona, nombre y texto de los 7 coleccionables del plan');
  ok(['puerto', 'canal', 'plaza', 'palacio', 'pruebas'].every(z => cat.zonas.some(q => q.id === z)), 'las zonas puerto, plaza, palacio y pruebas existen');
  ok(cat.objetos.filter(o => o.zona === 'pruebas').length === 3, 'los 3 objetos de prueba siguen');
  const plan2 = fs.readFileSync(path.join(RAIZ, 'plan-etapa-2.md'), 'utf8');
  const objetosCanal = [...plan2.matchAll(/^\| `([a-z-]+)` \| [^|]*\| ([^|]+) \| ([^|]+) \|$/gm)];
  ok(objetosCanal.length === 2 && objetosCanal.every(f => { const o = cat.objetos.find(q => q.id === f[1]); return o && o.zona === 'canal' && o.nombre === f[2].trim() && o.texto === f[3].trim(); }), 'los dos objetos del canal repiten exacto nombre y texto de etapa 2');

  const textosPlan = {};
  for (const sec of plan.split(/^### /m).slice(1)) { const t = sec.match(/\*\*Texto:\*\* (.+)/); if (t) textosPlan[sec.split('\n')[0].trim().toLowerCase().replace('é', 'e').replace('í', 'i')] = t[1].trim(); }
  textosPlan.ulises = fs.readFileSync(path.join(RAIZ, 'plan-etapa-2.md'), 'utf8').match(/### Texto\n\n(.+)/)[1].trim();
  ok(pers.length === 6 && pers.every(p => p.ficha && p.ficha.texto === textosPlan[p.nombre.toLowerCase().replace('é', 'e').replace('í', 'i')]), 'las seis fichas repiten exacto el texto del plan');
  ok(pers.every(p => p.poder.activo), 'los seis poderes están activos');
  ok(pers.find(p => p.id === 'minotauro').ficha.texto.endsWith('Teseo entró con el hilo de Ariadna, lo venció y encontró la salida.'), 'la ficha del Minotauro termina con Teseo (D5)');

  await elegir('minotauro'); await tp(10.5, 24.5);
  const antes = await est();
  await page.click('#btn-ficha');
  ok(await page.isVisible('#pantalla-ficha'), 'el botón de información abre la ficha');
  ok((await page.textContent('#ficha-nombre')) === 'Minotauro', 'la ficha abierta es la del personaje activo');
  await poner(new Set(['ArrowRight'])); await espera(400); await soltarTodo();
  ok(Math.abs((await est()).x - antes.x) < 0.01, 'el juego espera mientras la ficha está abierta');
  const caben = async () => page.evaluate(() => {
    const t = document.querySelector('#pantalla-ficha .tarjeta'), r = t.getBoundingClientRect();
    const dentro = r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
    t.scrollTop = t.scrollHeight;
    const f = document.getElementById('ficha-senal').getBoundingClientRect(), r2 = t.getBoundingClientRect();
    return { dentro, sinCorte: f.bottom <= r2.bottom + 0.5 && t.scrollWidth <= t.clientWidth };
  });
  let vistos = 0;
  for (let i = 0; i < pers.length; i++) {
    const nombre = await page.textContent('#ficha-nombre'), p = pers.find(q => q.nombre === nombre);
    const c = await caben();
    if (p && (await page.textContent('#ficha-texto')) === p.ficha.texto && c.dentro && c.sinCorte && (await page.textContent('#ficha-poder-titulo')).startsWith('Poder: ')) vistos++;
    await page.click('#ficha-siguiente');
  }
  ok(vistos === pers.length, `las seis fichas se abren con texto, poder y señal sin cortarse (${vistos}/${pers.length})`);
  const ingles = /\b(the|and|you|with|press|hold|power|button|close|next|previous)\b/i;
  ok(!ingles.test(await page.textContent('#pantalla-ficha')), 'la ficha no tiene texto en inglés');
  await foto('16-ficha');
  await page.setViewportSize({ width: 360, height: 640 }); await espera(200);
  while ((await page.textContent('#ficha-nombre')) !== 'Eco') await page.click('#ficha-siguiente');
  const chico = await caben();
  ok(chico.dentro && chico.sinCorte, 'la ficha más larga (Eco) se lee en un celular chico en vertical');
  await foto('17-ficha-chica');
  await page.setViewportSize({ width: 412, height: 915 }); await espera(200);
  await page.click('#ficha-cerrar');
  ok(!(await page.isVisible('#pantalla-ficha')), 'la ficha se cierra');
  await poner(new Set(['ArrowRight'])); await espera(300); await soltarTodo();
  ok((await est()).x > antes.x + 0.3, 'al cerrar la ficha el juego sigue');
  // Mantener apretado un personaje de la tira abre su ficha sin cambiar de personaje
  const caja = await page.evaluate(() => { const r = document.querySelector('.pj[data-id=ariadna]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(caja.x, caja.y); await page.mouse.down(); await espera(750); await page.mouse.up(); await espera(150);
  ok(await page.isVisible('#pantalla-ficha') && (await page.textContent('#ficha-nombre')) === 'Ariadna', 'mantener apretado un personaje de la tira abre su ficha');
  ok((await est()).pj === 'minotauro', 'abrir la ficha no cambia de personaje');
  await page.click('#ficha-cerrar');
  for (const p of pers) { await elegir(p.id); if (await page.evaluate(() => document.getElementById('btn-poder').classList.contains('apagado'))) ok(false, `el botón de ${p.nombre} figura apagado`); }
  ok(true, 'ningún personaje queda con el botón apagado');

  // 13. Sesión 2: Fénix
  await elegir('minotauro'); await tp(23.5, 10.5);
  await tocar('KeyE'); await elegir('pegaso'); await tocar('KeyE'); await espera(900);
  ok(await page.evaluate(() => window.__mundo.braseros.every(b => !b.encendido)), 'Minotauro y Pegaso no encienden braseros');
  await tp(23.5, 10.5);
  await elegir('fenix');
  await tocar('KeyE');
  ok(await page.evaluate(() => window.__mundo.braseros[0].encendido && !window.__mundo.braseros[1].encendido), 'Fénix enciende el brasero cercano al tocar');
  ok((await est()).z < 0.3, 'tocar el botón no hace volar a Fénix');
  ok((await celda(25, 5)) === 'D', 'con un solo brasero la puerta del sol sigue cerrada');
  await tp(27.5, 16.5); await tocar('KeyE');
  ok(await page.evaluate(() => window.__mundo.braseros.every(b => b.encendido)), 'Fénix enciende el segundo brasero');
  ok((await celda(25, 5)) === '.', 'con los dos braseros encendidos se abre la puerta del sol');
  ok((await sonidos()).includes('brillo'), 'brillar suena (audio sintetizado)');
  await foto('18-puerta-sol');
  await tp(23.5, 12.5); await poner(new Set(['KeyE'])); await espera(800);
  ok((await est()).z > 1.2, 'mantener el botón hace volar a Fénix');
  await soltarTodo(); await espera(1500);

  // 14. Sesión 4: Ariadna
  await elegir('minotauro'); await tp(44.5, 17.5);
  await poner(new Set(['ArrowDown'])); await espera(700); await soltarTodo();
  await tp(44.5, 22.5); await espera(100);
  await poner(new Set(['ArrowUp'])); await espera(1500); await soltarTodo();
  // Al caer sigue en 'jugando' hasta hundirse (z < -2,4), y la caída y la reaparición duran 0,6 s más: esperar a que vuelva a estar firme
  await page.waitForFunction(() => { const j = window.__mundo.jugador; return j.estado === 'jugando' && j.enSuelo; }, null, { timeout: 8000 }); await espera(100);
  ok((await est()).y > 20.9, 'sin soga, el Minotauro no cruza el agua (reaparece al sur)');
  await elegir('pegaso'); await tp(44.5, 22.5); await tocar('KeyE'); await espera(900);
  ok(await page.evaluate(() => window.__mundo.sogas.every(s => !s.tendida)), 'Pegaso no tiende sogas');
  await tp(44.5, 22.5); await elegir('ariadna');
  await tp(40.5, 24.5); await tocar('KeyE');
  ok(await page.evaluate(() => window.__mundo.sogas.every(s => !s.tendida)), 'lejos de una argolla, Ariadna no tiende nada');
  await tp(44.5, 22.5); await tocar('KeyE');
  ok(await page.evaluate(() => window.__mundo.sogas[0].tendida && !window.__mundo.sogas[1].tendida), 'Ariadna tiende la soga puente desde una argolla');
  await ir(44.5, 17.5, { orden: 'y', tol: 0.15 }); await espera(200); s = await est();
  ok(s.estado === 'jugando' && s.y < 17.9 && s.enSuelo && s.z < 0.1, `cruza el agua por el puente (y=${s.y.toFixed(2)})`);
  await foto('19-puente');
  await ir(42.5, 17.5, { orden: 'x', tol: 0.12 }); await tocar('KeyE');
  ok(await page.evaluate(() => window.__mundo.sogas.every(s => s.tendida)), 'Ariadna tiende la escala hasta la terraza');
  await elegir('minotauro');
  await ir(42.5, 12.5, { orden: 'y', tol: 0.15 }); await espera(200); s = await est();
  ok(s.pj === 'minotauro' && s.estado === 'jugando' && Math.abs(s.z - 1) < 0.05 && s.y < 12.7, `el Minotauro sube por la escala a la terraza (z=${s.z.toFixed(2)})`);
  await foto('20-terraza');
  await ir(44.5, 12.5, { orden: 'x', tol: 0.15 });
  ok((await celda(44, 10)) === 'M', 'el muro de la terraza está entero');
  await poner(new Set(['ArrowUp'])); await espera(40); await page.keyboard.press('KeyE'); await espera(700); await soltarTodo(); await espera(500);
  ok((await celda(44, 10)) === '.', 'el Minotauro embiste y rompe el muro de la terraza');
  await foto('21-muro-terraza');

  // 15. Sesión 3: Eco
  await elegir('eco'); await tp(35.5, 19.5); await espera(400);
  ok((await M(() => window.__mundo.eco)) === null, 'un címbalo que no sonó no se escucha');
  ok((await page.textContent('#eco-texto')).includes('sin sonido'), 'el chip de Eco avisa que no guarda nada');
  await tocar('KeyE');
  ok(await page.isVisible('#aviso'), 'repetir sin sonido guardado da una pista');
  const cim = await page.evaluate(() => window.__mundo.fuentes.map(f => f.activa));
  ok(cim[0] === true && cim[1] === false, 'la caracola suena sola y el címbalo todavía no');
  await elegir('pegaso'); await tp(35.5, 20.5);
  await poner(new Set(['KeyE'])); await espera(800);
  await poner(new Set(['KeyE', 'ArrowUp'])); await espera(150);
  await ir(35.5, 18.5, { extra: ['KeyE'], tol: 0.2, orden: 'y' });
  await soltarTodo(); await espera(900);
  ok(await page.evaluate(() => window.__mundo.fuentes[1].activa), 'Pegaso llega al címbalo del techo y lo hace sonar');
  ok((await sonidos()).includes('golpe:cimbalo'), 'el címbalo suena (audio sintetizado)');
  await elegir('eco'); await tp(32.5, 22.5); await espera(300);
  ok((await M(() => window.__mundo.eco)) === 'caracola', 'Eco guarda el sonido A al acercarse a la caracola');
  ok((await page.textContent('#eco-texto')).includes('Caracola') && (await page.getAttribute('#chip-eco', 'data-sonido')) === 'caracola', 'la interfaz muestra el sonido guardado');
  await ir(35.5, 22.5, { orden: 'x', tol: 0.12 }); await ir(35.5, 20.5, { orden: 'y', tol: 0.12 }); await espera(300);
  ok((await M(() => window.__mundo.eco)) === 'cimbalo', 'Eco guarda el sonido B del címbalo');
  ok(!(await page.textContent('#eco-texto')).includes('Caracola') && (await page.textContent('#eco-texto')).includes('Címbalo'), 'al guardar B, el sonido A se pierde');
  await foto('22-eco-guarda');
  await ir(37.5, 20.5, { orden: 'x', tol: 0.12 }); await ir(37.5, 13.5, { orden: 'y', tol: 0.15 }); await ir(34.5, 13.5, { orden: 'x', tol: 0.12 });
  ok((await celda(32, 8)) === 'O' && (await celda(36, 8)) === 'O', 'las dos puertas de sonido están cerradas');
  await tocar('KeyE');
  ok(await page.evaluate(() => window.__mundo.ondas.length > 0), 'repetir lanza ondas visibles');
  await espera(200); await foto('23-eco-ondas');
  ok((await celda(36, 8)) === '.', 'el eco de B atraviesa la pared y abre la puerta de B');
  ok((await celda(32, 8)) === 'O', 'la puerta de A no se abre con el sonido B');
  ok((await sonidos()).includes('eco:cimbalo'), 'el eco suena (audio sintetizado)');
  await tp(32.5, 22.5); await espera(300);
  ok((await M(() => window.__mundo.eco)) === 'caracola', 'Eco vuelve a guardar A al acercarse a la caracola');
  await ir(32.5, 13.5, { orden: 'y', tol: 0.15 }); await tocar('KeyE');
  ok((await celda(32, 8)) === '.', 'con el sonido A se abre la puerta de A');
  await tp(35.5, 13.5); await elegir('pegaso'); await tocar('KeyE');
  const simb = await M(() => { const s = window.__mundo.sonidos; return Object.values(s).map(q => q.color + q.simbolo); });
  ok(new Set(simb).size === simb.length && new Set(await M(() => Object.values(window.__mundo.sonidos).map(q => q.simbolo))).size === simb.length, 'cada sonido tiene color y símbolo propios');
  await elegir('eco'); await tp(32.5, 22.5); await espera(300);

  // 16. Todo lo nuevo se guarda: recargar y seguir como estaba
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil'); await page.waitForFunction(() => window.__mundo); await espera(400);
  await entrarPruebas();
  ok(await page.evaluate(() => window.__mundo.braseros.every(b => b.encendido)) && (await celda(25, 5)) === '.', 'tras recargar, los braseros siguen encendidos y la puerta del sol abierta');
  ok(await page.evaluate(() => window.__mundo.sogas.every(s => s.tendida)), 'tras recargar, las sogas siguen tendidas');
  ok((await celda(44, 10)) === '.', 'tras recargar, el muro de la terraza sigue roto');
  ok((await celda(32, 8)) === '.' && (await celda(36, 8)) === '.', 'tras recargar, las puertas de sonido siguen abiertas');
  ok(await page.evaluate(() => window.__mundo.fuentes[1].activa), 'tras recargar, el címbalo sigue vibrando');
  ok((await M(() => window.__mundo.eco)) === 'caracola' && (await page.textContent('#eco-texto')).includes('Caracola'), 'tras recargar, Eco recuerda su sonido guardado');
  await elegir('minotauro'); await tp(42.5, 17.5);
  await ir(42.5, 15.5, { orden: 'y', tol: 0.15 }); await espera(300); s = await est();
  ok(Math.abs(s.z - 1) < 0.05, `tras recargar, el Minotauro sube por la escala (z=${s.z.toFixed(2)})`);
  await elegir('eco'); await tp(44.5, 21.5);
  await ir(44.5, 17.5, { orden: 'y', tol: 0.15 }); await espera(200); s = await est();
  ok(s.estado === 'jugando' && s.y < 17.9 && s.z < 0.1, 'tras recargar, Eco cruza por el puente: la soga la usan todos');
  const est2 = await page.evaluate(() => JSON.stringify(Object.keys(window.__mundo.estado()).sort()));
  ok(est2 === JSON.stringify(['barcas', 'braseros', 'eco', 'empujables', 'fuentes', 'muros', 'puertas', 'rejas', 'revelados', 'sogas', 'soles']), `el estado guardado tiene una clave por mecanismo (${est2})`);

  // 17. Mundo unido: recorrido completo desde el inicio (puerto y plaza), sin ningún cambio de mapa
  const idMapa = () => page.evaluate(() => window.__mundo.id);
  const marcar = () => page.evaluate(() => { window.__marca = window.__mundo; });
  const mismoMapa = () => page.evaluate(() => window.__mundo === window.__marca);   // el mismo objeto mundo: no hubo cambio de mapa
  const mapaZona = Object.fromEntries(cat.objetos.map(o => [o.id, o.zona]));
  const recog = z => page.evaluate(([z, mz]) => window.__mundo.coleccionables.filter(c => c.recogido).map(c => c.id).filter(id => mz[id] === z), [z, mapaZona]);
  const embestir = async () => { await poner(new Set(['ArrowUp'])); await espera(40); await page.keyboard.press('KeyE'); await espera(700); await soltarTodo(); await espera(150); };
  const chip = async () => (await page.textContent('#zona-nombre')) + ' ' + (await page.textContent('#zona-n'));
  await page.click('#btn-menu'); await page.click('#menu-perfiles');
  await nuevoPerfil(page, 'Ruta');
  await page.waitForFunction(() => window.__mundo && window.__mundo.id === 'mundo'); await espera(500);
  zona('puerto'); await marcar();
  s = await est();
  ok((await idMapa()) === 'mundo' && (await chip()) === 'Puerto 0/1' && Math.abs(s.x - 10.5) < 0.01 && Math.abs(s.y - 21.5) < 0.01, 'un perfil nuevo empieza en el mundo, en el puerto, sin objetos');
  ok(await page.evaluate(() => window.__mundo.rows) === 112 && await page.evaluate(() => window.__mundo.cols) === 24, 'el mundo es un solo mapa de 24 por 112 casillas');
  await foto('24-puerto');
  // Ningún texto visible en inglés (pantalla de juego y menú)
  const textoVisible = () => page.evaluate(() => document.body.innerText);
  ok(!ingles.test(await textoVisible()), 'la pantalla de juego no tiene texto en inglés');
  await page.click('#btn-menu'); const textoMenu = await textoVisible();
  await page.click('#menu-objetos'); const textoLista = await textoVisible();
  await page.click('#menu-volver'); await page.click('#menu-seguir'); await espera(200);
  ok(!ingles.test(textoMenu + ' ' + textoLista), 'el menú y la lista de objetos no tienen texto en inglés');
  // Puerto: el ancla se agarra caminando; no hay nada que resolver
  await ir(10.5, 15.5, { orden: 'y', tol: 0.15 }); await espera(300); await foto('26-objeto-en-el-mundo');
  await ir(10.5, 13.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await est()).recogidos.includes('ancla-piedra') && (await chip()) === 'Puerto 1/1', 'Pegaso agarra el ancla de piedra caminando por el muelle');
  ok(await page.evaluate(async () => { const im = document.querySelector('#aviso .medallon img'); if (!im) return false; await new Promise(r => setTimeout(r, 150)); return im.getAttribute('src') === 'sprites/coleccionables/ancla-piedra.svg' && im.naturalWidth > 0 && !document.querySelector('#aviso .medallon svg'); }), 'el aviso al juntar el ancla muestra su sprite en el medallón');
  await foto('27-aviso-objeto');
  await page.click('#btn-menu'); await page.click('#menu-objetos');
  ok(await page.evaluate(() => { const im = document.querySelector('#lista-objetos li img.obj-sprite'); return !!im && im.getAttribute('src') === 'sprites/coleccionables/ancla-piedra.svg' && im.naturalWidth > 0 && im.getBoundingClientRect().width >= 40; }), 'la lista Mis objetos muestra el sprite del ancla junto al nombre');
  await page.click('#menu-volver'); await page.click('#menu-seguir'); await espera(200);
  // Eco escucha la caracola
  await elegir('eco');
  await ir(10.5, 15.5, { orden: 'y', tol: 0.15 }); await ir(5.5, 15.5, { orden: 'x', tol: 0.15 }); await espera(300);
  ok((await M(() => window.__mundo.eco)) === 'caracola', 'Eco guarda la caracola en el puerto');
  await foto('25-puerto-caracola');
  await ir(10.5, 15.5, { orden: 'x', tol: 0.15 });
  await ir(10.5, 1.5, { orden: 'y', tol: 0.1 });
  await elegir('ulises'); await tocar('KeyE');
  ok(await M(() => !!window.__mundo.jugador.aBordo), 'Ulises sube en el muelle del puerto para cruzar el canal');
  zona('canal');
  await ir(11.5, 11.5, { orden: 'xy', tol: 0.08 });
  await ir(14.5, 10.5, { orden: 'xy', tol: 0.08 }); await tocar('KeyE');
  await ir(15.5, 10.5, { orden: 'x', tol: 0.08 }); await espera(250);
  ok((await est()).recogidos.includes('frasco-pulpo'), 'Ulises baja en la roca y consigue el frasco del pulpo');
  await foto('U2-frasco'); await tocar('KeyE');
  await ir(14.5, 6.3, { orden: 'y', tol: 0.08 }); await ir(6.5, 6.3, { orden: 'x', tol: 0.08 });
  ok(await M(() => window.__mundo.coleccionables.find(c => c.id === 'sello-barco').visible), 'la barca revela el sello escondido al acercarse');
  await ir(6.5, 5.5, { orden: 'y', tol: 0.08 }); await tocar('KeyE');
  await ir(6.5, 4.5, { orden: 'y', tol: 0.08 }); await espera(250);
  ok((await est()).recogidos.includes('sello-barco') && (await chip()) === 'Canal 2/2', 'Ulises recoge el sello y completa el canal');
  await foto('U2-sello'); await tocar('KeyE');
  await ir(11.5, 5.5, { orden: 'x', tol: 0.08 }); await ir(11.5, -0.5, { orden: 'y', tol: 0.08 }); await tocar('KeyE');
  zona('plaza'); await elegir('eco'); s = await est();
  ok(await mismoMapa() && s.y > 30 && s.pj === 'eco', `navegando al norte se llega a la plaza sin cambiar de mapa (y local=${s.y.toFixed(1)})`);
  ok((await chip()) === 'Plaza central 0/3', 'al desembarcar el chip de zona pasa a la plaza y a sus tres objetos');
  ok((await M(() => window.__mundo.eco)) === 'caracola' && (await page.textContent('#eco-texto')).includes('Caracola'), 'Eco conserva el sonido de la caracola al cruzar de zona');
  const guardado = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('mitos-mundo-abierto-v1')); const p = d.perfiles.find(q => q.nombre === 'Ruta'); return { mapa: p.mapa, eco: p.eco, mundo: !!(p.mundos && p.mundos.mundo), llegada: p.llegada }; });
  const g0 = await guardado();
  ok(g0.mapa === 'mundo' && g0.eco === 'caracola' && g0.mundo && Array.isArray(g0.llegada) && g0.llegada[1] < 74, 'el perfil guarda el mundo, el sonido de Eco y dónde reaparecer (ya en la plaza)');
  await tp(11.5, 24.5); await espera(900); await foto('26-plaza-sur');
  await tp(11.5, 12.5); await espera(900); await foto('27-plaza-norte');

  // Ningún desafío de la plaza se resuelve con otro personaje
  const retos = { sol: [5.5, 10.5], mar: [16.5, 10.5], muro: [5.5, 23.5] };
  const esquema = () => page.evaluate(() => ({ D: window.__mundo.celdas[48][5], O: window.__mundo.celdas[48][16], M: window.__mundo.celdas[62][5], br: window.__mundo.braseros.filter(b => b.y >= 40 && b.y < 74 && b.encendido).length }));
  const nombres = ['pegaso', 'fenix', 'minotauro', 'ariadna', 'eco'];
  const dentro = { sol: s => s.y < 8.9, mar: s => s.y < 8.9, muro: s => s.y < 22.9 };
  let intentos = 0, colados = 0;
  for (const pj of nombres) {
    await elegir(pj);
    for (const [reto, [x, y]] of Object.entries(retos)) {
      if ((pj === 'eco' && reto === 'mar') || (pj === 'minotauro' && reto === 'muro') || (pj === 'fenix' && reto === 'sol')) continue;
      await tp(x, y); await espera(150);
      if (pj === 'minotauro') await embestir();
      else if (pj === 'pegaso' || pj === 'fenix') { await poner(new Set(['KeyE', 'ArrowUp'])); await espera(1500); await soltarTodo(); await espera(1200); }
      else await tocar('KeyE');
      intentos++;
      if (dentro[reto](await est())) colados++;
    }
  }
  const e0 = await esquema();
  ok(intentos === 12 && colados === 0, `ningún personaje equivocado entra a un recinto de la plaza, ni volando (${intentos} intentos)`);
  ok(e0.D === 'D' && e0.O === 'O' && e0.M === 'M' && e0.br === 0, 'tras probar con los demás, la puerta del sol, la del mar y el muro siguen cerrados');
  ok((await recog('plaza')).length === 0, 'ningún objeto de la plaza se consigue con otro personaje');
  await elegir('eco'); await tp(16.5, 11.5);
  await M(() => { window.__mundo.eco = null; }); await tocar('KeyE');
  ok((await esquema()).O === 'O', 'Eco sin el sonido de la caracola no abre la puerta del mar');
  await M(() => { window.__mundo.eco = 'caracola'; });
  // Terrazas bajas: Pegaso y Fénix practican, sin premio
  const sogaPlaza = () => page.evaluate(() => window.__mundo.sogas.find(q => q.a[0] === 14 && q.a[1] === 63).tendida);
  await elegir('minotauro'); await tp(14.5, 20.5);
  await poner(new Set(['ArrowUp'])); await espera(900); await soltarTodo();
  ok((await est()).z < 0.1, 'el Minotauro no sube a las terrazas bajas');
  await elegir('pegaso'); await tp(14.5, 20.5);
  await poner(new Set(['KeyE', 'ArrowUp'])); await espera(1000); await poner(new Set(['KeyE'])); await espera(300); await soltarTodo(); await espera(1500);
  s = await est(); ok(s.enSuelo && Math.abs(s.z - 1) < 0.05 && s.y < 20, `Pegaso vuela a la terraza baja (z=${s.z.toFixed(2)})`);
  // D21: Fénix vuela hasta terrazas, no hasta techos; Pegaso llega a techos
  await elegir('fenix'); await tp(14.5, 20.5);
  await poner(new Set(['KeyE', 'ArrowUp'])); await espera(1000); await poner(new Set(['KeyE'])); await espera(300); await soltarTodo(); await espera(1500);
  s = await est(); ok(s.enSuelo && Math.abs(s.z - 1) < 0.05 && s.y < 20, `Fénix volando sube a una terraza (z=${s.z.toFixed(2)})`);
  await tp(17.5, 17.5);
  let zMax = 0;
  await poner(new Set(['KeyE', 'ArrowRight']));
  for (let i = 0; i < 40; i++) { await espera(40); zMax = Math.max(zMax, (await est()).z); }
  s = await est(); await soltarTodo(); await espera(1500);
  ok(zMax <= 1.61 && zMax > 1.2 && s.x < 18, `Fénix volando no se sube a un techo (z máx. ${zMax.toFixed(2)}, x=${s.x.toFixed(2)})`);
  s = await est(); ok(s.z < 0.1, 'Fénix vuelve al suelo al soltar junto al techo');
  await elegir('pegaso'); await tp(17.5, 17.5);
  await poner(new Set(['KeyE'])); await espera(1500); await poner(new Set(['KeyE', 'ArrowRight'])); await espera(250); await poner(new Set(['KeyE'])); await espera(100); await soltarTodo(); await espera(1500);
  s = await est(); ok(s.enSuelo && Math.abs(s.z - 2) < 0.05 && s.x > 18, `Pegaso volando sí sube a un techo (z=${s.z.toFixed(2)}, x=${s.x.toFixed(2)})`);
  await foto('28-terrazas');
  await elegir('ariadna'); await tp(14.5, 22.5); await tocar('KeyE');
  ok(await sogaPlaza(), 'Ariadna tiende la soga entre las argollas de la plaza');

  // Soluciones, cada una con su personaje
  await elegir('fenix'); await tp(2.5, 12.5); await tocar('KeyE');
  ok((await esquema()).br === 1 && (await esquema()).D === 'D', 'Fénix enciende un brasero y la puerta del sol sigue cerrada');
  await ir(8.5, 12.5, { orden: 'x', tol: 0.15 }); await tocar('KeyE');
  ok((await esquema()).D === '.', 'con los dos braseros encendidos se abre el pórtico del sol');
  await ir(5.5, 12.5, { orden: 'x', tol: 0.15 }); await ir(5.5, 4.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await recog('plaza')).includes('tablero-juego'), 'Fénix consigue el tablero de juego');
  await foto('29-tablero');
  await elegir('eco'); await tp(16.5, 11.5); await tocar('KeyE'); await espera(300);
  ok((await esquema()).O === '.', 'Eco repite la caracola y se abre la puerta del mar');
  await foto('30-puerta-mar');
  await ir(16.5, 4.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await recog('plaza')).includes('fresco-delfines'), 'Eco consigue el fresco de los delfines');
  await elegir('minotauro'); await tp(5.5, 24.5); await embestir(); await espera(300);
  ok((await esquema()).M === '.', 'el Minotauro rompe el muro agrietado');
  await ir(5.5, 18.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await recog('plaza')).includes('riton-toro') && (await chip()) === 'Plaza central 3/3' && (await page.textContent('#total-n')) === '6/9', 'el Minotauro consigue el ritón: la plaza queda en 3/3 y el total en 6/9');
  await foto('31-riton');

  // Volver al puerto y regresar por el canal: ninguna barca se mueve artificialmente.
  await tp(11.5, 31.5); await elegir('ulises'); await ir(11.5, 32.5, { orden: 'y', tol: 0.08 }); await tocar('KeyE');
  zona('canal'); await ir(11.5, 14.5, { orden: 'y', tol: 0.08 }); await tocar('KeyE');
  zona('puerto'); s = await est();
  ok(await mismoMapa() && s.y < 4 && s.pj === 'ulises' && (await chip()) === 'Puerto 1/1', `navegando al sur vuelve al puerto con el ancla recogida (y local=${s.y.toFixed(1)})`);
  await foto('32-puerto-vuelta');
  await tocar('KeyE'); zona('canal'); await ir(11.5, -0.5, { orden: 'y', tol: 0.08 }); await tocar('KeyE');
  zona('plaza'); await elegir('minotauro'); s = await est();
  ok(await mismoMapa() && s.y > 30 && (await chip()) === 'Plaza central 3/3', 'y otra vez a la plaza, con su contador');
  ok((await esquema()).D === '.' && (await esquema()).M === '.' && (await esquema()).br === 2, 'la plaza queda como se la dejó al cruzar de zona');

  // Recarga en medio: mismo lugar, todo igual
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Ruta")'); await page.waitForFunction(() => window.__mundo); await espera(500);
  s = await est(); const e1 = await esquema();
  ok((await idMapa()) === 'mundo' && s.y > 30 && s.pj === 'minotauro' && (await chip()) === 'Plaza central 3/3', 'tras recargar sigue en la plaza, donde estaba, con el mismo personaje');
  ok(e1.D === '.' && e1.O === '.' && e1.M === '.' && e1.br === 2, 'tras recargar, el pórtico, la puerta del mar y el muro siguen abiertos');
  ok(s.recogidos.length === 6 && (await page.textContent('#total-n')) === '6/9', 'tras recargar, los objetos siguen recogidos (6/9 en total)');
  ok((await M(() => window.__mundo.eco)) === 'caracola' && (await page.textContent('#eco-texto')).includes('Caracola'), 'tras recargar, Eco recuerda la caracola');
  ok(await sogaPlaza(), 'tras recargar, la soga de la plaza sigue tendida');
  // El campo de pruebas desde la plaza, y de vuelta al mismo lugar del mundo
  await entrarPruebas();
  ok((await page.textContent('#eco-texto')).includes('Caracola'), 'el sonido de Eco viaja también al campo de pruebas');
  await page.click('#btn-menu');
  ok((await page.textContent('#menu-pruebas')) === 'Salir del campo de pruebas', 'dentro del campo de pruebas el menú ofrece salir');
  await page.click('#menu-pruebas'); await page.waitForFunction(() => window.__mundo.id === 'mundo'); await espera(500);
  zona('plaza'); s = await est(); ok(s.y > 30 && (await chip()) === 'Plaza central 3/3', 'al salir del campo de pruebas se vuelve al mundo, a la plaza donde se estaba');
  await entrarPruebas();
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Ruta")'); await page.waitForFunction(() => window.__mundo); await espera(400);
  ok((await idMapa()) === 'mundo' && (await page.textContent('#zona-nombre')) === 'Plaza central', 'recargar desde el campo de pruebas devuelve al mundo, a la plaza: el campo de pruebas no es el inicio');

  // 18. Sesión 7: palacio en terrazas (tres desafíos de a dos), al que se llega caminando desde la plaza
  await elegir('minotauro'); zona('plaza'); await tp(11.5, 4.5); await espera(200); await marcar();
  await hasta('ArrowUp', ([ox, oy]) => window.__mundo.jugador.y < 39.6, 6000); await espera(700);
  zona('palacio'); s = await est();
  ok(await mismoMapa() && s.y > 36 && (await chip()) === 'Palacio 0/3', `la rampa norte de la plaza lleva al palacio sin cambiar de mapa (y=${s.y.toFixed(1)})`);
  await foto('33-palacio-entrada');
  const PAL_IDS = ['tablilla-arcilla', 'hacha-doble', 'figura-serpientes'];
  const pal = () => page.evaluate(ids => { const m = window.__mundo; const v = m.empujables[0];
    return { D: m.celdas[33][17], G: m.celdas[29][19], M: m.celdas[17][8], O: m.celdas[10][17],
      sogas: m.sogas.find(q => q.a[0] === 8 && q.a[1] === 24).tendida, fuente: m.fuentes.find(f => f.tx === 4 && f.ty === 6).activa,
      br: m.braseros.filter(b => b.y < 40 && b.encendido).length, vas: v.tx + ',' + v.ty, got: m.coleccionables.filter(c => c.recogido && ids.includes(c.id)).length }; }, PAL_IDS);
  const ningunObjeto = async () => (await pal()).got === 0;
  const mantener = async (teclas, ms) => { await poner(new Set(teclas)); await espera(ms); await soltarTodo(); await espera(150); };
  let intentosPal = 0, logrosPal = 0;

  // Almacenes: con uno solo no se resuelve (Fénix abre la puerta del sol, pero no mueve la vasija)
  for (const pj of ['pegaso', 'minotauro', 'ariadna', 'eco', 'fenix']) {
    await elegir(pj);
    await tp(3.5, 32.5); await tocar('KeyE'); await tp(9.5, 32.5); await tocar('KeyE'); await espera(200);
    await tp(17.5, 35.5);
    if (pj === 'minotauro') { await poner(new Set(['ArrowUp'])); await espera(40); await page.keyboard.press('KeyE'); await espera(700); await soltarTodo(); }
    else await mantener(pj === 'pegaso' || pj === 'fenix' ? ['KeyE', 'ArrowUp'] : ['ArrowUp'], 1600);
    await espera(1200);
    s = await est(); const p = await pal();
    if (pj === 'fenix') {
      ok(p.br === 2 && p.D === '.' && s.y < 33, 'Fénix sola enciende los dos braseros y entra por la puerta del sol del depósito');
      await tp(14.5, 29.5); await mantener(['ArrowRight'], 1200);
      ok((await pal()).vas === '15,29' && (await pal()).G === 'G', 'pero adentro Fénix sola no mueve la vasija y la reja sigue cerrada');
    } else ok(p.br === 0 && p.D === 'D' && s.y > 33, `${pj} solo no abre el depósito (ni volando ni embistiendo)`);
    intentosPal++; if (!(await ningunObjeto())) logrosPal++;
  }

  // Terraza de los frescos: con uno solo no se rompe el muro (Ariadna tiende la soga y sube, pero no rompe)
  for (const pj of ['pegaso', 'minotauro', 'fenix', 'eco', 'ariadna']) {
    await elegir(pj);
    await tp(8.5, 23.5); await espera(150);
    if (pj === 'ariadna') { await tp(8.5, 24.5); await tocar('KeyE'); await tp(8.5, 23.5); }
    await mantener(pj === 'pegaso' || pj === 'fenix' ? ['KeyE', 'ArrowUp'] : ['ArrowUp'], 2200);
    await espera(1000); s = await est();
    if (pj === 'minotauro' || pj === 'ariadna') { await poner(new Set(['ArrowUp'])); await espera(40); await page.keyboard.press('KeyE'); await espera(700); await soltarTodo(); await espera(200); }
    s = await est(); const p = await pal();
    if (pj === 'ariadna') ok(p.sogas && s.z > 0.9 && s.y < 21 && p.M === 'M', `Ariadna sola tiende la escala y sube a la terraza, pero el muro sigue entero (z=${s.z.toFixed(2)})`);
    else if (pj === 'pegaso' || pj === 'fenix') ok(p.M === 'M' && !p.sogas && s.y > 16.9, `${pj} sube volando a la terraza pero no rompe ni pasa el muro`);
    else ok(p.M === 'M' && !p.sogas && s.z < 0.1 && s.y > 21.5, `${pj} solo no llega a la terraza ni rompe el muro`);
    intentosPal++; if (!(await ningunObjeto())) logrosPal++;
  }
  await foto('34-frescos');

  // Sala de los címbalos: con uno solo no se abre la puerta de bronce
  const volarAlCimbalo = async () => {
    await tp(4.5, 7.5); await poner(new Set(['KeyE'])); await espera(900);
    await poner(new Set(['KeyE', 'ArrowUp']));
    const t0 = Date.now(); while (Date.now() - t0 < 1500 && !(await M(() => window.__mundo.fuentes[0].activa))) await espera(20);
    await soltarTodo(); await espera(1500);
  };
  await M(() => { window.__mundo.eco = 'caracola'; });
  for (const pj of ['minotauro', 'ariadna', 'eco', 'pegaso']) {
    await elegir(pj);
    await tp(4.5, 8.5);
    if (pj === 'pegaso') await volarAlCimbalo();
    else { await mantener(['ArrowUp'], 600); await tocar('KeyE'); await espera(300); }
    await tp(17.5, 13.5); await tocar('KeyE'); await espera(300);
    const p = await pal();
    if (pj === 'pegaso') ok(p.fuente && p.O === 'O', 'Pegaso solo hace sonar el címbalo en el techo, pero no abre la puerta de bronce');
    else ok(!p.fuente && p.O === 'O' && (await M(() => window.__mundo.eco)) === 'caracola', `${pj} solo no hace sonar el címbalo ni abre la puerta de bronce`);
    intentosPal++; if (!(await ningunObjeto())) logrosPal++;
  }
  await M(() => { window.__mundo.fuentes[0].activa = false; });
  await elegir('fenix'); await volarAlCimbalo();
  ok(!(await pal()).fuente, 'Fénix no llega al techo (D21): el címbalo solo lo hace sonar Pegaso');
  await elegir('pegaso'); await volarAlCimbalo();
  intentosPal++;
  ok(intentosPal === 15 && logrosPal === 0 && (await pal()).got === 0, `ningún personaje solo resuelve un desafío del palacio (${intentosPal} intentos)`);

  // Soluciones en pareja
  await elegir('minotauro'); await tp(14.5, 29.5);
  await hasta('ArrowRight', () => window.__mundo.celdas[29][19] === '.', 4000); await espera(200);
  ok((await pal()).vas === '17,29' && (await pal()).G === '.', 'Almacenes: el Minotauro empuja la vasija a la placa y se abre la reja');
  await tp(18.5, 29.5); await ir(21.5, 29.5, { orden: 'x', tol: 0.15 }); await espera(300);
  ok((await recog('palacio')).includes('tablilla-arcilla'), 'Fénix y el Minotauro consiguen la tablilla de arcilla');
  await foto('35-almacenes');
  await tp(8.5, 23.5); await ir(8.5, 19.0, { orden: 'y', tol: 0.12 }); await ir(8.5, 18.4, { orden: 'y', tol: 0.1 }); await espera(200); s = await est();
  ok(s.z > 0.95, `Frescos: el Minotauro sube por la escala de Ariadna (z=${s.z.toFixed(2)})`);
  await embestir(); await espera(300);
  ok((await pal()).M === '.', 'el Minotauro rompe el muro agrietado de la terraza');
  await ir(8.5, 14.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await recog('palacio')).includes('hacha-doble'), 'Ariadna y el Minotauro consiguen el hacha doble');
  await foto('36-frescos-hacha');
  await elegir('eco'); await tp(4.5, 8.5); await espera(400);
  ok((await M(() => window.__mundo.eco)) === 'cimbalo' && (await page.textContent('#eco-texto')).includes('Címbalo'), 'Címbalos: Eco escucha el címbalo que hizo sonar quien vuela');
  await tp(17.5, 13.5); await tocar('KeyE'); await espera(300);
  ok((await pal()).O === '.', 'Eco repite el címbalo y la puerta de bronce se abre');
  await foto('37-puerta-bronce');
  await tp(17.5, 11.5); await ir(17.5, 5.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await recog('palacio')).includes('figura-serpientes'), 'Pegaso y Eco consiguen la figura con serpientes');
  await foto('38-figura');
  ok((await chip()) === 'Palacio 3/3' && (await page.textContent('#total-n')) === '9/9', 'el palacio queda en 3/3 y la partida en 9/9');

  // El campo de pruebas cuenta aparte
  await entrarPruebas();
  ok((await page.textContent('#zona-n')) === '0/3' && !(await page.isVisible('#total-n')), 'el campo de pruebas cuenta aparte (0/3) y no muestra el total de la partida');
  await page.click('#btn-menu'); await page.click('#menu-pruebas'); await page.waitForFunction(() => window.__mundo.id === 'mundo'); await espera(500);
  zona('palacio');
  ok((await page.textContent('#total-n')) === '9/9' && (await chip()) === 'Palacio 3/3', 'al volver a la partida el total sigue en 9/9');

  // Recarga en el palacio: todo igual
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Ruta")'); await page.waitForFunction(() => window.__mundo); await espera(500);
  const p2 = await pal();
  ok((await idMapa()) === 'mundo' && (await page.textContent('#zona-nombre')) === 'Palacio' && p2.D === '.' && p2.G === '.' && p2.M === '.' && p2.O === '.' && p2.sogas && p2.fuente && p2.br === 2 && p2.vas === '17,29' && p2.got === 3,
    'tras recargar en el palacio todo sigue igual: puerta del sol, reja, muro, puerta de bronce, soga, címbalo y vasija');
  ok((await page.textContent('#total-n')) === '9/9' && (await chip()) === 'Palacio 3/3', 'tras recargar, la partida sigue en 9/9');
  await tp(8.5, 24.5); await espera(900); await foto('39-palacio-medio');
  await tp(11.5, 6.5); await espera(900); await foto('40-palacio-norte');

  // 11. Sprites de personajes
  const IDS = ['pegaso', 'minotauro', 'ariadna', 'fenix', 'eco', 'ulises'];
  const sp = await page.evaluate(() => window.__sprites());
  ok(sp.listos && IDS.every(id => sp.imagenes[id] && sp.imagenes[id][0] > 0 && sp.imagenes[id][1] > 0), 'los seis sprites cargan (tamaño natural mayor que cero)');
  const ALAS = ['pegaso-ala-cerca', 'pegaso-ala-lejos', 'fenix-ala-cerca', 'fenix-ala-lejos'];
  ok(ALAS.every(id => sp.imagenes[id] && sp.imagenes[id][0] > 0 && sp.imagenes[id][1] > 0), 'las cuatro alas cargan (tamaño natural mayor que cero)');
  // Aleteo: se dibuja el personaje en un canvas aparte en dos instantes y se cuentan los píxeles que difieren
  const aleteo = (id, volando, t1, t2) => page.evaluate(([id, volando, t1, t2]) => {
    const dib = t => {
      const c = document.createElement('canvas'); c.width = 120; c.height = 120; const cx = c.getContext('2d');
      window.__dibujarPersonaje(cx, { id }, { x: 60, y: 90, fx: 1, fy: 1, t, caminando: false, volando, embistiendo: false, escala: 1, paso: 0 });
      return cx.getImageData(0, 0, 120, 120).data;
    };
    const a = dib(t1), b = dib(t2); let n = 0;
    for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k + 3] - b[k + 3]) > 60 || Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 90) n++;
    return n;
  }, [id, volando, t1, t2]);
  for (const id of ['pegaso', 'fenix']) {
    const vuela = await aleteo(id, true, 0, Math.PI / 40), quieto = await aleteo(id, false, 0, 0.4);
    ok(vuela > 100, `el aleteo de ${id} volando se ve (${vuela} píxeles distintos entre dos instantes)`);
    ok(quieto < vuela, `quieto, ${id} casi no cambia (${quieto} píxeles contra ${vuela} volando)`);
  }
  ok(sp.listos && sp.fallidos.length === 0 && Object.keys(sp.escenario).length === sp.esperados && sp.esperados > 40 && Object.values(sp.escenario).every(d => d[0] > 0 && d[1] > 0), `los ${sp.esperados} sprites del escenario cargan y se rasterizan (fallidos: ${sp.fallidos.join(',') || 'ninguno'})`);
  const OBJ_SPRITES = ['ancla-piedra', 'tablero-juego', 'fresco-delfines', 'riton-toro', 'tablilla-arcilla', 'hacha-doble', 'figura-serpientes', 'frasco-pulpo', 'sello-barco'];
  ok(['brillo', ...OBJ_SPRITES].every(n => sp.escenario[n] && sp.escenario[n][0] > 0), 'los diez sprites de coleccionables (nueve objetos y el brillo) cargan y se rasterizan');
  // Cada objeto se dibuja con su propio sprite; uno de prueba usa el genérico
  const huella = await page.evaluate(ids => {
    const dib = id => {
      const c = document.createElement('canvas'); c.width = 80; c.height = 80; const cx = c.getContext('2d'); cx.translate(40, 40);
      window.__dibujarObjeto(cx, { t: 0 }, { x: 0, y: 0, zBase: 0, id });
      return Array.from(cx.getImageData(0, 0, 80, 80).data).join(',');
    };
    const r = {}; for (const id of [...ids, 'prueba-1', 'prueba-2']) r[id] = dib(id); return r;
  }, OBJ_SPRITES);
  ok(new Set(OBJ_SPRITES.map(id => huella[id])).size === OBJ_SPRITES.length && OBJ_SPRITES.every(id => huella[id] !== huella['prueba-1']), 'cada objeto del mundo se dibuja con su propio sprite, distinto del genérico y de los demás');
  ok(huella['prueba-1'] === huella['prueba-2'] && /[1-9]/.test(huella['prueba-1']), 'un objeto de prueba sigue usando el sprite genérico');
  // En el mundo: con cada personaje el canvas difiere del que no dibuja ninguno
  await tp(8.5, 24.5); await espera(900);
  const tomar = id => page.evaluate(async id => {
    window.__mundo.jugador.personaje = id; await new Promise(r => setTimeout(r, 200));
    const l = document.querySelector('canvas'), d = l.getContext('2d').getImageData(0, 0, l.width, l.height).data;
    // La imagen base queda en el navegador: solo vuelve el conteo, no millones de canales RGBA.
    if (id === 'ninguno') { window.__baseSprites = d; return 0; }
    const base = window.__baseSprites;
    let dif = 0;
    for (let k = 0; k < base.length; k += 4) if (Math.abs(d[k] - base[k]) + Math.abs(d[k + 1] - base[k + 1]) + Math.abs(d[k + 2] - base[k + 2]) > 60) dif++;
    return dif;
  }, id);
  const pjOriginal = (await est()).pj;
  await tomar('ninguno');
  for (const id of IDS) {
    const dif = await tomar(id);
    ok(dif > 500, `se ve el sprite de ${id} en el mundo (${dif} píxeles distintos)`);
  }
  await page.evaluate(p => { window.__mundo.jugador.personaje = p; delete window.__baseSprites; }, pjOriginal); await espera(200);
  // En la tira: cada tarjeta tiene contenido
  for (const id of IDS) {
    const px = await page.evaluate(id => { const c = document.querySelector(`.pj[data-id=${id}] canvas`); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; return n; }, id);
    ok(px > 500, `la tira muestra el sprite de ${id} (${px} píxeles con contenido)`);
  }

  // 19. Mundo unido: el mapa y la migración de perfiles guardados con el formato viejo (tres mapas)
  const mundoJson = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos/mapa-mundo.json'), 'utf8'));
  ok(mundoJson.filas.every(f => f.length === mundoJson.filas[0].length) && mundoJson.filas.length === 112, 'mapa-mundo: todas las filas tienen el mismo largo (112 filas)');
  ok(mundoJson.zonas.map(z => z.id).join() === 'palacio,plaza,canal,puerto' && mundoJson.zonas[0].desde === 0 && mundoJson.zonas.every((z, i, a) => i === 0 || z.desde === a[i - 1].hasta + 1) && mundoJson.zonas[3].hasta === 111,
    'mapa-mundo: palacio, plaza, canal y puerto, de norte a sur, cubren todas las filas sin huecos');
  ok(mundoJson.zonas.every(z => cat.zonas.some(q => q.id === z.id)) && Object.keys(mundoJson.sonidos).sort().join() === 'caracola,cimbalo', 'mapa-mundo: las zonas existen en el catálogo y el mundo declara el catálogo de sonidos una vez');
  ok(mundoJson.objetos.filter(o => o.tipo === 'coleccionable').length === 9, 'mapa-mundo: los nueve coleccionables están en el mundo');
  const resto = o => /^#/.test(mundoJson.filas[o.y][o.x]) ? false : true;
  ok(mundoJson.objetos.every(resto) && mundoJson.braseros.every(resto) && mundoJson.fuentes.every(resto), 'mapa-mundo: objetos, braseros y fuentes no quedan dentro de una pared');
  // Dos perfiles con el formato viejo, que entran al próximo arranque (después de que la página guarde lo suyo)
  await page.addInitScript(() => {
    if (sessionStorage.getItem('inyectado')) return;
    sessionStorage.setItem('inyectado', '1');
    const clave = 'mitos-mundo-abierto-v1', d = JSON.parse(localStorage.getItem(clave));
    const vacio = { muros: [], rejas: [], empujables: {}, braseros: [], soles: [], fuentes: [], puertas: [], eco: 'caracola', sogas: [] };
    d.perfiles.push({ id: 'pantiguo1', nombre: 'Antigua', objetos: { 'ancla-piedra': true, 'tablilla-arcilla': true }, personaje: 'ariadna', vistoCambio: true, mapa: 'palacio', llegada: [8.5, 23.5], eco: 'caracola',
      mundos: { puerto: { ...vacio }, plaza: { ...vacio, muros: ['5,22'], braseros: ['2,11'], sogas: ['14,23'] }, palacio: { ...vacio, rejas: ['19,29'], empujables: { '15,29': [17, 29] }, braseros: ['3,31'], sogas: ['8,24'] } } });
    d.perfiles.push({ id: 'pantiguo2', nombre: 'Anterior', objetos: {}, personaje: 'pegaso', vistoCambio: false, mapa: 'plaza', llegada: null, eco: null, mundos: {} });
    localStorage.setItem(clave, JSON.stringify(d));
  });
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Antigua")'); await page.waitForFunction(() => window.__mundo); await espera(600);
  const estadoMigrado = async () => {
    const r = await page.evaluate(() => { const m = window.__mundo, j = m.jugador;
      const b = (x, y) => m.braseros.find(q => q.x === x && q.y === y).encendido;
      return { id: m.id, x: j.x, y: j.y, pj: j.personaje, muro: m.celdas[62][5],
        reja: m.celdas[29][19], enlace: m.enlaces[0].abierto, vas: m.empujables[0].tx + ',' + m.empujables[0].ty,
        brPlaza: b(2, 51), brPlaza2: b(8, 51), brPalacio: b(3, 31), brPalacio2: b(9, 31), solPalacio: m.celdas[33][17],
        sogaPalacio: m.sogas.find(q => q.a[0] === 8 && q.a[1] === 24).tendida, sogaPlaza: m.sogas.find(q => q.a[0] === 14 && q.a[1] === 63).tendida,
        sogasTendidas: m.sogas.filter(q => q.tendida).length, eco: m.eco, got: m.coleccionables.filter(c => c.recogido).map(c => c.id).sort().join() }; });
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem('mitos-mundo-abierto-v1')).perfiles.find(q => q.nombre === 'Antigua'));
    return { ...r, perfil: p, chip: await chip(), total: await page.textContent('#total-n') };
  };
  zona('palacio');
  let mg = await estadoMigrado();
  ok(mg.id === 'mundo' && mg.pj === 'ariadna' && Math.abs(mg.x - 8.5) < 0.1 && Math.abs(mg.y - 23.5) < 0.1 && mg.chip === 'Palacio 1/3', `un perfil viejo en el palacio carga en el mundo, en el mismo lugar (${mg.x.toFixed(1)}, ${mg.y.toFixed(1)})`);
  ok(mg.muro === '.' && mg.reja === '.' && mg.enlace && mg.vas === '17,29', 'la migración conserva el muro roto de la plaza (trasladado), la reja abierta y la vasija movida del palacio');
  ok(mg.brPlaza && !mg.brPlaza2 && mg.brPalacio && !mg.brPalacio2 && mg.solPalacio === 'D', 'la migración conserva los braseros encendidos de cada zona, y no enciende los demás');
  ok(mg.sogaPalacio && mg.sogaPlaza && mg.sogasTendidas === 2, 'la migración conserva las sogas tendidas de la plaza y del palacio');
  ok(mg.eco === 'caracola' && mg.got === 'ancla-piedra,tablilla-arcilla' && mg.total === '2/9', 'la migración conserva el sonido de Eco y los coleccionables (2/9)');
  ok(mg.perfil.mapa === 'mundo' && mg.perfil.mundoUnido === true && mg.perfil.mundos.plaza.muros.join() === '5,22' && mg.perfil.mundos.palacio.rejas.join() === '19,29' && mg.perfil.mundos.mundo.muros.join() === '5,62' && mg.perfil.mundos.mundo.braseros.slice().sort().join(' ') === '2,51 3,31',
    'el perfil queda en el mundo, marcado como migrado, con las claves viejas intactas y las nuevas trasladadas');
  await foto('41-migrado');
  // Recargar después: la migración no se repite y todo sigue igual
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Antigua")'); await page.waitForFunction(() => window.__mundo); await espera(600);
  const mg2 = await estadoMigrado();
  const igual = ['id', 'pj', 'muro', 'reja', 'enlace', 'vas', 'brPlaza', 'brPlaza2', 'brPalacio', 'brPalacio2', 'solPalacio', 'sogaPalacio', 'sogaPlaza', 'sogasTendidas', 'eco', 'got', 'chip', 'total'].every(k => mg2[k] === mg[k]);
  ok(igual && Math.abs(mg2.x - 8.5) < 0.1 && Math.abs(mg2.y - 23.5) < 0.1 && JSON.stringify(mg2.perfil.mundos.mundo) === JSON.stringify(mg.perfil.mundos.mundo), 'recargar después de migrar mantiene todo igual, en el mismo lugar');
  // Perfil viejo sin lugar guardado, en la plaza: aparece en el inicio de la plaza, trasladado
  await page.click('#btn-menu'); await page.click('#menu-perfiles');
  await page.click('.perfil:has-text("Anterior")'); await page.waitForFunction(() => window.__mundo.coleccionables.every(c => !c.recogido)); await espera(500);
  zona('plaza'); s = await est();
  ok(Math.abs(s.x - 11.5) < 0.1 && Math.abs(s.y - 31.5) < 0.1 && (await chip()) === 'Plaza central 0/3', `un perfil viejo sin lugar guardado en la plaza aparece en el inicio de la plaza (${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);

  // 20. A3: señales visuales de los poderes (cada una distinta, todas en el estado del mundo)
  {
  const senales = tipo => page.evaluate(t => window.__mundo.senales.filter(q => q.tipo === t).length, tipo);
  const hastaSenal = async (tipo, max = 2500) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if ((await senales(tipo)) > 0) return true; await espera(25); } return false; };
  const limpiar = () => M(() => { window.__mundo.senales = []; });
  // Los cuadros se guardan y se comparan dentro de la página (pasarlos a node pesa demasiado)
  const lienzo = nombre => page.evaluate(async n => { await new Promise(r => setTimeout(r, 120)); const l = document.querySelector('canvas'); (window.__cuadros = window.__cuadros || {})[n] = l.getContext('2d').getImageData(0, 0, l.width, l.height).data; }, nombre);
  const difPix = (x, y) => page.evaluate(([x, y]) => { const a = window.__cuadros[x], b = window.__cuadros[y]; let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 60) n++; return n; }, [x, y]);
  const fuenteDibujo = fs.readFileSync(path.join(RAIZ, 'dibujo.js'), 'utf8');
  const trozo = (desde, hasta) => fuenteDibujo.slice(fuenteDibujo.indexOf(desde), fuenteDibujo.indexOf(hasta));
  ok(!/createRadialGradient|createLinearGradient/.test(trozo('function dibujarJugador', '// ---------- Sprites') + trozo('function dibujarOndas', 'function dibujarObjeto') + trozo('function dibujarSoga', 'function dibujarOndas')),
    'dibujo.js: el brillo de Fénix, las ondas, las señales y la soga no usan degradés');
  ok(!/createRadialGradient|createLinearGradient/.test(trozo('function dibujarObjeto', 'function silueta')), 'dibujarObjeto no usa degradés');
  ok(!/#fff3c8/i.test(trozo('function dibujarSenales', 'function dibujarObjeto')) && !/COL\.oro/.test(trozo('function dibujarJugador', '// ---------- Sprites') + trozo('function dibujarOndas', 'function dibujarObjeto')), 'las señales de poder no usan el oro pálido reservado a mecanismos');

  // Ariadna: la soga se desenrolla (visual) pero se puede pisar desde el primer instante
  await elegir('ariadna'); zona('plaza'); await tp(14.5, 22.5);
  await M(() => { window.__progs = []; const m = window.__mundo, s = m.sogas.find(q => q.a[0] === 14 && q.a[1] === 63);
    window.__tim = setInterval(() => window.__progs.push([s.prog, s.tendida, m.alturaTile(14, 61), s.desde]), 16); });
  const previo = await M(() => window.__mundo.alturaTile(14, 61));
  await page.keyboard.press('KeyE'); await espera(300); await foto('A3-1-soga-desenrollando'); await espera(700);
  const progs = await M(() => { clearInterval(window.__tim); return window.__progs; });
  const alt = await M(() => window.__mundo.sogas.find(q => q.a[0] === 14 && q.a[1] === 63).casillas[2].h);
  const medio = progs.find(q => q[1] && q[0] < 1);
  ok(medio && medio[0] < 0.7 && progs[progs.length - 1][0] === 1 && progs.every((q, i) => i === 0 || q[0] >= progs[i - 1][0] || !progs[i - 1][1]), 'Ariadna: el progreso de la soga va de 0 a 1 en unos 0,5 s y no retrocede');
  ok(medio && medio[1] && Math.abs(medio[2] - alt) < 1e-9 && Math.abs(previo - alt) > 1e-9, `Ariadna: la soga ya se puede pisar mientras se desenrolla (altura ${medio ? medio[2].toFixed(2) : '?'} contra ${previo.toFixed(2)} antes)`);
  ok(medio && medio[3] === 0, 'Ariadna: el desenrollo parte de la argolla más cercana');
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Anterior")'); await page.waitForFunction(() => window.__mundo); await espera(500);
  ok(await M(() => { const s = window.__mundo.sogas.find(q => q.a[0] === 14 && q.a[1] === 63); return s.tendida && s.prog === 1; }), 'Ariadna: una soga restaurada del guardado aparece entera, sin animación');
  await foto('A3-1b-soga-entera');

  // Eco: arcos del color del sonido, y el símbolo sobre su cabeza solo con un sonido guardado
  await elegir('eco'); zona('plaza'); await tp(11.5, 31.5); await limpiar();
  await M(() => { window.__mundo.eco = 'caracola'; });
  await tocar('KeyE'); await foto('A3-2-eco-ondas');
  const ond = await M(() => ({ n: window.__mundo.ondas.length, c: window.__mundo.ondas[0] && window.__mundo.ondas[0].color, cs: window.__mundo.sonidos.caracola.color }));
  ok(ond.n > 0 && ond.c === ond.cs, `Eco: al repetir salen ondas con el color del sonido (${ond.c})`);
  await espera(1200);
  await M(() => { window.__mundo.eco = null; window.__mundo.ondas = []; });
  await lienzo('sin1'); await lienzo('sin2');
  await M(() => { window.__mundo.eco = 'caracola'; });
  await lienzo('con'); await foto('A3-2b-eco-simbolo');
  const ruido = await difPix('sin1', 'sin2'), simb = await difPix('sin1', 'con');
  ok(simb > ruido + 40, `Eco: con sonido guardado se ve su símbolo sobre la cabeza (${simb} píxeles contra ${ruido} sin cambio)`);
  await elegir('pegaso');
  await lienzo('p1'); await M(() => { window.__mundo.eco = null; }); await lienzo('p2');
  ok((await difPix('p1', 'p2')) < simb, 'el símbolo del sonido solo aparece sobre Eco, no sobre otro personaje');

  // Campo de pruebas: Pegaso, Fénix y Minotauro
  await entrarPruebas();
  await elegir('pegaso'); await tp(5.5, 23.5); await limpiar();
  await poner(new Set(['KeyE'])); ok(await hastaSenal('rafaga', 800), 'Pegaso: al despegar sale una ráfaga de aire'); await foto('A3-3-rafaga');
  await espera(500); await limpiar(); await soltarTodo();
  ok(await hastaSenal('polvo', 3500), 'Pegaso: al aterrizar de un vuelo levanta polvo'); await foto('A3-4-aterriza');
  await elegir('eco'); await tp(5.5, 23.5); await espera(300); await limpiar();
  await poner(new Set(['ArrowRight'])); await espera(50); await saltar(); await espera(100); ok((await senales('polvo')) === 0, 'saltar no levanta polvo en el aire');
  ok(await hastaSenal('polvo', 1500), 'Eco: al aterrizar de un salto levanta polvo'); await soltarTodo();
  // No en el agua
  await elegir('ariadna'); await tp(10.5, 22.5); await limpiar();
  ok((await M(() => window.__mundo.suelo(10.5, 20.5))) <= -9, 'el tramo de agua del campo de pruebas es vacío');
  await M(() => { const j = window.__mundo.jugador; j.x = 10.5; j.y = 20.5; j.z = 1.5; j.vz = -3; j.enSuelo = false; j.planeo = false; });
  await espera(1800);
  ok((await senales('polvo')) === 0 && (await est()).estado === 'jugando', 'al caer al agua no se levanta polvo y se reaparece en piso firme');
  // Fénix: brasas al volar y halo al brillar
  await elegir('fenix'); await tp(5.5, 23.5); await limpiar();
  await poner(new Set(['KeyE'])); ok(await hastaSenal('brasa', 1500), 'Fénix: al volar suelta brasas'); await espera(400); await foto('A3-5-fenix-brasas');
  const nBrasas = await senales('brasa'); await soltarTodo(); await espera(1500);
  ok(nBrasas > 0 && nBrasas < 12, `las brasas son moderadas (${nBrasas} a la vez)`);
  ok(!(await M(() => window.__mundo.senales.some(q => q.tipo === 'brasa'))), 'las brasas se apagan solas');
  await limpiar(); await tocar('KeyE');
  ok((await M(() => window.__mundo.jugador.brillo)) > 0, 'Fénix: tocar brilla');
  await M(() => { window.__mundo.jugador.brillo = 1; });
  await lienzo('halo'); await foto('A3-6-fenix-halo'); await espera(1200);
  await lienzo('sinHalo'); const dh = await difPix('halo', 'sinHalo');
  ok(dh > 400, `Fénix: el halo de rayos se ve y se apaga (${dh} píxeles)`);
  // Minotauro: polvo y esfuerzo al empujar, estela y polvo al embestir
  await elegir('minotauro'); await tp(13.5, 17.5); await limpiar();
  await poner(new Set(['ArrowRight']));
  ok(await hastaSenal('polvo', 3000), 'Minotauro: al empujar el bloque sale polvo en su base');
  ok((await M(() => window.__mundo.jugador.esfuerzo)) > 0, 'Minotauro: mientras empuja hay líneas de esfuerzo'); await foto('A3-7-empuje'); await soltarTodo(); await espera(400);
  await tp(3.5, 23.5); await limpiar();
  await poner(new Set(['ArrowRight'])); await espera(40); await page.keyboard.press('KeyE');
  ok(await hastaSenal('polvo', 600), 'Minotauro: al embestir levanta polvo a los pies');
  ok(await M(() => !!window.__mundo.jugador.embiste), 'Minotauro: la estela se dibuja mientras embiste'); await foto('A3-8-embestida');
  await soltarTodo(); await espera(500);
  }

  // 11. Sin conexión
  if (!SIN_SERVIDOR) {
  await page.evaluate(() => navigator.serviceWorker.ready); await espera(500);
  await ctx.setOffline(true);
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  ok(true, 'carga sin conexión desde el service worker');
  await page.click('.perfil:has-text("Ruta")'); await page.waitForFunction(() => window.__mundo); await espera(500);
  const spOff = await page.evaluate(() => window.__sprites());
  ok(spOff.listos && IDS.every(id => spOff.imagenes[id] && spOff.imagenes[id][0] > 0), 'sin conexión el juego arranca y los seis sprites cargan');
  ok(['brillo', ...OBJ_SPRITES].every(n => spOff.escenario[n] && spOff.escenario[n][0] > 0), 'sin conexión los diez sprites de coleccionables cargan');
  ok(ALAS.every(id => spOff.imagenes[id] && spOff.imagenes[id][0] > 0), 'sin conexión las cuatro alas cargan');
  const tiraOff = await page.evaluate(() => { const c = document.querySelector('.pj[data-id=eco] canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; return n; });
  ok(tiraOff > 500, 'sin conexión la tira muestra los sprites');
  await ctx.setOffline(false);
  } else console.log('PENDIENTE: instalación y recarga offline del service worker (modo --sin-servidor).');

  await seccionU1();
  ok(errores.length === 0, 'sin errores en consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close(); servidor.close();
  console.log(fallos ? `\n${fallos} verificación(es) fallaron` : '\nTodo en orden');
  process.exit(fallos ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
