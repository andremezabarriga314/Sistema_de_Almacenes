// Análisis del Excel importado para el inventario (productos, lotes, movimientos).
// Archivo independiente: no depende de excelKardex.ts ni de ImportedSheetView.tsx.
import type { ImportedExcelSheet } from "../store/AppContext";

const normText = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

type KardexType = "Todos" | "Entrada" | "Salida";

const filled = (row: string[]) =>
  row.filter((c) => String(c ?? "").trim() !== "").length;

const looksNumeric = (value: string) =>
  value.trim() !== "" && !Number.isNaN(Number(value.trim().replace(",", ".")));

const toNumber = (value: string | undefined): number => {
  const n = parseFloat(
    String(value ?? "").replace(/[^0-9.,-]/g, "").replace(",", "."),
  );
  return Number.isFinite(n) ? Math.abs(n) : 0;
};

type SheetRow = { row: string[]; n: number };

type SheetAnalysis = {
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

function analyzeSheet(sheet: ImportedExcelSheet): SheetAnalysis {
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

function filterSheetRows(
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

function sheetTotals(analysis: SheetAnalysis, rows: SheetRow[]) {
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
function displayHeaders(
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



type Rec = Record<string, string>;

// Las hojas de salidas (KARDEX SALI, despachos...) repiten cada lote como salida.
// false = el stock del inventario se calcula con las hojas de ingresos y las
//         salidas de esas hojas solo se muestran como dato.
// true  = además se descuentan las salidas de esas hojas (el stock queda en 0).
export const DISCOUNT_EXIT_SHEETS = false;

export type KardexLot = {
  lote: string;
  remaining: number;
  produccion: string;
  vencimiento: string;
  estado: string;
  proveedor: string;
  // Fecha de vencimiento tal como viene en el Excel, aunque no sea confiable (igual o anterior a la producción).
  vencimientoCrudo?: string;
};

export type KardexProduct = {
  codigo: string;
  nombre: string;
  marca: string;
  presentacion: string;
  proveedor: string;
  gramos: number;
  gramosText: string;
  stock: number;
  stockText: string;
  ingresos: number;
  salidas: number;
  lots: KardexLot[];
  ultimo: string;
};

export type ExcelLotRow = KardexLot & {
  producto: string;
  marca: string;
  presentacion: string;
};

type Entry = {
  fecha: string;
  produccion: string;
  vencimiento: string;
  lote: string;
  ingreso: number;
  salida: number;
  saldo: number | null;
  saldoText: string;
  stockActual: number | null;
  stockText: string;
  estado: string;
  presentacion: string;
  producto: string;
  marca: string;
  proveedor: string;
  codigo: string;
  gramos: number;
  gramosText: string;
  referencia: string;
  observaciones: string;
  synthetic: boolean;
  sheet: number;
  outSheet: boolean;
  vencimientoCrudo: string;
};

// Gramos a partir de textos como "Lata 170 g", "Bolsa 1 kg" o "500 gr".
export function parseGrams(text: string): number {
  const match = /(\d+(?:[.,]\d+)?)\s*(kg|kilos?|gr|g|gramos?)\b/i.exec(
    text || ""
  );

  if (!match) return 0;

  const value = parseFloat(match[1].replace(",", "."));
  return match[2].toLowerCase().startsWith("k") ? value * 1000 : value;
}

const hasNumber = (value: string) => /\d/.test(value);

// Fecha comparable AAAA-MM-DD a partir de "2026-10-14" o "14/10/2026".
export const dateKey = (text: string): string => {
  const value = String(text ?? "").trim();

  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(value);

  if (match) {
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  }

  match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(value);

  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }

  return "";
};

function findColumns(headers: string[]) {
  const find = (words: string[], exclude: string[] = []) =>
    headers.findIndex((header) => {
      const text = normText(String(header ?? ""));
      return (
        words.some((word) => text.includes(normText(word))) &&
        !exclude.some((word) => text.includes(normText(word)))
      );
    });

  return {
    fecha: find(
      ["fecha"],
      [
        "produccion",
        "elaboracion",
        "fabricacion",
        "f. prod",
        "vencimiento",
        "vence",
        "venc",
        "caducidad",
        "expira",
        "recepcion",
      ]
    ),
    produccion: find([
      "produccion",
      "elaboracion",
      "fabricacion",
      "f. prod",
      "fecha prod",
    ]),
    vencimiento: find([
      "vencimiento",
      "vence",
      "venc",
      "caducidad",
      "expira",
    ]),
    lote: find(["lote"], ["id lote", "estado", "dias"]),
    saldo: find(["saldo"]),
    stockActual: find(["stock actual", "stock"], ["estado"]),
    estado: find(["estado"], ["stock"]),
    presentacion: find(["presentacion", "prsentacion", "presentac", "empaque", "envase"]),
    producto: find(
      ["producto", "alimento", "nombre", "descripcion", "articulo"],
      ["proveedor", "razon social", "empresa", "supplier", "fabricante", "distribuid"]
    ),
    marca: find(["marca"]),

    // Reconoce distintos nombres habituales de la columna del proveedor.
    proveedor: find([
      "proveedor",
      "prov.",
      "supplier",
      "supplier name",
      "vendor",
      "distribuidor",
      "abastecedor",
      "razon social",
      "empresa proveedora",
      "empresa",
    ]),

    codigo: find(["codigo", "sku"]),
    gramos: find(["gramos", "gramaje"], ["peso", "total"]),
    tipo: find(["tipo", "movimiento"], ["ultimo", "id movimiento"]),
    cantidad: find(["cantidad", "qty"], ["disponible"]),
    qtyDisp: find(["disponible"]),
    referencia: find(["referencia"]),
    observaciones: find([
      "observacion",
      "obs.",
      "nota",
      "detalle",
      "comentario",
    ]),
  };
}

// Tipo de hoja: kárdex, movimientos o lotes.
export function detectSheetKind(
  sheet: ImportedExcelSheet
): "kardex" | "movements" | "lots" | null {
  const analysis = analyzeSheet(sheet);

  if (analysis.headerRow < 0) return null;

  const columns = findColumns(analysis.headerCells);

  if (analysis.ingresoCol >= 0 || analysis.salidaCol >= 0) {
    return "kardex";
  }

  if (
    columns.tipo >= 0 &&
    columns.cantidad >= 0 &&
    columns.producto >= 0
  ) {
    return "movements";
  }

  if (
    columns.qtyDisp >= 0 &&
    columns.lote >= 0 &&
    columns.producto >= 0
  ) {
    return "lots";
  }

  return null;
}

// Valor de una etiqueta del encabezado superior (banner), p. ej. "Proveedor: ACME".
// Acepta "Etiqueta: valor" y también la etiqueta y el valor en celdas contiguas.
function bannerValue(bannerText: string, label: string): string {
  const match = new RegExp(`${label}\\s*[:\\-·]\\s*([^·|]+)`, "i").exec(
    bannerText
  );
  const value = match?.[1]?.trim() || "";

  // Si lo capturado es otra etiqueta, no es un valor.
  return /^(marca|producto|presentaci.n|proveedor|fecha|lote|c.digo)\b/i.test(
    value
  )
    ? ""
    : value;
}

function entriesFromSheet(sheet: ImportedExcelSheet): Entry[] | null {
  const analysis = analyzeSheet(sheet);

  if (analysis.headerRow < 0) return null;

  const columns = findColumns(analysis.headerCells);

  // Algunas hojas dejan sin texto el encabezado de Proveedor y de las fechas
  // (celdas combinadas) y el rótulo está en la fila de arriba. Si no se
  // encontraron por nombre, se usan esas columnas.
  const filledHeaders = displayHeaders(
    analysis.headerCells,
    analysis.rows,
    analysis.banner[analysis.banner.length - 1]
  );
  const filledIndex = (word: string) =>
    filledHeaders.findIndex(
      (h, i) =>
        !String(analysis.headerCells[i] ?? "").trim() &&
        normText(h).includes(word)
    );

  if (columns.proveedor < 0) columns.proveedor = filledIndex("proveedor");
  if (columns.producto < 0) columns.producto = filledIndex("producto");
  if (columns.produccion < 0) columns.produccion = filledIndex("produccion");

  const isKardex =
    analysis.ingresoCol >= 0 || analysis.salidaCol >= 0;

  const isMovement =
    !isKardex &&
    columns.tipo >= 0 &&
    columns.cantidad >= 0 &&
    columns.producto >= 0;

  // Cantidad de una lista de lotes: "disponible", o "cantidad" en una lista de recepción
  // (la que trae proveedor, p. ej. LISTADO).
  const qtyCol =
    columns.qtyDisp >= 0
      ? columns.qtyDisp
      : columns.proveedor >= 0
        ? columns.cantidad
        : -1;

  const isLots =
    !isKardex &&
    !isMovement &&
    qtyCol >= 0 &&
    columns.lote >= 0 &&
    columns.producto >= 0;

  if (!isKardex && !isMovement && !isLots) return null;

  const saldoIndex =
    columns.saldo >= 0
      ? columns.saldo
      : isKardex
        ? columns.stockActual
        : -1;

  const stockIndex =
    isKardex && columns.saldo < 0
      ? -1
      : columns.stockActual;

  const bannerText = analysis.banner
    .map((row) => row.filter(Boolean).join(" · "))
    .join(" | ");

  const bannerProduct =
    /producto\s*[:\-]\s*([^·|]+)/i.exec(bannerText)?.[1]?.trim() || "";

  const bannerBrand =
    /marca\s*[:\-]\s*([^·|]+)/i.exec(bannerText)?.[1]?.trim() || "";

  const bannerPresentation = bannerValue(bannerText, "presentaci.n");
  const bannerSupplier = bannerValue(bannerText, "proveedor");

  const fallbackName = bannerProduct || sheet.name;

  const cell = (row: string[], index: number) => {
    const text = index >= 0 ? String(row[index] ?? "").trim() : "";
    return /^#(REF|VALUE|N\/A|DIV\/0|NAME|NUM|NULL)/i.test(text) ? "" : text;
  };

  const numberOrNull = (text: string) =>
    text !== "" && hasNumber(text) ? toNumber(text) : null;

  const entries: Entry[] = [];

  analysis.rows.forEach(({ row }) => {
    let ingreso = 0;
    let salida = 0;

    if (isKardex) {
      ingreso =
        analysis.ingresoCol >= 0
          ? toNumber(row[analysis.ingresoCol])
          : 0;

      salida =
        analysis.salidaCol >= 0
          ? toNumber(row[analysis.salidaCol])
          : 0;
    } else if (isMovement) {
      const type = normText(cell(row, columns.tipo));
      const quantity = toNumber(row[columns.cantidad]);

      if (/ingres|entrad/.test(type)) {
        ingreso = quantity;
      } else if (/salid|egres/.test(type)) {
        salida = quantity;
      }
    } else {
      ingreso = toNumber(row[qtyCol]);
    }

    const fecha = cell(row, columns.fecha);
    const lote = cell(row, columns.lote);
    const producto = cell(row, columns.producto);

    if (
      !fecha &&
      !lote &&
      !producto &&
      ingreso === 0 &&
      salida === 0
    ) {
      return;
    }

    // En una lista de lotes, una fila sin un nombre de producto real o sin cantidad no es un lote.
    if (isLots && (!producto.trim() || /^[\d.,\s]+$/.test(producto.trim()) || ingreso <= 0)) return;

    const saldoText = cell(row, saldoIndex);
    const stockText = cell(row, stockIndex);

    entries.push({
      fecha,
      produccion: cell(row, columns.produccion),
      vencimiento: cell(row, columns.vencimiento),
      lote,
      ingreso,
      salida,
      saldo: numberOrNull(saldoText),
      saldoText,
      stockActual: numberOrNull(stockText),
      stockText,
      estado: cell(row, columns.estado),
      presentacion:
        cell(row, columns.presentacion) || bannerPresentation,
      producto: producto || fallbackName,
      marca: cell(row, columns.marca) || bannerBrand,
      proveedor: cell(row, columns.proveedor) || bannerSupplier,
      codigo: cell(row, columns.codigo),
      gramos:
        columns.gramos >= 0 ? toNumber(row[columns.gramos]) : 0,
      gramosText: cell(row, columns.gramos),
      referencia: cell(row, columns.referencia),
      observaciones: cell(row, columns.observaciones),
      synthetic: isLots,
      sheet: 0,
      outSheet: false,
      vencimientoCrudo: "",
    });
  });

  return entries.length ? entries : null;
}

function summarize(entries: Entry[]): KardexProduct[] {
  const groups = new Map<string, Entry[]>();

  entries.forEach((entry) => {
    const key = normText(entry.producto);
    groups.set(key, [...(groups.get(key) || []), entry]);
  });

  const first = (list: Entry[], pick: (entry: Entry) => string) =>
    list.map(pick).find((value) => value.trim() !== "") || "";

  return [...groups.values()].map((all) => {
    // Los movimientos reales (kárdex) mandan. De las listas de lotes solo se toman los lotes que
    // el kárdex no trae, y una sola vez por lote (aunque estén repetidos en varias hojas).
    const real = all.filter((entry) => !entry.synthetic);
    const realLots = new Set(
      real
        .filter((entry) => !entry.outSheet || DISCOUNT_EXIT_SHEETS)
        .map((entry) => normText(entry.lote))
    );
    const seenListLots = new Set<string>();
    const listOnly = all.filter((entry) => {
      if (!entry.synthetic) return false;
      const key = normText(entry.lote);
      if (realLots.has(key) || seenListLots.has(key)) return false;
      seenListLots.add(key);
      return true;
    });
    const list = [...real, ...listOnly];

    const ordered = list.every((entry) => dateKey(entry.fecha))
      ? [...list].sort((a, b) => {
          const dateA = dateKey(a.fecha);
          const dateB = dateKey(b.fecha);
          return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
        })
      : list;

    const reversed = [...ordered].reverse();

    // Proveedor de respaldo del producto para lotes sin proveedor propio.
    // También se aprovecha lo que digan las demás hojas (p. ej. la de lotes).
    const fallbackSupplier =
      first(list, (entry) => entry.proveedor) ||
      first(all, (entry) => entry.proveedor);

    const fallbackPresentation =
      first(list, (entry) => entry.presentacion) ||
      first(all, (entry) => entry.presentacion);

    // ¿Se cuentan también las hojas de salidas? Solo si se pidió, o si el producto
    // aparece únicamente en una hoja de salidas.
    const countAll =
      DISCOUNT_EXIT_SHEETS || list.every((entry) => entry.outSheet);
    const counted = (entry: Entry) => countAll || !entry.outSheet;

    const lotMap = new Map<string, KardexLot>();

    ordered.forEach((entry) => {
      const name = entry.lote || "Sin lote";

      const current = lotMap.get(name) || {
        lote: name,
        remaining: 0,
        produccion: "",
        vencimiento: "",
        estado: "",
        proveedor: "",
        vencimientoCrudo: "",
      };

      if (counted(entry)) current.remaining += entry.ingreso - entry.salida;
      current.produccion ||= entry.produccion;
      current.vencimiento ||= entry.vencimiento;
      current.vencimientoCrudo ||= entry.vencimientoCrudo;
      current.proveedor ||= entry.proveedor;
      current.estado = entry.estado || current.estado;

      lotMap.set(name, current);
    });

    const lots = [...lotMap.values()].map((lot) => ({
      ...lot,
      proveedor: lot.proveedor.trim() || fallbackSupplier || "",
    }));

    const lastStock = reversed.find(
      (entry) => entry.stockActual !== null
    );

    // Stock real: lo que queda en cada lote (ingresos menos salidas), sin negativos.
    const lotStock = lots.reduce(
      (sum, lot) => sum + Math.max(0, lot.remaining),
      0
    );

    const stock = lastStock ? lastStock.stockActual! : lotStock;
    const stockText = lastStock ? lastStock.stockText : String(lotStock);

    return {
      codigo: first(list, (entry) => entry.codigo),
      nombre: list[0].producto,
      marca: first(list, (entry) => entry.marca),
      presentacion: fallbackPresentation,
      proveedor: fallbackSupplier,
      gramos: list.map((entry) => entry.gramos).find((g) => g > 0) || 0,
      gramosText: first(list, (entry) => entry.gramosText),
      stock: Math.max(0, stock),
      stockText,
      ingresos: list
        .filter(counted)
        .reduce((sum, entry) => sum + entry.ingreso, 0),
      salidas: list
        .filter((entry) => entry.outSheet || countAll)
        .reduce((sum, entry) => sum + entry.salida, 0),
      lots,
      ultimo: reversed.find((entry) => entry.fecha)?.fecha || "",
    };
  });
}

// Proveedor y presentación por producto + lote, tomados de cualquier hoja que
// los traiga (LISTADO, BPAL 1, ...). Sirve para completar el Kárdex, que no
// tiene columna de proveedor.
function buildSupplierLookup(sheets: ImportedExcelSheet[]) {
  const byLot = new Map<
    string,
    { proveedor: string; presentacion: string; produccion: string; vencimiento: string }
  >();
  const byProduct = new Map<string, string>();
  const brandByProduct = new Map<string, string>();

  sheets.forEach((sheet) => {
    const analysis = analyzeSheet(sheet);
    if (analysis.headerRow < 0) return;

    const headers = displayHeaders(
      analysis.headerCells,
      analysis.rows,
      analysis.banner[analysis.banner.length - 1]
    );
    const columns = findColumns(headers);

    if (columns.proveedor < 0 || columns.producto < 0) return;

    analysis.rows.forEach(({ row }) => {
      const producto = normText(row[columns.producto]);
      const proveedor = String(row[columns.proveedor] ?? "").trim();
      if (!producto || !proveedor || /^[\d.,\s]+$/.test(proveedor)) return;

      const presentacion =
        columns.presentacion >= 0
          ? String(row[columns.presentacion] ?? "").trim()
          : "";

      if (columns.lote >= 0) {
        const key = `${producto}|${normText(row[columns.lote])}`;
        const produccion =
          columns.produccion >= 0 ? String(row[columns.produccion] ?? "").trim() : "";
        const vencimiento =
          columns.vencimiento >= 0 ? String(row[columns.vencimiento] ?? "").trim() : "";

        if (!byLot.has(key)) {
          byLot.set(key, { proveedor, presentacion, produccion, vencimiento });
        }
      }
      if (!byProduct.has(producto)) byProduct.set(producto, proveedor);

      const marca = columns.marca >= 0 ? String(row[columns.marca] ?? "").trim() : "";
      if (marca && !/^[\d.,\s]+$/.test(marca) && !brandByProduct.has(producto)) {
        brandByProduct.set(producto, marca);
      }
    });
  });

  return { byLot, byProduct, brandByProduct };
}

// Analiza las hojas importadas y evita contar dos veces movimientos repetidos.
export function analyzeWorkbook(sheets: ImportedExcelSheet[]) {
  const handled = sheets.map(() => false);
  const entries: Entry[] = [];
  const owner = new Map<string, number>();

  sheets.forEach((sheet, index) => {
    const found = entriesFromSheet(sheet);

    if (!found) return;

    handled[index] = true;

    found.forEach((entry) => {
      entry.sheet = index;
      entry.outSheet = /\b(sali|egres|despach)/.test(normText(sheet.name));
      const key = [
        normText(entry.codigo || entry.producto),
        entry.fecha,
        entry.lote,
        entry.ingreso,
        entry.salida,
        entry.referencia,
        entry.saldo ?? "",
      ].join("|");

      const firstSheet = owner.get(key);

      if (firstSheet !== undefined && firstSheet !== index) return;

      owner.set(key, index);
      entries.push(entry);
    });
  });

  // Una hoja de salidas suele repetir el ingreso de cada lote. Ese ingreso se cuenta
  // una sola vez: queda en la fila que no tiene salida (la de entradas).
  const ingresoGroups = new Map<string, Entry[]>();
  entries.forEach((entry) => {
    if (entry.synthetic || entry.ingreso <= 0) return;
    const key = [
      normText(entry.producto),
      normText(entry.lote),
      dateKey(entry.fecha),
      entry.ingreso,
    ].join("|");
    ingresoGroups.set(key, [...(ingresoGroups.get(key) || []), entry]);
  });
  ingresoGroups.forEach((group) => {
    if (group.length < 2) return;
    const keeper = group.reduce((a, b) => (b.salida < a.salida ? b : a));
    group.forEach((entry) => {
      if (entry !== keeper && entry.sheet !== keeper.sheet) entry.ingreso = 0;
    });
  });

  // Completa proveedor y presentación vacíos con lo que digan las demás hojas.
  const lookup = buildSupplierLookup(sheets);
  entries.forEach((entry) => {
    const producto = normText(entry.producto);
    const found = lookup.byLot.get(`${producto}|${normText(entry.lote)}`);

    if (!entry.proveedor) {
      entry.proveedor = found?.proveedor || lookup.byProduct.get(producto) || "";
    }
    if (!entry.presentacion && found?.presentacion) {
      entry.presentacion = found.presentacion;
    }
  });

  // Fechas de cada lote. Un vencimiento no puede ser igual o anterior a la producción
  // (suele ser un error de captura: se repitió la fecha de producción). En ese caso se usa la
  // fecha de la lista de recepción; si tampoco sirve, el vencimiento queda sin dato.
  entries.forEach((entry) => {
    const found = lookup.byLot.get(`${normText(entry.producto)}|${normText(entry.lote)}`);

    // La producción que falta (por ejemplo #REF!) se completa con la de la lista de recepción.
    if (!dateKey(entry.produccion) && found && dateKey(found.produccion)) {
      entry.produccion = found.produccion;
    }

    // Se guarda la fecha original: si no se puede confiar en ella, al menos se puede mostrar para revisarla.
    entry.vencimientoCrudo = (found && found.vencimiento) || entry.vencimiento;

    const production = dateKey(entry.produccion);
    const isValidExpiry = (value: string) => {
      const expiry = dateKey(value);
      return expiry !== "" && (production === "" || expiry > production);
    };

    // La lista de recepción manda cuando su vencimiento es válido.
    if (found && found.vencimiento && isValidExpiry(found.vencimiento)) {
      entry.vencimiento = found.vencimiento;
    } else if (!isValidExpiry(entry.vencimiento)) {
      entry.vencimiento = "";
    }

    // Algunos lotes llevan sus fechas escritas en el propio número (p. ej. "...FP:15.05.2026FV:15.05.2030").
    const fromLot = (tag: string) => {
      const match = new RegExp(`${tag}[:\\s]*(\\d{1,2})[./-](\\d{1,2})[./-](\\d{4})`, "i").exec(
        entry.lote
      );
      return match ? `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[3]}` : "";
    };

    if (!dateKey(entry.produccion)) entry.produccion = fromLot("FP") || entry.produccion;

    const productionNow = dateKey(entry.produccion);
    const lotExpiry = fromLot("FV");
    if (
      !dateKey(entry.vencimiento) &&
      lotExpiry &&
      (productionNow === "" || dateKey(lotExpiry) > productionNow)
    ) {
      entry.vencimiento = lotExpiry;
    }
  });

  const products = summarize(entries);

  // Marca que falta en el kárdex: se toma de la lista de recepción.
  products.forEach((product) => {
    if (!product.marca) {
      product.marca = lookup.brandByProduct.get(normText(product.nombre)) || "";
    }
  });

  const productByName = new Map(
    products.map((product) => [normText(product.nombre), product])
  );

  const lots: ExcelLotRow[] = products.flatMap((product) =>
    product.lots
      .filter((lot) => lot.lote !== "Sin lote")
      .map((lot) => ({
        ...lot,
        producto: product.nombre,
        marca: product.marca,
        presentacion: product.presentacion,
      }))
  );

  const movements: Rec[] = [];

  entries.forEach((entry, index) => {
    if (entry.synthetic) return;

    const product = productByName.get(normText(entry.producto));
    const grams = entry.gramos || product?.gramos || 0;

    const push = (tipo: "Entrada" | "Salida", quantity: number) => {
      movements.push({
        _key: `mov${index}-${tipo}`,
        _tipo: tipo,
        tipo,
        fecha: entry.fecha,
        nombre: entry.producto,
        marca: entry.marca || product?.marca || "",
        lote: entry.lote,
        produccion: entry.produccion,
        vencimiento: entry.vencimiento,
        proveedor: entry.proveedor || product?.proveedor || "",
        cantidad: String(quantity),
        peso: grams
          ? `${(quantity * grams).toLocaleString("es-PE")} g`
          : "",
        saldo: entry.saldoText,
        presentacion: entry.presentacion || product?.presentacion || "",
        observaciones: entry.observaciones,
      });
    };

    if (entry.ingreso > 0) push("Entrada", entry.ingreso);
    if (entry.salida > 0) push("Salida", entry.salida);
  });

  return { products, movements, lots, handled };
}

// Convierte el valor de una celda de Excel en número ("1,234.5", "0.030", "12 unid.", 450...).
// Devuelve NaN si no hay ningún número.
export function parseExcelNumber(value: unknown): number {
  if (typeof value === "number") return value;

  let text = String(value ?? "").trim();
  if (!text) return NaN;

  text = text.replace(/[^\d.,\-]/g, "");
  if (!/\d/.test(text)) return NaN;

  const hasDot = text.includes(".");
  const hasComma = text.includes(",");

  if (hasDot && hasComma) {
    // El último separador es el decimal; el otro es de miles.
    const decimal = text.lastIndexOf(".") > text.lastIndexOf(",") ? "." : ",";
    const thousands = decimal === "." ? "," : ".";
    text = text.split(thousands).join("").replace(decimal, ".");
  } else if (hasComma) {
    // "1,234" o "1,234,567" son miles; "0,5" o "12,50" son decimales.
    text = /^-?\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, "") : text.replace(",", ".");
  }
  // Con solo puntos se toma como decimal ("0.030" = 0,03), igual que en tus hojas.

  const number = parseFloat(text);
  return Number.isFinite(number) ? number : NaN;
}