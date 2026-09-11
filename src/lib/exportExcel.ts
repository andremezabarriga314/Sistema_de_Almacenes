import XLS from "xlsx-js-style";

import type {
  Product,
  Movement,
  Supplier,
  Lot,
} from "../store/AppContext";

const COMPANY_NAME = "Consorcio Inambú";

function fmtDate() {
  return new Date().toISOString().slice(0, 10);
}

function bdr(rgb: string) {
  const border = {
    style: "thin" as const,
    color: { rgb },
  };

  return {
    top: border,
    bottom: border,
    left: border,
    right: border,
  };
}

const S = {
  hdr: {
    font: {
      bold: true,
      color: { rgb: "FFFFFF" },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "1A5C40" },
    },
    border: bdr("0D3D26"),
    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },
  },

  title: {
    font: {
      bold: true,
      color: { rgb: "FFFFFF" },
      sz: 13,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "0D3D26" },
    },
    alignment: {
      horizontal: "left",
      vertical: "center",
    },
  },

  meta: {
    font: {
      color: { rgb: "94A3B8" },
      sz: 9,
      name: "Calibri",
      italic: true,
    },
    fill: {
      fgColor: { rgb: "0A1810" },
    },
    alignment: {
      horizontal: "left",
    },
  },

  kpiLabel: {
    font: {
      bold: true,
      color: { rgb: "D1D9E2" },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "0E1A12" },
    },
    border: bdr("1A2232"),
    alignment: {
      horizontal: "left",
    },
  },

  kpiVal: {
    font: {
      bold: true,
      color: { rgb: "00C896" },
      sz: 11,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "08120E" },
    },
    border: bdr("1A2232"),
    alignment: {
      horizontal: "right",
    },
  },

  kpiValStr: {
    font: {
      bold: false,
      color: { rgb: "94A3B8" },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "08120E" },
    },
    border: bdr("1A2232"),
    alignment: {
      horizontal: "right",
    },
  },

  even: {
    font: {
      color: { rgb: "D1D9E2" },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "0A1218" },
    },
    border: bdr("111820"),
    alignment: {
      horizontal: "left",
      vertical: "center",
    },
  },

  odd: {
    font: {
      color: { rgb: "D1D9E2" },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "070D12" },
    },
    border: bdr("111820"),
    alignment: {
      horizontal: "left",
      vertical: "center",
    },
  },

  sectionHdr: {
    font: {
      bold: true,
      color: { rgb: "00C896" },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "08120E" },
    },
    border: bdr("0D3D26"),
    alignment: {
      horizontal: "left",
    },
  },

  totalLabel: {
    font: {
      bold: true,
      color: { rgb: "FFFFFF" },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "1A5C40" },
    },
    border: bdr("1A5C40"),
    alignment: {
      horizontal: "left",
    },
  },

  total: {
    font: {
      bold: true,
      color: { rgb: "FFFFFF" },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: { rgb: "1A5C40" },
    },
    border: bdr("1A5C40"),
    alignment: {
      horizontal: "right",
    },
  },
};

function numStyle(isEven: boolean) {
  return {
    font: {
      color: {
        rgb: isEven ? "94A3B8" : "7A8EA8",
      },
      sz: 10,
      name: "Calibri",
    },
    fill: {
      fgColor: {
        rgb: isEven ? "0A1218" : "070D12",
      },
    },
    border: bdr("111820"),
    alignment: {
      horizontal: "right",
    },
  };
}

function statusStyle(
  value: string,
  isEven: boolean,
) {
  const base = isEven ? "0A1218" : "070D12";

  if (
    [
      "AGOTADO",
      "Agotado",
      "Vencido",
      "VENCIDO",
      "CRÍTICO",
      "Crítico",
      "Inactivo",
    ].includes(value)
  ) {
    return {
      font: {
        bold: true,
        color: { rgb: "F87171" },
        sz: 10,
        name: "Calibri",
      },
      fill: {
        fgColor: { rgb: base },
      },
      border: bdr("111820"),
      alignment: {
        horizontal: "center",
      },
    };
  }

  if (
    [
      "Por vencer",
      "NORMAL",
      "Normal",
      "Activo",
    ].includes(value)
  ) {
    return {
      font: {
        bold: true,
        color: { rgb: "FBBF24" },
        sz: 10,
        name: "Calibri",
      },
      fill: {
        fgColor: { rgb: base },
      },
      border: bdr("111820"),
      alignment: {
        horizontal: "center",
      },
    };
  }

  if (
    ["Vigente", "LLENO", "Lleno"].includes(value)
  ) {
    return {
      font: {
        bold: true,
        color: { rgb: "00C896" },
        sz: 10,
        name: "Calibri",
      },
      fill: {
        fgColor: { rgb: base },
      },
      border: bdr("111820"),
      alignment: {
        horizontal: "center",
      },
    };
  }

  return null;
}

function cell(
  value: string | number | null | undefined,
  style: object,
) {
  const val = value ?? "";

  return {
    v: val,
    t: typeof val === "number" ? "n" : "s",
    s: style,
  };
}

function buildSheet(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  options?: {
    totalRow?: (string | number | null | undefined)[];
  },
) {
  const aoa: object[][] = [];

  aoa.push(
    headers.map((header) =>
      cell(header, S.hdr),
    ),
  );

  rows.forEach((row, rowIndex) => {
    const isEven = rowIndex % 2 === 0;

    aoa.push(
      row.map((value) => {
        if (typeof value === "number") {
          return cell(
            value,
            numStyle(isEven),
          );
        }

        if (typeof value === "string") {
          const status = statusStyle(
            value,
            isEven,
          );

          if (status) {
            return cell(value, status);
          }
        }

        return cell(
          value,
          isEven ? S.even : S.odd,
        );
      }),
    );
  });

  if (options?.totalRow) {
    aoa.push(
      options.totalRow.map(
        (value, columnIndex) =>
          cell(
            value,
            columnIndex <= 1
              ? S.totalLabel
              : S.total,
          ),
      ),
    );
  }

  const ws = XLS.utils.aoa_to_sheet(aoa);

  ws["!rows"] = [
    {
      hpt: 22,
    },
  ];

  return ws;
}

function buildSummarySheet(
  sections: Array<{
    title: string;
    rows: [string, string | number][];
  }>,
) {
  const aoa: object[][] = [];

  aoa.push([
    cell(
      `${COMPANY_NAME} — Sistema de Almacenes`,
      S.title,
    ),
    cell("", S.title),
    cell("", S.title),
  ]);

  aoa.push([
    cell(
      `Generado: ${fmtDate()}`,
      S.meta,
    ),
    cell("", S.meta),
    cell("", S.meta),
  ]);

  aoa.push([
    cell("", S.even),
    cell("", S.even),
    cell("", S.even),
  ]);

  sections.forEach((section) => {
    aoa.push([
      cell(section.title, S.sectionHdr),
      cell("", S.sectionHdr),
      cell("", S.sectionHdr),
    ]);

    section.rows.forEach(
      ([label, value]) => {
        aoa.push([
          cell(label, S.kpiLabel),
          cell(
            value,
            typeof value === "number"
              ? S.kpiVal
              : S.kpiValStr,
          ),
          cell("", S.even),
        ]);
      },
    );

    aoa.push([
      cell("", S.even),
      cell("", S.even),
      cell("", S.even),
    ]);
  });

  const ws = XLS.utils.aoa_to_sheet(aoa);

  ws["!cols"] = [
    { wch: 38 },
    { wch: 22 },
    { wch: 10 },
  ];

  ws["!rows"] = [
    { hpt: 26 },
    { hpt: 16 },
  ];

  ws["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 2 },
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: 2 },
    },
  ];

  return ws;
}

function setWidths(
  ws: object,
  widths: number[],
) {
  (
    ws as {
      "!cols": object[];
    }
  )["!cols"] = widths.map((width) => ({
    wch: width,
  }));
}

export function exportProductsExcel(
  products: Product[],
  suppliers: Supplier[],
  lots: Lot[] = [],
) {
  const supplierMap = Object.fromEntries(
    suppliers.map((supplier) => [
      String(supplier.id),
      supplier.name,
    ]),
  );

  const today = new Date();

  const lotMap: Record<string, number> = {};

  lots.forEach((lot) => {
    if (lot.qty <= 0) {
      return;
    }

    const days = Math.floor(
      (new Date(lot.expiryDate).getTime() -
        today.getTime()) /
        86400000,
    );

    if (
      lotMap[lot.productId] === undefined ||
      days < lotMap[lot.productId]
    ) {
      lotMap[lot.productId] = days;
    }
  });

  const totalValue = products.reduce(
    (total, product) =>
      total +
      product.stock * product.costPrice,
    0,
  );

  const active = products.filter(
    (product) =>
      product.status === "Activo",
  ).length;

  const categorySummary = Object.entries(
    products.reduce<
      Record<
        string,
        {
          count: number;
          value: number;
        }
      >
    >((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = {
          count: 0,
          value: 0,
        };
      }

      acc[product.category].count += 1;

      acc[product.category].value +=
        product.stock *
        product.costPrice;

      return acc;
    }, {}),
  );

  const wsSummary = buildSummarySheet([
    {
      title: "INDICADORES DE INVENTARIO",
      rows: [
        [
          "Total de productos registrados",
          products.length,
        ],
        [
          "Productos activos",
          active,
        ],
        [
          "Valor total del inventario (S/)",
          parseFloat(
            totalValue.toFixed(2),
          ),
        ],
        [
          "Sin stock",
          products.filter(
            (product) =>
              product.stock === 0,
          ).length,
        ],
        [
          "Stock crítico",
          products.filter(
            (product) =>
              product.stock > 0 &&
              product.stock <=
                product.minStock,
          ).length,
        ],
        [
          "Lotes vencidos",
          products.filter(
            (product) =>
              (lotMap[product.id] ?? 999) <
              0,
          ).length,
        ],
        [
          "Lotes por vencer",
          products.filter((product) => {
            const days =
              lotMap[product.id];

            return (
              days !== undefined &&
              days >= 0 &&
              days <= 30
            );
          }).length,
        ],
      ],
    },

    {
      title: "DISTRIBUCIÓN POR CATEGORÍA",
      rows: categorySummary.map(
        ([category, value]) => [
          category,
          `${value.count} productos · S/ ${value.value.toFixed(
            2,
          )}`,
        ],
      ),
    },
  ]);

  const headers = [
    "SKU",
    "Nombre del Producto",
    "Categoría",
    "Temp. Almacenamiento",
    "Stock Actual",
    "Stock Mín.",
    "Stock Máx.",
    "Unidad",
    "Costo Unit. (S/)",
    "Precio Venta (S/)",
    "Margen (%)",
    "Valor Stock (S/)",
    "Estado Stock",
    "Días Próx. Venc.",
    "Proveedor",
    "Estado",
  ];

  const rows = products.map(
    (product) => {
      const margin =
        product.salePrice > 0
          ? parseFloat(
              (
                ((product.salePrice -
                  product.costPrice) /
                  product.salePrice) *
                100
              ).toFixed(1),
            )
          : 0;

      const stockStatus =
        product.stock === 0
          ? "AGOTADO"
          : product.stock <=
              product.minStock
            ? "CRÍTICO"
            : product.stock >=
                product.maxStock
              ? "LLENO"
              : "NORMAL";

      return [
        product.sku,
        product.name,
        product.category,
        product.storageTemp ||
          "Ambiente",
        product.stock,
        product.minStock,
        product.maxStock,
        product.unit,
        parseFloat(
          product.costPrice.toFixed(2),
        ),
        parseFloat(
          product.salePrice.toFixed(2),
        ),
        margin,
        parseFloat(
          (
            product.stock *
            product.costPrice
          ).toFixed(2),
        ),
        stockStatus,
        lotMap[product.id] !== undefined
          ? lotMap[product.id]
          : "Sin lote",
        supplierMap[
          String(product.supplierId)
        ] || "—",
        product.status,
      ];
    },
  );

  const wsProducts = buildSheet(
    headers,
    rows,
  );

  setWidths(wsProducts, [
    12,
    34,
    22,
    24,
    12,
    10,
    10,
    8,
    14,
    15,
    10,
    15,
    14,
    16,
    30,
    12,
  ]);

  wsProducts["!freeze"] = {
    xSplit: 2,
    ySplit: 1,
  };

  const workbook = XLS.utils.book_new();

  XLS.utils.book_append_sheet(
    workbook,
    wsSummary,
    "RESUMEN",
  );

  XLS.utils.book_append_sheet(
    workbook,
    wsProducts,
    "PRODUCTOS",
  );

  XLS.writeFile(
    workbook,
    `INAMBU_Productos_${fmtDate()}.xlsx`,
  );
}

export function exportMovementsExcel(
  movements: Movement[],
  suppliers: Supplier[],
  title = "Movimientos",
) {
  const supplierMap = Object.fromEntries(
    suppliers.map((supplier) => [
      String(supplier.id),
      supplier.name,
    ]),
  );

  const entries = movements.filter(
    (movement) =>
      movement.type === "Entrada",
  );

  const exits = movements.filter(
    (movement) =>
      movement.type === "Salida",
  );

  const adjustments = movements.filter(
    (movement) =>
      movement.type === "Ajuste",
  );

  const returns = movements.filter(
    (movement) =>
      movement.type === "Devolución",
  );

  const movementByProduct =
    movements.reduce<
      Record<
        string,
        {
          entries: number;
          exits: number;
          adjustments: number;
          returns: number;
        }
      >
    >((acc, movement) => {
      const key =
        movement.productName ||
        "Sin producto";

      if (!acc[key]) {
        acc[key] = {
          entries: 0,
          exits: 0,
          adjustments: 0,
          returns: 0,
        };
      }

      if (movement.type === "Entrada") {
        acc[key].entries += movement.qty;
      }

      if (movement.type === "Salida") {
        acc[key].exits += movement.qty;
      }

      if (movement.type === "Ajuste") {
        acc[key].adjustments +=
          movement.qty;
      }

      if (
        movement.type === "Devolución"
      ) {
        acc[key].returns += movement.qty;
      }

      return acc;
    }, {});

  const wsSummary = buildSummarySheet([
    {
      title: `RESUMEN DE ${title.toUpperCase()}`,
      rows: [
        [
          "Total de movimientos",
          movements.length,
        ],
        [
          "Entradas registradas",
          entries.length,
        ],
        [
          "Salidas registradas",
          exits.length,
        ],
        [
          "Ajustes registrados",
          adjustments.length,
        ],
        [
          "Devoluciones registradas",
          returns.length,
        ],
        [
          "Total valor entradas (S/)",
          parseFloat(
            entries
              .reduce(
                (total, movement) =>
                  total +
                  Number(
                    movement.total || 0,
                  ),
                0,
              )
              .toFixed(2),
          ),
        ],
        [
          "Total valor salidas (S/)",
          parseFloat(
            exits
              .reduce(
                (total, movement) =>
                  total +
                  Number(
                    movement.total || 0,
                  ),
                0,
              )
              .toFixed(2),
          ),
        ],
      ],
    },

    {
      title: "MOVIMIENTOS POR PRODUCTO",
      rows: Object.entries(
        movementByProduct,
      ).map(([name, value]) => [
        name,
        `Ent: ${value.entries} · Sal: ${value.exits} · Aj: ${value.adjustments} · Dev: ${value.returns}`,
      ]),
    },
  ]);

  const headers = [
    "ID Movimiento",
    "Fecha",
    "Tipo",
    "SKU",
    "Producto",
    "N° Lote",
    "F. Vencimiento",
    "Cantidad",
    "P. Unitario (S/)",
    "Total (S/)",
    "Saldo",
    "Referencia",
    "Proveedor / Cliente",
    "Observaciones",
  ];

  const movementRow = (
    movement: Movement,
  ) => {
    const supplierName =
      movement.supplierId
        ? supplierMap[
            String(
              movement.supplierId,
            )
          ] || ""
        : "";

    const counterpart =
      supplierName ||
      movement.client ||
      movement.reason ||
      "—";

    return [
      movement.id,
      movement.date,
      movement.type,
      movement.sku,
      movement.productName,
      movement.lotNumber || "—",
      movement.expiryDate || "—",
      Number(movement.qty || 0),
      parseFloat(
        Number(
          movement.unitCost || 0,
        ).toFixed(2),
      ),
      parseFloat(
        Number(
          movement.total || 0,
        ).toFixed(2),
      ),
      Number(movement.balance || 0),
      movement.reference || "—",
      counterpart,
      movement.notes || "",
    ];
  };

  const widths = [
    16,
    12,
    12,
    12,
    32,
    26,
    16,
    10,
    15,
    15,
    10,
    20,
    30,
    28,
  ];

  const workbook = XLS.utils.book_new();

  const wsMovements = buildSheet(
    headers,
    movements.map(movementRow),
  );

  setWidths(
    wsMovements,
    widths,
  );

  wsMovements["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
  };

  XLS.utils.book_append_sheet(
    workbook,
    wsSummary,
    "RESUMEN",
  );

  XLS.utils.book_append_sheet(
    workbook,
    wsMovements,
    "MOVIMIENTOS",
  );

  if (entries.length > 0) {
    const wsEntries = buildSheet(
      headers,
      entries.map(movementRow),
    );

    setWidths(
      wsEntries,
      widths,
    );

    XLS.utils.book_append_sheet(
      workbook,
      wsEntries,
      "ENTRADAS",
    );
  }

  if (exits.length > 0) {
    const wsExits = buildSheet(
      headers,
      exits.map(movementRow),
    );

    setWidths(
      wsExits,
      widths,
    );

    XLS.utils.book_append_sheet(
      workbook,
      wsExits,
      "SALIDAS",
    );
  }

  if (adjustments.length > 0) {
    const wsAdjustments = buildSheet(
      headers,
      adjustments.map(movementRow),
    );

    setWidths(
      wsAdjustments,
      widths,
    );

    XLS.utils.book_append_sheet(
      workbook,
      wsAdjustments,
      "AJUSTES",
    );
  }

  if (returns.length > 0) {
    const wsReturns = buildSheet(
      headers,
      returns.map(movementRow),
    );

    setWidths(
      wsReturns,
      widths,
    );

    XLS.utils.book_append_sheet(
      workbook,
      wsReturns,
      "DEVOLUCIONES",
    );
  }

  XLS.writeFile(
    workbook,
    `INAMBU_${title.replace(
      /\s+/g,
      "_",
    )}_${fmtDate()}.xlsx`,
  );
}

export function exportSuppliersExcel(
  suppliers: Supplier[],
) {
  const averageRating =
    suppliers.length > 0
      ? suppliers.reduce(
          (total, supplier) =>
            total +
            Number(
              supplier.rating || 0,
            ),
          0,
        ) / suppliers.length
      : 0;

  const activeSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status === "Activo",
    ).length;

  const inactiveSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status === "Inactivo",
    ).length;

  const wsSummary = buildSummarySheet([
    {
      title: "DIRECTORIO DE PROVEEDORES",
      rows: [
        [
          "Total de proveedores",
          suppliers.length,
        ],
        [
          "Proveedores activos",
          activeSuppliers,
        ],
        [
          "Proveedores inactivos",
          inactiveSuppliers,
        ],
        [
          "Calificación promedio",
          parseFloat(
            averageRating.toFixed(1),
          ),
        ],
      ],
    },
  ]);

  const headers = [
    "ID",
    "Razón Social / Nombre",
    "RUC / NIT",
    "Contacto",
    "Teléfono",
    "Email",
    "Dirección",
    "Cond. de Pago",
    "Días Entrega",
    "Calificación",
    "Estado",
    "Notas",
    "Fecha Registro",
  ];

  const rows = suppliers.map(
    (supplier) => [
      supplier.id,
      supplier.name || "—",
      supplier.ruc || "—",
      supplier.contact || "—",
      supplier.phone || "—",
      supplier.email || "—",
      supplier.address || "—",
      supplier.paymentTerms || "—",
      Number(
        supplier.deliveryDays || 0,
      ),
      Number(
        supplier.rating || 0,
      ),
      supplier.status || "—",
      supplier.notes || "",
      supplier.createdAt || "—",
    ],
  );

  const wsSuppliers = buildSheet(
    headers,
    rows,
  );

  setWidths(wsSuppliers, [
    16,
    36,
    16,
    24,
    16,
    30,
    36,
    20,
    14,
    14,
    12,
    32,
    20,
  ]);

  wsSuppliers["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
  };

  const workbook = XLS.utils.book_new();

  XLS.utils.book_append_sheet(
    workbook,
    wsSummary,
    "RESUMEN",
  );

  XLS.utils.book_append_sheet(
    workbook,
    wsSuppliers,
    "PROVEEDORES",
  );

  XLS.writeFile(
    workbook,
    `INAMBU_Proveedores_${fmtDate()}.xlsx`,
  );
}

export function exportLotsExcel(
  lots: Lot[],
) {
  const today = new Date();

  const withDays = lots.map((lot) => ({
    ...lot,
    days: Math.floor(
      (new Date(
        lot.expiryDate,
      ).getTime() -
        today.getTime()) /
        86400000,
    ),
  }));

  const expired = withDays.filter(
    (lot) =>
      lot.days < 0 &&
      lot.qty > 0,
  ).length;

  const critical = withDays.filter(
    (lot) =>
      lot.days >= 0 &&
      lot.days <= 7 &&
      lot.qty > 0,
  ).length;

  const upcoming = withDays.filter(
    (lot) =>
      lot.days > 7 &&
      lot.days <= 30 &&
      lot.qty > 0,
  ).length;

  const current = withDays.filter(
    (lot) =>
      lot.days > 30 &&
      lot.qty > 0,
  ).length;

  const wsSummary = buildSummarySheet([
    {
      title:
        "CONTROL DE LOTES Y TRAZABILIDAD",
      rows: [
        [
          "Total de lotes registrados",
          lots.length,
        ],
        [
          "Lotes vigentes",
          current,
        ],
        [
          "Lotes próximos a vencer",
          upcoming,
        ],
        [
          "Lotes críticos",
          critical,
        ],
        [
          "Lotes vencidos",
          expired,
        ],
        [
          "Lotes agotados",
          withDays.filter(
            (lot) => lot.qty <= 0,
          ).length,
        ],
      ],
    },
  ]);

  const headers = [
    "ID Lote",
    "N° Lote",
    "SKU",
    "Producto",
    "F. Vencimiento",
    "Días Restantes",
    "Qty Disponible",
    "Costo Unit. (S/)",
    "F. Recepción",
    "Estado",
  ];

  const lotRow = (
    lot: (typeof withDays)[number],
  ) => {
    const status =
      lot.qty <= 0
        ? "Agotado"
        : lot.days < 0
          ? "Vencido"
          : lot.days <= 7
            ? "Crítico"
            : lot.days <= 30
              ? "Por vencer"
              : "Vigente";

    return [
      lot.id,
      lot.lotNumber,
      lot.sku,
      lot.productName,
      lot.expiryDate,
      lot.days < 0
        ? "VENCIDO"
        : lot.days,
      lot.qty,
      parseFloat(
        Number(
          lot.unitCost,
        ).toFixed(2),
      ),
      lot.receivedDate,
      status,
    ];
  };

  const widths = [
    16,
    32,
    14,
    36,
    16,
    16,
    16,
    16,
    16,
    14,
  ];

  const wsLots = buildSheet(
    headers,
    withDays.map(lotRow),
  );

  setWidths(
    wsLots,
    widths,
  );

  const workbook = XLS.utils.book_new();

  XLS.utils.book_append_sheet(
    workbook,
    wsSummary,
    "RESUMEN",
  );

  XLS.utils.book_append_sheet(
    workbook,
    wsLots,
    "LOTES",
  );

  const expiredLots =
    withDays.filter(
      (lot) =>
        lot.days < 0 &&
        lot.qty > 0,
    );

  if (expiredLots.length > 0) {
    const ws = buildSheet(
      headers,
      expiredLots.map(lotRow),
    );

    setWidths(ws, widths);

    XLS.utils.book_append_sheet(
      workbook,
      ws,
      "VENCIDOS",
    );
  }

  const upcomingLots =
    withDays.filter(
      (lot) =>
        lot.days >= 0 &&
        lot.days <= 30 &&
        lot.qty > 0,
    );

  if (upcomingLots.length > 0) {
    const ws = buildSheet(
      headers,
      upcomingLots.map(lotRow),
    );

    setWidths(ws, widths);

    XLS.utils.book_append_sheet(
      workbook,
      ws,
      "POR VENCER",
    );
  }

  XLS.writeFile(
    workbook,
    `INAMBU_Lotes_${fmtDate()}.xlsx`,
  );
}

export function exportInventoryValueExcel(
  products: Product[],
  suppliers: Supplier[],
) {
  exportProductsExcel(
    products,
    suppliers,
  );
}