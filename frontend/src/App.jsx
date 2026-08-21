import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Staff from "./pages/Staff";
import Expenses from "./pages/Expenses";
import Appointments from "./pages/Appointments";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 font-body">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/ventas" element={<Protected><Sales /></Protected>} />
      <Route path="/citas" element={<Protected><Appointments /></Protected>} />
      <Route path="/inventario" element={<Protected><Inventory /></Protected>} />
      <Route path="/personal" element={<Protected><Staff /></Protected>} />
      <Route path="/gastos" element={<Protected><Expenses /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
