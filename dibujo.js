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
  else dibujarJugador(ctx, m, personajes, true);
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
  if (s.ha === s.hb) {
    // puente: tablones entre dos sogas
    const n = s.casillas.length * 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
      ctx.fillStyle = i % 2 ? '#b98a52' : '#a5763f'; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5;
      if (vertical) { ctx.fillRect(px - 15, py - 4, 30, 8); ctx.strokeRect(px - 15, py - 4, 30, 8); }
      else { ctx.fillRect(px - 5, py - 12, 10, 24); ctx.strokeRect(px - 5, py - 12, 10, 24); }
    }
    for (const o of vertical ? [[-15, 0], [15, 0]] : [[0, -12], [0, 12]]) lino(ctx, x0 + o[0], y0 + o[1], x1 + o[0], y1 + o[1], 3);
  } else {
    // escala: dos sogas con peldaños
    const n = s.casillas.length * 2;
    for (const o of [-9, 9]) lino(ctx, x0 + o, y0 - 10, x1 + o, y1 - 10, 3);
    ctx.lineCap = 'round';
    for (let i = 0; i <= n; i++) {
      const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t - 10;
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.stroke();
      ctx.strokeStyle = '#b98a52'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.stroke();
    }
  }
}

function dibujarOndas(ctx, m) {
  // Las ondas del eco se ven por encima de todo: atraviesan paredes
  for (const o of m.ondas) {
    const k = o.t / o.dur, r = (0.2 + k * 0.8) * o.alcance;
    ctx.strokeStyle = o.color; ctx.lineWidth = 4;
    for (let n = 0; n < 3; n++) {
      const kk = Math.max(0, k - n * 0.12); if (kk <= 0) continue;
      ctx.globalAlpha = (1 - kk) * 0.8;
      ctx.beginPath(); ctx.ellipse(o.x * TW, o.y * TH - o.z * LH, (0.2 + kk * 0.8) * o.alcance * TW, (0.2 + kk * 0.8) * o.alcance * TH, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function dibujarObjeto(ctx, m, c) {
  const gx = c.x * TW, gy = c.y * TH - c.zBase * LH;
  const bob = Math.sin(m.t * 2.6 + c.x) * 0.1;
  const sy = gy - (0.7 + bob) * LH;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(gx, gy, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  const pulso = 1 + Math.sin(m.t * 4 + c.x) * 0.06;
  const g = ctx.createRadialGradient(gx, sy, 2, gx, sy, 24 * pulso);
  g.addColorStop(0, 'rgba(255,243,200,.65)'); g.addColorStop(1, 'rgba(255,243,200,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, sy, 24 * pulso, 0, Math.PI * 2); ctx.fill();
  pintar(ctx, 'coleccionable', gx, sy);
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
  const sl = silueta('coleccionable');
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
  if (j.brillo > 0) {
    const r = 30 + (1 - j.brillo) * 40, py = j.y * TH - Math.max(j.z, -3) * LH - 20;
    const gr = ctx.createRadialGradient(gx, py, 4, gx, py, r);
    gr.addColorStop(0, `rgba(255,220,120,${0.7 * j.brillo})`); gr.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(gx, py, r, 0, Math.PI * 2); ctx.fill();
  }
  const p = personajes[j.personaje];
  if (!p) return;
  dibujarPersonaje(ctx, p, {
    x: gx, y: j.y * TH - Math.max(j.z, -3) * LH, fx: j.fx, fy: j.fy, t: m.t,
    caminando: j.camina && j.enSuelo, volando: j.planeo, embistiendo: !!j.embiste, escala: 1, paso: j.paso,
  });
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
  coleccionable: [-22, -22], barca: [-52, -32],
};
const ESCENARIO = [
  ...[0, 1, 2, 3].flatMap(i => [`losa-suelo-${i}`, `sillar-${i}`, `sillar-claro-${i}`, `tope-${i}`]),
  ...[0, 1, 2].flatMap(i => [`losa-terraza-${i}`, `losa-techo-${i}`]),
  'baldosa-0', 'baldosa-1', 'tope-claro-0', 'tope-claro-1', 'cara-terraza', 'cara-techo-0', 'cara-techo-1', 'mar',
  'placa', 'placa-activa', 'reja-cerrada', 'grieta', 'puerta-sol', 'puerta-sonido', 'escombros', 'umbral-reja', 'umbral-sol',
  'bloque', 'vasija', 'brasero-apagado', 'brasero-encendido', 'llama', 'fuente-caracola', 'fuente-cimbalo',
  'argolla', 'argolla-viva', 'coleccionable', 'barca',
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
    img.src = `sprites/escenario/${n}.svg`;
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
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.save();
  if (fx < 0) ctx.scale(-1, 1);
  if (alas) ala(lejos, alas.lejos, ang - alas.desfase);
  ctx.drawImage(img, sx, sy - bob, sw, sh);
  if (alas) ala(cerca, alas.cerca, ang);
  ctx.restore();

  // Embestida: estela
  if (o.embistiendo) {
    ctx.strokeStyle = 'rgba(244,236,216,.7)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let n = 0; n < 3; n++) { ctx.beginPath(); ctx.moveTo(-fx * 14, -8 - n * 8); ctx.lineTo(-fx * 30, -8 - n * 8); ctx.stroke(); }
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
