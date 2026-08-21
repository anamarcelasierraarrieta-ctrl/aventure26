const router = require("express").Router();

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, authorize } = require("../../middleware/auth.middleware");

router.use(authenticate, authorize("ADMIN"));

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// GET /api/dashboard/summary — resumen para la pantalla principal
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const today = startOfDay();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [salesToday, salesMonth, expensesMonth, appointmentsToday, lowStock] = await Promise.all([
      prisma.sale.findMany({ where: { date: { gte: today } } }),
      prisma.sale.findMany({ where: { date: { gte: monthStart } } }),
      prisma.expense.findMany({ where: { date: { gte: monthStart } } }),
      prisma.appointment.findMany({
        where: { startTime: { gte: today } },
        include: { client: true, stylist: true, service: true },
        orderBy: { startTime: "asc" },
        take: 20,
      }),
      prisma.product.findMany(),
    ]);

    const ingresosHoy = salesToday.reduce((s, x) => s + Number(x.total), 0);
    const ingresosMes = salesMonth.reduce((s, x) => s + Number(x.total), 0);
    const gastosMes = expensesMonth.reduce((s, x) => s + Number(x.amount), 0);

    res.json({
      ingresosHoy,
      citasHoy: appointmentsToday.length,
      ingresosMes,
      gastosMes,
      utilidadMes: ingresosMes - gastosMes,
      alertasStock: lowStock.filter((p) => Number(p.stock) <= Number(p.minStock)).length,
      proximasCitas: appointmentsToday,
    });
  })
);

// GET /api/dashboard/revenue-series?days=30 — para gráfica de ingresos vs gastos
router.get(
  "/revenue-series",
  asyncHandler(async (req, res) => {
    const days = Number(req.query.days || 30);
    const from = new Date();
    from.setDate(from.getDate() - days);

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({ where: { date: { gte: from } } }),
      prisma.expense.findMany({ where: { date: { gte: from } } }),
    ]);

    const byDay = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { date: key, ingresos: 0, gastos: 0 };
    }
    sales.forEach((s) => {
      const key = s.date.toISOString().slice(0, 10);
      if (byDay[key]) byDay[key].ingresos += Number(s.total);
    });
    expenses.forEach((e) => {
      const key = e.date.toISOString().slice(0, 10);
      if (byDay[key]) byDay[key].gastos += Number(e.amount);
    });

    res.json(Object.values(byDay));
  })
);

module.exports = router;
