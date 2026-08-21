// Integración con WhatsApp Business API (Meta Cloud API)
// Ver docs/INTEGRACIONES.md
const isConfigured = () => !!process.env.WHATSAPP_API_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID;

async function sendMessage(toPhone, text) {
  if (!isConfigured()) {
    console.log(`[WhatsApp:mock] → ${toPhone}: ${text}`);
    return { mocked: true };
  }

  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toPhone,
      type: "text",
      text: { body: text },
    }),
  });
  return res.json();
}

async function sendAppointmentConfirmation(appointment) {
  const fecha = appointment.startTime.toLocaleDateString("es-CO");
  const hora = appointment.startTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const text = `✨ Aventure 26 — Tu cita fue confirmada
Servicio: ${appointment.service.name}
Con: ${appointment.stylist.name}
Fecha: ${fecha} ${hora}
Si necesitas reprogramar, responde este mensaje.`;
  return sendMessage(appointment.client.phone, text);
}

async function sendReminder(appointment, hoursBefore) {
  const text = `⏰ Recordatorio Aventure 26: tu cita de ${appointment.service.name} es en ${hoursBefore}h con ${appointment.stylist.name}. ¡Te esperamos!`;
  return sendMessage(appointment.client.phone, text);
}

module.exports = { sendMessage, sendAppointmentConfirmation, sendReminder, isConfigured };
