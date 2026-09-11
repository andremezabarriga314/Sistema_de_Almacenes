import { useState } from "react";
import { useApp } from "../store/AppContext";
import { exportMovementsPDF } from "../lib/exportPDF";
import { exportMovementsExcel } from "../lib/exportExcel";

const fmtUSD = (n: number) =>
  "$" + Math.abs(Number(n) || 0).toFixed(2);

export default function Kardex() {
  const {
    products,
    movements,
    suppliers,
    deleteMovement,
  } = useApp();

  const [selectedProduct, setSelectedProduct] = useState("all");
  const [filterType, setFilterType] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = movements.filter((m) => {
    const productId = String(m.productId ?? "");
    const productName = String(m.productName ?? "");
    const reference = String(m.reference ?? "");
    const sku = String(m.sku ?? "");
    const type = String(m.type ?? "");

    const searchText = search.trim().toLowerCase();

    const matchProduct =
      selectedProduct === "all" ||
      productId === selectedProduct;

    const matchType =
      filterType === "Todos" ||
      type === filterType;

    const matchSearch =
      searchText === "" ||
      productName.toLowerCase().includes(searchText) ||
      reference.toLowerCase().includes(searchText) ||
      sku.toLowerCase().includes(searchText);

    return (
      matchProduct &&
      matchType &&
      matchSearch
    );
  });

  const typeBadge: Record<string, string> = {
    Entrada: "badge-green",
    Salida: "badge-red",
    Ajuste: "badge-amber",
    Devolución: "badge-blue",
  };

  const typeColor: Record<string, string> = {
    Entrada: "#00C896",
    Salida: "#F87171",
    Ajuste: "#FBBF24",
    Devolución: "#60A5FA",
  };

  const totalEntradas = filtered
    .filter((m) => m.type === "Entrada")
    .reduce(
      (total, m) =>
        total + (Number(m.total) || 0),
      0
    );

  const totalSalidas = filtered
    .filter((m) => m.type === "Salida")
    .reduce(
      (total, m) =>
        total + (Number(m.total) || 0),
      0
    );

  const totalAjustes = filtered.filter(
    (m) => m.type === "Ajuste"
  ).length;

  const getSupplierName = (
    supplierId: unknown
  ) => {
    if (!supplierId) {
      return undefined;
    }

    const supplier = suppliers.find(
      (s) =>
        String(s.id) === String(supplierId)
    );

    return supplier?.name;
  };

  const getCounterpart = (
    m: (typeof movements)[number]
  ) => {
    return (
      getSupplierName(m.supplierId) ||
      m.client ||
      m.reason ||
      "—"
    );
  };

  const handleDelete = (
    id: (typeof movements)[number]["id"]
  ) => {
    if (
      window.confirm(
        "¿Eliminar este movimiento?"
      )
    ) {
      deleteMovement(id);
    }
  };

  const handleDeleteAll = () => {
    if (movements.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar todos los movimientos del Kárdex?\n\nSe eliminarán ${movements.length} movimientos.\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    movements.forEach((movement) => {
      deleteMovement(movement.id);
    });

    setSelectedProduct("all");
    setFilterType("Todos");
    setSearch("");
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      return;
    }

    exportMovementsExcel(
      filtered,
      suppliers,
      "Kardex"
    );
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      return;
    }

    exportMovementsPDF(
      filtered,
      "Kardex"
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
          borderBottom: "1px solid #111820",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "Outfit, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#E2E8F0",
              }}
            >
              Kárdex de Inventario
            </h1>

            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#4B5A6B",
                fontFamily:
                  "JetBrains Mono, monospace",
              }}
            >
              {filtered.length} movimientos
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
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
            >
              Excel
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{
                fontSize: 11,
              }}
              onClick={handleExportPDF}
              disabled={filtered.length === 0}
            >
              PDF
            </button>

            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={movements.length === 0}
              style={{
                fontSize: 11,
                padding: "7px 12px",
                borderRadius: 4,
                border: "1px solid #5C2020",
                background:
                  movements.length === 0
                    ? "#111820"
                    : "#1A0808",
                color:
                  movements.length === 0
                    ? "#4B5A6B"
                    : "#F87171",
                cursor:
                  movements.length === 0
                    ? "not-allowed"
                    : "pointer",
                fontFamily:
                  "Outfit, sans-serif",
                fontWeight: 600,
              }}
            >
              🗑 Eliminar todo
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <input
            className="wms-input"
            placeholder="Buscar producto, SKU, referencia..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              width: 260,
            }}
          />

          <select
            className="wms-select"
            value={selectedProduct}
            onChange={(e) =>
              setSelectedProduct(e.target.value)
            }
          >
            <option value="all">
              Todos los productos
            </option>

            {products.map((p) => (
              <option
                key={p.id}
                value={String(p.id)}
              >
                {p.sku} — {p.name}
              </option>
            ))}
          </select>

          <select
            className="wms-select"
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value)
            }
          >
            <option value="Todos">
              Todos
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
          overflowX: "auto",
        }}
      >
        {movements.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
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
              ≡
            </div>

            <div
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 14,
                color: "#4B5A6B",
              }}
            >
              Sin movimientos registrados
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#2D4050",
              }}
            >
              Registra entradas y salidas
              para ver el kárdex
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 14,
                color: "#4B5A6B",
              }}
            >
              No se encontraron movimientos
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#2D4050",
              }}
            >
              Cambia los filtros o realiza
              otra búsqueda
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
                <th>ID</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>SKU</th>
                <th>Producto</th>
                <th>Referencia</th>

                <th
                  style={{
                    textAlign: "right",
                  }}
                >
                  Cantidad
                </th>

                <th
                  style={{
                    textAlign: "right",
                  }}
                >
                  P. Unitario
                </th>

                <th
                  style={{
                    textAlign: "right",
                  }}
                >
                  Total
                </th>

                <th
                  style={{
                    textAlign: "right",
                  }}
                >
                  Saldo
                </th>

                <th>Contraparte</th>
                <th>Usuario</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((m) => {
                const type = String(
                  m.type ?? ""
                );

                const qty =
                  Number(m.qty) || 0;

                const unitCost =
                  Number(m.unitCost) || 0;

                const total =
                  Number(m.total) || 0;

                const balance =
                  Number(m.balance) || 0;

                const isEntrada =
                  type === "Entrada" ||
                  type === "Devolución";

                const isSalida =
                  type === "Salida";

                return (
                  <tr key={m.id}>
                    <td
                      className="num"
                      style={{
                        color: "#4B5A6B",
                        fontSize: 10.5,
                      }}
                    >
                      {m.id}
                    </td>

                    <td className="num">
                      {m.date || "—"}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          typeBadge[type] ||
                          "badge-gray"
                        }`}
                      >
                        {type || "—"}
                      </span>
                    </td>

                    <td className="num">
                      {m.sku || "—"}
                    </td>

                    <td
                      style={{
                        fontWeight: 500,
                        color: "#D1D9E2",
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={String(
                        m.productName ?? ""
                      )}
                    >
                      {m.productName || "—"}
                    </td>

                    <td
                      className="num"
                      style={{
                        color: "#94A3B8",
                      }}
                    >
                      {m.reference || "—"}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                        color:
                          typeColor[type] ||
                          "#E2E8F0",
                        fontWeight: 700,
                      }}
                    >
                      {isEntrada
                        ? "+"
                        : isSalida
                        ? "-"
                        : "±"}
                      {Math.abs(qty)}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      {fmtUSD(unitCost)}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                        color:
                          typeColor[type] ||
                          "#E2E8F0",
                        fontWeight: 700,
                      }}
                    >
                      {isSalida ? "-" : "+"}
                      {fmtUSD(total)}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#E2E8F0",
                      }}
                    >
                      {balance}
                    </td>

                    <td
                      style={{
                        fontSize: 11,
                        color: "#64748B",
                        maxWidth: 120,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={String(
                        getCounterpart(m)
                      )}
                    >
                      {getCounterpart(m)}
                    </td>

                    <td
                      style={{
                        fontSize: 11,
                      }}
                    >
                      {m.user || "—"}
                    </td>

                    <td
                      style={{
                        textAlign: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(m.id)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#3D1414",
                          fontSize: 14,
                          lineHeight: 1,
                          padding: "2px 6px",
                          borderRadius: 3,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color =
                            "#F87171";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color =
                            "#3D1414";
                        }}
                        title="Eliminar movimiento"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div
        style={{
          padding: "10px 24px",
          borderTop: "1px solid #111820",
          background: "#080B10",
          display: "flex",
          gap: 32,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#4B5A6B",
              fontFamily: "Outfit",
              textTransform: "uppercase",
            }}
          >
            Entradas:
          </span>

          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 13,
              fontWeight: 700,
              color: "#00C896",
            }}
          >
            {fmtUSD(totalEntradas)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#4B5A6B",
              fontFamily: "Outfit",
              textTransform: "uppercase",
            }}
          >
            Salidas:
          </span>

          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 13,
              fontWeight: 700,
              color: "#F87171",
            }}
          >
            {fmtUSD(totalSalidas)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#4B5A6B",
              fontFamily: "Outfit",
              textTransform: "uppercase",
            }}
          >
            Ajustes:
          </span>

          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 13,
              fontWeight: 700,
              color: "#FBBF24",
            }}
          >
            {totalAjustes}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#4B5A6B",
              fontFamily: "Outfit",
              textTransform: "uppercase",
            }}
          >
            Total movs.:
          </span>

          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 13,
              fontWeight: 700,
              color: "#94A3B8",
            }}
          >
            {filtered.length}
          </span>
        </div>
      </div>
    </div>
  );
}