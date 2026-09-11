import { useState } from "react";
import { useApp } from "../store/AppContext";

const adjTypes = ["Merma / Pérdida", "Encontrado", "Error de conteo", "Devolución de cliente", "Transferencia entre almacenes", "Otro"];

export default function Adjustments() {
  const { products, movements, addMovement } = useApp();
  const adjustments = movements.filter((m) => m.type === "Ajuste");

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ productId: "", systemQty: 0, physicalQty: 0, type: "Merma / Pérdida", notes: "" });

  const selectedProd = products.find((p) => p.id === form.productId);
  const diff = form.physicalQty - form.systemQty;

  const submit = () => {
    setError("");
    if (!form.productId) return setError("Selecciona un producto.");
    if (!selectedProd) return;
    if (diff === 0) return setError("No hay diferencia entre el inventario del sistema y el conteo físico.");

    addMovement({
      date: new Date().toISOString().slice(0, 10),
      type: "Ajuste",
      productId: form.productId,
      productName: selectedProd.name,
      sku: selectedProd.sku,
      qty: Math.abs(diff),
      unitCost: selectedProd.costPrice,
      total: Math.abs(diff) * selectedProd.costPrice,
      balance: form.physicalQty,
      reference: `AJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      user: "Admin",
      reason: form.type,
      notes: form.notes,
    });
    setShowModal(false);
    setForm({ productId: "", systemQty: 0, physicalQty: 0, type: "Merma / Pérdida", notes: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #111820", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 700, color: "#E2E8F0" }}>Ajustes de Inventario</h1>
            <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>{adjustments.length} ajustes registrados</div>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)} disabled={products.length === 0}>+ Nuevo Ajuste</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {adjustments.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <div style={{ fontSize: 40, color: "#1A2232" }}>⊡</div>
            <div style={{ fontFamily: "Outfit", fontSize: 14, color: "#4B5A6B" }}>Sin ajustes registrados</div>
            {products.length === 0 && <div style={{ fontSize: 11, color: "#2D4050" }}>Registra productos primero</div>}
          </div>
        ) : (
          <table className="wms-table">
            <thead style={{ position: "sticky", top: 0, background: "#080B10", zIndex: 1 }}>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Tipo de Ajuste</th>
                <th>SKU</th>
                <th>Producto</th>
                <th style={{ textAlign: "right" }}>Diferencia</th>
                <th style={{ textAlign: "right" }}>Saldo</th>
                <th>Usuario</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id}>
                  <td className="num" style={{ color: "#FBBF24" }}>{a.reference}</td>
                  <td className="num">{a.date}</td>
                  <td style={{ color: "#94A3B8" }}>{a.reason || "—"}</td>
                  <td className="num">{a.sku}</td>
                  <td style={{ color: "#D1D9E2" }}>{a.productName}</td>
                  <td className="num" style={{ textAlign: "right", color: "#FBBF24", fontWeight: 700 }}>±{a.qty}</td>
                  <td className="num" style={{ textAlign: "right" }}>{a.balance}</td>
                  <td>{a.user}</td>
                  <td style={{ fontSize: 11, color: "#64748B", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{a.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="wms-card" style={{ width: 480 }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #1A2232", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 16, fontWeight: 700, color: "#E2E8F0" }}>Nuevo Ajuste de Inventario</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#4B5A6B", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Producto *</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.productId} onChange={(e) => { const p = products.find((x) => x.id === e.target.value); setForm((f) => ({ ...f, productId: e.target.value, systemQty: p?.stock || 0, physicalQty: p?.stock || 0 })); setError(""); }}>
                  <option value="">— Seleccionar —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name} (Stock: {p.stock})</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Qty en Sistema</label>
                  <input className="wms-input" type="number" style={{ width: "100%", boxSizing: "border-box", opacity: 0.6 }} value={form.systemQty} readOnly />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Qty Física Contada</label>
                  <input className="wms-input" type="number" style={{ width: "100%", boxSizing: "border-box" }} value={form.physicalQty} onChange={(e) => { setForm((f) => ({ ...f, physicalQty: Number(e.target.value) })); setError(""); }} />
                </div>
              </div>
              {form.productId && (
                <div style={{ background: diff < 0 ? "rgba(239,68,68,0.07)" : diff > 0 ? "rgba(0,200,150,0.06)" : "rgba(100,116,139,0.06)", border: `1px solid ${diff < 0 ? "#3D1414" : diff > 0 ? "rgba(0,200,150,0.2)" : "#1A2232"}`, borderRadius: 5, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#64748B" }}>Diferencia:</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 700, color: diff < 0 ? "#F87171" : diff > 0 ? "#F5B21B" : "#64748B" }}>
                    {diff > 0 ? "+" : ""}{diff} unidades
                  </span>
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Tipo de Ajuste</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {adjTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Observaciones</label>
                <textarea className="wms-input" style={{ width: "100%", boxSizing: "border-box", height: 60, resize: "none" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Descripción del ajuste..." />
              </div>
              {error && (
                <div style={{ padding: "8px 12px", borderRadius: 4, background: "#1E0808", border: "1px solid #3D1010", borderLeft: "3px solid #EF4444" }}>
                  <span style={{ fontSize: 12, color: "#FCA5A5" }}>⚠ {error}</span>
                </div>
              )}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #1A2232", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={submit}>Registrar Ajuste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
