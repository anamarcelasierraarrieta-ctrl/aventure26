import { useState } from "react";

import api from "../../api/client";

const emptyForm = { name: "", sku: "", category: "", unit: "unidad", stock: 0, minStock: 0, costPrice: 0 };

export default function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: product.name,
          sku: product.sku,
          category: product.category || "",
          unit: product.unit || "unidad",
          stock: Number(product.stock),
          minStock: Number(product.minStock),
          costPrice: Number(product.costPrice),
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
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category || undefined,
        unit: form.unit,
        stock: Number(form.stock),
        minStock: Number(form.minStock),
        costPrice: Number(form.costPrice),
      };
      if (isEdit) {
        await api.put(`/inventory/${product.id}`, payload);
      } else {
        await api.post("/inventory", payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || "No se pudo guardar el producto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form onSubmit={submit} className="card w-full max-w-md">
        <h3 className="font-display text-lg mb-4">{isEdit ? "Editar producto" : "Agregar producto"}</h3>

        <label className="block text-sm mb-1">Nombre</label>
        <input className="input mb-3" value={form.name} onChange={(e) => update("name", e.target.value)} required autoFocus />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm mb-1">SKU</label>
            <input className="input" value={form.sku} onChange={(e) => update("sku", e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Categoría</label>
            <input className="input" value={form.category} onChange={(e) => update("category", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-sm mb-1">Stock</label>
            <input type="number" step="0.01" className="input" value={form.stock} onChange={(e) => update("stock", e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Mínimo</label>
            <input type="number" step="0.01" className="input" value={form.minStock} onChange={(e) => update("minStock", e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Unidad</label>
            <input className="input" value={form.unit} onChange={(e) => update("unit", e.target.value)} />
          </div>
        </div>

        <label className="block text-sm mb-1">Costo unitario</label>
        <input type="number" step="0.01" className="input mb-4" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} required />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" disabled={loading}>
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Agregar producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
