import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  Product,
  Movement,
  Supplier,
  Lot,
} from "../store/AppContext";

const COMPANY_NAME = "Consorcio Inambú";

function fmtDate() {
  return new Date().toLocaleDateString(
    "es-PE",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}

function fmtDateTime() {
  return new Date().toLocaleString(
    "es-PE",
  );
}

function fmtPEN(value: number) {
  return (
    "S/ " +
    Number(value || 0).toLocaleString(
      "es-PE",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )
  );
}

function addHeader(
  doc: jsPDF,
  title: string,
  subtitle?: string,
) {
  doc.setFillColor(
    8,
    11,
    16,
  );

  doc.rect(
    0,
    0,
    210,
    28,
    "F",
  );

  doc.setTextColor(
    245,
    178,
    27,
  );

  doc.setFontSize(16);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.text(
    COMPANY_NAME,
    14,
    12,
  );

  doc.setTextColor(
    180,
    196,
    207,
  );

  doc.setFontSize(11);

  doc.text(
    title,
    14,
    21,
  );

  if (subtitle) {
    doc.setTextColor(
      100,
      116,
      139,
    );

    doc.setFontSize(8);

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.text(
      subtitle,
      14,
      26,
    );
  }

  doc.setTextColor(
    100,
    116,
    139,
  );

  doc.setFontSize(8);

  doc.text(
    fmtDateTime(),
    196,
    12,
    {
      align: "right",
    },
  );

  doc.text(
    "Sistema de Almacenes",
    196,
    18,
    {
      align: "right",
    },
  );

  return 34;
}

function addFooter(
  doc: jsPDF,
) {
  const pageCount =
    doc.getNumberOfPages();

  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {
    doc.setPage(page);

    doc.setDrawColor(
      26,
      34,
      50,
    );

    doc.setLineWidth(0.3);

    doc.line(
      14,
      287,
      196,
      287,
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      100,
      116,
      139,
    );

    doc.text(
      `${COMPANY_NAME} — Sistema de Almacenes`,
      14,
      292,
    );

    doc.text(
      `Página ${page} de ${pageCount}`,
      196,
      292,
      {
        align: "right",
      },
    );

    doc.text(
      fmtDate(),
      105,
      292,
      {
        align: "center",
      },
    );
  }
}

const tableStyles = {
  fontSize: 7.5,
  cellPadding: 2.5,
  textColor: [
    180,
    196,
    207,
  ] as [
    number,
    number,
    number,
  ],
};

const tableHeadStyles = {
  fillColor: [
    14,
    18,
    25,
  ] as [
    number,
    number,
    number,
  ],
  textColor: [
    75,
    90,
    107,
  ] as [
    number,
    number,
    number,
  ],
  fontStyle: "bold" as const,
  fontSize: 7,
  lineWidth: 0.1,
  lineColor: [
    26,
    34,
    50,
  ] as [
    number,
    number,
    number,
  ],
};

const tableBodyStyles = {
  fillColor: [
    8,
    11,
    16,
  ] as [
    number,
    number,
    number,
  ],
  lineColor: [
    20,
    27,
    36,
  ] as [
    number,
    number,
    number,
  ],
  lineWidth: 0.1,
};

export function exportProductsPDF(
  products: Product[],
  suppliers: Supplier[],
) {
  const supplierMap =
    Object.fromEntries(
      suppliers.map((supplier) => [
        String(supplier.id),
        supplier.name,
      ]),
    );

  const doc = new jsPDF({
    orientation: "landscape",
  });

  const totalValue =
    products.reduce(
      (total, product) =>
        total +
        product.stock *
          product.costPrice,
      0,
    );

  const startY = addHeader(
    doc,
    "Reporte de Inventario — Productos",
    `${products.length} productos registrados · Valor total: ${fmtPEN(
      totalValue,
    )}`,
  );

  const kpis = [
    {
      label: "Productos Activos",
      value: String(
        products.filter(
          (product) =>
            product.status ===
            "Activo",
        ).length,
      ),
    },
    {
      label: "Agotados",
      value: String(
        products.filter(
          (product) =>
            product.stock === 0,
        ).length,
      ),
    },
    {
      label: "Stock Crítico",
      value: String(
        products.filter(
          (product) =>
            product.stock > 0 &&
            product.stock <=
              product.minStock,
        ).length,
      ),
    },
    {
      label: "Valor Total",
      value: fmtPEN(totalValue),
    },
  ];

  kpis.forEach(
    (kpi, index) => {
      const x =
        14 + index * 68;

      doc.setFillColor(
        14,
        18,
        25,
      );

      doc.setDrawColor(
        26,
        34,
        50,
      );

      doc.roundedRect(
        x,
        startY,
        62,
        16,
        2,
        2,
        "FD",
      );

      doc.setFontSize(7);

      doc.setTextColor(
        75,
        90,
        107,
      );

      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.text(
        kpi.label.toUpperCase(),
        x + 4,
        startY + 5.5,
      );

      doc.setFontSize(11);

      doc.setTextColor(
        0,
        200,
        150,
      );

      doc.text(
        kpi.value,
        x + 4,
        startY + 13,
      );
    },
  );

  autoTable(doc, {
    startY: startY + 22,

    head: [
      [
        "SKU",
        "Nombre",
        "Categoría",
        "Costo",
        "Venta",
        "Stock",
        "Mín.",
        "Ubicación",
        "Proveedor",
        "Estado",
      ],
    ],

    body: products.map(
      (product) => [
        product.sku,
        product.name,
        product.category,
        fmtPEN(
          product.costPrice,
        ),
        fmtPEN(
          product.salePrice,
        ),
        product.stock,
        product.minStock,
        product.location,
        supplierMap[
          String(
            product.supplierId,
          )
        ] || "—",
        product.status,
      ],
    ),

    styles: tableStyles,

    headStyles: tableHeadStyles,

    alternateRowStyles: {
      fillColor: [
        11,
        15,
        22,
      ],
    },

    bodyStyles: tableBodyStyles,

    columnStyles: {
      0: {
        cellWidth: 20,
        textColor: [
          0,
          200,
          150,
        ],
      },

      1: {
        cellWidth: 50,
      },

      3: {
        halign: "right",
      },

      4: {
        halign: "right",
      },

      5: {
        halign: "right",
        fontStyle: "bold",
      },
    },
  });

  addFooter(doc);

  doc.save(
    `INAMBU_Productos_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
}

export function exportMovementsPDF(
  movements: Movement[],
  suppliers: Supplier[] = [],
  title = "Movimientos",
) {
  const supplierMap =
    Object.fromEntries(
      suppliers.map((supplier) => [
        String(supplier.id),
        supplier.name,
      ]),
    );

  const doc = new jsPDF({
    orientation: "landscape",
  });

  const entriesTotal =
    movements
      .filter(
        (movement) =>
          movement.type ===
          "Entrada",
      )
      .reduce(
        (total, movement) =>
          total +
          Number(
            movement.total || 0,
          ),
        0,
      );

  const exitsTotal =
    movements
      .filter(
        (movement) =>
          movement.type ===
          "Salida",
      )
      .reduce(
        (total, movement) =>
          total +
          Number(
            movement.total || 0,
          ),
        0,
      );

  const startY = addHeader(
    doc,
    `Kárdex — ${title}`,
    `${movements.length} movimientos · Entradas: ${fmtPEN(
      entriesTotal,
    )} · Salidas: ${fmtPEN(
      exitsTotal,
    )}`,
  );

  autoTable(doc, {
    startY: startY + 4,

    head: [
      [
        "ID",
        "Fecha",
        "Tipo",
        "SKU",
        "Producto",
        "Cant.",
        "P.Unit.",
        "Total",
        "Saldo",
        "Referencia",
        "Proveedor / Cliente",
        "Usuario",
      ],
    ],

    body: movements.map(
      (movement) => {
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

          `${
            movement.type ===
              "Entrada" ||
            movement.type ===
              "Devolución"
              ? "+"
              : "-"
          }${movement.qty}`,

          fmtPEN(
            Number(
              movement.unitCost || 0,
            ),
          ),

          fmtPEN(
            Number(
              movement.total || 0,
            ),
          ),

          movement.balance,

          movement.reference ||
            "—",

          counterpart,

          movement.user || "—",
        ];
      },
    ),

    styles: tableStyles,

    headStyles: tableHeadStyles,

    alternateRowStyles: {
      fillColor: [
        11,
        15,
        22,
      ],
    },

    bodyStyles: tableBodyStyles,

    columnStyles: {
      0: {
        textColor: [
          75,
          90,
          107,
        ],
        fontSize: 6.5,
      },

      2: {
        fontStyle: "bold",
      },

      5: {
        halign: "right",
        fontStyle: "bold",
      },

      6: {
        halign: "right",
      },

      7: {
        halign: "right",
        fontStyle: "bold",
      },

      8: {
        halign: "right",
      },

      10: {
        cellWidth: 38,
      },
    },

    didParseCell(data) {
      if (
        data.section === "body" &&
        data.column.index === 2
      ) {
        const value = String(
          data.cell.text,
        );

        if (value === "Entrada") {
          data.cell.styles.textColor =
            [0, 200, 150];
        } else if (
          value === "Salida"
        ) {
          data.cell.styles.textColor =
            [248, 113, 113];
        } else if (
          value === "Ajuste"
        ) {
          data.cell.styles.textColor =
            [251, 191, 36];
        } else {
          data.cell.styles.textColor =
            [96, 165, 250];
        }
      }
    },
  });

  addFooter(doc);

  doc.save(
    `INAMBU_${title.replace(
      /\s+/g,
      "_",
    )}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
}

export function exportSuppliersPDF(
  suppliers: Supplier[],
) {
  const doc = new jsPDF({
    orientation: "landscape",
  });

  const active =
    suppliers.filter(
      (supplier) =>
        supplier.status ===
        "Activo",
    ).length;

  const inactive =
    suppliers.filter(
      (supplier) =>
        supplier.status ===
        "Inactivo",
    ).length;

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

  const startY = addHeader(
    doc,
    "Reporte de Proveedores",
    `${suppliers.length} proveedores registrados · Activos: ${active} · Inactivos: ${inactive}`,
  );

  doc.setFillColor(
    14,
    18,
    25,
  );

  doc.setDrawColor(
    26,
    34,
    50,
  );

  doc.roundedRect(
    14,
    startY,
    56,
    16,
    2,
    2,
    "FD",
  );

  doc.setFontSize(7);

  doc.setTextColor(
    75,
    90,
    107,
  );

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.text(
    "TOTAL PROVEEDORES",
    18,
    startY + 5.5,
  );

  doc.setFontSize(11);

  doc.setTextColor(
    0,
    200,
    150,
  );

  doc.text(
    String(suppliers.length),
    18,
    startY + 13,
  );

  doc.setFillColor(
    14,
    18,
    25,
  );

  doc.setDrawColor(
    26,
    34,
    50,
  );

  doc.roundedRect(
    76,
    startY,
    56,
    16,
    2,
    2,
    "FD",
  );

  doc.setFontSize(7);

  doc.setTextColor(
    75,
    90,
    107,
  );

  doc.text(
    "PROVEEDORES ACTIVOS",
    80,
    startY + 5.5,
  );

  doc.setFontSize(11);

  doc.setTextColor(
    0,
    200,
    150,
  );

  doc.text(
    String(active),
    80,
    startY + 13,
  );

  doc.setFillColor(
    14,
    18,
    25,
  );

  doc.setDrawColor(
    26,
    34,
    50,
  );

  doc.roundedRect(
    138,
    startY,
    56,
    16,
    2,
    2,
    "FD",
  );

  doc.setFontSize(7);

  doc.setTextColor(
    75,
    90,
    107,
  );

  doc.text(
    "CALIFICACIÓN PROMEDIO",
    142,
    startY + 5.5,
  );

  doc.setFontSize(11);

  doc.setTextColor(
    251,
    191,
    36,
  );

  doc.text(
    `${averageRating.toFixed(1)}/5`,
    142,
    startY + 13,
  );

  autoTable(doc, {
    startY: startY + 22,

    head: [
      [
        "ID",
        "Razón Social / Nombre",
        "RUC",
        "Contacto",
        "Teléfono",
        "Email",
        "Dirección",
        "Cond. Pago",
        "Días Ent.",
        "Calif.",
        "Estado",
        "Notas",
      ],
    ],

    body: suppliers.map(
      (supplier) => [
        supplier.id,
        supplier.name || "—",
        supplier.ruc || "—",
        supplier.contact || "—",
        supplier.phone || "—",
        supplier.email || "—",
        supplier.address || "—",
        supplier.paymentTerms ||
          "—",
        supplier.deliveryDays ??
          "—",
        `${Number(
          supplier.rating || 0,
        ).toFixed(1)}/5`,
        supplier.status || "—",
        supplier.notes || "—",
      ],
    ),

    styles: {
      fontSize: 6.8,
      cellPadding: 2.2,
      textColor: [
        180,
        196,
        207,
      ],
    },

    headStyles: {
      fillColor: [
        14,
        18,
        25,
      ],
      textColor: [
        75,
        90,
        107,
      ],
      fontStyle: "bold",
      fontSize: 6.5,
      lineWidth: 0.1,
      lineColor: [
        26,
        34,
        50,
      ],
    },

    alternateRowStyles: {
      fillColor: [
        11,
        15,
        22,
      ],
    },

    bodyStyles: {
      fillColor: [
        8,
        11,
        16,
      ],
      lineColor: [
        20,
        27,
        36,
      ],
      lineWidth: 0.1,
    },

    columnStyles: {
      0: {
        textColor: [
          0,
          200,
          150,
        ],
        cellWidth: 14,
      },

      1: {
        cellWidth: 34,
      },

      2: {
        cellWidth: 18,
      },

      3: {
        cellWidth: 24,
      },

      4: {
        cellWidth: 18,
      },

      5: {
        cellWidth: 30,
      },

      6: {
        cellWidth: 34,
      },

      7: {
        cellWidth: 20,
      },

      8: {
        halign: "right",
        cellWidth: 13,
      },

      9: {
        halign: "center",
        cellWidth: 14,
      },

      10: {
        halign: "center",
        cellWidth: 14,
      },

      11: {
        cellWidth: 30,
      },
    },

    didParseCell(data) {
      if (
        data.section === "body" &&
        data.column.index === 10
      ) {
        const value = String(
          data.cell.text,
        );

        if (value === "Activo") {
          data.cell.styles.textColor =
            [0, 200, 150];

          data.cell.styles.fontStyle =
            "bold";
        }

        if (value === "Inactivo") {
          data.cell.styles.textColor =
            [248, 113, 113];

          data.cell.styles.fontStyle =
            "bold";
        }
      }
    },
  });

  addFooter(doc);

  doc.save(
    `INAMBU_Proveedores_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
}

export function exportLotsPDF(
  lots: Lot[],
) {
  const today = new Date();

  const withDays = lots.map(
    (lot) => ({
      ...lot,

      days: Math.floor(
        (new Date(
          lot.expiryDate,
        ).getTime() -
          today.getTime()) /
          86400000,
      ),
    }),
  );

  const expired =
    withDays.filter(
      (lot) =>
        lot.days < 0 &&
        lot.qty > 0,
    ).length;

  const critical =
    withDays.filter(
      (lot) =>
        lot.days >= 0 &&
        lot.days <= 7 &&
        lot.qty > 0,
    ).length;

  const doc = new jsPDF({
    orientation: "landscape",
  });

  const startY = addHeader(
    doc,
    "Control de Lotes y Trazabilidad",
    `${lots.length} lotes · ${expired} vencidos · ${critical} críticos`,
  );

  autoTable(doc, {
    startY: startY + 4,

    head: [
      [
        "ID Lote",
        "N° Lote",
        "SKU",
        "Producto",
        "Vencimiento",
        "Días Rest.",
        "Qty Disp.",
        "Costo Unit.",
        "F. Recepción",
        "Estado",
      ],
    ],

    body: withDays.map(
      (lot) => {
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
            : `${lot.days}d`,
          lot.qty,
          fmtPEN(
            lot.unitCost,
          ),
          lot.receivedDate,
          status,
        ];
      },
    ),

    styles: tableStyles,

    headStyles: tableHeadStyles,

    alternateRowStyles: {
      fillColor: [
        11,
        15,
        22,
      ],
    },

    bodyStyles: tableBodyStyles,

    columnStyles: {
      0: {
        textColor: [
          75,
          90,
          107,
        ],
        fontSize: 6.5,
      },

      1: {
        textColor: [
          167,
          139,
          250,
        ],
        fontStyle: "bold",
      },

      5: {
        halign: "right",
        fontStyle: "bold",
      },

      6: {
        halign: "right",
        fontStyle: "bold",
      },

      7: {
        halign: "right",
      },
    },

    didParseCell(data) {
      if (
        data.section === "body" &&
        data.column.index === 9
      ) {
        const value = String(
          data.cell.text,
        );

        if (
          value === "Vencido" ||
          value === "Crítico" ||
          value === "Agotado"
        ) {
          data.cell.styles.textColor =
            [248, 113, 113];
        } else if (
          value === "Por vencer"
        ) {
          data.cell.styles.textColor =
            [251, 191, 36];
        } else if (
          value === "Vigente"
        ) {
          data.cell.styles.textColor =
            [0, 200, 150];
        }
      }

      if (
        data.section === "body" &&
        data.column.index === 5
      ) {
        const value = String(
          data.cell.text,
        );

        if (value === "VENCIDO") {
          data.cell.styles.textColor =
            [248, 113, 113];
        }
      }
    },
  });

  addFooter(doc);

  doc.save(
    `INAMBU_Lotes_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
}