'use strict';
const {onRequest}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {GoogleAuth}=require('google-auth-library');
const {createHash}=require('node:crypto');
const {PACKAGE,PRODUCT,subscription}=require('./policy.cjs');
initializeApp();
const db=getFirestore(),googleAuth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/androidpublisher']});
async function play(path,method='GET',body){
 const client=await googleAuth.getClient();
 try{return (await client.request({url:'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'+PACKAGE+'/'+path,method,data:body,timeout:12000})).data}
 catch(e){const status=e.response?.status;if(status===404||status===410)return null;throw e}
}
async function verifyPurchase(uid,token){
 const result=await play('purchases/subscriptionsv2/tokens/'+encodeURIComponent(token));
 if(!result)return {pro:false,expiresAt:0};
 const state=subscription(result,uid);
 const key=createHash('sha256').update(token).digest('hex'),ref=db.collection('billingTokens').doc(key);
 await db.runTransaction(async tx=>{
  const snap=await tx.get(ref);if(snap.exists&&snap.data().uid!==uid)throw Object.assign(Error('Compra vinculada a otra cuenta.'),{status:409});
  tx.set(ref,{uid,purchaseToken:token,updatedAt:FieldValue.serverTimestamp()},{merge:true});
 });
 if(state.acknowledge){
  // Acknowledge only after Google's API has verified this user's entitlement.
  const ack=await play('purchases/subscriptions/'+PRODUCT+'/tokens/'+encodeURIComponent(token)+':acknowledge','POST',{});
  if(ack===null)throw Object.assign(Error('No se pudo confirmar la compra.'),{status:503});
 }
 await db.collection('playAccounts').doc(uid).set({tokenKey:key,updatedAt:FieldValue.serverTimestamp()},{merge:true});
 return state;
}
exports.playEntitlement=onRequest({region:'europe-west1',timeoutSeconds:60,memory:'256MiB',maxInstances:3,invoker:'public'},async(req,res)=>{
 res.set('Cache-Control','no-store');
 if(req.method!=='POST'){res.status(405).json({error:'Usa POST.'});return}
 try{
  const bearer=/^Bearer ([^\s]+)$/.exec(req.get('Authorization')||'');
  if(!bearer)throw Object.assign(Error('Inicia sesión.'),{status:401});
  let user;try{user=await getAuth().verifyIdToken(bearer[1],true)}catch(e){throw Object.assign(Error('Sesión no válida.'),{status:401})}
  const uid=user.uid,body=req.body;
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>k!=='purchaseToken'))throw Object.assign(Error('Petición no válida.'),{status:400});
  if(body.purchaseToken!==undefined&&(typeof body.purchaseToken!=='string'||body.purchaseToken.length<10||body.purchaseToken.length>4096))throw Object.assign(Error('Compra no válida.'),{status:400});
  const grant=await db.collection('proGrants').doc(uid).get();
  if(!body.purchaseToken&&grant.exists&&grant.data().enabled===true&&(!grant.data().expiresAt||grant.data().expiresAt>Date.now())){
   res.json({uid,pro:true,expiresAt:grant.data().expiresAt||Date.now()+86400000});return;
  }
  let state={pro:false,expiresAt:0};
  if(body.purchaseToken)state=await verifyPurchase(uid,body.purchaseToken);
  else{
   const account=await db.collection('playAccounts').doc(uid).get();
   if(account.exists){
    const purchase=await db.collection('billingTokens').doc(account.data().tokenKey).get();
    if(purchase.exists&&purchase.data().uid===uid)state=await verifyPurchase(uid,purchase.data().purchaseToken);
   }
  }
  if(grant.exists&&grant.data().enabled===true&&(!grant.data().expiresAt||grant.data().expiresAt>Date.now()))
   state={pro:true,expiresAt:grant.data().expiresAt||Date.now()+86400000};
  res.json({uid,pro:state.pro,expiresAt:state.expiresAt});
 }catch(e){
  const status=[400,401,403,409,503].includes(e.status)?e.status:503;
  // Never log identity tokens, Google purchase tokens, or the provider's raw response.
  console.error('playEntitlement',status,e.code||e.name||'Error');
  res.status(status).json({error:status===409?'La compra pertenece a otra cuenta.':status===401?'Inicia sesión de nuevo.':'No se pudo verificar la compra.'});
 }
});
