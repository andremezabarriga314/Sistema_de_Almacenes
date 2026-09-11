import { useState } from "react";
import { useApp } from "../store/AppContext";
import { exportMovementsPDF } from "../lib/exportPDF";
import { exportMovementsExcel } from "../lib/exportExcel";

const actionLabel: Record<string, string> = {
  Entrada: "ENTRADA",
  Salida: "SALIDA",
  Ajuste: "AJUSTE",
  "Devolución": "DEVOLUCIÓN",
};

const actionBadge: Record<string, string> = {
  Entrada: "badge-green",
  Salida: "badge-red",
  Ajuste: "badge-amber",
  "Devolución": "badge-blue",
};

export default function Audit() {
  const {
    movements,
    products,
    suppliers,
  } = useApp();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] =
    useState("Todos");

  const filtered = movements.filter((m) => {
    const searchText = search
      .toLowerCase()
      .trim();

    const matchSearch =
      !searchText ||
      m.productName
        ?.toLowerCase()
        .includes(searchText) ||
      m.user
        ?.toLowerCase()
        .includes(searchText) ||
      m.reference
        ?.toLowerCase()
        .includes(searchText) ||
      m.sku
        ?.toLowerCase()
        .includes(searchText);

    const matchType =
      filterType === "Todos" ||
      m.type === filterType;

    return matchSearch && matchType;
  });

  const productEvents = products.map((p) => ({
    id: `AUD-P-${p.id}`,
    datetime: `${p.createdAt} 00:00:00`,
    user: "Admin",
    action: "NUEVO PRODUCTO",
    badgeClass: "badge-blue",
    entity: p.name,
    ref: p.sku,
    change: `Producto creado · Stock inicial: ${p.stock}`,
  }));

  const supplierEvents = suppliers.map((s) => ({
    id: `AUD-S-${s.id}`,
    datetime: `${s.createdAt} 00:00:00`,
    user: "Admin",
    action: "NUEVO PROVEEDOR",
    badgeClass: "badge-blue",
    entity: s.name,
    ref: s.id,
    change: "Proveedor registrado",
  }));

  const movementEvents = filtered.map((m) => ({
    id: `AUD-M-${m.id}`,
    datetime: `${m.date} --:--:--`,
    user: m.user,
    action:
      actionLabel[m.type] || m.type,
    badgeClass:
      actionBadge[m.type] ||
      "badge-gray",
    entity: m.productName,
    ref: m.reference,
    change: `${m.type} · Qty: ${m.qty} · Total: $${Number(
      m.total || 0,
    ).toFixed(2)} · Saldo: ${m.balance}`,
  }));

  const allEvents = [
    ...movementEvents,
    ...productEvents,
    ...supplierEvents,
  ].sort((a, b) =>
    b.datetime.localeCompare(
      a.datetime,
    ),
  );

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      return;
    }

    exportMovementsExcel(
      filtered,
      suppliers,
      "Auditoria",
    );
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      return;
    }

    exportMovementsPDF(
      filtered,
      suppliers,
      "Auditoria",
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom:
            "1px solid #111820",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily:
                  "Outfit, sans-serif",
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
                color: "#4B5A6B",
                fontFamily:
                  "JetBrains Mono",
                marginTop: 4,
              }}
            >
              {allEvents.length} registros
              · Solo lectura
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              style={{
                fontSize: 11,
              }}
              onClick={
                handleExportExcel
              }
              disabled={
                filtered.length === 0
              }
            >
              Excel
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{
                fontSize: 11,
              }}
              onClick={
                handleExportPDF
              }
              disabled={
                filtered.length === 0
              }
            >
              PDF
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <input
            className="wms-input"
            placeholder="Buscar por producto, usuario, referencia..."
            style={{
              width: 300,
            }}
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
          />

          <select
            className="wms-select"
            value={filterType}
            onChange={(e) =>
              setFilterType(
                e.target.value,
              )
            }
          >
            <option value="Todos">
              Todos los tipos
            </option>

            <option value="Entrada">
              Entrada
            </option>

            <option value="Salida">
              Salida
            </option>

            <option value="Ajuste">
              Ajuste
            </option>

            <option value="Devolución">
              Devolución
            </option>
          </select>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {allEvents.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              alignItems: "center",
              justifyContent:
                "center",
              height: "100%",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 40,
                color: "#1A2232",
              }}
            >
              ☰
            </div>

            <div
              style={{
                fontFamily: "Outfit",
                fontSize: 14,
                color: "#4B5A6B",
              }}
            >
              Sin actividad
              registrada
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#2D4050",
              }}
            >
              El log se genera
              automáticamente con
              cada operación
            </div>
          </div>
        ) : (
          <table className="wms-table">
            <thead
              style={{
                position: "sticky",
                top: 0,
                background:
                  "#080B10",
                zIndex: 1,
              }}
            >
              <tr>
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
              {allEvents.map(
                (log) => (
                  <tr key={log.id}>
                    <td
                      className="num"
                      style={{
                        color:
                          "#4B5A6B",
                        fontSize: 10,
                      }}
                    >
                      {log.id}
                    </td>

                    <td
                      className="num"
                      style={{
                        fontSize: 10.5,
                      }}
                    >
                      {log.datetime}
                    </td>

                    <td
                      style={{
                        fontWeight: 500,
                        color:
                          "#94A3B8",
                      }}
                    >
                      {log.user}
                    </td>

                    <td>
                      <span
                        className={`badge ${log.badgeClass}`}
                        style={{
                          fontSize: 9.5,
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td
                      style={{
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow:
                          "ellipsis",
                        color:
                          "#D1D9E2",
                      }}
                    >
                      {log.entity}
                    </td>

                    <td
                      className="num"
                      style={{
                        color:
                          "#64748B",
                      }}
                    >
                      {log.ref}
                    </td>

                    <td
                      style={{
                        fontSize: 11,
                        color:
                          "#64748B",
                        maxWidth: 260,
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {log.change}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}