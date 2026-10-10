'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),{chromium}=require('playwright');
const base=path.resolve('web'),out=path.resolve('tools/play-store/recursos');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const f=path.join(base,req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f))}catch(e){res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:3,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.AndroidBilling={isPlayBuild:()=>true,refresh(){},setSession(){},buy(){},restore(){},manage(){}}});
 await page.route('**/cloud.js',r=>r.fulfill({contentType:'text/javascript',body:"window.scheduleSync=()=>{};window.firebase={apps:[{}],auth:()=>({onIdTokenChanged:fn=>fn(null)})};"}));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.CAPlans);
 await page.evaluate(()=>{
  data=CAStore.empty();data.settings.owner='Negocio de ejemplo';
  data.movements=[{id:1,date:'2026-10-01',type:'Ingreso',concept:'Servicios realizados',total:1452,vat:21,paymentMethod:'cash'},{id:2,date:'2026-10-02',type:'Ingreso',concept:'Ventas del negocio',total:968,vat:21,paymentMethod:'card'},{id:3,date:'2026-10-03',type:'Gasto',concept:'Material y suministros',total:363,vat:21,category:'Material'},{id:4,date:'2026-10-05',type:'Gasto',concept:'Otros gastos',total:242,vat:21,category:'Otros'}];
  data.bank=[{id:1,date:'2026-10-06',amount:500}];
  const t=CATPV.ensure(data);t.customers=[{id:'cliente-demo',name:'Cliente de ejemplo',phone:'',email:'',notes:'Datos ficticios',archived:false}];
  t.products=[{id:'servicio1',name:'Servicio básico',kind:'service',category:'Servicios',price:1800,vat:21,stock:0,tracked:false,archived:false,duration:30},{id:'servicio2',name:'Servicio completo',kind:'service',category:'Servicios',price:3500,vat:21,stock:0,tracked:false,archived:false,duration:60},{id:'producto1',name:'Producto del negocio',kind:'product',category:'Productos',price:1290,vat:21,stock:18,minStock:3,tracked:true,archived:false}];
  CAAgenda.save(data,{customerId:'cliente-demo',productIds:['servicio1'],date:'2026-10-11',time:'10:00',duration:30,status:'confirmed',notes:''});
  CAAgenda.save(data,{customerId:'',productIds:['servicio2'],date:'2026-10-11',time:'12:00',duration:60,status:'pending',notes:''});
  save();year.value='2026';render();document.getElementById('syncStatus').textContent='Sin cuenta · tus datos permanecen en este dispositivo';window.dispatchEvent(new CustomEvent('ca-billing',{detail:{pro:true,busy:false,message:'Pro activo.'}}));show('home');
 });
 const capture=async name=>{await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,name),fullPage:false})};
 await capture('01-inicio.png');
 await page.evaluate(()=>{show('tpv');CATPVUI.tab('sale');CATPVUI.add('servicio1')});await capture('02-tpv-pro.png');
 await page.evaluate(()=>{show('agenda');agendaDate.value='2026-10-11';agendaDate.dispatchEvent(new Event('change'));CAAppointmentCalendarUI.open();document.getElementById('appointmentWeekScroll').scrollTop=9.75*360});await capture('03-agenda-pro.png');
 await page.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());show('reports');reportMonth.value='10';buildMonthlyReport()});await capture('04-informes.png');
 if(errors.length)throw Error(errors.join('; '));
 console.log('4 capturas de 1080 × 1920; datos ficticios. Estado Pro simulado para revisar la interfaz, sin compra real.');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exit(1)});
