# Flujo de usuario (User Journey)

## 1. Cliente agenda una cita

1. El cliente abre la app (web o móvil) y toca **"Agendar cita"**.
2. El sistema consulta `GET /api/appointments/availability?service=&date=` y muestra el calendario con disponibilidad de cada estilista para el servicio elegido (bloqueando horarios ya ocupados).
3. El cliente selecciona **servicio → fecha → hora → estilista** (opcional, o "cualquiera disponible").
4. Al confirmar, se crea la cita (`POST /api/appointments`, estado `PENDING` → `CONFIRMED`).
5. El backend dispara notificaciones en paralelo:
   - WhatsApp Business API (plantilla de confirmación) vía `integrations/whatsapp.service.js`.
   - Correo electrónico (fallback si no hay WhatsApp) vía `nodemailer`.
   - Evento en Google Calendar del estilista vía `integrations/googleCalendar.service.js`.
6. Un job programado (`cron`, ver `dashboard`/`appointments` module) envía **recordatorios** 24h y 1h antes, a cliente y estilista.

## 2. Estilista atiende y registra el servicio

7. El estilista/recepción abre **Ventas → Registrar Venta**, selecciona los ítems prestados (ej. Balayage + Hidratación), ajusta precios si aplica y confirma.
8. El sistema:
   - Crea `Sale` + `SaleItem[]`.
   - Descuenta automáticamente insumos de **Inventario** según `ServiceProductConsumption` configurado por servicio.
   - Si el stock de un producto cae bajo el mínimo, genera una alerta visible en el Dashboard e Inventario.
   - Marca la cita relacionada (si existía) como `COMPLETED`.
   - Calcula la comisión del estilista según su `commissionRate`.

## 3. Administración revisa reportes

9. El administrador entra al **Dashboard**: ingresos del día/semana/mes, gastos, citas del día, alertas de stock bajo, gráficas de rentabilidad.
10. Desde cualquier módulo (Ventas, Inventario, Personal, Gastos, Citas) puede pulsar **"Exportar a Excel"** para descargar el reporte filtrado (`.xlsx`).
11. En **Gastos**, registra egresos fijos/variables y visualiza la comparación ingresos vs. egresos y el flujo de caja acumulado.

## Diagrama de flujo simplificado

```
Cliente                Backend                         Estilista/Admin
  │  Agendar cita          │                                  │
  ├───────────────────────►│                                  │
  │                        │  Verifica disponibilidad          │
  │                        │  Crea Appointment (PENDING)        │
  │  Confirmación WhatsApp │◄─────────────────────────────────┤
  │◄───────────────────────┤                                  │
  │                        │        Recordatorio 24h/1h antes  │
  │◄───────────────────────┤─────────────────────────────────►│
  │                        │                                  │
  │                        │   Estilista registra venta        │
  │                        │◄─────────────────────────────────┤
  │                        │  Actualiza inventario + comisión   │
  │                        │  Marca cita COMPLETED              │
  │                        │                                  │
  │                        │   Admin exporta reportes Excel     │
  │                        │◄─────────────────────────────────┤
```

## Roles y permisos

| Acción | Cliente | Asistente | Estilista | Recepción | Admin |
|---|---|---|---|---|---|
| Agendar/cancelar su propia cita | ✅ | — | — | ✅ | ✅ |
| Ver agenda de todos | ❌ | ❌ | Solo la propia | ✅ | ✅ |
| Registrar venta | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ver/editar inventario | ❌ | ✅ (consumo) | ❌ | ❌ | ✅ |
| Registrar gastos | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver dashboard financiero | ❌ | ❌ | Solo sus comisiones | ❌ | ✅ |
| Exportar a Excel | ❌ | ❌ | ❌ | Ventas/Citas | Todos |
