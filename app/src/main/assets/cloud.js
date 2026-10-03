const $=id=>document.getElementById(id);
function cloudStatus(t){const e=$("syncStatus");if(e)e.textContent=t}
function scheduleSync(){cloudStatus("Guardado solo en este dispositivo")}
function pendiente(){cloudStatus("Guardado solo en este dispositivo");const e=$("authMessage");if(e)e.textContent="La sincronización se configurará con un Firebase independiente antes de publicar."}
function accountAction(){pendiente()} function syncCloud(){pendiente()}
function resolveConflict(){pendiente()} function importGuest(){pendiente()}
async function exportRecovery(){alert("Las copias permanecen en este dispositivo.")}
function initCloud(){if($("authForm"))$("authForm").hidden=true;if($("signedIn"))$("signedIn").hidden=true;pendiente()} initCloud();
