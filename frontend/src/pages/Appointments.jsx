import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import ExportButton from "../components/ui/ExportButton";
import api from "../api/client";

const STATUS_COLORS = {
  PENDING: "bg-yellow-200 text-yellow-800",
  CONFIRMED: "bg-a26-gold/30 text-a26-ink dark:text-white",
  COMPLETED: "bg-green-200 text-green-800",
  CANCELLED: "bg-red-200 text-red-800",
  NO_SHOW: "bg-neutral-300 text-neutral-700",
};

function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Appointments() {
  const [view, setView] = useState("month"); // month | week
  const [cursor, setCursor] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  function copyBookingLink() {
    const url = `${window.location.origin}/agendar`;
    navigator.clipboard?.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);

  useEffect(() => {
    api
      .get(`/appointments?from=${monthStart.toISOString()}&to=${monthEnd.toISOString()}`)
      .then((r) => setAppointments(r.data));
  }, [cursor]);

  const cells = useMemo(() => monthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  function apptsFor(day) {
    if (!day) return [];
    return appointments.filter((a) => new Date(a.startTime).toDateString() === day.toDateString());
  }

  return (
    <AppLayout title="Agendamiento de citas">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</button>
          <span className="font-display text-lg capitalize">
            {cursor.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
          </span>
          <button className="btn-secondary text-sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</button>
        </div>
        <div className="flex gap-2">
          {[["month", "Mensual"], ["week", "Semanal"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} className={`text-sm px-3 py-1.5 rounded-a26 ${view === v ? "bg-a26-gold text-white" : "btn-secondary"}`}>
              {l}
            </button>
          ))}
          <ExportButton path="/appointments/export" filename="citas_aventure26.xlsx" />
          <button className="btn-secondary text-sm" onClick={copyBookingLink}>
            {linkCopied ? "✓ Enlace copiado" : "🔗 Enlace de auto-agendamiento"}
          </button>
          <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>+ Agendar Cita</button>
        </div>
      </div>
      <p className="text-xs text-a26-ink/50 dark:text-neutral-500 -mt-2">
        Comparte ese enlace con tus clientas (bio de Instagram, WhatsApp, tu web) para que agenden solas, sin
        contactarte primero.
      </p>

      {view === "month" ? (
        <div className="card">
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-a26-ink/60 dark:text-neutral-400 mb-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => (
              <div key={idx} className={`min-h-[92px] rounded-a26 p-1.5 text-xs border ${day ? "border-a26-pink/20 dark:border-neutral-700" : "border-transparent"}`}>
                {day && (
                  <>
                    <p className="text-a26-ink/50 dark:text-neutral-500 mb-1">{day.getDate()}</p>
                    <div className="space-y-1">
                      {apptsFor(day).slice(0, 3).map((a) => (
                        <div key={a.id} className={`truncate px-1.5 py-0.5 rounded ${STATUS_COLORS[a.status]}`} title={`${a.service.name} · ${a.client.name}`}>
                          {new Date(a.startTime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} {a.client.name}
                        </div>
                      ))}
                      {apptsFor(day).length > 3 && (
                        <p className="text-[10px] text-a26-ink/40">+{apptsFor(day).length - 3} más</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="text-sm text-a26-ink/60 dark:text-neutral-400 mb-3">
            Vista semanal (semana de {cursor.toLocaleDateString("es-CO")})
          </p>
          <table className="a26-table w-full">
            <thead><tr><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Estilista</th><th>Estado</th></tr></thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.startTime).toLocaleString("es-CO")}</td>
                  <td>{a.client.name}</td>
                  <td>{a.service.name}</td>
                  <td>{a.stylist.name}</td>
                  <td><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[a.status]}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <AppointmentModal onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); setCursor(new Date(cursor)); }} />}
    </AppLayout>
  );
}

function AppointmentModal({ onClose, onCreated }) {
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ clientId: "", stylistId: "", serviceId: "", startTime: "" });

  useEffect(() => {
    api.get("/staff").then((r) => setStaff(r.data.filter((s) => s.role === "STYLIST")));
    api.get("/services").then((r) => setServices(r.data));
    api.get("/services/clients").then((r) => setClients(r.data));
  }, []);

  async function submit(e) {
    e.preventDefault();
    await api.post("/appointments", { ...form, startTime: new Date(form.startTime).toISOString() });
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form onSubmit={submit} className="card w-full max-w-md">
        <h3 className="font-display text-lg mb-4">Agendar Cita</h3>
        <p className="text-xs text-a26-ink/50 mb-3">
          Confirmación automática por WhatsApp/correo al guardar.
        </p>
        <label className="block text-sm mb-1">Cliente</label>
        <select className="input mb-3" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
          <option value="">Seleccionar…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="block text-sm mb-1">Estilista</label>
        <select className="input mb-3" value={form.stylistId} onChange={(e) => setForm({ ...form, stylistId: e.target.value })} required>
          <option value="">Seleccionar…</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="block text-sm mb-1">Servicio</label>
        <select className="input mb-3" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} required>
          <option value="">Seleccionar…</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="block text-sm mb-1">Fecha y hora</label>
        <input type="datetime-local" className="input mb-4" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1">Confirmar</button>
        </div>
      </form>
    </div>
  );
}
