import { useState } from "react";

import api from "../../api/client";

const emptyForm = { name: "", email: "", phone: "", role: "STYLIST", commissionRate: 0, password: "" };

export default function StaffModal({ member, onClose, onSaved }) {
  const isEdit = !!member;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: member.name,
          email: member.email,
          phone: member.phone || "",
          role: member.role,
          commissionRate: Number(member.commissionRate),
          password: "",
        }
      : emptyForm
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/staff/${member.id}`, {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          commissionRate: Number(form.commissionRate),
        });
      } else {
        await api.post("/staff", {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          commissionRate: Number(form.commissionRate),
          password: form.password || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || "No se pudo guardar el miembro del equipo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form onSubmit={submit} className="card w-full max-w-md">
        <h3 className="font-display text-lg mb-4">{isEdit ? "Editar miembro del equipo" : "Agregar personal"}</h3>

        <label className="block text-sm mb-1">Nombre</label>
        <input className="input mb-3" value={form.name} onChange={(e) => update("name", e.target.value)} required autoFocus />

        <label className="block text-sm mb-1">Correo</label>
        <input type="email" className="input mb-3" value={form.email} onChange={(e) => update("email", e.target.value)} required />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Rol</label>
            <select className="input" value={form.role} onChange={(e) => update("role", e.target.value)}>
              <option value="STYLIST">Estilista</option>
              <option value="ASSISTANT">Asistente</option>
              <option value="RECEPTION">Recepción</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>

        <label className="block text-sm mb-1">Comisión (%)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          className="input mb-3"
          value={form.commissionRate}
          onChange={(e) => update("commissionRate", e.target.value)}
        />

        {!isEdit && (
          <>
            <label className="block text-sm mb-1">Contraseña inicial</label>
            <input
              type="password"
              className="input mb-1"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Por defecto: aventure26demo"
              minLength={6}
            />
            <p className="text-xs text-a26-ink/50 mb-3">
              Si la dejas en blanco, se usa <code>aventure26demo</code> — la persona podrá cambiarla luego desde su perfil.
            </p>
          </>
        )}

        {error && <p className="text-red-500 text-sm mb-4 mt-1">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" disabled={loading}>
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </form>
    </div>
  );
}
