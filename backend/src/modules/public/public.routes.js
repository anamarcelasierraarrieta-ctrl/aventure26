// Rutas públicas (sin autenticación) para el auto-agendamiento de clientes,
// al estilo Calendly: ver disponibilidad real y agendar sin hablar con nadie.
const router = require("express").Router();
const { z } = require("zod");

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const whatsapp = require("../../integrations/whatsapp.service");
const googleCalendar = require("../../integrations/googleCalendar.service");
const { getAvailability } = require("../appointments/availability.util");

// GET /api/public/services — catálogo para el widget de agendamiento
router.get(
  "/services",
  asyncHandler(async (req, res) => {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { category: "asc" },
      select: { id: true, name: true, category: true, price: true, durationMinutes: true },
    });
    res.json(services);
  })
);

// GET /api/public/availability?serviceId=&date=
// Devuelve, por horario, qué estilista(s) están libres — así el cliente ve
// "10:00 a. m. — con Camila Torres" sin tener que elegir estilista primero.
router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const { serviceId, date } = req.query;
    if (!serviceId || !date) {
      return res.status(400).json({ error: "serviceId y date son requeridos" });
    }

    const result = await getAvailability({ serviceId, date });
    if (result.error) return res.status(404).json({ error: result.error });

    // Reagrupar de "por estilista -> lista de horas" a "por hora -> lista de estilistas"
    const byTime = new Map();
    for (const { stylistId, stylistName, slots } of result.availability) {
      for (const time of slots) {
        if (!byTime.has(time)) byTime.set(time, []);
        byTime.get(time).push({ stylistId, stylistName });
      }
    }

    const slots = [...byTime.entries()]
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([time, stylists]) => ({ time, stylists }));

    res.json({
      service: { id: result.service.id, name: result.service.name, durationMinutes: result.service.durationMinutes },
      slots,
    });
  })
);

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  stylistId: z.string().uuid(),
  startTime: z.string().datetime(),
  name: z.string().min(2, "Escribe tu nombre completo"),
  phone: z.string().min(7, "Escribe un número de WhatsApp/teléfono válido"),
  email: z.string().email().optional().or(z.literal("")),
});

// POST /api/public/appointments — el cliente agenda directamente, sin login
router.post(
  "/appointments",
  asyncHandler(async (req, res) => {
    const data = bookingSchema.parse(req.body);

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service || !service.active) return res.status(404).json({ error: "Servicio no encontrado" });

    const stylist = await prisma.user.findUnique({ where: { id: data.stylistId } });
    if (!stylist || stylist.role !== "STYLIST" || !stylist.active) {
      return res.status(404).json({ error: "Estilista no disponible" });
    }

    const startTime = new Date(data.startTime);
    if (Number.isNaN(startTime.getTime()) || startTime <= new Date()) {
      return res.status(400).json({ error: "Elige un horario futuro válido" });
    }
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    try {
      const appointment = await prisma.$transaction(async (tx) => {
        // Revalida disponibilidad dentro de la transacción para evitar dobles reservas
        const conflict = await tx.appointment.findFirst({
          where: {
            stylistId: data.stylistId,
            status: { in: ["PENDING", "CONFIRMED"] },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        });
        if (conflict) {
          const err = new Error("SLOT_TAKEN");
          err.code = "SLOT_TAKEN";
          throw err;
        }

        let client = await tx.client.findFirst({ where: { phone: data.phone } });
        if (client) {
          client = await tx.client.update({
            where: { id: client.id },
            data: { name: data.name, email: data.email || client.email },
          });
        } else {
          client = await tx.client.create({
            data: { name: data.name, phone: data.phone, email: data.email || undefined },
          });
        }

        return tx.appointment.create({
          data: {
            clientId: client.id,
            stylistId: data.stylistId,
            serviceId: data.serviceId,
            startTime,
            endTime,
            status: "CONFIRMED",
          },
          include: { client: true, stylist: true, service: true },
        });
      });

      const [, googleEventId] = await Promise.all([
        whatsapp.sendAppointmentConfirmation(appointment),
        googleCalendar.createEvent(appointment),
      ]);

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { confirmationSent: true, googleEventId: googleEventId || undefined },
      });

      res.status(201).json({
        id: appointment.id,
        service: service.name,
        stylist: stylist.name,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      });
    } catch (err) {
      if (err.code === "SLOT_TAKEN") {
        return res.status(409).json({ error: "Ese horario ya no está disponible. Elige otro." });
      }
      throw err;
    }
  })
);

module.exports = router;
