// Migración y reglas U2 con el motor real, sin DOM ni datos de usuario.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {crearMundo} from '../mundo.js';
const memoria=new Map();globalThis.localStorage={getItem:k=>memoria.get(k)||null,setItem:(k,v)=>memoria.set(k,v)};
const {migrarAlMundo,migrarAlCanal,crearPerfil}=await import('../nucleo.js');
const mapa=JSON.parse(fs.readFileSync(new URL('../datos/mapa-mundo.json',import.meta.url)));
let n=0;const ok=(v,t)=>{assert.ok(v,t);console.log('OK '+t);n++};
const serial=v=>JSON.stringify(v);
const base=()=>({mapa:'mundo',mundoUnido:true,objetos:{'ancla-piedra':true},eco:'caracola',llegada:[11.5,95.5],mundos:{mundo:{muros:['5,62','3,80'],rejas:['4,81'],braseros:['2,51','5,82'],soles:['6,83'],fuentes:['5,90'],puertas:['7,84'],sogas:['8,85'],empujables:{'9,86':[10,87]},barcas:{'11,88':[12.5,89.5]},eco:'caracola',futuro:{'1,80':[2,81]}},pruebas:{barcas:{'13,32':[27.7,32.5]}}}});
for(const y of [25.5,65.5,95.5]){
 const p=base();p.llegada=[11.5,y];const pruebas=serial(p.mundos.pruebas),futuro=serial(p.mundos.mundo.futuro);
 ok(migrarAlCanal(p,mapa),'migra llegada antigua '+y);
 ok(p.llegada[1]===(y>=74?y+14:y),'solo traslada llegada del puerto '+y);
 ok(serial(p.mundos.pruebas)===pruebas&&serial(p.mundos.mundo.futuro)===futuro,'preserva pruebas y campo futuro '+y);
 const e=p.mundos.mundo;
 ok(e.muros.join()==='5,62,3,94'&&e.fuentes[0]==='5,104'&&e.rejas[0]==='4,95'&&e.sogas[0]==='8,99','listas conocidas trasladadas sin mover plaza '+y);
 ok(serial(e.empujables)==='{"9,100":[10,101]}'&&serial(e.barcas)==='{"11,102":[12.5,103.5]}','traslada claves y posiciones de objetos libres '+y);
 ok(p.objetos['ancla-piedra']&&p.eco==='caracola','preserva objetos y sonido '+y);
 const una=serial(p);ok(!migrarAlCanal(p,mapa)&&serial(p)===una,'segunda migración no cambia nada '+y);
}
for(const id of ['puerto','plaza','palacio'])for(const llegada of [null,[10.5,15.5]]){
 const p={mapa:id,llegada,objetos:{'ancla-piedra':true},mundos:{puerto:{fuentes:['4,16']},plaza:{muros:['5,22']}}};
 const viejos=serial(p.mundos);migrarAlMundo(p,mapa.zonas);migrarAlCanal(p,mapa);
 const z=mapa.zonas.find(z=>z.id===id);
 ok(p.llegada[1]===(llegada?llegada[1]+z.dy:z.inicio[1]),'unión anterior D23 y canal sin doble traslado '+id+'/'+llegada);
 ok(p.mundos.mundo.fuentes[0]==='5,104'&&p.mundos.mundo.muros[0]==='5,62','estado preD23 conserva desplazamiento único '+id+'/'+llegada);
 ok(serial({puerto:p.mundos.puerto,plaza:p.mundos.plaza})===viejos,'respaldo mapas viejos intacto '+id+'/'+llegada);
}
for (const x of [10.1,11.5,12.9]) for (const [antes,despues] of [[73.1,72.5],[73.9,72.5],[74.1,89.5],[74.9,89.5]]) {
 const p=base();p.llegada=[x,antes];migrarAlCanal(p,mapa);
 ok(p.llegada[1]===despues,'llegada antigua en paso convertido a agua se ubica en muelle firme '+antes);
}
const nuevo=crearPerfil('Prueba');ok(nuevo.canalIncorporado&&!migrarAlCanal(nuevo,mapa),'perfil nuevo ya pertenece al mapa nuevo');
ok(mapa.filas.length===112&&mapa.filas.every(f=>f.length===24),'mapa 112 filas de 24');
ok(mapa.zonas.map(z=>z.id).join()==='palacio,plaza,canal,puerto','orden de zonas sin huecos');
const quieto={x:0,y:0};const paso=(m,e={},s=1/60)=>m.actualizar(s,{...quieto,...e});
const mover=(m,x,y,max=1800)=>{for(const eje of ['x','y']){let i=0;while(Math.abs(m.jugador[eje]-(eje==='x'?x:y))>.055&&i++<max)paso(m,{[eje]:Math.sign((eje==='x'?x:y)-m.jugador[eje])});assert.ok(Math.abs(m.jugador[eje]-(eje==='x'?x:y))<.07,'llega '+eje+' a '+(eje==='x'?x:y));}};
const pulsar=m=>paso(m,{poderPulsado:true});
const m=crearMundo(mapa,{}, {},[10.5,89.5]);m.cambiarPersonaje('ulises');pulsar(m);
ok(!!m.jugador.aBordo,'Ulises sube desde el muelle sur');
mover(m,11.5,85.5);mover(m,14.5,84.5);pulsar(m);mover(m,15.5,84.5);
ok(m.coleccionables.find(c=>c.id==='frasco-pulpo').recogido,'desembarca en roca y recoge frasco');
pulsar(m);mover(m,14.5,80.5);mover(m,6.5,80.3);paso(m);
const sello=m.coleccionables.find(c=>c.id==='sello-barco');
ok(sello.visible&&!sello.recogido&&m.estado().revelados.includes('sello-barco'),'barca revela sello antes de recoger');
const restaurado=crearMundo(mapa,{},m.estado(),[15.5,84.5]);
ok(restaurado.coleccionables.find(c=>c.id==='sello-barco').visible,'revelado persiste sin recolección');
mover(m,6.5,79.5);pulsar(m);mover(m,6.5,78.5);
ok(sello.recogido,'desembarca en roca del sello y lo recoge');pulsar(m);
mover(m,11.5,79.5);mover(m,11.5,73.5);pulsar(m);
ok(!m.jugador.aBordo&&m.jugador.y<73,'llega a plaza junto a barca norte estacionada');
// La barca que recién llegó sigue accesible para volver, aun con otra en el muelle.
pulsar(m);mover(m,11.5,88.5);pulsar(m);ok(!m.jugador.aBordo&&m.jugador.y>88,'vuelve al puerto sin vararse ni mover barca norte');
for(const llegada of [[15.5,84.5],[6.5,78.5]]){
 const a=crearMundo(mapa,{}, {},llegada),j=a.jugador;
 ok(a.barcasRemo.some(b=>Math.hypot(b.x-j.x,b.y-j.y)<1.7),'restaurar en roca trae una barca accesible '+llegada);
 const s=a.estado(),b=crearMundo(mapa,{},s,llegada);
 ok(serial(a.barcasRemo.map(q=>[q.x,q.y]))===serial(b.barcasRemo.map(q=>[q.x,q.y])),'restaurar barca accesible preserva ubicación '+llegada);
}
for(const id of ['pegaso','minotauro','ariadna','fenix','eco']){
 const a=crearMundo(mapa,{}, {},[11.5,89.5]);a.cambiarPersonaje(id);
 for(let i=0;i<600;i++)paso(a,{y:-1,poderMantenido:true,poderPulsado:i===0,saltoPulsado:i%60===0});
 ok(a.jugador.y>=87,'otro personaje no cruza boca sur '+id);
 const b=crearMundo(mapa,{}, {},[14.5,89.5]);b.cambiarPersonaje(id);
 for(let i=0;i<600;i++)paso(b,{y:-1,poderMantenido:true,poderPulsado:i===0,saltoPulsado:i%60===0});
 ok(b.jugador.y>=88,'otro personaje no sobrevuela pared sur '+id);
}
const invisible=crearMundo(mapa,{}, {},[6.5,78.5]);
// Rescate trae barca a la isla, por eso alejarlas antes de medir al personaje solo.
for(const b of invisible.barcasRemo){b.x=11.5;b.y=85.5}paso(invisible);
ok(!invisible.coleccionables.find(c=>c.id==='sello-barco').visible&&!invisible.coleccionables.find(c=>c.id==='sello-barco').recogido,'personaje solo no revela ni recoge sello oculto');
console.log(n+' chequeos de canal y migración OK');
