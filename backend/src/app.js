const express = require("express");
const cors = require("cors");

const { notFound, errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const servicesRoutes = require("./modules/services/services.routes");
const salesRoutes = require("./modules/sales/sales.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");
const staffRoutes = require("./modules/staff/staff.routes");
const expensesRoutes = require("./modules/expenses/expenses.routes");
const appointmentsRoutes = require("./modules/appointments/appointments.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, app: "Aventure 26 API" }));

app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
