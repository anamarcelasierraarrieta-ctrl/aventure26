const cron = require("node-cron");

const prisma = require("../config/prisma");
const whatsapp = require("../integrations/whatsapp.service");

async function sendDueReminders() {
  const now = new Date();

  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const windowMinutes = 15 * 60 * 1000; // tolerancia de ventana entre corridas del cron

  const due24h = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      reminder24hSent: false,
      startTime: { gte: in24h, lte: new Date(in24h.getTime() + windowMinutes) },
    },
    include: { client: true, stylist: true, service: true },
  });

  const due2h = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      reminder2hSent: false,
      startTime: { gte: in2h, lte: new Date(in2h.getTime() + windowMinutes) },
    },
    include: { client: true, stylist: true, service: true },
  });

  for (const appt of due24h) {
    await whatsapp.sendReminder(appt, 24);
    await prisma.appointment.update({ where: { id: appt.id }, data: { reminder24hSent: true } });
  }

  for (const appt of due2h) {
    await whatsapp.sendReminder(appt, 2);
    await prisma.appointment.update({ where: { id: appt.id }, data: { reminder2hSent: true } });
  }

  if (due24h.length || due2h.length) {
    console.log(`[reminders] enviados: ${due24h.length} de 24h, ${due2h.length} de 2h`);
  }
}

// Corre cada 15 minutos: revisa qué citas caen dentro de la ventana de 24h/2h antes de empezar
function startReminderJob() {
  cron.schedule("*/15 * * * *", () => {
    sendDueReminders().catch((err) => console.error("[reminders] error:", err));
  });
  console.log("✔ Job de recordatorios (24h/2h) programado cada 15 min");
}

module.exports = { startReminderJob, sendDueReminders };
