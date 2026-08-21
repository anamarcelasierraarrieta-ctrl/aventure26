# Aventure 26 — Mobile (Expo)

Scaffold mínimo de la app móvil para **clientes y estilistas**, comparte la misma API REST que el frontend web (`backend/`).

Incluye:
- `LoginScreen` — autenticación JWT (mismo endpoint `/api/auth/login`).
- `AppointmentsScreen` — lista de próximas citas del usuario autenticado.

## Cómo extender

Este scaffold cubre la base de navegación y el cliente API; para llegar a una app completa agrega, siguiendo el mismo patrón:
- `BookingScreen` (flujo de agendamiento — reutiliza `GET /api/appointments/availability`).
- `ServicesScreen` (catálogo — `GET /api/services`).
- Notificaciones push (Expo Notifications) como complemento a los recordatorios de WhatsApp.

## Ejecutar

```bash
cd mobile
npm install
npm start
```

Requiere la app **Expo Go** en el teléfono, o un emulador Android/iOS configurado. Ajusta `apiUrl` en `app.json` → `expo.extra` si el backend no corre en `localhost:4000`.
