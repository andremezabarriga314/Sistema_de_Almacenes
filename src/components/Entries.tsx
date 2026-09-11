import { useState } from "react";
import { useApp } from "../store/AppContext";
import { exportMovementsPDF } from "../lib/exportPDF";
import { exportMovementsExcel } from "../lib/exportExcel";

const fmtUSD = (n: number) => "$" + n.toFixed(2);

export default function Entries() {
  const {
    products,
    suppliers,
    movements,
    addMovement,
    deleteMovement,
  } = useApp();

  const entries = movements.filter((m) => m.type === "Entrada");

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    productId: "",
    qty: 1,
    unitCost: 0,
    supplierId: "",
    reference: "",
    notes: "",
    lotNumber: "",
    expiryDate: "",
  });

  const filtered = entries.filter(
    (m) =>
      !search ||
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.reference.toLowerCase().includes(search.toLowerCase()) ||
      (m.lotNumber || "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectedProduct = products.find(
    (p) => p.id === form.productId,
  );

  const total = form.qty * form.unitCost;

  const today = new Date().toISOString().slice(0, 10);

  const daysToExpiry = form.expiryDate
    ? Math.floor(
        (new Date(form.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const expiryWarning =
    daysToExpiry !== null &&
    daysToExpiry < 30 &&
    daysToExpiry >= 0;

  const expiryError =
    daysToExpiry !== null &&
    daysToExpiry < 0;

  const resetForm = () => {
    setForm({
      productId: "",
      qty: 1,
      unitCost: 0,
      supplierId: "",
      reference: "",
      notes: "",
      lotNumber: "",
      expiryDate: "",
    });
  };

  const submit = () => {
    setError("");

    if (!form.productId) {
      setError("Selecciona un alimento.");
      return;
    }

    if (form.qty <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return;
    }

    if (form.unitCost <= 0) {
      setError("El costo unitario debe ser mayor a 0.");
      return;
    }

    if (!form.lotNumber.trim()) {
      setError("El número de lote es obligatorio.");
      return;
    }

    if (!form.expiryDate) {
      setError("La fecha de vencimiento del lote es obligatoria.");
      return;
    }

    if (expiryError) {
      setError(
        "La fecha de vencimiento ya pasó. No se puede ingresar un lote vencido.",
      );
      return;
    }

    if (!selectedProduct) {
      setError("No se encontró el alimento seleccionado.");
      return;
    }

    const reference =
      form.reference.trim() ||
      `OC-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9999),
      ).padStart(4, "0")}`;

    addMovement(
      {
        date: today,
        type: "Entrada",
        productId: form.productId,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        qty: form.qty,
        unitCost: form.unitCost,
        total,
        balance: selectedProduct.stock + form.qty,
        reference,
        user: "Admin",
        supplierId: form.supplierId || undefined,
        notes: form.notes.trim() || undefined,
        lotNumber: form.lotNumber.trim(),
        expiryDate: form.expiryDate,
      },
      {
        lotNumber: form.lotNumber.trim(),
        expiryDate: form.expiryDate,
      },
    );

    setShowModal(false);
    setError("");
    resetForm();
  };

  const handleExportExcel = () => {
    if (entries.length === 0) return;

    exportMovementsExcel(
      entries,
      suppliers,
      "Entradas",
    );
  };

  const handleExportPDF = () => {
    if (entries.length === 0) return;

    exportMovementsPDF(
      entries,
      suppliers,
      "Entradas",
    );
  };

  const handleDeleteAllEntries = () => {
    if (entries.length === 0) return;

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar todas las entradas?\n\nSe eliminarán ${entries.length} registros de entrada.\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    entries.forEach((entry) => {
      deleteMovement(entry.id);
    });

    setSearch("");
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
                fontFamily: "Outfit, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#E2E8F0",
              }}
            >
              Entradas de Alimentos
            </h1>

            <div
              style={{
                fontSize: 11,
                color: "#4B5A6B",
                fontFamily: "JetBrains Mono",
              }}
            >
              {filtered.length} registros - Total:{" "}
              {fmtUSD(
                entries.reduce(
                  (total, movement) => total + movement.total,
                  0,
                ),
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <button
              className="btn-secondary"
              style={{ fontSize: 11 }}
              onClick={handleExportExcel}
              disabled={entries.length === 0}
            >
              Excel
            </button>

            <button
              className="btn-secondary"
              style={{ fontSize: 11 }}
              onClick={handleExportPDF}
              disabled={entries.length === 0}
            >
              PDF
            </button>

            <button
              type="button"
              onClick={handleDeleteAllEntries}
              disabled={entries.length === 0}
              style={{
                fontSize: 11,
                padding: "7px 12px",
                borderRadius: 4,
                border: "1px solid #5C2020",
                background:
                  entries.length === 0 ? "#111820" : "#1A0808",
                color:
                  entries.length === 0 ? "#4B5A6B" : "#F87171",
                cursor:
                  entries.length === 0 ? "not-allowed" : "pointer",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
              }}
            >
              🗑 Eliminar todo
            </button>

            <button
              className="btn-primary"
              onClick={() => {
                setError("");
                setShowModal(true);
              }}
              disabled={products.length === 0}
            >
              + Registrar Entrada
            </button>
          </div>
        </div>

        <input
          className="wms-input"
          placeholder="Buscar por alimento, lote, referencia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {entries.length === 0 ? (
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
              ↓
            </div>

            <div
              style={{
                fontFamily: "Outfit",
                fontSize: 14,
                color: "#4B5A6B",
              }}
            >
              Sin entradas registradas
            </div>

            {products.length === 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: "#2D4050",
                }}
              >
                Primero registra alimentos en el catálogo
              </div>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#4B5A6B",
              fontSize: 13,
            }}
          >
            No se encontraron entradas.
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
                <th>Referencia</th>
                <th>Fecha</th>
                <th>Código</th>
                <th>Alimento</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Proveedor</th>
                <th style={{ textAlign: "right" }}>Cantidad</th>
                <th style={{ textAlign: "right" }}>P. Unitario</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>Saldo</th>
                <th>Usuario</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((m) => {
                const supplier = suppliers.find(
                  (s) => s.id === m.supplierId,
                );

                const expiryDate = m.expiryDate;

                const daysLeft = expiryDate
                  ? Math.floor(
                      (new Date(expiryDate).getTime() -
                        Date.now()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;

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

                    <td
                      className="num"
                      style={{
                        color: "#00C896",
                      }}
                    >
                      {m.reference}
                    </td>

                    <td className="num">{m.date}</td>

                    <td className="num">{m.sku}</td>

                    <td
                      style={{
                        fontWeight: 500,
                        color: "#D1D9E2",
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.productName}
                    </td>

                    <td
                      className="num"
                      style={{
                        color: "#A78BFA",
                      }}
                    >
                      {m.lotNumber || "---"}
                    </td>

                    <td
                      className="num"
                      style={{
                        color:
                          daysLeft === null
                            ? "#64748B"
                            : daysLeft < 0
                              ? "#F87171"
                              : daysLeft <= 30
                                ? "#FBBF24"
                                : "#00C896",
                      }}
                    >
                      {expiryDate || "---"}

                      {daysLeft !== null && daysLeft >= 0 && (
                        <span
                          style={{
                            fontSize: 9,
                            marginLeft: 4,
                            color: "#4B5A6B",
                          }}
                        >
                          ({daysLeft}d)
                        </span>
                      )}
                    </td>

                    <td
                      style={{
                        fontSize: 11,
                        maxWidth: 120,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {supplier ? supplier.name : "---"}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                        color: "#00C896",
                        fontWeight: 700,
                      }}
                    >
                      +{m.qty}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      {fmtUSD(m.unitCost)}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                      }}
                    >
                      {fmtUSD(m.total)}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      {m.balance}
                    </td>

                    <td>{m.user}</td>

                    <td
                      style={{
                        textAlign: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              "¿Eliminar esta entrada?",
                            )
                          ) {
                            deleteMovement(m.id);
                          }
                        }}
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
                          e.currentTarget.style.color = "#F87171";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#3D1414";
                        }}
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

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="wms-card"
            style={{
              width: 540,
              maxHeight: "92vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #1A2232",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h2
                style={{
                  fontFamily: "Outfit",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#E2E8F0",
                }}
              >
                Registrar Entrada
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#4B5A6B",
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: 20,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Alimento *
                </label>

                <select
                  className="wms-select"
                  style={{
                    width: "100%",
                  }}
                  value={form.productId}
                  onChange={(e) => {
                    const product = products.find(
                      (p) => p.id === e.target.value,
                    );

                    setForm((current) => ({
                      ...current,
                      productId: e.target.value,
                      unitCost: product
                        ? product.costPrice
                        : 0,
                    }));

                    setError("");
                  }}
                >
                  <option value="">--- Seleccionar ---</option>

                  {products
                    .filter((p) => p.status === "Activo")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name} (Stock: {p.stock}{" "}
                        {p.unit})
                      </option>
                    ))}
                </select>
              </div>

              {selectedProduct && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    background: "#0A1218",
                    border: "1px solid #1A2232",
                    borderRadius: 5,
                    padding: "8px 12px",
                    display: "flex",
                    gap: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#4B5A6B",
                    }}
                  >
                    Stock:{" "}
                    <span
                      style={{
                        color: "#00C896",
                        fontFamily: "JetBrains Mono",
                        fontWeight: 600,
                      }}
                    >
                      {selectedProduct.stock}{" "}
                      {selectedProduct.unit}
                    </span>
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: "#4B5A6B",
                    }}
                  >
                    Temp:{" "}
                    <span
                      style={{
                        color: "#60A5FA",
                      }}
                    >
                      {selectedProduct.storageTemp || "---"}
                    </span>
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: "#4B5A6B",
                    }}
                  >
                    Categoría:{" "}
                    <span
                      style={{
                        color: "#94A3B8",
                      }}
                    >
                      {selectedProduct.category}
                    </span>
                  </span>
                </div>
              )}

              <div
                style={{
                  gridColumn: "1 / -1",
                  borderTop: "1px solid #111820",
                  paddingTop: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#A78BFA",
                    fontFamily: "Outfit",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Información de Lote
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Número de Lote *
                </label>

                <input
                  className="wms-input"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  placeholder="Ej: LOT-2024-001"
                  value={form.lotNumber}
                  onChange={(e) => {
                    setForm((current) => ({
                      ...current,
                      lotNumber: e.target.value,
                    }));
                    setError("");
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: expiryWarning
                      ? "#FBBF24"
                      : expiryError
                        ? "#F87171"
                        : "#4B5A6B",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Fecha de Vencimiento *
                </label>

                <input
                  className="wms-input"
                  type="date"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderColor: expiryError
                      ? "#3D1414"
                      : expiryWarning
                        ? "#3D2C10"
                        : undefined,
                  }}
                  value={form.expiryDate}
                  min={today}
                  onChange={(e) => {
                    setForm((current) => ({
                      ...current,
                      expiryDate: e.target.value,
                    }));
                    setError("");
                  }}
                />

                {expiryWarning && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#FBBF24",
                      marginTop: 3,
                    }}
                  >
                    Vence en {daysToExpiry} días
                  </div>
                )}
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  borderTop: "1px solid #111820",
                  paddingTop: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#00C896",
                    fontFamily: "Outfit",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Movimiento
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Cantidad *
                </label>

                <input
                  className="wms-input"
                  type="number"
                  min="1"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  value={form.qty}
                  onChange={(e) => {
                    setForm((current) => ({
                      ...current,
                      qty: Number(e.target.value),
                    }));
                    setError("");
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Costo Unitario ($) *
                </label>

                <input
                  className="wms-input"
                  type="number"
                  min="0"
                  step="0.01"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  value={form.unitCost}
                  onChange={(e) => {
                    setForm((current) => ({
                      ...current,
                      unitCost: Number(e.target.value),
                    }));
                    setError("");
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  N° Comprobante / OC
                </label>

                <input
                  className="wms-input"
                  type="text"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  value={form.reference}
                  onChange={(e) => {
                    setForm((current) => ({
                      ...current,
                      reference: e.target.value,
                    }));
                    setError("");
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Proveedor
                </label>

                <select
                  className="wms-select"
                  style={{
                    width: "100%",
                  }}
                  value={form.supplierId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      supplierId: e.target.value,
                    }))
                  }
                >
                  <option value="">--- Ninguno ---</option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Observaciones
                </label>

                <textarea
                  className="wms-input"
                  style={{
                    width: "100%",
                    minHeight: 70,
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                  value={form.notes}
                  onChange={(e) => {
                    setForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }));
                    setError("");
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "8px 12px",
                    borderRadius: 4,
                    background: "#1E0808",
                    border: "1px solid #3D1010",
                    borderLeft: "3px solid #EF4444",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#FCA5A5",
                    }}
                  >
                    {error}
                  </span>
                </div>
              )}

              {!error &&
                form.productId &&
                form.qty > 0 &&
                form.unitCost > 0 && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "rgba(0,200,150,0.06)",
                      border: "1px solid rgba(0,200,150,0.2)",
                      borderRadius: 5,
                      padding: "9px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#64748B",
                      }}
                    >
                      Total de la entrada:
                    </span>

                    <span
                      style={{
                        fontFamily: "JetBrains Mono",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#00C896",
                      }}
                    >
                      {fmtUSD(total)}
                    </span>
                  </div>
                )}
            </div>

            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #1A2232",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
              >
                Cancelar
              </button>

              <button
                className="btn-primary"
                onClick={submit}
              >
                Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}