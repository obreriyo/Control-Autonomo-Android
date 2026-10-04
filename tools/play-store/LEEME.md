# Preparación de Control Autónomo para Google Play

Contacto confirmado: raulito-sp@hotmail.com. Versión preparada: 1.0.4 (5).

## Solicitudes de eliminación

La aplicación ofrece una solicitud por correo, no una eliminación automática. Debes atender la bandeja de soporte y completar cada solicitud en un plazo de 30 días. No solicites contraseñas ni documentos financieros.

1. Verifica la titularidad mediante una respuesta desde el correo registrado. Si el mensaje procede de otro correo, pide confirmación al correo registrado antes de borrar nada. No uses solo un UID proporcionado en el mensaje.
2. Localiza el usuario en Firebase Authentication del proyecto `control-autonomo`. Anota su UID exacto. Comprueba con el titular que comprende que sus datos sincronizados se borrarán definitivamente y que ha exportado lo que desea conservar.
3. Elimina el usuario de Authentication. Espera al menos 75 minutos antes del borrado final de Firestore: los tokens ya emitidos pueden vivir aproximadamente una hora y un dispositivo antiguo podría escribir con uno de ellos.
4. Elimina TODO el árbol `users/UID` de Firestore, incluidas las subcolecciones. No basta borrar un documento padre. Con Firebase CLI autenticada como administrador, sustituye UID por el valor comprobado y ejecuta `firebase firestore:delete users/UID --recursive --project control-autonomo`. Revisa la ruta y confirma solo esa cuenta.
5. Comprueba que ya no existen ni el usuario de Authentication ni documentos/subcolecciones bajo ese UID. Confirma la eliminación por correo. Indica al titular que borre las copias locales en los ajustes de Android de cada dispositivo y las exportaciones que ya no desee conservar. No borres datos de otras cuentas.
6. Elimina después los mensajes de soporte cuando se cierre la solicitud, salvo obligación legal comunicada. Los sistemas internos de Firebase tienen sus propios plazos de purga, explicados en la privacidad.

## Páginas públicas

Activa GitHub Pages desde la rama `main` y la carpeta `/docs`. Verifica, sin iniciar sesión, que cargan:

- https://obreriyo.github.io/Control-Autonomo-Android/privacidad.html
- https://obreriyo.github.io/Control-Autonomo-Android/eliminar-cuenta.html

Estos enlaces están previstos: todavía deben publicarse y comprobarse. No los declares operativos en Play Console hasta hacerlo. La privacidad también se puede consultar sin conexión desde Ajustes de la app.

## Clave de carga y AAB

El flujo `publicar-play-store.yml` se detendrá hasta configurar una clave de carga privada. No uses la firma debug para publicar ni guardes contraseñas o archivos JKS en el repositorio.

En un equipo de confianza con Java, genera una clave mediante `keytool -genkeypair -keystore control-autonomo-upload.jks -alias upload -keyalg RSA -keysize 3072 -validity 10000`. Introduce la contraseña de forma interactiva. Conserva una copia privada del JKS y su contraseña. Configura los secretos de GitHub `PLAY_KEYSTORE_BASE64` (JKS convertido a base64), `PLAY_STORE_PASSWORD`, `PLAY_KEY_ALIAS` (`upload`) y `PLAY_KEY_PASSWORD`.

El flujo valida el código, compila `bundleRelease`, comprueba la firma y publica únicamente el AAB como artefacto. El JKS temporal se elimina al terminar. No se sube nada automáticamente a Google Play.

La firma de Google Play puede ser distinta de la APK debug instalada. Exporta antes tus datos de pruebas; no prometas una actualización directa de la APK debug a Play sin comprobar los certificados.

## Comprobaciones antes de publicar

- Compilar en GitHub la APK 1.0.4 y probar login, ojo, recuperación, modo local, PDF, copias y restauración.
- Probar sincronización real entre dos dispositivos, incluidos conflictos y cambios sin conexión.
- Probar Atrás y barras del sistema en Android 16 y en el móvil actual.
- Probar Privacidad, solicitud por correo y alternativa si no hay app de correo. Abrir el correo no equivale a enviar una solicitud.
- Probar el procedimiento de borrado con una cuenta de prueba y verificar que no afecta a otra cuenta.
- Publicar las páginas, generar AAB firmado, completar ficha, seguridad de datos, clasificación y acceso para revisión.
- Crear y verificar Play Console. Para cuenta personal nueva: prueba cerrada con 12 participantes inscritos 14 días consecutivos y solicitud de acceso a producción.

## Seguridad de datos: borrador para revisar en Play Console

La sincronización transmite datos; no declarar «no se recopilan datos». El registro y la nube son opcionales porque existe modo local.

- Información personal: correo e ID de usuario; nombre si se introduce un nombre personal en el campo negocio. Funcionalidad, gestión de cuentas y soporte.
- Información financiera: movimientos, ingresos/gastos e importes de caja/banco que el usuario sincroniza. Revisar «Otra información financiera» y, cuando corresponda a compras registradas, «Historial de compras».
- Mensajes: consultas enviadas voluntariamente al correo de soporte. Atención al usuario.
- Firebase procesa IP y user-agent para seguridad y prevención de abuso. Consultar la documentación vigente del proveedor y el formulario; no declarar acceso a ubicación GPS ni publicidad que esta versión no utiliza.
- No hay SDK de anuncios, Analytics o Crashlytics en esta versión. Firebase es proveedor de autenticación/almacenamiento; revisar la excepción de proveedores de servicios antes de responder la pregunta sobre compartir datos.
- HTTPS para Firebase, opción de solicitar eliminación de cuenta, datos y copias sincronizadas; los archivos exportados y las copias en otros dispositivos requieren acción del titular.

No es un formulario ya presentado ni una aprobación de Google. Revisar categorías contra el AAB final y su comportamiento.
