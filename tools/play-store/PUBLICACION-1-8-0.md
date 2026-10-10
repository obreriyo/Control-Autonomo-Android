# Control Autónomo 1.8.0: publicación

Paquete: `com.obreriyo.controlautonomo`. Versión `1.8.0` (40). Android objetivo: 16 / API 36.

El código incorpora las compras reales, pero estas requieren configurar Google Play y desplegar el servidor. No se ha enviado ninguna versión a producción.

## Suscripción que hay que crear en Play Console

| Campo | Valor |
|---|---|
| ID de suscripción | `control_autonomo_pro` |
| ID del plan base | `anual` |
| Renovación | Automática, anual |
| Precio provisional acordado para España | 5,99 € al año |
| ID de oferta | `prueba-7-dias` |
| Prueba | Una fase gratuita de 7 días para nuevos suscriptores |

Activa el plan y la oferta y configura países/precios regionales. La app muestra el precio y la oferta que devuelve Google, incluida la renovación. Si el usuario no tiene derecho a la prueba, muestra el plan anual normal. La compra requiere iniciar sesión en Control Autónomo.

## Servidor: requiere acceso del propietario

El servidor está en `functions/` y se despliega en Firebase `control-autonomo`. Cloud Functions requiere el plan Blaze: revisa la facturación en tu cuenta antes de activarlo. No se ha activado ni contratado ese plan aquí.

1. Habilita Google Play Android Developer API en Google Cloud.
2. Identifica la cuenta de servicio del entorno de la función. En Play Console → Usuarios y permisos, dale acceso a esta app y los permisos necesarios para consultar información financiera y gestionar pedidos/suscripciones. No metas una clave de administrador en el APK ni en GitHub.
3. En un equipo con Firebase CLI, inicia sesión como administrador del proyecto y ejecuta `npm ci --prefix functions`.
4. Ejecuta `firebase deploy --project control-autonomo --only functions:playEntitlement,firestore:rules`.
5. Comprueba el endpoint `https://europe-west1-control-autonomo.cloudfunctions.net/playEntitlement` y una compra de licencia desde la instalación de Google Play. Un POST sin sesión debe responder 401; eso por sí solo no demuestra que la API de compras esté autorizada.

El servidor verifica la sesión Firebase y la compra con Google antes de conceder Pro y reconocerla. Comprueba producto, plan, estado, caducidad y el identificador seudonimizado de la cuenta. No se conceden compras pendientes, pausadas, suspendidas o vencidas. Cancelar la renovación mantiene el periodo pagado. Los clientes no pueden escribir permisos Pro. El permiso sin conexión dura como máximo 24 horas desde la última verificación, limitado por la caducidad conocida.

### Acceso gratuito para Raúl y su mujer

El script `functions/tools/grant-pro.cjs` requiere los dos correos reales de acceso. Con credenciales administrativas del proyecto, ejecuta `node functions/tools/grant-pro.cjs CORREO_RAUL CORREO_MUJER`. Comprueba antes que son vuestras cuentas. No hay UID ni correos inventados en la implementación.

La APK debug conserva la vista de pruebas y la firma fija. El APK de Play carece del interruptor de acceso Pro simulado.

## Firma y AAB

Se reutiliza la clave de subida de `Control-Autonomo-Preparar-Google-Play.zip`. No publiques ese ZIP ni `firma-google-play.txt`.

Para aplicar este paquete, sube el archivo `android.yml` entregado a `.github/workflows/android.yml`, sustituyendo el anterior. En Actions ejecuta «Preparar Control Autónomo 1.8.0 para Google Play». El archivo aplica el código, lo comprueba y guarda los cambios en el repositorio. Requiere permiso de escritura para Actions; si GitHub lo bloquea, no se habrán guardado los cambios. A partir de esta versión usa este flujo para compilar; los flujos de correcciones antiguas pueden volver a escribir código anterior.

Para compilar otro AAB, configura en GitHub el secreto `ANDROID_PLAY_SIGNING_JSON` con el contenido completo de `firma-google-play.txt`. El flujo verifica y genera el AAB firmado, sin subirlo a Play. Conserva `ANDROID_DEBUG_KEYSTORE_BASE64` para las actualizaciones de tus APK de pruebas. Sin esos secretos, el flujo aplica y verifica el código y omite los archivos que necesitan firma.

Si ya subiste código 40 a Play Console, aumenta `versionCode` antes de otra subida. Play App Signing puede utilizar un certificado distinto al APK de GitHub: exporta tus datos y comprueba la transición antes de desinstalar nada.

## Privacidad, eliminación y ficha

`FICHA.md` y `recursos/` contienen los textos y gráficos. Las páginas públicas e integradas incluyen las funciones actuales y la verificación de compras. La eliminación sigue siendo una solicitud por correo a `raulito-sp@hotmail.com`: el usuario debe enviar el mensaje y el responsable debe atenderlo.

El procedimiento administrativo del `LEEME.md` también debe borrar `playAccounts/UID`, `proGrants/UID` y los documentos `billingTokens` cuyo campo `uid` corresponda al titular, además del usuario Auth y todo `users/UID`. Verifica el correo y no borres datos de otras cuentas. Eliminar la cuenta aquí no cancela una suscripción de Google Play; el usuario debe cancelar allí la renovación. Google mantiene sus propios registros de pago.

Los enlaces públicos estaban operativos antes de la actualización. La actualización pública sigue pendiente: un commit hecho por Actions con `GITHUB_TOKEN` no inicia por sí solo la publicación desde una rama. Para publicar las páginas actualizadas, selecciona GitHub Actions en Settings → Pages y ejecuta el nuevo `android.yml` marcando «Publicar privacidad». Comprueba que la página pública incluye “Suscripción Pro”. GitHub ha bloqueado guardar cambios desde esta conexión.

## Prueba final desde la instalación de Google Play

| Prueba | Resultado que hay que comprobar |
|---|---|
| Gratis | Ingresos/gastos, caja, exportación/restauración de copia y cifras correctas |
| Cuenta | Login, recuperación y sincronización real entre dos dispositivos |
| Compra de licencia | Precio, 7 días cuando procedan, permiso Pro y reconocimiento de compra |
| Cancelación del diálogo / pago pendiente | No activar Pro |
| Restauración | Misma cuenta restaura; otra cuenta no recibe esa compra |
| PDF | Generar, guardar, abrir e imprimir; cifras y logo correctos |
| Caducidad / cancelar renovación | Mantener periodo pagado y volver a Gratis al terminar, conservando datos |
| Android | Atrás, teclado, rotación y barras en móvil actual y Android 16 |
| Eliminación | Tramitar una cuenta de prueba sin afectar a otra |

Las pruebas automáticas comprueban interfaz y política del servidor; no acreditan compra, despliegue ni instalación física. Estos pasos del propietario siguen pendientes. Completa también la prueba cerrada que solicite Play Console antes de producción.

Referencias oficiales: https://developer.android.com/google/play/billing/integrate · https://developer.android.com/google/play/billing/security · https://support.google.com/googleplay/android-developer/answer/13327111?hl=es
