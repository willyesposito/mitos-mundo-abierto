// Una superficie continua de senderos y jardines. Las baldosas de mecanismos quedan intactas.
const TW=44,TH=36;
let superficie;
function crearSuperficie() {
  const c=document.createElement('canvas');c.width=24*TW;c.height=34*TH;
  const ctx=c.getContext('2d');
  const punto=(x,y)=>[x*TW,(y-40)*TH];
  // Bordes curvos, asimétricos y sin colisión: zonas de tierra, no nuevos obstáculos.
  for(const [x,y,rx,ry] of [[3.4,68.5,3.1,2.8],[18.8,69.4,3.4,2.1],[3.6,53.5,3.2,2.4],[19,53.4,2.7,2.2],[10.8,57,1.2,2.4]]) {
    const [px,py]=punto(x,y);ctx.fillStyle='#bca776';ctx.beginPath();
    ctx.moveTo(px-rx*TW,py);
    ctx.bezierCurveTo(px-rx*TW,py-ry*TH,px+rx*TW*.5,py-ry*TH*1.2,px+rx*TW,py-ry*TH*.2);
    ctx.bezierCurveTo(px+rx*TW*1.2,py+ry*TH,px-rx*TW*.5,py+ry*TH,px-rx*TW,py);ctx.fill();
    // Piedras y matas pequeñas de borde, en la paleta del mundo.
    for(let i=0;i<9;i++){const a=i*.73,xx=px+Math.cos(a)*rx*TW*.84,yy=py+Math.sin(a)*ry*TH*.8;
      ctx.fillStyle=i%3===0?'#8a8668':'#a28f68';ctx.beginPath();ctx.ellipse(xx,yy,4+i%3,2.5,0,0,Math.PI*2);ctx.fill();}
  }
  const sendero=(puntos,ancho)=>{
    ctx.beginPath();const [a,...resto]=puntos;ctx.moveTo(...punto(...a));
    for(let i=0;i<resto.length;i++){const p=resto[i],sig=resto[i+1]||p;ctx.quadraticCurveTo(...punto(...p),...punto((p[0]+sig[0])/2,(p[1]+sig[1])/2));}
    ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#cbb994';ctx.lineWidth=ancho+6;ctx.stroke();
    ctx.strokeStyle='#e4cf99';ctx.lineWidth=ancho;ctx.stroke();
  };
  sendero([[11.5,73.5],[11.5,70],[9.5,67],[11.7,64],[11.3,60],[11,56],[12,53],[11,49],[11.5,40.5]],58);
  sendero([[11.7,64],[9.5,64.5],[7.5,64],[5.5,63.5]],46);
  sendero([[11.7,64],[13,65],[14.5,63.5]],44);
  sendero([[11.5,53],[9,54],[7,52.5],[5.5,51.5]],46);
  sendero([[11,50],[13,50.7],[16.5,49.5]],46);
  return c;
}
export function pintarSueloPlaza(ctx,m,x,y,px,py) {
  if(m.id!=='mundo'||y<41||y>72||m.celdas[y][x]!=='.')return;
  superficie ||= crearSuperficie();
  ctx.drawImage(superficie,x*TW,(y-40)*TH,TW,TH,px,py,TW,TH);
}
