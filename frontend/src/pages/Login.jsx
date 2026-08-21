import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.svg";

export default function Login() {
  const { login } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@aventure26.demo");
  const [password, setPassword] = useState("Aventure26!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Credenciales inválidas. Verifica el correo y la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-a26-beige to-a26-pink/40 dark:from-neutral-900 dark:to-neutral-800 px-4">
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 btn-secondary text-sm"
      >
        {dark ? "☀️ Claro" : "🌙 Oscuro"}
      </button>

      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Aventure 26" className="h-12" />
        </div>
        <h2 className="text-center text-lg font-display mb-6 text-a26-ink dark:text-white">
          Panel de gestión
        </h2>

        <label className="block text-sm mb-1">Correo</label>
        <input
          className="input mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-sm mb-1">Contraseña</label>
        <input
          className="input mb-4"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>

        <p className="text-xs text-center mt-4 text-a26-ink/50 dark:text-neutral-400">
          Usuario demo precargado — admin@aventure26.demo
        </p>
      </form>
    </div>
  );
}
