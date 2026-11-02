
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

type AppUser = {
  name: string;
  username: string;
};

function AppShell({
  user,
  logout,
}: {
  user: AppUser;
  logout: () => void;
}) {
  const [page, setPage] = useState<Page>("products");
  const [welcome, setWelcome] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!welcome) return;

    const timeout = window.setTimeout(() => {
      setWelcome(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [welcome]);

  if (welcome) {
    return (
      <div
        style={{
          width: "100%",
          height: "100dvh",
          minWidth: 0,
          minHeight: 0,
          background: "#060810",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Outfit, sans-serif",
          gap: 16,
          position: "relative",
          overflow: "hidden",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(600px, 90vw)",
            height: 300,
            background:
              "radial-gradient(ellipse, rgba(0,200,150,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: 56,
            height: 56,
            flexShrink: 0,
            background: "linear-gradient(135deg, #00C896, #00A070)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            boxShadow: "0 0 40px rgba(0,200,150,0.4)",
            marginBottom: 8,
          }}
        >
          ⊞
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#2D4050",
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          Bienvenido a FoodStock Pro
        </div>

        <div
          style={{
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 700,
            color: "#E2E8F0",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          Hola, <span style={{ color: "#00C896" }}>{user.name}</span> 👋
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#4B5A6B",
            textAlign: "center",
          }}
        >
          Cargando tu espacio de trabajo...
        </div>

        <div
          style={{
            marginTop: 20,
            width: "min(200px, 70vw)",
            height: 3,
            background: "#0D1520",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #00C896, #00A870)",
              borderRadius: 99,
              animation: "progress 2.8s ease-out forwards",
            }}
          />
        </div>

        <style>
          {`
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}
        </style>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "products":
        return <Products />;
      case "lots":
        return <Lots />;
      case "kardex":
        return <Kardex />;
      case "suppliers":
        return <Suppliers />;
      case "import":
        return <ImportExport />;
      case "audit":
        return <Audit />;
      case "trash":
        return <Trash />;
      default:
        return <Products />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100dvh",
        minWidth: 0,
        minHeight: 0,
        background: "#080B10",
        color: "#E2E8F0",
        overflow: "hidden",
      }}
    >
      <Sidebar
        current={page}
        onNavigate={setPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />

      <main
        style={{
          flex: "1 1 0",
          width: 0,
          minWidth: 0,
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Barra superior */}
        <header
          style={{
            minHeight: 44,
            height: 44,
            flex: "0 0 44px",
            borderBottom: "1px solid #111820",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
            background: "#080B10",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              color: "#2D4050",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            WMS Pro
          </span>

          <span style={{ flexShrink: 0, fontSize: 10, color: "#1A2232" }}>
            ›
          </span>

          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              color: "#64748B",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
            }}
          >
            {pageTitles[page]}
          </span>

          <div style={{ flex: "1 1 auto", minWidth: 8 }} />

          {/* Búsqueda global */}
          <div
            style={{
              position: "relative",
              flex: "0 1 220px",
              minWidth: 90,
              maxWidth: 220,
            }}
          >
            <input
              className="wms-input"
              placeholder="Búsqueda global..."
              aria-label="Búsqueda global"
              style={{
                width: "100%",
                minWidth: 0,
                paddingLeft: 28,
                fontSize: 12,
              }}
            />

            <span
              style={{
                position: "absolute",
                left: 9,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#2D4050",
                fontSize: 12,
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
          </div>

          {/* Alertas */}
          <button
            type="button"
            aria-label="Alertas"
            style={{
              flex: "0 0 30px",
              background: "none",
              border: "1px solid #1A2232",
              borderRadius: 5,
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FBBF24",
              cursor: "pointer",
              fontSize: 14,
              position: "relative",
            }}
          >
            ⚠
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 14,
                height: 14,
                background: "#EF4444",
                borderRadius: "50%",
                fontSize: 8,
                fontWeight: 700,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              5
            </span>
          </button>

          {/* Fecha */}
          <div
            style={{
              flexShrink: 0,
              fontSize: 10.5,
              color: "#2D4050",
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            {new Date().toLocaleDateString("en-CA", {
              timeZone: "America/Lima",
            })}
          </div>

          {/* Usuario y cierre de sesión */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: 8,
              borderLeft: "1px solid #111820",
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                flex: "0 0 26px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#00C896, #00A870)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            <span
              style={{
                fontSize: 12,
                color: "#64748B",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 500,
                whiteSpace: "nowrap",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </span>

            <button
              type="button"
              onClick={logout}
              style={{
                flexShrink: 0,
                background: "none",
                border: "1px solid #1A2232",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 10.5,
                color: "#4B5A6B",
                cursor: "pointer",
                fontFamily: "Outfit, sans-serif",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color = "#F87171";
                event.currentTarget.style.borderColor = "#3D1414";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color = "#4B5A6B";
                event.currentTarget.style.borderColor = "#1A2232";
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* Contenedor adaptable de las páginas */}
        <section
          key={page}
          style={{
            flex: "1 1 0",
            width: "100%",
            minWidth: 0,
            minHeight: 0,
            overflow: "auto",
            position: "relative",
            isolation: "isolate",
            overscrollBehavior: "contain",
          }}
        >
          {renderPage()}
        </section>
      </main>
    </div>
  );
}

function AuthGate() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Login />;
  }

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
