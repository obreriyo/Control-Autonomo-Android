const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert/strict");
const root=path.resolve(__dirname,".."),a=path.join(root,"app/src/main/assets"),R=p=>fs.readFileSync(path.join(a,p),"utf8");
for(const n of ["app.js","payments.js","store.js","cloud.js","boot.js","sw.js"])new vm.Script(R(n));
for(const n of fs.readdirSync(a,{recursive:true}).filter(n=>fs.statSync(path.join(a,n)).isFile()))assert.deepEqual(fs.readFileSync(path.join(a,n)),fs.readFileSync(path.join(root,"web",n)));
assert.match(R("index.html"),/Control Autónomo/);
assert.doesNotMatch(R("index.html"),/contabl|accounting/i);
assert.doesNotMatch(R("cloud.js"),/mis-cuentas-pro-b565d/);
assert.match(fs.readFileSync(path.join(root,"app/build.gradle"),"utf8"),/com\.obreriyo\.controlautonomo/);
console.log("OK Control Autónomo");
