import axios from "axios";

// En desarrollo, Vite hace proxy de /api al backend local (ver vite.config.js).
// En producción (Railway), el frontend y el backend viven en dominios distintos,
// así que VITE_API_URL debe apuntar a la URL pública del backend + /api.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("a26_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Descarga un archivo Excel devuelto por un endpoint /export
export async function downloadExcel(path, filename) {
  const res = await api.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default api;
