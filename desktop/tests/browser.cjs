'use strict';
const {chromium}=require('playwright'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CA_CHROMIUM_PATH?{executablePath:process.env.CA_CHROMIUM_PATH}:{})});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.DesktopBridge={saveFile:async(data,name)=>{window.savedDesktopFile={data,name};return{saved:true}},print:async()=>true,whatsapp:async()=>true}});
 const root=path.resolve(__dirname,'../assets');
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='windows-test.local')return route.abort();const rel=u.pathname.slice('/assets/'.length),file=path.resolve(root,rel||'index.html');if(path.relative(root,file).startsWith('..')||!fs.existsSync(file))return route.fulfill({status:404,body:''});await route.fulfill({status:200,contentType:file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'application/octet-stream',body:fs.readFileSync(file)})});
 await page.goto('https://windows-test.local/assets/index.html');
 await page.waitForFunction(()=>window.CAStore&&window.CATPV&&window.CABackups&&window.DesktopBridge);
 a.deepEqual(errors,[]);
 await page.evaluate(()=>{window.scheduleSync=()=>{};data=CAStore.empty();data.settings.owner='Empresa Windows';data.movements=[{id:1,date:'2026-01-04',type:'Ingreso',concept:'Prueba Windows',total:121,vat:21,paymentMethod:'cash',withholding:0}];save()});
 a.equal(await page.evaluate(()=>monthlyBenefit(2026,1).inc),121);
 await page.evaluate(()=>exportData());await page.waitForFunction(()=>window.savedDesktopFile&&document.getElementById('backupStatus').textContent.startsWith('Última copia guardada:'));
 const file=await page.evaluate(()=>window.savedDesktopFile);a(file.name.startsWith('Control-Autonomo-copia-'));a.equal(JSON.parse(Buffer.from(file.data,'base64').toString()).settings.owner,'Empresa Windows');
 await page.reload();await page.waitForFunction(()=>window.CAStore&&window.CABackups);a.equal(await page.evaluate(()=>data.settings.owner),'Empresa Windows');a.equal(await page.evaluate(()=>data.movements[0].total),121);a.deepEqual(errors,[]);
 console.log('OK Chromium: interfaz integrada inicia, guarda ingresos, exporta copia y conserva datos al recargar');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
