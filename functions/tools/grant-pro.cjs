'use strict';
// Run only with administrator credentials, never in an app or browser.
const {initializeApp}=require('firebase-admin/app'),{getAuth}=require('firebase-admin/auth'),{getFirestore,FieldValue}=require('firebase-admin/firestore');
initializeApp({projectId:'control-autonomo'});
(async()=>{
 const emails=process.argv.slice(2);if(emails.length!==2||emails.some(x=>!x.includes('@')))throw Error('Indica los dos correos de acceso: Raúl y su mujer.');
 const users=await Promise.all(emails.map(email=>getAuth().getUserByEmail(email)));
 if(users[0].uid===users[1].uid)throw Error('Indica dos cuentas diferentes.');
 const batch=getFirestore().batch();for(const user of users)batch.set(getFirestore().collection('proGrants').doc(user.uid),{enabled:true,expiresAt:0,reason:'Acceso personal autorizado',updatedAt:FieldValue.serverTimestamp()});
 await batch.commit();console.log('Acceso personal Pro configurado para las dos cuentas.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
