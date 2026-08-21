import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/ui/StatCard";
import api from "../api/client";

const currency = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    api.get("/dashboard/summary").then((r) => setSummary(r.data));
    api.get("/dashboard/revenue-series?days=14").then((r) => setSeries(r.data));
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard label="Ingresos hoy" value={currency(summary?.ingresosHoy)} accent="gold" />
        <StatCard label="Citas hoy" value={summary?.citasHoy ?? "—"} accent="pink" />
        <StatCard
          label="Utilidad del mes"
          value={currency(summary?.utilidadMes)}
          hint={`Ingresos ${currency(summary?.ingresosMes)} · Gastos ${currency(summary?.gastosMes)}`}
        />
        <StatCard
          label="Alertas de inventario"
          value={summary?.alertasStock ?? "—"}
          hint="Productos bajo el stock mínimo"
        />
      </div>

      <div className="card">
        <h3 className="font-display text-lg mb-4">Ingresos vs. Gastos (últimos 14 días)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={series}>
            <defs>
              <linearGradient id="ingresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EAC1C1" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#EAC1C1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => currency(v)} />
            <Area type="monotone" dataKey="ingresos" stroke="#D4AF37" fill="url(#ingresos)" name="Ingresos" />
            <Area type="monotone" dataKey="gastos" stroke="#EAC1C1" fill="url(#gastos)" name="Gastos" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-display text-lg mb-4">Próximas citas de hoy</h3>
        <table className="a26-table w-full">
          <thead>
            <tr>
              <th>Hora</th><th>Cliente</th><th>Servicio</th><th>Estilista</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.proximasCitas || []).map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.startTime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{a.client?.name}</td>
                <td>{a.service?.name}</td>
                <td>{a.stylist?.name}</td>
                <td>{a.status}</td>
              </tr>
            ))}
            {!summary?.proximasCitas?.length && (
              <tr><td colSpan={5} className="text-center py-6 text-a26-ink/50">Sin citas registradas hoy</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
