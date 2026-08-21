const router = require("express").Router();
const { z } = require("zod");

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth.middleware");
const { sendExcel } = require("../../utils/excel.util");

router.use(authenticate);

const saleSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  stylistId: z.string().uuid(),
  paymentMethod: z.enum(["CASH", "CARD_STRIPE", "PAYPAL", "NEQUI", "DAVIPLATA"]).default("CASH"),
  appointmentId: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        price: z.number().positive(),
        quantity: z.number().int().positive().default(1),
      })
    )
    .min(1),
});

function dateRangeFilter(query) {
  const { from, to } = query;
  if (!from && !to) return undefined;
  return { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
}

// GET /api/sales?from=&to=  (soporta filtros diario/semanal/mensual desde el frontend)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const sales = await prisma.sale.findMany({
      where: { date: dateRangeFilter(req.query) },
      include: { items: { include: { service: true } }, client: true, stylist: true },
      orderBy: { date: "desc" },
    });
    res.json(sales);
  })
);

// POST /api/sales — registra venta, descuenta inventario y calcula comisión
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = saleSchema.parse(req.body);
    const total = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const stylist = await prisma.user.findUnique({ where: { id: data.stylistId } });
    const commissionAmount = total * (Number(stylist?.commissionRate || 0) / 100);

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          clientId: data.clientId || null,
          stylistId: data.stylistId,
          paymentMethod: data.paymentMethod,
          appointmentId: data.appointmentId || null,
          total,
          commissionAmount,
          items: { create: data.items },
        },
        include: { items: true },
      });

      // Descuenta inventario según consumo configurado por servicio
      for (const item of data.items) {
        const consumptions = await tx.serviceProductConsumption.findMany({
          where: { serviceId: item.serviceId },
        });
        for (const c of consumptions) {
          await tx.product.update({
            where: { id: c.productId },
            data: { stock: { decrement: Number(c.quantityUsed) * item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: c.productId,
              type: "OUT",
              quantity: Number(c.quantityUsed) * item.quantity,
              reason: "Consumo por servicio",
              saleId: created.id,
            },
          });
        }
      }

      if (data.appointmentId) {
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: "COMPLETED" },
        });
      }

      return created;
    });

    res.status(201).json(sale);
  })
);

// GET /api/sales/export?from=&to=
router.get(
  "/export",
  asyncHandler(async (req, res) => {
    const sales = await prisma.sale.findMany({
      where: { date: dateRangeFilter(req.query) },
      include: { items: { include: { service: true } }, client: true, stylist: true },
      orderBy: { date: "desc" },
    });

    const rows = sales.flatMap((s) =>
      s.items.map((i) => ({
        fecha: s.date.toISOString().slice(0, 10),
        cliente: s.client?.name || "Mostrador",
        estilista: s.stylist.name,
        servicio: i.service.name,
        cantidad: i.quantity,
        precio: Number(i.price),
        metodoPago: s.paymentMethod,
      }))
    );

    await sendExcel(
      res,
      "ventas_aventure26",
      [
        { header: "Fecha", key: "fecha", width: 14 },
        { header: "Cliente", key: "cliente", width: 22 },
        { header: "Estilista", key: "estilista", width: 20 },
        { header: "Servicio", key: "servicio", width: 22 },
        { header: "Cantidad", key: "cantidad", width: 10 },
        { header: "Precio", key: "precio", width: 14, money: true },
        { header: "Método de pago", key: "metodoPago", width: 16 },
      ],
      rows
    );
  })
);

module.exports = router;
