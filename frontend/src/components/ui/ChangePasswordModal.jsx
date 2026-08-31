import { useState } from "react";

import { useAuth } from "../../context/AuthContext";

export default function ChangePasswordModal({ onClose }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.error || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <h3 className="font-display text-lg mb-4">Cambiar contraseña</h3>

        {success ? (
          <>
            <p className="text-sm text-green-600 mb-5">✔ Contraseña actualizada correctamente.</p>
            <button type="button" className="btn-primary w-full" onClick={onClose}>
              Cerrar
            </button>
          </>
        ) : (
          <>
            <label className="block text-sm mb-1">Contraseña actual</label>
            <input
              type="password"
              className="input mb-3"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />

            <label className="block text-sm mb-1">Nueva contraseña</label>
            <input
              type="password"
              className="input mb-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />

            <label className="block text-sm mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              className="input mb-4"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-2">
              <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button className="btn-primary flex-1" disabled={loading}>
                {loading ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
