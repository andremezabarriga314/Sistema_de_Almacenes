import { useState } from "react";
import { useApp, Product, categories, units, storageTempOptions } from "../store/AppContext";
import { exportProductsPDF } from "../lib/exportPDF";
import { exportProductsExcel } from "../lib/exportExcel";
import DeleteDataButton from "./DeleteDataButton";

const fmtUSD = (n: number) => "S/ " + n.toFixed(2);

const emptyForm = {
  sku: "", name: "", category: "Lácteos", subcategory: "",
  costPrice: 0, salePrice: 0, stock: 0, minStock: 5, maxStock: 100,
  unit: "Kg", location: "", supplierId: "",
  status: "Activo" as const, storageTemp: "Refrigerado (0–4 °C)",
};

type FormType = Omit<typeof emptyForm, "status"> & { status: "Activo" | "Inactivo" };

export default function Products() {
  const { products, suppliers, addProduct, updateProduct, deleteProduct, deleteProducts } = useApp();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterStock, setFilterStock] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormType>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "Todas" || p.category === filterCat;
    const matchStatus = filterStatus === "Todos" || p.status === filterStatus;
    const matchStock =
      filterStock === "Todos" ? true :
      filterStock === "Agotados" ? p.stock === 0 :
      filterStock === "Críticos" ? p.stock > 0 && p.stock <= p.minStock :
      p.stock > p.minStock;
    return matchSearch && matchCat && matchStatus && matchStock;
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.sku.trim()) e.sku = "Código obligatorio";
    if (!form.name.trim()) e.name = "Nombre obligatorio";
    if (form.costPrice <= 0) e.costPrice = "Debe ser mayor a 0";
    if (form.salePrice < form.costPrice) e.salePrice = "No puede ser menor al costo";
    if (form.minStock >= form.maxStock) e.minStock = "Mínimo debe ser menor al máximo";
    if (!editing && products.find((p) => p.sku === form.sku)) e.sku = "Código ya existe";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku, name: p.name, category: p.category, subcategory: p.subcategory,
      costPrice: p.costPrice, salePrice: p.salePrice, stock: p.stock,
      minStock: p.minStock, maxStock: p.maxStock, unit: p.unit,
      location: p.location, supplierId: p.supplierId, status: p.status,
      storageTemp: p.storageTemp || "Ambiente (15–25 °C)",
    });
    setErrors({});
    setShowModal(true);
  };

  const save = () => {
    if (!validate()) return;
    if (editing) {
      updateProduct(editing.id, { ...form });
    } else {
      addProduct({ ...form });
    }
    setShowModal(false);
  };

  const fld = (key: keyof FormType, label: string, type: string = "text", required = false) => (
    <div>
      <label style={{ display: "block", fontSize: 10.5, color: errors[key] ? "#F87171" : "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
        {label}{required && <span style={{ color: "#F87171" }}> *</span>}
      </label>
      <input
        className="wms-input"
        type={type}
        style={{ width: "100%", boxSizing: "border-box", borderColor: errors[key] ? "#3D1414" : undefined }}
        value={(form as any)[key]}
        onChange={(e) => {
          const v = type === "number" ? Number(e.target.value) : e.target.value;
          setForm((p) => ({ ...p, [key]: v }));
          if (errors[key]) setErrors((prev) => { const c = { ...prev }; delete c[key]; return c; });
        }}
      />
      {errors[key] && <div style={{ fontSize: 10, color: "#F87171", marginTop: 3 }}>{errors[key]}</div>}
    </div>
  );

  const stockStatus = (p: Product) => {
    if (p.stock === 0) return <span className="badge badge-red">Agotado</span>;
    if (p.stock <= p.minStock) return <span className="badge badge-amber">Crítico</span>;
    if (p.stock >= p.maxStock) return <span className="badge badge-blue">Lleno</span>;
    return <span className="badge badge-green">Normal</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #111820", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 700, color: "#E2E8F0" }}>Catálogo de Alimentos</h1>
            <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>
              {filtered.length} de {products.length} alimentos
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => exportProductsExcel(products, suppliers)} disabled={products.length === 0}>Excel</button>
            <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => exportProductsPDF(products, suppliers)} disabled={products.length === 0}>PDF</button>
            <DeleteDataButton title="Alimentos" items={products.map((p) => ({ id: p.id, label: p.name, detail: `${p.sku} · Stock: ${p.stock}` }))} onDelete={deleteProducts} onDeleteAll={() => deleteProducts(products.map((p) => p.id))} />
            <button className="btn-primary" onClick={openNew}>+ Nuevo Alimento</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="wms-input" placeholder="Buscar por código, nombre..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          <select className="wms-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option>Todas</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="wms-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option>Todos</option><option>Activo</option><option>Inactivo</option>
          </select>
          <select className="wms-select" value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
            <option>Todos</option><option>Agotados</option><option>Críticos</option><option>Normales</option>
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {products.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <div style={{ fontSize: 48, color: "#1A2232" }}>🥦</div>
            <div style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 600, color: "#4B5A6B" }}>Sin alimentos registrados</div>
            <div style={{ fontSize: 12, color: "#2D4050" }}>Crea tu primer alimento o importa desde Excel</div>
            <button className="btn-primary" style={{ marginTop: 4 }} onClick={openNew}>+ Nuevo Alimento</button>
          </div>
        ) : (
          <table className="wms-table">
            <thead style={{ position: "sticky", top: 0, background: "#080B10", zIndex: 1 }}>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Temp. Almac.</th>
                <th style={{ textAlign: "right" }}>Costo</th>
                <th style={{ textAlign: "right" }}>Venta</th>
                <th style={{ textAlign: "right" }}>Stock</th>
                <th style={{ textAlign: "right" }}>Mín/Máx</th>
                <th>Unidad</th>
                <th>Ubicación</th>
                <th>Proveedor</th>
                <th>Estado Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Valor Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const supplier = suppliers.find((s) => s.id === p.supplierId);
                return (
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => openEdit(p)}>
                    <td className="num" style={{ color: "#F5B21B" }}>{p.sku}</td>
                    <td style={{ fontWeight: 500, color: "#D1D9E2", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</td>
                    <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{p.category}</td>
                    <td style={{ fontSize: 11, color: "#60A5FA", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{p.storageTemp || "—"}</td>
                    <td className="num" style={{ textAlign: "right" }}>{fmtUSD(p.costPrice)}</td>
                    <td className="num" style={{ textAlign: "right" }}>{fmtUSD(p.salePrice)}</td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 700, color: p.stock === 0 ? "#F87171" : p.stock <= p.minStock ? "#FBBF24" : "#E2E8F0" }}>{p.stock}</td>
                    <td className="num" style={{ textAlign: "right", color: "#4B5A6B" }}>{p.minStock}/{p.maxStock}</td>
                    <td>{p.unit}</td>
                    <td className="num">{p.location || "—"}</td>
                    <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", fontSize: 11 }}>{supplier?.name || "—"}</td>
                    <td>{stockStatus(p)}</td>
                    <td><span className={`badge ${p.status === "Activo" ? "badge-green" : "badge-gray"}`}>{p.status}</span></td>
                    <td className="num" style={{ textAlign: "right", color: "#F5B21B", fontWeight: 700 }}>{fmtUSD(p.stock * p.costPrice)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn-secondary" style={{ padding: "3px 10px", fontSize: 11 }} onClick={(e) => { e.stopPropagation(); openEdit(p); }}>Editar</button>
                        <button className="btn-danger" style={{ padding: "3px 8px", fontSize: 11 }} onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${p.name}"?`)) deleteProduct(p.id); }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="wms-card" style={{ width: 620, maxHeight: "92vh", overflow: "auto" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #1A2232", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 16, fontWeight: 700, color: "#E2E8F0" }}>
                {editing ? `Editar: ${editing.name}` : "Nuevo Alimento"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#4B5A6B", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {fld("sku", "Código / SKU", "text", true)}
              {fld("name", "Nombre del Alimento", "text", true)}
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Categoría</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {fld("subcategory", "Subcategoría")}
              {fld("costPrice", "Costo Unitario (S/)", "number", true)}
              {fld("salePrice", "Precio Venta (S/)", "number", true)}
              {!editing && fld("stock", "Stock Inicial", "number")}
              {fld("minStock", "Stock Mínimo", "number")}
              {fld("maxStock", "Stock Máximo", "number")}
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Unidad de Medida</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}>
                  {units.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Temperatura de Almacenamiento</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.storageTemp} onChange={(e) => setForm((p) => ({ ...p, storageTemp: e.target.value }))}>
                  {storageTempOptions.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              {fld("location", "Ubicación (Ej: F-1-02)")}
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Proveedor</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))}>
                  <option value="">— Ninguno —</option>
                  {suppliers.filter((s) => s.status === "Activo").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Estado</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "Activo" | "Inactivo" }))}>
                  <option>Activo</option><option>Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #1A2232", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}>{editing ? "Guardar Cambios" : "Crear Alimento"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
