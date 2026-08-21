import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ title, children }) {
  return (
    <div className="flex min-h-screen bg-a26-beige dark:bg-neutral-900">
      <Sidebar />
      <div className="flex-1">
        <Topbar title={title} />
        <main className="p-8 space-y-6">{children}</main>
      </div>
    </div>
  );
}
