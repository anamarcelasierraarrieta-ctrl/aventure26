import { useEffect, useMemo, useState } from "react";

import api from "../api/client";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.svg";

const currency = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

function nextDays(count) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

// Fecha en YYYY-MM-DD a partir de los componentes LOCALES del Date — nunca
// usar toISOString() aquí, que convierte a UTC y puede correr el día para
// quien visite la página desde una zona horaria adelantada a Bogotá.
const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function PublicBooking() {
  const { dark, toggleTheme } = useTheme();

  const [step, setStep] = useState(1); // 1 servicio, 2 fecha/hora, 3 datos, 4 confirmación
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const days = useMemo(() => nextDays(21), []);
  const [selectedDate, setSelectedDate] = useState(dateKey(days[0]));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // { time, stylistId, stylistName }

  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    api.get("/public/services").then((r) => setServices(r.data));
  }, []);

  useEffect(() => {
    if (step !== 2 || !selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    api
      .get(`/public/availability`, { params: { serviceId: selectedService.id, date: selectedDate } })
      .then((r) => setSlots(r.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [step, selectedService, selectedDate]);

  function chooseService(service) {
    setSelectedService(service);
    setStep(2);
  }

  function chooseSlot(time, stylist) {
    setSelectedSlot({ time, stylistId: stylist.stylistId, stylistName: stylist.stylistName });
    setStep(3);
  }

  async function submitBooking(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/public/appointments", {
        serviceId: selectedService.id,
        stylistId: selectedSlot.stylistId,
        startTime: selectedSlot.time,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
      });
      setConfirmation(data);
      setStep(4);
    } catch (err) {
      const msg = err?.response?.data?.error || "No se pudo agendar la cita. Intenta de nuevo.";
      setError(msg);
      if (err?.response?.status === 409) {
        // el horario se ocupó justo antes de confirmar: refresca la lista y regresa
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setStep(1);
    setSelectedService(null);
    setSelectedSlot(null);
    setForm({ name: "", phone: "", email: "" });
    setConfirmation(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-a26-beige dark:bg-neutral-900">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-a26-pink/30 dark:border-neutral-700">
        <img src={logo} alt="Aventure 26" className="h-9" />
        <button onClick={toggleTheme} className="btn-secondary text-sm" aria-label="Cambiar modo claro/oscuro">
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-a26-ink dark:text-white mb-2 text-center">Agenda tu cita</h1>
        <p className="text-center text-sm text-a26-ink/60 dark:text-neutral-400 mb-8">
          Elige tu servicio, la fecha y hora que más te acomode — quedará confirmada al instante, sin
          necesidad de llamar.
        </p>

        <Stepper step={step} />

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => chooseService(s)}
                className="card text-left hover:border-a26-gold hover:shadow-md transition"
              >
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-a26-ink/50 dark:text-neutral-500 mt-1">
                  {s.durationMinutes} min · {currency(s.price)}
                </p>
              </button>
            ))}
            {!services.length && <p className="text-sm text-a26-ink/50">Cargando servicios…</p>}
          </div>
        )}

        {step === 2 && selectedService && (
          <div className="mt-8">
            <button className="text-sm text-a26-ink/60 hover:text-a26-gold mb-4" onClick={() => setStep(1)}>
              ← Cambiar servicio
            </button>
            <p className="text-sm mb-1 text-a26-ink/60 dark:text-neutral-400">Servicio</p>
            <p className="font-semibold mb-5">{selectedService.name}</p>

            <p className="text-sm mb-2 text-a26-ink/60 dark:text-neutral-400">Elige un día</p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
              {days.map((d) => {
                const key = dateKey(d);
                const active = key === selectedDate;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    className={`shrink-0 w-16 py-2 rounded-a26 text-center text-xs font-medium border ${
                      active
                        ? "bg-a26-gold text-white border-a26-gold"
                        : "bg-white dark:bg-neutral-800 border-a26-pink/30 dark:border-neutral-700"
                    }`}
                  >
                    <div className="uppercase opacity-70">{d.toLocaleDateString("es-CO", { weekday: "short" })}</div>
                    <div className="text-base font-display">{d.getDate()}</div>
                  </button>
                );
              })}
            </div>

            <p className="text-sm mb-2 text-a26-ink/60 dark:text-neutral-400">Horarios disponibles</p>
            {loadingSlots && <p className="text-sm text-a26-ink/50">Buscando disponibilidad…</p>}
            {!loadingSlots && !slots.length && (
              <p className="text-sm text-a26-ink/50">No hay horarios disponibles este día. Prueba otra fecha.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {slots.map(({ time, stylists }) =>
                stylists.map((st) => (
                  <button
                    key={`${time}-${st.stylistId}`}
                    onClick={() => chooseSlot(time, st)}
                    className="btn-secondary text-sm text-left flex justify-between items-center"
                  >
                    <span>
                      {new Date(time).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-xs opacity-70">con {st.stylistName}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === 3 && selectedService && selectedSlot && (
          <form onSubmit={submitBooking} className="mt-8 card">
            <button type="button" className="text-sm text-a26-ink/60 hover:text-a26-gold mb-4" onClick={() => setStep(2)}>
              ← Cambiar horario
            </button>

            <div className="bg-a26-beige dark:bg-neutral-900 rounded-a26 p-4 mb-5 text-sm">
              <p className="font-semibold">{selectedService.name}</p>
              <p className="text-a26-ink/60 dark:text-neutral-400">
                {new Date(selectedSlot.time).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}
                {new Date(selectedSlot.time).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                {" · con "}{selectedSlot.stylistName}
              </p>
            </div>

            <label className="block text-sm mb-1">Nombre completo</label>
            <input
              className="input mb-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />

            <label className="block text-sm mb-1">WhatsApp / Teléfono</label>
            <input
              className="input mb-3"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+57 300 000 0000"
              required
            />

            <label className="block text-sm mb-1">Correo (opcional)</label>
            <input
              type="email"
              className="input mb-4"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Agendando…" : "Confirmar cita"}
            </button>
            <p className="text-xs text-center mt-3 text-a26-ink/50">
              Te llegará la confirmación por WhatsApp o correo — no necesitas hacer nada más.
            </p>
          </form>
        )}

        {step === 4 && confirmation && (
          <div className="mt-8 card text-center">
            <div className="text-4xl mb-3">✨</div>
            <h2 className="font-display text-xl mb-2">¡Cita confirmada!</h2>
            <p className="text-sm text-a26-ink/70 dark:text-neutral-300 mb-1">{confirmation.service}</p>
            <p className="text-sm text-a26-ink/70 dark:text-neutral-300 mb-1">
              {new Date(confirmation.startTime).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
              {" · "}
              {new Date(confirmation.startTime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-sm text-a26-ink/70 dark:text-neutral-300 mb-5">con {confirmation.stylist}</p>
            <p className="text-xs text-a26-ink/50 mb-6">
              Te enviamos la confirmación por WhatsApp/correo. Si necesitas reprogramar, responde ese mensaje.
            </p>
            <button className="btn-secondary" onClick={startOver}>
              Agendar otra cita
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Stepper({ step }) {
  const labels = ["Servicio", "Fecha y hora", "Tus datos", "Listo"];
  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      {labels.map((label, idx) => {
        const n = idx + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
                done ? "bg-a26-gold text-white" : active ? "bg-a26-ink text-white dark:bg-white dark:text-a26-ink" : "bg-a26-pink/30 text-a26-ink dark:bg-neutral-700 dark:text-neutral-300"
              }`}
            >
              {done ? "✓" : n}
            </div>
            <span className={active ? "font-semibold" : "text-a26-ink/50 dark:text-neutral-500"}>{label}</span>
            {n < labels.length && <span className="w-6 h-px bg-a26-pink/40 dark:bg-neutral-700 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}
