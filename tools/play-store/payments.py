from pathlib import Path
import re

assets=Path('app/src/main/assets')
p=assets/'index.html';s=p.read_text()
match=re.search(r'<script>\n(.*?)</script>',s,re.S)
if not match:raise SystemExit('No se encuentra el código de la aplicación.')
core=match.group(1)
if 'function paymentSummaryHTML' not in core:
    helper='''function paymentSummaryHTML(movements,title='Cobrado por forma de pago'){
 const totals=CAPayments.split(movements);
 return `<h3>${title}</h3><table class="reportTable"><tr><th>Forma de cobro</th><th>Importe (IVA incluido)</th></tr>${Object.entries(CAPayments.labels).map(([key,label])=>`<tr><td>${label}</td><td>${eur(totals[key])}</td></tr>`).join('')}<tr><th>Total cobrado</th><th>${eur(totals.total)}</th></tr></table>${totals.unspecifiedCount?'<p class="small">Los ingresos sin forma de cobro se muestran como Sin especificar. Puedes clasificarlos en Movimientos.</p>':''}`;
}
function selectedIncome(y,m){return data.movements.filter(x=>x.type==='Ingreso'&&Number(x.date.slice(0,4))===y&&(m==null||Number(x.date.slice(5,7))===m))}
function reportedIncome(y,m){return selectedIncome(y,m).filter(x=>!data.nonworking.includes(x.date))}
function setPaymentMethod(id,value){
 if(!Object.hasOwn(CAPayments.labels,value))return;
 const movement=data.movements.find(x=>x.id===id&&x.type==='Ingreso');if(!movement)return;
 const previous=movement.paymentMethod;movement.paymentMethod=value;
 try{save();const month=Number(movement.date.slice(5,7));if(document.getElementById('moves').classList.contains('active'))renderMonth(month);buildMonthlyReport()}catch(e){if(previous==null)delete movement.paymentMethod;else movement.paymentMethod=previous;render()}
}
'''
    core=core.replace('function movementHTML(m){',helper+'function movementHTML(m){',1)
    old='${m.date}${cat?` · ${cat}`:""} · IVA ${m.vat||0}%'
    new='${m.date}${cat?` · ${cat}`:""} · IVA ${m.vat||0}%${m.type==="Ingreso"?` · ${CAPayments.labels[CAPayments.method(m)]}`:""}'
    if old not in core:raise SystemExit('No se encuentra el detalle de movimientos.')
    core=core.replace(old,new,1)
    old='<div class="actions"><button class="tiny danger" onclick="deleteMove(${m.id})">Borrar</button></div>'
    new='''${m.type==="Ingreso"?`<label class="small" for="payment-${m.id}">Forma de cobro</label><select id="payment-${m.id}" aria-label="Forma de cobro del ingreso ${m.id}" onchange="setPaymentMethod(${m.id},this.value)" style="font-size:14px;padding:8px;margin:4px 0">${Object.entries(CAPayments.labels).map(([key,label])=>`<option value="${key}" ${CAPayments.method(m)===key?'selected':''}>${label}</option>`).join('')}</select>`:''}<div class="actions"><button class="tiny danger" onclick="deleteMove(${m.id})">Borrar</button></div>'''
    if old not in core:raise SystemExit('No se encuentra la edición de movimientos.')
    core=core.replace(old,new,1)
    core=core.replace('renderQuarters();renderCash();renderBenefits()',"renderQuarters();renderCash();renderBenefits();document.getElementById('annualPayments').innerHTML=paymentSummaryHTML(selectedIncome(y),'Cobros del año '+y)",1)
    core=core.replace('function syncMovementForm(){let isExpense=type.value==="Gasto";', 'function syncMovementForm(){let isExpense=type.value==="Gasto";document.getElementById("paymentFields").hidden=isExpense;',1)
    core=core.replace('type.value="Ingreso";vat.value=21;withholding.value=0;syncMovementForm();dlg.showModal()', 'type.value="Ingreso";document.getElementById("paymentMethod").value="";vat.value=21;withholding.value=0;syncMovementForm();dlg.showModal()',1)
    start=core.index('function addMovement(){');end=core.index('\nfunction renderMonth',start)
    old=core[start:end]
    new=old.replace('let isExpense=type.value==="Gasto",', 'const paymentMethod=document.getElementById("paymentMethod").value;if(type.value==="Ingreso"&&!["cash","card","transfer"].includes(paymentMethod))return alert("Elige cómo has cobrado: efectivo, tarjeta o transferencia.");let isExpense=type.value==="Gasto",')
    new=new.replace('gestoria:false,category:c,','gestoria:false,...(!isExpense?{paymentMethod}:{}),category:c,')
    core=core[:start]+new+core[end:]
    core=core.replace('Beneficio neto estimado: ${eur(b.neto)}</b></div></div>`}', 'Beneficio neto estimado: ${eur(b.neto)}</b></div></div>`+paymentSummaryHTML(selectedIncome(currentYear(),m))}',1)
    start=core.index('function renderCash(){');end=core.index('\nfunction monthlyIncomeRows',start)
    core=core[:start]+'''function renderCash(){
 const y=currentYear(),months=CAPayments.cashYear(data.movements,data.bank,y);
 cashSummary.innerHTML=months.map(r=>{
 const monthIncome=CAPayments.split(selectedIncome(y,r.month));
 return `<div class="panel"><b>${MONTHS[r.month-1]}</b><div class="small" style="line-height:1.8;margin-top:8px">Cobrado en efectivo: ${eur(monthIncome.cash)}<br>Cobrado con tarjeta: ${eur(r.card)}<br>Cobrado por transferencia: ${eur(r.transfer)}<br>Sin especificar: ${eur(r.unspecified)}<br>Efectivo llevado al banco: ${eur(r.deposit)}<br><b>${r.unknownCount?'Caja provisional':'Caja acumulada'}: ${eur(r.unknownCount?r.provisionalCash:r.cash)}</b>${r.unknownCount?`<br>Incluye ${eur(r.unknown)} sin forma de cobro asignada; clasifica esos ingresos para conocer el efectivo.`:''}<br>Entradas brutas al banco acumuladas: ${eur(r.bankEntries)}</div></div>`;
 }).join('');
 const deposited=data.bank.filter(x=>Number(x.date.slice(0,4))===y).map(x=>({...x,kind:'deposit'}));
 const direct=selectedIncome(y).filter(x=>['card','transfer'].includes(CAPayments.method(x))).map(x=>({...x,amount:x.total,kind:CAPayments.method(x)}));
 bankHistory.innerHTML=[...deposited,...direct].sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="movement"><div class="ico">€</div><div><div class="mname">${x.kind==='deposit'?'Efectivo llevado al banco':CAPayments.labels[x.kind]+' · cobro registrado'}</div><div class="sub">${x.date}${x.kind==='deposit'?'':' · Importe bruto; consulta el abono en tu banco'}</div></div><div class="amt">${eur(x.amount)}<div>${x.kind==='deposit'?`<button class="tiny danger" onclick="deleteBank(${x.id})">Borrar</button>`:'<span class="small">Se modifica desde Movimientos</span>'}</div></div></div>`).join('')||'<div class="panel small">Sin entradas registradas al banco.</div>';
}
''' + core[end:]
    # Monthly report keeps the legible three-column tax table and adds a payment table.
    core=core.replace('Efectivo + IVA','Total (IVA incluido)')
    needle="${totalRow}</table>`;"
    if needle not in core:raise SystemExit('No se encuentra el informe mensual.')
    core=core.replace(needle,"${totalRow}</table>`+paymentSummaryHTML(reportedIncome(y,m));",1)
    needle=' flush();\n const enc=new TextEncoder();'
    if needle not in core:raise SystemExit('No se encuentra el generador de PDF.')
    addition=''' if(cy<190){flush();header()}
 cy-=34;add("Desglose por forma de cobro (IVA incluido)",45,11,true);cy-=22;
 const breakdown=CAPayments.split(reportedIncome(y,m));
 for(const [key,label] of Object.entries(CAPayments.labels)){add(label,45,10);add(eur(breakdown[key]),300,10);cy-=20}
 add("TOTAL COBRADO",45,10,true);add(eur(breakdown.total),300,10,true);cy-=20;
 flush();
 const enc=new TextEncoder();'''
    core=core.replace(needle,addition,1)
    # Preview uses exactly the same report as the screen and printing.
    start=core.index('function viewMonthlyPDF(){');end=core.index('\nasync function blobToDataURL',start)
    core=core[:start]+'''function viewMonthlyPDF(){
 buildMonthlyReport();
 const old=document.getElementById('pdfPreviewOverlay');if(old)old.remove();
 const o=document.createElement('div');o.id='pdfPreviewOverlay';o.style.cssText='position:fixed;inset:0;z-index:99999;background:#e9edf2;overflow:auto;padding:14px';
 o.innerHTML=`<div style="max-width:820px;margin:0 auto"><div style="position:sticky;top:0;z-index:2;display:flex;gap:8px;padding:8px 0;background:#e9edf2"><button class="primary" style="flex:1" onclick="document.getElementById('pdfPreviewOverlay').remove()">Volver</button><button class="secondary" style="flex:1" onclick="saveMonthlyPDF()">Guardar / compartir</button><button class="secondary" style="flex:1" onclick="printMonthlyReport()">Imprimir</button></div><div id="pdfPreviewPage" style="background:#fff;color:#111;min-height:75vh;padding:28px 20px">${document.getElementById('monthlyReport').innerHTML}</div></div>`;
 document.body.appendChild(o);
}
''' +core[end:]
    s=s[:match.start(1)]+core+s[match.end(1):]
    s=s.replace('<script src="store.js"></script>', '<script src="store.js"></script><script src="payments.js"></script>',1)
    s=s.replace('<label>Concepto</label>', '<div id="paymentFields"><label for="paymentMethod">Forma de cobro</label><select id="paymentMethod"><option value="">Selecciona cómo has cobrado</option><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option></select></div><label>Concepto</label>',1)
    s=s.replace('<div class="panel"><b>Resumen trimestral</b>', '<div class="panel" id="annualPayments"></div><div class="panel"><b>Resumen trimestral</b>',1)
    s=s.replace('La caja se calcula con los ingresos registrados y se acumula mes a mes. Registra aquí lo que ingresas en el banco.', 'La caja incluye los cobros en efectivo menos el efectivo llevado al banco. Tarjeta y transferencia figuran automáticamente como entradas al banco: no los añadas de nuevo aquí. Los importes son brutos y se muestran en la fecha del ingreso registrado; no representan el saldo real del banco ni descuentan comisiones o retenciones. La caja no descuenta gastos ni arrastra saldos del año anterior.')
    s=s.replace('placeholder="Importe ingresado en banco"','placeholder="Efectivo que llevas al banco"').replace('>Añadir ingreso al banco<','>Registrar efectivo llevado al banco<').replace('Historial de ingresos al banco','Entradas registradas al banco')
    s=s.replace('La caja acumula los ingresos registrados menos las cantidades anotadas como ingresadas al banco, mes a mes dentro del año seleccionado. No descuenta gastos ni arrastra el saldo del año anterior. Si registras 500 € de ingresos y 200 € ingresados al banco, la caja muestra 300 €. El ingreso al banco no es una venta nueva. La app no se conecta con tu banco.', 'La caja acumula los cobros en efectivo menos el efectivo llevado al banco dentro del año seleccionado. Tarjeta y transferencia aparecen como entradas al banco derivadas del ingreso original, sin duplicar ventas. La app no se conecta al banco, no calcula su saldo real ni descuenta comisiones o retenciones del abono. Los ingresos antiguos sin método conservan su importe y se muestran como Sin especificar; mientras existan, la caja se indica como provisional. Clasifícalos desde Movimientos. La caja no descuenta gastos ni arrastra el saldo del año anterior.')
    s=s.replace('En ingresos puedes indicar una retención.', 'En ingresos elige Efectivo, Tarjeta o Transferencia y, si procede, indica una retención. Puedes cambiar la forma de cobro desde el movimiento sin borrarlo.')
    s=s.replace('Esta versión guarda los datos en este dispositivo, sin sincronización automática. Para trasladarlos, exporta una copia JSON e impórtala en el otro dispositivo.', 'En modo local los datos permanecen en este dispositivo. Con una cuenta puedes sincronizarlos mediante Firebase y acceder con el mismo correo en otro dispositivo. Actualiza todos tus dispositivos para que muestren las mismas formas de cobro.')
    s=s.replace('</style>', '.movement>div{min-width:0}.payment-note{overflow-wrap:anywhere}</style>',1)
# Preserve all user records; add optional validation for the new metadata only.
p=assets/'store.js';store=p.read_text()
marker="if(m.withholding!=null&&!Number.isFinite(m.withholding))throw Error('Importe no válido');"
if 'Forma de cobro no válida' not in store:
    if marker not in store:raise SystemExit('No se encuentra la validación de copias.')
    store=store.replace(marker,marker+"\n   if(m.paymentMethod!=null&&!['cash','card','transfer','unspecified'].includes(m.paymentMethod))throw Error('Forma de cobro no válida');",1)
p.write_text(store)
(assets/'index.html').write_text(s.replace('1.0.4','1.0.5'))
(assets/'app.js').write_text(core.strip()+'\n')
p=assets/'boot.js';boot=p.read_text()
if "await load('payments.js')" not in boot:boot=boot.replace("await load('app.js');", "await load('payments.js');await load('app.js');")
p.write_text(boot)
p=assets/'sw.js';sw=p.read_text().replace('v1.0.4','v1.0.5')
if "'payments.js'" not in sw:sw=sw.replace("'app.js'", "'app.js','payments.js'")
p.write_text(sw)
p=Path('app/build.gradle');p.write_text(p.read_text().replace('versionCode 5','versionCode 6').replace("versionName '1.0.4'","versionName '1.0.5'"))
