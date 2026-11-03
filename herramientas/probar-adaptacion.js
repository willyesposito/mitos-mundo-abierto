// Verifica el espacio real disponible, controles y teclado en varias pantallas.
// No forma parte del juego. Usa recursos locales por intercepcion del navegador.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const raiz = path.resolve(__dirname, '..');
const antes = process.argv.includes('--antes');
const salida = path.resolve(raiz, '..', antes ? 'capturas-adaptacion-antes' : 'capturas-adaptacion-despues');
const tipos = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json' };
const pantallas = [
  ['pc-1890-escala125',1890,1040,false,1.25], ['pc-1536',1536,882,false], ['pc-1366',1366,768,false], ['pc-compacta',1024,600,false], ['pc-baja',800,480,false],
  ['tablet-vertical',768,1024,true], ['tablet-horizontal',1024,768,true],
  ['celular-vertical',390,844,true], ['celular-pequeno',360,640,true],
  ['celular-horizontal',844,390,true], ['celular-horizontal-pequeno',640,360,true],
];
async function main() {
  fs.mkdirSync(salida,{recursive:true});
  const browser = await chromium.launch({executablePath:process.env.MITOS_BROWSER || undefined});
  const resumen=[];
  try {
    for (const [nombre,width,height,tactil,densidad=1] of pantallas) {
      const ctx = await browser.newContext({viewport:{width,height},hasTouch:tactil,isMobile:tactil,deviceScaleFactor:densidad,serviceWorkers:'block'});
      await ctx.route('**/*',route=>{
        let p=decodeURIComponent(new URL(route.request().url()).pathname);if(p.endsWith('/'))p+='index.html';
        const f=path.resolve(raiz,'.'+p);
        if(!f.startsWith(raiz+path.sep)||!fs.existsSync(f))return route.fulfill({status:404,body:''});
        return route.fulfill({status:200,contentType:tipos[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});
      });
      const page=await ctx.newPage(),errores=[];
      page.on('pageerror',e=>errores.push(e.message));
      await page.goto('http://localhost:4173/?prueba&pruebas');
      await page.fill('#nombre-nuevo','Prueba');await page.click('#form-nuevo button[type=submit]');
      await page.waitForFunction(()=>window.__mundo&&window.__sprites().listos);
      await page.click('.pj[data-id="ariadna"]');
      await page.evaluate(()=>{const j=window.__mundo.jugador;Object.assign(j,{x:13.5,y:65.5,z:0,vz:0,enSuelo:true});j.seguro={x:j.x,y:j.y,z:0};});
      await page.waitForTimeout(250);
      const medir=()=>page.evaluate(()=>{
        const r=id=>{const e=document.getElementById(id),a=e.getBoundingClientRect();return {x:a.x,y:a.y,w:a.width,h:a.height,d:getComputedStyle(e).display};};
        const v=visualViewport;
        return {W:innerWidth,H:innerHeight,visibleH:v.height,visibleW:v.width,controles:r('controles'),tira:r('tira'),hud:r('hud'),joystick:r('zona-joystick'),poder:r('btn-poder'),salto:r('btn-salto'),personajes:[...document.querySelectorAll('.pj')].map(e=>{const a=e.getBoundingClientRect();return{x:a.x,y:a.y,w:a.width,h:a.height};}),lienzo:r('lienzo')};
      });
      const m=await medir();
      if(!antes){
        const dentro=r=>r.x>=-1&&r.y>=-1&&r.x+r.w<=m.visibleW+1&&r.y+r.h<=m.visibleH+1;
        assert.ok(dentro(m.controles)&&dentro(m.tira),nombre+': controles completos');
        assert.ok(m.personajes.every(dentro),nombre+': los cinco personajes visibles');
        assert.ok(await page.locator('.pj > span').evaluateAll(es=>es.every(e=>getComputedStyle(e).display!=='none')),nombre+': nombres visibles');
        assert.ok(dentro(m.poder)&&dentro(m.salto),nombre+': acciones completas');
        assert.ok(m.hud.y+m.hud.h<m.controles.y,nombre+': campo de juego entre HUD y controles');
        assert.equal(m.joystick.d==='none',!tactil,nombre+': joystick segun dispositivo');
        assert.ok(m.salto.w>=44&&m.salto.h>=44,nombre+': salto accesible');
        assert.equal(m.lienzo.w,m.visibleW,nombre+': lienzo ancho visible');
        assert.equal(m.lienzo.h,m.visibleH,nombre+': lienzo alto visible');
        if(nombre==='pc-1536') {
          await page.focus('#btn-explorar');
          await page.keyboard.press('Space');
          await page.waitForFunction(()=>!document.getElementById('lista-lugares').hidden);
          assert.ok(await page.evaluate(()=>window.__mundo.jugador.enSuelo),'Espacio abre la lista sin saltar');
          const lista=await page.locator('#lista-lugares').boundingBox();
          assert.ok(lista.x>=0&&lista.x+lista.width<=width&&lista.y+lista.height<=height,'lista completa en PC');
          await page.keyboard.press('Space');
          await page.waitForFunction(()=>document.getElementById('lista-lugares').hidden);
          await page.click('.pj[data-id="ariadna"]');
        }
        await page.keyboard.press('Digit2');
        await page.waitForFunction(()=>window.__mundo.jugador.personaje==='minotauro');
        await page.keyboard.press('Digit3');
        await page.waitForFunction(()=>window.__mundo.jugador.personaje==='ariadna');
        await page.keyboard.press('Space');
        await page.waitForFunction(()=>!window.__mundo.jugador.enSuelo);
        await page.keyboard.press('Escape');
        if(nombre==='celular-vertical') {
          await page.setViewportSize({width:844,height:390});
          await page.waitForTimeout(100);
          const rotada=await medir();
          assert.equal(rotada.lienzo.w,844,'rotacion ajusta ancho del lienzo');
          assert.equal(rotada.lienzo.h,390,'rotacion ajusta alto del lienzo');
          assert.ok(rotada.tira.y+rotada.tira.h<=390,'rotacion mantiene la tira visible');
          await page.setViewportSize({width,height});
          await page.waitForTimeout(100);
        }
        await page.waitForFunction(()=>!document.getElementById('pantalla-menu').hidden);
        await page.keyboard.press('Escape');
      }
      await page.screenshot({path:path.join(salida,nombre+'.png')});
      assert.deepEqual(errores,[],nombre+': sin errores');
      resumen.push({pantalla:nombre,...m});
      await ctx.close();
    }
    fs.writeFileSync(path.join(salida,'geometria.json'),JSON.stringify(resumen,null,2));
    console.log(JSON.stringify({estado:antes?'diagnostico previo':'OK',pantallas:resumen.length,capturas:salida,geometria:resumen.map(m=>({pantalla:m.pantalla,H:m.H,controles:m.controles,tira:m.tira,joystick:m.joystick.d}))},null,2));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
