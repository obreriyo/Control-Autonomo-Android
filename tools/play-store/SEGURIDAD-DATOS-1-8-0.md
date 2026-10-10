# Seguridad de datos · borrador para revisar

Basado en el código 1.8.0. No se ha presentado a Google. Revisar contra el AAB instalado y la configuración real de Firebase. La sincronización y Pro transmiten datos: no declarar “no se recopilan datos”.

| Datos | Uso | Cuándo se transmiten |
|---|---|---|
| Correo e ID de usuario | Cuenta, autenticación y soporte | Al usar la cuenta o pedir soporte |
| Nombre, teléfono, correo y dirección de clientes/negocio introducidos voluntariamente | Gestión del negocio y recuperación de copia | Al sincronizar esos registros |
| Movimientos, importes, costes de empleados, ventas y cobros | Gestión e informes | Al sincronizar |
| Token, producto, estado y caducidad de suscripción; ID de cuenta seudonimizado | Verificar Pro y restaurar sin duplicar entre cuentas | Al comprar, restaurar o comprobar Pro |
| Mensajes de soporte | Consultas y eliminación | Al enviar el correo |
| IP y datos técnicos tratados por proveedores | Servicio, seguridad y prevención de abuso | Al comunicarse con Firebase, Google Play o páginas públicas |

Revisar las categorías de nombre, correo, ID de usuario, teléfono/dirección, historial de compras y otra información financiera. El token de compra no es el número de tarjeta: la app no recibe números de tarjetas ni claves bancarias.

Modo local no transmite los registros del negocio hasta sincronizar. Cuenta y sincronización son opcionales para Gratis; Pro necesita una cuenta para vincular acceso. Los servicios usan HTTPS. El PIN no cifra las copias JSON exportadas.

No hay anuncios, Analytics ni Crashlytics. Aplicar la definición y las excepciones de proveedores de servicios del formulario al uso de Firebase/Google. No se solicitan GPS, contactos del dispositivo, cámara ni micrófono. El selector del sistema permite escoger una copia o un logo.

Se puede solicitar eliminación desde Ajustes y desde la página pública. Tras verificar al titular se borran cuenta, datos sincronizados y vínculos Pro. Copias locales/archivos exportados requieren borrado del usuario; la suscripción se cancela por separado en Google Play.

Fuente: https://support.google.com/googleplay/android-developer/answer/10787469?hl=es
