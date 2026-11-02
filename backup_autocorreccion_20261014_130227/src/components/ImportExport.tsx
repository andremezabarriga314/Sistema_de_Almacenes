import { useRef, useState, type CSSProperties } from "react";
import * as XLSX from "xlsx-js-style";
import type { Product } from "../store/AppContext";
import { useApp } from "../store/AppContext";
import {
  exportProductsExcel,
  exportMovementsExcel,
  exportSuppliersExcel,
  exportProductControlExcel,
} from "../lib/exportExcel";

type SheetData = { name: string; headers: string[]; rows: unknown[][] };
type ImportResult = { created: number; updated: number; errors: number; skipped: number };

const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const numberValue = (value: unknown, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return fallback;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const dateValue = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number" && value > 0) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return text;
};
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const newProductId = () => `IMPORT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const columnName = (index: number): string => {
  let result = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
};

export default function ImportExport() {
  const { products, movements, suppliers, lots, addSupplier, addMovement, replaceProducts, importLots, saveImportedExcelSheets } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const currentSheet = sheets[activeSheet];

  const readFile = async (file?: File) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { setMessage("Selecciona un archivo Excel (.xlsx, .xls) o CSV."); return; }
    setLoading(true); setMessage(""); setResult(null); setSheets([]); setActiveSheet(0); setFileName(file.name);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const rawSheets = workbook.SheetNames.map((name) => {
        const worksheet = workbook.Sheets[name];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "", raw: true, blankrows: true });
        return { name, rawRows: rows, columnCount: Math.max(1, ...rows.map((row) => row.length)) };
      });
      const parsed = rawSheets.map(({ name, rawRows }) => {
        let headerIndex = 0;
        for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
          const nonEmpty = rawRows[i].filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "").length;
          if (nonEmpty >= 3) { headerIndex = i; break; }
        }
        const headers = (rawRows[headerIndex] ?? []).map((cell) => String(cell ?? "").trim());
        const dataRows = rawRows.slice(headerIndex + 1).filter((row) => row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""));
        return { name, headers, rows: dataRows };
      });
      setSheets(parsed);
      // Keep a faithful copy of every source sheet for the "Hojas Excel" view in Productos.
      saveImportedExcelSheets(file.name, rawSheets.map((sheet) => ({
        name: sheet.name,
        headers: Array.from({ length: sheet.columnCount }, (_, index) => columnName(index)),
        rows: sheet.rawRows.map((row) => Array.from({ length: sheet.columnCount }, (_, index) => {
          const value = row[index];
          return value instanceof Date ? dateValue(value) : String(value ?? "");
        })),
      })));
      if (!parsed.some((sheet) => sheet.headers.length)) setMessage("El archivo no contiene hojas con encabezados.");
    } catch (error) { console.error(error); setMessage("No se pudo leer el archivo Excel."); }
    finally { setLoading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const doImport = () => {
    if (!currentSheet) { setMessage("Primero selecciona un archivo."); return; }
    const headers = currentSheet.headers.map(normalize);
    const find = (...names: string[]) => {
      const normalizedNames = names.map(normalize);
      const exact = headers.findIndex((h) => normalizedNames.includes(h));
      if (exact >= 0) return exact;
      return headers.findIndex((h) => normalizedNames.some((n) => n.length >= 4 && h.includes(n)));
    };
    const c = {
      sku: find("SKU", "Código", "Codigo", "Código del producto", "Codigo del producto", "Cod. producto"),
      name: find("Nombre", "Nombre del producto", "Nombre del alimento", "Producto", "Alimento", "Descripción", "Descripcion"),
      brand: find("Marca", "Brand"), presentation: find("Presentación", "Presentacion", "Empaque", "Formato"),
      gramsPerUnit: find("Gramos por unidad", "Gramos/unidad", "Gramos por presentación", "Peso unitario"),
      unit: find("Unidad", "Unidad de medida"),
      stock: find("Stock actual", "Stock actual (unidades)", "Stock", "Existencias", "Cantidad disponible"),
      cost: find("Costo unitario", "Costo unit. ($)", "Costo", "P. unitario ($)"),
      sale: find("Precio venta", "Precio venta ($)", "Precio de venta"), temp: find("Temp. almacenamiento", "Temperatura"),
      location: find("Ubicación", "Almacén", "Localización"), status: find("Estado"), movement: find("Movimiento", "Tipo", "Tipo de movimiento"),
      qty: find("Cantidad (unidades)", "Qty disponible", "Cantidad", "Cantidad disponible", "Existencia"),
      date: find("Fecha", "Fecha del movimiento", "Fecha de ingreso", "Fecha de salida"),
      lot: find("Lote", "N° lote", "Nº lote", "Numero de lote", "Número de lote"),
      production: find("Fecha de producción", "F. producción", "Producción", "Produccion"),
      expiry: find("Fecha de vencimiento", "F. vencimiento", "Vencimiento", "Caducidad"),
      receivedDate: find("F. recepción", "Fecha de recepción", "Recepción", "Recepcion"),
      reference: find("Referencia"), notes: find("Observaciones", "Notas"), supplier: find("Proveedor", "Proveedor / Cliente"),
      balance: find("Saldo (unidades)", "Saldo"),
    };
    const getRaw = (row: unknown[], index: number): unknown => index >= 0 ? row[index] ?? "" : "";
    const get = (row: unknown[], index: number): string => {
      const value = getRaw(row, index);
      return value instanceof Date ? dateValue(value) : String(value ?? "").trim();
    };
    const getDate = (row: unknown[], index: number) => dateValue(getRaw(row, index));
    const meaningful = (value: string) => {
      const normalized = normalize(value);
      return !["", "—", "-", "sin marca", "no registrada", "no registrado", "no registrad@"].includes(normalized) ? value : "";
    };
    const sheetName = normalize(currentSheet.name);
    const movementSheet = c.movement >= 0 && c.qty >= 0;
    const lotSheet = !movementSheet && c.lot >= 0 && c.production >= 0 && c.expiry >= 0 && c.qty >= 0 && (sheetName.includes("lote") || c.receivedDate >= 0 || headers.some((h) => h.includes("qty disponible")));
    if (!movementSheet && !lotSheet && c.sku < 0 && c.name < 0) {
      setMessage("La hoja debe incluir SKU o Nombre del producto."); return;
    }
    setImporting(true); setMessage(""); setResult(null);
    let created = 0, updated = 0, errors = 0, skipped = 0;
    const currentBySku = new Map(products.map((p) => [normalize(p.sku), p]));
    const supplierByName = new Map(suppliers.map((s) => [normalize(s.name), s.id]));
    const ensureSupplier = (name: string) => {
      if (!name || normalize(name) === "no registrado" || name === "—") return "";
      const key = normalize(name); const existing = supplierByName.get(key); if (existing) return existing;
      const supplier = addSupplier({ name: name.trim(), ruc: "", contact: "", phone: "", email: "", address: "", paymentTerms: "", deliveryDays: 0, rating: 0, status: "Activo", notes: "Importado desde Excel" });
      supplierByName.set(key, supplier.id); return supplier.id;
    };
    try {
      if (lotSheet) {
        const rowsToImport: Array<{ productId: string; lotNumber: string; productionDate: string; expiryDate: string; qty: number; receivedDate?: string; supplierId?: string }> = [];
        const seenLots = new Set(lots.map((lot) => `${lot.productId}::${normalize(lot.lotNumber)}`));
        for (const row of currentSheet.rows) {
          try {
            const sku = get(row, c.sku); const name = get(row, c.name); const lotNumber = get(row, c.lot);
            const qty = numberValue(get(row, c.qty), 0);
            const productionDate = getDate(row, c.production); const expiryDate = getDate(row, c.expiry);
            if (!lotNumber || !Number.isInteger(qty) || qty <= 0 || !productionDate || !expiryDate) { skipped++; continue; }
            if (productionDate > expiryDate) { errors++; continue; }
            const product = products.find((p) => (sku && normalize(p.sku) === normalize(sku)) || (name && normalize(p.name) === normalize(name)));
            if (!product) { errors++; continue; }
            const key = `${product.id}::${normalize(lotNumber)}`;
            if (seenLots.has(key)) { skipped++; continue; }
            seenLots.add(key);
            const supplierId = ensureSupplier(get(row, c.supplier)) || product.supplierId || undefined;
            rowsToImport.push({ productId: product.id, lotNumber, productionDate, expiryDate, qty, receivedDate: getDate(row, c.receivedDate) || today(), supplierId });
          } catch (error) { console.error("Error leyendo lote", error); errors++; }
        }
        try {
          const importedLots = importLots(rowsToImport);
          created += importedLots.created;
          setMessage(`Lotes importados: ${importedLots.created}. Stock nuevo añadido: ${importedLots.stockAdded} unidades. Lotes duplicados omitidos: ${skipped}.`);
        } catch (error) {
          errors += rowsToImport.length;
          setMessage(`No se importaron los lotes: ${error instanceof Error ? error.message : "error desconocido"}`);
        }
      } else if (!movementSheet) {
        const imported: Product[] = [];
        const seen = new Set<string>();
        for (const row of currentSheet.rows) {
          const skuValue = get(row, c.sku); const nameValue = get(row, c.name);
          const name = nameValue || skuValue;
          const sku = skuValue || name.slice(0, 12).toUpperCase().replace(/\s+/g, "-");
          if (!sku || !name) { skipped++; continue; }
          const key = normalize(sku);
          if (seen.has(key)) { skipped++; continue; }
          seen.add(key);
          const old = currentBySku.get(key) || products.find((p) => normalize(p.name) === normalize(name));
          const supplierId = ensureSupplier(get(row, c.supplier)) || old?.supplierId || undefined;
          const statusText = normalize(get(row, c.status));
          const product: Product = {
            id: old?.id ?? newProductId(), sku, name,
            brand: meaningful(get(row, c.brand)) || old?.brand || "",
            presentation: meaningful(get(row, c.presentation)) || old?.presentation || "",
            gramsPerUnit: numberValue(get(row, c.gramsPerUnit), old?.gramsPerUnit ?? 0) || undefined,
            costPrice: numberValue(get(row, c.cost), old?.costPrice ?? 0),
            salePrice: numberValue(get(row, c.sale), old?.salePrice ?? 0),
            stock: old?.stock ?? 0,
            unit: get(row, c.unit) || old?.unit || "Unidad",
            location: get(row, c.location) || old?.location || "",
            supplierId, status: statusText.includes("inactivo") ? "Inactivo" : old?.status || "Activo",
            storageTemp: get(row, c.temp) || old?.storageTemp || "Ambiente",
            createdAt: old?.createdAt || today(), lastMovement: old?.lastMovement || today(),
          };
          imported.push(product);
          if (old) updated++; else created++;
        }
        if (!imported.length && currentSheet.rows.length) {
          setMessage("No se actualizó el catálogo: no se encontraron filas válidas.");
          setResult({ created, updated, errors, skipped }); setImporting(false); return;
        }
        // replaceProducts merges by SKU and explicitly preserves the real stock and existing catalog rows.
        replaceProducts(imported);
        setMessage(`Catálogo actualizado. ${created} nuevos, ${updated} actualizados. El stock de productos existentes no se modificó; importa la hoja LOTES por separado para reconciliar lotes.`);
      } else {
        const knownProducts = [...products];
        const knownReferences = new Set(movements.map((m) => normalize(m.reference)));
        for (const row of currentSheet.rows) {
          try {
            const sku = get(row, c.sku); const name = get(row, c.name);
            if (!sku && !name) { skipped++; continue; }
            let product = knownProducts.find((p) => (sku && normalize(p.sku) === normalize(sku)) || (name && normalize(p.name) === normalize(name)));
            const movementText = normalize(get(row, c.movement));
            const type: "Entrada" | "Salida" | null = movementText.startsWith("entrada") || movementText.startsWith("ingreso") ? "Entrada" : movementText.startsWith("salida") ? "Salida" : null;
            const qty = numberValue(get(row, c.qty));
            if (!type || !Number.isInteger(qty) || qty <= 0) { skipped++; continue; }
            if (!product) { errors++; continue; }
            const reference = get(row, c.reference) || `IMP-${Date.now()}-${created + updated + skipped + 1}`;
            if (knownReferences.has(normalize(reference))) { skipped++; continue; }
            const lotNumber = get(row, c.lot); const productionDate = getDate(row, c.production); const expiryDate = getDate(row, c.expiry);
            if (type === "Entrada" && (!lotNumber || !productionDate || !expiryDate)) { errors++; continue; }
            if (type === "Entrada" && productionDate > expiryDate) { errors++; continue; }
            const supplierId = ensureSupplier(get(row, c.supplier)) || product.supplierId || undefined;
            addMovement({ date: getDate(row, c.date) || today(), type, productId: product.id, productName: product.name, sku: product.sku, qty, unitCost: product.costPrice, salePrice: product.salePrice, total: qty * product.costPrice, balance: numberValue(get(row, c.balance), product.stock + (type === "Entrada" ? qty : -qty)), reference, user: "Importación Excel", lotNumber: lotNumber || undefined, productionDate: productionDate || undefined, expiryDate: expiryDate || undefined, supplierId, notes: get(row, c.notes) || undefined }, type === "Entrada" ? { lotNumber, productionDate, expiryDate } : undefined);
            knownReferences.add(normalize(reference));
          } catch (error) { console.error("Error importando movimiento", error); errors++; }
        }
        setMessage("Importación de movimientos terminada. Se omitieron referencias duplicadas para evitar repetir entradas o salidas.");
      }
      setResult({ created, updated, errors, skipped });
    } catch (error) {
      console.error(error); setMessage(`Error durante la importación: ${error instanceof Error ? error.message : "error desconocido"}`);
    } finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const productsSheet = XLSX.utils.aoa_to_sheet([["SKU", "Nombre del producto", "Marca", "Presentación", "Gramos por unidad", "Unidad", "Stock Actual", "Costo Unit. ($)", "Precio Venta ($)", "Temp. Almacenamiento", "Ubicación", "Proveedor", "Estado"], ["PROD-001", "Producto de ejemplo", "Marca", "Bolsa 500 g", 500, "Unidad", 0, 0, 0, "Ambiente", "Almacén Central", "", "Activo"]]);
    const lotsSheet = XLSX.utils.aoa_to_sheet([["N° Lote", "SKU", "Alimento", "Proveedor", "F. Producción", "F. Vencimiento", "Qty Disponible", "F. Recepción"], ["LOTE-001", "PROD-001", "Producto de ejemplo", "", today(), "2028-12-31", 10, today()]]);
    const movementsSheet = XLSX.utils.aoa_to_sheet([["Fecha", "Movimiento", "SKU", "Nombre del producto", "Cantidad (unidades)", "Lote", "Fecha de producción", "Fecha de vencimiento", "Proveedor", "Referencia", "Observaciones"], [today(), "Entrada", "PROD-001", "Producto de ejemplo", 10, "LOTE-001", today(), "2028-12-31", "", "REF-001", "Ejemplo"]]);
    XLSX.utils.book_append_sheet(wb, productsSheet, "ALIMENTOS"); XLSX.utils.book_append_sheet(wb, lotsSheet, "LOTES"); XLSX.utils.book_append_sheet(wb, movementsSheet, "MOVIMIENTOS");
    XLSX.writeFile(wb, "Plantilla_Importacion_INAMBU.xlsx");
  };

  const btn: CSSProperties = { border: "1px solid #294252", background: "#12232f", color: "#e5eef5", borderRadius: 10, padding: "11px 15px", cursor: "pointer", fontWeight: 600 };
  return <div style={{ padding: 24, color: "#e5edf5", background: "#0b121a", minHeight: "100%", borderRadius: 16 }}>
    <div style={{ marginBottom: 24 }}><h2 style={{ margin: "0 0 8px", fontSize: 25 }}>Importación y exportación</h2><p style={{ margin: 0, color: "#91a5b7" }}>Administra tus archivos Excel de productos, movimientos y proveedores.</p></div>
    <section style={{ padding: 20, border: "1px solid #233747", borderRadius: 14, background: "#101c27", marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Importar desde Excel</h3>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => readFile(e.target.files?.[0])} style={{ display: "none" }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" style={btn} onClick={() => fileRef.current?.click()} disabled={loading || importing}>{loading ? "Leyendo archivo..." : "Seleccionar archivo"}</button>
        <button type="button" style={btn} onClick={downloadTemplate}>Descargar plantilla Excel</button>
        <button type="button" style={{ ...btn, background: "#087f5b", borderColor: "#087f5b" }} onClick={doImport} disabled={!currentSheet || importing || loading}>{importing ? "Importando..." : "Importar datos"}</button>
      </div>
      {fileName && <p style={{ color: "#8edfc1", marginTop: 14 }}>Archivo seleccionado: {fileName}</p>}
      {sheets.length > 0 && <div style={{ marginTop: 18 }}><label htmlFor="excel-sheet" style={{ display: "block", marginBottom: 8 }}>Hoja de Excel</label><select id="excel-sheet" value={activeSheet} onChange={(e) => setActiveSheet(Number(e.target.value))} style={{ ...btn, width: "100%", maxWidth: 360 }}>{sheets.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}</select>
        <p style={{ color: "#91a5b7", fontSize: 13 }}>{currentSheet?.rows.length ?? 0} filas detectadas.</p>
        {currentSheet && <div style={{ overflowX: "auto", maxHeight: 300, border: "1px solid #233747", borderRadius: 10 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr>{currentSheet.headers.map((h, i) => <th key={`${h}-${i}`} style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #294252", background: "#172937", whiteSpace: "nowrap" }}>{h || `Columna ${i + 1}`}</th>)}</tr></thead><tbody>{currentSheet.rows.map((row, ri) => <tr key={ri}>{currentSheet.headers.map((_, ci) => <td key={ci} style={{ padding: 10, borderBottom: "1px solid #1c2c39", whiteSpace: "nowrap" }}>{String(row[ci] ?? "")}</td>)}</tr>)}</tbody></table></div>}
      </div>}
      {message && <p role="status" style={{ color: /error|no se reemplazó|debe incluir/i.test(message) ? "#ffb4a9" : "#8edfc1", marginTop: 16 }}>{message}</p>}
      {result && <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 14, padding: 14, background: "#0b1720", borderRadius: 10 }}><span>Creados: <strong>{result.created}</strong></span><span>Actualizados: <strong>{result.updated}</strong></span><span>Omitidos: <strong>{result.skipped}</strong></span><span>Errores: <strong>{result.errors}</strong></span></div>}
    </section>
    <section style={{ padding: 20, border: "1px solid #233747", borderRadius: 14, background: "#101c27" }}><h3 style={{ marginTop: 0 }}>Exportar información</h3><p style={{ color: "#91a5b7", fontSize: 14 }}>Descarga los datos registrados actualmente en el sistema.</p><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      <button type="button" style={btn} onClick={() => exportProductsExcel(products, suppliers, lots)}>Exportar productos</button>
      <button type="button" style={btn} onClick={() => exportMovementsExcel(movements, "Movimientos")}>Exportar movimientos</button>
      <button type="button" style={btn} onClick={() => exportSuppliersExcel(suppliers)}>Exportar proveedores</button>
      <button type="button" style={btn} onClick={() => exportProductControlExcel(products, movements, lots, suppliers)}>Exportar control de entradas y salidas</button>
    </div><p style={{ color: "#71879a", fontSize: 12, marginBottom: 0 }}>Productos: {products.length} · Movimientos: {movements.length} · Proveedores: {suppliers.length} · Lotes: {lots.length}</p></section>
  </div>;
}
