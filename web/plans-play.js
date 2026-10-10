(function(root){'use strict';
 const bridge=root.AndroidBilling;
 if(!bridge||!bridge.isPlayBuild())return;
 let state={pro:false,busy:true,canBuy:false,message:'Comprobando tu acceso Pro…'},mounted=false,serial=0;
 const free=()=>!state.pro;
 function notice(){show('account');alert('Esta función pertenece a Pro. Puedes contratarlo o restaurar tu compra desde Mi cuenta. Tus datos se conservan.');return false}
 function wrap(obj,names){if(!obj)return;for(const name of names){if(typeof obj[name]!=='function')continue;const original=obj[name];obj[name]=function(...args){if(free())return notice();return original.apply(this,args)}}}
 function update(){
  if(!mounted)return;
  const status=document.getElementById('planStatus'),buy=document.getElementById('planBuy');
  status.textContent=state.message||'Versión gratuita.';
  buy.textContent=state.trial?'Probar 7 días gratis':state.price?'Contratar Pro · '+state.price+'/año':'Contratar Pro';
  buy.disabled=!state.canBuy;buy.hidden=!!state.pro;
  document.getElementById('planTerms').textContent=state.terms||'El precio y las condiciones se mostrarán cuando Google Play confirme la oferta disponible.';
  document.getElementById('planRestore').disabled=!!state.busy;
  for(const el of document.querySelectorAll('[data-pro-create]')){el.disabled=free();el.title=free()?'Función Pro':''}
  for(const id of ['proGraph','proResults','quarters','annualPayments']){const el=document.getElementById(id);if(el)el.hidden=free()}
  for(const el of document.querySelectorAll('[data-pro-notice]'))el.hidden=!free();
 }
 root.addEventListener('ca-billing',event=>{const v=event.detail||{};state={...v,pro:v.pro===true};update()});
 async function session(user){
  const n=++serial;state={...state,pro:false,canBuy:false,busy:true,message:'Comprobando la cuenta…'};update();
  if(!user){bridge.setSession('','');return}
  try{const token=await user.getIdToken();if(n===serial)bridge.setSession(token,user.uid)}
  catch(e){if(n===serial){bridge.setSession('','');state={pro:false,busy:false,message:'Inicia sesión de nuevo para comprobar Pro.'};update()}}
 }
 function mount(){
  const account=document.getElementById('account');
  for(const el of account.querySelectorAll('section.panel'))if(el.querySelector('h3')?.textContent==='Control Autónomo Pro')el.remove();
  const panel=document.createElement('section');panel.className='panel';panel.id='planPanel';
  panel.innerHTML='<h3>Gratis y Pro</h3><p id="planStatus" role="status" aria-live="polite"></p><table class="planTable"><tr><th>Gratis</th><th>Pro añade</th></tr><tr><td>Ingresos y gastos<br>Formas de cobro<br>Caja / Banco<br>Beneficio básico<br>Cuenta, copias y sincronización</td><td>Empleados y vacaciones<br>TPV, catálogo y stock<br>Agenda de citas<br>Cobros pendientes<br>Comparativas y gráficos<br>PDF, impresión y Excel<br>Informes trimestrales y anuales<br>Informe completo con logo</td></tr></table><p id="planTerms" class="small"></p><button class="primary" id="planBuy" disabled>Contratar Pro</button><button class="secondary" id="planRestore">Restaurar compras</button><button class="secondary" id="planManage">Gestionar o cancelar suscripción</button><p class="small">La compra se realiza con Google Play y se vincula a tu cuenta de Control Autónomo. Inicia sesión con esa misma cuenta para restaurarla. Puedes seguir usando Gratis al terminar Pro; tus registros y copias se conservan.</p><button class="secondary" id="planPrivacy">Privacidad y contacto</button>';
  account.append(panel);
  document.getElementById('planBuy').onclick=()=>bridge.buy();
  document.getElementById('planRestore').onclick=()=>bridge.restore();
  document.getElementById('planManage').onclick=()=>bridge.manage();
  document.getElementById('planPrivacy').onclick=()=>document.getElementById('privacyDialog').showModal();
  wrap(root.CAWorkCalendarUI,['save']);wrap(root.CAAgendaUI,['save','sale','saveClient']);
  wrap(root.CATPVUI,['startAppointment','checkout','saveProduct','saveCustomer','saveStock','exportSale']);
  wrap(root.CAEmployees,['saveEmployee','addCost','addVacation']);
  wrap(root.CAProBusiness,['saveReceivable','preview','pdf','excel','saveBrand','logo']);
  wrap(root,['viewMonthlyPDF','saveMonthlyPDF','downloadMonthlyPDF','printMonthlyReport','makeMonthlyPdfBytes']);
  const names=['CAWorkCalendarUI.save','CAAgendaUI.save','CAAgendaUI.saveClient','CAAgendaUI.sale','CATPVUI.startAppointment','CATPVUI.checkout','CATPVUI.saveProduct','CATPVUI.saveCustomer','CATPVUI.saveStock','CAEmployees.saveEmployee','CAEmployees.addCost','CAEmployees.addVacation','CAProBusiness.saveReceivable','CAProBusiness.preview','CAProBusiness.pdf','CAProBusiness.excel','CAProBusiness.saveBrand','CAProBusiness.logo','viewMonthlyPDF','saveMonthlyPDF','downloadMonthlyPDF','printMonthlyReport','CATPVUI.exportSale'];
  for(const el of document.querySelectorAll('[onclick],[onchange]'))if(names.some(fn=>(el.getAttribute('onclick')||el.getAttribute('onchange')||'').includes(fn)))el.dataset.proCreate='true';
  const compare=document.getElementById('proCompare');if(compare)compare.dataset.proCreate='true';
  for(const id of ['quarters','annualPayments']){const el=document.getElementById(id);if(el){const text=document.createElement('p');text.dataset.proNotice='true';text.className='planNotice';text.textContent='Informe disponible con Pro.';el.before(text)}}
  const download=root.downloadFileCompat;if(download)root.downloadFileCompat=function(blob,name,...args){if(free()&&/\.(pdf|xlsx)$/i.test(name||''))return notice();return download.call(this,blob,name,...args)};
  for(const el of document.querySelectorAll('[data-pro-create]'))if(!el.matches('input')&&!el.textContent.includes('Pro'))el.append(' · Pro');
  const menu=document.querySelector('#home>.homeMenu');
  for(const label of ['TPV','Informes','Agenda · Pro','Movimientos']){const tile=[...menu.children].find(x=>x.textContent.trim().endsWith(label));if(tile)menu.prepend(tile)}
  for(const label of ['Mi cuenta','Ajustes']){const tile=[...menu.children].find(x=>x.textContent.trim().endsWith(label));if(tile)menu.append(tile)}
  mounted=true;const oldRender=root.render;root.render=function(...args){const result=oldRender.apply(this,args);update();return result};
  root.CAPlans={isFree:free,refresh:update};update();
  if(root.firebase?.apps?.length)root.firebase.auth().onIdTokenChanged(session);
  else{state={pro:false,busy:false,message:'No se pudo iniciar la cuenta. Cierra y vuelve a abrir la app.'};update();bridge.setSession('','')}
  bridge.refresh();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(globalThis);
