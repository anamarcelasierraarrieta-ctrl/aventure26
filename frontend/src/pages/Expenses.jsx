import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import AppLayout from "../components/layout/AppLayout";
import ExportButton from "../components/ui/ExportButton";
import api from "../api/client";

const currency = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ category: "", description: "", amount: "", type: "VARIABLE" });

  function load() {
    api.get("/expenses").then((r) => setExpenses(r.data));
    api.get("/expenses/summary").then((r) => setSummary(r.data));
  }

  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.category || !form.amount) return;
    await api.post("/expenses", { ...form, amount: Number(form.amount) });
    setForm({ category: "", description: "", amount: "", type: "VARIABLE" });
    load();
  }

  return (
    <AppLayout title="Gastos">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="card">
          <h3 className="font-display text-lg mb-4">Registrar gasto</h3>
          <label className="block text-sm mb-1">Categoría</label>
          <input className="input mb-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label className="block text-sm mb-1">Descripción</label>
          <input className="input mb-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="block text-sm mb-1">Monto</label>
          <input type="number" className="input mb-3" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <label className="block text-sm mb-1">Tipo</label>
          <select className="input mb-4" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="FIXED">Fijo</option>
            <option value="VARIABLE">Variable</option>
          </select>
          <button className="btn-primary w-full">Registrar</button>
        </form>

        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg">Ingresos vs. Gastos</h3>
            <ExportButton path="/expenses/export" filename="gastos_aventure26.xlsx" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <p className="text-xs text-a26-ink/50">Ingresos</p>
              <p className="text-lg font-display text-a26-gold">{currency(summary?.totalIngresos)}</p>
            </div>
            <div>
              <p className="text-xs text-a26-ink/50">Gastos</p>
              <p className="text-lg font-display text-a26-pink">{currency(summary?.totalGastos)}</p>
            </div>
            <div>
              <p className="text-xs text-a26-ink/50">Utilidad</p>
              <p className="text-lg font-display">{currency(summary?.utilidad)}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary?.porCategoria || []}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => currency(v)} />
              <Bar dataKey="total" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display text-lg mb-4">Historial de gastos</h3>
        <table className="a26-table w-full">
          <thead>
            <tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Tipo</th><th>Monto</th></tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.date).toLocaleDateString("es-CO")}</td>
                <td>{e.category}</td>
                <td>{e.description || "-"}</td>
                <td>{e.type === "FIXED" ? "Fijo" : "Variable"}</td>
                <td>{currency(e.amount)}</td>
              </tr>
            ))}
            {!expenses.length && <tr><td colSpan={5} className="text-center py-6 text-a26-ink/50">Sin gastos registrados</td></tr>}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
