import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.svg";

const links = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/ventas", label: "Ventas", icon: "💇" },
  { to: "/citas", label: "Citas", icon: "📅" },
  { to: "/inventario", label: "Inventario", icon: "🧴" },
  { to: "/personal", label: "Personal", icon: "🧑‍🎨" },
  { to: "/gastos", label: "Gastos", icon: "💳" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white dark:bg-neutral-800 border-r border-a26-pink/30 dark:border-neutral-700 flex flex-col">
      <div className="px-6 py-6">
        <img src={logo} alt="Aventure 26" className="h-10" />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-a26 text-sm font-medium transition ${
                isActive
                  ? "bg-a26-gold/90 text-white"
                  : "text-a26-ink dark:text-neutral-200 hover:bg-a26-pink/30 dark:hover:bg-neutral-700"
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 text-xs text-a26-ink/50 dark:text-neutral-500">
        Aventure 26 · Panel interno
      </div>
    </aside>
  );
}
