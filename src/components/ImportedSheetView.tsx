import type { ImportedExcelSheet } from "../store/AppContext";

export type KardexType = "Todos" | "Entrada" | "Salida";

export const normText = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const filled = (row: string[]) =>
  row.filter((c) => String(c ?? "").trim() !== "").length;

const looksNumeric = (value: string) =>
  value.trim() !== "" && !Number.isNaN(Number(value.trim().replace(",", ".")));

export const toNumber = (value: string | undefined): number => {
  const n = parseFloat(
    String(value ?? "").replace(/[^0-9.,-]/g, "").replace(",", "."),
  );
  return Number.isFinite(n) ? Math.abs(n) : 0;
};

export type SheetRow = { row: string[]; n: number };

export type SheetAnalysis = {
  width: number;
  headerRow: number;
  headerCells: string[];
  banner: string[][];
  rows: SheetRow[];
  ingresoCol: number;
  salidaCol: number;
  tipoCol: number;
  cantidadCol: number;
};

export function analyzeSheet(sheet: ImportedExcelSheet): SheetAnalysis {
  const grid = sheet.rows;
  const width = grid.reduce(
    (max, r) => Math.max(max, r.length),
    Math.max(1, sheet.headers.length),
  );
  const counts = grid.map(filled);
  let headerRow = -1;
  const scan = Math.min(grid.length, 30);
  const maxCount = counts.slice(0, scan).reduce((m, n) => Math.max(m, n), 0);

  if (maxCount >= 3) {
    for (let i = 0; i < scan; i++) {
      const textCells = grid[i].filter(
        (v) => String(v ?? "").trim() !== "" && !looksNumeric(String(v)),
      ).length;
      if (
        counts[i] >= Math.max(3, Math.ceil(maxCount * 0.6)) &&
        textCells >= Math.ceil(counts[i] * 0.7)
      ) {
        headerRow = i;
        break;
      }
    }
  }

  const headerCells = Array.from({ length: width }, (_, i) =>
    headerRow >= 0 ? String(grid[headerRow][i] ?? "") : sheet.headers[i] ?? "",
  );
  const banner =
    headerRow > 0 ? grid.slice(0, headerRow).filter((r) => filled(r) > 0) : [];
  const start = headerRow >= 0 ? headerRow + 1 : 0;
  let end = grid.length;
  while (end > start && counts[end - 1] === 0) end--;
  const rows = grid.slice(start, end).map((row, i) => ({
    row: Array.from({ length: width }, (_, c) => String(row[c] ?? "")),
    n: start + i + 1,
  }));

  const findColumn = (words: string[]) =>
    headerCells.findIndex((h) => {
      const text = normText(h);
      return words.some((w) => text.includes(w)) && !text.includes("fecha");
    });
  const findAny = (words: string[], exclude: string[] = []) =>
    headerCells.findIndex((h) => {
      const text = normText(h);
      return (
        words.some((w) => text.includes(w)) &&
        !exclude.some((x) => text.includes(x))
      );
    });

  return {
    width,
    headerRow,
    headerCells,
    banner,
    rows,
    ingresoCol: findColumn(["ingreso", "entrada"]),
    salidaCol: findColumn(["salida", "egreso", "despacho"]),
    tipoCol: findAny(["tipo", "movimiento"], ["ultimo", "id movimiento"]),
    cantidadCol: findAny(["cantidad", "qty"], ["disponible"]),
  };
}

export function filterSheetRows(
  analysis: SheetAnalysis,
  search: string,
  type: KardexType,
): SheetRow[] {
  const term = normText(search);
  return analysis.rows.filter(({ row }) => {
    if (term && !row.some((c) => normText(c).includes(term))) return false;
    if (type === "Entrada") {
      if (analysis.ingresoCol >= 0) return toNumber(row[analysis.ingresoCol]) > 0;
      if (analysis.tipoCol >= 0)
        return /ingres|entrad/.test(normText(row[analysis.tipoCol]));
    }
    if (type === "Salida") {
      if (analysis.salidaCol >= 0) return toNumber(row[analysis.salidaCol]) > 0;
      if (analysis.tipoCol >= 0)
        return /salid|egres/.test(normText(row[analysis.tipoCol]));
    }
    return true;
  });
}

export function sheetTotals(analysis: SheetAnalysis, rows: SheetRow[]) {
  if (
    analysis.ingresoCol < 0 &&
    analysis.salidaCol < 0 &&
    analysis.tipoCol >= 0 &&
    analysis.cantidadCol >= 0
  ) {
    const sum = (pattern: RegExp) =>
      rows
        .filter(({ row }) => pattern.test(normText(row[analysis.tipoCol])))
        .reduce(
          (total, { row }) => total + toNumber(row[analysis.cantidadCol]),
          0,
        );
    return { ingresos: sum(/ingres|entrad/), salidas: sum(/salid|egres/) };
  }
  return {
    ingresos:
      analysis.ingresoCol >= 0
        ? rows.reduce((sum, { row }) => sum + toNumber(row[analysis.ingresoCol]), 0)
        : 0,
    salidas:
      analysis.salidaCol >= 0
        ? rows.reduce((sum, { row }) => sum + toNumber(row[analysis.salidaCol]), 0)
        : 0,
  };
}

const isDateValue = (value: string) =>
  /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(value.trim());

// Completa encabezados que el Excel dejó vacíos por celdas combinadas.
// 1) Primero usa el rótulo que está justo arriba en la misma columna
//    (p. ej. PROVEEDOR / FECHA DE RECEPCION sobre la fila de encabezados).
// 2) Solo si falta, deduce Proveedor y fechas por el contenido de la columna.
export function displayHeaders(
  headerCells: string[],
  rows: SheetRow[],
  above: string[] = [],
) {
  const headers = headerCells.map((h) => String(h ?? "").trim());

  headers.forEach((h, i) => {
    const label = String(above[i] ?? "").trim();
    if (!h && label && label.length <= 40) headers[i] = label;
  });

  const has = (word: string) =>
    headers.some((h) => normText(h).includes(word));

  const empty = headers.map((h, index) => ({ h, index })).filter((x) => !x.h);
  if (empty.length) {
    const samples = empty.map(({ index }) => ({
      index,
      values: rows
        .slice(0, 20)
        .map(({ row }) => String(row[index] ?? "").trim())
        .filter(Boolean),
    }));
    const dateColumns = samples.filter(
      ({ values }) =>
        values.length > 0 &&
        values.filter(isDateValue).length / values.length >= 0.7,
    );
    const nonDateColumns = samples.filter(
      ({ values }) =>
        values.length > 0 &&
        values.filter((v) => !isDateValue(v)).length / values.length >= 0.7,
    );
    if (nonDateColumns[0] && !has("proveedor")) {
      headers[nonDateColumns[0].index] = "Proveedor";
    }
    if (dateColumns[0] && !has("recepcion")) {
      headers[dateColumns[0].index] = "Fecha de recepción";
    }
    if (dateColumns[1] && !has("produccion")) {
      headers[dateColumns[1].index] = "Fecha de producción";
    }
  }
  return headers;
}

// La tabla muestra los datos de las celdas; se omite el banner superior combinado.
export function ImportedSheetTable({
  analysis,
  rows,
  columns,
  labels,
  selectable = false,
  selectedRows = [],
  onToggleRow,
  onToggleAll,
}: {
  analysis: SheetAnalysis;
  rows: SheetRow[];
  // Muestra una casilla en cada fila (n = número de fila del Excel) para poder seleccionarlas.
  selectable?: boolean;
  selectedRows?: number[];
  onToggleRow?: (rowNumber: number) => void;
  onToggleAll?: () => void;
  // Índices de las columnas originales a mostrar, en el orden deseado.
  columns?: number[];
  // Título a mostrar por índice de columna (si no se indica, se usa el del Excel).
  labels?: Record<number, string>;
}) {
  const { ingresoCol, salidaCol } = analysis;
  const headerCells = displayHeaders(
    analysis.headerCells,
    rows,
    analysis.banner[analysis.banner.length - 1],
  );
  // Sin 'columns' se respeta el orden original del Excel.
  const columnOrder = columns ?? headerCells.map((_, i) => i);

  const allSelected =
    rows.length > 0 && rows.every(({ n }) => selectedRows.includes(n));

  return (
    <div>
      <table
        style={{
          width: "max-content",
          minWidth: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
          <tr>
            {selectable && (
              <th
                style={{
                  padding: "9px 10px",
                  background: "#1A5C40",
                  borderBottom: "1px solid #0D3D26",
                  textAlign: "center",
                  width: 34,
                }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={rows.length === 0}
                  onChange={() => onToggleAll?.()}
                  aria-label="Seleccionar todas las filas visibles"
                />
              </th>
            )}
            <th
              style={{
                padding: "9px 10px",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
                color: "#9FE3C8",
                background: "#1A5C40",
                borderBottom: "1px solid #0D3D26",
                textAlign: "right",
                minWidth: 36,
              }}
            >
              #
            </th>
            {columnOrder.map((ci) => (
              <th
                key={ci}
                style={{
                  padding: "9px 12px",
                  fontSize: 11,
                  fontFamily: "Outfit",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  background: "#1A5C40",
                  borderBottom: "1px solid #0D3D26",
                  borderRight: "1px solid #0D3D26",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  minWidth: 90,
                }}
              >
                {labels?.[ci] ?? (headerCells[ci] || " ")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map(({ row, n }, ri) => (
            <tr
              key={n}
              style={{
                background: selectedRows.includes(n)
                  ? "rgba(239,68,68,0.10)"
                  : ri % 2 === 0
                    ? "#0A1218"
                    : "#070D12",
              }}
            >
              {selectable && (
                <td
                  style={{
                    padding: "7px 10px",
                    borderBottom: "1px solid #111820",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(n)}
                    onChange={() => onToggleRow?.(n)}
                    aria-label={`Seleccionar fila ${n}`}
                  />
                </td>
              )}
              <td
                style={{
                  padding: "7px 10px",
                  fontSize: 10,
                  color: "#2D4050",
                  borderBottom: "1px solid #111820",
                  fontFamily: "JetBrains Mono",
                  textAlign: "right",
                }}
              >
                {n}
              </td>

              {columnOrder.map((ci) => {
                const value = row[ci] ?? "";
                const isDate = isDateValue(value);
                const isNum = !isDate && looksNumeric(value);
                const isIngreso = ci === ingresoCol && toNumber(value) > 0;
                const isSalida = ci === salidaCol && toNumber(value) > 0;

                return (
                  <td
                    key={ci}
                    style={{
                      padding: "7px 12px",
                      fontSize: 11.5,
                      borderBottom: "1px solid #111820",
                      borderRight: "1px solid #111820",
                      whiteSpace: "nowrap",
                      fontFamily: isNum || isDate ? "JetBrains Mono" : undefined,
                      textAlign: isNum ? "right" : isDate ? "center" : "left",
                      fontWeight: isIngreso || isSalida ? 700 : 400,
                      color: isIngreso
                        ? "#00C896"
                        : isSalida
                          ? "#F87171"
                          : isDate
                            ? "#9FB3C8"
                            : isNum
                              ? "#E2E8F0"
                              : "#D1D9E2",
                    }}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columnOrder.length + (selectable ? 2 : 1)}
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#4B5A6B",
                  fontSize: 12,
                }}
              >
                No hay filas que coincidan en esta hoja.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}