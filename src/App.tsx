import { useState, useEffect } from "react";
import { AppProvider, useApp } from "./store/AppContext";
import { AuthProvider, useAuth } from "./store/AuthContext";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Products from "./components/Products";
import Entries from "./components/Entries";
import Exits from "./components/Exits";
import Kardex from "./components/Kardex";
import Suppliers from "./components/Suppliers";
import Adjustments from "./components/Adjustments";
import Reports from "./components/Reports";
import ImportExport from "./components/ImportExport";
import Lots from "./components/Lots";
import Audit from "./components/Audit";
import Trash from "./components/Trash";

type Page =
  | "dashboard"
  | "products"
  | "entries"
  | "exits"
  | "lots"
  | "kardex"
  | "suppliers"
  | "adjustments"
  | "reports"
  | "import"
  | "audit"
  | "trash";

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  products: "Productos",
  entries: "Entradas",
  exits: "Salidas",
  lots: "Lotes",
  kardex: "Kárdex",
  suppliers: "Proveedores",
  adjustments: "Ajustes",
  reports: "Reportes",
  import: "Importar / Exportar",
  audit: "Auditoría",
  trash: "Papelera",
};

function AppShell({ user, logout }: { user: { name: string; username: string }; logout: () => void }) {
  const { products, movements, lots, suppliers } = useApp();
  const [page, setPage] = useState<Page>("dashboard");
  const [welcome, setWelcome] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    if (welcome) {
      const t = setTimeout(() => setWelcome(false), 3000);
      return () => clearTimeout(t);
    }
  }, [welcome]);

  if (welcome) {
    return (
      <div style={{ height: "100dvh", background: "#060810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", gap: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(245,178,27,0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #F5B21B, #C98200)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "0 0 40px rgba(245,178,27,0.35)", marginBottom: 8 }}>⊞</div>
        <div style={{ fontSize: 13, color: "#2D4050", fontFamily: "JetBrains Mono", letterSpacing: "0.12em", textTransform: "uppercase" }}>Bienvenido a INAMBU · Sistema de almacenes</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.02em" }}>
          Hola, <span style={{ color: "#F5B21B" }}>{user.name}</span> 👋
        </div>
        <div style={{ fontSize: 13, color: "#4B5A6B" }}>Cargando tu espacio de trabajo...</div>
        <div style={{ marginTop: 20, width: 200, height: 3, background: "#0D1520", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #F5B21B, #D99000)", borderRadius: 99, animation: "progress 2.8s ease-out forwards" }} />
        </div>
        <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
      </div>
    );
  }

  const searchTerm = globalSearch.trim().toLowerCase();
  const searchResults = searchTerm
    ? [
        ...products
          .filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(searchTerm))
          .map((p) => ({ type: "Alimento", label: p.name, detail: `${p.sku} · ${p.category}`, page: "products" as Page })),
        ...movements
          .filter((m) => `${m.productName} ${m.sku} ${m.reference} ${m.user}`.toLowerCase().includes(searchTerm))
          .map((m) => ({ type: m.type, label: m.productName, detail: `${m.sku} · ${m.reference}`, page: m.type === "Entrada" ? "entries" as Page : m.type === "Salida" ? "exits" as Page : "kardex" as Page })),
        ...lots
          .filter((l) => `${l.productName} ${l.sku} ${l.lotNumber}`.toLowerCase().includes(searchTerm))
          .map((l) => ({ type: "Lote", label: l.productName, detail: `${l.sku} · ${l.lotNumber}`, page: "lots" as Page })),
        ...suppliers
          .filter((s) => `${s.name} ${s.ruc} ${s.contact}`.toLowerCase().includes(searchTerm))
          .map((s) => ({ type: "Proveedor", label: s.name, detail: `${s.ruc} · ${s.contact}`, page: "suppliers" as Page })),
      ].slice(0, 8)
    : [];

  const openSearchResult = (resultPage: Page) => {
    setPage(resultPage);
    setGlobalSearch("");
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={(p) => setPage(p as Page)} />;
      case "products": return <Products />;
      case "entries": return <Entries />;
      case "exits": return <Exits />;
      case "lots": return <Lots />;
      case "kardex": return <Kardex />;
      case "suppliers": return <Suppliers />;
      case "adjustments": return <Adjustments />;
      case "reports": return <Reports />;
      case "import": return <ImportExport />;
      case "audit": return <Audit />;
      case "trash": return <Trash />;
      default: return <Dashboard />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        background: "#080B10",
        color: "#E2E8F0",
        overflow: "hidden",
      }}
    >
      <Sidebar
        current={page}
        onNavigate={setPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            height: 44,
            borderBottom: "1px solid #111820",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 8,
            flexShrink: 0,
            background: "#080B10",
          }}
        >
          {/* Breadcrumb */}
          <span style={{ fontSize: 11, color: "#2D4050", fontFamily: "JetBrains Mono" }}>Sistema de Almacenes INAMBU</span>
          <span style={{ fontSize: 10, color: "#1A2232" }}>›</span>
          <span style={{ fontSize: 11, color: "#64748B", fontFamily: "Outfit", fontWeight: 600 }}>{pageTitles[page]}</span>

          <div style={{ flex: 1 }} />

          {/* Global search */}
          <div style={{ position: "relative" }}>
            <input
              className="wms-input"
              placeholder="Búsqueda global..."
              style={{ width: 220, paddingLeft: 28, fontSize: 12 }}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults[0]) openSearchResult(searchResults[0].page);
                if (e.key === "Escape") setGlobalSearch("");
              }}
            />
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#2D4050", fontSize: 12 }}>
              ⌕
            </span>
            {globalSearch.trim() && (
              <div style={{ position: "absolute", top: 36, right: 0, width: 320, maxHeight: 320, overflowY: "auto", zIndex: 20, background: "#0E1219", border: "1px solid #1A2232", borderRadius: 6, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}>
                {searchResults.length > 0 ? searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.detail}-${index}`}
                    onClick={() => openSearchResult(result.page)}
                    style={{ width: "100%", display: "block", textAlign: "left", padding: "10px 12px", background: "none", border: "none", borderBottom: index < searchResults.length - 1 ? "1px solid #1A2232" : "none", color: "#E2E8F0", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 12, fontFamily: "Outfit", fontWeight: 600 }}>{result.label}</div>
                    <div style={{ marginTop: 3, fontSize: 10, color: "#71808D", fontFamily: "JetBrains Mono" }}>{result.type} · {result.detail}</div>
                  </button>
                )) : (
                  <div style={{ padding: "12px", fontSize: 11, color: "#71808D" }}>No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>

          {/* Alerts bell */}
          <button
            style={{
              background: "none", border: "1px solid #1A2232", borderRadius: 5,
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FBBF24", cursor: "pointer", fontSize: 14, position: "relative",
            }}
          >
            ⚠
            <span style={{
              position: "absolute", top: -4, right: -4, width: 14, height: 14,
              background: "#EF4444", borderRadius: "50%", fontSize: 8, fontWeight: 700,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "JetBrains Mono",
            }}>5</span>
          </button>

          {/* Date/time */}
          <div style={{ fontSize: 10.5, color: "#2D4050", fontFamily: "JetBrains Mono", letterSpacing: "0.04em" }}>
            {new Date().toISOString().slice(0, 10)}
          </div>

          {/* User + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, borderLeft: "1px solid #111820" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #F5B21B, #D99000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#06111C" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: "#64748B", fontFamily: "Outfit", fontWeight: 500 }}>{user.name}</span>
            <button onClick={logout} style={{ background: "none", border: "1px solid #1A2232", borderRadius: 4, padding: "3px 8px", fontSize: 10.5, color: "#4B5A6B", cursor: "pointer", fontFamily: "Outfit" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.borderColor = "#3D1414"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#4B5A6B"; e.currentTarget.style.borderColor = "#1A2232"; }}>
              Salir
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

function AuthGate() {
  const { user, logout } = useAuth();
  if (!user) return <Login />;
  return (
    <AppProvider>
      <AppShell user={user} logout={logout} />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
