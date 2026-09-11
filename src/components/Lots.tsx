import { useState } from "react";
import { useApp } from "../store/AppContext";
import { exportLotsExcel } from "../lib/exportExcel";
import { exportLotsPDF } from "../lib/exportPDF";
import DeleteDataButton from "./DeleteDataButton";

export default function Lots() {
  const { lots, products, deleteLot, deleteLots } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const today = new Date();

  const enriched = lots.map((l) => {
    const daysLeft = Math.floor((new Date(l.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let status: string = l.status;
    if (l.qty <= 0) status = "Agotado";
    else if (daysLeft < 0) status = "Vencido";
    else if (daysLeft <= 7) status = "Critico";
    else if (daysLeft <= 30) status = "Por vencer";
    else status = "Vigente";
    return { ...l, daysLeft, statusLabel: status };
  });

  const filtered = enriched.filter((l) => {
    const matchSearch = !search || l.productName.toLowerCase().includes(search.toLowerCase()) || l.lotNumber.toLowerCase().includes(search.toLowerCase()) || l.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todos" || l.statusLabel === filterStatus;
    return matchSearch && matchStatus;
  });

  const badgeClass: Record<string, string> = {
    Vigente: "badge-green",
    "Por vencer": "badge-amber",
    Critico: "badge-red",
    Vencido: "badge-red",
    Agotado: "badge-gray",
  };

  const expiredCount = enriched.filter((l) => l.statusLabel === "Vencido").length;
  const criticalCount = enriched.filter((l) => l.statusLabel === "Critico").length;
  const soonCount = enriched.filter((l) => l.statusLabel === "Por vencer").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #111820", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 700, color: "#E2E8F0" }}>Control de Lotes</h1>
            <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>{filtered.length} lotes</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {expiredCount > 0 && <div style={{ background: "#1E0808", border: "1px solid #3D1010", borderRadius: 5, padding: "5px 12px", fontSize: 11, color: "#F87171", fontFamily: "JetBrains Mono" }}>{expiredCount} VENCIDO{expiredCount > 1 ? "S" : ""}</div>}
            {criticalCount > 0 && <div style={{ background: "#1E0808", border: "1px solid #3D1010", borderRadius: 5, padding: "5px 12px", fontSize: 11, color: "#F87171", fontFamily: "JetBrains Mono" }}>{criticalCount} CRITICO{criticalCount > 1 ? "S" : ""} (&lt;7d)</div>}
            {soonCount > 0 && <div style={{ background: "#2A1E08", border: "1px solid #3D2C10", borderRadius: 5, padding: "5px 12px", fontSize: 11, color: "#FBBF24", fontFamily: "JetBrains Mono" }}>{soonCount} POR VENCER</div>}
            <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => exportLotsExcel(lots)} disabled={lots.length === 0}>Excel</button>
            <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => exportLotsPDF(lots)} disabled={lots.length === 0}>PDF</button>
            <DeleteDataButton title="Lotes" items={lots.map((l) => ({ id: l.id, label: `${l.productName} · ${l.lotNumber}`, detail: `Vence: ${l.expiryDate} · Cantidad: ${l.qty}` }))} onDelete={deleteLots} onDeleteAll={() => deleteLots(lots.map((l) => l.id))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="wms-input" placeholder="Buscar por lote, alimento, codigo..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
          <select className="wms-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option>Todos</option>
            <option>Vigente</option>
            <option>Por vencer</option>
            <option>Critico</option>
            <option>Vencido</option>
            <option>Agotado</option>
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {lots.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <div style={{ fontSize: 40, color: "#1A2232" }}>L</div>
            <div style={{ fontFamily: "Outfit", fontSize: 14, color: "#4B5A6B" }}>Sin lotes registrados</div>
            <div style={{ fontSize: 11, color: "#2D4050" }}>Los lotes se crean automaticamente al registrar una entrada</div>
          </div>
        ) : (
          <table className="wms-table">
            <thead style={{ position: "sticky", top: 0, background: "#080B10", zIndex: 1 }}>
              <tr>
                <th>ID Lote</th>
                <th>Num. Lote</th>
                <th>Codigo</th>
                <th>Alimento</th>
                <th>Vencimiento</th>
                <th style={{ textAlign: "right" }}>Dias Restantes</th>
                <th style={{ textAlign: "right" }}>Qty Restante</th>
                <th>Unidad</th>
                <th style={{ textAlign: "right" }}>Costo Unit.</th>
                <th>Recibido</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)).map((l) => {
                const prod = products.find((p) => p.id === l.productId);
                const isUrgent = l.statusLabel === "Vencido" || l.statusLabel === "Critico";
                return (
                  <tr key={l.id} style={{ background: isUrgent ? "rgba(239,68,68,0.03)" : undefined }}>
                    <td className="num" style={{ color: "#4B5A6B", fontSize: 10 }}>{l.id}</td>
                    <td className="num" style={{ color: "#A78BFA", fontWeight: 600 }}>{l.lotNumber}</td>
                    <td className="num">{l.sku}</td>
                    <td style={{ fontWeight: 500, color: "#D1D9E2", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{l.productName}</td>
                    <td className="num" style={{ color: isUrgent ? "#F87171" : l.statusLabel === "Por vencer" ? "#FBBF24" : "#F5B21B" }}>{l.expiryDate}</td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 700, color: l.daysLeft < 0 ? "#F87171" : l.daysLeft <= 7 ? "#F87171" : l.daysLeft <= 30 ? "#FBBF24" : "#F5B21B" }}>
                      {l.daysLeft < 0 ? "VENCIDO" : l.daysLeft + "d"}
                    </td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 700, color: l.qty === 0 ? "#4B5A6B" : "#E2E8F0" }}>{l.qty}</td>
                    <td style={{ fontSize: 11 }}>{prod ? prod.unit : "---"}</td>
                    <td className="num" style={{ textAlign: "right" }}>S/ {l.unitCost.toFixed(2)}</td>
                    <td className="num">{l.receivedDate}</td>
                    <td><span className={"badge " + (badgeClass[l.statusLabel] || "badge-gray")}>{l.statusLabel}</span></td>
                    <td style={{ textAlign: "center" }}>
                      <button onClick={() => { if (confirm("¿Eliminar este lote?")) deleteLot(l.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D1414", fontSize: 14, lineHeight: 1, padding: "2px 6px", borderRadius: 3 }} onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")} onMouseLeave={(e) => (e.currentTarget.style.color = "#3D1414")}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
