const router = require("express").Router();
const { z } = require("zod");

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, authorize } = require("../../middleware/auth.middleware");
const { sendExcel } = require("../../utils/excel.util");

router.use(authenticate);

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  category: z.string().optional(),
  unit: z.string().default("unidad"),
  stock: z.number().nonnegative().default(0),
  minStock: z.number().nonnegative().default(0),
  costPrice: z.number().nonnegative().default(0),
});

// GET /api/inventory — lista con estado de stock
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
    const withStatus = products.map((p) => ({
      ...p,
      lowStock: Number(p.stock) <= Number(p.minStock),
    }));
    res.json(withStatus);
  })
);

// GET /api/inventory/alerts — productos por debajo del mínimo
router.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany();
    const low = products.filter((p) => Number(p.stock) <= Number(p.minStock));
    res.json(low);
  })
);

// GET /api/inventory/consumption — consumo de insumos por servicio (para dashboard)
router.get(
  "/consumption",
  asyncHandler(async (req, res) => {
    const rows = await prisma.inventoryMovement.groupBy({
      by: ["productId"],
      where: { type: "OUT" },
      _sum: { quantity: true },
    });
    const products = await prisma.product.findMany();
    const data = rows.map((r) => ({
      product: products.find((p) => p.id === r.productId)?.name,
      totalConsumido: r._sum.quantity,
    }));
    res.json(data);
  })
);

// POST /api/inventory
router.post(
  "/",
  authorize("ADMIN", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  })
);

// PUT /api/inventory/:id
router.put(
  "/:id",
  authorize("ADMIN", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(product);
  })
);

// POST /api/inventory/:id/movement — ajuste manual de stock (entrada/salida)
router.post(
  "/:id/movement",
  authorize("ADMIN", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const { type, quantity, reason } = z
      .object({ type: z.enum(["IN", "OUT"]), quantity: z.number().positive(), reason: z.string().optional() })
      .parse(req.body);

    const product = await prisma.$transaction(async (tx) => {
      await tx.inventoryMovement.create({
        data: { productId: req.params.id, type, quantity, reason },
      });
      return tx.product.update({
        where: { id: req.params.id },
        data: { stock: { [type === "IN" ? "increment" : "decrement"]: quantity } },
      });
    });

    res.json(product);
  })
);

// GET /api/inventory/export
router.get(
  "/export",
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
    const rows = products.map((p) => ({
      nombre: p.name,
      sku: p.sku,
      categoria: p.category || "-",
      stock: Number(p.stock),
      stockMinimo: Number(p.minStock),
      costo: Number(p.costPrice),
      estado: Number(p.stock) <= Number(p.minStock) ? "BAJO" : "OK",
    }));

    await sendExcel(
      res,
      "inventario_aventure26",
      [
        { header: "Producto", key: "nombre", width: 24 },
        { header: "SKU", key: "sku", width: 14 },
        { header: "Categoría", key: "categoria", width: 16 },
        { header: "Stock", key: "stock", width: 10 },
        { header: "Stock mínimo", key: "stockMinimo", width: 12 },
        { header: "Costo unitario", key: "costo", width: 14, money: true },
        { header: "Estado", key: "estado", width: 10 },
      ],
      rows
    );
  })
);

module.exports = router;
