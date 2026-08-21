import { downloadExcel } from "../../api/client";

export default function ExportButton({ path, filename, label = "Exportar a Excel" }) {
  return (
    <button className="btn-primary text-sm" onClick={() => downloadExcel(path, filename)}>
      ⬇ {label}
    </button>
  );
}
