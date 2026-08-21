import axios from "axios";

const api = axios.create({ baseURL: "/api" });

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
