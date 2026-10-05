// Dibujo del mundo en vista cenital inclinada. Escenario y mecanismos con sprites SVG (sprites/escenario/);
// lo que se mueve (olas, llamas, ondas, sogas, partículas) se dibuja por código en el mismo estilo.
import { TW, TH, LH, ABISMO, alturaCelda } from './mundo.js';

const NIVEL_AGUA = -0.12;
const COL = {
  fondo: '#2a2230', noche: '#2a2230',
  cal: '#f4ecd8', calSombra: '#cbb994', oxido: '#b5482e', oxidoOscuro: '#8f3a24',
  egeo: '#1f6f9c', ocre: '#d9a441', tinta: '#3b2b1d', oro: '#fff3c8', espuma: '#7fb8d8',
  lino: '#c9a46a', linoSombra: '#8a6a3a',
};

function alturaVisual(c) { return c === '~' ? NIVEL_AGUA : c === 'b' ? 0.8 : alturaCelda(c); }

export function crearDibujo(lienzo) {
  const ctx = lienzo.getContext('2d');
  let personajes = {};
  return {
    ctx,
    usarPersonajes(lista) { personajes = Object.fromEntries(lista.map(p => [p.id, p])); },
    dibujar(m, v) { dibujarMundo(ctx, m, v, personajes); },
  };
}

// Variación determinista: mismo resultado para la misma casilla, sin patrón a la vista.
function azar(a, b, s = 0) {
  let v = (Math.imul(a + 101, 73856093) ^ Math.imul(b + 57, 19349663) ^ Math.imul(s + 13, 83492791)) >>> 0;
  v = Math.imul(v ^ (v >>> 13), 0x5bd1e995) >>> 0;
  return (v ^ (v >>> 15)) >>> 0;
}

function dibujarMundo(ctx, m, v, personajes) {
  const { W, H, dpr, esc, camX, camY, focoY } = v;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COL.fondo;
  ctx.fillRect(0, 0, W, H);
  if (!spritesListos) return;   // no se dibuja el mundo a medias
  ctx.setTransform(dpr * esc, 0, 0, dpr * esc, dpr * (W / 2 - camX * esc), dpr * (focoY - camY * esc));

  const mitadW = W / 2 / esc;
  const arriba = camY - focoY / esc, abajo = camY + (H - focoY) / esc;
  const x0 = Math.max(0, Math.floor((camX - mitadW) / TW) - 1), x1 = Math.min(m.cols - 1, Math.ceil((camX + mitadW) / TW) + 1);
  const y0 = Math.max(0, Math.floor(arriba / TH) - 1), y1 = Math.min(m.rows - 1, Math.ceil((abajo + 3 * LH) / TH));

  const j = m.jugador;
  const items = [];
  // Solo entra lo que cae en cámara: el mundo es largo y corre en un celular
  const ver = (fila, minFila = fila) => fila >= y0 - 2 && minFila <= y1 + 4;
  for (const e of m.empujables) if (ver(Math.round(e.py))) items.push({ fila: Math.round(e.py), prof: e.py, tipo: 'empujable', e });
  for (const c of m.coleccionables) if (!c.recogido && ver(Math.floor(c.y))) items.push({ fila: Math.floor(c.y), prof: c.y, tipo: 'objeto', c });
  for (const b of m.braseros) if (ver(b.y)) items.push({ fila: b.y, prof: b.y + 0.5, tipo: 'brasero', b });
  for (const f of m.fuentes) if (ver(f.ty)) items.push({ fila: f.ty, prof: f.y, tipo: 'fuente', f });
  for (const b of m.barcas) if (ver(b.y)) items.push({ fila: b.y, prof: b.y + 0.4, tipo: 'barca', b });
  // Ambiente: fauna y detalles. No bloquean; entran en el mismo orden de profundidad que los objetos.
  for (const a of m.ambiente) {
    if (a.tipo === 'gaviota') {
      if (ver(Math.floor(a.hy))) items.push({ fila: Math.floor(a.hy), prof: a.hy, tipo: 'ambiente', a, parte: 'poste' });
      const fila = Math.max(0, Math.min(m.rows - 1, Math.floor(a.py)));
      if (ver(fila)) items.push({ fila, prof: a.py + 0.01, tipo: 'ambiente', a, parte: 'ave' });
    } else if (a.tipo === 'delfin') {
      if (ver(Math.floor(a.y))) items.push({ fila: Math.floor(a.y), prof: a.y, tipo: 'ambiente', a });
    } else {
      const ay = a.py === undefined ? a.y : a.py, fila = Math.max(0, Math.min(m.rows - 1, Math.floor(ay)));
      if (ver(fila)) items.push({ fila, prof: a.tipo === 'estanque' ? ay - 0.4 : ay, tipo: 'ambiente', a });
    }
  }
  // Las argollas y las sogas se dibujan después de todas las baldosas por las que pasan
  for (const s of m.sogas) {
    const maxFila = Math.max(s.a[1], s.b[1]);
    if (!ver(maxFila, Math.min(s.a[1], s.b[1]))) continue;
    items.push({ fila: maxFila, prof: -1, tipo: 'soga', s });
    for (const p of [s.a, s.b]) items.push({ fila: p[1], prof: p[1] + 0.3, tipo: 'argolla', s, p });
  }
  let filaJ = Math.floor(j.y);
  for (const s of m.sogas) if (s.tendida && s.casillas.some(c => c.x === Math.floor(j.x) && c.y === Math.floor(j.y))) filaJ = Math.max(filaJ, s.a[1], s.b[1]);
  items.push({ fila: filaJ, prof: filaJ > Math.floor(j.y) ? 999 : j.y, tipo: 'jugador' });
  items.sort((a, b) => a.fila - b.fila || a.prof - b.prof);

  let k = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) dibujarTile(ctx, m, x, y);
    while (k < items.length && items[k].fila <= y) { dibujarItem(ctx, m, items[k], personajes); k++; }
  }
  while (k < items.length) { dibujarItem(ctx, m, items[k], personajes); k++; }

  dibujarParticulas(ctx, m);
  dibujarSenales(ctx, m);

  // Siluetas tenues por encima de todo: se ve al personaje y a los objetos detrás de un muro.
  for (const c of m.coleccionables) if (!c.recogido && ver(Math.floor(c.y))) dibujarSilueta(ctx, m, c);
  ctx.globalAlpha = 0.35;
  if (j.estado !== 'cayendo' || j.z > -1.2) dibujarJugador(ctx, m, personajes, false);
  ctx.globalAlpha = 1;
  dibujarOndas(ctx, m);

  if (m.velo > 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgba(42,34,48,${m.velo})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---------- Baldosas ----------
const ES_PARED = c => c === '#' || c === 'b' || c === 'M' || c === 'G' || c === 'D' || c === 'O';

function dibujarTile(ctx, m, x, y) {
  const c = m.celdas[y][x];
  const h = alturaVisual(c);
  const px = x * TW, py = y * TH - h * LH;

  // Cara frontal (sur): cae hasta la altura de la baldosa vecina del sur.
  const hs = y + 1 < m.rows ? alturaVisual(m.celdas[y + 1][x]) : 0;
  if (h > hs) {
    const alto = (h - hs) * LH;
    const fy = py + TH;
    if (ES_PARED(c)) caraPared(ctx, c, px, fy, alto, m, x, y);
    else if (c === 'A') caraSegmentos(ctx, px, fy, alto, n => n === 0 && (x & 1) === 0 ? 'cara-techo-0' : 'cara-techo-1');
    else if (c === 'a') caraSegmentos(ctx, px, fy, alto, () => 'cara-terraza');
    else { ctx.fillStyle = '#9b7a45'; ctx.fillRect(px, fy, TW, alto); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(px, fy, TW, Math.min(1.2, alto)); }
    if (c === 'A' || c === 'a') { ctx.fillStyle = 'rgba(20,12,6,.22)'; ctx.fillRect(px, fy + alto - Math.min(5, alto), TW, Math.min(5, alto)); }
  }

  switch (c) {
    case '~': dibujarAgua(ctx, m, x, y, px, py); break;
    case '#': case 'b': case 'M': case 'G': case 'D': case 'O':
      pintar(ctx, (c === 'M' ? 'tope-claro-' + (azar(x, y, 3) % 2) : 'tope-' + (azar(x, y, 3) % 4)), px, py, 0.5);
      break;
    case 'a': losas(ctx, 'terraza', 3, x, y, px, py); break;
    case 'A': losas(ctx, 'techo', 3, x, y, px, py); break;
    default: {
      if (c === 'p') pintar(ctx, m.empujables.some(e => e.tx === x && e.ty === y && e.t >= 1) ? 'placa-activa' : 'placa', px, py, 0.5);
      else if (c === ',') pintar(ctx, 'baldosa-' + (azar(x, y, 4) % 2), px, py, 0.5);
      else {
        losas(ctx, 'suelo', 4, x, y, px, py);
        // Lo que se abrió o se rompió deja su huella en el suelo
        const antes = m.origen && m.origen[y][x];
        if (antes === 'M') pintar(ctx, 'escombros', px, py, 0.5);
        else if (antes === 'G' || antes === 'O') pintar(ctx, 'umbral-reja', px, py, 0.5);
        else if (antes === 'D') pintar(ctx, 'umbral-sol', px, py, 0.5);
      }
    }
  }
}

// Losas trabadas de casilla y media: no marcan la grilla. La variante sale de la losa, no de la casilla.
function losas(ctx, tipo, n, x, y, px, py) {
  const corr = (y & 1) ? 33 : 0, X0 = x * TW;
  for (let k = Math.floor((X0 + corr) / 66); ; k++) {
    const ini = k * 66 - corr;
    if (ini >= X0 + TW) break;
    const a = Math.max(ini, X0), b = Math.min(ini + 66, X0 + TW);
    recorte(ctx, `losa-${tipo}-${azar(k, y, 7) % n}`, a - ini, 0, b - a, TH, px + (a - X0), py, 1);
  }
}

// Cara de uno o más niveles: un segmento de 30 px por nivel, el último recortado
function caraSegmentos(ctx, px, fy, alto, nombre) {
  for (let n = 0; n * LH < alto; n++) {
    const hh = Math.min(LH, alto - n * LH);
    recorte(ctx, nombre(n), 0, 0, TW, hh, px, fy + n * LH, 0.5);
  }
}

// Sillares trabados: una hilera cada 15 px (12 en el parapeto), cada sillar con su tono
function sillares(ctx, claro, px, fy, alto, x, y, paso) {
  const X0 = x * TW;
  for (let n = 0; n * paso < alto; n++) {
    const corr = (n & 1) ? 16.5 : 0, hh = Math.min(paso, alto - n * paso);
    for (let k = Math.floor((X0 + corr) / 33); ; k++) {
      const ini = k * 33 - corr;
      if (ini >= X0 + TW) break;
      const a = Math.max(ini, X0), b = Math.min(ini + 33, X0 + TW);
      const s = ras[`sillar-${claro ? 'claro-' : ''}${azar(k, y * 8 + n, 11) % 4}`];
      if (!s) continue;
      ctx.drawImage(s.c, (a - ini) * s.k, 0, (b - a) * s.k, hh / paso * 15 * s.k, px + (a - X0), fy + n * paso, b - a + 0.5, hh + 0.5);
    }
  }
}

function caraPared(ctx, c, px, fy, alto, m, x, y) {
  sillares(ctx, c === 'M', px, fy, alto, x, y, c === 'b' ? 12 : 15);
  // Detalle de puertas y muros: alineado al pie de la cara (90 px = tres niveles)
  const sobre = n => {
    const dh = Math.min(90, alto), s0 = 90 - dh;
    recorte(ctx, n, 0, s0, TW, dh, px, fy + alto - dh, 0.5);
    return fy + alto - 90;
  };
  if (c === 'M') sobre('grieta');
  else if (c === 'G') sobre('reja-cerrada');
  else if (c === 'D') sobre('puerta-sol');
  else if (c === 'O') {
    // Puerta de sonido: lleva el color y el símbolo del sonido al que responde
    const p = m.puertasSonido.find(q => q.x === x && q.y === y), snd = p && m.sonidos[p.sonido];
    const top = fy + alto - 90;
    sobre('puerta-sonido');
    if (snd) {
      ctx.fillStyle = snd.color; ctx.fillRect(px + 8, Math.max(fy + 2, top + 12), TW - 16, Math.min(alto - 4, 76));
      const cx = px + TW / 2, cy = Math.max(fy + 18, top + 46);
      ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2;
      simbolo(ctx, snd.simbolo, cx, cy, 8);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.6;
      for (const r of [13, 17]) { ctx.beginPath(); ctx.arc(cx, cy, r, -0.7, 0.7); ctx.stroke(); }
    }
  }
  ctx.fillStyle = 'rgba(20,12,6,.22)'; ctx.fillRect(px, fy + alto - Math.min(7, alto), TW, Math.min(7, alto));
}

// Símbolos de los sonidos (se ven aunque el volumen esté en cero). Rellena y contornea con el estilo actual.
export function simbolo(ctx, id, cx, cy, r) {
  ctx.beginPath();
  if (id === 'circulo') ctx.arc(cx, cy, r, 0, Math.PI * 2);
  else if (id === 'triangulo') { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r * 0.8); ctx.lineTo(cx - r, cy + r * 0.8); ctx.closePath(); }
  else if (id === 'cuadrado') ctx.rect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7);
  else { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); }
  ctx.fill(); ctx.stroke();
}

// Agua: manchas y destellos en el sprite; las olas se mueven por código; franja baja con espuma junto a la tierra.
const OLAS = [[1, 7], [2, 5], [2, 7], [3, 5], [1, 10]];   // [ondas, medio ancho]
function dibujarAgua(ctx, m, x, y, px, py) {
  recorte(ctx, 'mar', (x * TW) % 176, (y * TH) % 108, TW, TH, px, py, 1);
  const tierra = (cx, cy) => cx >= 0 && cy >= 0 && cx < m.cols && cy < m.rows && m.celdas[cy][cx] !== '~';
  const N = tierra(x, y - 1), O = tierra(x - 1, y), E = tierra(x + 1, y);
  if (N || O || E) {
    ctx.fillStyle = '#3d8cb8';
    if (N) ctx.fillRect(px, py, TW, 10);
    if (O) ctx.fillRect(px, py, 10, TH);
    if (E) ctx.fillRect(px + TW - 10, py, 10, TH);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.setLineDash([10, 6]); ctx.lineDashOffset = -m.t * 4;
    ctx.beginPath();
    if (N) { ctx.moveTo(px + 4, py + 5); ctx.lineTo(px + TW - 4, py + 5); }
    if (O) { ctx.moveTo(px + 5, py + 6); ctx.lineTo(px + 5, py + TH - 6); }
    if (E) { ctx.moveTo(px + TW - 5, py + 6); ctx.lineTo(px + TW - 5, py + TH - 6); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.38)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let n = 0; n < 2; n++) {
    const a = azar(x, y, 20 + n), [ondas, medio] = OLAS[a % OLAS.length], largo = ondas * medio * 2;
    const libre = Math.max(0, TW - largo - 16);
    const off = Math.sin(m.t * 1.6 + x * 1.3 + y * 0.9 + n * 2) * 4;
    const x0 = px + 8 + (azar(x, y, 30 + n) % (libre + 1)) + off, wy = py + 9 + n * 17;
    ctx.beginPath(); ctx.moveTo(x0, wy);
    for (let i = 0; i < ondas * 2; i++) ctx.quadraticCurveTo(x0 + medio * (i + 0.5), wy + (i % 2 ? 5 : -5), x0 + medio * (i + 1), wy);
    ctx.stroke();
  }
}

// Barca sobre el agua: solo adorno
function dibujarBarca(ctx, m, b) {
  const cx = (b.x + b.largo / 2) * TW, cy = b.y * TH + TH * 0.5 + Math.sin(m.t * 1.4 + b.x) * 1.5;
  const k = b.largo * TW / 96;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  pintar(ctx, 'barca', 0, 0);
  ctx.restore();
}

// ---------- Objetos y personajes ----------
function dibujarItem(ctx, m, it, personajes) {
  if (it.tipo === 'empujable') dibujarEmpujable(ctx, it.e);
  else if (it.tipo === 'brasero') dibujarBrasero(ctx, m, it.b);
  else if (it.tipo === 'fuente') dibujarFuente(ctx, m, it.f);
  else if (it.tipo === 'barca') dibujarBarca(ctx, m, it.b);
  else if (it.tipo === 'soga') dibujarSoga(ctx, it.s);
  else if (it.tipo === 'argolla') dibujarArgolla(ctx, it.s, it.p);
  else if (it.tipo === 'objeto') dibujarObjeto(ctx, m, it.c);
  else if (it.tipo === 'ambiente') dibujarAmbiente(ctx, m, it.a, it.parte);
  else dibujarJugador(ctx, m, personajes, true);
}

// ---------- Ambiente ----------
// Fauna y detalles que no son mecanismos: sin brillo dorado, sin argollas, sin color de sonido. Todo plano y de la paleta.
function dibujarAmbiente(ctx, m, a, parte) {
  const cx = a.x * TW, suelo = (a.y + 0.5) * TH - 6;   // pie del elemento en su casilla
  switch (a.tipo) {
    case 'delfin': dibujarDelfin(ctx, m, a); break;
    case 'pulpo': dibujarPulpo(ctx, m, a, cx, suelo); break;
    case 'gaviota': if (parte === 'poste') pintar(ctx, 'poste', cx, suelo + 2); else dibujarGaviota(ctx, m, a); break;
    case 'toro': dibujarToro(ctx, a, cx, suelo); break;
    case 'red': pintar(ctx, 'red', cx, suelo + 2); break;
    case 'anforas': pintar(ctx, 'anforas', cx, suelo + 2); break;
    case 'concha': pintar(ctx, 'concha', cx, suelo); break;
    case 'azafran': pintar(ctx, 'azafran', cx, suelo + 2); break;
    case 'estanque': pintar(ctx, 'estanque', cx, (a.y + 0.5) * TH); break;
    case 'lirios': dibujarLirios(ctx, m, a, cx, suelo); break;
    case 'narciso': dibujarNarciso(ctx, m, a, cx, suelo); break;
    case 'olivo': dibujarOlivo(ctx, m, a, cx, suelo); break;
    case 'granado': dibujarGranado(ctx, m, a, cx, suelo); break;
    case 'cabra': dibujarCabra(ctx, m, a); break;
    case 'gato': dibujarGato(ctx, m, a); break;
  }
}

// Lirios en cantero: se mecen al pasar; con la luz de Fénix pasan de capullo a flor abierta
function dibujarLirios(ctx, m, l, cx, suelo) {
  ctx.save(); ctx.translate(cx, suelo + 2);
  ctx.rotate(Math.sin(m.t * 6 + l.i) * 0.14 * l.agita);
  if (l.abre < 0.98) { ctx.globalAlpha = 1 - l.abre; pintar(ctx, 'lirios-0', 0, 0); }
  if (l.abre > 0.02) { ctx.globalAlpha = l.abre; pintar(ctx, 'lirios-1', 0, 0); }
  ctx.restore();
}

// Narcisos: con la voz de Eco se inclinan hacia el estanque
function dibujarNarciso(ctx, m, n, cx, suelo) {
  const dir = Math.sign(n.hacia[0] - n.x) || 1;
  ctx.save(); ctx.translate(cx, suelo + 2);
  ctx.rotate(n.inc * 0.55 * dir + Math.sin(m.t * 1.3 + n.i) * 0.03);
  pintar(ctx, 'narciso', 0, 0);
  ctx.restore();
}

// Olivo: el tronco ocupa su casilla; si el personaje queda detrás, la copa se vuelve transparente
function dibujarOlivo(ctx, m, o, cx, suelo) {
  const j = m.jugador, detras = j.y < o.y && j.y > o.y - 2.4 && Math.abs(j.x - o.x) < 1.6;
  ctx.globalAlpha = detras ? 0.5 : 1;
  pintar(ctx, 'olivo', cx, suelo + 2);
  ctx.globalAlpha = 1;
  for (const h of o.hojas) {
    // hojas que caen, mecidas, y se apagan al llegar al suelo
    const caida = Math.min(1, h.t / h.dur), z = h.z0 * (1 - caida), alfa = h.t > h.dur ? Math.max(0, 1 - (h.t - h.dur) / 0.7) : 1;
    const hx = (h.x + h.vx * h.t) * TW + Math.sin(h.t * 4 + h.ph) * 7, hy = (h.y + 0.5) * TH - 6 - z * LH;
    ctx.globalAlpha = alfa; ctx.fillStyle = '#b59a58'; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(hx, hy, 5, 2.2, Math.sin(h.t * 5 + h.ph) * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Granado: se sacude y suelta una granada roja y plana que rueda y se apaga sola (sin brillo ni premio)
function dibujarGranado(ctx, m, g, cx, suelo) {
  ctx.save(); ctx.translate(cx + Math.sin(m.t * 45) * 2.2 * Math.min(1, g.sacude * 3), suelo + 2);
  pintar(ctx, 'granado', 0, 0);
  ctx.restore();
  const q = g.granada;
  if (q) {
    const caida = Math.min(1, q.t / 0.35), z = 1.3 * (1 - caida * caida);
    ctx.globalAlpha = Math.min(1, (q.dur - q.t) / 0.6);
    ctx.save(); ctx.translate(q.x * TW, (q.y + 0.5) * TH - 8 - z * LH); ctx.rotate(q.t * q.vx * 7);
    pintar(ctx, 'granada', 0, 0);
    ctx.restore(); ctx.globalAlpha = 1;
  }
}

function dibujarCabra(ctx, m, c) {
  const gx = c.px * TW, base = (c.py + 0.5) * TH - 6;
  const salto = c.mueve ? -Math.abs(Math.sin(m.t * (c.corre ? 16 : 9) + c.i)) * (c.corre ? 6 : 2.5) : (c.balido > 0 ? -Math.abs(Math.sin(m.t * 12)) * 2 : 0);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(gx, base + 1, 15, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(gx, base + salto);
  if (c.cara < 0) ctx.scale(-1, 1);
  pintar(ctx, 'cabra', 0, 0);
  if (c.balido > 0) {
    // El balido se ve: rayitas cortas que salen del hocico
    const k = 1 - c.balido / 1.2;
    ctx.lineCap = 'round';
    for (const [color, ancho] of [[COL.tinta, 4.4], [COL.cal, 2]]) {
      ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.globalAlpha = Math.max(0, 1 - k) * 0.95;
      for (let n = -1; n <= 1; n++) {
        const a = n * 0.5 - 0.1, r0 = 6 + (k * 6) % 6, r1 = r0 + 6;
        ctx.beginPath(); ctx.moveTo(26 + Math.cos(a) * r0, -29 + Math.sin(a) * r0 * 1.2); ctx.lineTo(26 + Math.cos(a) * r1, -29 + Math.sin(a) * r1 * 1.2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function dibujarGato(ctx, m, g) {
  const gx = g.px * TW, base = (g.py + 0.5) * TH - 6;
  const pose = g.estado !== 'duerme' ? 'gato-2' : g.estira > 0 ? 'gato-1' : 'gato-0';
  const bob = g.mueve ? -Math.abs(Math.sin(m.t * 12 + g.i)) * 2.5 : 0;
  ctx.save(); ctx.translate(gx, base + bob);
  if (g.cara < 0) ctx.scale(-1, 1);
  pintar(ctx, pose, 0, 0);
  ctx.restore();
}

function dibujarDelfin(ctx, m, f) {
  const agua = 3.6;   // el agua está un poco bajo el borde de la casilla
  ctx.lineCap = 'round';
  for (const r of f.anillos) {
    const k = r.t / r.dur, px = r.x * TW, py = r.y * TH + agua;
    if (r.tipo === 'chapoteo') {
      ctx.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.85})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(px, py, 6 + k * 16, 2.5 + k * 7, 0, 0, Math.PI * 2); ctx.stroke();
    } else {
      // chasquido: dos anillos cerrados y cortos, blancos con borde de tinta
      for (let n = 0; n < 2; n++) {
        const kk = k - n * 0.18; if (kk <= 0) continue;
        ctx.globalAlpha = (1 - kk) * 0.9;
        ctx.beginPath(); ctx.ellipse(px, py, 8 + kk * 26, 3.5 + kk * 11, 0, 0, Math.PI * 2);
        ctx.strokeStyle = COL.tinta; ctx.lineWidth = 4.4; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  if (!f.salto) {
    // un rizo avisa que está por saltar
    const falta = f.prox - m.t;
    if (falta > 0 && falta < 0.9) {
      const k = 1 - falta / 0.9;
      ctx.strokeStyle = `rgba(255,255,255,${0.35 + k * 0.4})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(f.x * TW, f.y * TH + agua, 4 + k * 8, 1.6 + k * 3.4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    return;
  }
  const s = f.salto, u = Math.min(1, s.t / s.dur);
  const wx = (s.x0 + (s.x1 - s.x0) * u) * TW, wy = (s.y0 + (s.y1 - s.y0) * u) * TH + agua;
  const h = Math.sin(Math.PI * u) * s.alto * LH;
  const vx = Math.abs((s.x1 - s.x0) * TW), vy = -Math.cos(Math.PI * u) * Math.PI * s.alto * LH + (s.y1 - s.y0) * TH;
  ctx.save();
  ctx.beginPath(); ctx.rect(wx - 60, wy - 140, 120, 140 + 1); ctx.clip();   // lo que está bajo el agua no se ve
  ctx.translate(wx, wy - h - 2);
  if (s.dir < 0) ctx.scale(-1, 1);
  ctx.rotate(Math.atan2(vy, vx));
  pintar(ctx, 'delfin', 0, 0);
  ctx.restore();
}

function dibujarPulpo(ctx, m, p, cx, suelo) {
  ctx.save(); ctx.translate(cx, suelo); ctx.scale(0.85, 0.85);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 1, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
  pintar(ctx, 'rocas-atras', 0, 0);
  // Se esconde bajando detrás de las rocas de adelante; lo que baja del piso no se ve
  ctx.save();
  ctx.beginPath(); ctx.rect(-40, -80, 80, 80); ctx.clip();
  const y = -2 + p.esc * 28, azul = Math.max(0, Math.min(1, p.azul / 0.6, (3.5 - p.azul) / 0.3));
  pintar(ctx, 'pulpo-0', 0, y);
  if (azul > 0) { ctx.globalAlpha = azul; pintar(ctx, 'pulpo-1', 0, y); ctx.globalAlpha = 1; }
  ctx.restore();
  pintar(ctx, 'rocas-frente', 0, 0);
  if (p.esc > 0.7) {
    // Solo un ojo asoma en la grieta, y parpadea
    const abierto = (m.t * 0.7 + p.i) % 3 < 2.75;
    ctx.globalAlpha = Math.min(1, (p.esc - 0.7) / 0.3);
    ctx.fillStyle = '#f4ecd8'; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(4.5, -4.4, 3.4, abierto ? 2.8 : 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (abierto) { ctx.fillStyle = COL.tinta; ctx.beginPath(); ctx.arc(5.4, -4.4, 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function dibujarGaviota(ctx, m, g) {
  const gx = g.px * TW, base = g.py * TH + 6;
  if (g.vuela) {
    const alto = Math.max(0, g.pz - 0.2);
    ctx.fillStyle = `rgba(20,12,6,${0.22 / (1 + alto * 0.5)})`;
    ctx.beginPath(); ctx.ellipse(gx, base + 2, 9, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  const gy = base - g.pz * LH;
  ctx.save(); ctx.translate(gx, gy);
  if (g.cara < 0) ctx.scale(-1, 1);
  if (g.vuela) pintar(ctx, 'gaviota-vuelo-' + (Math.floor(m.t * 9 + g.i) % 2), 0, 0);
  else pintar(ctx, g.grazna > 0 && Math.floor(m.t * 5) % 2 === 0 ? 'gaviota-grazna' : 'gaviota', 0, 0);
  if (g.grazna > 0) {
    // El graznido se ve: rayitas cortas que salen del pico
    const k = 1 - g.grazna / 1.2;
    ctx.lineCap = 'round';
    for (const [color, ancho] of [[COL.tinta, 4.4], [COL.cal, 2]]) {
      ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.globalAlpha = Math.max(0, 1 - k) * 0.95;
      for (let n = -1; n <= 1; n++) {
        const a = n * 0.5 - 0.15, r0 = 15 + (k * 6) % 6, r1 = r0 + 6;
        ctx.beginPath(); ctx.moveTo(20 + Math.cos(a) * r0 * 0.6, -21 + Math.sin(a) * r0); ctx.lineTo(20 + Math.cos(a) * r1 * 0.9, -21 + Math.sin(a) * r1); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function dibujarToro(ctx, b, cx, suelo) {
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(cx, suelo + 1, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(cx, suelo); ctx.scale(b.cara < 0 ? -1 : 1, 1);
  pintar(ctx, b.cabeza > 0.5 ? 'toro-1' : 'toro-0', 0, 0);
  ctx.restore();
}

function dibujarEmpujable(ctx, e) {
  const sx = e.px * TW, sy = e.py * TH;   // los empujables viven en el suelo
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(sx + TW / 2, sy + TH - 5, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (e.tipo === 'bloque') pintar(ctx, 'bloque', sx + TW / 2, sy + TH - 4);
  else pintar(ctx, 'vasija', sx + TW / 2, sy + TH - 5);
}

function dibujarBrasero(ctx, m, b) {
  const cx = b.x * TW + TW / 2, by = b.y * TH + TH - 6 - b.zBase * LH;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, by + 1, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (b.encendido) {
    const g = ctx.createRadialGradient(cx, by - 28, 2, cx, by - 28, 40);
    g.addColorStop(0, 'rgba(255,243,200,.5)'); g.addColorStop(1, 'rgba(255,243,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, by - 28, 40, 0, Math.PI * 2); ctx.fill();
  }
  pintar(ctx, b.encendido ? 'brasero-encendido' : 'brasero-apagado', cx, by);
  if (b.encendido) {
    // la llama titila
    const f = 1 + Math.sin(m.t * 9 + b.x) * 0.07 + Math.sin(m.t * 13) * 0.04;
    ctx.save(); ctx.translate(cx + Math.sin(m.t * 7 + b.y) * 0.8, by - 26); ctx.scale(1 + (1 - f) * 0.5, f);
    pintar(ctx, 'llama', 0, 0);
    ctx.restore();
  } else {
    ctx.strokeStyle = 'rgba(244,236,216,.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(cx, by - 36, 7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);   // llama sin encender
  }
}

function dibujarFuente(ctx, m, f) {
  const snd = m.sonidos[f.sonido];
  const cx = f.tx * TW + TW / 2, by = f.ty * TH + TH - 6 - f.zBase * LH;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, by + 1, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  const vib = f.activa ? Math.sin(m.t * 30) * 1.2 : 0;
  pintar(ctx, f.modo === 'sola' ? 'fuente-caracola' : 'fuente-cimbalo', cx + vib, by);
  // insignia del sonido: color y símbolo (apagada y sin brillo hasta que suene)
  const ix = cx, iy = by - 50 - Math.sin(m.t * 3) * (f.activa ? 2 : 0);
  ctx.globalAlpha = f.activa ? 1 : 0.55;
  ctx.fillStyle = snd.color; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ix, iy, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffaf0'; ctx.lineWidth = 1.5; simbolo(ctx, snd.simbolo, ix, iy, 6.5);
  ctx.globalAlpha = 1;
  if (f.activa) {
    ctx.lineCap = 'round';
    for (let n = 0; n < 3; n++) {
      const q = ((m.t / 1.3) + n / 3) % 1;
      ctx.globalAlpha = (1 - q) * 0.8;
      ctx.strokeStyle = snd.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(cx, by - 14, 14 + q * 34, 8 + q * 20, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COL.oro; ctx.lineWidth = 2;
    for (const [r, a] of [[16, 0.95], [24, 0.7], [32, 0.45]]) {
      ctx.globalAlpha = a * (0.75 + 0.25 * Math.sin(m.t * 6 - r * 0.2));
      ctx.beginPath(); ctx.arc(cx, by - 18, r, -0.75, 0.75); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function dibujarArgolla(ctx, s, p) {
  const h = p === s.a ? s.ha : s.hb;
  const cx = p[0] * TW + TW / 2, cy = p[1] * TH + TH / 2 - h * LH;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, cy + 6, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  pintar(ctx, s.tendida ? 'argolla-viva' : 'argolla', cx, cy + 6);
}

// Soga trenzada de lino: contorno de tinta, lino y hebras
function lino(ctx, x0, y0, x1, y1, ancho) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = COL.tinta; ctx.lineWidth = ancho + 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = COL.lino; ctx.lineWidth = ancho; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = COL.linoSombra; ctx.lineWidth = ancho; ctx.lineCap = 'butt'; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
}

function dibujarSoga(ctx, s) {
  if (!s.tendida) {
    // Aún sin tender: una línea punteada tenue sugiere hacia dónde va
    ctx.strokeStyle = 'rgba(244,236,216,.35)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(s.a[0] * TW + TW / 2, s.a[1] * TH + TH / 2 - s.ha * LH - 12); ctx.lineTo(s.b[0] * TW + TW / 2, s.b[1] * TH + TH / 2 - s.hb * LH - 12); ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  const pt = (c, dx = 0) => [c.x * TW + TW / 2 + dx, c.y * TH + TH / 2 - c.h * LH];
  const ini = s.casillas[0], fin = s.casillas[s.casillas.length - 1];
  const vertical = s.a[0] === s.b[0];
  const [x0, y0] = pt(ini), [x1, y1] = pt(fin);
  // Desenrollo visual (la soga ya se puede pisar): parte de la argolla más cercana a Ariadna y avanza hasta la otra
  const prog = s.prog === undefined ? 1 : s.prog, u = prog < 1 ? 1 - (1 - prog) * (1 - prog) : 1;
  const ta = s.desde === 1 ? 1 - u : 0, tb = s.desde === 1 ? 1 : u, punta = s.desde === 1 ? ta : tb, EPS = 1e-6;
  const L = t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  const tramo = (ox, oy, ancho) => { const [ax, ay] = L(ta), [bx, by] = L(tb); lino(ctx, ax + ox, ay + oy, bx + ox, by + oy, ancho); };
  if (s.ha === s.hb) {
    // puente: tablones entre dos sogas
    const n = s.casillas.length * 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n; if (t < ta - EPS || t > tb + EPS) continue;
      const [px, py] = L(t);
      ctx.fillStyle = i % 2 ? '#b98a52' : '#a5763f'; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5;
      if (vertical) { ctx.fillRect(px - 15, py - 4, 30, 8); ctx.strokeRect(px - 15, py - 4, 30, 8); }
      else { ctx.fillRect(px - 5, py - 12, 10, 24); ctx.strokeRect(px - 5, py - 12, 10, 24); }
    }
    for (const o of vertical ? [[-15, 0], [15, 0]] : [[0, -12], [0, 12]]) tramo(o[0], o[1], 3);
  } else {
    // escala: dos sogas con peldaños
    const n = s.casillas.length * 2;
    for (const o of [-9, 9]) tramo(o, -10, 3);
    ctx.lineCap = 'round';
    for (let i = 0; i <= n; i++) {
      const t = i / n; if (t < ta - EPS || t > tb + EPS) continue;
      const [px, qy] = L(t), py = qy - 10;
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.stroke();
      ctx.strokeStyle = '#b98a52'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.stroke();
    }
  }
  if (prog < 1) {
    // Ovillo óxido en la punta, que gira mientras avanza
    const [ox, oy] = L(punta), cy = oy - (s.ha === s.hb ? 4 : 12), giro = prog * 14;
    ctx.fillStyle = COL.oxido; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ox, cy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = COL.oxidoOscuro; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(ox, cy, 3.4, giro, giro + 3.6); ctx.stroke();
  }
}

function dibujarOndas(ctx, m) {
  // Las ondas del eco se ven por encima de todo: atraviesan paredes. Arcos de voz concéntricos que se abren y se apagan.
  ctx.lineCap = 'round';
  const ARCOS = 6;
  for (const o of m.ondas) {
    const k = o.t / o.dur, cx = o.x * TW, cy = o.y * TH - o.z * LH;
    for (let n = 0; n < 3; n++) {
      const kk = k - n * 0.12; if (kk <= 0) continue;
      const rx = (0.2 + kk * 0.8) * o.alcance * TW, ry = (0.2 + kk * 0.8) * o.alcance * TH, giro = n * 0.35 + kk * 0.6;
      ctx.globalAlpha = (1 - kk) * 0.9;
      for (const [color, ancho] of [[COL.tinta, 7], [o.color, 4]]) {
        ctx.strokeStyle = color; ctx.lineWidth = ancho;
        for (let i = 0; i < ARCOS; i++) {
          const a0 = giro + i * Math.PI * 2 / ARCOS;
          ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, a0, a0 + Math.PI * 2 / ARCOS * 0.6); ctx.stroke();
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}

// Señales de poder que viven un rato: polvo (empujar, embestir, aterrizar), ráfaga (despegue) y brasas (Fénix)
function dibujarSenales(ctx, m) {
  ctx.lineCap = 'round';
  for (const q of m.senales) {
    const k = q.t / q.dur, cx = q.x * TW, cy = q.y * TH - q.z * LH;
    ctx.globalAlpha = Math.max(0, 1 - k) * 0.9;
    if (q.tipo === 'polvo') {
      const r = q.r * (0.6 + k * 0.9);
      ctx.fillStyle = COL.calSombra; ctx.strokeStyle = 'rgba(59,43,29,.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.5, r, r * 0.75, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (q.tipo === 'brasa') {
      const r = 3.2 * (1 - k * 0.5);
      ctx.fillStyle = q.oxido ? COL.oxido : COL.ocre; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.6); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (q.tipo === 'rafaga') {
      for (const lado of [-1, 1]) for (let n = 0; n < 3; n++) {
        const x0 = cx + lado * (9 + k * 10 + n * 3), y0 = cy - 3 - n * 7 - k * 6;
        const x1 = x0 + lado * (12 + k * 16), y1 = y0 - 3 - k * 6;
        for (const [color, ancho] of [[COL.tinta, 5], [COL.cal, 2.6]]) {
          ctx.strokeStyle = color; ctx.lineWidth = ancho;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 - 7, x1, y1); ctx.stroke();
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}

// Sprite propio de cada objeto del catálogo; los de prueba usan el genérico
const OBJETOS = ['ancla-piedra', 'tablero-juego', 'fresco-delfines', 'riton-toro', 'tablilla-arcilla', 'hacha-doble', 'figura-serpientes'];
export const tieneSpriteObjeto = id => OBJETOS.includes(id);
const spriteObjeto = id => OBJETOS.includes(id) ? id : 'coleccionable';

export function dibujarObjeto(ctx, m, c) {
  const gx = c.x * TW, gy = c.y * TH - c.zBase * LH;
  const bob = Math.sin(m.t * 2.6 + c.x) * 0.1;
  const sy = gy - (0.7 + bob) * LH;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(gx, gy, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  const pulso = 1 + Math.sin(m.t * 4 + c.x) * 0.06;
  const b = ras.brillo;
  if (b) ctx.drawImage(b.c, gx + b.ox * pulso, sy + b.oy * pulso, b.w * pulso, b.h * pulso);
  pintar(ctx, spriteObjeto(c.id), gx, sy);
}

// Silueta tenue del mismo sprite: relleno cal al 35 % y contorno cal, sin segunda imagen
const siluetas = {};
function silueta(n) {
  const s = ras[n];
  if (!s) return null;
  if (siluetas[n]) return siluetas[n];
  const pad = 3, w = Math.ceil((s.w + pad * 2) * s.k), h = Math.ceil((s.h + pad * 2) * s.k);
  const teñido = document.createElement('canvas'); teñido.width = w; teñido.height = h;
  const t = teñido.getContext('2d');
  t.drawImage(s.c, pad * s.k, pad * s.k); t.globalCompositeOperation = 'source-in'; t.fillStyle = COL.cal; t.fillRect(0, 0, w, h);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  for (let a = 0; a < 8; a++) c.drawImage(teñido, Math.cos(a * Math.PI / 4) * 1.5 * s.k, Math.sin(a * Math.PI / 4) * 1.5 * s.k);
  c.globalCompositeOperation = 'destination-out'; c.drawImage(teñido, 0, 0);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.35; c.drawImage(teñido, 0, 0);
  return (siluetas[n] = { c: cv, k: s.k, ox: s.ox - pad, oy: s.oy - pad, w: s.w + pad * 2, h: s.h + pad * 2 });
}
function dibujarSilueta(ctx, m, c) {
  const gx = c.x * TW, gy = c.y * TH - c.zBase * LH;
  const bob = Math.sin(m.t * 2.6 + c.x) * 0.1;
  const sl = silueta(spriteObjeto(c.id));
  if (sl) ctx.drawImage(sl.c, gx + sl.ox, gy - (0.7 + bob) * LH + sl.oy, sl.w, sl.h);
}

function dibujarJugador(ctx, m, personajes, conSombra) {
  const j = m.jugador;
  const g = Math.max(m.suelo(j.x, j.y), NIVEL_AGUA);
  const gx = j.x * TW, gy = j.y * TH - g * LH;
  if (conSombra) {
    const alto = Math.max(0, j.z - g);
    const k = 1 / (1 + alto * 0.45);
    ctx.fillStyle = `rgba(20,10,30,${0.42 * (0.6 + 0.4 * k)})`;
    ctx.beginPath(); ctx.ellipse(gx, gy, 11 * k + 3, 5 * k + 1.5, 0, 0, Math.PI * 2); ctx.fill();
    if (alto > 0.25) {
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(gx, gy, 14, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  const cuerpoY = j.y * TH - Math.max(j.z, -3) * LH;
  if (j.brillo > 0) {
    // Halo plano de rayos cortos (ocre y óxido, contorno tinta) que se abre y se apaga
    const b = j.brillo, cy = cuerpoY - 20, r0 = 16 + (1 - b) * 26, largo = 9 + b * 9, giro = (1 - b) * 0.6;
    const alfa0 = ctx.globalAlpha; ctx.globalAlpha = alfa0 * Math.min(1, b * 1.5); ctx.strokeStyle = COL.tinta; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    for (let i = 0; i < 12; i++) {
      const a = giro + i * Math.PI / 6, ex = Math.cos(a), ey = Math.sin(a) * 0.85, px = -ey, py = ex * 0.85;
      ctx.fillStyle = i % 2 ? COL.oxido : COL.ocre;
      ctx.beginPath();
      ctx.moveTo(gx + ex * r0 + px * 4, cy + ey * r0 + py * 4);
      ctx.lineTo(gx + ex * (r0 + largo), cy + ey * (r0 + largo));
      ctx.lineTo(gx + ex * r0 - px * 4, cy + ey * r0 - py * 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = alfa0;
  }
  const p = personajes[j.personaje];
  if (!p) return;
  dibujarPersonaje(ctx, p, {
    x: gx, y: j.y * TH - Math.max(j.z, -3) * LH, fx: j.fx, fy: j.fy, t: m.t,
    caminando: j.camina && j.enSuelo, volando: j.planeo, embistiendo: !!j.embiste, escala: 1, paso: j.paso,
    inclina: !j.embiste && j.reverencia > 0.02 ? j.reverencia * 0.2 * j.reverenciaDir : 0,   // reverencia ante el toro
  });
  if (j.personaje === 'minotauro' && j.esfuerzo > 0) {
    // Líneas de esfuerzo delante del Minotauro mientras empuja
    const l = Math.hypot(j.fx, j.fy * 0.8) || 1, dx = j.fx / l, dy = j.fy * 0.8 / l, bx = gx, by = cuerpoY - 22;
    ctx.lineCap = 'round';
    for (const [color, ancho] of [[COL.tinta, 5], [COL.cal, 2.4]]) {
      ctx.strokeStyle = color; ctx.lineWidth = ancho;
      for (let n = -1; n <= 1; n++) {
        const a = Math.atan2(dy, dx) + n * 0.55, tem = Math.sin(m.t * 40 + n) * 2, r0 = 22 + tem, r1 = 31 + tem;
        ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0 * 0.9); ctx.lineTo(bx + Math.cos(a) * r1, by + Math.sin(a) * r1 * 0.9); ctx.stroke();
      }
    }
  }
  if (j.personaje === 'eco' && m.eco && m.sonidos[m.eco]) {
    // El sonido guardado, sobre la cabeza, con un vaivén leve
    const snd = m.sonidos[m.eco];
    ctx.fillStyle = snd.color; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 2;
    simbolo(ctx, snd.simbolo, gx + Math.sin(m.t * 2.2) * 2.5, cuerpoY - 64 + Math.sin(m.t * 3.1) * 2, 7);
  }
}

// ---------- Sprites ----------
// Personajes: SVG con 1 unidad = 1 px de juego y los pies en (0, 0): [x, y, ancho, alto] de su viewBox.
const SPRITES = {
  pegaso: [-22, -51, 44, 52], minotauro: [-18, -51, 36, 52], ariadna: [-18, -51, 36, 52],
  fenix: [-18, -51, 36, 52], eco: [-18, -51, 36, 52],
  // Alas de Pegaso y Fénix: piezas aparte, con el origen (0, 0) en la articulación del hombro, donde giran
  'pegaso-ala-cerca': [-27, -28, 34, 34], 'pegaso-ala-lejos': [-27, -28, 34, 34],
  'fenix-ala-cerca': [-27, -28, 34, 34], 'fenix-ala-lejos': [-27, -28, 34, 34],
};
// Alas por personaje: hombro cercano y lejano (relativos a los pies, mirando a la derecha), ángulos de la
// ala cercana en grados (abajo, media, arriba; positivo = sentido horario) y desfase de la lejana.
const ALAS = {
  pegaso: { cerca: [1, -23], lejos: [-2, -24], abajo: -45, media: 0, arriba: 25, desfase: 15 },
  fenix: { cerca: [-2, -22], lejos: [-4, -23], abajo: -75, media: -35, arriba: -8, desfase: 30 },
};
// Escenario: origen del viewBox de cada sprite que no es de casilla (el resto empieza en 0, 0).
const ORIGEN = {
  bloque: [-20, -57], vasija: [-22, -42], 'brasero-apagado': [-20, -30], 'brasero-encendido': [-20, -30], llama: [-10, -38],
  'fuente-caracola': [-22, -40], 'fuente-cimbalo': [-20, -36], argolla: [-14, -30], 'argolla-viva': [-14, -32],
  coleccionable: [-22, -22], barca: [-52, -32], brillo: [-26, -26],
  delfin: [-24, -16], 'pulpo-0': [-32, -42], 'pulpo-1': [-32, -42], 'rocas-atras': [-28, -32], 'rocas-frente': [-28, -24],
  gaviota: [-18, -26], 'gaviota-grazna': [-18, -28], 'gaviota-vuelo-0': [-24, -26], 'gaviota-vuelo-1': [-24, -26], poste: [-8, -36],
  'toro-0': [-34, -50], 'toro-1': [-34, -50], red: [-30, -30], anforas: [-32, -36], concha: [-17, -14],
  olivo: [-36, -80], granado: [-28, -62], granada: [-7, -7], 'lirios-0': [-24, -50], 'lirios-1': [-24, -50], azafran: [-22, -18],
  narciso: [-18, -38], estanque: [-34, -15], cabra: [-30, -46], 'gato-0': [-20, -20], 'gato-1': [-28, -24], 'gato-2': [-24, -30],
  ...Object.fromEntries(OBJETOS.map(id => [id, [-22, -22]])),
};
// Ambiente (sprites/ambiente/): fauna y detalles, rasterizados igual que el escenario
const AMBIENTE = ['delfin', 'pulpo-0', 'pulpo-1', 'rocas-atras', 'rocas-frente', 'gaviota', 'gaviota-grazna', 'gaviota-vuelo-0', 'gaviota-vuelo-1', 'poste', 'toro-0', 'toro-1', 'red', 'anforas', 'concha',
  'olivo', 'granado', 'granada', 'lirios-0', 'lirios-1', 'azafran', 'narciso', 'estanque', 'cabra', 'gato-0', 'gato-1', 'gato-2'];
const ESCENARIO = [
  ...[0, 1, 2, 3].flatMap(i => [`losa-suelo-${i}`, `sillar-${i}`, `sillar-claro-${i}`, `tope-${i}`]),
  ...[0, 1, 2].flatMap(i => [`losa-terraza-${i}`, `losa-techo-${i}`]),
  'baldosa-0', 'baldosa-1', 'tope-claro-0', 'tope-claro-1', 'cara-terraza', 'cara-techo-0', 'cara-techo-1', 'mar',
  'placa', 'placa-activa', 'reja-cerrada', 'grieta', 'puerta-sol', 'puerta-sonido', 'escombros', 'umbral-reja', 'umbral-sol',
  'bloque', 'vasija', 'brasero-apagado', 'brasero-encendido', 'llama', 'fuente-caracola', 'fuente-cimbalo',
  'argolla', 'argolla-viva', 'coleccionable', 'barca',
  ...OBJETOS, 'brillo',
  ...AMBIENTE,
];
const imagenes = {};
const ras = {};          // escenario rasterizado una vez a la densidad del dispositivo: { c, k, ox, oy, w, h }
const fallidos = [];
let spritesListos = false;
const alListos = [];
{
  const K = Math.min(3, Math.max(1, Math.ceil(window.devicePixelRatio || 1)));
  let pendientes = Object.keys(SPRITES).length + ESCENARIO.length;
  const terminado = () => {
    if (--pendientes > 0) return;
    spritesListos = true;
    for (const f of alListos.splice(0)) f();
  };
  for (const id of Object.keys(SPRITES)) {
    const img = new Image();
    img.onload = () => { imagenes[id] = img; terminado(); };
    img.onerror = () => terminado();   // si uno falla, ese personaje no se dibuja pero el juego sigue
    img.src = `sprites/personajes/${id}.svg`;
  }
  for (const n of ESCENARIO) {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight, cv = document.createElement('canvas');
      cv.width = Math.ceil(w * K); cv.height = Math.ceil(h * K);
      const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high';
      c.drawImage(img, 0, 0, cv.width, cv.height);
      const [ox, oy] = ORIGEN[n] || [0, 0];
      ras[n] = { c: cv, k: K, ox, oy, w, h };
      terminado();
    };
    img.onerror = () => { fallidos.push(n); terminado(); };
    img.src = `sprites/${OBJETOS.includes(n) || n === 'brillo' ? 'coleccionables' : AMBIENTE.includes(n) ? 'ambiente' : 'escenario'}/${n}.svg`;
  }
}

// Dibuja un sprite de escenario con su origen en (x, y); `extra` lo agranda un poco para que no queden costuras.
function pintar(ctx, n, x, y, extra = 0) {
  const s = ras[n];
  if (s) ctx.drawImage(s.c, x + s.ox, y + s.oy, s.w + extra, s.h + extra);
}
// Dibuja el recorte (sx, sy, sw, sh) de un sprite, en unidades de juego, con su esquina en (dx, dy).
function recorte(ctx, n, sx, sy, sw, sh, dx, dy, extra = 0) {
  const s = ras[n];
  if (s) ctx.drawImage(s.c, sx * s.k, sy * s.k, sw * s.k, sh * s.k, dx, dy, sw + extra, sh + extra);
}

// Llama a `f` cuando todos los sprites (cinco cuerpos, cuatro alas y escenario) terminaron de cargar (enseguida si ya terminaron).
export function alTenerSprites(f) { if (spritesListos) f(); else alListos.push(f); }
// Para las pruebas: estado de la carga, tamaño natural de cada sprite de personaje cargado, y el escenario.
export function estadoSprites() {
  return {
    listos: spritesListos,
    imagenes: Object.fromEntries(Object.entries(imagenes).map(([id, i]) => [id, [i.naturalWidth, i.naturalHeight]])),
    escenario: Object.fromEntries(Object.entries(ras).map(([n, s]) => [n, [s.w, s.h]])),
    esperados: ESCENARIO.length, fallidos: [...fallidos],
  };
}

// Dibuja el sprite del personaje con los pies en (x, y). Mirando a la izquierda se espeja; hacia atrás usa el mismo.
// Pegaso y Fénix llevan las alas aparte: ala lejana, cuerpo, ala cercana.
export function dibujarPersonaje(ctx, p, o) {
  const { x, y, fx, caminando, escala, paso } = o;
  const img = spritesListos && imagenes[p.id];
  if (!img) return;
  const [sx, sy, sw, sh] = SPRITES[p.id];
  const bob = caminando ? Math.abs(Math.sin(paso * 5)) * 2 : 0;
  const alas = ALAS[p.id];
  const cerca = alas && imagenes[p.id + '-ala-cerca'], lejos = alas && imagenes[p.id + '-ala-lejos'];
  // Ángulo de la ala cercana: volando, aleteo completo; si no, vaivén leve y lento alrededor de la pose media
  let ang = 0;
  if (alas) {
    if (o.volando) ang = alas.abajo + (alas.arriba - alas.abajo) * (Math.sin(o.t * 20) + 1) / 2;
    else ang = alas.media + Math.sin(o.t * 2) * 10;
  }
  const ala = (im, art, grados) => {
    if (!im) return;
    const [ax, ay, aw, ah] = SPRITES[p.id + (im === cerca ? '-ala-cerca' : '-ala-lejos')];
    ctx.save();
    ctx.translate(art[0], art[1] - bob); ctx.rotate(grados * Math.PI / 180);
    ctx.drawImage(im, ax, ay, aw, ah);
    ctx.restore();
  };
  ctx.save();
  ctx.translate(x, y); ctx.scale(escala, escala);
  if (o.inclina) ctx.rotate(o.inclina);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.save();
  if (fx < 0) ctx.scale(-1, 1);
  if (alas) ala(lejos, alas.lejos, ang - alas.desfase);
  ctx.drawImage(img, sx, sy - bob, sw, sh);
  if (alas) ala(cerca, alas.cerca, ang);
  ctx.restore();

  // Embestida: líneas de velocidad cal con contorno tinta (el polvo a los pies viene del mundo)
  if (o.embistiendo) {
    const dir = fx < 0 ? -1 : 1;
    ctx.lineCap = 'round';
    for (const [color, ancho] of [[COL.tinta, 5.5], [COL.cal, 2.6]]) {
      ctx.strokeStyle = color; ctx.lineWidth = ancho;
      for (let n = 0; n < 3; n++) { ctx.beginPath(); ctx.moveTo(-dir * (14 + n * 3), -10 - n * 11); ctx.lineTo(-dir * (34 - n * 2), -10 - n * 11); ctx.stroke(); }
    }
  }
  ctx.restore();
}

function dibujarParticulas(ctx, m) {
  for (const p of m.particulas) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.vida / 0.5));
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x * TW, p.y * TH - p.z * LH, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
