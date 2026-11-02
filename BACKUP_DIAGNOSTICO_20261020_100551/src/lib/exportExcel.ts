// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import XLS from "xlsx-js-style";

import type { Product, Movement, Supplier, Lot, ImportedExcelSheet } from "../store/AppContext";

const fmtDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// Mantiene intactas las fechas AAAA-MM-DD. Nunca se convierten con UTC/ISO.
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

// ─── Estilos ──────────────────────────────────────────────────────────────────
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
  const make = (color: string) => ({
    font: { bold: true, color: { rgb: color }, sz: 10, name: "Calibri" },
    fill: { fgColor: { rgb: base } },
    border: bdr("111820"),
    alignment: { horizontal: "center" },
  });

  if (["AGOTADO", "Vencido", "VENCIDO", "CRÍTICO", "Crítico", "Inactivo", "Salida"].includes(val)) {
    return make("F87171");
  }
  if (["Por vencer", "NORMAL", "Activo"].includes(val)) return make("FBBF24");
  if (["Vigente", "LLENO", "Entrada"].includes(val)) return make("00C896");
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
    aoa.push(opts.totalRow.map((v, ci) => cell(v, ci <= 1 ? S.totalLabel : S.total)));
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
  ws["!autofilter"] = {
    ref: `A4:${XLS.utils.encode_col(headers.length - 1)}${Math.max(rows.length + 4, 4)}`,
  };
  ws["!freeze"] = { xSplit: 0, ySplit: 4 };
  ws["!rows"] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 8 }, { hpt: 24 }];
  setWidths(ws, widths);

  return ws;
}

// ─── Control de productos y lotes ─────────────────────────────────────────────
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
      (item) => item.productId === movement.productId && item.lotNumber === movement.lotNumber
    );

    return [
      dateOnly(movement.date),
      movement.type,
      movement.sku,
      movement.productName,
      movement.brand || product?.brand || "Sin marca",
      dateOnly(movement.productionDate || lot?.productionDate) || "No registrada",
      dateOnly(movement.expiryDate || lot?.expiryDate) || "No registrada",
      movement.lotNumber || "Sin lote",
      supplierMap[movement.supplierId || lot?.supplierId || product?.supplierId || ""] ||
        "No registrado",
      movement.qty,
      movement.gramsPerUnit || product?.gramsPerUnit || 0,
      movement.totalGrams || movement.qty * (movement.gramsPerUnit || product?.gramsPerUnit || 0),
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
          movement.qty * (movement.gramsPerUnit || productMap[movement.productId]?.gramsPerUnit || 0)),
      0
    );

    const generated = [
      `Generado el ${fmtDate()}`,
      `${list.length} movimientos`,
      `${units.toLocaleString("es-PE")} unidades`,
      `${weight.toLocaleString("es-PE")} gramos`,
    ].join(" · ");

    const sheet = buildPresentationSheet(title, generated, movementHeaders, list.map(movementRow), movementWidths);

    sheet["A3"] = cell(note, S.sectionHdr);
    sheet["!merges"] = [...(sheet["!merges"] ?? []), { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }];

    const rowInfo = sheet["!rows"] ?? [];
    rowInfo[2] = { hpt: 24 };
    sheet["!rows"] = rowInfo;

    return sheet;
  };

  // Pestañas inferiores: TODOS, INGRESOS y SALIDAS
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
  const activeName =
    movementType === "Entrada" ? "INGRESOS" : movementType === "Salida" ? "SALIDAS" : "TODOS";
  const activeTab = Math.max(0, sheets.findIndex((item) => item.name === activeName));

  (wb as unknown as { Workbook: { Views: Array<{ activeTab: number }> } }).Workbook = {
    Views: [{ activeTab }],
  };

  const suffix = movementType ? `_${movementType === "Entrada" ? "Ingresos" : "Salidas"}` : "";

  downloadWorkbook(wb, `FoodStock_Productos${suffix}_${fmtDate()}.xlsx`);
}

// ─── Exportar productos ───────────────────────────────────────────────────────
export function exportProductsExcel(products: Product[], suppliers: Supplier[], lots?: Lot[]) {
  const supMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Días hasta el vencimiento más próximo de cada producto
  const lotMap: Record<string, number> = {};

  (lots || []).forEach((l) => {
    if (l.qty <= 0) return;

    const expiry = dateOnly(l.expiryDate);
    const d = Math.floor(
      (Date.parse(`${expiry}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / 86400000
    );

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
        [
          "Lotes por vencer (≤ 30 días)",
          products.filter((p) => {
            const d = lotMap[p.id];
            return d !== undefined && d >= 0 && d <= 30;
          }).length,
        ],
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
    const margin =
      p.salePrice > 0 ? parseFloat((((p.salePrice - p.costPrice) / p.salePrice) * 100).toFixed(1)) : 0;
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
  setWidths(wsAl, [12, 34, 22, 22, 16, 24, 12, 8, 13, 14, 10, 14, 14, 28, 24, 12]);
  (wsAl as { "!freeze": object })["!freeze"] = { xSplit: 2, ySplit: 1 };

  const valHeaders = ["SKU", "Alimento", "Stock", "P. Costo ($)", "Valor Stock ($)", "% del Total"];
  const sorted = [...products].sort((a, b) => b.stock * b.costPrice - a.stock * a.costPrice);

  const valRows = sorted.map((p) => [
    p.sku, p.name, p.stock,
    parseFloat(p.costPrice.toFixed(2)),
    parseFloat((p.stock * p.costPrice).toFixed(2)),
    totalValue > 0 ? parseFloat((((p.stock * p.costPrice) / totalValue) * 100).toFixed(1)) : 0,
  ]);

  const wsVal = buildSheet(valHeaders, valRows, {
    totalRow: [
      "", "TOTAL INVENTARIO", products.reduce((a, p) => a + p.stock, 0), "",
      parseFloat(totalValue.toFixed(2)), 100,
    ],
  });
  setWidths(wsVal, [12, 34, 10, 14, 16, 12]);

  const wb = XLS.utils.book_new();
  XLS.utils.book_append_sheet(wb, wsRes, "RESUMEN");
  XLS.utils.book_append_sheet(wb, wsAl, "ALIMENTOS");
  XLS.utils.book_append_sheet(wb, wsVal, "VALORACIÓN");

  // Hoja de lotes: un producto puede tener varios lotes con fechas distintas.
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

  const criticals = products.filter(
    (p) => p.stock === 0 || (lotMap[p.id] !== undefined && lotMap[p.id] <= 30)
  );

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

// ─── Exportar movimientos ─────────────────────────────────────────────────────
// `suppliers` es opcional: si se envía, la columna "Proveedor / Cliente" muestra el nombre
// del proveedor en lugar de su código interno (SUP-00001).
export function exportMovementsExcel(
  movements: Movement[],
  title = "Movimientos",
  suppliers: Supplier[] = []
) {
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const entries = movements.filter((m) => m.type === "Entrada");
  const exits = movements.filter((m) => m.type === "Salida");

  const byProduct = movements.reduce<Record<string, { e: number; s: number; a: number }>>((acc, m) => {
    // Normaliza el nombre: movimientos antiguos pueden no tener productName.
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
      rows: Object.entries(byProduct).map(([name, v]) => [
        name,
        `Ent: ${v.e}  Sal: ${v.s}  Aj: ${v.a}`,
      ]),
    },
  ]);

  const movHeaders = [
    "ID Movimiento", "Fecha", "Tipo", "SKU", "Alimento",
    "N° Lote", "F. Producción", "F. Vencimiento", "Cantidad (unidades)", "Gramos por unidad",
    "Peso total (gramos)", "P. Unitario ($)", "Total ($)", "Saldo",
    "Referencia", "Proveedor / Cliente", "Observaciones",
  ];

  const movWidths = [16, 12, 10, 12, 32, 26, 14, 14, 18, 18, 22, 13, 13, 10, 20, 28, 24];

  function movRow(m: Movement) {
    return [
      m.id, dateOnly(m.date), m.type, m.sku, m.productName,
      m.lotNumber || "—", dateOnly(m.productionDate) || "—", dateOnly(m.expiryDate) || "—",
      m.qty, m.gramsPerUnit || 0, m.totalGrams || m.qty * (m.gramsPerUnit || 0),
      parseFloat(m.unitCost.toFixed(2)), parseFloat(m.total.toFixed(2)), m.balance,
      m.reference,
      (m.supplierId ? supplierMap[m.supplierId] : undefined) || m.client || m.supplierId || "—",
      m.notes || "",
    ];
  }

  const wsMov = buildSheet(movHeaders, movements.map(movRow));
  setWidths(wsMov, movWidths);
  (wsMov as { "!freeze": object })["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLS.utils.book_new();
  XLS.utils.book_append_sheet(wb, wsRes, "RESUMEN");
  XLS.utils.book_append_sheet(wb, wsMov, "MOVIMIENTOS");

  if (entries.length > 0) {
    const wsEnt = buildSheet(movHeaders, entries.map(movRow));
    setWidths(wsEnt, movWidths);
    (wsEnt as { "!freeze": object })["!freeze"] = { xSplit: 0, ySplit: 1 };
    XLS.utils.book_append_sheet(wb, wsEnt, "ENTRADAS");
  }

  if (exits.length > 0) {
    const wsExit = buildSheet(movHeaders, exits.map(movRow));
    setWidths(wsExit, movWidths);
    (wsExit as { "!freeze": object })["!freeze"] = { xSplit: 0, ySplit: 1 };
    XLS.utils.book_append_sheet(wb, wsExit, "SALIDAS");
  }

  downloadWorkbook(wb, `FoodStock_${title.replace(/\s+/g, "_")}_${fmtDate()}.xlsx`);
}

// ─── Exportar proveedores ─────────────────────────────────────────────────────
export function exportSuppliersExcel(suppliers: Supplier[]) {
  const wsRes = buildSummarySheet([
    {
      title: "DIRECTORIO DE PROVEEDORES",
      rows: [
        ["Total de proveedores", suppliers.length],
        ["Proveedores activos", suppliers.filter((s) => s.status === "Activo").length],
        ["Proveedores inactivos", suppliers.filter((s) => s.status === "Inactivo").length],
        [
          "Calificación promedio",
          parseFloat((suppliers.reduce((a, s) => a + s.rating, 0) / (suppliers.length || 1)).toFixed(1)),
        ],
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

// ─── Exportar lotes ───────────────────────────────────────────────────────────
export function exportLotsExcel(lots: Lot[], suppliers: Supplier[] = []) {
  const supplierMap = Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name]));

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const withDays = lots.map((l) => ({
    ...l,
    days: Math.floor(
      (Date.parse(`${dateOnly(l.expiryDate)}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / 86400000
    ),
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
    "Proveedor", "F. Producción", "F. Vencimiento", "Días Restantes", "Qty Disponible",
    "Costo Unit. ($)", "F. Recepción", "Estado",
  ];

  const lotWidths = [14, 32, 12, 34, 30, 14, 14, 14, 14, 13, 14, 12];

  function lotRow(l: (typeof withDays)[0]) {
    const status =
      l.qty <= 0 ? "Agotado" : l.days < 0 ? "Vencido" : l.days <= 7 ? "Crítico" : l.days <= 30 ? "Por vencer" : "Vigente";

    return [
      l.id, l.lotNumber, l.sku, l.productName,
      supplierMap[l.supplierId || ""] || "No registrado",
      dateOnly(l.productionDate), dateOnly(l.expiryDate),
      l.days < 0 ? "VENCIDO" : l.days,
      l.qty, parseFloat(l.unitCost.toFixed(2)), dateOnly(l.receivedDate), status,
    ];
  }

  const wsLots = buildSheet(lotHeaders, withDays.map(lotRow));
  setWidths(wsLots, lotWidths);
  (wsLots as { "!freeze": object })["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLS.utils.book_new();
  XLS.utils.book_append_sheet(wb, wsRes, "RESUMEN");
  XLS.utils.book_append_sheet(wb, wsLots, "LOTES");

  const vencidosData = withDays.filter((l) => l.days < 0 && l.qty > 0);
  if (vencidosData.length > 0) {
    const ws = buildSheet(lotHeaders, vencidosData.map(lotRow));
    setWidths(ws, lotWidths);
    XLS.utils.book_append_sheet(wb, ws, "VENCIDOS");
  }

  const alertData = withDays.filter((l) => l.days >= 0 && l.days <= 30 && l.qty > 0);
  if (alertData.length > 0) {
    const ws = buildSheet(lotHeaders, alertData.map(lotRow));
    setWidths(ws, lotWidths);
    XLS.utils.book_append_sheet(wb, ws, "POR VENCER");
  }

  downloadWorkbook(wb, `FoodStock_Lotes_${fmtDate()}.xlsx`);
}

// Alias heredado
export function exportInventoryValueExcel(products: Product[], suppliers: Supplier[]) {
  exportProductsExcel(products, suppliers);
}


// ─── Excel importado: se vuelve a descargar tal cual, con diseño ─────────────
const isBlank = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

const uniqueSheetName = (name: string, used: Set<string>) => {
  const clean = name.replace(/[\\/?*[\]:]/g, " ").trim() || "Hoja";
  let candidate = clean.slice(0, 31);
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${i++}`;
    candidate = clean.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
};

// ── Diseño claro y ordenado para el Excel importado ──
const mkStyle = (opts: {
  fill?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  sz?: number;
  align?: "left" | "center" | "right";
  wrap?: boolean;
  border?: string;
}) => ({
  font: {
    name: "Calibri",
    sz: opts.sz ?? 10,
    bold: !!opts.bold,
    italic: !!opts.italic,
    color: { rgb: opts.color ?? "1F2937" },
  },
  ...(opts.fill ? { fill: { patternType: "solid", fgColor: { rgb: opts.fill } } } : {}),
  ...(opts.border ? { border: bdr(opts.border) } : {}),
  alignment: { horizontal: opts.align ?? "left", vertical: "center", wrapText: !!opts.wrap },
});

const D = {
  title: mkStyle({ fill: "0D3D26", color: "FFFFFF", bold: true, sz: 15 }),
  meta: mkStyle({ fill: "E8F1EC", color: "4B5563", italic: true, sz: 10 }),
  note: mkStyle({ fill: "F3F7F5", color: "1A5C40", bold: true, sz: 10 }),
  blank: mkStyle({}),
  header: mkStyle({ fill: "1A5C40", color: "FFFFFF", bold: true, sz: 11, align: "center", wrap: true, border: "0D3D26" }),
  section: mkStyle({ fill: "DCE8E1", color: "1A5C40", bold: true, border: "C5D3CB" }),
  kpiLabel: mkStyle({ fill: "F3F7F5", bold: true, border: "D5DDD8" }),
  kpiValue: mkStyle({ fill: "FFFFFF", color: "1A5C40", bold: true, align: "right", border: "D5DDD8" }),
};

const GOOD = ["Entrada", "Vigente", "Activo", "Disponible", "LLENO", "CON EXISTENCIAS"];
const BAD = ["Salida", "Vencido", "VENCIDO", "AGOTADO", "Agotado", "Crítico", "CRÍTICO", "Inactivo"];
const WARN = ["Por vencer", "POR VENCER", "NORMAL"];

const looksNumeric = (v: unknown) =>
  typeof v === "number" ||
  (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v.trim().replace(",", "."))));

const isDateText = (v: string) => /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(v.trim());
const isDateFormat = (z?: string) => !!z && /[dmy]/i.test(z) && !/[#0]/.test(z);

// Orden lógico de las pestañas: resumen, productos, movimientos, ingresos, salidas, lotes, alertas...
const SHEET_ORDER = [
  /resumen|indicador|dashboard|general/,
  /inventario|producto|alimento|catalogo/,
  /todos|movimiento|kardex|historial/,
  /ingreso|entrada/,
  /salida/,
  /lote/,
  /por vencer|vencid|critic|alerta/,
  /valoracion/,
  /proveedor/,
];

const sheetRank = (name: string) => {
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const i = SHEET_ORDER.findIndex((re) => re.test(n));
  return i === -1 ? SHEET_ORDER.length : i;
};

// Descarga todas las hojas del Excel importado con su contenido original
// (todas las filas y columnas, números como números, fechas con su formato, fusiones y anchos),
// con un diseño claro: título, encabezados en verde, filas alternadas, filtros y filas fijas.
// Las pestañas se ordenan de forma lógica.
export function exportImportedExcel(sheets: ImportedExcelSheet[], fileName = "Excel_importado") {
  const wb = XLS.utils.book_new();
  const used = new Set<string>();

  const ordered = sheets
    .map((sheet, index) => ({ sheet, index }))
    .sort((a, b) => sheetRank(a.sheet.name) - sheetRank(b.sheet.name) || a.index - b.index)
    .map((item) => item.sheet);

  ordered.forEach((sheet) => {
    const source: (string | number)[][] =
      sheet.values && sheet.values.length ? sheet.values : sheet.rows;
    const width = source.reduce((max, r) => Math.max(max, r.length), Math.max(1, sheet.headers.length));
    const grid = source.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""));
    const counts = grid.map((r) => r.filter((v) => !isBlank(v)).length);
    const fmtMap = new Map((sheet.numFmts || []).map(([r, c, z]) => [`${r},${c}`, z] as [string, string]));

    // Fila de encabezados: la primera fila "ancha" cuyas celdas son mayormente texto
    let headerRow = -1;
    const scan = Math.min(grid.length, 30);
    const maxCount = counts.slice(0, scan).reduce((m, n) => Math.max(m, n), 0);
    if (maxCount >= 3) {
      for (let i = 0; i < scan; i++) {
        const textCells = grid[i].filter((v) => !isBlank(v) && !looksNumeric(v)).length;
        if (counts[i] >= Math.max(3, Math.ceil(maxCount * 0.6)) && textCells >= Math.ceil(counts[i] * 0.7)) {
          headerRow = i;
          break;
        }
      }
    }

    const aoa = grid.map((row, r) => {
      const zebra = r - headerRow - 1;
      const fill = zebra % 2 === 1 ? "F3F7F5" : "FFFFFF";

      return row.map((v, c) => {
        // ── Hoja con encabezados ──
        if (headerRow >= 0) {
          if (r < headerRow) {
            if (counts[r] === 0) return cell(v, D.blank);
            return cell(v, r === 0 ? D.title : r === 1 ? D.meta : D.note);
          }
          if (r === headerRow) return cell(v, D.header);

          const isTotal =
            typeof grid[r][0] === "string" && /^total/i.test(String(grid[r][0]).trim()) ||
            typeof grid[r][1] === "string" && /^total/i.test(String(grid[r][1]).trim());
          const base = { fill: isTotal ? "DCE8E1" : fill, border: "D5DDD8", bold: isTotal };

          if (typeof v === "number") {
            return cell(v, mkStyle({ ...base, align: isDateFormat(fmtMap.get(`${r},${c}`)) ? "center" : "right" }));
          }
          const text = String(v);
          if (GOOD.includes(text)) return cell(v, mkStyle({ fill: "D1FAE5", color: "047857", bold: true, align: "center", border: "D5DDD8" }));
          if (BAD.includes(text)) return cell(v, mkStyle({ fill: "FEE2E2", color: "B91C1C", bold: true, align: "center", border: "D5DDD8" }));
          if (WARN.includes(text)) return cell(v, mkStyle({ fill: "FEF3C7", color: "B45309", bold: true, align: "center", border: "D5DDD8" }));
          return cell(v, mkStyle({ ...base, align: isDateText(text) ? "center" : looksNumeric(text) ? "right" : "left" }));
        }

        // ── Hoja tipo resumen (etiqueta y valor) ──
        if (r === 0) return cell(v, D.title);
        if (r === 1) return cell(v, D.meta);
        if (counts[r] === 0) return cell(v, D.blank);
        if (counts[r] === 1) return cell(v, D.section);
        if (c === 0) return cell(v, D.kpiLabel);
        return cell(v, typeof v === "number" ? D.kpiValue : mkStyle({ fill: "FFFFFF", color: "4B5563", align: "right", border: "D5DDD8" }));
      });
    });

    const ws = XLS.utils.aoa_to_sheet(aoa);

    // Cada número o fecha conserva el formato que tenía en el archivo original
    fmtMap.forEach((z, key) => {
      const [r, c] = key.split(",").map(Number);
      const addr = XLS.utils.encode_cell({ r, c });
      if (ws[addr] && ws[addr].t === "n") ws[addr].z = z;
    });

    // Fusiones originales + filas de título a todo el ancho
    const merges = (sheet.merges || []).filter((m) => m.e.r < grid.length && m.e.c < width);
    if (headerRow > 0 && width > 1) {
      for (let r = 0; r < headerRow; r++) {
        const covered = merges.some((m) => m.s.r <= r && m.e.r >= r);
        if (counts[r] === 1 && !covered) merges.push({ s: { r, c: 0 }, e: { r, c: width - 1 } });
      }
    }
    if (merges.length) ws["!merges"] = merges;

    if (headerRow >= 0) {
      if (grid.length > headerRow + 1) {
        ws["!autofilter"] = {
          ref: `A${headerRow + 1}:${XLS.utils.encode_col(width - 1)}${grid.length}`,
        };
      }
      ws["!freeze"] = { xSplit: 0, ySplit: headerRow + 1 };
    }

    // Alturas de fila: título, filas de cabecera y encabezados
    const rowInfo: { hpt: number }[] = [];
    const lastTall = headerRow >= 0 ? headerRow : Math.min(grid.length, 4) - 1;
    for (let r = 0; r <= lastTall; r++) {
      if (r === headerRow) rowInfo.push({ hpt: 32 });
      else if (r === 0) rowInfo.push({ hpt: 30 });
      else rowInfo.push({ hpt: counts[r] === 0 ? 8 : 20 });
    }
    ws["!rows"] = rowInfo;

    // Anchos de columna: según el encabezado y el contenido (nunca menos que el original)
    const startRow = headerRow >= 0 ? headerRow : Math.min(2, grid.length);
    const widths = Array.from({ length: width }, (_, c) => {
      const headerLen = headerRow >= 0 ? String(grid[headerRow][c] ?? "").length * 1.15 + 4 : 0;
      const longest = grid
        .slice(startRow, startRow + 300)
        .reduce((max, r) => Math.max(max, String(r[c] ?? "").length), 0);
      const computed = Math.max(headerLen, longest + 3, 11);
      const given = sheet.colWidths?.[c] ? Math.round(sheet.colWidths[c] as number) : 0;
      return Math.min(60, Math.max(computed, given));
    });
    setWidths(ws, widths);

    XLS.utils.book_append_sheet(wb, ws, uniqueSheetName(sheet.name, used));
  });

  const base = fileName.replace(/\.[^.]+$/, "").trim() || "Excel_importado";
  downloadWorkbook(wb, `${base}.xlsx`);
}

// Exporta una tabla simple con título, encabezados con diseño y filas alternadas
export function exportStyledTable(opts: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  sheetName?: string;
  fileName: string;
}) {
  const { headers, rows } = opts;

  const widths = headers.map((h, c) =>
    Math.min(
      48,
      Math.max(
        12,
        h.length + 4,
        ...rows.slice(0, 300).map((r) => String(r[c] ?? "").length + 3)
      )
    )
  );

  const ws = buildPresentationSheet(
    opts.title,
    opts.subtitle || `Generado el ${fmtDate()} · ${rows.length} filas`,
    headers,
    rows,
    widths
  );

  const wb = XLS.utils.book_new();
  XLS.utils.book_append_sheet(wb, ws, (opts.sheetName || "Datos").slice(0, 31));

  downloadWorkbook(wb, opts.fileName.endsWith(".xlsx") ? opts.fileName : `${opts.fileName}.xlsx`);
}

// Devuelve el archivo original EXACTAMENTE como se subió (mismos bytes, sin ningún cambio)
export function downloadOriginalFile(bytes: ArrayBuffer, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const type =
    ext === "xls"
      ? "application/vnd.ms-excel"
      : ext === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "Excel_importado.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}