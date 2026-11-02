import { useState, useEffect } from "react";
import { AppProvider } from "./store/AppContext";
import { AuthProvider, useAuth } from "./store/AuthContext";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Products from "./components/Products";
import Kardex from "./components/Kardex";
import Suppliers from "./components/Suppliers";
import ImportExport from "./components/ImportExport";
import Lots from "./components/Lots";
import Audit from "./components/Audit";
import Trash from "./components/Trash";

type Page =
  | "products"
  | "lots"
  | "kardex"
  | "suppliers"
  | "import"
  | "audit"
  | "trash";

const pageTitles: Record<Page, string> = {
  products: "Productos",
  lots: "Lotes",
  kardex: "Kárdex",
  suppliers: "Proveedores",
  import: "Importar / Exportar",
  audit: "Auditoría",
  trash: "Papelera",
};

function AppShell({ user, logout }: { user: { name: string; username: string }; logout: () => void }) {
  const [page, setPage] = useState<Page>("products");
  const [welcome, setWelcome] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (welcome) {
      const t = setTimeout(() => setWelcome(false), 3000);
      return () => clearTimeout(t);
    }
  }, [welcome]);

  if (welcome) {
    return (
      <div style={{ height: "100dvh", background: "#060810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", gap: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(0,200,150,0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #00C896, #00A070)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "0 0 40px rgba(0,200,150,0.4)", marginBottom: 8 }}>⊞</div>
        <div style={{ fontSize: 13, color: "#2D4050", fontFamily: "JetBrains Mono", letterSpacing: "0.12em", textTransform: "uppercase" }}>Bienvenido a FoodStock Pro</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.02em" }}>
          Hola, <span style={{ color: "#00C896" }}>{user.name}</span> 👋
        </div>
        <div style={{ fontSize: 13, color: "#4B5A6B" }}>Cargando tu espacio de trabajo...</div>
        <div style={{ marginTop: 20, width: 200, height: 3, background: "#0D1520", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #00C896, #00A870)", borderRadius: 99, animation: "progress 2.8s ease-out forwards" }} />
        </div>
        <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "products": return <Products />;
      case "lots": return <Lots />;
      case "kardex": return <Kardex />;
      case "suppliers": return <Suppliers />;
      case "import": return <ImportExport />;
      case "audit": return <Audit />;
      case "trash": return <Trash />;
      default: return <Products />;
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
          <span style={{ fontSize: 11, color: "#2D4050", fontFamily: "JetBrains Mono" }}>WMS Pro</span>
          <span style={{ fontSize: 10, color: "#1A2232" }}>›</span>
          <span style={{ fontSize: 11, color: "#64748B", fontFamily: "Outfit", fontWeight: 600 }}>{pageTitles[page]}</span>

          <div style={{ flex: 1 }} />

          {/* Global search */}
          <div style={{ position: "relative" }}>
            <input
              className="wms-input"
              placeholder="Búsqueda global..."
              style={{ width: 220, paddingLeft: 28, fontSize: 12 }}
            />
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#2D4050", fontSize: 12 }}>
              ⌕
            </span>
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
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #00C896, #00A870)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
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
  return <AppShell user={user} logout={logout} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AuthGate />
      </AppProvider>
    </AuthProvider>
  );
}
