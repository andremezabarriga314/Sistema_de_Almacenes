import { useState } from "react";

type DeleteItem = {
  id: string;
  label: string;
  detail?: string;
};

type DeleteDataButtonProps = {
  title: string;
  items: DeleteItem[];
  onDelete: (ids: string[]) => void;
  onDeleteAll: () => void;
  disabled?: boolean;
};

export default function DeleteDataButton({ title, items, onDelete, onDeleteAll, disabled = false }: DeleteDataButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const close = () => {
    setOpen(false);
    setSelected([]);
  };

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  };

  const selectAll = () => {
    setSelected((current) => current.length === items.length ? [] : items.map((item) => item.id));
  };

  const deleteSelected = () => {
    if (selected.length === 0) return;
    if (!confirm(`¿Confirmas eliminar ${selected.length} registro${selected.length === 1 ? "" : "s"} de ${title}?`)) return;
    onDelete(selected);
    close();
  };

  const deleteAll = () => {
    if (items.length === 0) return;
    if (!confirm(`¿Confirmas eliminar TODOS los registros de ${title}? Esta acción no se puede deshacer.`)) return;
    onDeleteAll();
    close();
  };

  return (
    <>
      <button
        className="btn-danger"
        style={{ fontSize: 11, padding: "6px 10px" }}
        onClick={() => setOpen(true)}
        disabled={disabled || items.length === 0}
        title={`Eliminar datos de ${title}`}
      >
        Eliminar datos
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="wms-card" style={{ width: 500, maxWidth: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #1A2232", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: "Outfit", fontSize: 16, fontWeight: 700, color: "#E2E8F0", margin: 0 }}>Eliminar datos: {title}</h2>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{items.length} registro{items.length === 1 ? "" : "s"} disponible{items.length === 1 ? "" : "s"}</div>
              </div>
              <button onClick={close} style={{ background: "none", border: "none", color: "#4B5A6B", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>

            <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #111820" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94A3B8", cursor: "pointer" }}>
                <input type="checkbox" checked={items.length > 0 && selected.length === items.length} onChange={selectAll} />
                Seleccionar todos
              </label>
              <span style={{ fontSize: 11, color: "#F5B21B", fontFamily: "JetBrains Mono" }}>{selected.length} seleccionados</span>
            </div>

            <div style={{ overflowY: "auto", padding: "8px 20px", minHeight: 100 }}>
              {items.map((item) => (
                <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #111820", cursor: "pointer" }}>
                  <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#D1D9E2", fontSize: 12 }}>{item.label}</span>
                    {item.detail && <span style={{ display: "block", color: "#4B5A6B", fontSize: 10, marginTop: 2 }}>{item.detail}</span>}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #1A2232", display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-secondary" onClick={close}>Cancelar</button>
              <button className="btn-danger" onClick={deleteSelected} disabled={selected.length === 0}>Eliminar seleccionados</button>
              <button className="btn-danger" style={{ background: "#7F1D1D", color: "#FEE2E2" }} onClick={deleteAll}>Eliminar todo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
