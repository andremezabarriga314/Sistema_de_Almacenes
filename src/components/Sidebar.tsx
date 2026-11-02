import { useState } from "react";

type Page =
  | "products"
  | "lots"
  | "kardex"
  | "suppliers"
  | "import"
  | "audit"
  | "trash";

type Props = {
  current: Page;
  onNavigate: (p: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
};

const nav = [
  {
    group: "Inventario",
    items: [
      { id: "products", label: "Alimentos", icon: "⊞" },
      { id: "lots", label: "Lotes", icon: "◫" },
      { id: "kardex", label: "Kárdex", icon: "≡" },
    ],
  },
  {
    group: "Gestión",
    items: [
      { id: "suppliers", label: "Proveedores", icon: "◈" },
    ],
  },
  {
    group: "Herramientas",
    items: [
      { id: "import", label: "Importar / Exportar", icon: "⇅" },
      { id: "audit", label: "Auditoría", icon: "◉" },
      { id: "trash", label: "Papelera", icon: "⌫" },
    ],
  },
];

export default function Sidebar({ current, onNavigate, collapsed, onToggle }: Props) {
  return (
    <aside
      style={{
        width: collapsed ? 52 : 212,
        minWidth: collapsed ? 52 : 212,
        background: "#080B10",
        borderRight: "1px solid #111820",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "16px 10px" : "16px 14px",
          borderBottom: "1px solid #111820",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 56,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: "linear-gradient(135deg, #00C896 0%, #007C5E 100%)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 13,
            fontWeight: 700,
            color: "#050A07",
          }}
        >
          W
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 13, fontWeight: 700, color: "#E2E8F0", lineHeight: 1.2 }}>
              FoodStock Pro
            </div>
            <div style={{ fontSize: 9.5, color: "#2D4050", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em" }}>
              v1.0 · ALIMENTOS
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            color: "#2D4050",
            cursor: "pointer",
            fontSize: 14,
            padding: "2px 4px",
            flexShrink: 0,
          }}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto", overflowX: "hidden" }}>
        {nav.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <div className="nav-group-label">{group.group}</div>
            )}
            {collapsed && <div style={{ height: 10 }} />}
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                className={`nav-item${current === item.id ? " active" : ""}`}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  justifyContent: collapsed ? "center" : "flex-start",
                  paddingLeft: collapsed ? 0 : undefined,
                  marginLeft: current === item.id && !collapsed ? undefined : 0,
                }}
                title={collapsed ? item.label : undefined}
              >
                <span style={{ fontSize: 15, flexShrink: 0, fontStyle: "normal" }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          padding: collapsed ? "12px 8px" : "12px 14px",
          borderTop: "1px solid #111820",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#1A2A38",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#00C896",
            flexShrink: 0,
            fontFamily: "Outfit, sans-serif",
          }}
        >
          LM
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", whiteSpace: "nowrap", fontFamily: "Outfit, sans-serif" }}>
              Luis Mendoza
            </div>
            <div style={{ fontSize: 10, color: "#2D4050", fontFamily: "JetBrains Mono, monospace" }}>Admin</div>
          </div>
        )}
      </div>
    </aside>
  );
}
