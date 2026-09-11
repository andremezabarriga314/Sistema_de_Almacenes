import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApp } from "../store/AppContext";
import { exportProductsPDF, exportMovementsPDF } from "../lib/exportPDF";
import { exportProductsExcel, exportMovementsExcel, exportInventoryValueExcel } from "../lib/exportExcel";
import DeleteDataButton from "./DeleteDataButton";

const fmtUSD = (n: number) => "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 2 });

const reportTypes = [
  { id: "inventory", label: "Inventario Actual", icon: "⊞", desc: "Stock completo con valoración" },
  { id: "movements", label: "Todos los Movimientos", icon: "≡", desc: "Entradas, salidas y ajustes" },
  { id: "financial", label: "Reporte Financiero", icon: "◈", desc: "CMVV, margen, rentabilidad" },
  { id: "abc", label: "Análisis ABC (Pareto)", icon: "⊡", desc: "Clasificación 80/20 por valor" },
  { id: "critical", label: "Stock Crítico / Agotados", icon: "⚠", desc: "Productos de riesgo" },
];

export default function Reports() {
  const { products, movements, suppliers, deleteProducts, deleteMovements } = useApp();
  const [selected, setSelected] = useState("inventory");

  const inventoryValue = products.reduce((a, p) => a + p.stock * p.costPrice, 0);
  const entriesTotal = movements.filter((m) => m.type === "Entrada").reduce((a, m) => a + m.total, 0);
  const exitsTotal = movements.filter((m) => m.type === "Salida").reduce((a, m) => a + m.total, 0);

  const abcData = [...products]
    .map((p) => ({ sku: p.sku, name: p.name, value: p.stock * p.costPrice }))
    .sort((a, b) => b.value - a.value);
  const abcTotal = abcData.reduce((a, x) => a + x.value, 0);

  const criticalProducts = products.filter((p) => p.stock === 0 || (p.stock > 0 && p.stock <= p.minStock));

  const handleExcelExport = () => {
    if (selected === "inventory" || selected === "financial" || selected === "abc") exportProductsExcel(products, suppliers);
    else if (selected === "movements") exportMovementsExcel(movements, "Movimientos");
    else if (selected === "critical") exportProductsExcel(criticalProducts, suppliers);
  };

  const handlePDFExport = () => {
    if (selected === "inventory" || selected === "financial" || selected === "abc" || selected === "critical") exportProductsPDF(selected === "critical" ? criticalProducts : products, suppliers);
    else if (selected === "movements") exportMovementsPDF(movements, "Movimientos");
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left panel */}
      <div style={{ width: 260, borderRight: "1px solid #111820", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid #111820" }}>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 18, fontWeight: 700, color: "#E2E8F0", marginBottom: 2 }}>Reportes</h1>
          <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>Selecciona tipo</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {reportTypes.map((r) => (
            <button key={r.id} onClick={() => setSelected(r.id)} style={{ width: "100%", background: selected === r.id ? "rgba(0,200,150,0.08)" : "transparent", border: selected === r.id ? "1px solid rgba(0,200,150,0.2)" : "1px solid transparent", borderRadius: 6, padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 5, textAlign: "left" }}>
              <span style={{ fontSize: 17, color: selected === r.id ? "#F5B21B" : "#2D4050", flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
              <div>
                <div style={{ fontFamily: "Outfit", fontSize: 12.5, fontWeight: 600, color: selected === r.id ? "#F5B21B" : "#94A3B8", marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 10.5, color: "#4B5A6B" }}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #111820", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "Outfit", fontSize: 13, fontWeight: 700, color: "#E2E8F0", flex: 1 }}>
            {reportTypes.find((r) => r.id === selected)?.label}
          </div>
          <button className="btn-secondary" style={{ fontSize: 11 }} onClick={handleExcelExport} disabled={products.length === 0 && movements.length === 0}>
            ⊠ Exportar Excel
          </button>
          <button className="btn-primary" style={{ fontSize: 11 }} onClick={handlePDFExport} disabled={products.length === 0 && movements.length === 0}>
            📄 Exportar PDF
          </button>
          <DeleteDataButton
            title="datos de reportes"
            items={[
              { id: "products", label: "Datos de inventario", detail: `${products.length} alimentos y su valoración` },
              { id: "movements", label: "Datos de movimientos", detail: `${movements.length} entradas, salidas y ajustes` },
            ].filter((item) => item.id === "products" ? products.length > 0 : movements.length > 0)}
            onDelete={(ids) => {
              if (ids.includes("products")) deleteProducts(products.map((p) => p.id));
              if (ids.includes("movements")) deleteMovements(movements.map((m) => m.id));
            }}
            onDeleteAll={() => {
              deleteProducts(products.map((p) => p.id));
              deleteMovements(movements.map((m) => m.id));
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {products.length === 0 && movements.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
              <div style={{ fontSize: 40, color: "#1A2232" }}>⊠</div>
              <div style={{ fontSize: 13, color: "#4B5A6B", fontFamily: "Outfit" }}>Registra productos y movimientos para generar reportes</div>
            </div>
          ) : (
            <>
              {/* INVENTORY */}
              {selected === "inventory" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "Valor Total", value: fmtUSD(inventoryValue), color: "#F5B21B" },
                      { label: "Activos", value: `${products.filter(p => p.status === "Activo").length}`, color: "#38BDF8" },
                      { label: "Agotados", value: `${products.filter(p => p.stock === 0).length}`, color: "#F87171" },
                      { label: "Críticos", value: `${products.filter(p => p.stock > 0 && p.stock <= p.minStock).length}`, color: "#FBBF24" },
                    ].map((k) => (
                      <div key={k.label} className="wms-card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 9.5, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{k.label}</div>
                        <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="wms-card">
                    <table className="wms-table">
                      <thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th style={{ textAlign: "right" }}>Stock</th><th style={{ textAlign: "right" }}>P. Costo</th><th style={{ textAlign: "right" }}>Valor Stock</th><th>Estado</th></tr></thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td className="num" style={{ color: "#F5B21B" }}>{p.sku}</td>
                            <td style={{ fontWeight: 500, color: "#D1D9E2" }}>{p.name}</td>
                            <td>{p.category}</td>
                            <td className="num" style={{ textAlign: "right", fontWeight: 700, color: p.stock === 0 ? "#F87171" : p.stock <= p.minStock ? "#FBBF24" : "#E2E8F0" }}>{p.stock}</td>
                            <td className="num" style={{ textAlign: "right" }}>{fmtUSD(p.costPrice)}</td>
                            <td className="num" style={{ textAlign: "right", fontWeight: 700, color: "#F5B21B" }}>{fmtUSD(p.stock * p.costPrice)}</td>
                            <td><span className={`badge ${p.stock === 0 ? "badge-red" : p.stock <= p.minStock ? "badge-amber" : "badge-green"}`}>{p.stock === 0 ? "Agotado" : p.stock <= p.minStock ? "Crítico" : "Normal"}</span></td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: "2px solid #1A2232" }}>
                          <td colSpan={5} style={{ fontFamily: "Outfit", fontWeight: 700, color: "#E2E8F0", padding: "10px 12px" }}>TOTAL INVENTARIO</td>
                          <td className="num" style={{ textAlign: "right", fontWeight: 700, color: "#F5B21B", fontSize: 14 }}>{fmtUSD(inventoryValue)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* MOVEMENTS */}
              {selected === "movements" && (
                <div className="wms-card">
                  <table className="wms-table">
                    <thead><tr><th>ID</th><th>Fecha</th><th>Tipo</th><th>SKU</th><th>Producto</th><th style={{ textAlign: "right" }}>Cant.</th><th style={{ textAlign: "right" }}>P.Unit</th><th style={{ textAlign: "right" }}>Total</th><th style={{ textAlign: "right" }}>Saldo</th><th>Referencia</th><th>Usuario</th></tr></thead>
                    <tbody>
                      {movements.map((m) => (
                        <tr key={m.id}>
                          <td className="num" style={{ color: "#4B5A6B", fontSize: 10 }}>{m.id}</td>
                          <td className="num">{m.date}</td>
                          <td><span className={`badge ${m.type === "Entrada" ? "badge-green" : m.type === "Salida" ? "badge-red" : "badge-amber"}`}>{m.type}</span></td>
                          <td className="num">{m.sku}</td>
                          <td style={{ color: "#D1D9E2" }}>{m.productName}</td>
                          <td className="num" style={{ textAlign: "right" }}>{m.qty}</td>
                          <td className="num" style={{ textAlign: "right" }}>{fmtUSD(m.unitCost)}</td>
                          <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{fmtUSD(m.total)}</td>
                          <td className="num" style={{ textAlign: "right" }}>{m.balance}</td>
                          <td className="num" style={{ color: "#64748B" }}>{m.reference}</td>
                          <td>{m.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FINANCIAL */}
              {selected === "financial" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[
                    { label: "Total Entradas (Costo)", value: fmtUSD(entriesTotal), color: "#F5B21B", desc: `${movements.filter(m => m.type === "Entrada").length} transacciones` },
                    { label: "Total Salidas (Costo)", value: fmtUSD(exitsTotal), color: "#F87171", desc: `${movements.filter(m => m.type === "Salida").length} transacciones` },
                    { label: "Ganancia Bruta Estimada", value: fmtUSD(movements.filter(m => m.type === "Salida").reduce((a, m) => a + ((m.salePrice || m.unitCost) - m.unitCost) * m.qty, 0)), color: "#A78BFA", desc: "Venta - Costo" },
                    { label: "Valor en Inventario", value: fmtUSD(inventoryValue), color: "#38BDF8", desc: "Stock × Precio costo" },
                    { label: "Costo Mercancía Vendida", value: fmtUSD(exitsTotal), color: "#FBBF24", desc: "CMVV" },
                    { label: "Margen Promedio", value: products.length > 0 ? (products.reduce((a, p) => a + (p.salePrice > 0 ? (p.salePrice - p.costPrice) / p.salePrice : 0), 0) / products.length * 100).toFixed(1) + "%" : "—", color: "#34D399", desc: "Promedio de productos" },
                  ].map((k) => (
                    <div key={k.label} className="wms-card" style={{ padding: "18px 20px" }}>
                      <div style={{ fontSize: 10, color: "#4B5A6B", fontFamily: "Outfit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{k.label}</div>
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: 22, fontWeight: 700, color: k.color, marginBottom: 4 }}>{k.value}</div>
                      <div style={{ fontSize: 10.5, color: "#2D4050" }}>{k.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ABC */}
              {selected === "abc" && abcData.length > 0 && (
                <>
                  <div className="wms-card" style={{ padding: 16, marginBottom: 16 }}>
                    <div style={{ fontFamily: "Outfit", fontSize: 11, fontWeight: 600, color: "#4B5A6B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Valor por Producto (Top {Math.min(abcData.length, 15)})</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={abcData.slice(0, 15)} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#111820" vertical={false} />
                        <XAxis dataKey="sku" tick={{ fill: "#4B5A6B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#4B5A6B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `S/ ${(v / 1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ background: "#0E1219", border: "1px solid #1A2232", borderRadius: 6, fontSize: 11 }} formatter={(v: any) => fmtUSD(Number(v))} />
                        <Bar dataKey="value" name="Valor" fill="#F5B21B" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="wms-card">
                    <table className="wms-table">
                      <thead><tr><th>#</th><th>SKU</th><th>Producto</th><th style={{ textAlign: "right" }}>Valor</th><th style={{ textAlign: "right" }}>% del Total</th><th style={{ textAlign: "right" }}>% Acumulado</th><th>Clase</th></tr></thead>
                      <tbody>
                        {abcData.map((p, i) => {
                          let cumPct = abcData.slice(0, i + 1).reduce((a, x) => a + x.value, 0) / (abcTotal || 1) * 100;
                          const cls = cumPct <= 80 ? "A" : cumPct <= 95 ? "B" : "C";
                          return (
                            <tr key={p.sku}>
                              <td className="num" style={{ color: "#4B5A6B" }}>{i + 1}</td>
                              <td className="num" style={{ color: "#F5B21B" }}>{p.sku}</td>
                              <td style={{ color: "#D1D9E2" }}>{p.name}</td>
                              <td className="num" style={{ textAlign: "right" }}>{fmtUSD(p.value)}</td>
                              <td className="num" style={{ textAlign: "right" }}>{abcTotal > 0 ? (p.value / abcTotal * 100).toFixed(1) : "0.0"}%</td>
                              <td className="num" style={{ textAlign: "right" }}>{cumPct.toFixed(1)}%</td>
                              <td><span className={`badge ${cls === "A" ? "badge-green" : cls === "B" ? "badge-amber" : "badge-gray"}`}>{cls}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* CRITICAL */}
              {selected === "critical" && (
                <div className="wms-card">
                  {criticalProducts.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "#F5B21B", fontFamily: "Outfit", fontSize: 13 }}>✓ No hay productos en estado crítico</div>
                  ) : (
                    <table className="wms-table">
                      <thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th style={{ textAlign: "right" }}>Stock</th><th style={{ textAlign: "right" }}>Mínimo</th><th>Alerta</th><th>Proveedor</th></tr></thead>
                      <tbody>
                        {criticalProducts.map((p) => {
                          const sup = suppliers.find((s) => s.id === p.supplierId);
                          return (
                            <tr key={p.id}>
                              <td className="num" style={{ color: "#F5B21B" }}>{p.sku}</td>
                              <td style={{ color: "#D1D9E2", fontWeight: 500 }}>{p.name}</td>
                              <td>{p.category}</td>
                              <td className="num" style={{ textAlign: "right", fontWeight: 700, color: p.stock === 0 ? "#F87171" : "#FBBF24" }}>{p.stock}</td>
                              <td className="num" style={{ textAlign: "right" }}>{p.minStock}</td>
                              <td><span className={`badge ${p.stock === 0 ? "badge-red" : "badge-amber"}`}>{p.stock === 0 ? "Agotado" : "Crítico"}</span></td>
                              <td style={{ fontSize: 11 }}>{sup?.name || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
