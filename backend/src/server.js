require("dotenv").config();
const app = require("./app");
const { startReminderJob } = require("./jobs/reminders.job");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✔ Aventure 26 API escuchando en http://localhost:${PORT}`);
  startReminderJob();
});
