'use strict';
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve('web');
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]);const f=path.join(base,name==='/'?'index.html':name);if(!f.startsWith(base+path.sep)){res.writeHead(403).end();return}try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f))}catch(e){res.writeHead(404).end()}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  for(const viewport of [{width:360,height:640},{width:800,height:1280},{width:1280,height:800}]){
   const page=await browser.newPage({viewport,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    localStorage.setItem('ca-preview-plan-1','preview');
    window.billingCalls={buy:0,restore:0,manage:0};
    window.AndroidBilling={isPlayBuild:()=>true,refresh(){},setSession(){window.dispatchEvent(new CustomEvent('ca-billing',{detail:{pro:false,busy:false,canBuy:true,trial:true,price:'5,99 €',terms:'7 días gratis; después 5,99 € al año. Renovación automática.',message:'Versión gratuita.'}}))},buy(){billingCalls.buy++},restore(){billingCalls.restore++},manage(){billingCalls.manage++}};
   });
   await page.route('**/cloud.js',r=>r.fulfill({contentType:'text/javascript',body:"window.scheduleSync=function(){};window.firebase={apps:[{}],auth:()=>({onIdTokenChanged:fn=>fn({uid:'test',getIdToken:async()=> 'test-token'})})};"}));
   await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.CAPlans);
   assert.equal(await page.evaluate(()=>CAPlans.isFree()),true,'preview localStorage cannot unlock the release');
   assert.equal(await page.locator('#planToggle').count(),0,'release has no free Pro toggle');
   await page.evaluate(()=>show('account'));
   assert.match(await page.locator('#planTerms').textContent(),/7 días gratis/);
   await page.locator('#planBuy').click();await page.locator('#planRestore').click();await page.locator('#planManage').click();
   assert.deepEqual(await page.evaluate(()=>billingCalls),{buy:1,restore:1,manage:1});
   await page.evaluate(()=>{show('settings')});
   assert(await page.getByRole('button',{name:'Guardar / compartir informe mensual en PDF · Pro',exact:true}).isDisabled());
   assert(await page.getByRole('button',{name:'Exportar copia de seguridad',exact:true}).isEnabled());
   await page.evaluate(()=>{data.movements.push({id:991,type:'Ingreso',date:'2026-10-10',total:120,concept:'Dato conservado',vat:21,base:99.17,iva:20.83,paymentMethod:'cash'});save();window.dispatchEvent(new CustomEvent('ca-billing',{detail:{pro:true,busy:false,message:'Pro activo.'}}));show('settings')});
   assert(await page.getByRole('button',{name:'Guardar / compartir informe mensual en PDF · Pro',exact:true}).isEnabled());
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent('ca-billing',{detail:{pro:false,busy:false,message:'Pago pendiente.'}})));
   assert(await page.getByRole('button',{name:'Guardar / compartir informe mensual en PDF · Pro',exact:true}).isDisabled());
   assert.equal(await page.evaluate(()=>data.movements.find(x=>x.id===991).total),120);
   await page.evaluate(()=>{show('account');document.getElementById('privacyDialog').showModal()});
   assert.match(await page.locator('#privacyDialog').textContent(),/token de compra/);
   await page.evaluate(()=>document.getElementById('privacyDialog').close());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.deepEqual(errors,[]);await page.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
 console.log('OK: Play release purchase actions, no preview unlock, pending/expired gating, preserved data, privacy and mobile/tablet layout.');
})().catch(e=>{console.error(e);server.close();process.exit(1)});
