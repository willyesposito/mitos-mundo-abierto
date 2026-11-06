// Invariantes de presentación: orientación, accesibilidad, obstáculos y caché.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { posePersonaje, encuadre } from '../animacion.js';
import { crearAmbiente, movimientoAmbiente } from '../ambiente.js';
import { crearMundo } from '../mundo.js';
const raiz = new URL('../', import.meta.url);
let n = 0;
const verificar = (cond, mensaje) => { assert.ok(cond, mensaje); console.log('OK ' + mensaje); n++; };
for (const id of ['pegaso', 'minotauro', 'ariadna', 'fenix', 'eco', 'ulises']) {
  for (const [fx, fy, vista] of [[1,0,'costado'],[-1,0,'costado'],[0,1,'frente'],[0,-1,'espalda']]) {
    for (const caminando of [false,true]) for (const paso of [.2, .9]) {
      const o = { fx, fy, caminando, paso };
      const p = posePersonaje(id,o);
      verificar(p.vista === vista && fs.existsSync(new URL('sprites/personajes/' + p.nombre + '.svg',raiz)), id + ': pose existente ' + p.nombre);
    }
    const reducido = posePersonaje(id,{fx,fy,caminando:true,paso:.2},true);
    verificar(!reducido.nombre.includes('paso'), id + ': movimiento reducido sin ciclo');
    if (['pegaso','fenix'].includes(id)) {
      const vuelo = posePersonaje(id,{fx,fy,volando:true});
      verificar(fs.existsSync(new URL('sprites/personajes/'+vuelo.nombre+'.svg',raiz)), id + ': cuerpo de vuelo en '+vista);
    }
  }
}
const mapa = JSON.parse(fs.readFileSync(new URL('datos/mapa-mundo.json',raiz)));
const m = crearMundo(mapa,[]), antes = JSON.stringify(m.estado());
const ambiente = crearAmbiente(m);
verificar(ambiente.length >= 20, 'ambiente distribuido en el mundo');
verificar(JSON.stringify(m.estado()) === antes, 'el ambiente no modifica el progreso');
for (const e of ambiente) verificar(!m.sogas.some(s => e.x >= Math.min(s.a[0],s.b[0])-1 && e.x <= Math.max(s.a[0],s.b[0])+1 && e.y >= Math.min(s.a[1],s.b[1])-1 && e.y <= Math.max(s.a[1],s.b[1])+1), 'carril de soga libre: '+e.tipo);
verificar(JSON.stringify(movimientoAmbiente({tipo:'gaviota',reaccion:1,fase:1},5,true)) === JSON.stringify(movimientoAmbiente({tipo:'gaviota',reaccion:1,fase:1},30,true)), 'ambiente estático con movimiento reducido');
for (const [W,H] of [[360,640],[390,844],[412,915],[1536,882]]) {
  const v=encuadre(W,H,230,80,44,36);
  verificar(Number.isFinite(v.esc) && v.esc > .3 && v.focoY > 80 && v.focoY < H-230, 'encuadre útil '+W+'×'+H);
}
const sw = fs.readFileSync(new URL('sw.js',raiz),'utf8');
const archivos = vm.runInNewContext(sw.slice(0,sw.indexOf("self.addEventListener")) + '\nARCHIVOS;');
for (const f of archivos) verificar(f === './' || fs.existsSync(new URL(f,raiz)), 'recurso de caché existe: '+f);
for (const dir of ['sprites/personajes/','sprites/ambiente/','sprites/coleccionables/','sprites/escenario/']) for (const f of fs.readdirSync(new URL(dir,raiz))) verificar(archivos.includes(dir+f), 'sprite nuevo incluido en caché: '+f);
verificar(archivos.includes('ambiente.js') && archivos.includes('animacion.js'), 'módulos gráficos disponibles offline');
console.log(n+' verificaciones gráficas OK');
