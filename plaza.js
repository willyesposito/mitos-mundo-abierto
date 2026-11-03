// Pavimento y parterres: solo presentacion, sin cambiar donde se puede caminar.
const TW=44,TH=36,ANCHO=24*TW,ALTO=34*TH;
let superficie;
const azar=(a,b,s=0)=>{
  let n=(Math.imul(a+97,73856093)^Math.imul(b+53,19349663)^Math.imul(s+11,83492791))>>>0;
  n=Math.imul(n^(n>>>13),1274126177)>>>0;return ((n^(n>>>16))>>>0)/4294967296;
};
const punto=(x,y)=>[x*TW,(y-40)*TH];
function lienzo(){const c=document.createElement('canvas');c.width=ANCHO;c.height=ALTO;return c;}

function jardin(ctx,x,y,rx,ry,semilla){
  const [px,py]=punto(x,y),borde=new Path2D();
  const puntos=Array.from({length:20},(_,i)=>{
    const a=i*Math.PI/10,r=.95+azar(i,semilla)*.1;
    return [px+Math.cos(a)*rx*TW*r,py+Math.sin(a)*ry*TH*r];
  });
  const p0=puntos[0],pn=puntos.at(-1);
  borde.moveTo((p0[0]+pn[0])/2,(p0[1]+pn[1])/2);
  for(let i=0;i<puntos.length;i++){
    const p=puntos[i],q=puntos[(i+1)%puntos.length];
    borde.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);
  }
  borde.closePath();ctx.save();ctx.fillStyle='#aa936c';ctx.fill(borde);
  ctx.strokeStyle='#bba47b';ctx.lineWidth=8;ctx.stroke(borde);
  ctx.strokeStyle='#e0cd9f';ctx.lineWidth=3.5;ctx.stroke(borde);ctx.clip(borde);
  // Tierra moteada y plantas bajas junto a la vegetacion que ya vive en el mapa.
  for(let i=0;i<110;i++){
    const xx=px+(azar(i,semilla,1)*2-1)*rx*TW,yy=py+(azar(i,semilla,2)*2-1)*ry*TH;
    ctx.fillStyle=i%3?'#b6a077':'#958362';ctx.beginPath();
    ctx.ellipse(xx,yy,1+azar(i,semilla,3)*2,.7,-.3,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<14;i++){
    const a=i*2.399+semilla,r=.35+azar(i,semilla,4)*.46;
    const xx=px+Math.cos(a)*rx*TW*r,yy=py+Math.sin(a)*ry*TH*r;
    ctx.fillStyle=i%3?'#858866':'#959474';
    for(const lado of [-1,1]){ctx.beginPath();ctx.ellipse(xx+lado*2,yy-1,2.8,1.4,lado*-.7,0,Math.PI*2);ctx.fill();}
    if(i%5===0){ctx.fillStyle='#cebea0';ctx.beginPath();ctx.ellipse(xx+4,yy+2,3,1.6,.2,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();ctx.strokeStyle='#a99470';ctx.lineWidth=1;
  for(let i=0;i<puntos.length;i+=2){
    const p=puntos[i],dx=p[0]-px,dy=p[1]-py,l=Math.hypot(dx,dy);
    ctx.beginPath();ctx.moveTo(p[0]-dx/l*3,p[1]-dy/l*3);ctx.lineTo(p[0]+dx/l*3,p[1]+dy/l*3);ctx.stroke();
  }
}

function crearSuperficie(){
  const c=lienzo(),ctx=c.getContext('2d');
  jardin(ctx,3.9,68.8,2.7,1.7,1);jardin(ctx,19.8,68.8,1.9,1.45,2);
  jardin(ctx,3.3,53.7,2,1.15,3);jardin(ctx,19.6,52.5,2.35,1.5,4);
  const rutas=[];
  const ruta=(inicio,curvas)=>{
    const p=new Path2D();p.moveTo(...punto(...inicio));
    for(const q of curvas)p.bezierCurveTo(...punto(q[0],q[1]),...punto(q[2],q[3]),...punto(q[4],q[5]));
    rutas.push(p);
  };
  ruta([11.5,75],[
    [11.5,71.5,9.4,70,10.2,68.2],[10.8,66.8,11.6,66.3,11.6,64.4],
    [11.6,61.5,10.8,58.4,11.4,55.4],[12,52.3,10.9,49.5,11.5,45],
    [11.7,42.2,11.5,40.4,11.5,39],
  ]);
  ruta([11.6,64.4],[[9.5,64.7,7.9,63.5,5.5,63.5]]);
  ruta([11.6,64.4],[[12.7,65.3,13.8,65.1,14.5,63.5]]);
  ruta([11.6,54],[[9.8,54.5,8.5,53.4,7.2,52.2],[6.2,51.4,5.5,50.8,5.5,49.1]]);
  ruta([11.2,50],[[13.1,50.7,15.3,50.7,16.5,49.3]]);
  const mascara=lienzo(),mc=mascara.getContext('2d');
  const trazar=(d,color,ancho)=>{
    d.lineCap='round';d.lineJoin='round';d.lineWidth=ancho;d.strokeStyle=color;
    for(const p of rutas)d.stroke(p);
  };
  trazar(mc,'#fff',58);
  // TODOS los bordes primero; despues el interior de TODAS las ramas cubre sus cruces.
  trazar(ctx,'#c2ad83',64);trazar(ctx,'#e1d2ac',60);trazar(ctx,'#d2c2a0',58);
  const piedras=lienzo(),pc=piedras.getContext('2d');
  pc.fillStyle='#cabb9a';pc.fillRect(0,0,ANCHO,ALTO);
  const tonos=['#dfd2b2','#e4d8ba','#ded0ae','#e7dbbe','#d9ccab'];
  // Pequenas losas trabadas, con variacion moderada; sin luces ni relieve nuevo.
  for(let fila=-1;fila<ALTO/15+1;fila++)for(let col=-1;col<ANCHO/25+1;col++){
    const xx=col*25+(fila%2?12:0),yy=fila*15,a=azar(col,fila,2)*3,b=azar(col,fila,3)*3;
    pc.fillStyle=tonos[Math.floor(azar(col,fila,4)*tonos.length)];
    pc.beginPath();pc.moveTo(xx+2+a,yy+1.4);pc.lineTo(xx+21,yy+1+b);pc.lineTo(xx+24,yy+4);
    pc.lineTo(xx+23-b,yy+13);pc.lineTo(xx+4,yy+14-a);pc.lineTo(xx+1,yy+10);pc.closePath();pc.fill();
    pc.strokeStyle='#c7b893';pc.lineWidth=.7;pc.stroke();
    if(azar(col,fila,8)>.65){pc.fillStyle='#cebf9e';pc.fillRect(xx+7+a,yy+6,1.5,.7);}
  }
  pc.globalCompositeOperation='destination-in';pc.drawImage(mascara,0,0);ctx.drawImage(piedras,0,0);
  // Desgaste transparente en los accesos: evita cortar el material justo en una fila.
  // Es mezcla con el piso existente, no un degradado de iluminacion.
  const fundido=ctx.createLinearGradient(0,0,0,ALTO);
  fundido.addColorStop(0,'rgba(0,0,0,0)');fundido.addColorStop(.03,'#000');
  fundido.addColorStop(.97,'#000');fundido.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalCompositeOperation='destination-in';ctx.fillStyle=fundido;ctx.fillRect(0,0,ANCHO,ALTO);
  return c;
}

export function pintarSueloPlaza(ctx,m,x,y,px,py){
  if(m.id!=='mundo'||y<40||y>73||m.celdas[y][x]!=='.')return;
  superficie ||= crearSuperficie();
  ctx.drawImage(superficie,x*TW,(y-40)*TH,TW,TH,px,py,TW,TH);
}
