const cron = require("node-cron");

const prisma = require("../config/prisma");
const whatsapp = require("../integrations/whatsapp.service");

async function sendDueReminders() {
  const now = new Date();

  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const windowMinutes = 15 * 60 * 1000; // tolerancia de ventana entre corridas del cron

  const due24h = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      reminder24hSent: false,
      startTime: { gte: in24h, lte: new Date(in24h.getTime() + windowMinutes) },
    },
    include: { client: true, stylist: true, service: true },
  });

  const due1h = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      reminder1hSent: false,
      startTime: { gte: in1h, lte: new Date(in1h.getTime() + windowMinutes) },
    },
    include: { client: true, stylist: true, service: true },
  });

  for (const appt of due24h) {
    await whatsapp.sendReminder(appt, 24);
    await prisma.appointment.update({ where: { id: appt.id }, data: { reminder24hSent: true } });
  }

  for (const appt of due1h) {
    await whatsapp.sendReminder(appt, 1);
    await prisma.appointment.update({ where: { id: appt.id }, data: { reminder1hSent: true } });
  }

  if (due24h.length || due1h.length) {
    console.log(`[reminders] enviados: ${due24h.length} de 24h, ${due1h.length} de 1h`);
  }
}

// Corre cada 15 minutos: revisa qué citas caen dentro de la ventana de 24h/1h antes de empezar
function startReminderJob() {
  cron.schedule("*/15 * * * *", () => {
    sendDueReminders().catch((err) => console.error("[reminders] error:", err));
  });
  console.log("✔ Job de recordatorios (24h/1h) programado cada 15 min");
}

module.exports = { startReminderJob, sendDueReminders };
