import { useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ChangePasswordModal from "../ui/ChangePasswordModal";

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-a26-pink/30 dark:border-neutral-700">
      <h1 className="text-2xl font-display text-a26-ink dark:text-white">{title}</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="btn-secondary text-sm"
          aria-label="Cambiar modo claro/oscuro"
        >
          {dark ? "☀️ Claro" : "🌙 Oscuro"}
        </button>
        <div className="text-right">
          <p className="text-sm font-semibold">
            {user?.name} <span className="font-normal text-a26-ink/50 dark:text-neutral-500">· {user?.role}</span>
          </p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-xs text-a26-ink/60 dark:text-neutral-400 hover:text-a26-gold underline decoration-dotted"
          >
            Cambiar contraseña
          </button>
        </div>
        <button onClick={logout} className="btn-secondary text-sm">
          Salir
        </button>
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </header>
  );
}
