import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import ExportButton from "../components/ui/ExportButton";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const currency = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export default function Sales() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sales, setSales] = useState([]);
  const [range, setRange] = useState("day"); // day | week | month
  const [cart, setCart] = useState([]);
  const [stylistId, setStylistId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  useEffect(() => {
    api.get("/staff").then((r) => {
      setStaff(r.data);
      setStylistId(r.data.find((s) => s.role === "STYLIST")?.id || "");
    });
    api.get("/services").then((r) => setServices(r.data));
    loadSales();
  }, []);

  useEffect(() => {
    loadSales();
  }, [range]);

  function rangeDates() {
    const to = new Date();
    const from = new Date();
    if (range === "day") from.setHours(0, 0, 0, 0);
    if (range === "week") from.setDate(from.getDate() - 7);
    if (range === "month") from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  function loadSales() {
    const { from, to } = rangeDates();
    api.get(`/sales?from=${from}&to=${to}`).then((r) => setSales(r.data));
  }

  function addToCart(service) {
    setCart((c) => [...c, { serviceId: service.id, serviceName: service.name, price: Number(service.price), quantity: 1 }]);
  }

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);

  async function registerSale() {
    if (!cart.length || !stylistId) return;
    await api.post("/sales", {
      stylistId,
      paymentMethod,
      items: cart.map((i) => ({ serviceId: i.serviceId, price: i.price, quantity: i.quantity })),
    });
    setCart([]);
    loadSales();
  }

  return (
    <AppLayout title="Ventas por ítems">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Registro rápido de venta</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => addToCart(s)}
                className="btn-secondary text-sm text-left"
              >
                {s.name}
                <span className="block text-xs opacity-60">{currency(s.price)}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Estilista</label>
              <select className="input" value={stylistId} onChange={(e) => setStylistId(e.target.value)}>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Método de pago</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="CASH">Efectivo</option>
                <option value="CARD_STRIPE">Tarjeta</option>
                <option value="PAYPAL">PayPal</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Daviplata</option>
              </select>
            </div>
          </div>

          <div className="border-t border-a26-pink/30 dark:border-neutral-700 pt-4">
            {cart.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span>{i.serviceName}</span>
                <span>{currency(i.price)}</span>
              </div>
            ))}
            {!cart.length && <p className="text-sm text-a26-ink/50">Selecciona servicios arriba</p>}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-a26-pink/30 dark:border-neutral-700">
            <span className="font-display text-xl">Total: {currency(total)}</span>
            <button className="btn-primary" onClick={registerSale}>Registrar Venta</button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-display text-lg mb-4">Reportes</h3>
          <div className="flex gap-2 mb-4">
            {[["day", "Diario"], ["week", "Semanal"], ["month", "Mensual"]].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setRange(v)}
                className={`text-sm px-3 py-1.5 rounded-a26 ${range === v ? "bg-a26-gold text-white" : "btn-secondary"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-sm text-a26-ink/60 dark:text-neutral-400 mb-2">
            {sales.length} venta(s) · Total {currency(sales.reduce((s, x) => s + Number(x.total), 0))}
          </p>
          <ExportButton path="/sales/export" filename="ventas_aventure26.xlsx" />
        </div>
      </div>

      <div className="card">
        <h3 className="font-display text-lg mb-4">Historial de ventas</h3>
        <table className="a26-table w-full">
          <thead>
            <tr><th>Fecha</th><th>Cliente</th><th>Estilista</th><th>Servicios</th><th>Total</th><th>Pago</th></tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.date).toLocaleDateString("es-CO")}</td>
                <td>{s.client?.name || "Mostrador"}</td>
                <td>{s.stylist?.name}</td>
                <td>{s.items.map((i) => i.service.name).join(", ")}</td>
                <td>{currency(s.total)}</td>
                <td>{s.paymentMethod}</td>
              </tr>
            ))}
            {!sales.length && <tr><td colSpan={6} className="text-center py-6 text-a26-ink/50">Sin ventas en este rango</td></tr>}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
