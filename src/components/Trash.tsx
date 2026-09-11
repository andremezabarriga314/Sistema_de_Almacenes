import { useState } from "react";
import { useApp } from "../store/AppContext";

export default function Trash() {
  const { trash, restoreProduct, restoreSupplier, restoreMovement, restoreLot, purgeTrash } = useApp();
  const [selected, setSelected] = useState<string[]>([]);

  const daysSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const handleRestore = (id: string, type: "Alimento" | "Proveedor" | "Movimiento" | "Lote") => {
    if (type === "Alimento") restoreProduct(id);
    else if (type === "Proveedor") restoreSupplier(id);
    else if (type === "Movimiento") restoreMovement(id);
    else restoreLot(id);
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  };

  const toggleAll = () => {
    setSelected((current) => current.length === trash.length ? [] : trash.map((item) => item.id));
  };

  const deleteSelected = () => {
    if (selected.length === 0) return;
    if (!confirm(`¿Eliminar definitivamente ${selected.length} elemento${selected.length === 1 ? "" : "s"} seleccionado${selected.length === 1 ? "" : "s"}? Esta acción no se puede deshacer.`)) return;
    selected.forEach((id) => purgeTrash(id));
    setSelected([]);
  };

  const deleteAll = () => {
    if (trash.length === 0) return;
    if (!confirm("¿Eliminar definitivamente todo el contenido de la papelera? Esta acción no se puede deshacer.")) return;
    trash.forEach((item) => purgeTrash(item.id));
    setSelected([]);
  };

  const restoreAll = () => {
    if (trash.length === 0) return;
    if (!confirm(`¿Recuperar todos los ${trash.length} elementos de la papelera?`)) return;
    trash.forEach((item) => handleRestore(item.id, item.type));
    setSelected([]);
  };

  const typeClass: Record<string, string> = {
    Alimento: "badge-blue",
    Proveedor: "badge-amber",
    Movimiento: "badge-green",
    Lote: "badge-gray",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #111820", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 700, color: "#E2E8F0" }}>Papelera de Reciclaje</h1>
            <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono" }}>
              {trash.length} elementos eliminados · Recuperables en cualquier momento
            </div>
          </div>
          {trash.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button className="btn-secondary" style={{ fontSize: 11 }} onClick={toggleAll}>
                {selected.length === trash.length ? "Deseleccionar todos" : "Seleccionar todos"}
              </button>
              <button className="btn-danger" style={{ fontSize: 11 }} onClick={deleteSelected} disabled={selected.length === 0}>
                Eliminar seleccionados ({selected.length})
              </button>
              <button className="btn-primary" style={{ fontSize: 11 }} onClick={restoreAll}>
                Recuperar todo
              </button>
              <button className="btn-danger" style={{ fontSize: 11, background: "#7F1D1D", color: "#FEE2E2" }} onClick={deleteAll}>
                Eliminar todo
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {trash.length > 0 && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#1A1008", border: "1px solid #3D2808", borderLeft: "3px solid #F59E0B", borderRadius: 5 }}>
            <span style={{ fontSize: 12, color: "#FDE68A" }}>
              ⚠ Los registros eliminados pueden recuperarse en cualquier momento o eliminarse permanentemente.
            </span>
          </div>
        )}

        {trash.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100% - 60px)", gap: 12 }}>
            <div style={{ fontSize: 40, color: "#1A2232" }}>🗑</div>
            <div style={{ fontFamily: "Outfit", fontSize: 14, color: "#4B5A6B" }}>La papelera está vacía</div>
            <div style={{ fontSize: 11, color: "#2D4050" }}>Todo lo eliminado aparecerá aquí</div>
          </div>
        ) : (
          <table className="wms-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={trash.length > 0 && selected.length === trash.length} onChange={toggleAll} aria-label="Seleccionar todos" />
                </th>
                <th>ID</th>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Eliminado</th>
                <th style={{ textAlign: "right" }}>Días en papelera</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trash.map((t) => {
                const days = daysSince(t.deletedAt);
                return (
                  <tr key={t.id}>
                    <td>
                      <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleSelected(t.id)} aria-label={`Seleccionar ${t.name}`} />
                    </td>
                    <td className="num" style={{ color: "#64748B" }}>{t.id}</td>
                    <td><span className={`badge ${typeClass[t.type] || "badge-gray"}`}>{t.type}</span></td>
                    <td style={{ color: "#D1D9E2", fontWeight: 500 }}>{t.name}</td>
                    <td className="num">{t.deletedAt}</td>
                    <td className="num" style={{ textAlign: "right", color: days > 60 ? "#F87171" : days > 30 ? "#FBBF24" : "#94A3B8", fontWeight: 700 }}>
                      {days}d
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="btn-primary" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => {
                          if (confirm(`¿Recuperar "${t.name}"?`)) handleRestore(t.id, t.type);
                        }}>
                          Recuperar
                        </button>
                        <button className="btn-danger" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => {
                          if (confirm(`¿Eliminar definitivamente "${t.name}"? Esta acción no se puede deshacer.`)) purgeTrash(t.id);
                        }}>
                          Eliminar
                        </button>
                      </div>
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
