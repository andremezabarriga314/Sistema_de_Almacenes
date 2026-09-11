import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useApp } from "../store/AppContext";

const fmtUSD = (n: number) =>
  "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (n: number) => n.toLocaleString("es-EC");

const PIE_COLORS = ["#F5B21B", "#38BDF8", "#A78BFA", "#FBBF24", "#64748B"];

function EmptyChart({ label }: { label: string }) {
  return (
    <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <div style={{ fontSize: 28, color: "#1A2232" }}>⬡</div>
      <div style={{ fontSize: 11, color: "#2D4050", fontFamily: "JetBrains Mono" }}>{label}</div>
    </div>
  );
}

export default function Dashboard({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const { products, movements, suppliers, lots } = useApp();

  const totalValue = products.reduce((a, p) => a + p.stock * p.costPrice, 0);
  const activeProducts = products.filter((p) => p.status === "Activo").length;
  const outOfStock = products.filter((p) => p.stock === 0 && p.status === "Activo").length;
  const criticalStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;

  const thisMonthEntries = movements.filter((m) => m.type === "Entrada");
  const thisMonthExits = movements.filter((m) => m.type === "Salida");
  const entriesTotal = thisMonthEntries.reduce((a, m) => a + m.total, 0);
  const exitsTotal = thisMonthExits.reduce((a, m) => a + m.total, 0);

  // Category distribution
  const catMap: Record<string, number> = {};
  products.forEach((p) => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
  const catData = Object.entries(catMap).map(([name, value], i) => ({ name, value, fill: PIE_COLORS[i % PIE_COLORS.length] }));

  // Last 6 movements grouped by date (simplified bar data)
  const movByDate: Record<string, { entradas: number; salidas: number }> = {};
  movements.forEach((m) => {
    const d = m.date.slice(0, 7); // YYYY-MM
    if (!movByDate[d]) movByDate[d] = { entradas: 0, salidas: 0 };
    if (m.type === "Entrada") movByDate[d].entradas += m.total;
    if (m.type === "Salida") movByDate[d].salidas += m.total;
  });
  const barData = Object.entries(movByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mes, v]) => ({ mes: mes.slice(5), ...v }));

  const today = new Date();
  const lotsWithDays = lots.map((l) => ({ ...l, daysLeft: Math.floor((new Date(l.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) }));
  const expiredLots = lotsWithDays.filter((l) => l.qty > 0 && l.daysLeft < 0);
  const criticalLots = lotsWithDays.filter((l) => l.qty > 0 && l.daysLeft >= 0 && l.daysLeft <= 7);
  const soonLots = lotsWithDays.filter((l) => l.qty > 0 && l.daysLeft > 7 && l.daysLeft <= 30);

  const alerts = [
    ...expiredLots.map((l) => ({ type: "critical", msg: `Lote ${l.lotNumber} (${l.productName}) — VENCIDO` })),
    ...criticalLots.map((l) => ({ type: "critical", msg: `Lote ${l.lotNumber} (${l.productName}) — vence en ${l.daysLeft}d` })),
    ...products.filter((p) => p.stock === 0 && p.status === "Activo").map((p) => ({ type: "warning", msg: `${p.name} — Sin stock` })),
    ...products.filter((p) => p.stock > 0 && p.stock <= p.minStock).map((p) => ({ type: "warning", msg: `${p.name} — Stock crítico (${p.stock})` })),
    ...soonLots.map((l) => ({ type: "info", msg: `Lote ${l.lotNumber} (${l.productName}) — vence en ${l.daysLeft}d` })),
  ].slice(0, 8);

  const recentMovements = movements.slice(0, 8);

  const kpis = [
    { label: "Valor Total Inventario", value: fmtUSD(totalValue), sub: `${products.length} alimentos`, color: "#F5B21B", icon: "◈" },
    { label: "Alimentos Activos", value: fmt(activeProducts), sub: `${outOfStock} agotados`, color: "#38BDF8", icon: "⊞" },
    { label: "Lotes Vencidos", value: fmt(expiredLots.length), sub: "requieren retiro", color: "#EF4444", icon: "✕" },
    { label: "Por Vencer (30d)", value: fmt(soonLots.length + criticalLots.length), sub: `${criticalLots.length} críticos (<7d)`, color: "#F59E0B", icon: "⚠" },
    { label: "Entradas (total)", value: fmtUSD(entriesTotal), sub: `${thisMonthEntries.length} registros`, color: "#34D399", icon: "↓" },
    { label: "Salidas (total)", value: fmtUSD(exitsTotal), sub: `${thisMonthExits.length} registros`, color: "#F472B6", icon: "↑" },
  ];

  const isEmpty = products.length === 0;

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 700, color: "#E2E8F0", marginBottom: 2 }}>
              Dashboard
            </h1>
            <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>
              {new Date().toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          {onNavigate && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => onNavigate("entries")}>+ Entrada</button>
              <button className="btn-primary" onClick={() => onNavigate("products")}>+ Producto</button>
            </div>
          )}
        </div>
      </div>

      {/* Empty welcome state */}
      {isEmpty && (
        <div style={{ background: "rgba(0,200,150,0.05)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 10, padding: "28px 32px", marginBottom: 24 }}>
          <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 16, fontWeight: 700, color: "#F5B21B", marginBottom: 8 }}>
            Bienvenido a Sistema de Almacenes INAMBU
          </div>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16, lineHeight: 1.6 }}>
            El sistema está listo. Empieza registrando tus proveedores y productos para comenzar a gestionar tu inventario.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {onNavigate && [
              { label: "1. Registrar Proveedores", page: "suppliers" },
              { label: "2. Registrar Productos", page: "products" },
              { label: "3. Registrar Primera Entrada", page: "entries" },
              { label: "4. Importar desde Excel", page: "import" },
            ].map((s) => (
              <button key={s.page} className="btn-secondary" style={{ fontSize: 12 }} onClick={() => onNavigate(s.page)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.label} className="wms-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: "#4B5A6B", fontFamily: "Outfit, sans-serif", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {k.label}
              </span>
              <span style={{ fontSize: 15, color: k.color }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: k.color, marginBottom: 2 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 10, color: "#2D4050", fontFamily: "JetBrains Mono" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.8fr", gap: 16, marginBottom: 20 }}>
        <div className="wms-card" style={{ padding: 16 }}>
          <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 11, fontWeight: 600, color: "#4B5A6B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Movimientos por Período (Entradas vs. Salidas)
          </div>
          {barData.length === 0 ? <EmptyChart label="Sin movimientos aún" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#111820" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "#4B5A6B", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4B5A6B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `S/ ${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: "#0E1219", border: "1px solid #1A2232", borderRadius: 6, fontSize: 11 }} formatter={(v: any) => fmtUSD(Number(v))} />
                <Bar dataKey="entradas" name="Entradas" fill="#F5B21B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="salidas" name="Salidas" fill="#1E3A50" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#4B5A6B" }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="wms-card" style={{ padding: 16 }}>
          <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 11, fontWeight: 600, color: "#4B5A6B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Valor Acumulado de Entradas
          </div>
          {movements.length === 0 ? <EmptyChart label="Sin movimientos aún" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={movements.slice().reverse().map((m, i) => ({ i: i + 1, valor: m.balance * m.unitCost }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111820" vertical={false} />
                <XAxis dataKey="i" tick={{ fill: "#4B5A6B", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4B5A6B", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `S/ ${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: "#0E1219", border: "1px solid #1A2232", borderRadius: 6, fontSize: 11 }} formatter={(v: any) => fmtUSD(Number(v))} />
                <Line type="monotone" dataKey="valor" stroke="#F5B21B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="wms-card" style={{ padding: 16 }}>
          <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 11, fontWeight: 600, color: "#4B5A6B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Por Categoría
          </div>
          {catData.length === 0 ? <EmptyChart label="Sin productos aún" /> : (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={30} outerRadius={52} dataKey="value" paddingAngle={2}>
                    {catData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0E1219", border: "1px solid #1A2232", borderRadius: 6, fontSize: 11 }} formatter={(v: any) => `${v} prods.`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 8px" }}>
                {catData.map((c) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>
                    <span style={{ width: 5, height: 5, background: c.fill, borderRadius: 1, display: "inline-block" }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="wms-card">
          <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #111820" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontSize: 11, fontWeight: 600, color: "#4B5A6B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Últimos Movimientos
            </span>
          </div>
          {recentMovements.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "#2D4050", fontSize: 12 }}>
              Ningún movimiento registrado aún
            </div>
          ) : (
            <table className="wms-table">
              <thead>
                <tr>
                  <th>Ref.</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((m) => (
                  <tr key={m.id}>
                    <td className="num" style={{ fontSize: 10.5, color: "#4B5A6B" }}>{m.reference}</td>
                    <td className="num">{m.date}</td>
                    <td><span className={`badge ${m.type === "Entrada" ? "badge-green" : m.type === "Salida" ? "badge-red" : m.type === "Ajuste" ? "badge-amber" : "badge-blue"}`}>{m.type}</span></td>
                    <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{m.productName}</td>
                    <td className="num" style={{ textAlign: "right" }}>{fmtUSD(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="wms-card">
          <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #111820", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontSize: 11, fontWeight: 600, color: "#4B5A6B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Alertas de Stock
            </span>
            {alerts.length > 0 && <span className="badge badge-red">{alerts.length}</span>}
          </div>
          {alerts.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "#2D4050", fontSize: 12 }}>
              {products.length === 0 ? "Registra productos para ver alertas" : "✓ Sin alertas de stock activas"}
            </div>
          ) : (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.map((a, i) => (
                <div key={i} className={a.type === "critical" ? "alert-critical" : "alert-warning"} style={{ padding: "7px 10px", borderRadius: 4 }}>
                  <div style={{ fontSize: 11.5, color: "#FCA5A5" }}>{a.msg}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
