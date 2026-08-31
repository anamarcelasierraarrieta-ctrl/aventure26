# Integraciones externas

Todas las integraciones viven en `backend/src/integrations/` detrás de una interfaz simple, para poder mockearlas en desarrollo y activarlas con variables de entorno en producción.

## WhatsApp Business API

- Archivo: `src/integrations/whatsapp.service.js`
- Variables: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
- Usos: confirmación de cita, recordatorio 24h/1h antes, notificación al estilista.
- En desarrollo (`NODE_ENV=development` sin token), el servicio hace `console.log` del mensaje en vez de llamar a la API — permite probar el flujo completo sin cuenta de WhatsApp Business.

## Google Calendar

- Archivo: `src/integrations/googleCalendar.service.js`
- Variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- Cada estilista conecta su calendario vía OAuth2 (endpoint `GET /api/integrations/google/connect`); las citas creadas/canceladas se sincronizan como eventos.

## Pasarelas de pago (Stripe / PayPal / Nequi / Daviplata)

- Archivo: `src/integrations/payments.service.js`
- El módulo de Ventas registra el método de pago (`CASH`, `CARD_STRIPE`, `PAYPAL`, `NEQUI`, `DAVIPLATA`) y, cuando aplica, delega el cobro al proveedor correspondiente antes de confirmar la venta.
- Variables: `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`/`PAYPAL_SECRET`, `NEQUI_API_KEY`, `DAVIPLATA_API_KEY`.
- Nequi/Daviplata no tienen SDK oficial público estable: se integran vía sus APIs REST de comercios (requiere convenio comercial con el banco); el servicio expone un adaptador (`payments.service.js#chargeNequi`) listo para conectar las credenciales reales.

## Exportación a Excel

- Librería: `exceljs` (no es una integración externa, corre 100% en el backend).
- Cada módulo expone `GET /api/<modulo>/export?...filtros` → devuelve un `.xlsx` descargable con cabeceras, formato de moneda y auto-ancho de columnas.
