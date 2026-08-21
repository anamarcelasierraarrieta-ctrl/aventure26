const router = require("express").Router();
const { z } = require("zod");

const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth.middleware");
const { sendExcel } = require("../../utils/excel.util");
const whatsapp = require("../../integrations/whatsapp.service");
const googleCalendar = require("../../integrations/googleCalendar.service");

router.use(authenticate);

const appointmentSchema = z.object({
  clientId: z.string().uuid(),
  stylistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  notes: z.string().optional(),
});

// GET /api/appointments?from=&to=&stylistId=  — vista mensual/semanal
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { from, to, stylistId } = req.query;
    const appointments = await prisma.appointment.findMany({
      where: {
        stylistId: stylistId || undefined,
        startTime: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { client: true, stylist: true, service: true },
      orderBy: { startTime: "asc" },
    });
    res.json(appointments);
  })
);

// GET /api/appointments/availability?serviceId=&date=&stylistId=
router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const { serviceId, date, stylistId } = req.query;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ error: "Servicio no encontrado" });

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const stylists = await prisma.user.findMany({
      where: { role: "STYLIST", active: true, id: stylistId || undefined },
    });

    const busy = await prisma.appointment.findMany({
      where: {
        startTime: { gte: dayStart, lte: dayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
        stylistId: stylistId ? stylistId : { in: stylists.map((s) => s.id) },
      },
    });

    const OPEN_HOUR = 9;
    const CLOSE_HOUR = 19;
    const slotMinutes = service.durationMinutes;

    const availability = stylists.map((stylist) => {
      const slots = [];
      for (let h = OPEN_HOUR * 60; h + slotMinutes <= CLOSE_HOUR * 60; h += slotMinutes) {
        const slotStart = new Date(dayStart.getTime() + h * 60000);
        const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);
        const overlaps = busy.some(
          (b) => b.stylistId === stylist.id && slotStart < b.endTime && slotEnd > b.startTime
        );
        if (!overlaps) slots.push(slotStart.toISOString());
      }
      return { stylistId: stylist.id, stylistName: stylist.name, slots };
    });

    res.json(availability);
  })
);

// POST /api/appointments — agenda + notificaciones + Google Calendar
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = appointmentSchema.parse(req.body);
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) return res.status(404).json({ error: "Servicio no encontrado" });

    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    const appointment = await prisma.appointment.create({
      data: {
        clientId: data.clientId,
        stylistId: data.stylistId,
        serviceId: data.serviceId,
        startTime,
        endTime,
        notes: data.notes,
        status: "CONFIRMED",
      },
      include: { client: true, stylist: true, service: true },
    });

    const [, googleEventId] = await Promise.all([
      whatsapp.sendAppointmentConfirmation(appointment),
      googleCalendar.createEvent(appointment),
    ]);

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { confirmationSent: true, googleEventId: googleEventId || undefined },
    });

    res.status(201).json(appointment);
  })
);

// PATCH /api/appointments/:id/status
router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]) })
      .parse(req.body);
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(appointment);
  })
);

// GET /api/appointments/export?from=&to=
router.get(
  "/export",
  asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined },
      },
      include: { client: true, stylist: true, service: true },
      orderBy: { startTime: "asc" },
    });

    const rows = appointments.map((a) => ({
      fecha: a.startTime.toISOString().slice(0, 10),
      hora: a.startTime.toISOString().slice(11, 16),
      cliente: a.client.name,
      estilista: a.stylist.name,
      servicio: a.service.name,
      estado: a.status,
    }));

    await sendExcel(
      res,
      "citas_aventure26",
      [
        { header: "Fecha", key: "fecha", width: 14 },
        { header: "Hora", key: "hora", width: 10 },
        { header: "Cliente", key: "cliente", width: 22 },
        { header: "Estilista", key: "estilista", width: 20 },
        { header: "Servicio", key: "servicio", width: 22 },
        { header: "Estado", key: "estado", width: 14 },
      ],
      rows
    );
  })
);

module.exports = router;
