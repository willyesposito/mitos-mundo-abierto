// No es parte del juego. Herramienta de Claude Code: abre el juego en un navegador sin pantalla
// con tamaño de celular, lo juega con el teclado y verifica de punta a punta que todo funcione.
// Uso: node herramientas/probar.js [carpeta-de-capturas]
const http = require('http'), fs = require('fs'), path = require('path');
let pw;
for (const r of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { pw = require(r); break; } catch (e) {} }
if (!pw) { console.error('Falta playwright'); process.exit(2); }

const RAIZ = path.resolve(__dirname, '..');
const SALIDA = process.argv[2] || path.join(RAIZ, 'capturas');
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
  const url = `http://localhost:${servidor.address().port}/?prueba`;
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({ ...pw.devices['Pixel 7'], serviceWorkers: 'allow' });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });

  const est = () => page.evaluate(() => {
    const m = window.__mundo, j = m.jugador;
    return { x: j.x, y: j.y, z: j.z, vz: j.vz, enSuelo: j.enSuelo, pj: j.personaje, estado: j.estado,
      recogidos: m.coleccionables.filter(c => c.recogido).map(c => c.id),
      celda: (x, y) => null };
  });
  const celda = (x, y) => page.evaluate(([x, y]) => window.__mundo.celdas[y][x], [x, y]);
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
    while (Date.now() - t0 < max && !(await page.evaluate(cond))) await espera(20);
    await soltarTodo(); await espera(150);
  }
  // El campo de pruebas se abre desde el menú (no es el inicio)
  const entrarPruebas = async () => {
    await page.click('#btn-menu'); await page.click('#menu-pruebas');
    await page.waitForFunction(() => window.__mundo && window.__mundo.id === 'pruebas'); await espera(500);
  };
  const bloque = () => page.evaluate(() => window.__mundo.empujables.filter(e => e.tipo === 'bloque').map(e => [e.tx, e.ty])[0]);

  // 1. Perfiles
  await page.goto(url); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  ok(true, 'carga la pantalla de perfiles');
  await foto('01-perfiles');
  await page.fill('#nombre-nuevo', 'Prueba'); await page.click('#form-nuevo button[type=submit]');
  await page.waitForFunction(() => window.__mundo); await espera(400);
  await foto('02-inicio');
  let s = await est();
  ok(s.pj === 'pegaso' && s.enSuelo && Math.abs(s.x - 10.5) < 0.01 && Math.abs(s.y - 21.5) < 0.01, 'arranca con Pegaso en el muelle del puerto');
  ok(await page.evaluate(() => window.__mundo.id) === 'puerto' && (await page.textContent('#zona-nombre')) === 'Puerto', 'el juego arranca en el puerto');
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

  // 2. Campo de pruebas desde el menú
  await page.click('#btn-menu');
  ok((await page.textContent('#menu-pruebas')) === 'Campo de pruebas', 'el menú ofrece el campo de pruebas');
  await page.click('#menu-seguir'); await espera(200);
  await entrarPruebas();
  s = await est();
  ok(await page.evaluate(() => window.__mundo.id) === 'pruebas' && Math.abs(s.x - 10.5) < 0.2 && Math.abs(s.y - 24.5) < 0.2 && (await page.textContent('#zona-nombre')) === 'Campo de pruebas', 'el campo de pruebas se abre desde el menú, en su inicio');

  // 2b. Caer al agua y reaparecer sin perder nada
  await ir(10.5, 20.9, { orden: 'y', tol: 0.15 });
  await poner(new Set(['ArrowUp'])); await espera(500);
  await foto('03-cayendo');
  await poner(new Set(['ArrowUp'])); await espera(1400); await soltarTodo(); await espera(700);
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
  await soltarTodo(); await espera(900);
  s = await est();
  ok(s.enSuelo && Math.abs(s.z - 2) < 0.05, `aterriza en el techo (z=${s.z.toFixed(2)})`);

  // 5. Cambio de personaje
  await page.click('.pj[data-id=minotauro]'); await espera(200);
  s = await est(); ok(s.pj === 'minotauro', 'cambia a Minotauro tocando su botón');
  ok(!(await page.isVisible('#pista-cambio')), 'la pista de cambio desaparece tras cambiar');
  ok((await page.textContent('#btn-poder .etiqueta')) === 'Embestir', 'el botón de poder pasa a "Embestir"');
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
  ok(lista.includes('Prueba') && lista.includes('0/7'), 'los objetos de prueba no suman a la partida (0/7 en el perfil)');
  await page.click('.perfil'); await page.waitForFunction(() => window.__mundo); await espera(300);
  ok(await page.evaluate(() => window.__mundo.id) === 'puerto', 'tras recargar desde el campo de pruebas, se vuelve al mapa de la partida');
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
  await page.fill('#nombre-nuevo', 'Otra'); await page.click('#form-nuevo button[type=submit]');
  await page.waitForFunction(() => window.__mundo && window.__mundo.coleccionables.every(c => !c.recogido)); await espera(200);
  ok((await page.textContent('#total-n')) === '0/7', 'un perfil nuevo arranca en 0/7 y el otro no se toca');
  await entrarPruebas();
  ok((await celda(11, 5)) === 'M' && (await abiertas())[0] === false, 'un perfil nuevo arranca con el muro entero y la reja cerrada');
  b = [await bloque()];
  ok(b[0][0] === 14 && b[0][1] === 17, `un perfil nuevo arranca con el bloque en su lugar (${b[0]})`);
  await page.click('#btn-menu'); await page.click('#menu-perfiles');
  await page.click('.perfil'); await page.waitForFunction(() => window.__mundo); await espera(300);
  await entrarPruebas();
  ok((await celda(11, 5)) === '.' && (await abiertas())[0] === true, 'el primer perfil conserva su mundo después de usar otro');

  // --- Ayudas para las sesiones de poderes: reubicar al personaje y elegirlo ---
  const tp = (x, y) => page.evaluate(([x, y]) => { const m = window.__mundo, j = m.jugador; j.x = x; j.y = y; j.z = m.suelo(x, y); j.vz = 0; j.enSuelo = true; j.planeo = false; j.estado = 'jugando'; j.seguro = { x, y, z: j.z }; }, [x, y]);
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
  ok(['puerto', 'plaza', 'palacio', 'pruebas'].every(z => cat.zonas.some(q => q.id === z)), 'las zonas puerto, plaza, palacio y pruebas existen');
  ok(cat.objetos.filter(o => o.zona === 'pruebas').length === 3, 'los 3 objetos de prueba siguen');
  const textosPlan = {};
  for (const sec of plan.split(/^### /m).slice(1)) { const t = sec.match(/\*\*Texto:\*\* (.+)/); if (t) textosPlan[sec.split('\n')[0].trim().toLowerCase().replace('é', 'e').replace('í', 'i')] = t[1].trim(); }
  ok(pers.every(p => p.ficha && p.ficha.texto === textosPlan[p.nombre.toLowerCase().replace('é', 'e').replace('í', 'i')]), 'las cinco fichas repiten exacto el texto del plan');
  ok(pers.every(p => p.poder.activo), 'los cinco poderes están activos');
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
  for (let i = 0; i < 5; i++) {
    const nombre = await page.textContent('#ficha-nombre'), p = pers.find(q => q.nombre === nombre);
    const c = await caben();
    if (p && (await page.textContent('#ficha-texto')) === p.ficha.texto && c.dentro && c.sinCorte && (await page.textContent('#ficha-poder-titulo')).startsWith('Poder: ')) vistos++;
    await page.click('#ficha-siguiente');
  }
  ok(vistos === 5, `las cinco fichas se abren con texto, poder y señal sin cortarse (${vistos}/5)`);
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
  await poner(new Set(['ArrowUp'])); await espera(1500); await soltarTodo(); await espera(700);
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
  ok(est2 === JSON.stringify(['braseros', 'eco', 'empujables', 'fuentes', 'muros', 'puertas', 'rejas', 'sogas', 'soles']), `el estado guardado tiene una clave por mecanismo (${est2})`);

  // 17. Sesión 6: recorrido completo desde el inicio (puerto y plaza)
  const idMapa = () => page.evaluate(() => window.__mundo.id);
  const objetosPlaza = () => page.evaluate(() => window.__mundo.coleccionables.filter(c => c.recogido).map(c => c.id));
  const embestir = async () => { await poner(new Set(['ArrowUp'])); await espera(40); await page.keyboard.press('KeyE'); await espera(700); await soltarTodo(); await espera(150); };
  await page.click('#btn-menu'); await page.click('#menu-perfiles');
  await page.fill('#nombre-nuevo', 'Ruta'); await page.click('#form-nuevo button[type=submit]');
  await page.waitForFunction(() => window.__mundo && window.__mundo.id === 'puerto'); await espera(500);
  ok((await idMapa()) === 'puerto' && (await page.textContent('#zona-n')) === '0/1', 'un perfil nuevo empieza en el puerto, sin objetos');
  await foto('24-puerto');
  // Puerto: el ancla se agarra caminando; no hay nada que resolver
  await ir(10.5, 13.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await est()).recogidos.includes('ancla-piedra') && (await page.textContent('#zona-n')) === '1/1', 'Pegaso agarra el ancla de piedra caminando por el muelle');
  // Eco escucha la caracola
  await elegir('eco');
  await ir(10.5, 15.5, { orden: 'y', tol: 0.15 }); await ir(5.5, 15.5, { orden: 'x', tol: 0.15 }); await espera(300);
  ok((await M(() => window.__mundo.eco)) === 'caracola', 'Eco guarda la caracola en el puerto');
  await foto('25-puerto-caracola');
  await ir(10.5, 15.5, { orden: 'x', tol: 0.15 });
  await hasta('ArrowUp', () => window.__mundo.id === 'plaza', 9000); await espera(700);
  s = await est();
  ok((await idMapa()) === 'plaza' && s.y > 30 && s.pj === 'eco', `la salida norte del puerto lleva a la plaza, a su entrada sur (y=${s.y.toFixed(1)})`);
  ok((await M(() => window.__mundo.eco)) === 'caracola' && (await page.textContent('#eco-texto')).includes('Caracola'), 'Eco conserva el sonido de la caracola al cambiar de mapa');
  ok((await page.textContent('#zona-nombre')) === 'Plaza central' && (await page.textContent('#zona-n')) === '0/3', 'la plaza muestra su zona y sus tres objetos');
  const guardado = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('mitos-mundo-abierto-v1')); const p = d.perfiles.find(q => q.nombre === 'Ruta'); return { mapa: p.mapa, eco: p.eco, puerto: !!(p.mundos && p.mundos.puerto) }; });
  const g0 = await guardado();
  ok(g0.mapa === 'plaza' && g0.eco === 'caracola' && g0.puerto, 'el perfil guarda en qué mapa está y el sonido de Eco');
  await tp(11.5, 24.5); await espera(900); await foto('26-plaza-sur');
  await tp(11.5, 12.5); await espera(900); await foto('27-plaza-norte');

  // Ningún desafío de la plaza se resuelve con otro personaje
  const retos = { sol: [5.5, 10.5], mar: [16.5, 10.5], muro: [5.5, 23.5] };
  const esquema = () => page.evaluate(() => ({ D: window.__mundo.celdas[8][5], O: window.__mundo.celdas[8][16], M: window.__mundo.celdas[22][5], br: window.__mundo.braseros.filter(b => b.encendido).length }));
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
  ok((await objetosPlaza()).length === 0, 'ningún objeto de la plaza se consigue con otro personaje');
  await elegir('eco'); await tp(16.5, 11.5);
  await M(() => { window.__mundo.eco = null; }); await tocar('KeyE');
  ok((await esquema()).O === 'O', 'Eco sin el sonido de la caracola no abre la puerta del mar');
  await M(() => { window.__mundo.eco = 'caracola'; });
  // Terrazas bajas: Pegaso y Fénix practican, sin premio
  await elegir('minotauro'); await tp(14.5, 20.5);
  await poner(new Set(['ArrowUp'])); await espera(900); await soltarTodo();
  ok((await est()).z < 0.1, 'el Minotauro no sube a las terrazas bajas');
  await elegir('pegaso'); await tp(14.5, 20.5);
  await poner(new Set(['KeyE', 'ArrowUp'])); await espera(1000); await poner(new Set(['KeyE'])); await espera(300); await soltarTodo(); await espera(1500);
  s = await est(); ok(s.enSuelo && Math.abs(s.z - 1) < 0.05 && s.y < 20, `Pegaso vuela a la terraza baja (z=${s.z.toFixed(2)})`);
  await foto('28-terrazas');
  await elegir('ariadna'); await tp(14.5, 22.5); await tocar('KeyE');
  ok(await page.evaluate(() => window.__mundo.sogas[0].tendida), 'Ariadna tiende la soga entre las argollas de la plaza');

  // Soluciones, cada una con su personaje
  await elegir('fenix'); await tp(2.5, 12.5); await tocar('KeyE');
  ok((await esquema()).br === 1 && (await esquema()).D === 'D', 'Fénix enciende un brasero y la puerta del sol sigue cerrada');
  await ir(8.5, 12.5, { orden: 'x', tol: 0.15 }); await tocar('KeyE');
  ok((await esquema()).D === '.', 'con los dos braseros encendidos se abre el pórtico del sol');
  await ir(5.5, 12.5, { orden: 'x', tol: 0.15 }); await ir(5.5, 4.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await objetosPlaza()).includes('tablero-juego'), 'Fénix consigue el tablero de juego');
  await foto('29-tablero');
  await elegir('eco'); await tp(16.5, 11.5); await tocar('KeyE'); await espera(300);
  ok((await esquema()).O === '.', 'Eco repite la caracola y se abre la puerta del mar');
  await foto('30-puerta-mar');
  await ir(16.5, 4.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await objetosPlaza()).includes('fresco-delfines'), 'Eco consigue el fresco de los delfines');
  await elegir('minotauro'); await tp(5.5, 24.5); await embestir(); await espera(300);
  ok((await esquema()).M === '.', 'el Minotauro rompe el muro agrietado');
  await ir(5.5, 18.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await objetosPlaza()).includes('riton-toro') && (await page.textContent('#zona-n')) === '3/3' && (await page.textContent('#total-n')) === '4/7', 'el Minotauro consigue el ritón: la plaza queda en 3/3 y el total en 4/7');
  await foto('31-riton');

  // Volver al puerto y regresar: se aparece en la entrada que corresponde
  await tp(11.5, 31.5);
  await hasta('ArrowDown', () => window.__mundo.id === 'puerto', 6000); await espera(700);
  s = await est(); ok((await idMapa()) === 'puerto' && s.y < 4 && s.pj === 'minotauro', `al volver al puerto se aparece en su entrada norte (y=${s.y.toFixed(1)})`);
  ok(s.recogidos.includes('ancla-piedra') && (await page.textContent('#zona-n')) === '1/1', 'el ancla sigue recogida al volver al puerto');
  await foto('32-puerto-vuelta');
  await hasta('ArrowUp', () => window.__mundo.id === 'plaza', 6000); await espera(700);
  s = await est(); ok((await idMapa()) === 'plaza' && s.y > 30, 'y otra vez a la plaza, por su entrada sur');
  ok((await esquema()).D === '.' && (await esquema()).M === '.' && (await esquema()).br === 2, 'la plaza queda como se la dejó al cruzar de mapa');

  // Recarga en medio: mismo mapa, todo igual
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Ruta")'); await page.waitForFunction(() => window.__mundo); await espera(500);
  s = await est(); const e1 = await esquema();
  ok((await idMapa()) === 'plaza' && s.y > 30 && s.pj === 'minotauro', 'tras recargar sigue en la plaza, en su entrada, con el mismo personaje');
  ok(e1.D === '.' && e1.O === '.' && e1.M === '.' && e1.br === 2, 'tras recargar, el pórtico, la puerta del mar y el muro siguen abiertos');
  ok(s.recogidos.length === 3 && (await page.textContent('#total-n')) === '4/7', 'tras recargar, los objetos siguen recogidos (4/7 en total)');
  ok((await M(() => window.__mundo.eco)) === 'caracola' && (await page.textContent('#eco-texto')).includes('Caracola'), 'tras recargar, Eco recuerda la caracola');
  ok(await page.evaluate(() => window.__mundo.sogas[0].tendida), 'tras recargar, la soga de la plaza sigue tendida');
  // El campo de pruebas desde la plaza, y de vuelta
  await entrarPruebas();
  ok((await page.textContent('#eco-texto')).includes('Caracola'), 'el sonido de Eco viaja también al campo de pruebas');
  await page.click('#btn-menu');
  ok((await page.textContent('#menu-pruebas')) === 'Salir del campo de pruebas', 'dentro del campo de pruebas el menú ofrece salir');
  await page.click('#menu-pruebas'); await page.waitForFunction(() => window.__mundo.id === 'plaza'); await espera(500);
  s = await est(); ok(s.y > 30, 'al salir del campo de pruebas se vuelve a la plaza, a su entrada');
  await entrarPruebas();
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Ruta")'); await page.waitForFunction(() => window.__mundo); await espera(400);
  ok((await idMapa()) === 'plaza', 'recargar desde el campo de pruebas devuelve a la plaza: el campo de pruebas no es el inicio');

  // 18. Sesión 7: palacio en terrazas (tres desafíos de a dos, desde la plaza)
  await elegir('minotauro'); await tp(11.5, 4.5); await espera(200);
  await hasta('ArrowUp', () => window.__mundo.id === 'palacio', 6000); await espera(700);
  s = await est();
  ok((await idMapa()) === 'palacio' && s.y > 36 && (await page.textContent('#zona-nombre')) === 'Palacio' && (await page.textContent('#zona-n')) === '0/3', `la rampa norte de la plaza lleva al palacio, a su entrada sur (y=${s.y.toFixed(1)})`);
  await foto('33-palacio-entrada');
  const pal = () => page.evaluate(() => { const m = window.__mundo; const v = m.empujables[0];
    return { D: m.celdas[33][17], G: m.celdas[29][19], M: m.celdas[17][8], O: m.celdas[10][17], sogas: m.sogas[0].tendida, fuente: m.fuentes[0].activa,
      br: m.braseros.filter(b => b.encendido).length, vas: v.tx + ',' + v.ty, got: m.coleccionables.filter(c => c.recogido).length }; });
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
  ok((await pal()).fuente, 'Fénix, que vuela igual, también hace sonar el címbalo');
  intentosPal++;
  ok(intentosPal === 15 && logrosPal === 0 && (await pal()).got === 0, `ningún personaje solo resuelve un desafío del palacio (${intentosPal} intentos)`);

  // Soluciones en pareja
  await elegir('minotauro'); await tp(14.5, 29.5);
  await hasta('ArrowRight', () => window.__mundo.celdas[29][19] === '.', 4000); await espera(200);
  ok((await pal()).vas === '17,29' && (await pal()).G === '.', 'Almacenes: el Minotauro empuja la vasija a la placa y se abre la reja');
  await tp(18.5, 29.5); await ir(21.5, 29.5, { orden: 'x', tol: 0.15 }); await espera(300);
  ok((await objetosPlaza()).includes('tablilla-arcilla'), 'Fénix y el Minotauro consiguen la tablilla de arcilla');
  await foto('35-almacenes');
  await tp(8.5, 23.5); await ir(8.5, 19.0, { orden: 'y', tol: 0.12 }); await ir(8.5, 18.4, { orden: 'y', tol: 0.1 }); await espera(200); s = await est();
  ok(s.z > 0.95, `Frescos: el Minotauro sube por la escala de Ariadna (z=${s.z.toFixed(2)})`);
  await embestir(); await espera(300);
  ok((await pal()).M === '.', 'el Minotauro rompe el muro agrietado de la terraza');
  await ir(8.5, 14.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await objetosPlaza()).includes('hacha-doble'), 'Ariadna y el Minotauro consiguen el hacha doble');
  await foto('36-frescos-hacha');
  await elegir('eco'); await tp(4.5, 8.5); await espera(400);
  ok((await M(() => window.__mundo.eco)) === 'cimbalo' && (await page.textContent('#eco-texto')).includes('Címbalo'), 'Címbalos: Eco escucha el címbalo que hizo sonar quien vuela');
  await tp(17.5, 13.5); await tocar('KeyE'); await espera(300);
  ok((await pal()).O === '.', 'Eco repite el címbalo y la puerta de bronce se abre');
  await foto('37-puerta-bronce');
  await tp(17.5, 11.5); await ir(17.5, 5.5, { orden: 'y', tol: 0.15 }); await espera(300);
  ok((await objetosPlaza()).includes('figura-serpientes'), 'Pegaso y Eco consiguen la figura con serpientes');
  await foto('38-figura');
  ok((await page.textContent('#zona-n')) === '3/3' && (await page.textContent('#total-n')) === '7/7', 'el palacio queda en 3/3 y la partida en 7/7');

  // El campo de pruebas cuenta aparte
  await entrarPruebas();
  ok((await page.textContent('#zona-n')) === '0/3' && !(await page.isVisible('#total-n')), 'el campo de pruebas cuenta aparte (0/3) y no muestra el total de la partida');
  await page.click('#btn-menu'); await page.click('#menu-pruebas'); await page.waitForFunction(() => window.__mundo.id === 'palacio'); await espera(500);
  ok((await page.textContent('#total-n')) === '7/7', 'al volver a la partida el total sigue en 7/7');

  // Recarga en el palacio: todo igual
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  await page.click('.perfil:has-text("Ruta")'); await page.waitForFunction(() => window.__mundo); await espera(500);
  const p2 = await pal();
  ok((await idMapa()) === 'palacio' && p2.D === '.' && p2.G === '.' && p2.M === '.' && p2.O === '.' && p2.sogas && p2.fuente && p2.br === 2 && p2.vas === '17,29' && p2.got === 3,
    'tras recargar en el palacio todo sigue igual: puerta del sol, reja, muro, puerta de bronce, soga, címbalo y vasija');
  ok((await page.textContent('#total-n')) === '7/7' && (await page.textContent('#zona-n')) === '3/3', 'tras recargar, la partida sigue en 7/7');
  await tp(8.5, 24.5); await espera(900); await foto('39-palacio-medio');
  await tp(11.5, 6.5); await espera(900); await foto('40-palacio-norte');

  // 11. Sprites de personajes
  const IDS = ['pegaso', 'minotauro', 'ariadna', 'fenix', 'eco'];
  const sp = await page.evaluate(() => window.__sprites());
  ok(sp.listos && IDS.every(id => sp.imagenes[id] && sp.imagenes[id][0] > 0 && sp.imagenes[id][1] > 0), 'los cinco sprites cargan (tamaño natural mayor que cero)');
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
  // En el mundo: con cada personaje el canvas difiere del que no dibuja ninguno
  await tp(8.5, 24.5); await espera(900);
  const tomar = id => page.evaluate(async id => {
    window.__mundo.jugador.personaje = id; await new Promise(r => setTimeout(r, 200));
    const l = document.querySelector('canvas'), d = l.getContext('2d').getImageData(0, 0, l.width, l.height).data;
    return Array.from(d);
  }, id);
  const pjOriginal = (await est()).pj;
  const base = await tomar('ninguno');
  for (const id of IDS) {
    const img = await tomar(id); let dif = 0;
    for (let k = 0; k < base.length; k += 4) if (Math.abs(img[k] - base[k]) + Math.abs(img[k + 1] - base[k + 1]) + Math.abs(img[k + 2] - base[k + 2]) > 60) dif++;
    ok(dif > 500, `se ve el sprite de ${id} en el mundo (${dif} píxeles distintos)`);
  }
  await page.evaluate(p => { window.__mundo.jugador.personaje = p; }, pjOriginal); await espera(200);
  // En la tira: cada tarjeta tiene contenido
  for (const id of IDS) {
    const px = await page.evaluate(id => { const c = document.querySelector(`.pj[data-id=${id}] canvas`); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; return n; }, id);
    ok(px > 500, `la tira muestra el sprite de ${id} (${px} píxeles con contenido)`);
  }

  // 11. Sin conexión
  await page.evaluate(() => navigator.serviceWorker.ready); await espera(500);
  await ctx.setOffline(true);
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  ok(true, 'carga sin conexión desde el service worker');
  await page.click('.perfil:has-text("Ruta")'); await page.waitForFunction(() => window.__mundo); await espera(500);
  const spOff = await page.evaluate(() => window.__sprites());
  ok(spOff.listos && IDS.every(id => spOff.imagenes[id] && spOff.imagenes[id][0] > 0), 'sin conexión el juego arranca y los cinco sprites cargan');
  ok(ALAS.every(id => spOff.imagenes[id] && spOff.imagenes[id][0] > 0), 'sin conexión las cuatro alas cargan');
  const tiraOff = await page.evaluate(() => { const c = document.querySelector('.pj[data-id=eco] canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; return n; });
  ok(tiraOff > 500, 'sin conexión la tira muestra los sprites');
  await ctx.setOffline(false);

  ok(errores.length === 0, 'sin errores en consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close(); servidor.close();
  console.log(fallos ? `\n${fallos} verificación(es) fallaron` : '\nTodo en orden');
  process.exit(fallos ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
