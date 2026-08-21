const router = require("express").Router();
const { z } = require("zod");

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, authorize } = require("../../middleware/auth.middleware");

router.use(authenticate);

// GET /api/services — catálogo de servicios (usado por Ventas y Citas)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const services = await prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    res.json(services);
  })
);

// GET /api/services/clients — listado simple de clientes (para el formulario de citas)
router.get(
  "/clients",
  asyncHandler(async (req, res) => {
    const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
    res.json(clients);
  })
);

const serviceSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  price: z.number().positive(),
  durationMinutes: z.number().int().positive().default(60),
});

// POST /api/services — precios configurables por el admin
router.post(
  "/",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = serviceSchema.parse(req.body);
    const service = await prisma.service.create({ data });
    res.status(201).json(service);
  })
);

// PUT /api/services/:id
router.put(
  "/:id",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = serviceSchema.partial().parse(req.body);
    const service = await prisma.service.update({ where: { id: req.params.id }, data });
    res.json(service);
  })
);

module.exports = router;
