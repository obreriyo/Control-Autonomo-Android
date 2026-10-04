const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const values=new Map(),els=new Map();
const element=id=>{if(!els.has(id))els.set(id,{value:'',textContent:'',innerHTML:'',style:{},open:false,remove(){},addEventListener(){},close(){this.open=false}});return els.get(id)};
const ctx=vm.createContext({console,structuredClone,TextEncoder,Blob,crypto:require('crypto').webcrypto,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),key:i=>[...values.keys()][i],get length(){return values.size}},document:{getElementById:element,addEventListener(){},querySelector(){return {}}},navigator:{onLine:true},owner:element('owner'),irpf:element('irpf'),confirm:()=>true,render(){},setTimeout:()=>1,clearTimeout(){},downloadFileCompat:async()=>{},firebase:{initializeApp(){throw Error('Test transport')},firestore:{FieldValue:{serverTimestamp:()=>123}}}});
ctx.window={addEventListener(){}};
vm.runInContext(fs.readFileSync('app/src/main/assets/store.js','utf8'),ctx);
vm.runInContext('let data=CAStore.open(null); function save(){CAStore.save(data);render();}',ctx);
vm.runInContext(fs.readFileSync('app/src/main/assets/cloud.js','utf8'),ctx);
vm.runInContext('authReady=true',ctx);
const browser=fs.readFileSync('tests/browser.cjs','utf8');
let body=browser.split('const results=await page.evaluate(async()=>{')[1].split('\n });')[0].replaceAll('MCPStore','CAStore');
(async()=>{
 const result=await vm.runInContext('(async()=>{'+body+'})()',ctx);assert.equal(result.status,'OK');
 await vm.runInContext(`(async()=>{
 cloudUser={uid:'offline'};CAStore.open('offline');refreshAccountData();data.settings.owner='Offline';save();navigator.onLine=false;await syncCloud(true);if(!CAStore.envelope.dirty)throw Error('Offline data lost');navigator.onLine=true;
 let resetEmail='';auth={sendPasswordResetEmail:async e=>resetEmail=e};$('authEmail').value='test@example.com';await accountAction('reset');if(resetEmail!=='test@example.com')throw Error('Password reset');
 })()`,ctx);
 console.log('OK: uploads, downloads, conflicts, concurrent edits, retries, account isolation, offline storage, password reset',result);
})().catch(e=>{console.error(e);process.exit(1)});
