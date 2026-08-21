// Integración con Google Calendar API (OAuth2 por estilista)
// Ver docs/INTEGRACIONES.md
const isConfigured = () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

/**
 * Crea un evento en el calendario del estilista.
 * Devuelve el eventId creado (o null en modo mock).
 */
async function createEvent(appointment) {
  if (!isConfigured() || !appointment.stylist.googleRefreshToken) {
    console.log(
      `[GoogleCalendar:mock] Evento creado para ${appointment.stylist.name}: ` +
        `${appointment.service.name} @ ${appointment.startTime.toISOString()}`
    );
    return null;
  }

  const { google } = require("googleapis");
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: appointment.stylist.googleRefreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `${appointment.service.name} — ${appointment.client.name}`,
      description: appointment.notes || "",
      start: { dateTime: appointment.startTime.toISOString() },
      end: { dateTime: appointment.endTime.toISOString() },
    },
  });

  return event.data.id;
}

async function deleteEvent(stylist, googleEventId) {
  if (!isConfigured() || !stylist.googleRefreshToken || !googleEventId) return;
  const { google } = require("googleapis");
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: stylist.googleRefreshToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });
}

module.exports = { createEvent, deleteEvent, isConfigured };
