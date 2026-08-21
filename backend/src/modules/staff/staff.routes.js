const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { z } = require("zod");

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, authorize } = require("../../middleware/auth.middleware");
const { sendExcel } = require("../../utils/excel.util");

router.use(authenticate);

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "RECEPTION", "STYLIST", "ASSISTANT"]).default("STYLIST"),
  commissionRate: z.number().min(0).max(100).default(0),
  password: z.string().min(6).optional(),
});

// GET /api/staff
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const staff = await prisma.user.findMany({
      where: { active: true },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        commissionRate: true, active: true, createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(staff);
  })
);

// GET /api/staff/:id/performance — ventas, comisiones, citas atendidas
router.get(
  "/:id/performance",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sales = await prisma.sale.findMany({ where: { stylistId: id } });
    const appointmentsCompleted = await prisma.appointment.count({
      where: { stylistId: id, status: "COMPLETED" },
    });

    res.json({
      totalVentas: sales.length,
      ingresosGenerados: sales.reduce((s, x) => s + Number(x.total), 0),
      comisionesGeneradas: sales.reduce((s, x) => s + Number(x.commissionAmount), 0),
      citasAtendidas: appointmentsCompleted,
    });
  })
);

// POST /api/staff
router.post(
  "/",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = staffSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password || "aventure26demo", 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        commissionRate: data.commissionRate,
        passwordHash,
      },
    });
    res.status(201).json({ ...user, passwordHash: undefined });
  })
);

// PUT /api/staff/:id
router.put(
  "/:id",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = staffSchema.partial().omit({ password: true }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ ...user, passwordHash: undefined });
  })
);

// DELETE /api/staff/:id — baja lógica
router.delete(
  "/:id",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).end();
  })
);

// GET /api/staff/export
router.get(
  "/export",
  asyncHandler(async (req, res) => {
    const staff = await prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    const rows = staff.map((s) => ({
      nombre: s.name,
      email: s.email,
      telefono: s.phone || "-",
      rol: s.role,
      comision: `${Number(s.commissionRate)}%`,
    }));

    await sendExcel(
      res,
      "personal_aventure26",
      [
        { header: "Nombre", key: "nombre", width: 22 },
        { header: "Email", key: "email", width: 26 },
        { header: "Teléfono", key: "telefono", width: 16 },
        { header: "Rol", key: "rol", width: 14 },
        { header: "Comisión", key: "comision", width: 12 },
      ],
      rows
    );
  })
);

module.exports = router;
