import { useState, useRef } from "react";
import * as XLSX from "xlsx";

import { useApp } from "../store/AppContext";

import {
  exportProductsExcel,
  exportMovementsExcel,
  exportSuppliersExcel,
  exportLotsExcel,
} from "../lib/exportExcel";

import {
  exportProductsPDF,
  exportMovementsPDF,
  exportSuppliersPDF,
} from "../lib/exportPDF";

function excelSerialToDate(n: unknown): string {
  if (typeof n !== "number" || n < 100) {
    return String(n || "");
  }

  return new Date(
    Date.UTC(1899, 11, 30) + n * 86400000
  )
    .toISOString()
    .slice(0, 10);
}

function smartCell(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }

  if (typeof val === "number") {
    if (
      val > 30000 &&
      val < 70000 &&
      Number.isInteger(val)
    ) {
      return excelSerialToDate(val);
    }

    return String(val);
  }

  return String(val)
    .replace(/^\t+|\t+$/g, "")
    .trim();
}

type SheetData = {
  headers: string[];
  rows: string[][];
  name: string;
  rawRows: unknown[][];
};

export default function ImportExport() {
  const {
    products,
    movements,
    suppliers,
    lots,
    addProduct,
    updateProduct,
    seeded,
    seedAll,
  } = useApp();

  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"import" | "export">(
    "import"
  );

  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: number;
  } | null>(null);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) {
        return;
      }

      const data = new Uint8Array(
        event.target.result as ArrayBuffer
      );

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const parsed: SheetData[] =
        workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name];

          const raw: unknown[][] =
            XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: null,
            });

          let headerRow = 0;

          for (
            let i = 0;
            i < Math.min(raw.length, 10);
            i++
          ) {
            const nonNull = (
              raw[i] as unknown[]
            ).filter(
              (cell) =>
                cell !== null &&
                cell !== undefined &&
                String(cell).trim() !== ""
            ).length;

            if (nonNull >= 3) {
              headerRow = i;
              break;
            }
          }

          const headers = (
            (raw[headerRow] as unknown[]) || []
          ).map((cell) => smartCell(cell));

          const rows = raw
            .slice(headerRow + 1)
            .filter((row) =>
              (row as unknown[]).some(
                (cell) =>
                  cell !== null &&
                  cell !== undefined &&
                  String(cell).trim() !== ""
              )
            )
            .map((row) =>
              (row as unknown[]).map((cell) =>
                smartCell(cell)
              )
            );

          return {
            name,
            headers,
            rows,
            rawRows: raw,
          };
        });

      setSheets(parsed);
      setActiveSheet(0);
    };

    reader.readAsArrayBuffer(file);
  };

  const doImport = () => {
    const sheet = sheets[activeSheet];

    if (!sheet) {
      return;
    }

    setImporting(true);

    let created = 0;
    let updated = 0;
    let errors = 0;

    const headers = sheet.headers.map((header) =>
      header.toLowerCase()
    );

    const getValue = (
      row: string[],
      ...keys: string[]
    ): string => {
      for (const key of keys) {
        const index = headers.findIndex((header) =>
          header.includes(key)
        );

        if (index >= 0 && row[index]) {
          return row[index];
        }
      }

      return "";
    };

    sheet.rows.forEach((row) => {
      try {
        const sku = getValue(
          row,
          "sku",
          "codigo",
          "code",
          "cód"
        );

        const name = getValue(
          row,
          "nombre",
          "name",
          "alimento",
          "producto",
          "descripcion"
        );

        if (!sku && !name) {
          return;
        }

        const existing = products.find(
          (product) =>
            product.sku === sku ||
            product.name === name
        );

        const data = {
          sku:
            sku ||
            name
              .slice(0, 12)
              .toUpperCase()
              .replace(/\s+/g, "-"),

          name: name || sku,

          category:
            getValue(
              row,
              "categoria",
              "category",
              "categ"
            ) || "Otro",

          subcategory: getValue(
            row,
            "subcategoria",
            "sub"
          ),

          costPrice:
            parseFloat(
              getValue(
                row,
                "costo",
                "cost",
                "precio costo",
                "unitcost"
              )
            ) || 0,

          salePrice:
            parseFloat(
              getValue(
                row,
                "venta",
                "sale",
                "precio venta"
              )
            ) || 0,

          stock:
            parseInt(
              getValue(
                row,
                "stock",
                "cantidad",
                "qty",
                "saldo"
              )
            ) || 0,

          minStock:
            parseInt(
              getValue(
                row,
                "minimo",
                "min stock",
                "minstock"
              )
            ) || 5,

          maxStock:
            parseInt(
              getValue(
                row,
                "maximo",
                "max stock",
                "maxstock"
              )
            ) || 9999,

          unit:
            getValue(
              row,
              "unidad",
              "unit",
              "presentacion"
            ) || "Kg",

          location: getValue(
            row,
            "ubicacion",
            "location"
          ),

          supplierId: "",

          status: (getValue(
            row,
            "estado",
            "status"
          ) || "Activo") as "Activo" | "Inactivo",

          storageTemp:
            getValue(
              row,
              "temperatura",
              "temp",
              "almac"
            ) || "Ambiente (15–25 °C)",
        };

        if (existing) {
          updateProduct(existing.id, data);
          updated++;
        } else {
          addProduct(data);
          created++;
        }
      } catch {
        errors++;
      }
    });

    setImportResult({
      created,
      updated,
      errors,
    });

    setImporting(false);
  };

  const sheet = sheets[activeSheet];

  const exportCards = [
    {
      label: "Alimentos",
      desc: "Catálogo completo con valoración y lotes",
      icon: "⊞",
      color: "#00C896",
      actions: [
        {
          label: "Excel (.xlsx)",
          fn: () =>
            exportProductsExcel(
              products,
              suppliers,
              lots
            ),
        },
        {
          label: "PDF",
          fn: () =>
            exportProductsPDF(
              products,
              suppliers
            ),
        },
      ],
    },
    {
      label: "Movimientos",
      desc: "Entradas, salidas y ajustes con lotes",
      icon: "≡",
      color: "#38BDF8",
      actions: [
        {
          label: "Excel (.xlsx)",
          fn: () =>
            exportMovementsExcel(
              movements,
              suppliers,
              "Movimientos"
            ),
        },
        {
          label: "PDF",
          fn: () =>
            exportMovementsPDF(
              movements,
              "Movimientos"
            ),
        },
      ],
    },
    {
      label: "Entradas",
      desc: "Solo movimientos de entrada",
      icon: "↓",
      color: "#34D399",
      actions: [
        {
          label: "Excel (.xlsx)",
          fn: () =>
            exportMovementsExcel(
              movements.filter(
                (movement) =>
                  movement.type === "Entrada"
              ),
              suppliers,
              "Entradas"
            ),
        },
        {
          label: "PDF",
          fn: () =>
            exportMovementsPDF(
              movements.filter(
                (movement) =>
                  movement.type === "Entrada"
              ),
              "Entradas"
            ),
        },
      ],
    },
    {
      label: "Salidas",
      desc: "Solo movimientos de salida",
      icon: "↑",
      color: "#F87171",
      actions: [
        {
          label: "Excel (.xlsx)",
          fn: () =>
            exportMovementsExcel(
              movements.filter(
                (movement) =>
                  movement.type === "Salida"
              ),
              suppliers,
              "Salidas"
            ),
        },
        {
          label: "PDF",
          fn: () =>
            exportMovementsPDF(
              movements.filter(
                (movement) =>
                  movement.type === "Salida"
              ),
              "Salidas"
            ),
        },
      ],
    },
    {
      label: "Lotes",
      desc: "Control de lotes y vencimientos",
      icon: "◫",
      color: "#A78BFA",
      actions: [
        {
          label: "Excel (.xlsx)",
          fn: () => exportLotsExcel(lots),
        },
      ],
    },
    {
      label: "Proveedores",
      desc: "Directorio completo de proveedores",
      icon: "◈",
      color: "#FBBF24",
      actions: [
        {
          label: "Excel (.xlsx)",
          fn: () =>
            exportSuppliersExcel(suppliers),
        },
        {
          label: "PDF",
          fn: () =>
            exportSuppliersPDF(suppliers),
        },
      ],
    },
  ];

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
          padding: "20px 24px 0",
          borderBottom: "1px solid #111820",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
              Importar / Exportar
            </h1>

            <div
              style={{
                fontSize: 11,
                color: "#4B5A6B",
                fontFamily: "JetBrains Mono",
              }}
            >
              Gestión de archivos Excel y PDF
            </div>
          </div>

          {!seeded && (
            <button
              className="btn-primary"
              style={{
                fontSize: 12,
                background: "#A78BFA",
                border: "none",
              }}
              onClick={seedAll}
            >
              ⚡ Cargar datos de ejemplo
              (CALLERÍA 5 2026)
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 0,
          }}
        >
          {(["import", "export"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setTab(type)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 20px",
                  fontSize: 13,
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 600,
                  color:
                    tab === type
                      ? "#00C896"
                      : "#4B5A6B",
                  borderBottom:
                    tab === type
                      ? "2px solid #00C896"
                      : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {type === "import"
                  ? "Importar Excel"
                  : "Exportar Reportes"}
              </button>
            )
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tab === "export" ? (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 24,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: 14,
              }}
            >
              {exportCards.map((card) => (
                <div
                  key={card.label}
                  className="wms-card"
                  style={{
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 7,
                        background:
                          card.color + "1A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </div>

                    <div>
                      <div
                        style={{
                          fontFamily: "Outfit",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#E2E8F0",
                        }}
                      >
                        {card.label}
                      </div>

                      <div
                        style={{
                          fontSize: 10.5,
                          color: "#4B5A6B",
                        }}
                      >
                        {card.desc}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {card.actions.map(
                      (action) => (
                        <button
                          key={action.label}
                          className="btn-secondary"
                          style={{
                            fontSize: 11,
                            padding: "5px 12px",
                          }}
                          onClick={action.fn}
                          disabled={
                            products.length === 0 &&
                            movements.length === 0
                          }
                        >
                          {action.label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                background: "#08120E",
                border: "1px solid #0D3D26",
                borderLeft:
                  "3px solid #00C896",
                borderRadius: 5,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#4B5A6B",
                }}
              >
                Los archivos Excel incluyen
                múltiples hojas: RESUMEN con KPIs,
                datos detallados, valoración y
                alertas críticas.
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom:
                  "1px solid #111820",
                flexShrink: 0,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{
                  display: "none",
                }}
                onChange={handleFile}
              />

              <button
                className="btn-primary"
                onClick={() =>
                  fileRef.current?.click()
                }
              >
                Seleccionar archivo Excel
              </button>

              {fileName && (
                <span
                  style={{
                    fontSize: 12,
                    color: "#00C896",
                    fontFamily:
                      "JetBrains Mono",
                  }}
                >
                  {fileName} — {sheets.length}{" "}
                  hoja
                  {sheets.length !== 1
                    ? "s"
                    : ""}
                </span>
              )}

              {sheet && !importResult && (
                <button
                  className="btn-secondary"
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                  }}
                  onClick={doImport}
                  disabled={importing}
                >
                  {importing
                    ? "Importando..."
                    : `Importar hoja "${sheet.name}" al catálogo`}
                </button>
              )}
            </div>

            {importResult && (
              <div
                style={{
                  padding: "10px 24px",
                  flexShrink: 0,
                  background: "#08120E",
                  borderBottom:
                    "1px solid #111820",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#00C896",
                    }}
                  >
                    ✓ Importación completada:
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      color: "#34D399",
                      fontFamily:
                        "JetBrains Mono",
                    }}
                  >
                    {importResult.created} creados
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      color: "#38BDF8",
                      fontFamily:
                        "JetBrains Mono",
                    }}
                  >
                    {importResult.updated}{" "}
                    actualizados
                  </span>

                  {importResult.errors > 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#F87171",
                        fontFamily:
                          "JetBrains Mono",
                      }}
                    >
                      {importResult.errors} errores
                    </span>
                  )}

                  <button
                    className="btn-secondary"
                    style={{
                      fontSize: 11,
                      marginLeft: "auto",
                    }}
                    onClick={() =>
                      setImportResult(null)
                    }
                  >
                    Nueva importación
                  </button>
                </div>
              </div>
            )}

            {sheets.length > 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 180,
                    borderRight:
                      "1px solid #111820",
                    overflowY: "auto",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      padding:
                        "10px 12px 6px",
                      fontSize: 9.5,
                      color: "#2D4050",
                      fontFamily: "Outfit",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    HOJAS ({sheets.length})
                  </div>

                  {sheets.map(
                    (item, index) => (
                      <button
                        key={item.name}
                        onClick={() =>
                          setActiveSheet(index)
                        }
                        style={{
                          width: "100%",
                          background:
                            activeSheet ===
                            index
                              ? "rgba(0,200,150,0.08)"
                              : "none",
                          border: "none",
                          borderLeft:
                            activeSheet ===
                            index
                              ? "2px solid #00C896"
                              : "2px solid transparent",
                          padding: "8px 12px",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: "Outfit",
                            fontWeight: 600,
                            color:
                              activeSheet ===
                              index
                                ? "#00C896"
                                : "#94A3B8",
                            whiteSpace:
                              "nowrap",
                            overflow: "hidden",
                            textOverflow:
                              "ellipsis",
                          }}
                        >
                          {item.name}
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            color: "#4B5A6B",
                            fontFamily:
                              "JetBrains Mono",
                          }}
                        >
                          {item.rows.length} filas ·{" "}
                          {
                            item.headers.filter(
                              Boolean
                            ).length
                          }{" "}
                          cols
                        </div>
                      </button>
                    )
                  )}
                </div>

                {sheet && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 16px",
                        borderBottom:
                          "1px solid #111820",
                        flexShrink: 0,
                        display: "flex",
                        gap: 20,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "Outfit",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#E2E8F0",
                        }}
                      >
                        {sheet.name}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#4B5A6B",
                          fontFamily:
                            "JetBrains Mono",
                        }}
                      >
                        {sheet.rows.length} filas ·{" "}
                        {
                          sheet.headers.filter(
                            Boolean
                          ).length
                        }{" "}
                        columnas
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          marginLeft: "auto",
                          flexWrap: "wrap",
                        }}
                      >
                        {sheet.headers
                          .filter(Boolean)
                          .map(
                            (header) => (
                              <span
                                key={header}
                                style={{
                                  fontSize: 9.5,
                                  padding:
                                    "2px 7px",
                                  background:
                                    "#0A1218",
                                  border:
                                    "1px solid #1A2232",
                                  borderRadius: 3,
                                  color:
                                    "#60A5FA",
                                  fontFamily:
                                    "JetBrains Mono",
                                }}
                              >
                                {header.slice(
                                  0,
                                  24
                                )}
                              </span>
                            )
                          )}
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        overflowX: "auto",
                        overflowY: "auto",
                      }}
                    >
                      <table
                        style={{
                          width: "max-content",
                          minWidth: "100%",
                          borderCollapse:
                            "collapse",
                        }}
                      >
                        <thead
                          style={{
                            position: "sticky",
                            top: 0,
                            background:
                              "#0A0F16",
                            zIndex: 2,
                          }}
                        >
                          <tr>
                            <th
                              style={{
                                padding:
                                  "8px 10px",
                                fontSize: 9.5,
                                fontFamily:
                                  "JetBrains Mono",
                                color:
                                  "#2D4050",
                                borderBottom:
                                  "1px solid #1A2232",
                                textAlign:
                                  "left",
                                minWidth: 36,
                              }}
                            >
                              #
                            </th>

                            {sheet.headers.map(
                              (
                                header,
                                index
                              ) => (
                                <th
                                  key={index}
                                  style={{
                                    padding:
                                      "8px 12px",
                                    fontSize: 10,
                                    fontFamily:
                                      "Outfit",
                                    fontWeight: 700,
                                    color:
                                      "#4B5A6B",
                                    borderBottom:
                                      "1px solid #1A2232",
                                    textAlign:
                                      "left",
                                    whiteSpace:
                                      "nowrap",
                                    letterSpacing:
                                      "0.05em",
                                    textTransform:
                                      "uppercase",
                                    minWidth: 110,
                                  }}
                                >
                                  {header ||
                                    `Col ${
                                      index + 1
                                    }`}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {sheet.rows.map(
                            (
                              row,
                              rowIndex
                            ) => (
                              <tr
                                key={rowIndex}
                                style={{
                                  background:
                                    rowIndex %
                                      2 ===
                                    0
                                      ? "transparent"
                                      : "#09111A",
                                }}
                              >
                                <td
                                  style={{
                                    padding:
                                      "7px 10px",
                                    fontSize: 10,
                                    color:
                                      "#2D4050",
                                    borderBottom:
                                      "1px solid #0D1520",
                                    fontFamily:
                                      "JetBrains Mono",
                                    textAlign:
                                      "right",
                                  }}
                                >
                                  {rowIndex + 1}
                                </td>

                                {sheet.headers.map(
                                  (
                                    _,
                                    columnIndex
                                  ) => {
                                    const value =
                                      row[
                                        columnIndex
                                      ] || "";

                                    const isDate =
                                      /^\d{4}-\d{2}-\d{2}$/.test(
                                        value
                                      );

                                    const isNumber =
                                      !isDate &&
                                      value !== "" &&
                                      !isNaN(
                                        Number(value)
                                      );

                                    const isLot =
                                      /^(LOT|LOTE|KTF|SFB|GQ|GK|LT|[A-Z]{1,4}\d)/i.test(
                                        value
                                      ) &&
                                      value.length > 3;

                                    return (
                                      <td
                                        key={
                                          columnIndex
                                        }
                                        style={{
                                          padding:
                                            "7px 12px",
                                          fontSize:
                                            11.5,
                                          borderBottom:
                                            "1px solid #0D1520",
                                          fontFamily:
                                            isNumber ||
                                            isDate
                                              ? "JetBrains Mono"
                                              : "Inter, sans-serif",
                                          color:
                                            isDate
                                              ? "#00C896"
                                              : isLot
                                                ? "#A78BFA"
                                                : isNumber
                                                  ? "#94A3B8"
                                                  : "#D1D9E2",
                                          whiteSpace:
                                            "nowrap",
                                          maxWidth:
                                            220,
                                          overflow:
                                            "hidden",
                                          textOverflow:
                                            "ellipsis",
                                        }}
                                      >
                                        {value}
                                      </td>
                                    );
                                  }
                                )}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sheets.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    background: "#0A1218",
                    border:
                      "2px dashed #1A2232",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    color: "#2D4050",
                  }}
                >
                  ⇅
                </div>

                <div
                  style={{
                    fontFamily: "Outfit",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#4B5A6B",
                  }}
                >
                  Selecciona un archivo Excel
                  (.xlsx)
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#2D4050",
                    textAlign: "center",
                    maxWidth: 340,
                  }}
                >
                  El sistema detecta
                  automáticamente todas las hojas,
                  columnas y tipos de datos.
                  Compatible con cualquier
                  estructura de Excel.
                </div>

                <button
                  className="btn-secondary"
                  style={{
                    fontSize: 12,
                  }}
                  onClick={() =>
                    fileRef.current?.click()
                  }
                >
                  Explorar archivos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}