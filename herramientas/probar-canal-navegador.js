// U2: navegación real, guardado del revelado y lectura en pantalla. No forma parte del juego.
module.exports = async function probarCanal(browser, url, salida, ok) {
  const path = require('path');
  const c = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const p = await c.newPage(), errores=[];
  p.on('pageerror',e=>errores.push(e.message));
  const estado=()=>p.evaluate(()=>{const m=window.__mundo,j=m.jugador;return{x:j.x,y:j.y,aBordo:!!j.aBordo,frasco:m.coleccionables.find(c=>c.id==='frasco-pulpo').recogido,sello:m.coleccionables.find(c=>c.id==='sello-barco').recogido,visible:m.coleccionables.find(c=>c.id==='sello-barco').visible}});
  async function ir(x,y,orden='xy') {
    for(const eje of orden){
      const t0=Date.now(),dest=eje==='x'?x:y;let tecla=null;
      try {
        while(Date.now()-t0<12000){const j=await estado(),d=dest-j[eje];if(Math.abs(d)<.07)break;const nueva=eje==='x'?(d>0?'ArrowRight':'ArrowLeft'):(d>0?'ArrowDown':'ArrowUp');if(tecla!==nueva){if(tecla)await p.keyboard.up(tecla);await p.keyboard.down(nueva);tecla=nueva}await p.waitForTimeout(20)}
      }finally{if(tecla)await p.keyboard.up(tecla)}
      const j=await estado();if(Math.abs(dest-j[eje])>=.1)throw new Error('U2 no llega '+eje+'='+dest+' desde '+JSON.stringify(j));
    }
  }
  const poder=async()=>{await p.keyboard.press('KeyE');await p.waitForTimeout(150)};
  const foto=async n=>{if(await p.isVisible('#aviso'))await p.click('#aviso');await p.waitForTimeout(500);await p.screenshot({path:path.join(salida,'U2-'+n+'.png')})};
  try{
    await p.goto(url);await p.fill('#nombre-nuevo','Canal');await p.click('#form-nuevo button[type=submit]');await p.click('.carta-eleccion[data-id=pegaso]');await p.waitForFunction(()=>window.__mundo);
    await p.click('.pj[data-id=ulises]');await ir(10.5,89.5,'y');await foto('muelle-sur');
    ok(!(await estado()).visible,'el sello está oculto al llegar al muelle sur');
    await poder();ok((await estado()).aBordo,'U2 navegador: embarca desde puerto');
    await ir(11.5,85.5);await foto('boca-sur');await ir(14.5,84.5);await poder();await ir(15.5,84.5,'x');
    ok((await estado()).frasco,'U2 navegador: recoge frasco desembarcando en su roca');await foto('frasco');
    await poder();await ir(14.5,80.3,'y');await ir(6.5,80.3,'x');
    ok((await estado()).visible&&!(await estado()).sello,'U2 navegador: barca revela sello sin recogerlo');
    const guardado=await p.evaluate(()=>JSON.parse(localStorage.getItem('mitos-mundo-abierto-v1')).perfiles[0]);
    ok(guardado.mundos.mundo.revelados.includes('sello-barco'),'U2 navegador: revelado ya está guardado antes de recoger');
    await ir(6.5,79.5,'y');await poder();await ir(6.5,78.5,'y');ok((await estado()).sello,'U2 navegador: recoge sello desembarcando');await foto('sello');
    await poder();await ir(11.5,79.5,'x');await ir(11.5,73.5,'y');await poder();await ir(11.5,71.5,'y');
    ok(!(await estado()).aBordo&&(await p.textContent('#zona-nombre'))==='Plaza central'&&(await p.textContent('#total-n'))==='3/9','U2 navegador: llega a plaza y conserva ancla y ambos objetos del canal');await foto('muelle-norte');
    await p.reload();await p.click('.perfil');await p.waitForFunction(()=>window.__mundo);
    ok((await estado()).frasco&&(await estado()).sello&&(await estado()).visible,'U2 navegador: recarga conserva ambos objetos y revelado');
    ok(errores.length===0,'U2 navegador: sin errores de ejecución');
  }finally{await c.close()}
};
