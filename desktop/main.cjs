'use strict';
const {app,BrowserWindow,ipcMain,dialog,shell,session,protocol,Menu}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path'),p=require('./policy.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'control-autonomo',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
const testing=!app.isPackaged&&process.env.CA_DESKTOP_TEST==='1';
const userData=testing?process.env.CA_TEST_PROFILE:path.join(app.getPath('appData'),'ControlAutonomo');
require('node:fs').mkdirSync(userData,{recursive:true});
app.setPath('userData',userData);
app.setPath('sessionData',userData);
let win,saving=false,closing=false;
if(!testing&&!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
function trusted(e){if(!win||e.sender!==win.webContents||e.senderFrame!==win.webContents.mainFrame||!p.local(e.senderFrame.url))throw Error('Solicitud no permitida')}
ipcMain.handle('ca:save',async(e,data,name)=>{trusted(e);name=p.fileName(name);const b=p.bytes(data);if(saving)throw Error('Ya hay un archivo pendiente');saving=true;try{const selected=testing?{canceled:false,filePath:path.join(process.env.CA_TEST_OUTPUT,name)}:await dialog.showSaveDialog(win,{defaultPath:path.join(app.getPath('documents'),name),filters:[{name:'Archivo',extensions:[path.extname(name).slice(1)]}]});if(selected.canceled)return{saved:false};await fs.writeFile(selected.filePath,b);return{saved:true}}finally{saving=false}});
ipcMain.handle('ca:print',e=>{trusted(e);return new Promise((resolve,reject)=>win.webContents.print({silent:false,printBackground:true},(ok,reason)=>ok?resolve(true):reject(Error(reason||'Impresión cancelada'))))});
ipcMain.handle('ca:whatsapp',async(e,phone,msg)=>{trusted(e);const url=p.whatsapp(phone,msg);if(testing){await fs.writeFile(path.join(process.env.CA_TEST_OUTPUT,'whatsapp.txt'),url);return true}await shell.openExternal(url);return true});
app.whenReady().then(async()=>{
const ses=session.fromPartition('persist:control-autonomo');
ses.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
ses.protocol.handle('control-autonomo',async request=>{if(!p.local(request.url))return new Response('Origen no permitido',{status:403});try{const file=p.asset(path.join(__dirname,'assets'),request.url);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.pdf':'application/pdf'};return new Response(await fs.readFile(file),{headers:{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','X-Content-Type-Options':'nosniff'}})}catch(e){console.error('No se pudo cargar '+request.url+': '+e.message);return new Response('Archivo no disponible',{status:404})}});
win=new BrowserWindow({width:1200,height:850,minWidth:760,minHeight:600,title:'Control Autónomo',icon:path.join(__dirname,'icon.ico'),webPreferences:{session:ses,preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Archivo',submenu:[{label:'Imprimir',accelerator:'Ctrl+P',click:()=>win.webContents.print({printBackground:true})},{role:'quit',label:'Salir'}]},{label:'Editar',submenu:[{role:'undo',label:'Deshacer'},{role:'redo',label:'Rehacer'},{type:'separator'},{role:'cut',label:'Cortar'},{role:'copy',label:'Copiar'},{role:'paste',label:'Pegar'},{role:'selectAll',label:'Seleccionar todo'}]},{label:'Ver',submenu:[{role:'resetZoom',label:'Tamaño normal'},{role:'zoomIn',label:'Ampliar'},{role:'zoomOut',label:'Reducir'},{role:'togglefullscreen',label:'Pantalla completa'}]}]));
const open=url=>{if(p.external(url)&&!testing)shell.openExternal(url).catch(()=>dialog.showErrorBox('Enlace','No se pudo abrir el navegador'))};
win.webContents.setWindowOpenHandler(({url})=>{open(url);return{action:'deny'}});
win.webContents.on('will-navigate',(e,url)=>{if(!p.local(url)){e.preventDefault();open(url)}});
win.webContents.on('will-attach-webview',e=>e.preventDefault());
win.on('close',e=>{if(closing||testing)return;e.preventDefault();dialog.showMessageBox(win,{type:'question',buttons:['Continuar trabajando','Cerrar'],defaultId:0,cancelId:0,message:'¿Cerrar Control Autónomo?',detail:'Comprueba que has guardado el formulario y que la sincronización ha terminado. Los datos guardados se conservarán.'}).then(r=>{if(r.response===1){closing=true;win.close()}})});
await win.loadURL(p.HOME);
}).catch(e=>{dialog.showErrorBox('Control Autónomo',e.message);app.exit(1)});
app.on('window-all-closed',()=>app.quit());
}
