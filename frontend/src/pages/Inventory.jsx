import { useEffect, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import ExportButton from "../components/ui/ExportButton";
import api from "../api/client";

const currency = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [consumption, setConsumption] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.get("/inventory").then((r) => setProducts(r.data));
    api.get("/inventory/consumption").then((r) => setConsumption(r.data));
  }, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));
  const maxConsumo = Math.max(1, ...consumption.map((c) => Number(c.totalConsumido || 0)));

  return (
    <AppLayout title="Inventario">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg">Productos</h3>
            <ExportButton path="/inventory/export" filename="inventario_aventure26.xlsx" />
          </div>
          <input
            className="input mb-4"
            placeholder="Buscar producto…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <table className="a26-table w-full">
            <thead>
              <tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Mínimo</th><th>Costo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>{Number(p.stock)} {p.unit}</td>
                  <td>{Number(p.minStock)}</td>
                  <td>{currency(p.costPrice)}</td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.lowStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                      {p.lowStock ? "Bajo mínimo" : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="font-display text-lg mb-4">Consumo por servicio</h3>
          <div className="space-y-3">
            {consumption.map((c, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c.product}</span>
                  <span>{Number(c.totalConsumido).toFixed(1)}</span>
                </div>
                <div className="h-2 rounded-full bg-a26-pink/20 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className="h-full bg-a26-gold"
                    style={{ width: `${(Number(c.totalConsumido) / maxConsumo) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!consumption.length && <p className="text-sm text-a26-ink/50">Sin movimientos registrados aún</p>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
