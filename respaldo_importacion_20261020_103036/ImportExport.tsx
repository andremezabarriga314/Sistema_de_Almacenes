
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
// @ts-ignore — el paquete no incluye declaraciones de TypeScript
import xlsxPreview from "xlsx-preview";
import { useApp } from "../src/store/AppContext";
import {
  exportProductControlExcel,
  exportMovementsExcel,
  exportSuppliersExcel,
  exportLotsExcel,
} from "../src/lib/exportExcel";
import {
  exportProductsPDF,
  exportMovementsPDF,
  exportSuppliersPDF,
  exportLotsPDF,
} from "../src/lib/exportPDF";

// ── Lectura de celdas para conservar sus valores originales ──
const SSF = XLSX.SSF as unknown as {
  format: (fmt: string, value: unknown) => string;
  is_date: (fmt: string) => boolean;
};

const LOCALE_DATE_FORMATS = [
  "m/d/yy",
  "mm-dd-yy",
  "m/d/yyyy",
  "mm/dd/yy",
  "mm/dd/yyyy",
  "d-mmm-yy",
  "dd-mmm-yy",
];

type CellInfo = {
  shown: string;
  clean: string;
  value: string | number;
  format: string | null;
};

function readCell(
  cellObj: XLSX.CellObject | undefined
): CellInfo {
  if (
    !cellObj ||
    cellObj.v === undefined ||
    cellObj.v === null
  ) {
    return {
      shown: "",
      clean: "",
      value: "",
      format: null,
    };
  }

  const z =
    typeof cellObj.z === "string"
      ? cellObj.z
      : undefined;

  if (
    cellObj.t === "n" &&
    typeof cellObj.v === "number"
  ) {
    if (z && SSF.is_date(z)) {
      const localeDependent =
        LOCALE_DATE_FORMATS.includes(z);

      return {
        shown: localeDependent
          ? SSF.format("dd/mm/yyyy", cellObj.v)
          : cellObj.w ?? SSF.format(z, cellObj.v),
        clean: SSF.format("yyyy-mm-dd", cellObj.v),
        value: cellObj.v,
        format: localeDependent ? "dd/mm/yyyy" : z,
      };
    }

    return {
      shown: cellObj.w ?? String(cellObj.v),
      clean: String(cellObj.v),
      value: cellObj.v,
      format: z && z !== "General" ? z : null,
    };
  }

  if (cellObj.t === "b") {
    const text = cellObj.v ? "VERDADERO" : "FALSO";

    return {
      shown: text,
      clean: text,
      value: text,
      format: null,
    };
  }

  const text = String(cellObj.w ?? cellObj.v);

  return {
    shown: text,
    clean: text.replace(/^\t+|\t+$/g, "").trim(),
    value: String(cellObj.v),
    format: null,
  };
}

type SheetData = {
  headers: string[];
  rows: string[][];
  name: string;
  previewRows: string[][];
  columnCount: number;
  values: (string | number)[][];
  merges: {
    s: { r: number; c: number };
    e: { r: number; c: number };
  }[];
  colWidths: (number | null)[];
  numFmts: [number, number, string][];
};

type ExportAction = {
  label: string;
  fn: () => void;
};

type ExportCard = {
  label: string;
  desc: string;
  icon: string;
  color: string;
  actions: ExportAction[];
};

function columnName(index: number): string {
  let result = "";
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;

    result =
      String.fromCharCode(65 + remainder) + result;

    value = Math.floor((value - 1) / 26);
  }

  return result;
}

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
    saveImportedExcelSheets,
  } = useApp();

  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"import" | "export">(
    "import"
  );

  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string[]>(
    []
  );
  const [activeSheet, setActiveSheet] = useState(0);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: number;
  } | null>(null);

  // ── Seleccionar y leer Excel ──
  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setImportResult(null);
    setSheets([]);
    setPreviewHtml([]);
    setActiveSheet(0);

    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Leer datos para conservar el funcionamiento
      // de la importación al catálogo.
      const wb = XLSX.read(data, {
        type: "array",
        cellNF: true,
        cellStyles: true,
      });

      // Crear la vista con los estilos que pueda interpretar
      // el renderizador de Excel.
      let renderedSheets: string[] = [];

      if (/\.xlsx$/i.test(file.name)) {
        const rendered = await xlsxPreview.xlsx2Html(
          file,
          {
            output: "string",
            separateSheets: true,
            minimumRows: 0,
            minimumCols: 0,
          }
        );

        renderedSheets = Array.isArray(rendered)
          ? rendered.map((html) => String(html))
          : [String(rendered)];
      }

      const parsed: SheetData[] = wb.SheetNames.map(
        (name) => {
          const ws = wb.Sheets[name];

          const range = ws["!ref"]
            ? XLSX.utils.decode_range(ws["!ref"])
            : null;

          // Leer desde A1 sin desplazar las celdas.
          const rowCount = range
            ? range.e.r + 1
            : 0;

          const columnCount = range
            ? range.e.c + 1
            : 1;

          const previewRows: string[][] = [];
          const clean: string[][] = [];
          const values: (string | number)[][] = [];

          const numFmts: [number, number, string][] = [];

          for (let r = 0; r < rowCount; r++) {
            const shownRow: string[] = [];
            const cleanRow: string[] = [];
            const valueRow: (string | number)[] = [];

            for (let c = 0; c < columnCount; c++) {
              const cell =
                ws[
                  XLSX.utils.encode_cell({ r, c })
                ] as XLSX.CellObject | undefined;

              const info = readCell(cell);

              shownRow.push(info.shown);
              cleanRow.push(info.clean);
              valueRow.push(info.value);

              if (info.format) {
                numFmts.push([
                  r,
                  c,
                  info.format,
                ]);
              }
            }

            previewRows.push(shownRow);
            clean.push(cleanRow);
            values.push(valueRow);
          }

          // Detectar encabezados únicamente para importar.
          // Esto no modifica la vista original del Excel.
          const filled = (row: string[]) =>
            row.filter((cell) => cell.trim() !== "")
              .length;

          let hRow = 0;

          for (
            let i = 0;
            i < Math.min(clean.length, 10);
            i++
          ) {
            if (filled(clean[i]) >= 3) {
              hRow = i;
              break;
            }
          }

          const headers = clean[hRow] || [];

          const rows = clean
            .slice(hRow + 1)
            .filter((row) => filled(row) > 0);

          const merges = (
            (ws["!merges"] as
              | XLSX.Range[]
              | undefined) || []
          )
            .map((m) => ({
              s: {
                r: m.s.r,
                c: m.s.c,
              },
              e: {
                r: m.e.r,
                c: m.e.c,
              },
            }))
            .filter(
              (m) =>
                m.e.r < rowCount &&
                m.e.c < columnCount
            );

          const wsCols =
            (ws["!cols"] as
              | XLSX.ColInfo[]
              | undefined) || [];

          const colWidths = Array.from(
            { length: columnCount },
            (_, i) => {
              const col = wsCols[i];

              return (
                col?.wch ??
                (col?.wpx
                  ? Math.round(col.wpx / 7)
                  : null)
              );
            }
          );

          return {
            name,
            headers,
            rows,
            previewRows,
            columnCount,
            values,
            merges,
            colWidths,
            numFmts,
          };
        }
      );

      setSheets(parsed);
      setPreviewHtml(renderedSheets);
      setActiveSheet(0);

      // Guardar los datos importados sin modificar el
      // archivo binario original.
      saveImportedExcelSheets(
        file.name,
        parsed.map((sh) => ({
          name: sh.name,
          headers: Array.from(
            { length: sh.columnCount },
            (_, i) => columnName(i)
          ),
          rows: sh.previewRows,
          values: sh.values,
          merges: sh.merges,
          colWidths: sh.colWidths,
          numFmts: sh.numFmts,
        })),
        buffer
      );
    } catch (error) {
      console.error(
        "Error al leer o visualizar el Excel:",
        error
      );

      setSheets([]);
      setPreviewHtml([]);

      window.alert(
        "No se pudo procesar el archivo. Comprueba que sea un Excel válido."
      );
    } finally {
      // Permite seleccionar nuevamente el mismo archivo.
      e.target.value = "";
    }
  };

  // ── Importar datos al catálogo ──
  const doImport = () => {
    const currentSheet = sheets[activeSheet];

    if (!currentSheet) return;

    setImporting(true);

    let created = 0;
    let updated = 0;
    let errors = 0;

    const h = currentSheet.headers.map((x) =>
      x.toLowerCase()
    );

    const get = (
      row: string[],
      ...keys: string[]
    ) => {
      for (const k of keys) {
        const idx = h.findIndex((c) =>
          c.includes(k)
        );

        if (idx >= 0 && row[idx]) {
          return row[idx];
        }
      }

      return "";
    };

    currentSheet.rows.forEach((row) => {
      try {
        const sku = get(
          row,
          "sku",
          "codigo",
          "code",
          "cód"
        );

        const name = get(
          row,
          "nombre",
          "name",
          "alimento",
          "producto",
          "descripcion"
        );

        if (!sku && !name) return;

        const existing = products.find(
          (p) => p.sku === sku || p.name === name
        );

        const qty =
          parseInt(
            get(
              row,
              "stock",
              "cantidad",
              "qty",
              "saldo"
            )
          ) || 0;

        const lotNumber = get(row, "lote", "lot");

        const productionDate = get(
          row,
          "produccion",
          "producción",
          "fabricacion",
          "fabricación"
        );

        const expiryDate = get(
          row,
          "vencimiento",
          "vence",
          "expiry",
          "caducidad"
        );

        const hasLot =
          qty > 0 &&
          !!lotNumber &&
          !!productionDate &&
          !!expiryDate;

        const base = {
          sku:
            sku ||
            name
              .slice(0, 12)
              .toUpperCase()
              .replace(/\s+/g, "-"),

          name: name || sku,

          brand:
            get(row, "marca", "brand") || "",

          presentation:
            get(
              row,
              "presentacion",
              "presentación",
              "empaque"
            ) || "",

          gramsPerUnit:
            parseFloat(
              get(row, "gramos", "gramaje", "peso")
            ) || undefined,

          costPrice:
            parseFloat(
              get(
                row,
                "costo",
                "cost",
                "precio costo",
                "unitcost"
              )
            ) || 0,

          salePrice:
            parseFloat(
              get(
                row,
                "venta",
                "sale",
                "precio venta"
              )
            ) || 0,

          unit: "Unidad",

          location:
            get(row, "ubicacion", "location") || "",

          supplierId: "",

          status: (
            get(row, "estado", "status") || "Activo"
          ) as "Activo" | "Inactivo",

          storageTemp:
            get(
              row,
              "temperatura",
              "temp",
              "almac"
            ) || "Ambiente (15–25 °C)",
        };

        if (existing) {
          // No modificar el stock mediante una importación.
          updateProduct(existing.id, base);
          updated++;
        } else if (hasLot) {
          addProduct(
            {
              ...base,
              stock: qty,
            },
            {
              lotNumber,
              productionDate,
              expiryDate,
              qty,
            }
          );

          created++;
        } else {
          addProduct({
            ...base,
            stock: 0,
          });

          created++;
        }
      } catch (error) {
        console.error(
          "Error al importar una fila:",
          error
        );

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

  // ── Opciones de exportación originales ──
  const exportCards: ExportCard[] = [
    {
      label: "Control de productos",
      desc: "Inventario, historial, ingresos y salidas por lote",
      icon: "⊞",
      color: "#00C896",
      actions: [
        {
          label: "Todo",
          fn: () =>
            exportProductControlExcel(
              products,
              movements,
              lots,
              suppliers
            ),
        },
        {
          label: "Ingresos",
          fn: () =>
            exportProductControlExcel(
              products,
              movements,
              lots,
              suppliers,
              "Entrada"
            ),
        },
        {
          label: "Salidas",
          fn: () =>
            exportProductControlExcel(
              products,
              movements,
              lots,
              suppliers,
              "Salida"
            ),
        },
        {
          label: "PDF",
          fn: () =>
            exportProductsPDF(products, suppliers),
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
              "Movimientos",
              suppliers
            ),
        },
        {
          label: "PDF",
          fn: () =>
            exportMovementsPDF(
              movements,
              suppliers,
              "Movimientos",
              products
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
          fn: () => exportLotsExcel(lots, suppliers),
        },
        {
          label: "PDF",
          fn: () => exportLotsPDF(lots),
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
          fn: () => exportSuppliersExcel(suppliers),
        },
        {
          label: "PDF",
          fn: () => exportSuppliersPDF(suppliers),
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
      {/* Encabezado */}
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
              ⚡ Cargar datos de ejemplo (CALLERÍA 5 2026)
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {(["import", "export"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 20px",
                fontSize: 13,
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                color:
                  tab === t ? "#00C896" : "#4B5A6B",
                borderBottom:
                  tab === t
                    ? "2px solid #00C896"
                    : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t === "import"
                ? "Importar Excel"
                : "Exportar Reportes"}
            </button>
          ))}
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
          /* ── EXPORTAR ── */
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
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14,
              }}
            >
              {exportCards.map((card) => (
                <div
                  key={card.label}
                  className="wms-card"
                  style={{ padding: 18 }}
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
                        background: card.color + "1A",
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
                    {card.actions.map((action) => (
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
                    ))}
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
                borderLeft: "3px solid #00C896",
                borderRadius: 5,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#4B5A6B",
                }}
              >
                Los archivos Excel incluyen múltiples hojas:
                RESUMEN con KPIs, datos detallados,
                valoración y alertas críticas.
              </span>
            </div>
          </div>
        ) : (
          /* ── IMPORTAR ── */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Selección del archivo */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #111820",
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
                style={{ display: "none" }}
                onChange={handleFile}
              />

              <button
                className="btn-primary"
                onClick={() => fileRef.current?.click()}
              >
                Seleccionar archivo Excel
              </button>

              {fileName && (
                <span
                  style={{
                    fontSize: 12,
                    color: "#00C896",
                    fontFamily: "JetBrains Mono",
                  }}
                >
                  {fileName} — {sheets.length} hoja
                  {sheets.length !== 1 ? "s" : ""}
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

            {/* Resultado de la importación */}
            {importResult && (
              <div
                style={{
                  padding: "10px 24px",
                  flexShrink: 0,
                  background: "#08120E",
                  borderBottom: "1px solid #111820",
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
                      fontFamily: "JetBrains Mono",
                    }}
                  >
                    {importResult.created} creados
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      color: "#38BDF8",
                      fontFamily: "JetBrains Mono",
                    }}
                  >
                    {importResult.updated} actualizados
                  </span>

                  {importResult.errors > 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#F87171",
                        fontFamily: "JetBrains Mono",
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
                    onClick={() => setImportResult(null)}
                  >
                    Nueva importación
                  </button>
                </div>
              </div>
            )}

            {/* Hojas del libro */}
            {sheets.length > 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  overflow: "hidden",
                  minHeight: 0,
                }}
              >
                {/* Selector de hojas */}
                <div
                  style={{
                    width: 180,
                    borderRight: "1px solid #111820",
                    overflowY: "auto",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px 6px",
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

                  {sheets.map((s, i) => (
                    <button
                      key={`${s.name}-${i}`}
                      onClick={() => setActiveSheet(i)}
                      style={{
                        width: "100%",
                        background:
                          activeSheet === i
                            ? "rgba(0,200,150,0.08)"
                            : "none",
                        border: "none",
                        borderLeft:
                          activeSheet === i
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
                            activeSheet === i
                              ? "#00C896"
                              : "#94A3B8",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s.name}
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          color: "#4B5A6B",
                          fontFamily: "JetBrains Mono",
                        }}
                      >
                        {s.previewRows.length} filas ·{" "}
                        {s.columnCount} cols
                      </div>
                    </button>
                  ))}
                </div>

                {/* Vista de la hoja */}
                {sheet && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid #111820",
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
                          fontFamily: "JetBrains Mono",
                        }}
                      >
                        {sheet.previewRows.length} filas ·{" "}
                        {sheet.columnCount} columnas
                      </div>
                    </div>

                    {/* No se reconstruye la tabla ni se inventan
                        encabezados. Se muestra el HTML generado
                        a partir del archivo Excel seleccionado. */}
                    <div
                      style={{
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                        background: "#FFFFFF",
                      }}
                    >
                      {previewHtml[activeSheet] ? (
                        <iframe
                          key={`${fileName}-${activeSheet}`}
                          title={`Vista de la hoja ${sheet.name}`}
                          srcDoc={previewHtml[activeSheet]}
                          sandbox=""
                          style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            border: "none",
                            background: "#FFFFFF",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            padding: 20,
                            color: "#64748B",
                            fontSize: 13,
                          }}
                        >
                          No hay una vista con formato disponible
                          para esta hoja. La importación de sus
                          datos sigue disponible.
                          <br />
                          <br />
                          La vista con estilos está habilitada
                          para archivos .xlsx.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Estado inicial */}
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
                    border: "2px dashed #1A2232",
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
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#2D4050",
                    textAlign: "center",
                    maxWidth: 340,
                  }}
                >
                  Se detectan las hojas y los datos del libro.
                  La vista de formato utiliza el renderizador
                  para archivos .xlsx.
                </div>

                <button
                  className="btn-secondary"
                  style={{ fontSize: 12 }}
                  onClick={() => fileRef.current?.click()}
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
