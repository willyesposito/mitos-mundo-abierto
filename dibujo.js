// Dibujo del mundo en vista cenital inclinada. Escenario y mecanismos con sprites SVG (sprites/escenario/);
// lo que se mueve (olas, llamas, ondas, sogas, partículas) se dibuja por código en el mismo estilo.
import { TW, TH, LH, ABISMO, alturaCelda } from './mundo.js';
import { posePersonaje } from './animacion.js';
import { pintarSueloPlaza } from './plaza.js';
import { objetivoCercano } from './exploracion.js';
import { TIPOS_AMBIENTE, actualizarAmbiente, movimientoAmbiente } from './ambiente.js';
const preferenciaMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
const reducirMovimiento = () => preferenciaMovimiento.matches;
const transiciones = new WeakMap();
const apoyos = new WeakMap();
const ORIGEN_AMBIENTE = {
  anforas: [-44,-46], cabra: [-22,-44], delfin: [-34,-35], fresco: [-45,-47],
  gato: [-20,-26], gaviota: [-18,-20], golondrina: [-19,-23], laurel: [-33,-93],
  lirios: [-29,-44], olivo: [-45,-92], pulpo: [-26,-30], redes: [-28,-41],
};

const NIVEL_AGUA = -0.12;
const COL = {
  fondo: '#2a2230', noche: '#2a2230',
  cal: '#f4ecd8', calSombra: '#cbb994', oxido: '#b5482e', oxidoOscuro: '#8f3a24',
  egeo: '#1f6f9c', ocre: '#d9a441', tinta: '#3b2b1d', oro: '#fff3c8', espuma: '#7fb8d8',
  lino: '#c9a46a', linoSombra: '#8a6a3a',
};

// Sombra de contacto de la guía de estilo: elipse achatada a 0,4, ancha como el 60 % de la pieza,
// corrida un poco a la derecha porque la luz viene de arriba a la izquierda.
function sombraContacto(ctx, cx, cy, ancho, k = 0.6) {
  const rx = ancho * k / 2;
  ctx.fillStyle = 'rgba(20,10,30,.35)';
  ctx.beginPath(); ctx.ellipse(cx + ancho * 0.1, cy, rx, rx * 0.4, 0, 0, Math.PI * 2); ctx.fill();
}

function alturaVisual(c) { return c === '~' || c === 'r' ? NIVEL_AGUA : c === 'b' ? 0.8 : alturaCelda(c); }

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
  const ambiente = actualizarAmbiente(m, reducirMovimiento());
  for (const e of ambiente) {
    if (e.y < y0 - 3 || e.y > y1 + 4 || e.x * TW < camX - mitadW - 100 || e.x * TW > camX + mitadW + 100) continue;
    items.push({ fila: Math.floor(e.y), prof: e.y, tipo: 'ambiente', e });
  }
  // Registrar aperturas desde el render: el mecanismo lógico ya está abierto y nunca espera a la animación.
  let tr = transiciones.get(m);
  if (!tr) {
    tr = new Map(); transiciones.set(m, tr);
    for (const [y, fila] of m.origen.entries()) for (const [x, c] of fila.entries()) if ('GDO'.includes(c)) tr.set(x+','+y, {x,y,c,abierta:m.celdas[y][x]==='.',inicio:-10});
  }
  for (const q of tr.values()) {
    const abierta = m.celdas[q.y][q.x] === '.';
    if (abierta && !q.abierta) q.inicio = m.t;
    q.abierta = abierta;
    if (abierta && m.t-q.inicio < .5 && !reducirMovimiento()) items.push({fila:q.y,prof:q.y+.5,tipo:'apertura',q});
  }
  // Solo entra lo que cae en cámara: el mundo es largo y corre en un celular
  const ver = (fila, minFila = fila) => fila >= y0 - 2 && minFila <= y1 + 4;
  for (const e of m.empujables) if (ver(Math.round(e.py))) items.push({ fila: Math.round(e.py), prof: e.py, tipo: 'empujable', e });
  for (const c of m.coleccionables) if (!c.recogido && c.visible !== false && ver(Math.floor(c.y))) items.push({ fila: Math.floor(c.y), prof: c.y, tipo: 'objeto', c });
  for (const b of m.braseros) if (ver(b.y)) items.push({ fila: b.y, prof: b.y + 0.5, tipo: 'brasero', b });
  for (const f of m.fuentes) if (ver(f.ty)) items.push({ fila: f.ty, prof: f.y, tipo: 'fuente', f });
  for (const b of m.barcas) if (ver(b.y)) items.push({ fila: b.y, prof: b.y + 0.4, tipo: 'barca', b });
  for (const b of m.barcasRemo) if (ver(Math.floor(b.y))) items.push({ fila: Math.floor(b.y), prof: b.y - 0.6, tipo: 'barcaRemo', b });
  for (const q of m.interlocutores) if (ver(Math.floor(q.y))) items.push({ fila: Math.floor(q.y), prof: q.y, tipo: 'interlocutor', q });
  for (const q of m.interactivos) if (ver(Math.floor(q.y))) items.push({ fila: Math.floor(q.y), prof: q.y, tipo: 'interactivo', q });
  for (const q of m.interlocutores) if (q.banco && ver(Math.floor(q.banco[1]))) items.push({ fila: Math.floor(q.banco[1]), prof: q.banco[1] + 0.5, tipo: 'banco', q });
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
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m.celdas[y][x] === 'r') dibujarTechoBoca(ctx, x, y);

  // Siluetas tenues por encima de todo: se ve al personaje y a los objetos detrás de un muro.
  for (const c of m.coleccionables) if (!c.recogido && c.visible !== false && ver(Math.floor(c.y))) dibujarSilueta(ctx, m, c);
  ctx.globalAlpha = 0.35;
  if (j.estado !== 'cayendo' || j.z > -1.2) dibujarJugador(ctx, m, personajes, false);
  ctx.globalAlpha = 1;
  dibujarOndas(ctx, m);
  dibujarOrientacion(ctx, m, v);

  if (m.velo > 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgba(42,34,48,${m.velo})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// La pista se mantiene dentro del área de juego, aunque el destino quede fuera de cámara.
function dibujarOrientacion(ctx,m,v) {
  const o=objetivoCercano(m); if(!o || m.velo>0)return;
  // El marcador queda a un costado: no tapa argollas, grietas ni puertas.
  const sx=v.W/2+(o.x*TW-v.camX)*v.esc+28,sy=v.focoY+(o.y*TH-v.camY)*v.esc+8;
  const borde=24,top=(v.superior||80)+borde,bottom=Math.max(top+20,v.H-(v.inferior||100)-borde);
  const x=Math.max(borde,Math.min(v.W-borde,sx)),y=Math.max(top,Math.min(bottom,sy));
  const fuera=Math.abs(x-sx)>1||Math.abs(y-sy)>1;
  ctx.save();ctx.setTransform(v.dpr,0,0,v.dpr,0,0);
  ctx.fillStyle='#f4ecd8';ctx.strokeStyle='#1f6f9c';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#1f6f9c';ctx.translate(x,y);
  if(fuera) {ctx.rotate(Math.atan2(sy-y,sx-x));ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-5,-6);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();}
  else {ctx.font='bold 19px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',0,1);}
  ctx.restore();
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
    if (c === 'A' || c === 'a') { ctx.fillStyle = 'rgba(20,12,6,.09)'; ctx.fillRect(px, fy + alto - Math.min(4, alto), TW, Math.min(4, alto)); }
  }

  switch (c) {
    case '~': case 'r': dibujarAgua(ctx, m, x, y, px, py); break;
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
  pintarSueloPlaza(ctx, m, x, y, px, py);
  // Sombras de contacto en el piso receptor, sin juntas oscuras en cada casilla.
  if (!ES_PARED(c) && c !== '~' && c !== 'r') {
    const norte = y > 0 ? alturaVisual(m.celdas[y-1][x]) : h;
    const oeste = x > 0 ? alturaVisual(m.celdas[y][x-1]) : h;
    ctx.fillStyle = 'rgba(59,43,29,.14)';
    if (norte > h) ctx.fillRect(px,py,TW,5);
    if (oeste > h) ctx.fillRect(px,py,4,TH);
    ctx.fillStyle = 'rgba(244,236,216,.48)';
    if ((c==='a'||c==='A') && hs<h) ctx.fillRect(px,py+TH-1,TW,1);
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
  ctx.fillStyle = 'rgba(20,12,6,.09)'; ctx.fillRect(px, fy + alto - Math.min(5, alto), TW, Math.min(5, alto));
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
const R_ORILLA = 18;   // radio de las esquinas de agua contra la tierra
function dibujarAgua(ctx, m, x, y, px, py) {
  const esTierra = (cx, cy) => cx >= 0 && cy >= 0 && cx < m.cols && cy < m.rows && m.celdas[cy][cx] !== '~' && m.celdas[cy][cx] !== 'r';
  const N = esTierra(x, y - 1), O = esTierra(x - 1, y), E = esTierra(x + 1, y), S = esTierra(x, y + 1);
  const boca = m.celdas[y][x] === 'r';
  const quieto = reducirMovimiento();
  if (boca || !(N || O || E || S)) {
    recorte(ctx, 'mar', (x * TW) % 176, (y * TH) % 108, TW, TH, px, py, 1);
    if (boca && (N || O || E)) orillaRecta(ctx, m, px, py, N, O, E);
    olasAgua(ctx, m, x, y, px, py);
    return;
  }
  // Esquinas redondeadas donde el agua tiene tierra en dos lados contiguos
  const rNO = N && O ? R_ORILLA : 0, rNE = N && E ? R_ORILLA : 0, rSE = S && E ? R_ORILLA : 0, rSO = S && O ? R_ORILLA : 0;
  if (rNO || rNE || rSE || rSO) losas(ctx, 'suelo', 4, x, y, px, py);   // el suelo que asoma en la esquina
  const x0 = px, y0 = py, x1 = px + TW, y1 = py + TH;
  ctx.save();
  ctx.beginPath();
  // Se extiende 1 px hacia el agua vecina para que no asome costura
  const ex1 = x1 + (E ? 0 : 1), ey1 = y1 + (S ? 0 : 1);
  ctx.moveTo(x0 + rNO, y0); ctx.lineTo(ex1 - rNE, y0);
  if (rNE) ctx.arc(x1 - rNE, y0 + rNE, rNE, -Math.PI / 2, 0); else ctx.lineTo(ex1, y0);
  ctx.lineTo(ex1, ey1 - rSE);
  if (rSE) ctx.arc(x1 - rSE, y1 - rSE, rSE, 0, Math.PI / 2); else ctx.lineTo(ex1, ey1);
  ctx.lineTo(x0 + rSO, ey1);
  if (rSO) ctx.arc(x0 + rSO, y1 - rSO, rSO, Math.PI / 2, Math.PI); else ctx.lineTo(x0, ey1);
  ctx.lineTo(x0, y0 + rNO);
  if (rNO) ctx.arc(x0 + rNO, y0 + rNO, rNO, Math.PI, Math.PI * 1.5); else ctx.lineTo(x0, y0);
  ctx.closePath(); ctx.clip();
  recorte(ctx, 'mar', (x * TW) % 176, (y * TH) % 108, TW, TH, px, py, 1);

  // Trazado de la orilla a una distancia `d` hacia adentro: tramos rectos (con leve ondulado) y arcos en las esquinas
  const tramos = (d, onda) => {
    const amp = quieto ? 0 : onda, f = s => Math.sin(m.t * 1.5 + s * 0.07) * amp;
    const rec = (ax, ay, bx, by, h) => {   // h: tramo horizontal; el ondulado depende de la coordenada del mundo
      const n = Math.max(1, Math.ceil(Math.abs(h ? bx - ax : by - ay) / 6));
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const u = i / n, cx = ax + (bx - ax) * u, cy = ay + (by - ay) * u;
        const o = f(h ? cx : cy) * Math.min(1, Math.min(i, n - i) * 0.6);
        const qx = h ? cx : cx + o * (ax > x0 + TW / 2 ? -1 : 1), qy = h ? cy + o * (ay > y0 + TH / 2 ? -1 : 1) : cy;
        if (i) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy);
      }
      ctx.stroke();
    };
    const arco = (cx, cy, r, a0, a1) => { ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, r - d), a0, a1); ctx.stroke(); };
    if (N) rec(x0 + rNO, y0 + d, x1 - rNE, y0 + d, true);
    if (rNE) arco(x1 - rNE, y0 + rNE, rNE, -Math.PI / 2, 0);
    if (E) rec(x1 - d, y0 + rNE, x1 - d, y1 - rSE, false);
    if (rSE) arco(x1 - rSE, y1 - rSE, rSE, 0, Math.PI / 2);
    if (S) rec(x1 - rSE, y1 - d, x0 + rSO, y1 - d, true);
    if (rSO) arco(x0 + rSO, y1 - rSO, rSO, Math.PI / 2, Math.PI);
    if (O) rec(x0 + d, y1 - rSO, x0 + d, y0 + rNO, false);
    if (rNO) arco(x0 + rNO, y0 + rNO, rNO, Math.PI, Math.PI * 1.5);
  };
  ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3d8cb8'; ctx.lineWidth = 20; tramos(0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.setLineDash([10, 6]); ctx.lineDashOffset = quieto ? 0 : -m.t * 4;
  tramos(5, 1.3);
  ctx.setLineDash([]);
  olasAgua(ctx, m, x, y, px, py);
  ctx.restore();
}
// Orilla recta (solo la boca baja, que no cambia)
function orillaRecta(ctx, m, px, py, N, O, E) {
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
function olasAgua(ctx, m, x, y, px, py) {
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

// Barca navegable: casco abierto sin mástil y remo claro, distintos del adorno del puerto.
function dibujarBarcaRemo(ctx, b) {
  const cx = b.x * TW, cy = b.y * TH, k = 1.25 * TW / 96;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  pintar(ctx, 'barca-remo', 0, 0);
  ctx.restore();
}
// Techo de roca de la boca baja: translúcido, para ver lo que pasa por abajo.
function dibujarTechoBoca(ctx, x, y) {
  const px = x * TW, py = y * TH - 1.3 * LH;
  ctx.save(); ctx.globalAlpha = 0.55;
  pintar(ctx, 'boca-baja', px, py);
  ctx.restore();
}
// Respaldo para un personaje cuyo sprite todavía no esté declarado.
function dibujarMarcador(ctx, p, o) {
  const { x, y, fx, escala } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(escala * (fx < 0 ? -1 : 1), escala);
  ctx.lineWidth = 2; ctx.strokeStyle = COL.tinta; ctx.lineJoin = 'round';
  ctx.fillStyle = p.color; ctx.beginPath(); ctx.rect(-8, -27, 16, 27); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.arc(0, -33, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e6b866'; ctx.beginPath(); ctx.moveTo(-7, -37); ctx.lineTo(0, -50); ctx.lineTo(7, -37); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Interlocutor: figura propia si tiene sprite (npc-<id>), si no un marcador con su color y la inicial.
// Si se le puede hablar, un globo de diálogo flota arriba.
function dibujarInterlocutor(ctx, m, q) {
  const gx = q.x * TW, gy = q.y * TH - Math.max(m.suelo(q.x, q.y), 0) * LH;
  ctx.fillStyle = 'rgba(20,10,30,.42)';
  ctx.beginPath(); ctx.ellipse(gx, gy, 12, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  const sp = SPRITES['npc-' + q.id], img = sp && imagenes['npc-' + q.id];
  if (img) {
    ctx.drawImage(img, gx + sp[0], gy + sp[1], sp[2], sp[3]);
    if (m.interlocutorCercano() === q) dibujarGlobo(ctx, m, gx, gy - 66);
    return;
  }
  dibujarMarcador(ctx, { color: q.color || '#5f7a3a' }, { x: gx, y: gy, fx: 1, escala: 1 });
  ctx.save(); ctx.translate(gx, gy);
  ctx.font = 'bold 15px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.cal; ctx.fillText((q.nombre || '?').slice(0, 1).toUpperCase(), 0, -14);
  ctx.restore();
  if (m.interlocutorCercano() === q) dibujarGlobo(ctx, m, gx, gy - 68);
}

// Globo de diálogo sobre quien se puede usar o con quien se puede hablar.
function dibujarGlobo(ctx, m, gx, by0) {
  const salto = reducirMovimiento() ? 0 : Math.sin(m.t * 4) * 2.5, by = by0 + salto;
  ctx.save(); ctx.translate(gx, by);
  ctx.lineWidth = 2; ctx.strokeStyle = COL.tinta; ctx.lineJoin = 'round'; ctx.fillStyle = COL.cal;
  ctx.beginPath();
  ctx.moveTo(-14, -9); ctx.lineTo(14, -9); ctx.quadraticCurveTo(18, -9, 18, -5); ctx.lineTo(18, 5);
  ctx.quadraticCurveTo(18, 9, 14, 9); ctx.lineTo(-1, 9); ctx.lineTo(-6, 15); ctx.lineTo(-6, 9); ctx.lineTo(-14, 9);
  ctx.quadraticCurveTo(-18, 9, -18, 5); ctx.lineTo(-18, -5); ctx.quadraticCurveTo(-18, -9, -14, -9); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.oxido;
  for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(dx, 0, 2.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// Objetos interactivos sin sprite: la fuente de las Musas (seca hasta usarla, luego con chorro) y las cenizas (con un brillo
// que se apaga al usarlas). Nunca desaparecen.
function dibujarInteractivo(ctx, m, q) {
  const gx = q.x * TW, gy = q.y * TH - Math.max(m.suelo(q.x, q.y), 0) * LH, quieto = reducirMovimiento();
  ctx.save(); ctx.translate(gx, gy);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  sombraContacto(ctx, 0, 0, 34, 0.75);
  const trazo = (relleno, fino = false) => { ctx.fillStyle = relleno; ctx.fill(); ctx.strokeStyle = COL.tinta; ctx.lineWidth = fino ? 0.9 : 1.6; ctx.stroke(); };
  const elipse = (cx, cy, rx, ry) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); };
  if (q.tipo === 'fuente') {
    // pila de piedra: cuerpo, borde (elipse a 0,45), agua adentro y columna con chorro
    ctx.beginPath(); ctx.moveTo(-17, -12); ctx.lineTo(-14, 0); ctx.quadraticCurveTo(0, 4, 14, 0); ctx.lineTo(17, -12); ctx.closePath(); trazo(COL.calSombra);
    ctx.fillStyle = '#a89774'; ctx.beginPath(); ctx.moveTo(10.5, -11); ctx.lineTo(9, -0.8); ctx.quadraticCurveTo(12, -0.6, 14, 0); ctx.lineTo(17, -12); ctx.closePath(); ctx.fill();
    elipse(0, -12, 17, 7.6); trazo(COL.cal);
    elipse(0, -12, 13, 5.7); trazo(q.usado ? COL.egeo : COL.linoSombra, true);
    ctx.beginPath(); ctx.roundRect(-3, -30, 6, 19, 2); trazo(COL.cal);
    ctx.fillStyle = COL.calSombra; ctx.fillRect(0.6, -29, 2.2, 17);
    if (q.usado) {
      const f = quieto ? 0 : m.t * 3;
      ctx.strokeStyle = COL.espuma; ctx.lineWidth = 3;
      for (const [dx, k] of [[-1, 0], [0, 0.5], [1, 0.25]]) {
        const a = quieto ? 0.7 : 0.5 + 0.35 * Math.sin(f + k * 6);
        ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(0, -33); ctx.quadraticCurveTo(dx * 13, -46, dx * 18, -14); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COL.espuma; ctx.lineWidth = 0.9; elipse(0, -12, 9, 3.8); ctx.stroke();
    } else {
      // una gota de brillo marca que se puede usar
      const b = quieto ? 0.8 : 0.55 + 0.35 * Math.sin(m.t * 3);
      ctx.globalAlpha = b; ctx.fillStyle = COL.oro; ctx.beginPath(); ctx.arc(0, -38, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
  } else {
    // montículo de cenizas con brasas: base en elipse a 0,45, tres tonos con luz a la izquierda
    elipse(0, -3, 17, 7.6); trazo('#7d726a');
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.quadraticCurveTo(-6, -22, 0, -20); ctx.quadraticCurveTo(7, -22, 12, -5); ctx.closePath(); trazo('#a69a8f');
    ctx.fillStyle = '#8c8078'; ctx.beginPath(); ctx.moveTo(3, -19); ctx.quadraticCurveTo(9, -16, 11.4, -5.6); ctx.lineTo(6, -5); ctx.quadraticCurveTo(7, -13, 3, -19); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5f554e'; for (const [dx, dy] of [[-6, -8], [3, -11], [7, -6]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.8, 0, Math.PI * 2); ctx.fill(); }
    if (!q.usado) {
      const b = quieto ? 0.85 : 0.6 + 0.4 * Math.sin(m.t * 4);
      ctx.globalAlpha = b; ctx.fillStyle = '#e8892a'; ctx.beginPath(); ctx.arc(-2, -13, 3.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COL.oro; ctx.beginPath(); ctx.arc(-2, -13, 1.7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    } else {
      ctx.beginPath(); ctx.moveTo(-4, -19); ctx.lineTo(0, -29); ctx.lineTo(4, -19); ctx.closePath(); trazo('#e6b866');
    }
  }
  ctx.restore();
  if (m.cercano() === q && !q.usado) dibujarGlobo(ctx, m, gx, gy - 56);
}

// Banco del taller de Dédalo: tablero en tres cuartos (20 de alto, 64 de ancho), con plumas ordenadas de menor a mayor,
// un cuenco de cera y un ovillo de hilo, todo a escala de la mesa.
function dibujarBanco(ctx, m, q) {
  const gx = q.banco[0] * TW, gy = q.banco[1] * TH - Math.max(m.suelo(q.banco[0], q.banco[1]), 0) * LH;
  ctx.save(); ctx.translate(gx, gy);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  sombraContacto(ctx, 0, 0, 64, 0.6);
  const trazo = (relleno, fino = false) => { ctx.fillStyle = relleno; ctx.fill(); ctx.strokeStyle = COL.tinta; ctx.lineWidth = fino ? 0.9 : 1.6; ctx.stroke(); };
  const elipse = (cx, cy, rx, ry, giro = 0) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, giro, 0, Math.PI * 2); };
  // patas, frente del tablero y tablero (tapa a la vista)
  for (const dx of [-29, 24]) { ctx.beginPath(); ctx.roundRect(dx, -7, 5, 7, 1.5); trazo(COL.linoSombra); }
  ctx.beginPath(); ctx.roundRect(-32, -12, 64, 6, 2); trazo(COL.lino);
  ctx.fillStyle = COL.linoSombra; ctx.fillRect(22, -11, 9, 4.4);
  ctx.beginPath(); ctx.roundRect(-32, -20, 64, 9.5, 3); trazo('#d9bd86');
  ctx.strokeStyle = '#b8955a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-28, -13.5); ctx.lineTo(28, -13.5); ctx.stroke();
  // plumas apoyadas sobre el tablero, de menor a mayor
  for (let i = 0; i < 6; i++) {
    elipse(-26 + i * 5.2, -15.4, 3 + i * 0.8, 1.5, -0.12); trazo(i % 2 ? '#fffaf0' : COL.cal, true);
  }
  // cuenco de cera
  ctx.beginPath(); ctx.moveTo(9, -17); ctx.lineTo(10.5, -13.5); ctx.quadraticCurveTo(15, -11.5, 19.5, -13.5); ctx.lineTo(21, -17); ctx.closePath(); trazo(COL.ocre, true);
  elipse(15, -17, 6, 2.7); trazo(COL.ocre, true);
  elipse(15, -17.2, 4.2, 1.8); ctx.fillStyle = '#f2d98a'; ctx.fill();
  // ovillo
  ctx.beginPath(); ctx.arc(27, -19, 4.6, 0, Math.PI * 2); trazo(COL.oxido);
  ctx.strokeStyle = COL.oxidoOscuro; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(27, -19, 2.4, 0.6, 3.8); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(25.4, -20.6, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------- Objetos y personajes ----------
function dibujarItem(ctx, m, it, personajes) {
  if (it.tipo === 'ambiente') dibujarAmbiente(ctx, m, it.e);
  else if (it.tipo === 'apertura') dibujarApertura(ctx, m, it.q);
  else if (it.tipo === 'empujable') dibujarEmpujable(ctx, it.e);
  else if (it.tipo === 'brasero') dibujarBrasero(ctx, m, it.b);
  else if (it.tipo === 'fuente') dibujarFuente(ctx, m, it.f);
  else if (it.tipo === 'barca') dibujarBarca(ctx, m, it.b);
  else if (it.tipo === 'barcaRemo') dibujarBarcaRemo(ctx, it.b);
  else if (it.tipo === 'interlocutor') dibujarInterlocutor(ctx, m, it.q);
  else if (it.tipo === 'interactivo') dibujarInteractivo(ctx, m, it.q);
  else if (it.tipo === 'banco') dibujarBanco(ctx, m, it.q);
  else if (it.tipo === 'soga') dibujarSoga(ctx, it.s);
  else if (it.tipo === 'argolla') dibujarArgolla(ctx, it.s, it.p);
  else if (it.tipo === 'objeto') dibujarObjeto(ctx, m, it.c);
  else dibujarJugador(ctx, m, personajes, true);
}

function dibujarAmbiente(ctx, m, e) {
  const mov = movimientoAmbiente(e, m.t, reducirMovimiento()), s = ras['ambiente-' + e.tipo];
  if (!s) return;
  const x=e.x*TW, y=e.y*TH-e.z*LH;
  const cerca = Math.hypot(m.jugador.x-e.x,m.jugador.y-e.y) < 1.3;
  ctx.save();
  // Si el personaje está detrás de un árbol, se conserva la lectura de su posición.
  ctx.globalAlpha = cerca && ['olivo','laurel','fresco','redes'].includes(e.tipo) ? .48 : 1;
  sombraContacto(ctx,x,y,s.w*.8,.6);
  ctx.translate(x+mov.dx,y+mov.dy); ctx.rotate(mov.giro); ctx.scale(.8*mov.escala,.8*mov.escala);
  pintar(ctx,'ambiente-'+e.tipo,0,0); ctx.restore();
}

function dibujarApertura(ctx,m,q) {
  const t=Math.max(0,Math.min(1,(m.t-q.inicio)/.5)), x=q.x*TW, y=q.y*TH;
  // La reja se eleva visualmente; al subir pierde opacidad para no tapar el paso ya libre.
  ctx.save(); ctx.globalAlpha=(1-t)*.85;
  ctx.beginPath(); ctx.rect(x,y-90,TW,TH+90); ctx.clip();
  pintar(ctx,q.c==='G'?'reja-cerrada':q.c==='D'?'puerta-sol':'puerta-sonido',x,y-54-t*38);
  ctx.restore();
}

function dibujarEmpujable(ctx, e) {
  const sx = e.px * TW, sy = e.py * TH;   // los empujables viven en el suelo
  if (e.tipo === 'bloque') sombraContacto(ctx, sx + TW / 2, sy + TH - 3, 34, 1.1); else sombraContacto(ctx, sx + TW / 2, sy + TH - 4, 22);
  if (e.tipo === 'bloque') pintar(ctx, 'bloque', sx + TW / 2, sy + TH - 4);
  else pintar(ctx, 'vasija', sx + TW / 2, sy + TH - 5);
}

function dibujarBrasero(ctx, m, b) {
  const cx = b.x * TW + TW / 2, by = b.y * TH + TH - 6 - b.zBase * LH;
  sombraContacto(ctx, cx, by + 1, 34, 0.75);
  if (b.encendido) {
    ctx.fillStyle = 'rgba(255,243,200,.12)'; ctx.beginPath(); ctx.arc(cx, by - 28, 34, 0, Math.PI * 2); ctx.fill();
  }
  pintar(ctx, b.encendido ? 'brasero-encendido' : 'brasero-apagado', cx, by);
  if (b.encendido) {
    // la llama titila
    const f = reducirMovimiento() ? 1 : 1 + Math.sin(m.t * 9 + b.x) * 0.05 + Math.sin(m.t * 13) * 0.025;
    ctx.save(); ctx.translate(cx + (reducirMovimiento() ? 0 : Math.sin(m.t * 7 + b.y) * 0.6), by - 26); ctx.scale(1 + (1 - f) * 0.5, f);
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
  sombraContacto(ctx, cx, by + 1, 34, 0.75);
  const vib = f.activa && !reducirMovimiento() ? Math.sin(m.t * 30) * .7 : 0;
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
  sombraContacto(ctx, cx, cy + 6, 24, 0.9);
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
const OBJETOS = ['ancla-piedra', 'tablero-juego', 'fresco-delfines', 'riton-toro', 'tablilla-arcilla', 'hacha-doble', 'figura-serpientes', 'frasco-pulpo', 'sello-barco'];
export const tieneSpriteObjeto = id => OBJETOS.includes(id);
const spriteObjeto = id => OBJETOS.includes(id) ? id : 'coleccionable';

export function dibujarObjeto(ctx, m, c) {
  const gx = c.x * TW, gy = c.y * TH - c.zBase * LH;
  const bob = reducirMovimiento() ? 0 : Math.sin(m.t * 2.6 + c.x) * 0.07;
  const sy = gy - (0.7 + bob) * LH;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(gx, gy, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  const pulso = reducirMovimiento() ? 1 : 1 + Math.sin(m.t * 4 + c.x) * 0.04;
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
  const bob = reducirMovimiento() ? 0 : Math.sin(m.t * 2.6 + c.x) * 0.07;
  const sl = silueta(spriteObjeto(c.id));
  if (sl) ctx.drawImage(sl.c, gx + sl.ox, gy - (0.7 + bob) * LH + sl.oy, sl.w, sl.h);
}

function dibujarJugador(ctx, m, personajes, conSombra) {
  const j = m.jugador;
  let apoyo = apoyos.get(m);
  if (!apoyo) { apoyo = { enSuelo: j.enSuelo, aterriza: -10 }; apoyos.set(m, apoyo); }
  if (j.enSuelo && !apoyo.enSuelo) apoyo.aterriza = m.t;
  apoyo.enSuelo = j.enSuelo;
  const edadApoyo = m.t - apoyo.aterriza;
  const asentamiento = !reducirMovimiento() && edadApoyo < .18 ? Math.sin(edadApoyo / .18 * Math.PI) * .065 : 0;
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
    asentamiento, empujando: j.esfuerzo > 0,
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
  fenix: [-18, -51, 36, 52], eco: [-18, -51, 36, 52], ulises: [-18, -51, 36, 52],
  // Interlocutores del puerto (de frente, sin animación)
  'npc-teseo': [-18, -51, 36, 52], 'npc-dedalo': [-18, -51, 36, 52], 'npc-narciso': [-18, -51, 36, 52], 'npc-nausicaa': [-18, -51, 36, 52],
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
  bloque: [-18, -40], vasija: [-16, -36], 'brasero-apagado': [-20, -36], 'brasero-encendido': [-20, -36], llama: [-10, -38],
  'fuente-caracola': [-22, -40], 'fuente-cimbalo': [-20, -36], argolla: [-14, -30], 'argolla-viva': [-14, -32],
  coleccionable: [-22, -22], barca: [-52, -32], 'barca-remo': [-48, -28], brillo: [-26, -26],
  ...Object.fromEntries(OBJETOS.map(id => [id, [-22, -22]])),
};
const ESCENARIO = [
  ...[0, 1, 2, 3].flatMap(i => [`losa-suelo-${i}`, `sillar-${i}`, `sillar-claro-${i}`, `tope-${i}`]),
  ...[0, 1, 2].flatMap(i => [`losa-terraza-${i}`, `losa-techo-${i}`]),
  'baldosa-0', 'baldosa-1', 'tope-claro-0', 'tope-claro-1', 'cara-terraza', 'cara-techo-0', 'cara-techo-1', 'mar',
  'placa', 'placa-activa', 'reja-cerrada', 'grieta', 'puerta-sol', 'puerta-sonido', 'escombros', 'umbral-reja', 'umbral-sol',
  'bloque', 'vasija', 'brasero-apagado', 'brasero-encendido', 'llama', 'fuente-caracola', 'fuente-cimbalo',
  'argolla', 'argolla-viva', 'coleccionable', 'barca', 'barca-remo', 'boca-baja',
  ...OBJETOS, 'brillo',
];
// Las poses comparten el mismo encuadre: el origen del pie no salta entre cuadros.
for (const id of ['pegaso','minotauro','ariadna','fenix','eco','ulises']) {
  for (const v of ['', '-frente', '-espalda']) {
    if (v) SPRITES[id+v]=SPRITES[id];
    for (const paso of [1,2]) SPRITES[id+v+'-paso-'+paso]=SPRITES[id];
  }
  if (['pegaso','fenix'].includes(id)) for (const v of ['frente','espalda']) SPRITES[id+'-'+v+'-vuelo']=SPRITES[id];
  else SPRITES[id+'-costado']=SPRITES[id];
}
for (const id of TIPOS_AMBIENTE) { ESCENARIO.push('ambiente-'+id); ORIGEN['ambiente-'+id]=ORIGEN_AMBIENTE[id]; }
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
    img.onerror = () => { fallidos.push(id); terminado(); };   // si uno falla, ese personaje no se dibuja pero el juego sigue
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
    img.src = n.startsWith('ambiente-') ? `sprites/ambiente/${n.slice(9)}.svg` : `sprites/${OBJETOS.includes(n) || n === 'brillo' ? 'coleccionables' : 'escenario'}/${n}.svg`;
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

// Llama a `f` cuando todos los sprites (seis cuerpos, cuatro alas y escenario) terminaron de cargar (enseguida si ya terminaron).
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
  if (!SPRITES[p.id]) { dibujarMarcador(ctx, p, o); return; }
  const { x, y, fx, caminando, escala, paso } = o;
  const reducir = reducirMovimiento(), pose = posePersonaje(p.id,o,reducir);
  const img = spritesListos && (imagenes[pose.nombre] || imagenes[p.id]);
  if (!img) return;
  const [sx,sy,sw,sh]=SPRITES[p.id], t=o.t||0;
  const bob = reducir ? 0 : caminando ? Math.abs(Math.sin((paso||0)*5))*.7 : Math.sin(t*1.7)*.3;
  const alas=ALAS[p.id], separar=alas && (pose.vista==='costado'||o.volando);
  let ang=0;
  if(alas) ang=reducir?alas.media:o.volando?alas.abajo+(alas.arriba-alas.abajo)*(Math.sin(t*16)+1)/2:alas.media+Math.sin(t*1.8)*5;
  const ala=(nombre,art,grados,espejo=false)=>{
    const im=imagenes[p.id+nombre]; if(!im)return;
    const [ax,ay,aw,ah]=SPRITES[p.id+nombre];
    ctx.save();ctx.translate(art[0],art[1]-bob);if(espejo)ctx.scale(-1,1);ctx.rotate(grados*Math.PI/180);ctx.drawImage(im,ax,ay,aw,ah);ctx.restore();
  };
  ctx.save();ctx.translate(x,y);ctx.scale(escala,escala);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if (!reducir && o.asentamiento) ctx.scale(1+o.asentamiento,1-o.asentamiento);
  if(pose.espejo)ctx.scale(-1,1);
  if(o.embistiendo&&!reducir)ctx.rotate((fx<0?1:-1)*.1);
  else if(o.empujando&&!reducir)ctx.rotate((fx<0?1:-1)*.045);
  if(separar&&pose.vista==='costado')ala('-ala-lejos',alas.lejos,ang-alas.desfase);
  if(separar&&pose.vista!=='costado') { ala('-ala-lejos',[-6,-25],ang,true); ala('-ala-cerca',[6,-25],ang); }
  ctx.drawImage(img,sx,sy-bob,sw,sh);
  if(separar&&pose.vista==='costado')ala('-ala-cerca',alas.cerca,ang);
  if(o.embistiendo) {
    ctx.strokeStyle=COL.cal;ctx.lineWidth=2;ctx.lineCap='round';
    for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(-17,-12-n*9);ctx.lineTo(-29,-12-n*9);ctx.stroke();}
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
