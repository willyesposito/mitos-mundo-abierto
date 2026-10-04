// Dibujo del mundo en vista cenital inclinada. Todo por código, sin imágenes.
import { TW, TH, LH, ABISMO, alturaCelda } from './mundo.js';

const NIVEL_AGUA = -0.12;
const COL = {
  fondo: '#2a2230', noche: '#2a2230',
  suelo: '#e6c88a', sueloB: '#dcbb78', baldosa: '#dfc07c', baldosaLinea: '#b99351',
  cal: '#f4ecd8', calSombra: '#cbb994', oxido: '#b5482e', oxidoOscuro: '#8f3a24',
  egeo: '#1f6f9c', agua: '#2d79a8', aguaClara: '#7fb8d8', ocre: '#d9a441',
  pared: '#a9764a', paredTope: '#7a5236', paredLinea: '#8a5d38',
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

function dibujarMundo(ctx, m, v, personajes) {
  const { W, H, dpr, esc, camX, camY, focoY } = v;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COL.fondo;
  ctx.fillRect(0, 0, W, H);
  ctx.setTransform(dpr * esc, 0, 0, dpr * esc, dpr * (W / 2 - camX * esc), dpr * (focoY - camY * esc));

  const mitadW = W / 2 / esc;
  const arriba = camY - focoY / esc, abajo = camY + (H - focoY) / esc;
  const x0 = Math.max(0, Math.floor((camX - mitadW) / TW) - 1), x1 = Math.min(m.cols - 1, Math.ceil((camX + mitadW) / TW) + 1);
  const y0 = Math.max(0, Math.floor(arriba / TH) - 1), y1 = Math.min(m.rows - 1, Math.ceil((abajo + 3 * LH) / TH));

  const j = m.jugador;
  const items = [];
  for (const e of m.empujables) items.push({ fila: Math.round(e.py), prof: e.py, tipo: 'empujable', e });
  for (const c of m.coleccionables) if (!c.recogido) items.push({ fila: Math.floor(c.y), prof: c.y, tipo: 'objeto', c });
  for (const b of m.braseros) items.push({ fila: b.y, prof: b.y + 0.5, tipo: 'brasero', b });
  for (const f of m.fuentes) items.push({ fila: f.ty, prof: f.y, tipo: 'fuente', f });
  for (const b of m.barcas) items.push({ fila: b.y, prof: b.y + 0.4, tipo: 'barca', b });
  // Las argollas y las sogas se dibujan después de todas las baldosas por las que pasan
  for (const s of m.sogas) {
    const maxFila = Math.max(s.a[1], s.b[1]);
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
  ctx.globalAlpha = 0.35;
  for (const c of m.coleccionables) if (!c.recogido) dibujarObjeto(ctx, m, c, false);
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
function dibujarTile(ctx, m, x, y) {
  const c = m.celdas[y][x];
  const h = alturaVisual(c);
  const px = x * TW, py = y * TH - h * LH;

  // Cara frontal (sur): cae hasta la altura de la baldosa vecina del sur.
  const hs = y + 1 < m.rows ? alturaVisual(m.celdas[y + 1][x]) : 0;
  if (h > hs) {
    const alto = (h - hs) * LH;
    const fy = py + TH;
    if (c === '#' || c === 'b' || c === 'M' || c === 'G' || c === 'D' || c === 'O') caraPared(ctx, c, px, fy, alto, m, x, y);
    else if (c === 'A') caraLisa(ctx, px, fy, alto, COL.oxidoOscuro, COL.egeo);
    else if (c === 'a') caraLisa(ctx, px, fy, alto, COL.calSombra, COL.oxido);
    else { ctx.fillStyle = '#9b7a45'; ctx.fillRect(px, fy, TW, alto); }
  }

  switch (c) {
    case '~': dibujarAgua(ctx, m, x, y, px, py); break;
    case '#': case 'b': case 'M': case 'G': case 'D': case 'O':
      ctx.fillStyle = COL.paredTope; ctx.fillRect(px, py, TW, TH);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(px, py, TW, 4);
      break;
    case 'a':
      ctx.fillStyle = COL.cal; ctx.fillRect(px, py, TW, TH);
      ctx.strokeStyle = 'rgba(181,72,46,.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(px + 3.5, py + 3.5, TW - 7, TH - 7);
      break;
    case 'A':
      ctx.fillStyle = '#c0583a'; ctx.fillRect(px, py, TW, TH);
      ctx.strokeStyle = 'rgba(244,236,216,.55)'; ctx.lineWidth = 1.5; ctx.strokeRect(px + 3.5, py + 3.5, TW - 7, TH - 7);
      break;
    default: {
      const baldosa = c === ',' || c === 'p';
      ctx.fillStyle = baldosa ? COL.baldosa : ((x + y) & 1 ? COL.suelo : COL.sueloB);
      ctx.fillRect(px, py, TW, TH);
      if (baldosa) { ctx.strokeStyle = COL.baldosaLinea; ctx.lineWidth = 1.5; ctx.strokeRect(px + 2.5, py + 2.5, TW - 5, TH - 5); }
      if (c === 'p') dibujarPlaca(ctx, m, x, y, px, py);
      if (m.salidas.has(x + ',' + y)) dibujarSalida(ctx, m, x, y, px, py);
    }
  }
}

function caraLisa(ctx, px, fy, alto, base, banda) {
  ctx.fillStyle = base; ctx.fillRect(px, fy, TW, alto);
  ctx.fillStyle = banda;
  for (let n = 0; n < Math.ceil(alto / LH); n++) ctx.fillRect(px, fy + n * LH + 4, TW, 5);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(px, fy + alto - 4, TW, 4);
}

function caraPared(ctx, c, px, fy, alto, m, x, y) {
  ctx.fillStyle = COL.pared; ctx.fillRect(px, fy, TW, alto);
  ctx.fillStyle = COL.paredLinea;
  for (let yy = fy + LH / 2; yy < fy + alto; yy += LH / 2) ctx.fillRect(px, yy, TW, 1.5);
  if (c === 'M') {
    ctx.fillStyle = '#cdb28a'; ctx.fillRect(px, fy, TW, alto);
    ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(px + 20, fy + 3); ctx.lineTo(px + 15, fy + 20); ctx.lineTo(px + 24, fy + 34); ctx.lineTo(px + 17, fy + 52); ctx.lineTo(px + 22, fy + alto - 3);
    ctx.moveTo(px + 15, fy + 20); ctx.lineTo(px + 5, fy + 26);
    ctx.moveTo(px + 24, fy + 34); ctx.lineTo(px + 36, fy + 40);
    ctx.stroke();
  } else if (c === 'G') {
    ctx.fillStyle = '#3b2b1d'; ctx.fillRect(px + 2, fy + 2, TW - 4, alto - 4);
    ctx.strokeStyle = '#c28a3c'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    for (let n = 0; n < 4; n++) { const bx = px + 7 + n * 10; ctx.beginPath(); ctx.moveTo(bx, fy + 3); ctx.lineTo(bx, fy + alto - 3); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(px + 3, fy + alto * 0.45); ctx.lineTo(px + TW - 3, fy + alto * 0.45); ctx.stroke();
  }
  else if (c === 'D') {
    // Puerta del sol: disco solar con rayos
    ctx.fillStyle = '#3b2b1d'; ctx.fillRect(px + 2, fy + 2, TW - 4, alto - 4);
    const cx = px + TW / 2, cy = fy + Math.min(alto * 0.5, 40);
    ctx.strokeStyle = COL.ocre; ctx.fillStyle = COL.ocre; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let n = 0; n < 12; n++) { const a = n * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); ctx.lineTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3c8'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
  } else if (c === 'O') {
    // Puerta de sonido: lleva el color y el símbolo del sonido al que responde
    const p = m.puertasSonido.find(q => q.x === x && q.y === y), snd = p && m.sonidos[p.sonido];
    ctx.fillStyle = '#3b2b1d'; ctx.fillRect(px + 2, fy + 2, TW - 4, alto - 4);
    if (snd) {
      ctx.fillStyle = snd.color; ctx.fillRect(px + 5, fy + 5, TW - 10, alto - 10);
      const cx = px + TW / 2, cy = fy + Math.min(alto * 0.5, 40);
      ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2;
      simbolo(ctx, snd.simbolo, cx, cy, 11);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      for (const r of [17, 22]) { ctx.beginPath(); ctx.arc(cx, cy, r, -0.7, 0.7); ctx.stroke(); }
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(px, fy + alto - 5, TW, 5);
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

function dibujarAgua(ctx, m, x, y, px, py) {
  ctx.fillStyle = COL.agua; ctx.fillRect(px, py, TW, TH);
  ctx.strokeStyle = 'rgba(255,255,255,.38)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let n = 0; n < 2; n++) {
    const off = Math.sin(m.t * 1.6 + x * 1.3 + y * 0.9 + n * 2) * 4;
    const wy = py + 9 + n * 17;
    ctx.beginPath(); ctx.moveTo(px + 6 + off, wy); ctx.quadraticCurveTo(px + 14 + off, wy - 5, px + 22 + off, wy); ctx.quadraticCurveTo(px + 30 + off, wy + 5, px + 38 + off, wy); ctx.stroke();
  }
}

// Paso a otro mapa: franja ocre con flechas hacia el borde por el que se sale
function dibujarSalida(ctx, m, x, y, px, py) {
  const arriba = y < m.rows / 2, cx = px + TW / 2, cy = py + TH / 2, d = arriba ? -1 : 1;
  ctx.fillStyle = 'rgba(217,164,65,.45)'; ctx.fillRect(px, py, TW, TH);
  ctx.strokeStyle = COL.oxido; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const o of [-6, 5]) { ctx.beginPath(); ctx.moveTo(cx - 9, cy + o * d - 3 * d); ctx.lineTo(cx, cy + o * d + 4 * d); ctx.lineTo(cx + 9, cy + o * d - 3 * d); ctx.stroke(); }
}

// Barca sobre el agua: solo adorno
function dibujarBarca(ctx, m, b) {
  const x0 = b.x * TW + 3, x1 = (b.x + b.largo) * TW - 3, cy = b.y * TH + TH * 0.5 + Math.sin(m.t * 1.4 + b.x) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, cy + 8, (x1 - x0) / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COL.oxido;
  ctx.beginPath(); ctx.moveTo(x0, cy - 8); ctx.lineTo(x1, cy - 8); ctx.quadraticCurveTo(x1 - 8, cy + 10, (x0 + x1) / 2, cy + 10); ctx.quadraticCurveTo(x0 + 8, cy + 10, x0, cy - 8); ctx.fill();
  ctx.fillStyle = COL.cal; ctx.fillRect(x0 + 2, cy - 8, x1 - x0 - 4, 4);
  ctx.fillStyle = COL.ocre; ctx.fillRect(x0 + 8, cy - 1, x1 - x0 - 16, 3);
}

function dibujarPlaca(ctx, m, x, y, px, py) {
  const activa = m.empujables.some(e => e.tx === x && e.ty === y && e.t >= 1);
  const cx = px + TW / 2, cy = py + TH / 2;
  ctx.fillStyle = activa ? COL.ocre : '#9c4a30';
  ctx.beginPath(); ctx.ellipse(cx, cy, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = activa ? '#fff3c8' : COL.cal; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let a = 0; a < 9; a += 0.25) { const r = a * 1.4; ctx.lineTo(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 0.85); }
  ctx.stroke();
}

// ---------- Objetos y personajes ----------
function dibujarItem(ctx, m, it, personajes) {
  if (it.tipo === 'empujable') dibujarEmpujable(ctx, it.e);
  else if (it.tipo === 'brasero') dibujarBrasero(ctx, m, it.b);
  else if (it.tipo === 'fuente') dibujarFuente(ctx, m, it.f);
  else if (it.tipo === 'barca') dibujarBarca(ctx, m, it.b);
  else if (it.tipo === 'soga') dibujarSoga(ctx, it.s);
  else if (it.tipo === 'argolla') dibujarArgolla(ctx, it.s, it.p);
  else if (it.tipo === 'objeto') dibujarObjeto(ctx, m, it.c, true);
  else dibujarJugador(ctx, m, personajes, true);
}

function dibujarEmpujable(ctx, e) {
  const base = 0; // los empujables viven en el suelo
  const sx = e.px * TW, sy = e.py * TH - base * LH;
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(sx + TW / 2, sy + TH - 5, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (e.tipo === 'bloque') {
    const ah = e.alto * LH, bx = sx + 4, bw = TW - 8;
    ctx.fillStyle = '#a39275'; ctx.fillRect(bx, sy + TH - 4 - ah, bw, ah);                 // cara frontal
    ctx.fillStyle = COL.oxido; ctx.fillRect(bx, sy + TH - 4 - ah + 8, bw, 5);              // banda
    ctx.fillStyle = '#d6c7a8'; ctx.fillRect(bx, sy + 4 - ah, bw, TH - 8);                   // tapa
    ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.strokeRect(bx, sy + 4 - ah, bw, TH - 8 + ah);
    ctx.beginPath(); ctx.moveTo(bx, sy + TH - 4 - ah); ctx.lineTo(bx + bw, sy + TH - 4 - ah); ctx.stroke();
  } else {
    const cx = sx + TW / 2, bot = sy + TH - 5, top = bot - e.alto * LH - 4;
    ctx.fillStyle = '#b5482e'; ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, top); ctx.lineTo(cx + 6, top);
    ctx.quadraticCurveTo(cx + 7, top + 7, cx + 12, top + 12);
    ctx.quadraticCurveTo(cx + 20, top + 22, cx + 13, bot - 8);
    ctx.quadraticCurveTo(cx + 9, bot, cx + 4, bot);
    ctx.lineTo(cx - 4, bot);
    ctx.quadraticCurveTo(cx - 9, bot, cx - 13, bot - 8);
    ctx.quadraticCurveTo(cx - 20, top + 22, cx - 12, top + 12);
    ctx.quadraticCurveTo(cx - 7, top + 7, cx - 6, top);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.ocre; ctx.fillRect(cx - 17, top + 14, 34, 5);
    ctx.fillStyle = COL.cal; ctx.fillRect(cx - 17, top + 23, 34, 3);
    ctx.fillStyle = '#d6c7a8'; ctx.beginPath(); ctx.ellipse(cx, top, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

function dibujarBrasero(ctx, m, b) {
  const cx = b.x * TW + TW / 2, by = b.y * TH + TH - 6 - b.zBase * LH;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, by + 1, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (b.encendido) {
    const g = ctx.createRadialGradient(cx, by - 24, 2, cx, by - 24, 38);
    g.addColorStop(0, 'rgba(255,190,80,.55)'); g.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, by - 24, 38, 0, Math.PI * 2); ctx.fill();
  }
  // pie y cuenco de bronce
  ctx.fillStyle = '#6b4a2b'; ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 7, by); ctx.lineTo(cx + 7, by); ctx.lineTo(cx + 3, by - 14); ctx.lineTo(cx - 3, by - 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c28a3c';
  ctx.beginPath(); ctx.moveTo(cx - 15, by - 24); ctx.lineTo(cx + 15, by - 24); ctx.quadraticCurveTo(cx + 13, by - 10, cx, by - 10); ctx.quadraticCurveTo(cx - 13, by - 10, cx - 15, by - 24); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (b.encendido) {
    for (const [dx, h, c] of [[-6, 14, '#e8892a'], [0, 22, '#ffb23c'], [6, 14, '#e8892a']]) {
      const wob = Math.sin(m.t * 9 + dx) * 2;
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx + dx - 5, by - 24); ctx.quadraticCurveTo(cx + dx + wob, by - 24 - h * 1.5, cx + dx + 5, by - 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#4a3226'; ctx.beginPath(); ctx.ellipse(cx, by - 24, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(244,236,216,.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(cx, by - 34, 7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);   // llama sin encender
  }
}

function dibujarFuente(ctx, m, f) {
  const snd = m.sonidos[f.sonido];
  const cx = f.tx * TW + TW / 2, by = f.ty * TH + TH - 6 - f.zBase * LH;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, by + 1, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  const vib = f.activa ? Math.sin(m.t * 30) * 1.2 : 0;
  if (f.modo === 'sola') {
    // caracola: espiral
    ctx.fillStyle = '#f0d9c0';
    ctx.beginPath(); ctx.ellipse(cx + vib, by - 12, 14, 11, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 2 + vib, by - 12, 6, 0.3, 4.6); ctx.stroke();
    ctx.fillStyle = '#e8a79a'; ctx.beginPath(); ctx.moveTo(cx - 8, by - 4); ctx.quadraticCurveTo(cx - 20, by - 8, cx - 16, by - 18); ctx.lineTo(cx - 8, by - 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    // címbalo de bronce sobre un pie
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(cx - 2, by - 20, 4, 20); ctx.strokeRect(cx - 2, by - 20, 4, 20);
    ctx.fillStyle = '#c28a3c';
    ctx.beginPath(); ctx.ellipse(cx + vib, by - 26, 15, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0b03a'; ctx.beginPath(); ctx.arc(cx + vib, by - 28, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // insignia del sonido: color y símbolo (apagada y sin brillo hasta que suene)
  const ix = cx, iy = by - 50 - Math.sin(m.t * 3) * (f.activa ? 2 : 0);
  ctx.globalAlpha = f.activa ? 1 : 0.55;
  ctx.fillStyle = snd.color; ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ix, iy, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffaf0'; ctx.lineWidth = 1.5; simbolo(ctx, snd.simbolo, ix, iy, 6.5);
  ctx.globalAlpha = 1;
  if (f.activa) {
    ctx.strokeStyle = snd.color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let n = 0; n < 3; n++) {
      const q = ((m.t / 1.3) + n / 3) % 1;
      ctx.globalAlpha = (1 - q) * 0.8;
      ctx.beginPath(); ctx.ellipse(cx, by - 14, 14 + q * 34, 8 + q * 20, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function dibujarArgolla(ctx, s, p) {
  const h = p === s.a ? s.ha : s.hb;
  const cx = p[0] * TW + TW / 2, cy = p[1] * TH + TH / 2 - h * LH;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, cy + 6, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5236'; ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2;
  ctx.fillRect(cx - 3, cy - 4, 6, 10); ctx.strokeRect(cx - 3, cy - 4, 6, 10);
  ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = s.tendida ? '#e6b45a' : '#c28a3c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2); ctx.stroke();
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
  ctx.lineCap = 'round';
  const [x0, y0] = pt(ini), [x1, y1] = pt(fin);
  if (s.ha === s.hb) {
    // puente: tablones entre dos sogas
    const n = s.casillas.length * 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
      ctx.fillStyle = i % 2 ? '#b98a52' : '#a5763f'; ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 1.5;
      if (vertical) { ctx.fillRect(px - 15, py - 4, 30, 8); ctx.strokeRect(px - 15, py - 4, 30, 8); }
      else { ctx.fillRect(px - 5, py - 12, 10, 24); ctx.strokeRect(px - 5, py - 12, 10, 24); }
    }
    ctx.strokeStyle = '#8f3a24'; ctx.lineWidth = 3;
    for (const o of vertical ? [[-15, 0], [15, 0]] : [[0, -12], [0, 12]]) { ctx.beginPath(); ctx.moveTo(x0 + o[0], y0 + o[1]); ctx.lineTo(x1 + o[0], y1 + o[1]); ctx.stroke(); }
  } else {
    // escala: dos sogas con peldaños
    const n = s.casillas.length * 2;
    ctx.strokeStyle = '#8f3a24'; ctx.lineWidth = 3.5;
    for (const o of [-9, 9]) { ctx.beginPath(); ctx.moveTo(x0 + o, y0 - 10); ctx.lineTo(x1 + o, y1 - 10); ctx.stroke(); }
    ctx.strokeStyle = '#d6b27a'; ctx.lineWidth = 3;
    for (let i = 0; i <= n; i++) { const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t - 10; ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.stroke(); }
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

function dibujarObjeto(ctx, m, c, conSombra) {
  const gx = c.x * TW, gy = c.y * TH - c.zBase * LH;
  const bob = Math.sin(m.t * 2.6 + c.x) * 0.1;
  const sy = gy - (0.7 + bob) * LH;
  if (conSombra) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(gx, gy, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
  const g = ctx.createRadialGradient(gx, sy, 2, gx, sy, 22);
  g.addColorStop(0, 'rgba(255,230,140,.7)'); g.addColorStop(1, 'rgba(255,230,140,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, sy, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COL.ocre; ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(gx, sy - 12); ctx.lineTo(gx + 9, sy); ctx.lineTo(gx, sy + 12); ctx.lineTo(gx - 9, sy); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff3c8'; ctx.beginPath(); ctx.moveTo(gx, sy - 8); ctx.lineTo(gx + 4, sy - 1); ctx.lineTo(gx, sy + 1); ctx.lineTo(gx - 4, sy - 1); ctx.closePath(); ctx.fill();
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

// Personaje base compartido + un rasgo propio. Pies en (x, y).
export function dibujarPersonaje(ctx, p, o) {
  const { x, y, fx, fy, t, caminando, volando, escala, paso } = o;
  ctx.save();
  ctx.translate(x, y); ctx.scale(escala, escala);
  const contorno = '#2a2230';
  const bob = caminando ? Math.abs(Math.sin(paso * 5)) * 2 : 0;
  const mirandoAtras = fy < -0.5 && Math.abs(fy) > Math.abs(fx);
  ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = contorno;

  // Detrás del cuerpo
  if (p.rasgo === 'alas') {
    const aleteo = Math.sin(t * (volando ? 20 : 3.5)) * (volando ? 0.7 : 0.18);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 7, -20 - bob); ctx.rotate(s * (0.5 + aleteo));
      ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#8fb6d0';
      ctx.beginPath(); ctx.ellipse(s * 9, -8, 8, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = contorno;
  }
  if (p.rasgo === 'ovillo' && !mirandoAtras) { /* el ovillo va al frente */ }
  if (p.rasgo === 'llama') {
    ctx.fillStyle = 'rgba(255,170,60,.22)'; ctx.beginPath(); ctx.arc(0, -22 - bob, 20, 0, Math.PI * 2); ctx.fill();
    if (volando) {
      // alas de fuego al volar
      const aleteo = Math.sin(t * 20) * 0.6;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 7, -20 - bob); ctx.rotate(s * (0.5 + aleteo));
        ctx.fillStyle = '#ffb23c'; ctx.strokeStyle = '#e8892a';
        ctx.beginPath(); ctx.ellipse(s * 9, -8, 7, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = contorno;
    }
  }

  // Piernas
  ctx.fillStyle = '#3a2a22';
  const a = caminando ? Math.sin(paso * 5) * 2.5 : 0;
  ctx.fillRect(-6, -7, 4.5, 7 + a * 0.4); ctx.fillRect(1.5, -7, 4.5, 7 - a * 0.4);

  // Cuerpo
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.roundRect(-9, -26 - bob, 18, 20, 6); ctx.fill(); ctx.stroke();
  if (p.rasgo === 'cuernos') { ctx.fillStyle = '#5a3a26'; ctx.fillRect(-9, -13 - bob, 18, 3); }
  if (p.rasgo === 'llama') { ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(0, -16 - bob, 4, 0, Math.PI * 2); ctx.fill(); }
  if (p.rasgo === 'voz') { ctx.fillStyle = '#9ec5dd'; ctx.fillRect(-9, -13 - bob, 18, 3); }

  // Cabeza
  const hy = -33.5 - bob;
  ctx.fillStyle = p.rasgo === 'cuernos' ? '#8a5a3c' : '#f0d2a8';
  ctx.beginPath(); ctx.arc(0, hy, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  if (p.rasgo === 'cuernos') {
    ctx.fillStyle = '#f4ecd8';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 6, hy - 5); ctx.quadraticCurveTo(s * 14, hy - 6, s * 12, hy - 15); ctx.quadraticCurveTo(s * 9, hy - 9, s * 3, hy - 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (!mirandoAtras) { ctx.fillStyle = '#c99a72'; ctx.beginPath(); ctx.ellipse(fx * 2, hy + 3.5, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  if (p.rasgo === 'ovillo') {
    ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(0, hy - 1, 9, Math.PI, 0); ctx.fill();
    if (mirandoAtras) { ctx.beginPath(); ctx.arc(0, hy, 8.5, 0, Math.PI * 2); ctx.fill(); }
  }
  if (p.rasgo === 'alas') {
    ctx.fillStyle = '#9ec5dd'; ctx.beginPath(); ctx.arc(0, hy - 2, 8.8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  }
  if (p.rasgo === 'llama') {
    for (const [dx, h, c] of [[-5, 10, '#e8892a'], [0, 15, '#ffb23c'], [5, 10, '#e8892a']]) {
      const wob = Math.sin(t * 9 + dx) * 1.5;
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(dx - 4, hy - 6); ctx.quadraticCurveTo(dx + wob, hy - h - 6, dx + 4, hy - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  if (p.rasgo === 'voz') {
    const pulso = (t * 1.6) % 1;
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let n = 0; n < 3; n++) {
      const q = (pulso + n / 3) % 1;
      ctx.strokeStyle = `rgba(158,197,221,${1 - q})`;
      ctx.beginPath(); ctx.arc(10, hy, 6 + q * 12, -0.9, 0.9); ctx.stroke();
    }
    ctx.lineWidth = 1.8; ctx.strokeStyle = contorno;
  }

  // Ojos
  if (!mirandoAtras) {
    ctx.fillStyle = contorno;
    const ex = fx * 2.5;
    ctx.beginPath(); ctx.arc(ex - 3, hy + 0.5, 1.5, 0, Math.PI * 2); ctx.arc(ex + 3, hy + 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // Ovillo de Ariadna, al frente
  if (p.rasgo === 'ovillo') {
    const ox = 12, oy = -11 - bob;
    ctx.fillStyle = '#b5482e'; ctx.beginPath(); ctx.arc(ox, oy, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f4ecd8'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(ox, oy, 3.2, 0.4, 4.4); ctx.moveTo(ox - 5, oy - 1); ctx.lineTo(ox + 5, oy + 1); ctx.stroke();
    ctx.strokeStyle = '#b5482e'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(ox + 3, oy + 5); ctx.quadraticCurveTo(ox + 10, oy + 12, ox + 4, oy + 14); ctx.stroke();
  }

  // Embestida: estela
  if (o.embistiendo) {
    ctx.strokeStyle = 'rgba(244,236,216,.7)'; ctx.lineWidth = 2.5;
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
