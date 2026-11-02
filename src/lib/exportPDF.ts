import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  Product,
  Movement,
  Supplier,
  Lot,
} from "../store/AppContext";

const COMPANY_NAME = "Consorcio Inambú";

const fmtDate = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toSafeNumber = (
  value: unknown,
  fallback = 0,
): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// Las fechas del sistema vienen como "AAAA-MM-DD". Se leen como fecha local
// para que no se muestre un día antes por la zona horaria.
const fmtDateOnly = (value?: string): string => {
  if (!value) return "—";

  const text = String(value).trim();
  if (!text) return "—";

  const date = new Date(`${text}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleDateString("es-PE");
};

function header(doc: jsPDF, title: string): void {
  doc.setFillColor(13, 61, 38);

  doc.rect(
    0,
    0,
    doc.internal.pageSize.getWidth(),
    30,
    "F",
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.text(COMPANY_NAME, 14, 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(title, 14, 22);

  doc.setTextColor(60, 70, 80);
}

function footer(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    const height = doc.internal.pageSize.getHeight();
    const width = doc.internal.pageSize.getWidth();

    doc.setFontSize(8);
    doc.setTextColor(120, 130, 140);

    doc.text(
      `Generado: ${fmtDate()}`,
      14,
      height - 8,
    );

    doc.text(
      `Página ${page} de ${pageCount}`,
      width - 14,
      height - 8,
      { align: "right" },
    );
  }
}

function getSupplierName(
  supplierId: string | undefined,
  suppliers: Supplier[],
): string {
  if (!supplierId) return "—";

  return (
    suppliers.find(
      (supplier) =>
        String(supplier.id) === String(supplierId),
    )?.name || "—"
  );
}

function getHistoricalLotBalance(
  movement: Movement,
): number {
  const allocations = (
    movement as Movement & {
      lotAllocations?: Array<{
        lotId?: string;
        lotNumber?: string;
        qty?: number;
        remainingAfter?: number;
      }>;
    }
  ).lotAllocations;

  if (allocations && allocations.length > 0) {
    const exact =
      allocations.find(
        (allocation) =>
          (
            String(allocation.lotId ?? "") ===
            String(movement.lotId ?? "")
          ) ||
          (
            String(allocation.lotNumber ?? "")
              .trim()
              .toLowerCase() ===
            String(movement.lotNumber ?? "")
              .trim()
              .toLowerCase()
          ),
      ) || allocations[0];

    if (exact?.remainingAfter !== undefined) {
      return toSafeNumber(exact.remainingAfter);
    }
  }

  return toSafeNumber(movement.balance);
}

function movementRow(
  movement: Movement,
  suppliers: Supplier[],
  products: Product[],
): string[] {
  const counterpart =
    movement.type === "Entrada"
      ? getSupplierName(movement.supplierId, suppliers)
      : movement.client || getSupplierName(movement.supplierId, suppliers);

  const product = products.find(
    (item) => item.id === movement.productId,
  );

  const safeQty = toSafeNumber(movement.qty);
  const safeBalance = toSafeNumber(movement.balance);
  const grams =
    movement.gramsPerUnit || product?.gramsPerUnit || 0;

  return [
    fmtDateOnly(movement.date),
    movement.type || "—",
    movement.productName || "—",
    product?.brand || "Sin marca",
    movement.presentation || product?.presentation || "—",
    movement.sku || "—",
    movement.lotNumber || "—",
    movement.productionDate
      ? fmtDateOnly(movement.productionDate)
      : "—",
    movement.expiryDate
      ? fmtDateOnly(movement.expiryDate)
      : "—",
    String(safeQty),
    grams ? `${grams.toLocaleString("es-PE")} g` : "—",
    String(getHistoricalLotBalance(movement)),
    String(safeBalance),
    movement.reference || "—",
    counterpart,
    movement.notes || "—",
  ];
}

function createMovementPDF(
  movements: Movement[],
  suppliers: Supplier[],
  title: string,
  products: Product[],
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  header(doc, title);

  const entries = movements.filter(
    (movement) => movement.type === "Entrada",
  );

  const exits = movements.filter(
    (movement) => movement.type === "Salida",
  );

  doc.setFontSize(9);
  doc.setTextColor(70, 80, 90);

  doc.text(
    `Movimientos: ${movements.length}`,
    14,
    38,
  );

  doc.text(
    `Entradas: ${entries.length}`,
    70,
    38,
  );

  doc.text(
    `Salidas: ${exits.length}`,
    120,
    38,
  );

  autoTable(doc, {
    startY: 44,

    head: [
      [
        "Fecha",
        "Tipo",
        "Producto",
        "Marca",
        "Presentación",
        "SKU",
        "N.º lote",
        "F. producción",
        "F. vencimiento",
        "Cantidad",
        "Gramos por unidad",
        "Stock final lote",
        "Stock general",
        "Referencia",
        "Proveedor / Cliente",
        "Observaciones",
      ],
    ],

    body: movements.map((movement) =>
      movementRow(movement, suppliers, products),
    ),

    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      overflow: "linebreak",
      valign: "middle",
    },

    headStyles: {
      fillColor: [26, 92, 64],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },

    alternateRowStyles: {
      fillColor: [245, 248, 246],
    },

    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 14 },
      2: { cellWidth: 26 },
      3: { cellWidth: 14 },
      4: { cellWidth: 18 },
      5: { cellWidth: 14 },
      6: { cellWidth: 18 },
      7: { cellWidth: 17 },
      8: { cellWidth: 17 },
      9: { cellWidth: 12, halign: "right" },
      10: { cellWidth: 13, halign: "right" },
      11: { cellWidth: 14, halign: "right" },
      12: { cellWidth: 14, halign: "right" },
      13: { cellWidth: 15 },
      14: { cellWidth: 22 },
      15: { cellWidth: 22 },
    },
  });

  footer(doc);

  const safeTitle = title
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, "_")
    .replace(/^_+|_+$/g, "");

  doc.save(`INAMBU_${safeTitle}_${fmtDate()}.pdf`);
}

// Uso: exportMovementsPDF(movimientos, proveedores, "Título", productos)
// También acepta: exportMovementsPDF(movimientos, "Título")
export function exportMovementsPDF(
  movements: Movement[],
  suppliersOrTitle?: Supplier[] | string,
  title = "Movimientos",
  products: Product[] = [],
): void {
  const suppliers = Array.isArray(suppliersOrTitle)
    ? suppliersOrTitle
    : [];

  if (typeof suppliersOrTitle === "string") {
    title = suppliersOrTitle;
  }

  createMovementPDF(movements, suppliers, title, products);
}

export function exportProductsPDF(
  products: Product[],
  suppliers: Supplier[] = [],
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  header(doc, "Reporte de alimentos e inventario");

  const supplierMap = Object.fromEntries(
    suppliers.map((supplier) => [
      String(supplier.id),
      supplier.name,
    ]),
  );

  autoTable(doc, {
    startY: 38,

    head: [
      [
        "SKU",
        "Alimento",
        "Marca",
        "Presentación",
        "Gramos por unidad",
        "Stock actual",
        "Unidad",
        "Ubicación",
        "Proveedor",
        "Estado",
      ],
    ],

    body: products.map((product) => {
      const supplierName = product.supplierId
        ? supplierMap[String(product.supplierId)] || "—"
        : "—";

      return [
        product.sku || "—",
        product.name || "—",
        product.brand || "Sin marca",
        product.presentation || "No registrada",
        product.gramsPerUnit
          ? `${product.gramsPerUnit.toLocaleString("es-PE")} g`
          : "—",
        String(Number(product.stock || 0)),
        product.unit || "—",
        product.location || "—",
        supplierName,
        product.status || "—",
      ];
    }),

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },

    headStyles: {
      fillColor: [26, 92, 64],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },

    alternateRowStyles: {
      fillColor: [245, 248, 246],
    },
  });

  footer(doc);

  doc.save(`INAMBU_Alimentos_${fmtDate()}.pdf`);
}

export function exportSuppliersPDF(
  suppliers: Supplier[],
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  header(doc, "Directorio de proveedores");

  autoTable(doc, {
    startY: 38,

    head: [
      [
        "ID",
        "Nombre",
        "RUC / NIT",
        "Contacto",
        "Teléfono",
        "Email",
        "Dirección",
        "Condiciones de pago",
        "Días entrega",
        "Estado",
      ],
    ],

    body: suppliers.map((supplier) => [
      String(supplier.id ?? "—"),
      supplier.name || "—",
      supplier.ruc || "—",
      supplier.contact || "—",
      supplier.phone || "—",
      supplier.email || "—",
      supplier.address || "—",
      supplier.paymentTerms || "—",
      String(supplier.deliveryDays ?? "—"),
      supplier.status || "—",
    ]),

    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },

    headStyles: {
      fillColor: [26, 92, 64],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },

    alternateRowStyles: {
      fillColor: [245, 248, 246],
    },
  });

  footer(doc);

  doc.save(`INAMBU_Proveedores_${fmtDate()}.pdf`);
}

export function exportLotsPDF(lots: Lot[]): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  header(doc, "Control de lotes y trazabilidad");

  const today = new Date();

  const rows = lots.map((lot) => {
    const expiry = new Date(
      `${lot.expiryDate}T23:59:59`,
    );

    const validExpiry = !Number.isNaN(
      expiry.getTime(),
    );

    const days = validExpiry
      ? Math.ceil(
          (expiry.getTime() - today.getTime()) /
            86400000,
        )
      : 0;

    const qty = toSafeNumber(lot.qty);

    const status =
      qty <= 0
        ? "Agotado"
        : !validExpiry
          ? "Fecha inválida"
          : days < 0
            ? "Vencido"
            : days <= 7
              ? "Crítico"
              : days <= 30
                ? "Por vencer"
                : "Vigente";

    return [
      lot.id || "—",
      lot.lotNumber || "—",
      lot.sku || "—",
      lot.productName || "—",
      fmtDateOnly(lot.productionDate),
      fmtDateOnly(lot.expiryDate),
      !validExpiry
        ? "—"
        : days < 0
          ? "VENCIDO"
          : String(days),
      String(qty),
      fmtDateOnly(lot.receivedDate),
      status,
    ];
  });

  autoTable(doc, {
    startY: 38,

    head: [
      [
        "ID lote",
        "N.º lote",
        "SKU",
        "Alimento",
        "F. producción",
        "F. vencimiento",
        "Días restantes",
        "Cantidad disponible",
        "Fecha recepción",
        "Estado",
      ],
    ],

    body: rows,

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },

    headStyles: {
      fillColor: [26, 92, 64],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },

    alternateRowStyles: {
      fillColor: [245, 248, 246],
    },
  });

  footer(doc);

  doc.save(`INAMBU_Lotes_${fmtDate()}.pdf`);
}

export function exportInventoryValuePDF(
  products: Product[],
  suppliers: Supplier[] = [],
): void {
  exportProductsPDF(products, suppliers);
}