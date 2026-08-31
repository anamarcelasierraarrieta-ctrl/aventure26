const prisma = require("../../config/prisma");

const OPEN_HOUR = 9;
const CLOSE_HOUR = 19;

// Aventure 26 opera en hora de Colombia (America/Bogota, UTC-5 todo el año,
// sin horario de verano). El servidor corre en UTC (Railway), así que el
// horario comercial 9am-7pm debe fijarse con este offset explícito — de lo
// contrario "las 9am" terminan siendo las 9am UTC (4am en Bogotá).
const SALON_UTC_OFFSET = "-05:00";

/**
 * Calcula los horarios disponibles de cada estilista (o de uno en particular)
 * para un servicio y una fecha dados. Compartido entre el CRM interno
 * (autenticado) y el flujo público de auto-agendamiento.
 *
 * @returns {Promise<{stylistId:string, stylistName:string, slots:string[]}[]>}
 */
async function getAvailability({ serviceId, date, stylistId }) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) return { error: "Servicio no encontrado" };

  const dayStart = new Date(`${date}T00:00:00${SALON_UTC_OFFSET}`);
  const dayEnd = new Date(`${date}T23:59:59${SALON_UTC_OFFSET}`);
  if (Number.isNaN(dayStart.getTime())) return { error: "Fecha inválida" };

  const stylists = await prisma.user.findMany({
    where: { role: "STYLIST", active: true, id: stylistId || undefined },
    orderBy: { name: "asc" },
  });

  const busy = await prisma.appointment.findMany({
    where: {
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
      stylistId: stylistId ? stylistId : { in: stylists.map((s) => s.id) },
    },
  });

  const slotMinutes = service.durationMinutes;
  const now = new Date();

  const availability = stylists.map((stylist) => {
    const slots = [];
    for (let h = OPEN_HOUR * 60; h + slotMinutes <= CLOSE_HOUR * 60; h += slotMinutes) {
      const slotStart = new Date(dayStart.getTime() + h * 60000);
      const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);
      if (slotStart <= now) continue; // no ofrecer horarios que ya pasaron
      const overlaps = busy.some(
        (b) => b.stylistId === stylist.id && slotStart < b.endTime && slotEnd > b.startTime
      );
      if (!overlaps) slots.push(slotStart.toISOString());
    }
    return { stylistId: stylist.id, stylistName: stylist.name, slots };
  });

  return { service, availability };
}

module.exports = { getAvailability, OPEN_HOUR, CLOSE_HOUR };
