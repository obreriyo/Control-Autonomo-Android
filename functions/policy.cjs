'use strict';
const {createHash}=require('node:crypto');
const PACKAGE='com.obreriyo.controlautonomo',PRODUCT='control_autonomo_pro',BASE_PLAN='anual';
const accountHash=uid=>createHash('sha256').update(uid,'utf8').digest('hex');
function subscription(data,uid,now=Date.now()){
 const account=data.externalAccountIdentifiers?.obfuscatedExternalAccountId;
 if(account!==accountHash(uid))throw Object.assign(Error('Compra vinculada a otra cuenta.'),{status:409});
 const lines=(data.lineItems||[]).filter(x=>x.productId===PRODUCT&&x.offerDetails?.basePlanId===BASE_PLAN);
 const expiry=Math.max(0,...lines.map(x=>Date.parse(x.expiryTime)||0));
 const active=['SUBSCRIPTION_STATE_ACTIVE','SUBSCRIPTION_STATE_IN_GRACE_PERIOD','SUBSCRIPTION_STATE_CANCELED'].includes(data.subscriptionState)&&expiry>now;
 return {pro:active,expiresAt:active?expiry:0,acknowledge:active&&data.acknowledgementState==='ACKNOWLEDGEMENT_STATE_PENDING'};
}
module.exports={PACKAGE,PRODUCT,BASE_PLAN,accountHash,subscription};
