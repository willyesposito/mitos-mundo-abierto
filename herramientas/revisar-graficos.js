// Revisión reproducible del render real. No forma parte del juego.
// NODE_PATH apunta a Playwright instalado; MITOS_BROWSER permite usar Chrome local.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
const RAIZ=path.resolve(__dirname,'..'), salida=path.resolve(process.argv[2]||path.join(RAIZ,'..','capturas-graficos'));
fs.mkdirSync(salida,{recursive:true});
const TIPOS={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
async function revisar(){
 const browser=await chromium.launch({executablePath:process.env.MITOS_BROWSER||undefined});
 try {
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const errores=[];
  // No necesita sockets. Cada recurso proviene del árbol local, sin sustituir código del juego.
  await ctx.route('**/*',async route=>{
   let p=decodeURIComponent(new URL(route.request().url()).pathname); if(p.endsWith('/'))p+='index.html';
   const f=path.resolve(RAIZ,'.'+p);
   if(!f.startsWith(RAIZ+path.sep)||!fs.existsSync(f)){errores.push('404 '+p);return route.fulfill({status:404,body:''});}
   return route.fulfill({status:200,contentType:TIPOS[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});
  });
  const page=await ctx.newPage();page.on('pageerror',e=>errores.push(e.message));
  await page.goto('http://localhost:4173/?prueba&pruebas');
  await page.fill('#nombre-nuevo','Visual');await page.click('#form-nuevo button[type=submit]');await page.click('.carta-eleccion[data-id=pegaso]');await page.evaluate(()=>window.__desbloquear&&window.__desbloquear('minotauro'));
  await page.waitForFunction(()=>window.__mundo&&window.__sprites().listos);
  await page.click('.pj[data-id="ariadna"]');
  const ubicar=async(x,y,id='ariadna')=>{
   await page.evaluate(([x,y,id])=>{const m=window.__mundo,j=m.jugador;m.cambiarPersonaje(id);Object.assign(j,{x,y,z:0,vz:0,enSuelo:true,fx:0,fy:1,camina:false,planeo:false});j.seguro={x,y,z:0};},[x,y,id]);
   // Espera al seguimiento de cámara, no a una operación del juego.
   await page.waitForTimeout(750);
  };
  for(const [nombre,x,y,id] of [['puerto',11.5,104.5,'pegaso'],['plaza',13.5,65.5,'ariadna'],['palacio',8.5,25.5,'eco']]){
   await ubicar(x,y,id);await page.screenshot({path:path.join(salida,nombre+'-vertical.png')});
  }
  const medidas=await page.evaluate(()=>{
   const r=id=>{const a=document.getElementById(id).getBoundingClientRect();return{x:a.x,y:a.y,w:a.width,h:a.height};};
   return {joystick:r('joystick'),poder:r('btn-poder'),salto:r('btn-salto'),tira:r('tira'),W:innerWidth,H:innerHeight};
  });
  assert.ok(medidas.joystick.x+medidas.joystick.w<=medidas.poder.x,'el joystick no invade el poder');
  assert.ok(medidas.poder.w>=76&&medidas.salto.w>=60,'áreas táctiles cómodas');
  assert.ok(medidas.tira.y>medidas.H*.65,'la tira deja visible el mapa');
  const sprites=await page.evaluate(()=>window.__sprites());
  assert.equal(sprites.fallidos.length,0);assert.ok(Object.keys(sprites.imagenes).length>=56);
  await page.emulateMedia({reducedMotion:'reduce'});await ubicar(13.5,65.5);await page.screenshot({path:path.join(salida,'plaza-movimiento-reducido.png')});
  await page.setViewportSize({width:360,height:640});await ubicar(13.5,65.5);await page.screenshot({path:path.join(salida,'plaza-360.png')});
  await page.setViewportSize({width:1536,height:882});await page.emulateMedia({reducedMotion:'no-preference'});await ubicar(13.5,65.5);await page.screenshot({path:path.join(salida,'plaza-escritorio.png')});
  assert.deepEqual(errores,[],'sin errores ni recursos faltantes');
  console.log(JSON.stringify({estado:'OK',sprites:Object.keys(sprites.imagenes).length,escenario:Object.keys(sprites.escenario).length,medidas,capturas:salida,offline:'No validado: service worker bloqueado en intercepción local.'},null,2));
 }finally{await browser.close();}
}
revisar().catch(e=>{console.error(e);process.exitCode=1;});
