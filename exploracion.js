// Orientación opcional. Los lugares se deducen del progreso existente, sin guardar datos nuevos.
const seleccion = new WeakMap();
const rutas = new WeakMap();
const objetoPendiente = (m, id) => m.coleccionables.some(o => o.id === id && !o.recogido);

export function lugaresPlaza(m) {
  if (m.id !== 'mundo' || m.jugador.y < 40 || m.jugador.y >= 74) return [];
  const cerrado = (x, y, letra) => m.celdas[y]?.[x] === letra;
  return [
    { id: 'toro', nombre: 'Patio del toro', pista: 'Buscá una entrada con grietas.',
      x: 5.5, y: cerrado(5,62,'M') ? 63.8 : 58.5, pendiente: objetoPendiente(m,'riton-toro') },
    { id: 'terrazas', nombre: 'Terrazas del jardín', pista: 'Observá las argollas y las distintas alturas.',
      x: 14.5, y: 63.6, pendiente: m.sogas.some(s => s.a[1] === 63 && !s.tendida) },
    { id: 'sol', nombre: 'Patio del sol', pista: 'Hay dos braseros delante de una puerta.',
      x: 5.5, y: cerrado(5,48,'D') ? 51.5 : 44.5, pendiente: objetoPendiente(m,'tablero-juego') },
    { id: 'sonido', nombre: 'Galería del sonido', pista: 'La entrada tiene un símbolo de sonido.',
      x: 16.5, y: cerrado(16,48,'O') ? 49.8 : 44.5, pendiente: objetoPendiente(m,'fresco-delfines') },
  ].map(l => ({ ...l, distancia: Math.hypot(l.x-m.jugador.x,l.y-m.jugador.y) }));
}

export function elegirLugar(m, id) { seleccion.set(m,id); rutas.delete(m); }

// Busca el próximo tramo caminable. Una guía nunca pide atravesar una pared.
function proximoTramo(m, lugar) {
  const j=m.jugador, sx=Math.floor(j.x), sy=Math.floor(j.y), tx=Math.floor(lugar.x), ty=Math.floor(lugar.y);
  const clave=[sx,sy,tx,ty,m.celdas[48]?.[5],m.celdas[48]?.[16],m.celdas[62]?.[5]].join(',');
  const guardada=rutas.get(m); if(guardada?.clave===clave)return guardada.punto;
  const cola=[[sx,sy]], padres=new Map([[sx+','+sy,null]]);
  let fin=null;
  for(let i=0;i<cola.length;i++) {
    const [x,y]=cola[i]; if(x===tx&&y===ty){fin=[x,y];break;}
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const nx=x+dx,ny=y+dy,k=nx+','+ny,c=m.celdas[ny]?.[nx];
      if(ny<40||ny>=74||!['.',',','p'].includes(c)||padres.has(k))continue;
      padres.set(k,[x,y]);cola.push([nx,ny]);
    }
  }
  let punto={x:lugar.x,y:lugar.y};
  if(fin) {
    const camino=[]; let p=fin;
    while(p){camino.push(p);p=padres.get(p.join(','));}camino.reverse();
    if(camino.length>3){const [x,y]=camino[Math.min(3,camino.length-1)];punto={x:x+.5,y:y+.5};}
  }
  rutas.set(m,{clave,punto});return punto;
}

export function objetivoCercano(m) {
  const pendientes=lugaresPlaza(m).filter(l=>l.pendiente);
  if(!pendientes.length)return null;
  const elegido=pendientes.find(l=>l.id===seleccion.get(m)) || pendientes.sort((a,b)=>a.distancia-b.distancia)[0];
  // Conserva el destino al caminar: no cambia de pista al pasar cerca de otro lugar.
  seleccion.set(m,elegido.id);
  const tramo=proximoTramo(m,elegido),dx=tramo.x-m.jugador.x,dy=tramo.y-m.jugador.y;
  const direccion=Math.abs(dx)>Math.abs(dy) ? (dx>0?'hacia la derecha':'hacia la izquierda') : (dy>0?'hacia abajo':'hacia arriba');
  return {...elegido,tramo,direccion,cerca:elegido.distancia<2};
}
