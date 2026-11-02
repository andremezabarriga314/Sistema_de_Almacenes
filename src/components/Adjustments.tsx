import { useState } from "react";
import { useApp } from "../store/AppContext";

const adjTypes = [
  "Merma / Pérdida",
  "Encontrado",
  "Error de conteo",
  "Devolución de cliente",
  "Transferencia entre almacenes",
  "Otro",
];

export default function Adjustments() {
  const { products, movements, addMovement } = useApp();

  const adjustments = movements.filter((m) => m.type === "Ajuste");

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [form, setForm] = useState({
    productId: "",
    systemQty: 0,
    physicalQty: 0,
    type: "Merma / Pérdida",
    notes: "",
  });

  const selectedProd = products.find((p) => p.id === form.productId);

  const diff = form.physicalQty - form.systemQty;

  // =========================================================
  // PRODUCTOS FILTRADOS
  // =========================================================

  const filteredProducts =
    productSearch.trim().length > 0
      ? products
          .filter((p) => p.status === "Activo")
          .filter((p) => {
            const search = productSearch.toLowerCase().trim();

            return (
              p.name.toLowerCase().includes(search) ||
              p.sku.toLowerCase().includes(search)
            );
          })
          .slice(0, 8)
      : [];

  // =========================================================
  // SELECCIONAR PRODUCTO
  // =========================================================

  const selectProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);

    if (!p) return;

    setForm((f) => ({
      ...f,
      productId: p.id,
      systemQty: p.stock || 0,
      physicalQty: p.stock || 0,
    }));

    setProductSearch(`${p.sku} — ${p.name}`);
    setError("");
  };

  // =========================================================
  // REGISTRAR AJUSTE
  // =========================================================

  const submit = () => {
    setError("");

    if (!form.productId) {
      setError("Selecciona un producto.");
      return;
    }

    if (!selectedProd) {
      setError("No se encontró el producto seleccionado.");
      return;
    }

    if (form.physicalQty < 0) {
      setError("La cantidad física no puede ser negativa.");
      return;
    }

    if (diff === 0) {
      setError(
        "No hay diferencia entre el inventario del sistema y el conteo físico.",
      );
      return;
    }

    const quantity = Math.abs(diff);

    addMovement({
      date: new Date().toISOString().slice(0, 10),
      type: "Ajuste",
      productId: form.productId,
      productName: selectedProd.name,
      sku: selectedProd.sku,
      qty: quantity,
      unitCost: selectedProd.costPrice,
      salePrice: selectedProd.salePrice,
      total: quantity * selectedProd.costPrice,
      balance: form.physicalQty,
      reference: `AJ-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9999),
      ).padStart(4, "0")}`,
      user: "Admin",
      reason: form.type,
      notes: form.notes.trim(),
      stockBefore: form.systemQty,
      stockAfter: form.physicalQty,
    });

    setShowModal(false);
    setProductSearch("");

    setForm({
      productId: "",
      systemQty: 0,
      physicalQty: 0,
      type: "Merma / Pérdida",
      notes: "",
    });
  };

  // =========================================================
  // ABRIR MODAL
  // =========================================================

  const openModal = () => {
    setError("");
    setProductSearch("");

    setForm({
      productId: "",
      systemQty: 0,
      physicalQty: 0,
      type: "Merma / Pérdida",
      notes: "",
    });

    setShowModal(true);
  };

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const closeModal = () => {
    setShowModal(false);
    setError("");
    setProductSearch("");
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
      {/* =====================================================
          HEADER
      ===================================================== */}

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
                margin: 0,
              }}
            >
              Ajustes de Inventario
            </h1>

            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#4B5A6B",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {adjustments.length} ajustes registrados
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={openModal}
            disabled={products.length === 0}
          >
            + Nuevo Ajuste
          </button>
        </div>
      </div>

      {/* =====================================================
          TABLE / EMPTY STATE
      ===================================================== */}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {adjustments.length === 0 ? (
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
              ⊡
            </div>

            <div
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 14,
                color: "#4B5A6B",
              }}
            >
              Sin ajustes registrados
            </div>

            {products.length === 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: "#2D4050",
                }}
              >
                Registra productos primero
              </div>
            )}
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
                <th>Tipo de Ajuste</th>
                <th>SKU</th>
                <th>Producto</th>
                <th style={{ textAlign: "right" }}>Diferencia</th>
                <th style={{ textAlign: "right" }}>Saldo</th>
                <th>Usuario</th>
                <th>Observaciones</th>
              </tr>
            </thead>

            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id}>
                  <td
                    className="num"
                    style={{
                      color: "#FBBF24",
                    }}
                  >
                    {a.reference}
                  </td>

                  <td className="num">
                    {new Date(a.date).toLocaleString("es-PE", {
                      timeZone: "America/Lima",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })}
                  </td>

                  <td
                    style={{
                      color: "#94A3B8",
                    }}
                  >
                    {a.reason || "—"}
                  </td>

                  <td className="num">{a.sku}</td>

                  <td
                    style={{
                      color: "#D1D9E2",
                    }}
                  >
                    {a.productName}
                  </td>

                  <td
                    className="num"
                    style={{
                      textAlign: "right",
                      color:
                        a.stockAfter !== undefined &&
                        a.stockBefore !== undefined &&
                        a.stockAfter < a.stockBefore
                          ? "#F87171"
                          : "#FBBF24",
                      fontWeight: 700,
                    }}
                  >
                    {a.stockAfter !== undefined &&
                    a.stockBefore !== undefined &&
                    a.stockAfter > a.stockBefore
                      ? "+"
                      : a.stockAfter !== undefined &&
                          a.stockBefore !== undefined &&
                          a.stockAfter < a.stockBefore
                        ? "-"
                        : "±"}
                    {a.qty}
                  </td>

                  <td
                    className="num"
                    style={{
                      textAlign: "right",
                    }}
                  >
                    {a.balance}
                  </td>

                  <td>{a.user}</td>

                  <td
                    style={{
                      fontSize: 11,
                      color: "#64748B",
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={a.notes || ""}
                  >
                    {a.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="wms-card"
            style={{
              width: 480,
              maxWidth: "calc(100vw - 32px)",
            }}
          >
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #1A2232",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#E2E8F0",
                  margin: 0,
                }}
              >
                Nuevo Ajuste de Inventario
              </h2>

              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "#4B5A6B",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* =================================================
                  PRODUCTO - BUSCADOR
              ================================================= */}

              <div style={{ position: "relative" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Producto *
                </label>

                <input
                  className="wms-input"
                  type="text"
                  autoComplete="off"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  value={productSearch}
                  placeholder="Escribe nombre o SKU..."
                  onChange={(e) => {
                    const value = e.target.value;

                    setProductSearch(value);

                    setForm((f) => ({
                      ...f,
                      productId: "",
                      systemQty: 0,
                      physicalQty: 0,
                    }));

                    setError("");
                  }}
                />

                {/* =================================================
                    RESULTADOS DEL BUSCADOR
                ================================================= */}

                {productSearch.trim() &&
                  !form.productId &&
                  filteredProducts.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: "#0D1219",
                        border: "1px solid #263241",
                        borderRadius: 5,
                        maxHeight: 220,
                        overflowY: "auto",
                        zIndex: 100,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
                      }}
                    >
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectProduct(p.id)}
                          style={{
                            width: "100%",
                            border: "none",
                            borderBottom: "1px solid #1A2232",
                            background: "transparent",
                            color: "#E2E8F0",
                            cursor: "pointer",
                            padding: "10px 12px",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#151D27";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 11,
                              color: "#FBBF24",
                              marginBottom: 3,
                            }}
                          >
                            {p.sku}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: "#D1D9E2",
                            }}
                          >
                            {p.name}
                          </div>

                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 10,
                              color: "#64748B",
                            }}
                          >
                            Stock actual: {p.stock}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                {productSearch.trim() &&
                  !form.productId &&
                  filteredProducts.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: "#0D1219",
                        border: "1px solid #263241",
                        borderRadius: 5,
                        padding: "12px",
                        zIndex: 100,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#64748B",
                        }}
                      >
                        No se encontraron productos.
                      </span>
                    </div>
                  )}

                {/* =================================================
                    PRODUCTO SELECCIONADO
                ================================================= */}

                {form.productId && selectedProd && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: "7px 10px",
                      borderRadius: 4,
                      background: "rgba(0,200,150,0.05)",
                      border: "1px solid rgba(0,200,150,0.16)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#00C896",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {selectedProd.sku}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#CBD5E1",
                          marginTop: 2,
                        }}
                      >
                        {selectedProd.name}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch("");

                        setForm((f) => ({
                          ...f,
                          productId: "",
                          systemQty: 0,
                          physicalQty: 0,
                        }));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748B",
                        cursor: "pointer",
                        fontSize: 15,
                      }}
                      title="Cambiar producto"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* =================================================
                  CANTIDADES
              ================================================= */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {/* QTY SISTEMA */}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10.5,
                      color: "#4B5A6B",
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Qty en Sistema
                  </label>

                  <input
                    className="wms-input"
                    type="text"
                    inputMode="numeric"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      opacity: 0.6,
                    }}
                    value={form.systemQty}
                    readOnly
                  />
                </div>

                {/* QTY FÍSICA */}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10.5,
                      color: "#4B5A6B",
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Qty Física Contada
                  </label>

                  <input
                    className="wms-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                    value={form.physicalQty}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");

                      const numericValue =
                        value === "" ? 0 : Number(value);

                      setForm((f) => ({
                        ...f,
                        physicalQty: numericValue,
                      }));

                      setError("");
                    }}
                  />
                </div>
              </div>

              {/* =================================================
                  DIFERENCIA
              ================================================= */}

              {form.productId && (
                <div
                  style={{
                    background:
                      diff < 0
                        ? "rgba(239,68,68,0.07)"
                        : diff > 0
                          ? "rgba(0,200,150,0.06)"
                          : "rgba(100,116,139,0.06)",
                    border: `1px solid ${
                      diff < 0
                        ? "#3D1414"
                        : diff > 0
                          ? "rgba(0,200,150,0.2)"
                          : "#1A2232"
                    }`,
                    borderRadius: 5,
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#64748B",
                    }}
                  >
                    Diferencia:
                  </span>

                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 16,
                      fontWeight: 700,
                      color:
                        diff < 0
                          ? "#F87171"
                          : diff > 0
                            ? "#F5B21B"
                            : "#64748B",
                    }}
                  >
                    {diff > 0 ? "+" : ""}
                    {diff} unidades
                  </span>
                </div>
              )}

              {/* =================================================
                  TIPO
              ================================================= */}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Tipo de Ajuste
                </label>

                <select
                  className="wms-select"
                  style={{
                    width: "100%",
                  }}
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value,
                    }))
                  }
                >
                  {adjTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* =================================================
                  OBSERVACIONES
              ================================================= */}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "#4B5A6B",
                    fontFamily: "Outfit, sans-serif",
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
                    boxSizing: "border-box",
                    height: 60,
                    resize: "none",
                  }}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Descripción del ajuste..."
                />
              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div
                  style={{
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
                    ⚠ {error}
                  </span>
                </div>
              )}
            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #1A2232",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button className="btn-secondary" onClick={closeModal}>
                Cancelar
              </button>

              <button
                className="btn-primary"
                onClick={submit}
                disabled={!form.productId || diff === 0}
              >
                Registrar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
