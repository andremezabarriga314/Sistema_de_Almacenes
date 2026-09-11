import { useState } from "react";
import { useApp, Supplier } from "../store/AppContext";
import { exportSuppliersPDF } from "../lib/exportPDF";
import { exportSuppliersExcel } from "../lib/exportExcel";

const emptyForm = {
  name: "", ruc: "", contact: "", phone: "", email: "",
  address: "", paymentTerms: "30 días", deliveryDays: 3,
  rating: 5, status: "Activo" as const, notes: "",
};

const Star = ({ filled, onClick }: { filled: boolean; onClick?: () => void }) => (
  <span onClick={onClick} style={{ color: filled ? "#FBBF24" : "#1E2D3D", fontSize: 14, cursor: onClick ? "pointer" : "default" }}>★</span>
);

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, movements, products } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<typeof emptyForm, "status"> & { status: "Activo" | "Inactivo" }>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = suppliers.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.ruc.includes(search);
    const matchStatus = filterStatus === "Todos" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getSupplierStats = (s: Supplier) => {
    const mots = movements.filter((m) => m.supplierId === s.id && m.type === "Entrada");
    return {
      totalPurchases: mots.reduce((a, m) => a + m.total, 0),
      transactions: mots.length,
    };
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, ruc: s.ruc, contact: s.contact, phone: s.phone, email: s.email, address: s.address, paymentTerms: s.paymentTerms, deliveryDays: s.deliveryDays, rating: s.rating, status: s.status, notes: s.notes || "" });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nombre obligatorio";
    if (!form.ruc.trim()) e.ruc = "RUC / NIT obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    if (editing) {
      updateSupplier(editing.id, { ...form });
      if (selected?.id === editing.id) setSelected((prev) => prev ? { ...prev, ...form } : null);
    } else {
      addSupplier({ ...form });
    }
    setShowModal(false);
  };

  const fmtUSD = (n: number) => "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 2 });

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* List */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: selected ? "1px solid #111820" : "none" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #111820", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 700, color: "#E2E8F0" }}>Proveedores</h1>
              <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>{filtered.length} proveedores</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => exportSuppliersExcel(suppliers)} disabled={suppliers.length === 0}>Excel</button>
              <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => exportSuppliersPDF(suppliers)} disabled={suppliers.length === 0}>PDF</button>
              <button className="btn-primary" onClick={openNew}>+ Nuevo Proveedor</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="wms-input" placeholder="Buscar por nombre, RUC..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 260 }} />
            <select className="wms-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option>Todos</option>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {suppliers.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
              <div style={{ fontSize: 48, color: "#1A2232" }}>◈</div>
              <div style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 600, color: "#4B5A6B" }}>Sin proveedores registrados</div>
              <div style={{ fontSize: 12, color: "#2D4050" }}>Registra tus proveedores para asociarlos a entradas y productos</div>
              <button className="btn-primary" style={{ marginTop: 4 }} onClick={openNew}>+ Nuevo Proveedor</button>
            </div>
          ) : (
            <table className="wms-table">
              <thead style={{ position: "sticky", top: 0, background: "#080B10", zIndex: 1 }}>
                <tr>
                  <th>Razón Social</th>
                  <th>RUC / NIT</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Cond. Pago</th>
                  <th style={{ textAlign: "center" }}>Entrega</th>
                  <th style={{ textAlign: "center" }}>Calif.</th>
                  <th style={{ textAlign: "right" }}>Total Compras</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const stats = getSupplierStats(s);
                  return (
                    <tr key={s.id} style={{ cursor: "pointer", background: selected?.id === s.id ? "rgba(0,200,150,0.04)" : undefined }} onClick={() => setSelected(s)}>
                      <td style={{ fontWeight: 600, color: "#D1D9E2" }}>{s.name}</td>
                      <td className="num">{s.ruc}</td>
                      <td>{s.contact}</td>
                      <td className="num">{s.phone}</td>
                      <td style={{ fontSize: 11 }}>{s.email}</td>
                      <td>{s.paymentTerms}</td>
                      <td className="num" style={{ textAlign: "center" }}>{s.deliveryDays}d</td>
                      <td style={{ textAlign: "center" }}>
                        {[1,2,3,4,5].map((i) => <Star key={i} filled={i <= s.rating} />)}
                      </td>
                      <td className="num" style={{ textAlign: "right", color: "#F5B21B" }}>{fmtUSD(stats.totalPurchases)}</td>
                      <td><span className={`badge ${s.status === "Activo" ? "badge-green" : "badge-gray"}`}>{s.status}</span></td>
                      <td>
                        <button className="btn-secondary" style={{ padding: "3px 10px", fontSize: 11 }} onClick={(e) => { e.stopPropagation(); openEdit(s); }}>Editar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (() => {
        const stats = getSupplierStats(selected);
        const supplierMovements = movements.filter((m) => m.supplierId === selected.id);
        const supplierProducts = products.filter((p) => p.supplierId === selected.id);
        return (
          <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #111820", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: 700, color: "#E2E8F0", marginBottom: 2 }}>{selected.name}</div>
                <div style={{ fontSize: 10.5, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>{selected.ruc}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#4B5A6B", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Total Compras", value: fmtUSD(stats.totalPurchases), color: "#F5B21B" },
                  { label: "Transacciones", value: `${stats.transactions}`, color: "#38BDF8" },
                  { label: "Días Entrega", value: `${selected.deliveryDays}d`, color: "#FBBF24" },
                  { label: "Calificación", value: `${selected.rating}/5`, color: "#A78BFA" },
                ].map((k) => (
                  <div key={k.label} style={{ background: "#0E1219", border: "1px solid #1A2232", borderRadius: 5, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{k.label}</div>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
              {[
                { label: "Contacto", value: selected.contact },
                { label: "Teléfono", value: selected.phone },
                { label: "Email", value: selected.email },
                { label: "Dirección", value: selected.address },
                { label: "Condición de Pago", value: selected.paymentTerms },
              ].filter((f) => f.value).map((f) => (
                <div key={f.label}>
                  <div style={{ fontSize: 9.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{f.value}</div>
                </div>
              ))}
              {supplierProducts.length > 0 && (
                <div>
                  <div style={{ fontSize: 9.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Productos asociados ({supplierProducts.length})
                  </div>
                  {supplierProducts.slice(0, 4).map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #111820", fontSize: 11 }}>
                      <span style={{ color: "#94A3B8" }}>{p.name}</span>
                      <span style={{ color: "#F5B21B", fontFamily: "JetBrains Mono" }}>Stock: {p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
              {supplierMovements.length > 0 && (
                <div>
                  <div style={{ fontSize: 9.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Últimas Entradas
                  </div>
                  {supplierMovements.slice(0, 4).map((m) => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #111820", fontSize: 11 }}>
                      <span style={{ color: "#64748B", fontFamily: "JetBrains Mono" }}>{m.date}</span>
                      <span style={{ color: "#F5B21B", fontFamily: "JetBrains Mono" }}>{fmtUSD(m.total)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="btn-secondary" style={{ flex: 1, fontSize: 11 }} onClick={() => openEdit(selected)}>Editar</button>
                <button className="btn-danger" style={{ flex: 1, fontSize: 11 }} onClick={() => { deleteSupplier(selected.id); setSelected(null); }}>Inactivar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="wms-card" style={{ width: 560, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #1A2232", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "Outfit", fontSize: 16, fontWeight: 700, color: "#E2E8F0" }}>{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#4B5A6B", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {([
                ["name", "Razón Social / Nombre", "text"],
                ["ruc", "RUC / NIT / Documento fiscal", "text"],
                ["contact", "Nombre del Contacto", "text"],
                ["phone", "Teléfono", "text"],
                ["email", "Email", "email"],
                ["address", "Dirección", "text"],
                ["paymentTerms", "Condición de Pago (ej: 30 días)", "text"],
                ["deliveryDays", "Días de Entrega Promedio", "number"],
              ] as [string, string, string][]).map(([key, label, type]) => (
                <div key={key} style={key === "address" || key === "paymentTerms" ? { gridColumn: "1 / -1" } : {}}>
                  <label style={{ display: "block", fontSize: 10.5, color: errors[key] ? "#F87171" : "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                    {label}{["name","ruc"].includes(key) && <span style={{ color: "#F87171" }}> *</span>}
                  </label>
                  <input className="wms-input" type={type} style={{ width: "100%", boxSizing: "border-box", borderColor: errors[key] ? "#3D1414" : undefined }} value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))} />
                  {errors[key] && <div style={{ fontSize: 10, color: "#F87171", marginTop: 3 }}>{errors[key]}</div>}
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Calificación</label>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map((i) => <Star key={i} filled={i <= form.rating} onClick={() => setForm((p) => ({ ...p, rating: i }))} />)}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Estado</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "Activo" | "Inactivo" }))}>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Observaciones</label>
                <textarea className="wms-input" style={{ width: "100%", boxSizing: "border-box", height: 56, resize: "none" }} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #1A2232", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}>{editing ? "Guardar Cambios" : "Crear Proveedor"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
