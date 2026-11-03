import assert from 'node:assert/strict';
import fs from 'node:fs';
import {crearMundo} from '../mundo.js';
import {lugaresPlaza,elegirLugar,objetivoCercano} from '../exploracion.js';
const mapa=JSON.parse(fs.readFileSync(new URL('../datos/mapa-mundo.json',import.meta.url)));
const m=crearMundo(mapa,{});let n=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);console.log('OK '+msg);n++;};
Object.assign(m.jugador,{x:11.5,y:71.5});
const antes=JSON.stringify(m.estado());
ok(lugaresPlaza(m).length===4,'la plaza presenta cuatro lugares de actividad');
for(const id of ['toro','terrazas','sol','sonido']) {
  elegirLugar(m,id);const o=objetivoCercano(m);
  ok(o.id===id,'se puede elegir '+id);
  ok(m.celdas[Math.floor(o.tramo.y)][Math.floor(o.tramo.x)]==='.', 'la primera pista apunta a piso caminable: '+id);
}
ok(JSON.stringify(m.estado())===antes,'la guía no modifica el estado guardado');
// La puerta abierta debe orientar al interior; nunca volver a pedir lo ya resuelto.
m.celdas[62][5]='.';elegirLugar(m,'toro');
ok(objetivoCercano(m).y===58.5,'muro abierto: la pista pasa al objeto del patio');
for(const o of m.coleccionables)if(o.id==='riton-toro')o.recogido=true;
ok(!lugaresPlaza(m).find(l=>l.id==='toro').pendiente,'el patio explorado no reaparece como pendiente');
ok(objetivoCercano(m).id!=='toro','la guía avanza después de recoger');
for(const s of m.sogas)if(s.a[1]===63)s.tendida=true;
ok(!lugaresPlaza(m).find(l=>l.id==='terrazas').pendiente,'la soga restaurada completa su lugar');
for(const o of m.coleccionables)o.recogido=true;
ok(objetivoCercano(m)===null,'sin pendientes desaparece el marcador');
const restaurado=crearMundo(mapa,{}, {...m.estado(),muros:['5,62']},[11.5,71.5]);
ok(restaurado.celdas[62][5]==='.'&&restaurado.sogas.some(s=>s.a[1]===63&&s.tendida),'se conserva el progreso de muro y soga al restaurar');
Object.assign(m.jugador,{y:90});ok(lugaresPlaza(m).length===0,'la guía de plaza no aparece en puerto');
for(const [x,y] of [[21,50],[22,52],[21,66],[22,68]])ok(mapa.filas[y][x]==='.', 'recoveco caminable '+x+','+y);
ok(mapa.filas.every(f=>f.length===24),'el mapa conserva dimensiones y coordenadas');
console.log(n+' chequeos de exploración OK');
