# Aventure 26 — App de gestión integral

Sistema modular de ventas por ítems, inventario, personal/operaciones, gastos y agendamiento de citas para la peluquería **Aventure 26**, con identidad visual propia, exportación a Excel y dashboards.

- 📐 Arquitectura completa: [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)
- 🧭 Flujo de usuario: [docs/FLUJO_USUARIO.md](docs/FLUJO_USUARIO.md)
- 🔌 Integraciones (WhatsApp, Google Calendar, pagos): [docs/INTEGRACIONES.md](docs/INTEGRACIONES.md)
- 🖼️ Wireframes navegables: [wireframes/index.html](wireframes/index.html)

## Estructura del repositorio

```
aventure26/
├── backend/     API Node.js + Express + PostgreSQL (Prisma)
├── frontend/    App web React + Vite + Tailwind (identidad Aventure 26)
├── mobile/      Scaffold móvil React Native (Expo)
├── wireframes/  Wireframes HTML navegables (5 pantallas)
└── docs/        Documentación de arquitectura, flujo e integraciones
```

## Puesta en marcha

### 1. Base de datos

Necesitas una instancia de PostgreSQL local o remota. Con Docker:

```bash
docker run --name aventure26-db -e POSTGRES_USER=aventure26 -e POSTGRES_PASSWORD=aventure26 -e POSTGRES_DB=aventure26 -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # ajusta DATABASE_URL y secretos JWT si aplica
npm install
npm run prisma:migrate    # crea las tablas
npm run seed               # carga servicios, personal, productos y usuario demo
npm run dev                 # http://localhost:4000
```

### 3. Frontend web

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxy a /api → :4000)
```

### 4. Móvil (opcional)

```bash
cd mobile
npm install
npm start
```

## Usuario demo

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@aventure26.demo` | `Aventure26!` |
| Estilista | `valentina@aventure26.demo` | `Aventure26!` |
| Estilista | `camila@aventure26.demo` | `Aventure26!` |
| Recepción | `recepcion@aventure26.demo` | `Aventure26!` |

El seed (`npm run seed`) también carga los 10 servicios del catálogo, 6 productos de inventario con su consumo por servicio, 2 clientes, una cita de hoy y una venta/gasto de ejemplo — suficiente para probar el flujo completo: agendar → vender → ver dashboard → exportar a Excel.

## Identidad visual

| Color | Hex | Uso |
|---|---|---|
| Rosado pastel | `#EAC1C1` | Acentos secundarios, fondos suaves |
| Beige claro | `#F8EDEB` | Fondo base (modo claro) |
| Dorado suave | `#D4AF37` | Acento principal, botones, KPIs |
| Blanco neutro | `#FFFFFF` | Superficies/tarjetas |

Tipografía: **Playfair Display** (títulos) + **Lato** (texto). Modo claro/oscuro con transición suave (`ThemeContext` en el frontend, clase `dark` de Tailwind).

## Estado del scaffold

Este repositorio es una base funcional y modular lista para extender, no un producto terminado:

- ✅ Backend con todos los endpoints de los 5 módulos + auth JWT + exportación a Excel real.
- ✅ Frontend web funcional contra la API (login, dashboard con gráficas, ventas, citas con calendario, inventario, personal, gastos).
- ✅ Integraciones de WhatsApp/Google Calendar/pagos en modo "mock" listas para activar con credenciales reales (ver [docs/INTEGRACIONES.md](docs/INTEGRACIONES.md)).
- ✅ Recordatorios automáticos 24h/2h antes de cada cita (`src/jobs/reminders.job.js`, corre cada 15 min vía `node-cron`, arranca junto con el servidor).
- ⚠️ Mobile: scaffold mínimo (login + lista de citas) — falta el flujo completo de agendamiento desde el móvil.
