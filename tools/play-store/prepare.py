from pathlib import Path
import re

root = Path('.')
assets = root / 'app/src/main/assets'
email = 'raulito-sp@hotmail.com'
privacy = '''<h2>Privacidad de Control Autónomo</h2><p>Actualizada: 4 de octubre de 2026.</p>
<p>Responsable: Raúl Sánchez Perea. Contacto: raulito-sp@hotmail.com.</p>
<h3>Datos y finalidad</h3><p>En modo local, los movimientos, caja/banco, nombre del negocio y ajustes se guardan en este dispositivo. Al crear una cuenta, Firebase Authentication gestiona el correo, las credenciales y el identificador de usuario. Al sincronizar, Firebase Cloud Firestore almacena tus movimientos, importes, conceptos, fechas, ajustes y revisiones para recuperar tu copia y usarla en otros dispositivos.</p>
<p>La cuenta y la sincronización son opcionales. Tratamos estos datos para prestar el servicio que solicitas. Los mensajes de soporte se utilizan para atender tu consulta y comprobar la titularidad de una cuenta cuando solicitas su eliminación.</p>
<h3>Proveedores y seguridad</h3><p>Usamos Firebase, de Google, para autenticación y almacenamiento. La base de datos de este proyecto está configurada en Europa (eur3). Firebase Authentication se presta desde Estados Unidos; las transferencias internacionales se rigen por las condiciones y garantías aplicables de Google. Firebase también trata direcciones IP y datos técnicos del navegador o dispositivo para prestar el servicio y prevenir abusos. Las comunicaciones con Firebase utilizan HTTPS. No incorporamos anuncios ni el SDK de Google Analytics a esta versión.</p>
<p>La copia local se guarda en el almacenamiento de la aplicación; el PIN opcional es un bloqueo de acceso, no cifra los archivos. Protege tu dispositivo y las copias JSON o PDF que exportes. No incluyas información sensible de terceros en los conceptos si no es necesaria.</p>
<p>Las páginas públicas de soporte y privacidad previstas se alojarán en GitHub Pages, cuyo proveedor puede registrar datos técnicos de las visitas, como la dirección IP, para servir las páginas y proteger su infraestructura.</p>
<h3>Conservación y eliminación</h3><p>Los datos sincronizados permanecen hasta que solicites su eliminación. Puedes solicitar borrar la cuenta y todos sus datos de la nube escribiendo desde el correo de la cuenta a raulito-sp@hotmail.com con el asunto «Eliminar cuenta Control Autónomo». Verificaremos la titularidad y atenderemos la solicitud en un plazo de 30 días, salvo que exista una obligación legal de conservación, que te explicaremos.</p>
<p>La solicitud se atiende manualmente. Abrir el correo o cerrar sesión no elimina datos. Los archivos que hayas exportado, compartido o guardado en otros dispositivos no se borran a distancia. Para eliminar las copias locales, borra el almacenamiento de la app en los ajustes de Android en cada dispositivo y elimina los archivos exportados que ya no quieras conservar.</p>
<p>Según la documentación de Firebase, los registros de IP de Authentication se conservan unas semanas y la eliminación de información de autenticación de sus sistemas activos y copias internas puede tardar hasta 180 días después de solicitar el borrado. Los mensajes de soporte se conservan mientras se gestiona la consulta o solicitud y se eliminan después de cerrarla, salvo una obligación legal que te comunicaremos.</p>
<h3>Tus derechos</h3><p>Puedes solicitar acceso, rectificación, supresión, portabilidad, oposición o limitación escribiendo al correo de contacto. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos. Puedes exportar tus datos desde Ajustes. La app no está dirigida a menores.</p>'''
delete = '''<h2>Eliminar cuenta y datos de Control Autónomo</h2><p>Puedes solicitarlo aunque hayas desinstalado la aplicación.</p>
<ol><li>Escribe desde el correo asociado a tu cuenta a <strong>raulito-sp@hotmail.com</strong>.</li><li>Usa el asunto <strong>Eliminar cuenta Control Autónomo</strong> y confirma que deseas borrar la cuenta y sus datos sincronizados.</li><li>Verificaremos que eres su titular y te confirmaremos la eliminación. El plazo de atención es de 30 días, salvo una obligación legal de conservación que te explicaremos.</li></ol>
<p>Se eliminan el usuario de Firebase Authentication y sus datos de Firestore: movimientos, caja/banco, nombre del negocio, ajustes y copias sincronizadas asociadas. La solicitud se atiende manualmente: preparar o enviar el correo no produce un borrado automático.</p>
<p>No envíes tu contraseña, documentos financieros ni copias de seguridad. No necesitas pagar ni reinstalar la app. Exporta antes lo que quieras conservar: la eliminación de la nube es definitiva.</p>
<p>Los archivos exportados y las copias locales en tus dispositivos no se borran a distancia. Después de la confirmación, borra el almacenamiento de la app desde los ajustes de Android en cada dispositivo y elimina los archivos exportados que no desees conservar.</p>
<p><a class="button" href="mailto:raulito-sp@hotmail.com?subject=Eliminar%20cuenta%20Control%20Aut%C3%B3nomo">Preparar correo de solicitud</a></p><p>Si el botón no abre tu correo, escribe manualmente a la dirección indicada. Debes enviar el mensaje para completar la solicitud.</p>'''
style = 'body{font:17px/1.6 system-ui,sans-serif;margin:0;background:#f7f8fb;color:#141820}main{max-width:760px;margin:auto;padding:24px}a{color:#075eae;overflow-wrap:anywhere}.button{display:inline-block;padding:12px 18px;border-radius:12px;background:#1477f8;color:white}h1,h2,h3{line-height:1.25}nav{display:flex;gap:20px;flex-wrap:wrap}p,li{overflow-wrap:anywhere}'
def page(title, body):
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+style+'</style></head><body><main><h1>Control Autónomo</h1><nav><a href="privacidad.html">Privacidad</a><a href="eliminar-cuenta.html">Eliminar cuenta</a></nav>'+body+'</main></body></html>'
docs = root/'docs'
docs.mkdir(exist_ok=True)
(docs/'privacidad.html').write_text(page('Privacidad · Control Autónomo',privacy))
(docs/'eliminar-cuenta.html').write_text(page('Eliminar cuenta · Control Autónomo',delete))
(docs/'index.html').write_text(page('Control Autónomo · Soporte','<h2>Soporte</h2><p>Contacta con raulito-sp@hotmail.com para consultas sobre la aplicación.</p>'))
(docs/'.nojekyll').write_text('')

p=assets/'index.html';s=p.read_text()
if 'id="privacyDialog"' not in s:
    marker='<div class="section">Aplicación</div>'
    if marker not in s: raise SystemExit('No se encuentra la sección Aplicación.')
    s=s.replace(marker,marker+'<button class="secondary" type="button" onclick="document.getElementById(\'privacyDialog\').showModal()">Privacidad y contacto</button><button class="secondary" type="button" onclick="document.getElementById(\'deleteAccountDialog\').showModal()">Solicitar eliminación de cuenta y datos</button>',1)
    dialogs=''
    for ident,body in [('privacyDialog',privacy),('deleteAccountDialog',delete)]:
        dialogs+='<dialog id="'+ident+'" aria-label="'+('Privacidad' if ident=='privacyDialog' else 'Eliminar cuenta y datos')+'" style="border:0;border-radius:22px;width:min(92%,700px);padding:22px;max-height:85vh;overflow:auto">'+body+'<button class="secondary" type="button" onclick="this.closest(\'dialog\').close()">Cerrar</button></dialog>'
    s=s.replace('</body>',dialogs+'</body>')
    s=s.replace('</style>', '.app dialog p,.app dialog li,dialog p,dialog li{font-size:15px;line-height:1.6;overflow-wrap:anywhere}dialog a{color:#075eae;overflow-wrap:anywhere}</style>',1)
for ident,body in [('privacyDialog',privacy),('deleteAccountDialog',delete)]:
    pattern = r'(<dialog id="'+ident+r'"[^>]*>).*?(<button class="secondary" type="button" onclick="this.closest.*?</dialog>)'
    s=re.sub(pattern,lambda m:m.group(1)+body+m.group(2),s,flags=re.S)
s=s.replace('1.0.3','1.0.4');p.write_text(s)
p=assets/'sw.js';p.write_text(p.read_text().replace('v1.0.3','v1.0.4'))

p=root/'app/src/main/java/com/miscuentas/pro/MainActivity.java';s=p.read_text()
marker='                String url = request.getUrl().toString();'
if 'mailto:raulito-sp@hotmail.com' not in s:
    if marker not in s: raise SystemExit('No se encuentra la navegación de Android.')
    s=s.replace(marker,marker+'''
                if (request.isForMainFrame() && (url.equals("mailto:raulito-sp@hotmail.com") || url.startsWith("mailto:raulito-sp@hotmail.com?"))) {
                    try {
                        startActivity(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)));
                    } catch (android.content.ActivityNotFoundException e) {
                        new AlertDialog.Builder(MainActivity.this)
                            .setMessage("Escribe a raulito-sp@hotmail.com desde tu correo. Asunto: Eliminar cuenta Control Autónomo.")
                            .setPositiveButton("Aceptar", null).show();
                    }
                    return true;
                }
''',1)
# Android 16 no longer dispatches the legacy Activity.onBackPressed override.
marker='        setContentView(webView);'
if 'registerOnBackInvokedCallback' not in s:
    s=s.replace(marker,marker+'''
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                this::onBackPressed
            );
        }
''',1)
marker='"(function(){var o=document.getElementById(\'pdfPreviewOverlay\');"'
if 'dialog[open]' not in s:
    if marker not in s: raise SystemExit('No se encuentra el botón Atrás.')
    s=s.replace(marker,'"(function(){var d=document.querySelector(\'dialog[open]\');if(d){d.close();return \'preview\';}var o=document.getElementById(\'pdfPreviewOverlay\');"',1)
p.write_text(s)
# Prevent Android cloud backup from copying financial data or login sessions.
p=root/'app/src/main/AndroidManifest.xml';p.write_text(p.read_text().replace('android:allowBackup="true"','android:allowBackup="false"'))
p=root/'app/build.gradle';s=p.read_text();s=s.replace('versionCode 4','versionCode 5').replace("versionName '1.0.3'","versionName '1.0.4'")
if 'PLAY_STORE_FILE' not in s:
    s+='''
// Upload-key credentials come from the build environment, never from git.
android {
    signingConfigs {
        release {
            if (System.getenv('PLAY_STORE_FILE')) {
                storeFile file(System.getenv('PLAY_STORE_FILE'))
                storePassword System.getenv('PLAY_STORE_PASSWORD')
                keyAlias System.getenv('PLAY_KEY_ALIAS')
                keyPassword System.getenv('PLAY_KEY_PASSWORD')
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            debuggable false
        }
    }
}
'''
p.write_text(s)
p=root/'.gitignore';s=p.read_text() if p.exists() else ''
for line in ['*.jks','*.keystore']:
    if line not in s:s+='\n'+line+'\n'
p.write_text(s)
