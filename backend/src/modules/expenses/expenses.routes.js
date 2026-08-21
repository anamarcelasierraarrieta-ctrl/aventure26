const router = require("express").Router();
const { z } = require("zod");

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, authorize } = require("../../middleware/auth.middleware");
const { sendExcel } = require("../../utils/excel.util");

router.use(authenticate);

const expenseSchema = z.object({
  date: z.string().datetime().optional(),
  category: z.string().min(2),
  description: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(["FIXED", "VARIABLE"]).default("VARIABLE"),
});

function dateRangeFilter(query) {
  const { from, to } = query;
  if (!from && !to) return undefined;
  return { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
}

// GET /api/expenses?from=&to=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const expenses = await prisma.expense.findMany({
      where: { date: dateRangeFilter(req.query) },
      orderBy: { date: "desc" },
    });
    res.json(expenses);
  })
);

// GET /api/expenses/summary?from=&to= — comparación ingresos vs egresos + flujo de caja
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const where = { date: dateRangeFilter(req.query) };
    const [expenses, sales] = await Promise.all([
      prisma.expense.findMany({ where }),
      prisma.sale.findMany({ where }),
    ]);

    const totalIngresos = sales.reduce((s, x) => s + Number(x.total), 0);
    const totalGastos = expenses.reduce((s, x) => s + Number(x.amount), 0);

    res.json({
      totalIngresos,
      totalGastos,
      utilidad: totalIngresos - totalGastos,
      porCategoria: Object.entries(
        expenses.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
          return acc;
        }, {})
      ).map(([category, total]) => ({ category, total })),
    });
  })
);

// POST /api/expenses
router.post(
  "/",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
    });
    res.status(201).json(expense);
  })
);

// DELETE /api/expenses/:id
router.delete(
  "/:id",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

// GET /api/expenses/export
router.get(
  "/export",
  asyncHandler(async (req, res) => {
    const expenses = await prisma.expense.findMany({
      where: { date: dateRangeFilter(req.query) },
      orderBy: { date: "desc" },
    });
    const rows = expenses.map((e) => ({
      fecha: e.date.toISOString().slice(0, 10),
      categoria: e.category,
      descripcion: e.description || "-",
      tipo: e.type === "FIXED" ? "Fijo" : "Variable",
      monto: Number(e.amount),
    }));

    await sendExcel(
      res,
      "gastos_aventure26",
      [
        { header: "Fecha", key: "fecha", width: 14 },
        { header: "Categoría", key: "categoria", width: 18 },
        { header: "Descripción", key: "descripcion", width: 30 },
        { header: "Tipo", key: "tipo", width: 12 },
        { header: "Monto", key: "monto", width: 14, money: true },
      ],
      rows
    );
  })
);

module.exports = router;
