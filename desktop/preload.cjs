const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('DesktopBridge',{saveFile:(data,name)=>ipcRenderer.invoke('ca:save',data,name),print:()=>ipcRenderer.invoke('ca:print'),whatsapp:(phone,message)=>ipcRenderer.invoke('ca:whatsapp',phone,message)});
