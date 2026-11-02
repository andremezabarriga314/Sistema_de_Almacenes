import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { exportProductsPDF } from "../lib/exportPDF";
import {
  exportProductControlExcel,
  exportImportedExcel,
  exportStyledTable,
  downloadOriginalFile,
} from "../lib/exportExcel";
import { ImportedSheetTable, analyzeSheet, filterSheetRows } from "./ImportedSheetView";

type MovementType = "Entrada" | "Salida";

const today = () => {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const emptyMovement = {
  type: "Entrada" as MovementType,
  productId: "",
  date: today(),
  productionDate: "",
  expiryDate: "",
  lotNumber: "",
  supplierId: "",
  qty: 1,
  gramsPerUnit: 0,
  presentation: "",
};

type Rec = Record<string, string>;
type FieldDef = { key: string; label: string; aliases: string[]; exclude?: string[]; align?: "right" };
type ParsedTable = { keys: Set<string>; records: Rec[] };

const norm = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const toNumber = (value: string | undefined): number => {
  const n = parseFloat(String(value ?? "").replace(/[^0-9.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.abs(n) : 0;
};

const visibleValues = (rec: Rec): string[] =>
  Object.entries(rec)
    .filter(([key]) => !key.startsWith("_"))
    .map(([, value]) => value);

// Filas del Excel que el usuario eliminó de la vista (se recuerdan por archivo)
const HIDDEN_KEY = "INAMBU_HIDDEN_EXCEL_ROWS";

const loadHidden = (): Record<string, string[]> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const movementKind = (rec: Rec): "Entrada" | "Salida" | "" => {
  const type = norm(rec._tipo || rec.tipo);
  if (/ingres|entrad/.test(type)) return "Entrada";
  if (/salid|egres/.test(type)) return "Salida";
  return "";
};

const INVENTORY_FIELDS: FieldDef[] = [
  { key: "codigo", label: "Código", aliases: ["sku", "codigo", "code"] },
  { key: "nombre", label: "Nombre del producto", aliases: ["nombre", "producto", "alimento", "descripcion"] },
  { key: "marca", label: "Marca", aliases: ["marca", "brand"] },
  { key: "gramos", label: "Gramos por unidad", aliases: ["gramos", "gramaje"], align: "right" },
  { key: "stock", label: "Stock en unidades", aliases: ["stock", "saldo", "unidades", "cantidad"], align: "right" },
  { key: "lotes", label: "Lotes disponibles", aliases: ["lote"] },
  { key: "ultimo", label: "Último movimiento", aliases: ["ultimo"] },
  { key: "estado", label: "Estado", aliases: ["estado", "status"] },
];

const MOVEMENT_FIELDS: FieldDef[] = [
  { key: "fecha", label: "Fecha", aliases: ["fecha"], exclude: ["produccion", "fabricacion", "vencimiento", "vence"] },
  { key: "tipo", label: "Movimiento", aliases: ["tipo", "movimiento"], exclude: ["ultimo"] },
  { key: "nombre", label: "Nombre del producto", aliases: ["nombre", "producto", "alimento", "descripcion"] },
  { key: "marca", label: "Marca", aliases: ["marca", "brand"] },
  { key: "lote", label: "Lote", aliases: ["lote"] },
  { key: "produccion", label: "Fecha de producción", aliases: ["produccion", "fabricacion"] },
  { key: "vencimiento", label: "Fecha de vencimiento", aliases: ["vencimiento", "vence", "caducidad"] },
  { key: "proveedor", label: "Proveedor", aliases: ["proveedor", "cliente"] },
  { key: "cantidad", label: "Cantidad", aliases: ["cantidad", "qty"], align: "right" },
  { key: "peso", label: "Peso total", aliases: ["peso"], align: "right" },
  { key: "saldo", label: "Saldo", aliases: ["saldo", "stock"], align: "right" },
];

// Busca la fila de encabezados que más columnas reconoce y devuelve los datos mapeados
function parseExcelTable(
  sheet: { name: string; rows: string[][] },
  fields: FieldDef[]
): ParsedTable | null {
  const matchRow = (row: string[]) => {
    const cells = row.map(norm);
    const used = new Set<number>();
    const map: Record<string, number> = {};

    fields.forEach((field) => {
      const idx = cells.findIndex(
        (cell, index) =>
          !used.has(index) &&
          cell !== "" &&
          field.aliases.some((alias) => cell.includes(alias)) &&
          !(field.exclude || []).some((word) => cell.includes(word))
      );

      if (idx >= 0) {
        used.add(idx);
        map[field.key] = idx;
      }
    });

    return map;
  };

  let best = { row: -1, map: {} as Record<string, number>, count: 0 };

  for (let i = 0; i < Math.min(sheet.rows.length, 15); i++) {
    const map = matchRow(sheet.rows[i]);
    const count = Object.keys(map).length;
    if (count > best.count) best = { row: i, map, count };
  }

  if (best.count < 2) return null;

  const records: Rec[] = [];

  sheet.rows.slice(best.row + 1).forEach((row, rowOffset) => {
    const record: Rec = {};
    let hasData = false;

    Object.entries(best.map).forEach(([key, index]) => {
      const value = String(row[index] ?? "").trim();
      record[key] = value;
      if (value) hasData = true;
    });

    // Clave única de la fila: sirve para poder ocultarla/eliminarla de la vista
    record._key = `${sheet.name}#${best.row + 1 + rowOffset}`;

    if (hasData) records.push(record);
  });

  return { keys: new Set(Object.keys(best.map)), records };
}

export default function Products() {
  const {
    products,
    suppliers,
    lots,
    movements,
    addProduct,
    addSupplier,
    updateProduct,
    deleteProduct,
    addMovement,
    deleteMovement,
    importedExcelFileName,
    importedExcelSheets,
    importedExcelFile,
    clearImportedExcelSheets,
  } = useApp();

  const [view, setView] = useState<"inventory" | "history" | "excel">(
    importedExcelSheets.length > 0 ? "excel" : "inventory"
  );
  const [activeExcelSheet, setActiveExcelSheet] = useState(0);
  const [historyType, setHistoryType] = useState<"Todos" | MovementType>("Todos");
  const [search, setSearch] = useState("");
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteScope, setDeleteScope] = useState<"selected" | "all" | "excel">("selected");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedExcelKeys, setSelectedExcelKeys] = useState<string[]>([]);
  const [hiddenMap, setHiddenMap] = useState<Record<string, string[]>>(loadHidden);
  const [movementForm, setMovementForm] = useState({ ...emptyMovement });
  const [productQuery, setProductQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [lotQuery, setLotQuery] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = products.find((product) => product.id === movementForm.productId);
  const availableLots = lots.filter((lot) => lot.productId === movementForm.productId && lot.qty > 0);
  const selectedLot = availableLots.find((lot) => lot.lotNumber === movementForm.lotNumber);

  const productSuggestions = products
    .filter(
      (product) =>
        product.status === "Activo" &&
        (!productQuery.trim() ||
          norm(product.name).includes(norm(productQuery)) ||
          norm(product.sku).includes(norm(productQuery)) ||
          norm(product.brand).includes(norm(productQuery)))
    )
    .slice(0, 6);

  const lotSuggestions = availableLots
    .filter((lot) => !lotQuery.trim() || norm(lot.lotNumber).includes(norm(lotQuery)))
    .slice(0, 6);

  const supplierSuggestions = suppliers
    .filter(
      (supplier) =>
        supplier.status === "Activo" &&
        (!supplierQuery.trim() || norm(supplier.name).includes(norm(supplierQuery)))
    )
    .slice(0, 6);

  const expiryDays = movementForm.expiryDate
    ? Math.floor(
        (new Date(`${movementForm.expiryDate}T23:59:59`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const filteredProducts = products.filter((product) => {
    const term = norm(search);
    return (
      !term ||
      norm(product.name).includes(term) ||
      norm(product.sku).includes(term) ||
      norm(product.brand).includes(term)
    );
  });

  const productMovements = useMemo(
    () =>
      movements.filter((movement) => {
        if (movement.type !== "Entrada" && movement.type !== "Salida") return false;
        if (historyType !== "Todos" && movement.type !== historyType) return false;

        const product = products.find((item) => item.id === movement.productId);
        const term = norm(search);

        return (
          !term ||
          norm(movement.productName).includes(term) ||
          norm(movement.lotNumber).includes(term) ||
          norm(movement.brand).includes(term) ||
          norm(product?.brand).includes(term)
        );
      }),
    [historyType, movements, products, search]
  );

  type ProductItem = (typeof products)[number];

  // ── Datos del Excel importado, mapeados a las columnas de cada vista ──
  const excelTables = useMemo(() => {
    const inventoryTables: ParsedTable[] = [];
    const movementTables: ParsedTable[] = [];

    importedExcelSheets.forEach((sheet) => {
      const sheetNorm = norm(sheet.name);
      const hint = /salid|egres/.test(sheetNorm) ? "Salida" : /ingres|entrad/.test(sheetNorm) ? "Entrada" : "";

      const movementTable = parseExcelTable(sheet, MOVEMENT_FIELDS);

      if (movementTable && movementTable.keys.has("nombre") && (movementTable.keys.has("tipo") || hint)) {
        movementTables.push({
          keys: movementTable.keys,
          records: movementTable.records.map((record) => ({ ...record, _tipo: record.tipo || hint })),
        });
        return;
      }

      const inventoryTable = parseExcelTable(sheet, INVENTORY_FIELDS);
      if (inventoryTable && inventoryTable.keys.has("nombre")) inventoryTables.push(inventoryTable);
    });

    return { inv: inventoryTables, mov: movementTables };
  }, [importedExcelSheets]);

  // Si el Excel trae una columna se muestra; si no, el encabezado desaparece
  const inventoryCols = excelTables.inv.length
    ? INVENTORY_FIELDS.filter((field) => excelTables.inv.some((table) => table.keys.has(field.key)))
    : INVENTORY_FIELDS;

  const movementCols = excelTables.mov.length
    ? MOVEMENT_FIELDS.filter((field) => excelTables.mov.some((table) => table.keys.has(field.key)))
    : MOVEMENT_FIELDS;

  const searchTerm = norm(search);

  // ── Pestaña "Excel importado": hoja activa, con búsqueda ──
  const excelSheetIndex = Math.min(activeExcelSheet, Math.max(importedExcelSheets.length - 1, 0));
  const excelSheet = importedExcelSheets[excelSheetIndex];
  const excelAnalysis = useMemo(() => (excelSheet ? analyzeSheet(excelSheet) : null), [excelSheet]);
  const excelRows = useMemo(
    () => (excelAnalysis ? filterSheetRows(excelAnalysis, search, "Todos") : []),
    [excelAnalysis, search]
  );

  const catalogInventoryRows = filteredProducts.map((product) => {
    const productLots = lots.filter((lot) => lot.productId === product.id && lot.qty > 0);

    const record: Rec = {
      codigo: product.sku,
      nombre: product.name,
      marca: product.brand || "Sin marca",
      gramos: product.gramsPerUnit ? `${product.gramsPerUnit.toLocaleString("es-PE")} g` : "—",
      stock: `${product.stock} unid.`,
      lotes: productLots.map((lot) => lot.lotNumber).join(", "),
      ultimo: product.lastMovement,
      estado: product.stock > 0 ? "Disponible" : "Agotado",
    };

    return { product, productLots, rec: record };
  });

  const catalogKeys = new Set(products.flatMap((product) => [norm(product.sku), norm(product.name)]));

  const hiddenKeys = new Set(hiddenMap[importedExcelFileName] || []);

  // Todas las filas de inventario del Excel que se muestran (sin las eliminadas ni las ya presentes en el catálogo)
  const excelInventoryAll = excelTables.inv
    .flatMap((table) => table.records)
    .filter((record) => {
      if (hiddenKeys.has(record._key)) return false;
      if (record.codigo && catalogKeys.has(norm(record.codigo))) return false;
      if (record.nombre && catalogKeys.has(norm(record.nombre))) return false;
      return true;
    });

  const excelInventoryRows = excelInventoryAll.filter(
    (record) => !searchTerm || visibleValues(record).some((value) => norm(value).includes(searchTerm))
  );

  const selectedCount = selectedProductIds.length + selectedExcelKeys.length;
  const allCount = products.length + excelInventoryAll.length;

  const catalogHistoryRows = productMovements.map((movement) => {
    const product = products.find((item) => item.id === movement.productId);
    const movementLot = lots.find(
      (lot) => lot.productId === movement.productId && lot.lotNumber === movement.lotNumber
    );
    const grams =
      movement.totalGrams || movement.qty * (movement.gramsPerUnit || product?.gramsPerUnit || 0);

    const record: Rec = {
      fecha: movement.date,
      tipo: movement.type,
      nombre: movement.productName,
      // La marca queda guardada en el propio movimiento
      marca: movement.brand || product?.brand || "Sin marca",
      lote: movement.lotNumber || "—",
      produccion: movement.productionDate || movementLot?.productionDate || "No registrada",
      vencimiento: movement.expiryDate || movementLot?.expiryDate || "No registrada",
      proveedor:
        suppliers.find((supplier) => supplier.id === (movement.supplierId || movementLot?.supplierId))?.name ||
        "No registrado",
      cantidad: `${movement.type === "Entrada" ? "+" : "−"}${movement.qty} unid.`,
      peso: `${grams.toLocaleString("es-PE")} g`,
      saldo: `${movement.balance} unid.`,
    };

    return { movement, rec: record };
  });

  const excelHistoryRows = excelTables.mov
    .flatMap((table) => table.records)
    .map((record) => ({ rec: record, kind: movementKind(record) }))
    .filter(({ rec, kind }) => {
      if (historyType !== "Todos" && kind !== historyType) return false;
      return !searchTerm || visibleValues(rec).some((value) => norm(value).includes(searchTerm));
    });

  const historyTotalCount = catalogHistoryRows.length + excelHistoryRows.length;

  const historyTotalUnits =
    productMovements.reduce((total, movement) => total + movement.qty, 0) +
    excelHistoryRows.reduce((total, { rec }) => total + toNumber(rec.cantidad), 0);

  const renderInventoryCell = (key: string, rec: Rec, product: ProductItem, productLots: typeof lots) => {
    switch (key) {
      case "codigo":
        return <td key={key} className="num" style={{ color: "#00C896" }}>{rec.codigo}</td>;
      case "nombre":
        return <td key={key} style={{ color: "#D1D9E2", fontWeight: 600 }}>{rec.nombre}</td>;
      case "gramos":
        return <td key={key} className="num" style={{ textAlign: "right" }}>{rec.gramos}</td>;
      case "stock":
        return (
          <td key={key} className="num" style={{ textAlign: "right", color: product.stock ? "#E2E8F0" : "#F87171", fontWeight: 700 }}>
            {rec.stock}
          </td>
        );
      case "lotes":
        return (
          <td key={key}>
            {productLots.length ? (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 260 }}>
                {productLots.slice(0, 3).map((lot) => (
                  <span key={lot.id} className="badge badge-blue" title={`${lot.qty} unidades disponibles`}>
                    {lot.lotNumber}
                  </span>
                ))}
                {productLots.length > 3 && <span className="badge badge-gray">+{productLots.length - 3} lotes</span>}
              </div>
            ) : (
              <span className="badge badge-gray">Sin lote</span>
            )}
          </td>
        );
      case "ultimo":
        return <td key={key} className="num">{rec.ultimo}</td>;
      case "estado":
        return (
          <td key={key}>
            <span className={`badge ${product.stock > 0 ? "badge-green" : "badge-red"}`}>{rec.estado}</span>
          </td>
        );
      default:
        return <td key={key}>{rec[key] ?? ""}</td>;
    }
  };

  const renderHistoryCell = (key: string, rec: Rec, kind: "Entrada" | "Salida" | "") => {
    switch (key) {
      case "fecha":
        return <td key={key} className="num">{rec.fecha}</td>;
      case "tipo":
        return (
          <td key={key}>
            <span className={`badge ${kind === "Entrada" ? "badge-green" : kind === "Salida" ? "badge-red" : "badge-gray"}`}>
              {rec.tipo || kind || "—"}
            </span>
          </td>
        );
      case "nombre":
        return <td key={key} style={{ color: "#D1D9E2", fontWeight: 600 }}>{rec.nombre}</td>;
      case "lote":
        return <td key={key} className="num" style={{ color: "#A78BFA" }}>{rec.lote || "—"}</td>;
      case "produccion":
      case "vencimiento":
        return <td key={key} className="num">{rec[key]}</td>;
      case "cantidad":
        return (
          <td
            key={key}
            className="num"
            style={{
              textAlign: "right",
              color: kind === "Entrada" ? "#00C896" : kind === "Salida" ? "#F87171" : "#E2E8F0",
              fontWeight: 700,
            }}
          >
            {rec.cantidad}
          </td>
        );
      case "peso":
      case "saldo":
        return <td key={key} className="num" style={{ textAlign: "right" }}>{rec[key]}</td>;
      default:
        return <td key={key}>{rec[key] ?? ""}</td>;
    }
  };

  // ── Exportar ──
  const exportExcelFile = () => {
    if (importedExcelSheets.length) {
      // El archivo importado se devuelve idéntico al original, sin ningún cambio
      if (importedExcelFile) {
        downloadOriginalFile(importedExcelFile, importedExcelFileName || "Excel_importado.xlsx");
      } else {
        exportImportedExcel(importedExcelSheets, importedExcelFileName || "Excel_importado");
      }
      return;
    }

    exportProductControlExcel(products, movements, lots, suppliers);
  };

  const exportExcelDesigned = () => {
    exportImportedExcel(importedExcelSheets, importedExcelFileName || "Excel_importado");
  };

  const exportHistoryView = () => {
    const headers = movementCols.map((column) => column.label);

    const body = [
      ...catalogHistoryRows.map(({ rec }) => movementCols.map((column) => rec[column.key] ?? "")),
      ...excelHistoryRows.map(({ rec }) => movementCols.map((column) => rec[column.key] ?? "")),
    ];

    if (!body.length) {
      alert("No hay movimientos para exportar en esta vista.");
      return;
    }

    const label = historyType === "Todos" ? "Movimientos" : historyType === "Entrada" ? "Ingresos" : "Salidas";

    exportStyledTable({
      title: `HISTORIAL DE ${label.toUpperCase()}`,
      headers,
      rows: body,
      sheetName: label,
      fileName: `Historial_${label}_${today()}.xlsx`,
    });
  };

  // ── Movimientos ──
  const resetMovement = (type: MovementType = "Entrada") => {
    setMovementForm({ ...emptyMovement, type, date: today() });
    setProductQuery("");
    setBrandQuery("");
    setSupplierQuery("");
    setLotQuery("");
    setError("");
  };

  const openMovement = (type: MovementType) => {
    resetMovement(type);
    setShowMovementModal(true);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  };

  const toggleExcelSelection = (key: string) => {
    setSelectedExcelKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const allVisibleSelected =
    filteredProducts.length + excelInventoryRows.length > 0 &&
    filteredProducts.every((product) => selectedProductIds.includes(product.id)) &&
    excelInventoryRows.every((record) => selectedExcelKeys.includes(record._key));

  const toggleAllFilteredProducts = () => {
    const productIds = filteredProducts.map((product) => product.id);
    const excelKeys = excelInventoryRows.map((record) => record._key);

    if (allVisibleSelected) {
      setSelectedProductIds((current) => current.filter((id) => !productIds.includes(id)));
      setSelectedExcelKeys((current) => current.filter((key) => !excelKeys.includes(key)));
    } else {
      setSelectedProductIds((current) => [...new Set([...current, ...productIds])]);
      setSelectedExcelKeys((current) => [...new Set([...current, ...excelKeys])]);
    }
  };

  // Oculta filas del Excel de la vista y lo recuerda para ese archivo
  const hideExcelRows = (keys: string[]) => {
    if (!keys.length) return;

    setHiddenMap((current) => {
      const next = {
        ...current,
        [importedExcelFileName]: [...new Set([...(current[importedExcelFileName] || []), ...keys])],
      };
      try {
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      } catch {
        /* sin espacio: la vista sigue funcionando en esta sesión */
      }
      return next;
    });
  };

  const showHiddenExcelRows = () => {
    setHiddenMap((current) => {
      const next = { ...current, [importedExcelFileName]: [] };
      try {
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      } catch {
        /* ignorar */
      }
      return next;
    });
  };

  // Filas del Excel que corresponden a unos productos (por código o nombre)
  const excelKeysMatching = (targets: { sku: string; name: string }[]) => {
    const names = new Set(targets.flatMap((item) => [norm(item.sku), norm(item.name)]));

    return excelTables.inv
      .flatMap((table) => table.records)
      .filter(
        (record) =>
          (record.codigo && names.has(norm(record.codigo))) || (record.nombre && names.has(norm(record.nombre)))
      )
      .map((record) => record._key);
  };

  // Elimina un producto del catálogo y también su fila del Excel (si no, reaparecería)
  const removeProduct = (product: ProductItem) => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;

    hideExcelRows(excelKeysMatching([product]));
    deleteProduct(product.id);
    setSelectedProductIds((current) => current.filter((id) => id !== product.id));
  };

  const confirmProductDeletion = () => {
    // Quitar solo el Excel importado (el archivo original en tu disco no se toca)
    if (deleteScope === "excel") {
      clearImportedExcelSheets();
      setView("inventory");
      setShowDeleteModal(false);
      return;
    }

    const ids = deleteScope === "all" ? products.map((product) => product.id) : selectedProductIds;
    const deleted = products.filter((product) => ids.includes(product.id));

    const keysToHide = new Set<string>();

    if (deleteScope === "all") {
      excelTables.inv.flatMap((table) => table.records).forEach((record) => keysToHide.add(record._key));
    } else {
      selectedExcelKeys.forEach((key) => keysToHide.add(key));
      excelKeysMatching(deleted).forEach((key) => keysToHide.add(key));
    }

    hideExcelRows([...keysToHide]);
    ids.forEach((id) => deleteProduct(id));

    setSelectedProductIds([]);
    setSelectedExcelKeys([]);
    setShowDeleteModal(false);
  };

  const registerMovement = () => {
    setError("");

    const productName = productQuery.trim();
    const brandName = brandQuery.trim();
    const presentation = movementForm.presentation.trim();
    const lotNumberInput = movementForm.lotNumber.trim();
    const supplierName = supplierQuery.trim();

    if (!productName) {
      setError("Escribe el nombre del producto.");
      return;
    }

    if (movementForm.type === "Salida" && !selectedProduct) {
      setError("Para registrar una salida debes seleccionar un producto guardado.");
      return;
    }

    // La marca es obligatoria en cada ingreso (si el producto ya la tiene, viene rellenada)
    if (movementForm.type === "Entrada" && !brandName) {
      setError("Escribe la marca del producto.");
      return;
    }

    if (movementForm.type === "Entrada" && !selectedProduct && !presentation) {
      setError("Escribe la presentación del producto.");
      return;
    }

    if (!movementForm.date) {
      setError("Escribe la fecha de ingreso o salida.");
      return;
    }

    if (movementForm.type === "Entrada" && !lotNumberInput) {
      setError("Escribe el lote del ingreso.");
      return;
    }

    if (!Number.isInteger(movementForm.qty) || movementForm.qty <= 0) {
      setError("La cantidad debe ser un número entero mayor que cero.");
      return;
    }

    if (!Number.isFinite(movementForm.gramsPerUnit) || movementForm.gramsPerUnit <= 0) {
      setError("Escribe cuántos gramos contiene cada unidad.");
      return;
    }

    if (movementForm.type === "Entrada") {
      if (!supplierName) {
        setError("Escribe el nombre del proveedor.");
        return;
      }

      if (!movementForm.productionDate) {
        setError("Escribe la fecha de producción.");
        return;
      }

      if (!movementForm.expiryDate) {
        setError("Escribe la fecha de vencimiento.");
        return;
      }

      if (movementForm.productionDate > movementForm.expiryDate) {
        setError("La fecha de producción no puede ser posterior al vencimiento.");
        return;
      }

      if (movementForm.expiryDate < today()) {
        setError("El lote está vencido. Revisa la fecha de vencimiento.");
        return;
      }

      if (selectedProduct) {
        const repeatedLot = lots.find(
          (lot) => lot.productId === selectedProduct.id && norm(lot.lotNumber) === norm(lotNumberInput)
        );

        if (
          repeatedLot &&
          (repeatedLot.expiryDate !== movementForm.expiryDate ||
            (repeatedLot.productionDate && repeatedLot.productionDate !== movementForm.productionDate))
        ) {
          setError("Ese lote ya existe con fechas diferentes.");
          return;
        }
      }
    } else {
      if (!selectedLot) {
        setError("Selecciona el lote que debe descontarse.");
        return;
      }

      if (selectedLot.qty < movementForm.qty) {
        setError(`El lote ${selectedLot.lotNumber} solo tiene ${selectedLot.qty} unidades disponibles.`);
        return;
      }
    }

    try {
      let resolvedSupplierId = movementForm.supplierId;

      if (movementForm.type === "Entrada") {
        const existingSupplier = suppliers.find((supplier) => norm(supplier.name) === norm(supplierName));

        if (existingSupplier) {
          resolvedSupplierId = existingSupplier.id;
        } else {
          const newSupplier = addSupplier({
            name: supplierName,
            ruc: "",
            contact: "",
            phone: "",
            email: "",
            address: "",
            paymentTerms: "",
            deliveryDays: 0,
            rating: 0,
            status: "Activo",
            notes: "Creado automáticamente desde un ingreso",
          });

          resolvedSupplierId = newSupplier.id;
        }
      }

      // ── Producto NUEVO: se crea junto con su lote y su ingreso en un solo paso ──
      if (!selectedProduct && movementForm.type === "Entrada") {
        const baseSku =
          productName
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 12) || "PRODUCTO";

        let sku = baseSku;
        let suffix = 2;

        while (products.some((product) => norm(product.sku) === norm(sku))) {
          sku = `${baseSku.slice(0, 9)}-${suffix++}`;
        }

        addProduct(
          {
            sku,
            name: productName,
            brand: brandName,
            presentation,
            gramsPerUnit: movementForm.gramsPerUnit,
            costPrice: 0,
            salePrice: 0,
            stock: movementForm.qty,
            unit: "Unidad",
            location: "",
            supplierId: resolvedSupplierId,
            status: "Activo",
            storageTemp: "Ambiente (15–25 °C)",
          },
          {
            lotNumber: lotNumberInput,
            productionDate: movementForm.productionDate,
            expiryDate: movementForm.expiryDate,
            qty: movementForm.qty,
            receivedDate: movementForm.date,
            supplierId: resolvedSupplierId,
            reference: `ING-${Date.now().toString().slice(-8)}`,
          }
        );

        setShowMovementModal(false);
        setView("history");
        resetMovement();
        return;
      }

      // ── Producto que ya existe ──
      const movementProduct = selectedProduct;

      if (!movementProduct) {
        setError("No se pudo identificar el producto.");
        return;
      }

      // Si el producto existía sin marca, se guarda la marca escrita en este ingreso
      const movementBrand = movementProduct.brand || brandName;
      const productPatch: { brand?: string; gramsPerUnit?: number } = {};

      if (!movementProduct.brand && brandName) productPatch.brand = brandName;
      if (movementProduct.gramsPerUnit !== movementForm.gramsPerUnit) {
        productPatch.gramsPerUnit = movementForm.gramsPerUnit;
      }
      if (Object.keys(productPatch).length) updateProduct(movementProduct.id, productPatch);

      const productionDate =
        movementForm.type === "Entrada" ? movementForm.productionDate : selectedLot?.productionDate || "";

      const expiryDate =
        movementForm.type === "Entrada" ? movementForm.expiryDate : selectedLot?.expiryDate || "";

      const lotNumber =
        movementForm.type === "Entrada" ? lotNumberInput : selectedLot?.lotNumber || "";

      const movementPayload = {
        date: movementForm.date,
        type: movementForm.type,
        productId: movementProduct.id,
        productName: movementProduct.name,
        sku: movementProduct.sku,
        brand: movementBrand,
        presentation: movementProduct.presentation || presentation,
        qty: movementForm.qty,
        gramsPerUnit: movementForm.gramsPerUnit,
        totalGrams: movementForm.qty * movementForm.gramsPerUnit,
        unitCost: movementProduct.costPrice,
        total: movementForm.qty * movementProduct.costPrice,
        balance:
          movementForm.type === "Entrada"
            ? movementProduct.stock + movementForm.qty
            : movementProduct.stock - movementForm.qty,
        reference: `${movementForm.type === "Entrada" ? "ING" : "SAL"}-${Date.now().toString().slice(-8)}`,
        user: "Admin",
        lotNumber,
        productionDate,
        expiryDate,
        supplierId:
          movementForm.type === "Entrada"
            ? resolvedSupplierId
            : selectedLot?.supplierId || movementProduct.supplierId,
      };

      addMovement(
        movementPayload,
        movementForm.type === "Entrada"
          ? { lotNumber, productionDate, expiryDate }
          : { lotNumber, lotId: selectedLot?.id }
      );

      setShowMovementModal(false);
      setView("history");
      resetMovement();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el movimiento.");
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setMovementForm((current) => ({
      ...current,
      productId,
      lotNumber: "",
      productionDate: "",
      expiryDate: "",
      supplierId: current.type === "Entrada" ? current.supplierId : "",
      gramsPerUnit: product.gramsPerUnit || 0,
      presentation: product.presentation || "",
    }));

    setProductQuery(product.name);
    setBrandQuery(product.brand || "");
    setSupplierQuery("");
    setLotQuery("");
    setError("");
  };

  const handleLotChange = (lotNumber: string) => {
    const lot = lots.find(
      (item) => item.productId === movementForm.productId && item.lotNumber === lotNumber
    );

    setMovementForm((current) => ({
      ...current,
      lotNumber,
      productionDate: lot?.productionDate || "",
      expiryDate: lot?.expiryDate || "",
      supplierId: lot?.supplierId || "",
    }));

    setSupplierQuery(suppliers.find((supplier) => supplier.id === lot?.supplierId)?.name || "");
    setLotQuery(lotNumber);
    setError("");
  };

  const fieldLabelStyle = {
    display: "block",
    fontSize: 10.5,
    color: "#4B5A6B",
    fontFamily: "Outfit",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    marginBottom: 4,
  };

  const fullInput = { width: "100%", boxSizing: "border-box" as const };
  const suggestionBox = {
    marginTop: 6,
    border: "1px solid #1A2232",
    borderRadius: 5,
    background: "#0A0F17",
    overflow: "hidden" as const,
  };
  const deleteCount = deleteScope === "all" ? allCount : selectedCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* ── Encabezado ── */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #111820", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 700, color: "#E2E8F0", margin: 0 }}>
              Productos y movimientos
            </h1>
            <div style={{ fontSize: 11, color: "#4B5A6B", fontFamily: "JetBrains Mono", marginTop: 3 }}>
              {products.length} productos · {lots.filter((lot) => lot.qty > 0).length} lotes activos · cantidades en unidades
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              className="btn-secondary"
              onClick={exportExcelFile}
              disabled={!movements.length && !products.length && !importedExcelSheets.length}
            >
              Excel
            </button>

            <button className="btn-secondary" onClick={() => exportProductsPDF(products, suppliers)} disabled={!products.length}>
              PDF
            </button>

            <button
              className="btn-danger"
              onClick={() => {
                setDeleteScope(selectedCount > 0 ? "selected" : allCount > 0 ? "all" : "excel");
                setShowDeleteModal(true);
              }}
              disabled={!allCount && !importedExcelSheets.length}
            >
              Eliminar productos
            </button>

            <button className="btn-primary" onClick={() => openMovement("Entrada")}>+ Ingreso</button>
            <button className="btn-danger" onClick={() => openMovement("Salida")}>− Salida</button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button className={view === "inventory" ? "btn-primary" : "btn-secondary"} onClick={() => setView("inventory")}>
            Inventario por producto
          </button>

          <button className={view === "history" ? "btn-primary" : "btn-secondary"} onClick={() => setView("history")}>
            Historial de movimientos
          </button>

          {importedExcelSheets.length > 0 && (
            <button className={view === "excel" ? "btn-primary" : "btn-secondary"} onClick={() => setView("excel")}>
              Excel importado ({importedExcelSheets.length} hoja{importedExcelSheets.length === 1 ? "" : "s"})
            </button>
          )}

          <div style={{ flex: 1 }} />

          {(hiddenMap[importedExcelFileName] || []).length > 0 && (
            <button className="btn-secondary" style={{ fontSize: 11 }} onClick={showHiddenExcelRows}>
              Mostrar {(hiddenMap[importedExcelFileName] || []).length} filas ocultas del Excel
            </button>
          )}

          <input
            className="wms-input"
            placeholder="Buscar en la tabla (producto, marca, lote, fecha...)"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 320 }}
          />
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {view === "excel" ? (
          importedExcelSheets.length === 0 || !excelAnalysis ? (
            <div style={{ padding: 48, textAlign: "center", color: "#4B5A6B", fontFamily: "Outfit", fontSize: 13 }}>
              No hay ningún Excel importado. Cárgalo desde Importar / Exportar.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "10px 24px", borderBottom: "1px solid #111820", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                <span style={{ color: "#00C896", fontSize: 12, fontFamily: "JetBrains Mono" }}>{importedExcelFileName}</span>
                <span style={{ color: "#4B5A6B", fontSize: 11 }}>·</span>

                {importedExcelSheets.map((sheet, index) => (
                  <button
                    key={sheet.name + index}
                    className={index === excelSheetIndex ? "btn-primary" : "btn-secondary"}
                    style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() => setActiveExcelSheet(index)}
                  >
                    {sheet.name}
                  </button>
                ))}

                <span style={{ marginLeft: "auto", color: "#4B5A6B", fontSize: 11, fontFamily: "JetBrains Mono" }}>
                  {searchTerm ? `${excelRows.length} de ${excelAnalysis.rows.length}` : excelAnalysis.rows.length} filas ·{" "}
                  {excelAnalysis.width} columnas
                </span>

                <button className="btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={exportExcelFile} title="Descarga el archivo idéntico al que subiste">
                  Descargar Excel original
                </button>

                <button className="btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={exportExcelDesigned} title="Mismos datos, con encabezados y filas con diseño">
                  Descargar con diseño
                </button>

                <button
                  className="btn-danger"
                  style={{ fontSize: 11, padding: "4px 10px" }}
                  onClick={() => {
                    if (confirm("¿Quitar el Excel importado de esta vista?")) {
                      clearImportedExcelSheets();
                      setView("inventory");
                    }
                  }}
                >
                  Quitar Excel
                </button>
              </div>

              <div style={{ flex: 1, overflow: "auto" }}>
                <ImportedSheetTable analysis={excelAnalysis} rows={excelRows} />
              </div>
            </div>
          )
        ) : view === "inventory" ? (
          <table className="wms-table">
            <thead style={{ position: "sticky", top: 0, background: "#080B10", zIndex: 1 }}>
              <tr>
                <th style={{ width: 38, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllFilteredProducts}
                    aria-label="Seleccionar todos los productos visibles"
                  />
                </th>

                {inventoryCols.map((column) => (
                  <th key={column.key} style={column.align ? { textAlign: "right" } : undefined}>
                    {column.label}
                  </th>
                ))}

                <th />
              </tr>
            </thead>

            <tbody>
              {catalogInventoryRows.map(({ product, productLots, rec }) => (
                <tr key={product.id}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      aria-label={`Seleccionar ${product.name}`}
                    />
                  </td>

                  {inventoryCols.map((column) => renderInventoryCell(column.key, rec, product, productLots))}

                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-danger"
                      style={{ padding: "3px 8px", fontSize: 11 }}
                      onClick={() => removeProduct(product)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {excelInventoryRows.map((record, index) => (
                <tr key={`excel-inv-${index}`}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedExcelKeys.includes(record._key)}
                      onChange={() => toggleExcelSelection(record._key)}
                      aria-label="Seleccionar fila del Excel"
                    />
                  </td>

                  {inventoryCols.map((column) => (
                    <td
                      key={column.key}
                      className={["codigo", "gramos", "stock", "ultimo"].includes(column.key) ? "num" : undefined}
                      style={column.align ? { textAlign: "right" } : undefined}
                    >
                      {record[column.key] ?? ""}
                    </td>
                  ))}

                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <span className="badge badge-gray" style={{ marginRight: 6 }}>Excel</span>
                    <button
                      className="btn-danger"
                      style={{ padding: "3px 8px", fontSize: 11 }}
                      onClick={() => hideExcelRows([record._key])}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}

              {catalogInventoryRows.length === 0 && excelInventoryRows.length === 0 && (
                <tr>
                  <td colSpan={inventoryCols.length + 2} style={{ padding: 40, textAlign: "center", color: "#4B5A6B" }}>
                    No hay productos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div>
            <div style={{ padding: "12px 24px", borderBottom: "1px solid #111820", display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, background: "#080B10", zIndex: 2 }}>
              <span style={{ color: "#4B5A6B", fontSize: 11, fontFamily: "Outfit", fontWeight: 600, marginRight: 4 }}>Mostrar:</span>

              <button className={historyType === "Todos" ? "btn-primary" : "btn-secondary"} onClick={() => setHistoryType("Todos")}>
                Todos
              </button>

              <button className={historyType === "Entrada" ? "btn-primary" : "btn-secondary"} onClick={() => setHistoryType("Entrada")}>
                Ingresos
              </button>

              <button className={historyType === "Salida" ? "btn-danger" : "btn-secondary"} onClick={() => setHistoryType("Salida")}>
                Salidas
              </button>

              <button className="btn-secondary" onClick={exportHistoryView}>
                Exportar esta vista
              </button>

              <span style={{ marginLeft: "auto", color: "#4B5A6B", fontSize: 11, fontFamily: "JetBrains Mono" }}>
                {historyTotalCount} movimiento{historyTotalCount === 1 ? "" : "s"} ·{" "}
                {historyTotalUnits.toLocaleString("es-PE")} unidades
                {historyType === "Entrada"
                  ? " ingresadas entre todos los lotes"
                  : historyType === "Salida"
                    ? " retiradas"
                    : " registradas"}
              </span>
            </div>

            {historyTotalCount === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#4B5A6B", fontFamily: "Outfit", fontSize: 13 }}>
                No hay {historyType === "Entrada" ? "ingresos" : historyType === "Salida" ? "salidas" : "movimientos"} registrados.
              </div>
            ) : (
              <table className="wms-table">
                <thead style={{ position: "sticky", top: 53, background: "#080B10", zIndex: 1 }}>
                  <tr>
                    {movementCols.map((column) => (
                      <th key={column.key} style={column.align ? { textAlign: "right" } : undefined}>
                        {column.label}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {catalogHistoryRows.map(({ movement, rec }) => (
                    <tr key={movement.id}>
                      {movementCols.map((column) =>
                        renderHistoryCell(column.key, rec, movement.type === "Entrada" ? "Entrada" : "Salida")
                      )}

                      <td>
                        <button
                          className="btn-danger"
                          style={{ padding: "3px 8px", fontSize: 11 }}
                          onClick={() => {
                            if (confirm("¿Eliminar este movimiento?")) deleteMovement(movement.id);
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {excelHistoryRows.map(({ rec, kind }, index) => (
                    <tr key={`excel-mov-${index}`}>
                      {movementCols.map((column) => renderHistoryCell(column.key, rec, kind))}
                      <td>
                        <span className="badge badge-gray">Excel</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Modal: registrar movimiento ── */}
      {showMovementModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="wms-card" style={{ width: 620, maxHeight: "92vh", overflow: "auto" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #1A2232", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "Outfit", fontSize: 16, fontWeight: 700, color: "#E2E8F0" }}>Registrar movimiento</h2>
                <div style={{ marginTop: 3, fontSize: 11, color: "#4B5A6B" }}>
                  Elige primero si las unidades ingresan o salen del almacén.
                </div>
              </div>

              <button onClick={() => setShowMovementModal(false)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 20 }}>
                ×
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                {(["Entrada", "Salida"] as MovementType[]).map((type) => (
                  <button
                    key={type}
                    className={movementForm.type === type ? (type === "Entrada" ? "btn-primary" : "btn-danger") : "btn-secondary"}
                    onClick={() => resetMovement(type)}
                    style={{ padding: 12 }}
                  >
                    {type === "Entrada" ? "Ingreso: sumar unidades" : "Salida: restar unidades"}
                  </button>
                ))}
              </div>

              {movementForm.type === "Salida" && !products.some((product) => product.stock > 0) && (
                <div className="alert-warning" style={{ padding: "9px 12px", borderRadius: 5, color: "#FBBF24", fontSize: 12, marginBottom: 14 }}>
                  Todavía no hay productos con unidades disponibles. Registra primero un ingreso.
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Producto */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={fieldLabelStyle}>Nombre del producto *</label>

                  <input
                    className="wms-input"
                    style={fullInput}
                    value={productQuery}
                    placeholder="Escribe el nombre, código o marca..."
                    autoComplete="off"
                    onChange={(event) => {
                      setProductQuery(event.target.value);
                      setMovementForm((current) => ({
                        ...current,
                        productId: "",
                        lotNumber: "",
                        productionDate: "",
                        expiryDate: "",
                        gramsPerUnit: 0,
                        presentation: "",
                      }));
                      setBrandQuery("");
                      setLotQuery("");
                      setError("");
                    }}
                  />

                  {productQuery.trim() && !selectedProduct && (
                    <div style={suggestionBox}>
                      {productSuggestions.length > 0 ? (
                        productSuggestions.map((product) => {
                          const productLotCodes = lots
                            .filter((lot) => lot.productId === product.id && lot.qty > 0)
                            .map((lot) => lot.lotNumber);

                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleProductChange(product.id)}
                              style={{ width: "100%", padding: "9px 12px", border: "none", borderBottom: "1px solid #111820", background: "transparent", color: "#D1D9E2", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", gap: 12 }}
                            >
                              <span>
                                <span style={{ display: "block", fontFamily: "Outfit", fontSize: 12.5, fontWeight: 600 }}>
                                  {product.name}
                                  <span style={{ color: "#4B5A6B", fontWeight: 400 }}> · {product.brand || "Sin marca"}</span>
                                </span>

                                <span style={{ display: "block", marginTop: 3, color: productLotCodes.length ? "#A78BFA" : "#4B5A6B", fontFamily: "JetBrains Mono", fontSize: 10 }}>
                                  {productLotCodes.length ? `Lotes: ${productLotCodes.join(", ")}` : "Sin lotes registrados"}
                                </span>
                              </span>

                              <span style={{ color: product.stock > 0 ? "#00C896" : "#F87171", fontFamily: "JetBrains Mono", fontSize: 11, whiteSpace: "nowrap" }}>
                                {product.stock} unidades
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div style={{ padding: "10px 12px", color: movementForm.type === "Entrada" ? "#00C896" : "#FBBF24", fontSize: 11 }}>
                          {movementForm.type === "Entrada"
                            ? "Producto nuevo: completa la marca y se registrará junto con el ingreso."
                            : "No se encontró un producto guardado con ese nombre."}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProduct && (
                    <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 5, background: "#08120E", border: "1px solid #0D3D26", display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ color: "#00C896", fontSize: 11, fontWeight: 600 }}>Producto seleccionado</span>
                      <span style={{ color: "#94A3B8", fontFamily: "JetBrains Mono", fontSize: 11 }}>{selectedProduct.sku}</span>
                    </div>
                  )}
                </div>

                {/* Marca: se puede escribir si el producto todavía no tiene marca */}
                <div>
                  <label style={fieldLabelStyle}>Marca{movementForm.type === "Entrada" ? " *" : ""}</label>
                  <input
                    className="wms-input"
                    style={fullInput}
                    value={brandQuery}
                    readOnly={Boolean(selectedProduct?.brand) || movementForm.type === "Salida"}
                    placeholder={selectedProduct?.brand ? "Marca del producto" : "Escribe la marca..."}
                    onChange={(event) => {
                      setBrandQuery(event.target.value);
                      setError("");
                    }}
                  />
                </div>

                {movementForm.type === "Entrada" && (
                  <div>
                    <label style={fieldLabelStyle}>Presentación *</label>
                    <input
                      className="wms-input"
                      style={fullInput}
                      value={movementForm.presentation}
                      readOnly={Boolean(selectedProduct)}
                      placeholder="Ej. Caja x 12, Botella 1L, Bolsa 500 g"
                      onChange={(event) => {
                        setMovementForm((current) => ({ ...current, presentation: event.target.value }));
                        setError("");
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={fieldLabelStyle}>
                    {movementForm.type === "Entrada" ? "Fecha de ingreso" : "Fecha de salida"} *
                  </label>
                  <input
                    className="wms-input"
                    type="date"
                    style={fullInput}
                    value={movementForm.date}
                    onChange={(event) => setMovementForm((current) => ({ ...current, date: event.target.value }))}
                  />
                </div>

                {movementForm.type === "Entrada" ? (
                  <>
                    <div>
                      <label style={fieldLabelStyle}>Fecha de producción *</label>
                      <input
                        className="wms-input"
                        type="date"
                        style={fullInput}
                        value={movementForm.productionDate}
                        onChange={(event) => {
                          setMovementForm((current) => ({ ...current, productionDate: event.target.value }));
                          setError("");
                        }}
                      />
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>Fecha de vencimiento *</label>
                      <input
                        className="wms-input"
                        type="date"
                        style={fullInput}
                        value={movementForm.expiryDate}
                        onChange={(event) => {
                          setMovementForm((current) => ({ ...current, expiryDate: event.target.value }));
                          setError("");
                        }}
                      />

                      {expiryDays !== null && (
                        <div
                          className={expiryDays < 0 ? "alert-critical" : expiryDays <= 30 ? "alert-warning" : ""}
                          style={{
                            marginTop: 6,
                            padding: "6px 8px",
                            borderRadius: 4,
                            background: expiryDays > 30 ? "#08120E" : undefined,
                            border: expiryDays > 30 ? "1px solid #0D3D26" : undefined,
                            color: expiryDays < 0 ? "#F87171" : expiryDays <= 30 ? "#FBBF24" : "#00C896",
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          {expiryDays < 0
                            ? `VENCIDOS · hace ${Math.abs(expiryDays)} día${Math.abs(expiryDays) === 1 ? "" : "s"}`
                            : expiryDays <= 30
                              ? `Alerta: vence en ${expiryDays} día${expiryDays === 1 ? "" : "s"}`
                              : `Producto vigente · ${expiryDays} días restantes`}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>Proveedor *</label>
                      <input
                        className="wms-input"
                        style={fullInput}
                        value={supplierQuery}
                        placeholder="Escribe el nombre del proveedor..."
                        autoComplete="off"
                        onChange={(event) => {
                          setSupplierQuery(event.target.value);
                          setMovementForm((current) => ({ ...current, supplierId: "" }));
                          setError("");
                        }}
                      />

                      {supplierQuery.trim() && !movementForm.supplierId && (
                        <div style={suggestionBox}>
                          {supplierSuggestions.length > 0 ? (
                            supplierSuggestions.map((supplier) => (
                              <button
                                key={supplier.id}
                                type="button"
                                onClick={() => {
                                  setSupplierQuery(supplier.name);
                                  setMovementForm((current) => ({ ...current, supplierId: supplier.id }));
                                  setError("");
                                }}
                                style={{ width: "100%", padding: "9px 12px", border: "none", borderBottom: "1px solid #111820", background: "transparent", color: "#D1D9E2", cursor: "pointer", textAlign: "left", fontFamily: "Outfit", fontSize: 12.5, fontWeight: 600 }}
                              >
                                {supplier.name}
                              </button>
                            ))
                          ) : (
                            <div style={{ padding: "10px 12px", color: "#00C896", fontSize: 11 }}>
                              Proveedor nuevo: se guardará automáticamente en Proveedores.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>Lote *</label>
                      <input
                        className="wms-input"
                        style={fullInput}
                        value={movementForm.lotNumber}
                        onChange={(event) => {
                          setMovementForm((current) => ({ ...current, lotNumber: event.target.value }));
                          setError("");
                        }}
                        placeholder="Ej. LOTE-2026-001"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={fieldLabelStyle}>Lote a descontar *</label>
                      <input
                        className="wms-input"
                        style={fullInput}
                        value={lotQuery}
                        placeholder={movementForm.productId ? "Escribe el código del lote..." : "Selecciona primero un producto"}
                        disabled={!movementForm.productId}
                        autoComplete="off"
                        onChange={(event) => {
                          setLotQuery(event.target.value);
                          setMovementForm((current) => ({ ...current, lotNumber: "", productionDate: "", expiryDate: "" }));
                          setError("");
                        }}
                      />

                      {movementForm.productId && !selectedLot && (
                        <div style={suggestionBox}>
                          {lotSuggestions.length > 0 ? (
                            lotSuggestions.map((lot) => (
                              <button
                                key={lot.id}
                                type="button"
                                onClick={() => handleLotChange(lot.lotNumber)}
                                style={{ width: "100%", padding: "9px 12px", border: "none", borderBottom: "1px solid #111820", background: "transparent", color: "#D1D9E2", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", gap: 12 }}
                              >
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: "#A78BFA" }}>{lot.lotNumber}</span>
                                <span style={{ color: "#64748B", fontSize: 11 }}>{lot.qty} unidades · vence {lot.expiryDate}</span>
                              </button>
                            ))
                          ) : (
                            <div style={{ padding: "10px 12px", color: "#FBBF24", fontSize: 11 }}>
                              No hay lotes disponibles que coincidan.
                            </div>
                          )}
                        </div>
                      )}

                      {selectedLot && (
                        <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 5, background: "#08120E", border: "1px solid #0D3D26", display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ color: "#00C896", fontSize: 11, fontWeight: 600 }}>Lote seleccionado: {selectedLot.lotNumber}</span>
                          <span style={{ color: "#94A3B8", fontFamily: "JetBrains Mono", fontSize: 11 }}>{selectedLot.qty} unidades disponibles</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>Fecha de producción</label>
                      <input className="wms-input" style={fullInput} value={selectedLot?.productionDate || "No registrada"} readOnly />
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>Fecha de vencimiento</label>
                      <input className="wms-input" style={fullInput} value={selectedLot?.expiryDate || "No registrada"} readOnly />

                      {selectedLot && (
                        <div
                          className={selectedLot.status === "Vencido" ? "alert-critical" : selectedLot.status === "Por vencer" ? "alert-warning" : ""}
                          style={{
                            marginTop: 6,
                            padding: "6px 8px",
                            borderRadius: 4,
                            background: selectedLot.status === "Vigente" ? "#08120E" : undefined,
                            border: selectedLot.status === "Vigente" ? "1px solid #0D3D26" : undefined,
                            color: selectedLot.status === "Vencido" ? "#F87171" : selectedLot.status === "Por vencer" ? "#FBBF24" : "#00C896",
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          Estado del lote: {selectedLot.status === "Vencido" ? "VENCIDOS" : selectedLot.status}
                        </div>
                      )}
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={fieldLabelStyle}>Proveedor del lote</label>
                      <input
                        className="wms-input"
                        style={fullInput}
                        value={suppliers.find((supplier) => supplier.id === selectedLot?.supplierId)?.name || "No registrado"}
                        readOnly
                      />
                    </div>
                  </>
                )}

                <div>
                  <label style={fieldLabelStyle}>Cantidad en unidades *</label>
                  <input
                    className="wms-input cantidad-sin-flechas"
                    type="text"
                    inputMode="numeric"
                    style={fullInput}
                    value={movementForm.qty}
                    onChange={(event) => {
                      const value = event.target.value;
                      setMovementForm((current) => ({ ...current, qty: value === "" ? 0 : Number(value) }));
                      setError("");
                    }}
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Gramos por unidad *</label>
                  <input
                    className="wms-input cantidad-sin-flechas"
                    type="number"
                    min="1"
                    step="1"
                    style={fullInput}
                    value={movementForm.gramsPerUnit === 0 ? "" : movementForm.gramsPerUnit}
                    onChange={(event) => {
                      const value = event.target.value;
                      setMovementForm((current) => ({ ...current, gramsPerUnit: value === "" ? 0 : Number(value) }));
                      setError("");
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <div style={{ width: "100%", padding: "8px 12px", border: "1px solid #1A2232", borderRadius: 5, background: "#0A0F17", fontSize: 12, color: "#64748B" }}>
                    Resultado:{" "}
                    <span style={{ color: movementForm.type === "Entrada" ? "#00C896" : "#F87171", fontFamily: "JetBrains Mono", fontWeight: 700 }}>
                      {(selectedProduct
                        ? selectedProduct.stock + (movementForm.type === "Entrada" ? movementForm.qty : -movementForm.qty)
                        : movementForm.type === "Entrada"
                          ? movementForm.qty
                          : 0
                      ).toLocaleString("es-PE")}{" "}
                      unidades
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <div style={{ width: "100%", padding: "8px 12px", border: "1px solid #0D3D26", borderRadius: 5, background: "#08120E", fontSize: 12, color: "#64748B" }}>
                    Peso total:{" "}
                    <span style={{ color: "#00C896", fontFamily: "JetBrains Mono", fontWeight: 700 }}>
                      {(movementForm.qty * movementForm.gramsPerUnit).toLocaleString("es-PE")} g
                    </span>
                    <span style={{ color: "#4B5A6B", marginLeft: 6 }}>
                      ({((movementForm.qty * movementForm.gramsPerUnit) / 1000).toLocaleString("es-PE", { maximumFractionDigits: 3 })} kg)
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="alert-critical" style={{ gridColumn: "1 / -1", padding: "9px 12px", borderRadius: 5, color: "#FCA5A5", fontSize: 12 }}>
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #1A2232", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowMovementModal(false)}>Cancelar</button>

              <button className={movementForm.type === "Entrada" ? "btn-primary" : "btn-danger"} onClick={registerMovement}>
                Registrar {movementForm.type.toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: eliminar productos / quitar Excel ── */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="wms-card" style={{ width: 470 }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #1A2232", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "Outfit", fontSize: 16, color: "#E2E8F0" }}>Eliminar productos</h2>
                <div style={{ marginTop: 4, fontSize: 11, color: "#64748B" }}>
                  Selecciona qué productos deseas mover a la Papelera.
                </div>
              </div>

              <button onClick={() => setShowDeleteModal(false)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 20 }}>
                ×
              </button>
            </div>

            <div style={{ padding: 20, display: "grid", gap: 10 }}>
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "12px 14px",
                  border: deleteScope === "selected" ? "1px solid #00C896" : "1px solid #1A2232",
                  borderRadius: 6,
                  background: deleteScope === "selected" ? "rgba(0,200,150,0.06)" : "#0A0F17",
                  cursor: selectedCount ? "pointer" : "not-allowed",
                  opacity: selectedCount ? 1 : 0.5,
                }}
              >
                <input
                  type="radio"
                  name="delete-scope"
                  checked={deleteScope === "selected"}
                  disabled={!selectedCount}
                  onChange={() => setDeleteScope("selected")}
                />
                <span>
                  <span style={{ display: "block", color: "#E2E8F0", fontFamily: "Outfit", fontSize: 13, fontWeight: 600 }}>Eliminar seleccionados</span>
                  <span style={{ display: "block", marginTop: 2, color: "#64748B", fontSize: 11 }}>
                    {selectedCount} producto{selectedCount === 1 ? "" : "s"} seleccionado
                    {selectedCount === 1 ? "" : "s"}
                    {selectedExcelKeys.length > 0 ? ` (${selectedExcelKeys.length} del Excel)` : ""}
                  </span>
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "12px 14px",
                  border: deleteScope === "all" ? "1px solid #EF4444" : "1px solid #1A2232",
                  borderRadius: 6,
                  background: deleteScope === "all" ? "rgba(239,68,68,0.06)" : "#0A0F17",
                  cursor: allCount ? "pointer" : "not-allowed",
                  opacity: allCount ? 1 : 0.5,
                }}
              >
                <input
                  type="radio"
                  name="delete-scope"
                  checked={deleteScope === "all"}
                  disabled={!allCount}
                  onChange={() => setDeleteScope("all")}
                />
                <span>
                  <span style={{ display: "block", color: "#F87171", fontFamily: "Outfit", fontSize: 13, fontWeight: 600 }}>Eliminar todos</span>
                  <span style={{ display: "block", marginTop: 2, color: "#64748B", fontSize: 11 }}>
                    {products.length} producto{products.length === 1 ? "" : "s"} a la Papelera
                    {excelInventoryAll.length > 0 ? ` + ${excelInventoryAll.length} fila${excelInventoryAll.length === 1 ? "" : "s"} del Excel` : ""}
                  </span>
                </span>
              </label>

              {importedExcelSheets.length > 0 && (
                <label
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: "12px 14px",
                    border: deleteScope === "excel" ? "1px solid #FBBF24" : "1px solid #1A2232",
                    borderRadius: 6,
                    background: deleteScope === "excel" ? "rgba(251,191,36,0.06)" : "#0A0F17",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="delete-scope"
                    checked={deleteScope === "excel"}
                    onChange={() => setDeleteScope("excel")}
                  />
                  <span>
                    <span style={{ display: "block", color: "#FBBF24", fontFamily: "Outfit", fontSize: 13, fontWeight: 600 }}>
                      Quitar el Excel importado
                    </span>
                    <span style={{ display: "block", marginTop: 2, color: "#64748B", fontSize: 11 }}>
                      {importedExcelFileName || "Excel importado"} · {importedExcelSheets.length} hoja
                      {importedExcelSheets.length === 1 ? "" : "s"}. Tu archivo original no se modifica.
                    </span>
                  </span>
                </label>
              )}

              <div className="alert-critical" style={{ marginTop: 4, padding: "9px 12px", borderRadius: 5, color: "#FCA5A5", fontSize: 11 }}>
                {deleteScope === "excel"
                  ? `Se quitará el Excel importado (${importedExcelSheets.length} hoja${importedExcelSheets.length === 1 ? "" : "s"}) de la aplicación.`
                  : `Esta acción eliminará ${deleteCount} producto${deleteCount === 1 ? "" : "s"} del inventario.`}
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #1A2232", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>

              <button
                className="btn-danger"
                onClick={confirmProductDeletion}
                disabled={
                  (deleteScope === "selected" && !selectedCount) ||
                  (deleteScope === "all" && !allCount)
                }
              >
                Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}