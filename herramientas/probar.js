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
  const bloque = () => page.evaluate(() => window.__mundo.empujables.filter(e => e.tipo === 'bloque').map(e => [e.tx, e.ty])[0]);

  // 1. Perfiles
  await page.goto(url); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  ok(true, 'carga la pantalla de perfiles');
  await foto('01-perfiles');
  await page.fill('#nombre-nuevo', 'Prueba'); await page.click('#form-nuevo button[type=submit]');
  await page.waitForFunction(() => window.__mundo); await espera(400);
  await foto('02-inicio');
  let s = await est();
  ok(s.pj === 'pegaso' && s.enSuelo && Math.abs(s.x - 10.5) < 0.01, 'arranca con Pegaso en el puerto de pruebas');
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

  // 2. Caer al agua y reaparecer sin perder nada
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
  ok((await page.textContent('#total-n')) === '3/3', 'el contador total llega a 3/3');
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  const lista = await page.textContent('#lista-perfiles');
  ok(lista.includes('Prueba') && lista.includes('3/3'), 'tras recargar, el perfil conserva 3/3 objetos');
  await page.click('.perfil'); await page.waitForFunction(() => window.__mundo); await espera(300);
  s = await est();
  ok(s.recogidos.length === 3 && (await page.textContent('#total-n')) === '3/3', 'los objetos siguen recogidos y no reaparecen');
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
  ok((await page.textContent('#total-n')) === '0/3', 'un perfil nuevo arranca en 0/3 y el otro no se toca');
  ok((await celda(11, 5)) === 'M' && (await abiertas())[0] === false, 'un perfil nuevo arranca con el muro entero y la reja cerrada');
  b = [await bloque()];
  ok(b[0][0] === 14 && b[0][1] === 17, `un perfil nuevo arranca con el bloque en su lugar (${b[0]})`);
  await page.click('#btn-menu'); await page.click('#menu-perfiles');
  await page.click('.perfil'); await page.waitForFunction(() => window.__mundo); await espera(300);
  ok((await celda(11, 5)) === '.' && (await abiertas())[0] === true, 'el primer perfil conserva su mundo después de usar otro');

  // 11. Sin conexión
  await page.evaluate(() => navigator.serviceWorker.ready); await espera(500);
  await ctx.setOffline(true);
  await page.reload(); await page.waitForSelector('#pantalla-perfiles:not([hidden])');
  ok(true, 'carga sin conexión desde el service worker');
  await ctx.setOffline(false);

  ok(errores.length === 0, 'sin errores en consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close(); servidor.close();
  console.log(fallos ? `\n${fallos} verificación(es) fallaron` : '\nTodo en orden');
  process.exit(fallos ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
