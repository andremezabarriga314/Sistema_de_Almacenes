import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../store/AppContext";
import { exportMovementsPDF } from "../lib/exportPDF";
import { exportMovementsExcel } from "../lib/exportExcel";

type AuditEvent = {
  id: string;
  datetime: string;
  timestamp: number;
  user: string;
  action: string;
  badgeClass: string;
  entity: string;
  ref: string;
  change: string;
  movementId: string | null;
};

const AUDIT_CLEARED_AT_KEY = "INAMBU_AUDIT_CLEARED_AT";

const actionLabel: Record<string, string> = {
  Entrada: "ENTRADA",
  Salida: "SALIDA",
  Ajuste: "AJUSTE",
  Devolución: "DEVOLUCIÓN",
};

const actionBadge: Record<string, string> = {
  Entrada: "badge-green",
  Salida: "badge-red",
  Ajuste: "badge-amber",
  Devolución: "badge-blue",
};

const headerStyle: React.CSSProperties = {
  padding: "20px 24px 16px",
  borderBottom: "1px solid #111820",
  flexShrink: 0,
};

const buttonStyle: React.CSSProperties = {
  height: 34,
  padding: "0 13px",
  borderRadius: 7,
  fontFamily: "Outfit, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};

const checkboxStyle: React.CSSProperties = {
  appearance: "auto",
  display: "inline-block",
  visibility: "visible",
  opacity: 1,
  position: "static",
  width: 17,
  height: 17,
  margin: 0,
  accentColor: "#22C55E",
  cursor: "pointer",
  flexShrink: 0,
};

function getStoredClearTimestamp(): number {
  try {
    const saved = localStorage.getItem(AUDIT_CLEARED_AT_KEY);
    const parsed = Number(saved);

    return saved && Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function parseDate(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = new Date(String(value)).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value: unknown, fallback = ""): string {
  const timestamp = parseDate(value);

  if (!timestamp) {
    return fallback || String(value ?? "—");
  }

  return new Date(timestamp).toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function Audit() {
  const { movements, products, suppliers, deleteMovements } = useApp();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clearedAt, setClearedAt] = useState<number>(getStoredClearTimestamp);

  const selectAllRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return movements.filter((movement) => {
      const movementTimestamp = parseDate(movement.date);

      if (clearedAt > 0 && movementTimestamp > 0 && movementTimestamp <= clearedAt) {
        return false;
      }

      const matchesSearch =
        !searchText ||
        movement.productName?.toLowerCase().includes(searchText) ||
        movement.user?.toLowerCase().includes(searchText) ||
        movement.reference?.toLowerCase().includes(searchText) ||
        movement.sku?.toLowerCase().includes(searchText);

      const matchesType =
        filterType === "Todos" || movement.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [movements, search, filterType, clearedAt]);

  const productEvents: AuditEvent[] = useMemo(
    () =>
      products
        .filter((product) => {
          const timestamp = parseDate(product.createdAt);

          return !clearedAt || (timestamp > 0 && timestamp > clearedAt);
        })
        .map((product) => {
          const timestamp = parseDate(product.createdAt);

          return {
            id: `AUD-P-${product.id}`,
            datetime: formatDateTime(product.createdAt),
            timestamp,
            user: "Admin",
            action: "NUEVO PRODUCTO",
            badgeClass: "badge-blue",
            entity: product.name,
            ref: product.sku,
            change: `Producto creado · Stock actual: ${product.stock}`,
            movementId: null,
          };
        }),
    [products, clearedAt],
  );

  const supplierEvents: AuditEvent[] = useMemo(
    () =>
      suppliers
        .filter((supplier) => {
          const timestamp = parseDate(supplier.createdAt);

          return !clearedAt || (timestamp > 0 && timestamp > clearedAt);
        })
        .map((supplier) => {
          const timestamp = parseDate(supplier.createdAt);

          return {
            id: `AUD-S-${supplier.id}`,
            datetime: formatDateTime(supplier.createdAt),
            timestamp,
            user: "Admin",
            action: "NUEVO PROVEEDOR",
            badgeClass: "badge-blue",
            entity: supplier.name,
            ref: supplier.id,
            change: "Proveedor registrado",
            movementId: null,
          };
        }),
    [suppliers, clearedAt],
  );

  const movementEvents: AuditEvent[] = useMemo(
    () =>
      filtered.map((movement) => {
        const timestamp = parseDate(movement.date);

        return {
          id: `AUD-M-${movement.id}`,
          datetime: formatDateTime(movement.date),
          timestamp,
          user: movement.user || "Admin",
          action: actionLabel[movement.type] || movement.type,
          badgeClass: actionBadge[movement.type] || "badge-gray",
          entity: movement.productName || "Producto sin nombre",
          ref: movement.reference || movement.sku || "—",
          change: `${movement.type} · Cantidad: ${movement.qty} · Total: $${Number(
            movement.total || 0,
          ).toFixed(2)} · Saldo: ${movement.balance ?? "—"}`,
          movementId: movement.id,
        };
      }),
    [filtered],
  );

  const allEvents = useMemo(
    () =>
      [...movementEvents, ...productEvents, ...supplierEvents].sort(
        (a, b) => b.timestamp - a.timestamp,
      ),
    [movementEvents, productEvents, supplierEvents],
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const getEventSelectionId = (event: AuditEvent): string =>
    event.movementId ?? event.id;

  const selectedFilteredCount = allEvents.filter((event) =>
    selectedSet.has(getEventSelectionId(event)),
  ).length;

  const allFilteredSelected =
    allEvents.length > 0 && selectedFilteredCount === allEvents.length;

  const someFilteredSelected =
    selectedFilteredCount > 0 &&
    selectedFilteredCount < allEvents.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  useEffect(() => {
    const validIds = new Set<string>(
      allEvents.map((event) => getEventSelectionId(event)),
    );

    setSelectedIds((current) =>
      current.filter((id) => validIds.has(id)),
    );
  }, [allEvents]);

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allEvents.length === 0) return;

    const ids = allEvents.map(getEventSelectionId);

    if (allFilteredSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !ids.includes(id)),
      );
    } else {
      setSelectedIds((current) =>
        Array.from(new Set([...current, ...ids])),
      );
    }
  };

  const handleDeleteSelected = () => {
    const movementIds = movements
      .filter((movement) => selectedSet.has(movement.id))
      .map((movement) => movement.id);

    const informationalCount = allEvents.filter(
      (event) =>
        selectedSet.has(getEventSelectionId(event)) &&
        event.movementId === null,
    ).length;

    if (movementIds.length === 0 && informationalCount === 0) {
      window.alert("Selecciona al menos un registro de Auditoría.");
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar los registros seleccionados de Auditoría?\n\n` +
        `Movimientos seleccionados: ${movementIds.length}\n` +
        `Registros informativos seleccionados: ${informationalCount}\n\n` +
        "Los datos del almacén y el stock no se modificarán.\n\n" +
        "¿Deseas continuar?",
    );

    if (!confirmed) return;

    /*
     * Los movimientos seleccionados se quitan del historial del Kardex
     * mediante la función existente del contexto.
     */
    if (movementIds.length > 0) {
      deleteMovements(movementIds);
    }

    /*
     * Los productos y proveedores no se borran.
     * Para ocultar registros informativos seleccionados sin borrar
     * las entidades reales, se adelanta el marcador de limpieza.
     */
    if (informationalCount > 0) {
      const now = Date.now();

      try {
        localStorage.setItem(AUDIT_CLEARED_AT_KEY, String(now));
        setClearedAt(now);
      } catch {
        window.alert(
          "No se pudo guardar la limpieza de Auditoría. Comprueba el almacenamiento de la aplicación.",
        );
        return;
      }
    }

    setSelectedIds([]);
  };

  const handleDeleteAll = () => {
    if (allEvents.length === 0) {
      window.alert("La Auditoría ya está vacía.");
      return;
    }

    const confirmed = window.confirm(
      `¿ELIMINAR TODOS LOS REGISTROS DE AUDITORÍA?\n\n` +
        `Se limpiarán ${allEvents.length} registros visibles.\n\n` +
        "No se eliminarán productos, proveedores ni lotes.\n" +
        "No se modificará el stock actual.\n\n" +
        "Los movimientos históricos también se quitarán del Kardex.\n\n" +
        "Esta acción no se puede deshacer desde Auditoría.\n\n" +
        "¿Deseas continuar?",
    );

    if (!confirmed) return;

    const now = Date.now();

    try {
      /*
       * Guardamos primero el marcador. Así la vista queda limpia
       * incluso si el contexto actualiza los movimientos después.
       */
      localStorage.setItem(AUDIT_CLEARED_AT_KEY, String(now));
      setClearedAt(now);

      if (movements.length > 0) {
        deleteMovements(movements.map((movement) => movement.id));
      }

      setSelectedIds([]);
      setSearch("");
      setFilterType("Todos");
    } catch {
      window.alert(
        "No se pudo completar la limpieza de Auditoría. Comprueba el almacenamiento de la aplicación.",
      );
    }
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      window.alert("No hay movimientos para exportar.");
      return;
    }

    exportMovementsExcel(filtered, "Auditoria");
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      window.alert("No hay movimientos para exportar.");
      return;
    }

    exportMovementsPDF(filtered, suppliers, "Auditoria");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#080B10",
        color: "#E2E8F0",
      }}
    >
      <div style={headerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#E2E8F0",
                margin: 0,
              }}
            >
              Log de Auditoría
            </h1>

            <div
              style={{
                fontSize: 11,
                color: "#64748B",
                fontFamily: "JetBrains Mono, monospace",
                marginTop: 5,
              }}
            >
              {allEvents.length} registros ·{" "}
              {selectedIds.length > 0
                ? `${selectedIds.length} seleccionado(s)`
                : "Control de movimientos"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              style={{
                ...buttonStyle,
                border:
                  selectedIds.length > 0
                    ? "1px solid #7F1D1D"
                    : "1px solid #1E293B",
                background:
                  selectedIds.length > 0 ? "#2A1013" : "#0D131B",
                color:
                  selectedIds.length > 0 ? "#FCA5A5" : "#475569",
                cursor:
                  selectedIds.length > 0 ? "pointer" : "not-allowed",
                opacity: selectedIds.length > 0 ? 1 : 0.65,
              }}
            >
              🗑 Eliminar seleccionados
              {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
            </button>

            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={allEvents.length === 0}
              style={{
                ...buttonStyle,
                border:
                  allEvents.length > 0
                    ? "1px solid #991B1B"
                    : "1px solid #1E293B",
                background:
                  allEvents.length > 0 ? "#351115" : "#0D131B",
                color:
                  allEvents.length > 0 ? "#F87171" : "#475569",
                cursor:
                  allEvents.length > 0 ? "pointer" : "not-allowed",
                opacity: allEvents.length > 0 ? 1 : 0.65,
              }}
            >
              🗑 Eliminar todo
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 11 }}
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
            >
              Excel
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 11 }}
              onClick={handleExportPDF}
              disabled={filtered.length === 0}
            >
              PDF
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            className="wms-input"
            placeholder="Buscar por producto, usuario, referencia..."
            style={{ width: 300, maxWidth: "100%" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="wms-select"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
          >
            <option value="Todos">Todos los tipos</option>
            <option value="Entrada">Entrada</option>
            <option value="Salida">Salida</option>
            <option value="Ajuste">Ajuste</option>
            <option value="Devolución">Devolución</option>
          </select>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              minHeight: 34,
              padding: "0 11px",
              border: "1px solid #1E293B",
              borderRadius: 7,
              background: "#0D131B",
              color: "#CBD5E1",
              fontFamily: "Outfit, sans-serif",
              fontSize: 11,
              cursor: allEvents.length > 0 ? "pointer" : "not-allowed",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAllFiltered}
              disabled={allEvents.length === 0}
              style={checkboxStyle}
              aria-label="Seleccionar todos los registros"
            />
            Seleccionar todos los registros
          </label>

          {selectedIds.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                minHeight: 34,
                padding: "0 11px",
                border: "1px solid #334155",
                borderRadius: 7,
                background: "#111827",
                color: "#CBD5E1",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
              }}
            >
              {selectedIds.length} seleccionado(s)
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {allEvents.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 260,
              gap: 12,
            }}
          >
            <div style={{ fontSize: 40, color: "#334155" }}>☰</div>

            <div
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 14,
                color: "#94A3B8",
              }}
            >
              Sin actividad registrada
            </div>

            <div style={{ fontSize: 11, color: "#64748B" }}>
              Los nuevos registros aparecerán aquí después de la limpieza.
            </div>
          </div>
        ) : (
          <table className="wms-table">
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#080B10",
                zIndex: 1,
              }}
            >
              <tr>
                <th style={{ width: 42, textAlign: "center" }}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    disabled={allEvents.length === 0}
                    aria-label="Seleccionar todos los registros de auditoría"
                    style={checkboxStyle}
                  />
                </th>
                <th>ID</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Referencia</th>
                <th>Detalle</th>
              </tr>
            </thead>

            <tbody>
              {allEvents.map((log) => {
                const selectionId = getEventSelectionId(log);
                const isSelected = selectedSet.has(selectionId);

                return (
                  <tr
                    key={log.id}
                    style={{
                      background: isSelected
                        ? "rgba(34, 197, 94, 0.07)"
                        : undefined,
                    }}
                  >
                    <td style={{ width: 42, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(selectionId)}
                        aria-label={`Seleccionar registro ${log.id}`}
                        style={checkboxStyle}
                      />
                    </td>

                    <td
                      className="num"
                      onClick={() => toggleSelect(selectionId)}
                      title={
                        isSelected
                          ? "Clic para desmarcar"
                          : "Clic para marcar"
                      }
                      style={{
                        color: isSelected ? "#22C55E" : "#64748B",
                        fontSize: 10,
                        cursor: "pointer",
                        userSelect: "none",
                        fontWeight: isSelected ? 700 : 400,
                      }}
                    >
                      {log.id}
                      {isSelected ? " ✓" : ""}
                    </td>

                    <td className="num" style={{ fontSize: 10.5 }}>
                      {log.datetime}
                    </td>

                    <td style={{ fontWeight: 500, color: "#94A3B8" }}>
                      {log.user}
                    </td>

                    <td>
                      <span
                        className={`badge ${log.badgeClass}`}
                        style={{ fontSize: 9.5 }}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td
                      style={{
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#D1D9E2",
                      }}
                    >
                      {log.entity}
                    </td>

                    <td className="num" style={{ color: "#64748B" }}>
                      {log.ref}
                    </td>

                    <td
                      style={{
                        fontSize: 11,
                        color: "#64748B",
                        maxWidth: 260,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {log.change}
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
