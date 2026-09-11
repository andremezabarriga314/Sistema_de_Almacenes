import { useState } from "react";
import { useAuth } from "../store/AuthContext";
import portada from "../imports/portada.png.png";

const BG = portada;

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const err = mode === "login" ? login(username, password) : register(name, username, password);
    if (err) setError(err);
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div style={{ height: "100dvh", display: "flex", fontFamily: "Outfit, sans-serif", overflow: "hidden" }}>

      {/* Left — photo panel */}
      <div style={{ flex: 1, position: "relative", display: "none-on-small" }}>
        <img
          src={BG}
          alt="Almacén de alimentos"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      {/* Right — form panel */}
      <div style={{ width: 420, background: "#06111C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 44px", flexShrink: 0, position: "relative" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40, width: "100%" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #F5B21B, #C98200)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "#06111C", boxShadow: "0 0 18px rgba(245,178,27,0.3)" }}>
              ⊞
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.02em" }}>
              <span style={{ color: "#F5B21B" }}>INAMBU</span>
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#6D7884", fontFamily: "JetBrains Mono", letterSpacing: "0.1em" }}>
            SISTEMA DE ALMACENES · v1.0
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", width: "100%", borderBottom: "1px solid #111820", marginBottom: 28 }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "11px 0", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "Outfit, sans-serif", fontWeight: 600, color: mode === m ? "#F5B21B" : "#71808D", borderBottom: mode === m ? "2px solid #F5B21B" : "2px solid transparent", marginBottom: -1, transition: "color 0.15s" }}>
              {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          {mode === "register" && (
            <div>
              <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Tu nombre</label>
              <input className="wms-input" style={{ width: "100%", boxSizing: "border-box", fontSize: 14 }} placeholder="Ej: Luis Mendoza" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} onKeyDown={handleKey} autoFocus />
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Usuario</label>
            <input className="wms-input" style={{ width: "100%", boxSizing: "border-box", fontSize: 14 }} placeholder="nombre de usuario" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} onKeyDown={handleKey} autoFocus={mode === "login"} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10.5, color: "#4B5A6B", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Contraseña</label>
            <input className="wms-input" type="password" style={{ width: "100%", boxSizing: "border-box", fontSize: 14 }} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} onKeyDown={handleKey} />
          </div>

          {error && (
            <div style={{ padding: "9px 12px", borderRadius: 6, background: "#1A0808", border: "1px solid #3D1010", borderLeft: "3px solid #EF4444" }}>
              <span style={{ fontSize: 12, color: "#FCA5A5" }}>⚠ {error}</span>
            </div>
          )}

          <button onClick={submit} disabled={loading}
            style={{ marginTop: 6, padding: "13px 0", borderRadius: 8, border: "none", cursor: loading ? "default" : "pointer", background: loading ? "#5B430D" : "linear-gradient(135deg, #F5B21B, #D99000)", color: "#06111C", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.02em", boxShadow: loading ? "none" : "0 4px 20px rgba(245,178,27,0.2)", transition: "all 0.2s" }}>
            {loading ? "Verificando..." : mode === "login" ? "Entrar al sistema" : "Crear cuenta e ingresar"}
          </button>
        </div>

        <div style={{ position: "absolute", bottom: 24, fontSize: 10, color: "#111820", fontFamily: "JetBrains Mono" }}>
          CALLERÍA 5 · 2026
        </div>
      </div>
    </div>
  );
}
