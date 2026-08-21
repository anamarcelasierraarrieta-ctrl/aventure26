# Arquitectura — Aventure 26 App

## Visión general

Sistema integral de gestión para la peluquería **Aventure 26**: ventas por ítem, inventario, personal/operaciones, gastos y agendamiento de citas, con exportación a Excel y dashboards visuales.

```
┌─────────────────────┐     ┌─────────────────────┐
│   Frontend Web       │     │   Frontend Móvil     │
│   React + Vite       │     │   React Native/Expo  │
│   (staff/admin)       │     │   (clientes/staff)   │
└──────────┬───────────┘     └──────────┬───────────┘
           │            REST/JSON + JWT              │
           └──────────────────┬──────────────────────┘
                               │
                     ┌─────────▼─────────┐
                     │   API Backend      │
                     │   Node.js/Express  │
                     │   (modular)        │
                     └─────────┬─────────┘
                               │ Prisma ORM
                     ┌─────────▼─────────┐
                     │   PostgreSQL       │
                     └────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
      ┌─────▼─────┐   ┌────────▼───────┐   ┌───────▼───────┐
      │ WhatsApp   │   │ Google Calendar│   │ Stripe/PayPal │
      │ Business   │   │                │   │ Nequi/Daviplata│
      │ API        │   │                │   │               │
      └────────────┘   └────────────────┘   └───────────────┘
```

## Decisiones técnicas

| Área | Elección | Alternativa contemplada | Motivo |
|---|---|---|---|
| Backend | Node.js + Express | Django | Mismo lenguaje que el frontend (JS/TS), ecosistema npm para Excel/WhatsApp/Calendar, más liviano para un equipo pequeño |
| Base de datos | PostgreSQL + Prisma ORM | MongoDB | Los datos son altamente relacionales (ventas↔servicios↔inventario↔citas↔personal); PostgreSQL da integridad referencial y reportes agregados más simples |
| Frontend web | React + Vite + Tailwind | — | Rápido, HMR, fácil theming con variables CSS para modo claro/oscuro |
| Frontend móvil | React Native (Expo) | — | Comparte lógica de API y tipos con el frontend web |
| Auth | JWT (access + refresh) | Sesiones | Stateless, apto para web + móvil |
| Exportación | `exceljs` | `xlsx` | Mejor soporte de estilos/formatos en archivos .xlsx generados en backend |

> Este repositorio implementa la variante Node.js/PostgreSQL. Si el equipo prefiere Django/MongoDB, el mismo modelo de dominio (ver `prisma/schema.prisma`) se traduce 1:1 a modelos de Django/Mongoose — la carpeta `src/modules/*` mantiene la separación necesaria para portar el backend sin tocar el frontend.

## Estructura de carpetas

```
aventure26/
├── backend/                 # API Node.js/Express
│   ├── prisma/schema.prisma # Modelo de datos
│   ├── prisma/seed.js       # Datos demo
│   └── src/
│       ├── modules/         # 1 carpeta por módulo funcional (rutas + controlador + reglas)
│       │   ├── auth/
│       │   ├── sales/
│       │   ├── inventory/
│       │   ├── staff/
│       │   ├── expenses/
│       │   ├── appointments/
│       │   └── dashboard/
│       ├── integrations/    # WhatsApp, Google Calendar, pasarelas de pago
│       ├── middleware/       # auth JWT, manejo de errores
│       └── utils/           # exportación a Excel, helpers
├── frontend/                 # App web React
│   └── src/
│       ├── pages/            # 1 página por módulo
│       ├── components/       # layout + UI reutilizable
│       └── context/          # Auth + Theme (claro/oscuro)
├── mobile/                   # App móvil React Native (Expo) — cliente + estilistas
├── wireframes/                # Wireframes HTML navegables (sustituto ligero de Figma)
└── docs/                      # Este documento + flujo de usuario + integraciones
```

## Módulos funcionales → entidades de datos

- **Ventas por ítems** → `Sale`, `SaleItem`, `Service`
- **Inventario** → `Product`, `InventoryMovement`, `ServiceProductConsumption`
- **Personal/Operaciones** → `User` (rol STYLIST/ASSISTANT), `Appointment` (agenda), comisiones calculadas sobre `Sale`
- **Gastos** → `Expense`
- **Agendamiento** → `Appointment`, integraciones `WhatsApp` y `GoogleCalendar`

## Seguridad

- JWT firmado (access token 15 min + refresh token 7 días).
- Contraseñas con `bcrypt` (12 rounds).
- Middleware de autorización por rol (`ADMIN`, `RECEPTION`, `STYLIST`, `ASSISTANT`).
- Variables sensibles (claves API, secretos JWT) sólo en `.env`, nunca en código.
- Validación de entrada en cada endpoint (`zod`).

## Exportación a Excel

Cada módulo expone `GET /api/<modulo>/export` que genera un `.xlsx` en memoria con `exceljs` y lo devuelve como descarga (`Content-Disposition: attachment`). Ver `src/utils/excel.util.js`.
