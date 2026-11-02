import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import {
  analyzeWorkbook,
  getMergedCellValue,
} from "../lib/excelKardex";
import {
  ImportedSheetTable,
  analyzeSheet,
  displayHeaders,
  filterSheetRows,
  normText,
} from "./ImportedSheetView";

// Hojas que no deben mostrarse.
const HIDDEN_SHEETS = ["alkathymar"];

const isVisibleSheet = (sheet: any) =>
  !sheet?.hiddenFromLots &&
  !HIDDEN_SHEETS.includes(
    String(sheet?.name ?? "")
      .trim()
      .toLowerCase(),
  );

// Columnas que debe mostrar la sección Lotes, en este orden.
const TARGETS: {
  label: string;
  exact: string[];
  contains: string[];
  not?: string[];
}[] = [
  {
    label: "ID Lote",
    exact: ["id lote", "id de lote", "idlote", "id"],
    contains: ["id lote"],
  },
  {
    label: "Num. Lote",
    exact: [
      "num lote",
      "numero lote",
      "numero de lote",
      "n lote",
      "nro lote",
      "no lote",
      "lote",
    ],
    contains: [
      "num lote",
      "numero de lote",
      "numero lote",
      "nro lote",
      "lote",
    ],
    not: [
      "id ",
      "fecha",
      "estado",
      "dias",
      "vencimiento",
      "produccion",
    ],
  },
  {
    label: "Código",
    exact: ["codigo", "cod", "sku", "codigo producto"],
    contains: ["codigo"],
  },
  {
    label: "Alimento",
    exact: ["alimento", "producto", "descripcion", "nombre"],
    contains: ["alimento", "producto", "descripcion"],
  },
  {
    label: "Presentación",
    exact: ["presentacion"],
    contains: ["presentacion"],
  },
  {
    label: "Proveedor",
    exact: ["proveedor"],
    contains: ["proveedor"],
  },
  {
    label: "Vencimiento",
    exact: [
      "vencimiento",
      "fecha de vencimiento",
      "fecha vencimiento",
      "vence",
    ],
    contains: ["vencimiento"],
    not: ["dias", "estado"],
  },
  {
    label: "Días Restantes",
    exact: ["dias restantes", "dias"],
    contains: [
      "dias rest",
      "dias para",
      "dias por",
      "dias de vida",
      "dias venc",
    ],
  },
  {
    label: "Unidades",
    exact: ["unidades", "unidad", "cantidad", "stock", "saldo"],
    contains: ["unidades", "cantidad"],
  },
  {
    label: "Recibido",
    exact: [
      "recibido",
      "fecha recibido",
      "recepcion",
      "fecha de recepcion",
      "fecha recepcion",
      "ingreso",
    ],
    contains: ["recibido", "recepcion"],
  },
  {
    label: "Fecha de Producción",
    exact: [
      "fecha de produccion",
      "fecha produccion",
      "produccion",
      "f produccion",
      "fecha de elaboracion",
      "elaboracion",
    ],
    contains: ["produccion", "elaboracion"],
  },
  {
    label: "Estado",
    exact: ["estado"],
    contains: ["estado"],
  },
];

const clean = (value: unknown) =>
  normText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Convierte un texto de fecha (dd/mm/aaaa o aaaa-mm-dd) en Date.
function parseDate(value: unknown): Date | null {
  const t = String(value ?? "").trim();

  const make = (y: number, m: number, d: number) => {
    const date = new Date(y, m - 1, d);

    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    )
      ? date
      : null;
  };

  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(t);

  if (match) {
    return make(
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
    );
  }

  match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(t);

  if (match) {
    let year = Number(match[3]);

    if (year < 100) {
      year += 2000;
    }

    return make(
      year,
      Number(match[2]),
      Number(match[1]),
    );
  }

  return null;
}

// Días que faltan para el vencimiento.
function daysLeftLabel(expiry: unknown): string {
  const date = parseDate(expiry);

  if (!date) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.floor(
    (date.getTime() - today.getTime()) / 86400000,
  );

  return days < 0 ? "VENCIDO" : `${days}d`;
}

type Match = {
  index: number;
  label: string;
};

// Busca las columnas del Excel que corresponden a las columnas solicitadas.
function matchColumns(headers: string[]) {
  const cleaned = headers.map(clean);
  const used = new Set<number>();

  const found: Match[] = [];

  let expiryIndex = -1;
  let daysIndex = -1;

  for (const target of TARGETS) {
    let index = cleaned.findIndex(
      (header, i) =>
        !used.has(i) && target.exact.includes(header),
    );

    if (index < 0) {
      index = cleaned.findIndex(
        (header, i) =>
          !used.has(i) &&
          header !== "" &&
          target.contains.some((word) => header.includes(word)) &&
          !(target.not ?? []).some((word) => header.includes(word)),
      );
    }

    if (index >= 0) {
      used.add(index);

      found.push({
        index,
        label: target.label,
      });

      if (target.label === "Vencimiento") {
        expiryIndex = index;
      }

      if (target.label === "Días Restantes") {
        daysIndex = index;
      }
    } else if (
      target.label === "Días Restantes" &&
      expiryIndex >= 0
    ) {
      daysIndex = headers.length;

      found.push({
        index: daysIndex,
        label: target.label,
      });
    } else if (target.label === "Proveedor") {
      found.push({
        index: headers.length + 1,
        label: target.label,
      });
    } else if (target.label === "Presentación") {
      found.push({
        index: headers.length + 2,
        label: target.label,
      });
    }
  }

  return {
    found,
    expiryIndex,
    computedDays:
      daysIndex === headers.length ? daysIndex : -1,
  };
}

export default function ExcelLotsPanel() {
  const {
    importedExcelFileName,
    importedExcelSheets,
    products,
    suppliers,
    lots,
  } = useApp();

  const [search, setSearch] = useState("");

  // Conserva las hojas que contienen una tabla reconocible de lotes.
  const picked = useMemo(() => {
    const matchesBySheet: {
      sheet: any;
      analysis: ReturnType<typeof analyzeSheet>;
      matches: Match[];
      expiryIndex: number;
      computedDays: number;
      real: number;
    }[] = [];

    for (const sheet of importedExcelSheets.filter(isVisibleSheet)) {
      const analysis = analyzeSheet(sheet);

      if (analysis.headerRow < 0) continue;

      const headers = displayHeaders(
        analysis.headerCells,
        analysis.rows,
        analysis.banner[analysis.banner.length - 1],
      );

      const {
        found: matches,
        expiryIndex,
        computedDays,
      } = matchColumns(headers);

      // Columnas que realmente existen en la hoja.
      const real = matches.filter(
        (match) => match.index < headers.length,
      ).length;

      const hasLot = matches.some(
        (match) => match.label === "Num. Lote",
      );

      const hasProduct = matches.some(
        (match) =>
          match.label === "Alimento" ||
          match.label === "Código",
      );

      const hasLotData = matches.some((match) =>
        [
          "Vencimiento",
          "Unidades",
          "Fecha de Producción",
        ].includes(match.label),
      );

      if (hasLot && hasProduct && hasLotData) {
        matchesBySheet.push({
          sheet,
          analysis,
          matches,
          expiryIndex,
          computedDays,
          real,
        });
      }
    }

    return matchesBySheet;
  }, [importedExcelSheets]);

  // Datos de apoyo del Excel importado.
  const workbook = useMemo(
    () => analyzeWorkbook(importedExcelSheets),
    [importedExcelSheets],
  );

  // Completa proveedor, presentación y días restantes.
  const lotSheetViews = useMemo(
    () => {
      const seenWorkbookLots = new Set<string>();

      return picked.map((sheetInfo) => {
        const sheetRows = filterSheetRows(
          sheetInfo.analysis,
          search,
          "Todos",
        );

        const col = (label: string) =>
          sheetInfo.matches.find(
            (match) => match.label === label,
          )?.index ?? -1;

        const iName = col("Alimento");
        const iLote = col("Num. Lote");
        const iCode = col("Código");
        const iProv = col("Proveedor");
        const iPres = col("Presentación");

        const supplierName = (id?: string) => {
          const value = String(id ?? "").trim();

          if (!value) return "";

          const found: any = suppliers.find(
            (supplier: any) =>
              String(supplier.id).trim() === value,
          );

          return String(
            found?.name ?? found?.nombre ?? "",
          ).trim();
        };

        const rows = sheetRows.flatMap(({ row, n }) => {
          const extended: string[] = [...row];
          const rowIndex = n - 1;

          // Recupera también los valores de las celdas combinadas.
          sheetInfo.matches.forEach(({ index }) => {
            extended[index] = String(
              getMergedCellValue(
                sheetInfo.sheet,
                rowIndex,
                index,
                extended[index],
              ) ?? "",
            );
          });

          const name = normText(
            iName >= 0 ? extended[iName] : "",
          );

          const lote = normText(
            iLote >= 0 ? extended[iLote] : "",
          );

          const code = String(
            iCode >= 0 ? extended[iCode] ?? "" : "",
          ).trim();

          const productKey = clean(code) || clean(name);
          const lotKey = clean(lote);

          const uniqueKey =
            productKey && lotKey
              ? `${productKey}|${lotKey}`
              : "";

          if (
            uniqueKey &&
            seenWorkbookLots.has(uniqueKey)
          ) {
            return [];
          }

          if (uniqueKey) {
            seenWorkbookLots.add(uniqueKey);
          }

          const wbProduct = code
            ? workbook.products.find(
                (product) =>
                  normText(product.codigo) === normText(code),
              )
            : workbook.products.find(
                (product) =>
                  normText(product.nombre) === name,
              );

          const wbLot = lote
            ? workbook.lots.find(
                (lot) =>
                  normText(lot.lote) === lote &&
                  (
                    code
                      ? normText(lot.codigo) === normText(code)
                      : !name || normText(lot.producto) === name
                  ),
              )
            : undefined;

          const exactSkuMatches = code
            ? products.filter(
                (product) =>
                  normText(product.sku) === normText(code),
              )
            : [];

          const exactNameMatches = name
            ? products.filter(
                (product) =>
                  normText(product.name) === name,
              )
            : [];

          const sysProduct =
            exactSkuMatches.length === 1
              ? exactSkuMatches[0]
              : exactSkuMatches.length === 0 &&
                  exactNameMatches.length === 1
                ? exactNameMatches[0]
                : undefined;

          const sysLot = lote
            ? lots.find(
                (lot) =>
                  normText(lot.lotNumber) === lote &&
                  (
                    !sysProduct ||
                    lot.productId === sysProduct.id
                  ),
              )
            : undefined;

          // Completa presentación cuando el Excel no tiene el dato.
          if (
            iPres >= 0 &&
            !String(extended[iPres] ?? "").trim()
          ) {
            extended[iPres] =
              wbLot?.presentacion ||
              wbProduct?.presentacion ||
              String(sysProduct?.presentation ?? "").trim();
          }

          // Completa proveedor cuando el Excel no tiene el dato.
          if (
            iProv >= 0 &&
            !String(extended[iProv] ?? "").trim()
          ) {
            extended[iProv] =
              wbLot?.proveedor ||
              supplierName(sysLot?.supplierId) ||
              wbProduct?.proveedor ||
              supplierName(sysProduct?.supplierId);
          }

          // Calcula los días restantes si no existen en el Excel.
          if (sheetInfo.computedDays >= 0) {
            extended[sheetInfo.computedDays] =
              daysLeftLabel(
                sheetInfo.expiryIndex >= 0
                  ? extended[sheetInfo.expiryIndex]
                  : "",
              );
          }

          return [
            {
              row: extended,
              n,
            },
          ];
        });

        return {
          ...sheetInfo,
          rows,
        };
      });
    },
    [
      picked,
      search,
      workbook,
      products,
      suppliers,
      lots,
    ],
  );

  // Si ninguna hoja coincide con el formato de lotes,
  // mostrar la primera hoja con encabezados reconocibles.
  const fallback = useMemo(() => {
    for (const sheet of importedExcelSheets.filter(isVisibleSheet)) {
      const analysis = analyzeSheet(sheet);

      if (analysis.headerRow < 0) continue;

      const headers = displayHeaders(
        analysis.headerCells,
        analysis.rows,
        analysis.banner[analysis.banner.length - 1],
      );

      return {
        sheet,
        analysis,
        matches: headers.map((header, index) => ({
          index,
          label: String(
            header || `Columna ${index + 1}`,
          ),
        })),
        expiryIndex: -1,
        computedDays: -1,
        real: headers.length,
      };
    }

    return null;
  }, [importedExcelSheets]);

  const display = picked.length === 0 ? fallback : null;

  if (picked.length === 0 && !display) {
    if (importedExcelSheets.length === 0) return null;

    return (
      <div
        className="wms-card"
        style={{
          margin: 24,
          padding: 20,
        }}
      >
        <div
          style={{
            color: "#E2E8F0",
            fontWeight: 700,
          }}
        >
          Excel importado
        </div>

        <div
          style={{
            color: "#8295A8",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          Archivo: {importedExcelFileName || "Excel importado"}
        </div>

        <div
          style={{
            color: "#FBBF24",
            fontSize: 12,
            marginTop: 12,
          }}
        >
          No se detectaron encabezados en las hojas.
          Revisa el archivo en la sección Productos,
          en la opción Excel importado.
        </div>
      </div>
    );
  }

  const visibleRows = picked.length
    ? lotSheetViews.reduce(
        (sum, sheet) => sum + sheet.rows.length,
        0,
      )
    : filterSheetRows(
        display!.analysis,
        search,
        "Todos",
      ).length;

  return (
    <div
      className="wms-card"
      style={{
        margin: 24,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1B2935",
          background: "#0B141D",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#E2E8F0",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "Outfit",
              }}
            >
              Lotes del Excel importado
            </div>

            <div
              style={{
                color: "#8295A8",
                fontSize: 11,
                marginTop: 5,
              }}
            >
              Archivo: {importedExcelFileName || "Excel importado"}
            </div>
          </div>

          <div
            style={{
              padding: "7px 11px",
              border: "1px solid #21483B",
              borderRadius: 7,
              background: "#0D261F",
              color: "#6EE7B7",
              fontSize: 11,
              whiteSpace: "nowrap",
            }}
          >
            {visibleRows} filas visibles
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid #1B2935",
          background: "#0B141D",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar en los datos importados..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 13px",
            border: "1px solid #263746",
            borderRadius: 7,
            outline: "none",
            background: "#070D12",
            color: "#E2E8F0",
            fontSize: 12,
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxHeight: 480,
          overflow: "auto",
        }}
      >
        {picked.length ? (
          lotSheetViews.map((sheetInfo, index) => {
            const columns = sheetInfo.matches.map(
              (match) => match.index,
            );

            const labels: Record<number, string> = {};

            sheetInfo.matches.forEach((match) => {
              labels[match.index] = match.label;
            });

            return (
              <section
                key={`${sheetInfo.sheet.name}-${index}`}
              >
                <div
                  style={{
                    padding: "10px 16px",
                    color: "#8295A8",
                    fontSize: 11,
                    background: "#0B141D",
                  }}
                >
                  Hoja: {sheetInfo.sheet.name} ·{" "}
                  {sheetInfo.rows.length} lotes
                </div>

                <ImportedSheetTable
                  analysis={sheetInfo.analysis}
                  rows={sheetInfo.rows}
                  columns={columns}
                  labels={labels}
                />
              </section>
            );
          })
        ) : display ? (
          <ImportedSheetTable
            analysis={display.analysis}
            rows={filterSheetRows(
              display.analysis,
              search,
              "Todos",
            )}
            columns={display.matches.map(
              (match) => match.index,
            )}
            labels={Object.fromEntries(
              display.matches.map((match) => [
                match.index,
                match.label,
              ]),
            )}
          />
        ) : null}
      </div>
    </div>
  );
}