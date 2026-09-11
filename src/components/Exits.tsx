import { useState } from "react";
import { useApp } from "../store/AppContext";
import { exportMovementsPDF } from "../lib/exportPDF";
import { exportMovementsExcel } from "../lib/exportExcel";
import DeleteDataButton from "./DeleteDataButton";

const fmtUSD = (n: number) => "S/ " + n.toFixed(2);
const motivos = ["Venta", "Devolución a proveedor", "Merma", "Robo / Pérdida", "Transferencia", "Consumo interno", "Otro"];

export default function Exits() {
  const { products, movements, addMovement, deleteMovement, deleteMovements } = useApp();
  const exits = movements.filter((m) => m.type === "Salida");

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ productId: "", qty: 1, salePrice: 0, client: "", reference: "", reason: "Venta" });

  const filtered = exits.filter(
    (m) => !search || m.productName.toLowerCase().includes(search.toLowerCase()) || m.reference.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === form.productId);
  const hasStock = !selectedProduct || selectedProduct.stock >= form.qty;
  const total = form.qty * form.salePrice;

  const submit = () => {
    setError("");
    if (!form.productId) return setError("Selecciona un producto.");
    if (form.qty <= 0) return setError("La cantidad debe ser mayor a 0.");
    if (!selectedProduct) return;
    if (selectedProduct.status === "Inactivo") return setError("El producto está inactivo.");
    if (selectedProduct.stock < form.qty) return setError(`Stock insuficiente. Disponible: ${selectedProduct.stock} ${selectedProduct.unit}, solicitado: ${form.qty}.`);

    addMovement({
      date: new Date().toISOString().slice(0, 10),
      type: "Salida",
      productId: form.productId,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      qty: form.qty,
      unitCost: selectedProduct.costPrice,
      salePrice: form.salePrice,
      total: form.salePrice > 0 ? total : form.qty * selectedProduct.costPrice,
      balance: selectedProduct.stock - form.qty,
      reference: form.reference || `VTA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      user: "Admin",
      client: form.client,
      reason: form.reason,
    });
    setShowModal(false);
    setForm({ productId: "", qty: 1, salePrice: 0, client: "", reference: "", reason: "Venta" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #111820", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 700, color: "#E2E8F0" }}>Salidas de Mercancía</h1>
            <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>
              {filtered.length} registros · Total: {fmtUSD(exits.reduce((a, m) => a + m.total, 0))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => exportMovementsExcel(exits, "Salidas")} disabled={exits.length === 0}>Excel</button>
            <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => exportMovementsPDF(exits, "Salidas")} disabled={exits.length === 0}>PDF</button>
            <DeleteDataButton title="Salidas" items={exits.map((m) => ({ id: m.id, label: `${m.productName} · ${m.qty} unidades`, detail: `${m.date} · ${m.reference}` }))} onDelete={deleteMovements} onDeleteAll={() => deleteMovements(exits.map((m) => m.id))} />
            <button className="btn-primary" onClick={() => setShowModal(true)} disabled={products.length === 0}>+ Registrar Salida</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="wms-input" placeholder="Buscar por producto, referencia..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {exits.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <div style={{ fontSize: 40, color: "#1A2232" }}>↑</div>
            <div style={{ fontFamily: "Outfit", fontSize: 14, color: "#4B5A6B" }}>Sin salidas registradas</div>
          </div>
        ) : (
          <table className="wms-table">
            <thead style={{ position: "sticky", top: 0, background: "#080B10", zIndex: 1 }}>
              <tr>
                <th>ID</th>
                <th>Referencia</th>
                <th>Fecha</th>
                <th>SKU</th>
                <th>Producto</th>
                <th>Cliente / Destino</th>
                <th>Motivo</th>
                <th style={{ textAlign: "right" }}>Cantidad</th>
                <th style={{ textAlign: "right" }}>P. Costo</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td className="num" style={{ color: "#4B5A6B", fontSize: 10.5 }}>{m.id}</td>
                  <td className="num" style={{ color: "#F87171" }}>{m.reference}</td>
                  <td className="num">{m.date}</td>
                  <td className="num">{m.sku}</td>
                  <td style={{ fontWeight: 500, color: "#D1D9E2", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{m.productName}</td>
                  <td style={{ fontSize: 11, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{m.client || "—"}</td>
                  <td><span className="badge badge-gray" style={{ fontSize: 9.5 }}>{m.reason || "Venta"}</span></td>
                  <td className="num" style={{ textAlign: "right", color: "#F87171", fontWeight: 700 }}>-{m.qty}</td>
                  <td className="num" style={{ textAlign: "right" }}>{fmtUSD(m.unitCost)}</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{fmtUSD(m.total)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{m.balance}</td>
                  <td style={{ textAlign: "center" }}>
                    <button onClick={() => { if (confirm("¿Eliminar esta salida?")) deleteMovement(m.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D1414", fontSize: 14, lineHeight: 1, padding: "2px 6px", borderRadius: 3 }} onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")} onMouseLeave={(e) => (e.currentTarget.style.color = "#3D1414")}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="wms-card" style={{ width: 500 }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #1A2232", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "Outfit", fontSize: 16, fontWeight: 700, color: "#E2E8F0" }}>Registrar Salida</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#4B5A6B", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Producto *</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.productId} onChange={(e) => { const p = products.find((x) => x.id === e.target.value); setForm((f) => ({ ...f, productId: e.target.value, salePrice: p?.salePrice || 0 })); setError(""); }}>
                  <option value="">— Seleccionar —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock === 0 || p.status === "Inactivo"}>
                      {p.sku} — {p.name} {p.stock === 0 ? "(AGOTADO)" : `(Stock: ${p.stock} ${p.unit})`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProduct && (
                <div style={{ gridColumn: "1 / -1", background: hasStock ? "rgba(0,200,150,0.04)" : "rgba(239,68,68,0.07)", border: `1px solid ${hasStock ? "rgba(0,200,150,0.15)" : "#3D1414"}`, borderRadius: 5, padding: "8px 12px", display: "flex", gap: 24 }}>
                  <span style={{ fontSize: 11, color: "#4B5A6B" }}>Disponible: <span style={{ color: hasStock ? "#F5B21B" : "#F87171", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{selectedProduct.stock} {selectedProduct.unit}</span></span>
                  <span style={{ fontSize: 11, color: "#4B5A6B" }}>P. Venta: <span style={{ color: "#E2E8F0", fontFamily: "JetBrains Mono" }}>{fmtUSD(selectedProduct.salePrice)}</span></span>
                  <span style={{ fontSize: 11, color: "#4B5A6B" }}>Ubicación: <span style={{ color: "#94A3B8", fontFamily: "JetBrains Mono" }}>{selectedProduct.location || "—"}</span></span>
                </div>
              )}
              {[
                { label: "Cantidad *", key: "qty", type: "number" },
                { label: "Precio de Venta (S/)", key: "salePrice", type: "number" },
                { label: "Cliente / Destino", key: "client", type: "text" },
                { label: "N° Comprobante", key: "reference", type: "text" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</label>
                  <input className="wms-input" type={f.type} style={{ width: "100%", boxSizing: "border-box" }} value={(form as any)[f.key]} onChange={(e) => { setForm((p) => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })); setError(""); }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Motivo</label>
                <select className="wms-select" style={{ width: "100%" }} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}>
                  {motivos.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              {error && (
                <div style={{ gridColumn: "1 / -1", padding: "8px 12px", borderRadius: 4, background: "#1E0808", border: "1px solid #3D1010", borderLeft: "3px solid #EF4444" }}>
                  <span style={{ fontSize: 12, color: "#FCA5A5" }}>⚠ {error}</span>
                </div>
              )}
              {!error && form.productId && form.qty > 0 && (
                <div style={{ gridColumn: "1 / -1", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 5, padding: "9px 12px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#64748B" }}>Total de la salida:</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 700, color: "#F87171" }}>{fmtUSD(total)}</span>
                </div>
              )}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #1A2232", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-danger" onClick={submit}>Confirmar Salida</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
