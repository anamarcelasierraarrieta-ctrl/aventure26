import { useEffect, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import ExportButton from "../components/ui/ExportButton";
import StaffModal from "../components/ui/StaffModal";
import api from "../api/client";

const currency = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [performance, setPerformance] = useState({});
  const [modalState, setModalState] = useState(null); // null | { member: null | member }

  function loadStaff() {
    api.get("/staff").then(async (r) => {
      setStaff(r.data);
      const entries = await Promise.all(
        r.data.map((s) => api.get(`/staff/${s.id}/performance`).then((res) => [s.id, res.data]))
      );
      setPerformance(Object.fromEntries(entries));
    });
  }

  useEffect(loadStaff, []);

  function handleSaved() {
    setModalState(null);
    loadStaff();
  }

  return (
    <AppLayout title="Personal y Operaciones">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <p className="text-sm text-a26-ink/60 dark:text-neutral-400">
          {staff.length} miembro(s) del equipo
        </p>
        <div className="flex gap-2">
          <ExportButton path="/staff/export" filename="personal_aventure26.xlsx" />
          <button className="btn-primary text-sm" onClick={() => setModalState({ member: null })}>
            + Agregar personal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {staff.map((s) => {
          const perf = performance[s.id];
          return (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-a26-pink/50 flex items-center justify-center font-display text-a26-ink">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-a26-ink/60 dark:text-neutral-400">{s.role} · {s.email}</p>
                  </div>
                </div>
                <button
                  className="text-xs text-a26-gold hover:underline shrink-0"
                  onClick={() => setModalState({ member: s })}
                >
                  Editar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                <div>
                  <p className="text-a26-ink/50 dark:text-neutral-500 text-xs">Comisión</p>
                  <p>{Number(s.commissionRate)}%</p>
                </div>
                <div>
                  <p className="text-a26-ink/50 dark:text-neutral-500 text-xs">Ventas</p>
                  <p>{perf?.totalVentas ?? "…"}</p>
                </div>
                <div>
                  <p className="text-a26-ink/50 dark:text-neutral-500 text-xs">Comisiones generadas</p>
                  <p>{perf ? currency(perf.comisionesGeneradas) : "…"}</p>
                </div>
                <div>
                  <p className="text-a26-ink/50 dark:text-neutral-500 text-xs">Citas atendidas</p>
                  <p>{perf?.citasAtendidas ?? "…"}</p>
                </div>
              </div>
            </div>
          );
        })}
        {!staff.length && <p className="text-sm text-a26-ink/50">Aún no hay personal registrado.</p>}
      </div>

      {modalState && (
        <StaffModal
          member={modalState.member}
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
        />
      )}
    </AppLayout>
  );
}
