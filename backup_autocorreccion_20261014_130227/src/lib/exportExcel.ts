// eslint-disable-next-line @typescript-eslint/ban-ts-comment

// @ts-ignore

import XLS from "xlsx-js-style";

import type { Product, Movement, Supplier, Lot } from "../store/AppContext";

const fmtDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// Keep date-only strings intact. Never parse YYYY-MM-DD through UTC/ISO conversion.
const dateOnly = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return text;
};

const BRAND = "FoodStock Pro";

function downloadWorkbook(workbook: Parameters<typeof XLS.write>[0], filename: string) {

  const data = XLS.write(workbook, { bookType: "xlsx", type: "array" });

  const blob = new Blob([data], {

    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

}
// ─── Style presets ────────────────────────────────────────────────────────────
function bdr(rgb: string) {

  const b = { style: "thin" as const, color: { rgb } };

  return { top: b, bottom: b, left: b, right: b };

}

const S = {

  hdr: {

    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: "1A5C40" } },

    border: bdr("0D3D26"),

    alignment: { horizontal: "center", vertical: "center", wrapText: true },

  },

  title: {

    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13, name: "Calibri" },

    fill: { fgColor: { rgb: "0D3D26" } },

    alignment: { horizontal: "left", vertical: "center" },

  },

  meta: {

    font: { color: { rgb: "94A3B8" }, sz: 9, name: "Calibri", italic: true },

    fill: { fgColor: { rgb: "0A1810" } },

    alignment: { horizontal: "left" },

  },

  kpiLabel: {

    font: { bold: true, color: { rgb: "D1D9E2" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: "0E1A12" } },

    border: bdr("1A2232"),

    alignment: { horizontal: "left" },

  },

  kpiVal: {

    font: { bold: true, color: { rgb: "00C896" }, sz: 11, name: "Calibri" },

    fill: { fgColor: { rgb: "08120E" } },

    border: bdr("1A2232"),

    alignment: { horizontal: "right" },

  },

  kpiValStr: {

    font: { bold: false, color: { rgb: "94A3B8" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: "08120E" } },

    border: bdr("1A2232"),

    alignment: { horizontal: "right" },

  },

  even: {

    font: { color: { rgb: "D1D9E2" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: "0A1218" } },

    border: bdr("111820"),

    alignment: { horizontal: "left", vertical: "center" },

  },

  odd: {

    font: { color: { rgb: "D1D9E2" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: "070D12" } },

    border: bdr("111820"),

    alignment: { horizontal: "left", vertical: "center" },

  },

  sectionHdr: {

    font: { bold: true, color: { rgb: "00C896" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: "08120E" } },

    border: bdr("0D3D26"),

    alignment: { horizontal: "left" },

  },

  totalLabel: {

    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: "1A5C40" } },

    border: bdr("1A5C40"),

    alignment: { horizontal: "left" },

  },

  total: {

    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: "1A5C40" } },

    border: bdr("1A5C40"),

    alignment: { horizontal: "right" },

  },

};

function numStyle(isEven: boolean) {

  return {

    font: { color: { rgb: isEven ? "94A3B8" : "7A8EA8" }, sz: 10, name: "Calibri" },

    fill: { fgColor: { rgb: isEven ? "0A1218" : "070D12" } },

    border: bdr("111820"),

    alignment: { horizontal: "right" },

  };

}

function statusStyle(val: string, isEven: boolean) {

  const base = isEven ? "0A1218" : "070D12";

  if (["AGOTADO", "Vencido", "VENCIDO", "CRÍTICO", "Crítico", "Inactivo", "Salida"].includes(val))

    return { font: { bold: true, color: { rgb: "F87171" }, sz: 10, name: "Calibri" }, fill: { fgColor: { rgb: base } }, border: bdr("111820"), alignment: { horizontal: "center" } };

  if (["Por vencer", "NORMAL", "Activo"].includes(val))

    return { font: { bold: true, color: { rgb: "FBBF24" }, sz: 10, name: "Calibri" }, fill: { fgColor: { rgb: base } }, border: bdr("111820"), alignment: { horizontal: "center" } };

  if (["Vigente", "LLENO", "Entrada"].includes(val))

    return { font: { bold: true, color: { rgb: "00C896" }, sz: 10, name: "Calibri" }, fill: { fgColor: { rgb: base } }, border: bdr("111820"), alignment: { horizontal: "center" } };

  return null;

}

function cell(v: string | number | null | undefined, style: object): object {

  const val = v ?? "";

  return { v: val, t: typeof val === "number" ? "n" : "s", s: style };

}

function buildSheet(

  headers: string[],

  rows: (string | number | null | undefined)[][],

  opts?: { totalRow?: (string | number | null | undefined)[] }

) {

  const aoa: object[][] = [];

  aoa.push(headers.map((h) => cell(h, S.hdr)));

  rows.forEach((row, ri) => {

    const isEven = ri % 2 === 0;

    aoa.push(

      row.map((val) => {

        if (typeof val === "number") return cell(val, numStyle(isEven));

        if (typeof val === "string") {

          const ss = statusStyle(val, isEven);

          if (ss) return cell(val, ss);

        }

        return cell(val, isEven ? S.even : S.odd);

      })

    );

  });

  if (opts?.totalRow) {

    aoa.push(

      opts.totalRow.map((v, ci) => cell(v, ci <= 1 ? S.totalLabel : S.total))

    );

  }

  const ws = XLS.utils.aoa_to_sheet(aoa);

  (ws["!rows"] as object[]) = [{ hpt: 22 }];

  return ws;

}

function buildSummarySheet(sections: Array<{ title: string; rows: [string, string | number][] }>) {

  const aoa: object[][] = [];

  aoa.push([cell(BRAND + " — Sistema de Gestión de Alimentos", S.title), cell("", S.title), cell("", S.title)]);

  aoa.push([cell("Generado: " + fmtDate(), S.meta), cell("", S.meta), cell("", S.meta)]);

  aoa.push([cell("", S.even), cell("", S.even), cell("", S.even)]);

  sections.forEach((sec) => {

    aoa.push([cell(sec.title, S.sectionHdr), cell("", S.sectionHdr), cell("", S.sectionHdr)]);

    sec.rows.forEach(([label, val]) => {

      aoa.push([

        cell(label, S.kpiLabel),

        cell(val, typeof val === "number" ? S.kpiVal : S.kpiValStr),

        cell("", S.even),

      ]);

    });

    aoa.push([cell("", S.even), cell("", S.even), cell("", S.even)]);

  });

  const ws = XLS.utils.aoa_to_sheet(aoa);

  ws["!cols"] = [{ wch: 38 }, { wch: 22 }, { wch: 10 }];

  (ws["!rows"] as object[]) = [{ hpt: 26 }, { hpt: 16 }];

  ws["!merges"] = [

    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },

    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },

  ];

  return ws;

}

function setWidths(ws: object, widths: number[]) {

  (ws as { "!cols": object[] })["!cols"] = widths.map((w) => ({ wch: w }));

}

function buildPresentationSheet(

  title: string,

  subtitle: string,

  headers: string[],

  rows: (string | number | null | undefined)[][],

  widths: number[]

) {

  const aoa: object[][] = [

    headers.map((_, index) => cell(index === 0 ? title : "", S.title)),

    headers.map((_, index) => cell(index === 0 ? subtitle : "", S.meta)),

    headers.map(() => cell("", S.even)),

    headers.map((header) => cell(header, S.hdr)),

  ];

  rows.forEach((row, rowIndex) => {

    const isEven = rowIndex % 2 === 0;

    aoa.push(

      headers.map((_, columnIndex) => {

        const value = row[columnIndex] ?? "";

        if (typeof value === "number") return cell(value, numStyle(isEven));

        const styledStatus = typeof value === "string" ? statusStyle(value, isEven) : null;

        return cell(value, styledStatus || (isEven ? S.even : S.odd));

      })

    );

  });

  const ws = XLS.utils.aoa_to_sheet(aoa);

  ws["!merges"] = [

    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },

    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },

  ];

  ws["!autofilter"] = { ref: `A4:${XLS.utils.encode_col(headers.length - 1)}${Math.max(rows.length + 4, 4)}` };

  ws["!freeze"] = { xSplit: 0, ySplit: 4 };

  ws["!rows"] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 8 }, { hpt: 24 }];

  setWidths(ws, widths);

  return ws;

}
// ─── Product and lot control export ───────────────────────────────────────────
export function exportProductControlExcel(

  products: Product[],

  movements: Movement[],

  lots: Lot[],

  suppliers: Supplier[],

  movementType?: "Entrada" | "Salida"

) {

  const productMap = Object.fromEntries(products.map((product) => [product.id, product]));

  const supplierMap = Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name]));
// Orden cronológico: del más antiguo al más reciente (el ingreso aparece antes que la salida).
  const allMovements = [...movements]

    .reverse()

    .filter((movement) => movement.type === "Entrada" || movement.type === "Salida")

    .sort((a, b) => a.date.localeCompare(b.date));

  const entries = allMovements.filter((movement) => movement.type === "Entrada");

  const exits = allMovements.filter((movement) => movement.type === "Salida");

  const movementHeaders = [

    "Fecha",

    "Movimiento",

    "Código",

    "Nombre del producto",

    "Marca",

    "Fecha de producción",

    "Fecha de vencimiento",

    "Lote",

    "Proveedor",

    "Cantidad (unidades)",

    "Gramos por unidad",

    "Peso total (gramos)",

    "Saldo (unidades)",

    "Presentación",

    "Stock actual (unidades)",

    "Estado del lote",

    "Referencia",

    "Observaciones",

  ];

  const movementWidths = [14, 13, 14, 34, 22, 20, 20, 28, 30, 22, 18, 22, 18, 24, 22, 16, 20, 34];

  const movementRow = (movement: Movement) => {

    const product = productMap[movement.productId];

    const lot = lots.find(

      (item) =>

        item.productId === movement.productId &&

        item.lotNumber === movement.lotNumber

    );

    return [

      dateOnly(movement.date),

      movement.type,

      movement.sku,

      movement.productName,

      product?.brand || "Sin marca",

      dateOnly(movement.productionDate || lot?.productionDate) || "No registrada",

      dateOnly(movement.expiryDate || lot?.expiryDate) || "No registrada",

      movement.lotNumber || "Sin lote",

      supplierMap[movement.supplierId || lot?.supplierId || product?.supplierId || ""] || "No registrado",

      movement.qty,

      movement.gramsPerUnit || product?.gramsPerUnit || 0,

      movement.totalGrams ||

        movement.qty * (movement.gramsPerUnit || product?.gramsPerUnit || 0),

      movement.balance,

      movement.presentation || product?.presentation || product?.unit || "No registrada",

      product?.stock || 0,

      lot?.status || "Sin lote",

      movement.reference,

      movement.notes || "Normal",

    ];

  };

  const buildMovementSheet = (list: Movement[], title: string, note: string) => {

    const units = list.reduce((total, movement) => total + movement.qty, 0);

    const weight = list.reduce(

      (total, movement) =>

        total +

        (movement.totalGrams ||

          movement.qty *

            (movement.gramsPerUnit || productMap[movement.productId]?.gramsPerUnit || 0)),

      0

    );

    const generated = [

      `Generado el ${fmtDate()}`,

      `${list.length} movimientos`,

      `${units.toLocaleString("es-PE")} unidades`,

      `${weight.toLocaleString("es-PE")} gramos`,

    ].join(" · ");

    const sheet = buildPresentationSheet(

      title,

      generated,

      movementHeaders,

      list.map(movementRow),

      movementWidths

    );

    sheet["A3"] = cell(note, S.sectionHdr);

    sheet["!merges"] = [
      ...(sheet["!merges"] ?? []),
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    ];

    const rowInfo = sheet["!rows"] ?? [];
    rowInfo[2] = { hpt: 24 };
    sheet["!rows"] = rowInfo;

    return sheet;

  };
// Pestañas inferiores: TODOS, INGRESOS y SALIDAS (clic en la pestaña para ver solo ese movimiento).
  const sheets = [

    {

      name: "TODOS",

      sheet: buildMovementSheet(

        allMovements,

        "CONTROL DE INGRESOS Y SALIDAS",

        "Usa las pestañas INGRESOS y SALIDAS de abajo, o el filtro ▼ de la columna MOVIMIENTO"

      ),

    },

    {

      name: "INGRESOS",

      sheet: buildMovementSheet(entries, "PRODUCTOS — INGRESOS", "Pestaña INGRESOS: solo se muestran las entradas"),

    },

    {

      name: "SALIDAS",

      sheet: buildMovementSheet(exits, "PRODUCTOS — SALIDAS", "Pestaña SALIDAS: solo se muestran las salidas"),

    },

  ];

  const wb = XLS.utils.book_new();

  sheets.forEach(({ name, sheet }) => XLS.utils.book_append_sheet(wb, sheet, name));
// El archivo se abre en la pestaña que elegiste al exportar.
  const activeName = movementType === "Entrada" ? "INGRESOS" : movementType === "Salida" ? "SALIDAS" : "TODOS";

  const activeTab = Math.max(0, sheets.findIndex((item) => item.name === activeName));
  (wb as unknown as { Workbook: { Views: Array<{ activeTab: number }> } }).Workbook = {
    Views: [{ activeTab }],
  };

  const suffix = movementType ? `_${movementType === "Entrada" ? "Ingresos" : "Salidas"}` : "";

  downloadWorkbook(wb, `FoodStock_Productos${suffix}_${fmtDate()}.xlsx`);

}
// ─── Products Export ──────────────────────────────────────────────────────────
export function exportProductsExcel(products: Product[], suppliers: Supplier[], lots?: Lot[]) {

  const supMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const today = new Date();

  const lotMap: Record<string, number> = {};

  (lots || []).forEach((l) => {

    if (l.qty <= 0) return;

    const expiry = dateOnly(l.expiryDate);
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const d = Math.floor((Date.parse(`${expiry}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / 86400000);

    if (lotMap[l.productId] === undefined || d < lotMap[l.productId]) lotMap[l.productId] = d;

  });

  const totalValue = products.reduce((a, p) => a + p.stock * p.costPrice, 0);

  const active = products.filter((p) => p.status === "Activo").length;

  const wsRes = buildSummarySheet([

    {

      title: "INDICADORES DE INVENTARIO",

      rows: [

        ["Total de alimentos registrados", products.length],

        ["Alimentos activos", active],

        ["Valor total del inventario ($)", parseFloat(totalValue.toFixed(2))],

        ["Sin stock (agotados)", products.filter((p) => p.stock === 0).length],


        ["Lotes vencidos", products.filter((p) => (lotMap[p.id] ?? 999) < 0).length],

        ["Lotes por vencer (≤ 30 días)", products.filter((p) => { const d = lotMap[p.id]; return d !== undefined && d >= 0 && d <= 30; }).length],

      ],

    },

  ]);

  const alHeaders = [

    "SKU", "Nombre del Alimento", "Marca", "Presentación", "Gramos por unidad", "Temp. Almacenamiento",

    "Stock Actual", "Unidad",

    "Costo Unit. ($)", "Precio Venta ($)", "Margen (%)", "Valor Stock ($)",

    "Estado Stock", "Días Próx. Venc.", "Proveedor", "Estado",

  ];

  const alRows = products.map((p) => {

    const margin = p.salePrice > 0 ? parseFloat(((p.salePrice - p.costPrice) / p.salePrice * 100).toFixed(1)) : 0;

    const stockStatus = p.stock === 0 ? "AGOTADO" : "CON EXISTENCIAS";

    return [

      p.sku, p.name, p.brand || "Sin marca", p.presentation || "No registrada", p.gramsPerUnit || 0,

      p.storageTemp || "Ambiente",

      p.stock, p.unit,

      parseFloat(p.costPrice.toFixed(2)), parseFloat(p.salePrice.toFixed(2)), margin,

      parseFloat((p.stock * p.costPrice).toFixed(2)),

      stockStatus, lotMap[p.id] !== undefined ? lotMap[p.id] : "Sin lote",

      (p.supplierId ? supMap[p.supplierId] : undefined) || "—", p.status,

    ];

  });

  const wsAl = buildSheet(alHeaders, alRows);

  setWidths(wsAl, [12, 34, 22, 22, 16, 24, 12, 8, 13, 14, 10, 14, 14, 28, 10, 12]);

  (wsAl as { "!freeze": object })["!freeze"] = { xSplit: 2, ySplit: 1 };

  const valHeaders = ["SKU", "Alimento", "Stock", "P. Costo ($)", "Valor Stock ($)", "% del Total"];

  const sorted = [...products].sort((a, b) => b.stock * b.costPrice - a.stock * a.costPrice);

  const valRows = sorted.map((p) => [

    p.sku, p.name, p.stock,

    parseFloat(p.costPrice.toFixed(2)),

    parseFloat((p.stock * p.costPrice).toFixed(2)),

    totalValue > 0 ? parseFloat(((p.stock * p.costPrice) / totalValue * 100).toFixed(1)) : 0,

  ]);

  const wsVal = buildSheet(valHeaders, valRows, {

    totalRow: ["", "TOTAL INVENTARIO", products.reduce((a, p) => a + p.stock, 0), "", parseFloat(totalValue.toFixed(2)), 100],

  });

  setWidths(wsVal, [12, 34, 10, 14, 16, 12]);

  const wb = XLS.utils.book_new();

  XLS.utils.book_append_sheet(wb, wsRes, "RESUMEN");

  XLS.utils.book_append_sheet(wb, wsAl, "ALIMENTOS");

  XLS.utils.book_append_sheet(wb, wsVal, "VALORACIÓN");

  // Separate lot rows are essential: one product can have multiple lots and dates.
  if (lots && lots.length > 0) {
    const lotHeaders = [
      "ID Lote", "N° Lote", "SKU", "Alimento", "Marca", "Presentación",
      "Gramos por unidad", "Proveedor", "F. Producción", "F. Vencimiento",
      "Qty Disponible", "F. Recepción", "Estado",
    ];
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));
    const lotRows = lots.map((lot) => {
      const product = productById[lot.productId];
      return [
        lot.id, lot.lotNumber, lot.sku, lot.productName,
        product?.brand || "", product?.presentation || "",
        product?.gramsPerUnit || 0,
        (lot.supplierId ? supMap[lot.supplierId] : undefined) || "",
        dateOnly(lot.productionDate), dateOnly(lot.expiryDate),
        lot.qty, dateOnly(lot.receivedDate), lot.status,
      ];
    });
    const wsLotRoundTrip = buildSheet(lotHeaders, lotRows);
    setWidths(wsLotRoundTrip, [14, 28, 14, 34, 22, 24, 18, 30, 16, 16, 16, 16, 14]);
    (wsLotRoundTrip as { "!freeze": object })["!freeze"] = { xSplit: 2, ySplit: 1 };
    XLS.utils.book_append_sheet(wb, wsLotRoundTrip, "LOTES");
  }

  const criticals = products.filter((p) => p.stock === 0 || (lotMap[p.id] !== undefined && lotMap[p.id] <= 30));

  if (criticals.length > 0) {

    const critHeaders = ["SKU", "Alimento", "Stock Actual", "Estado", "Días Próx. Venc.", "Proveedor"];

    const critRows = criticals.map((p) => [

      p.sku, p.name, p.stock,

      p.stock === 0 ? "AGOTADO" : "POR VENCER",

      lotMap[p.id] !== undefined ? lotMap[p.id] : "Sin lote",

      (p.supplierId ? supMap[p.supplierId] : undefined) || "—",

    ]);

    const wsCrit = buildSheet(critHeaders, critRows);

    setWidths(wsCrit, [12, 34, 12, 16, 16, 28]);

    XLS.utils.book_append_sheet(wb, wsCrit, "⚠ CRÍTICOS");

  }

  downloadWorkbook(wb, `FoodStock_Alimentos_${fmtDate()}.xlsx`);

}
// ─── Movements Export ─────────────────────────────────────────────────────────
export function exportMovementsExcel(movements: Movement[], title = "Movimientos") {

  const entries = movements.filter((m) => m.type === "Entrada");

  const exits = movements.filter((m) => m.type === "Salida");

  const byProduct = movements.reduce<Record<string, { e: number; s: number; a: number }>>((acc, m) => {

    // Normaliza el nombre antes de usarlo como clave: algunos movimientos antiguos
    // pueden no tener productName y TypeScript no permite indexar con undefined.
    const productKey = (m.productName ?? "").trim() || "Producto sin nombre";
    if (!acc[productKey]) acc[productKey] = { e: 0, s: 0, a: 0 };

    if (m.type === "Entrada") acc[productKey].e += m.qty;

    if (m.type === "Salida") acc[productKey].s += m.qty;

    if (m.type === "Ajuste") acc[productKey].a += m.qty;

    return acc;

  }, {});

  const wsRes = buildSummarySheet([

    {

      title: `RESUMEN DE ${title.toUpperCase()}`,

      rows: [

        ["Total de movimientos", movements.length],

        ["Entradas registradas", entries.length],

        ["Salidas registradas", exits.length],

        ["Ajustes registrados", movements.filter((m) => m.type === "Ajuste").length],

        ["Total valor entradas ($)", parseFloat(entries.reduce((a, m) => a + m.total, 0).toFixed(2))],

        ["Total valor salidas ($)", parseFloat(exits.reduce((a, m) => a + m.total, 0).toFixed(2))],

      ],

    },

    {

      title: "MOVIMIENTOS POR ALIMENTO",

      rows: Object.entries(byProduct).map(([name, v]) => [name, `Ent: ${v.e}  Sal: ${v.s}  Aj: ${v.a}`]),

    },

  ]);

  const movHeaders = [

    "ID Movimiento", "Fecha", "Tipo", "SKU", "Alimento",

    "N° Lote", "F. Producción", "F. Vencimiento", "Cantidad (unidades)", "Gramos por unidad", "Peso total (gramos)", "P. Unitario ($)", "Total ($)", "Saldo",

    "Referencia", "Proveedor / Cliente", "Observaciones",

  ];

  function movRow(m: Movement) {

    return [

      m.id, dateOnly(m.date), m.type, m.sku, m.productName,

      m.lotNumber || "—", dateOnly(m.productionDate) || "—", dateOnly(m.expiryDate) || "—",

      m.qty, m.gramsPerUnit || 0, m.totalGrams || m.qty * (m.gramsPerUnit || 0),

      parseFloat(m.unitCost.toFixed(2)), parseFloat(m.total.toFixed(2)), m.balance,

      m.reference, m.supplierId || m.client || "—", m.notes || "",

    ];

  }

  const wsMov = buildSheet(movHeaders, movements.map(movRow));

  setWidths(wsMov, [16, 12, 10, 12, 32, 26, 14, 14, 18, 18, 22, 13, 13, 10, 20, 28, 24]);

  (wsMov as { "!freeze": object })["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLS.utils.book_new();

  XLS.utils.book_append_sheet(wb, wsRes, "RESUMEN");

  XLS.utils.book_append_sheet(wb, wsMov, "MOVIMIENTOS");

  if (entries.length > 0) {

    const wsEnt = buildSheet(movHeaders, entries.map(movRow));

    setWidths(wsEnt, [16, 12, 10, 12, 32, 26, 14, 14, 18, 18, 22, 13, 13, 10, 20, 28, 24]);

    (wsEnt as { "!freeze": object })["!freeze"] = { xSplit: 0, ySplit: 1 };

    XLS.utils.book_append_sheet(wb, wsEnt, "ENTRADAS");

  }

  if (exits.length > 0) {

    const wsExit = buildSheet(movHeaders, exits.map(movRow));

    setWidths(wsExit, [16, 12, 10, 12, 32, 26, 14, 14, 18, 18, 22, 13, 13, 10, 20, 28, 24]);

    (wsExit as { "!freeze": object })["!freeze"] = { xSplit: 0, ySplit: 1 };

    XLS.utils.book_append_sheet(wb, wsExit, "SALIDAS");

  }

  downloadWorkbook(wb, `FoodStock_${title.replace(/\s+/g, "_")}_${fmtDate()}.xlsx`);

}
// ─── Suppliers Export ─────────────────────────────────────────────────────────
export function exportSuppliersExcel(suppliers: Supplier[]) {

  const wsRes = buildSummarySheet([

    {

      title: "DIRECTORIO DE PROVEEDORES",

      rows: [

        ["Total de proveedores", suppliers.length],

        ["Proveedores activos", suppliers.filter((s) => s.status === "Activo").length],

        ["Proveedores inactivos", suppliers.filter((s) => s.status === "Inactivo").length],

        ["Calificación promedio", parseFloat((suppliers.reduce((a, s) => a + s.rating, 0) / (suppliers.length || 1)).toFixed(1))],

      ],

    },

  ]);

  const supHeaders = [

    "ID", "Razón Social / Nombre", "RUC / NIT", "Contacto", "Teléfono", "Email",

    "Dirección", "Cond. de Pago", "Días Entrega", "Calificación", "Estado", "Notas",

  ];

  const supRows = suppliers.map((s) => [

    s.id, s.name, s.ruc || "—", s.contact || "—", s.phone || "—", s.email || "—",

    s.address || "—", s.paymentTerms || "—", s.deliveryDays, s.rating, s.status, s.notes || "",

  ]);

  const wsSup = buildSheet(supHeaders, supRows);

  setWidths(wsSup, [10, 34, 14, 20, 14, 26, 30, 16, 12, 12, 10, 28]);

  const wb = XLS.utils.book_new();

  XLS.utils.book_append_sheet(wb, wsRes, "RESUMEN");

  XLS.utils.book_append_sheet(wb, wsSup, "PROVEEDORES");

  downloadWorkbook(wb, `FoodStock_Proveedores_${fmtDate()}.xlsx`);

}
// ─── Lots Export ──────────────────────────────────────────────────────────────
export function exportLotsExcel(lots: Lot[], suppliers: Supplier[] = []) {

  const supplierMap = Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name]));

  const today = new Date();

  const withDays = lots.map((l) => ({

    ...l,

    days: Math.floor((Date.parse(`${dateOnly(l.expiryDate)}T00:00:00Z`) - Date.parse(`${dateOnly(today)}T00:00:00Z`)) / 86400000),

  }));

  const vencidos = withDays.filter((l) => l.days < 0 && l.qty > 0).length;

  const criticos = withDays.filter((l) => l.days >= 0 && l.days <= 7 && l.qty > 0).length;

  const proximos = withDays.filter((l) => l.days > 7 && l.days <= 30 && l.qty > 0).length;

  const vigentes = withDays.filter((l) => l.days > 30 && l.qty > 0).length;

  const wsRes = buildSummarySheet([

    {

      title: "CONTROL DE LOTES Y TRAZABILIDAD",

      rows: [

        ["Total de lotes registrados", lots.length],

        ["Lotes vigentes (> 30 días)", vigentes],

        ["Lotes próximos a vencer (≤ 30 días)", proximos],

        ["Lotes críticos (≤ 7 días)", criticos],

        ["Lotes vencidos (con stock)", vencidos],

        ["Lotes agotados (sin stock)", withDays.filter((l) => l.qty <= 0).length],

      ],

    },

  ]);

  const lotHeaders = [

    "ID Lote", "N° Lote", "SKU", "Alimento",

    "Proveedor", "F. Producción", "F. Vencimiento", "Días Restantes", "Qty Disponible", "Costo Unit. ($)", "F. Recepción", "Estado",

  ];

  function lotRow(l: typeof withDays[0]) {

    const status = l.qty <= 0 ? "Agotado" : l.days < 0 ? "Vencido" : l.days <= 7 ? "Crítico" : l.days <= 30 ? "Por vencer" : "Vigente";

    return [l.id, l.lotNumber, l.sku, l.productName, supplierMap[l.supplierId || ""] || "No registrado", dateOnly(l.productionDate), dateOnly(l.expiryDate), l.days < 0 ? "VENCIDO" : l.days, l.qty, parseFloat(l.unitCost.toFixed(2)), dateOnly(l.receivedDate), status];

  }

  const wsLots = buildSheet(lotHeaders, withDays.map(lotRow));

  setWidths(wsLots, [14, 32, 12, 34, 30, 14, 14, 14, 14, 13, 14, 12]);

  (wsLots as { "!freeze": object })["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLS.utils.book_new();

  XLS.utils.book_append_sheet(wb, wsRes, "RESUMEN");

  XLS.utils.book_append_sheet(wb, wsLots, "LOTES");

  const vencidosData = withDays.filter((l) => l.days < 0 && l.qty > 0);

  if (vencidosData.length > 0) {

    const ws = buildSheet(lotHeaders, vencidosData.map(lotRow));

    setWidths(ws, [14, 32, 12, 34, 30, 14, 14, 14, 14, 13, 14, 12]);

    XLS.utils.book_append_sheet(wb, ws, "VENCIDOS");

  }

  const alertData = withDays.filter((l) => l.days >= 0 && l.days <= 30 && l.qty > 0);

  if (alertData.length > 0) {

    const ws = buildSheet(lotHeaders, alertData.map(lotRow));

    setWidths(ws, [14, 32, 12, 34, 30, 14, 14, 14, 14, 13, 14, 12]);

    XLS.utils.book_append_sheet(wb, ws, "POR VENCER");

  }

  downloadWorkbook(wb, `FoodStock_Lotes_${fmtDate()}.xlsx`);

}
// Legacy alias
export function exportInventoryValueExcel(products: Product[], suppliers: Supplier[]) {

  exportProductsExcel(products, suppliers);

}
