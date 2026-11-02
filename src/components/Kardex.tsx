import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { exportMovementsPDF } from "../lib/exportPDF";
import {
  exportProductControlExcel,
  exportImportedExcel,
  downloadOriginalFile,
} from "../lib/exportExcel";
import { analyzeWorkbook, dateKey } from "../lib/excelKardex";
import {
  ImportedSheetTable,
  normText,
  toNumber,
  analyzeSheet,
  filterSheetRows,
  sheetTotals,
  type KardexType,
} from "./ImportedSheetView";

const prioritySheets = [
  "BPA1",
  "RAST02",
  "RAST03",
  "TARJETA DE CONTROL  (2)",
  "BPAL 1",
  "BPAL 19",
];

// Filas del Excel ocultadas en el Kárdex. Se recuerdan por archivo para que
// sigan ocultas al recargar. El Excel original nunca se modifica.
type HiddenEntry = {
  // Filas ocultas de cada hoja (número de fila del Excel).
  sheets: Record<string, number[]>;
  // Movimientos del Excel ocultos en la vista "Sistema + Excel".
  movs: string[];
};
type HiddenStore = Record<string, HiddenEntry>;

const HIDDEN_KEY = "INAMBU_KARDEX_HIDDEN_V1";
const EMPTY_HIDDEN: HiddenEntry = { sheets: {}, movs: [] };

const loadHiddenStore = (): HiddenStore => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export default function Kardex() {
  const {
    products,
    movements,
    suppliers,
    lots,
    deleteMovement,
    importedExcelFileName,
    importedExcelSheets,
    importedExcelFile,
  } = useApp();

  const [selectedProduct, setSelectedProduct] = useState("all");
  const [filterType, setFilterType] = useState<KardexType>("Todos");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<"system" | number | null>(null);

  // Selección de movimientos registrados en el sistema.
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([]);

  // Selección de movimientos del Excel en la vista "Sistema + Excel".
  const [selectedExcelMovs, setSelectedExcelMovs] = useState<string[]>([]);

  // Selección de filas del Excel, separada por hoja.
  const [selectedExcelRows, setSelectedExcelRows] = useState<
    Record<string, number[]>
  >({});

  // Filas ocultas (guardadas en el navegador).
  const [hiddenStore, setHiddenStore] = useState<HiddenStore>(loadHiddenStore);

  const fileKey = importedExcelFileName || "Excel_importado";
  const hidden = hiddenStore[fileKey] ?? EMPTY_HIDDEN;
  const deletedExcelRows = hidden.sheets;
  const hiddenMovKeys = useMemo(() => new Set(hidden.movs), [hidden.movs]);

  const updateHidden = (change: (current: HiddenEntry) => HiddenEntry) => {
    setHiddenStore((store) => {
      const next = {
        ...store,
        [fileKey]: change(store[fileKey] ?? EMPTY_HIDDEN),
      };

      try {
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      } catch {
        /* sin espacio: la vista sigue funcionando en esta sesión */
      }

      return next;
    });
  };

  // Prioriza las hojas solicitadas y conserva el orden de las demás.
  const orderedSheets = useMemo(() => {
    const normalizeSheetName = (name: string) =>
      normText(name).replace(/\s+/g, " ").trim();

    const priorityIndex = (name: string) =>
      prioritySheets.findIndex(
        (item) => normalizeSheetName(item) === normalizeSheetName(name),
      );

    return importedExcelSheets
      .map((sheet, originalIndex) => ({ sheet, originalIndex }))
      .sort((a, b) => {
        const aPriority = priorityIndex(a.sheet.name);
        const bPriority = priorityIndex(b.sheet.name);

        if (aPriority >= 0 && bPriority >= 0) {
          return aPriority - bPriority;
        }

        if (aPriority >= 0) return -1;
        if (bPriority >= 0) return 1;

        return a.originalIndex - b.originalIndex;
      })
      .map(({ sheet }) => sheet);
  }, [importedExcelSheets]);

  const hasExcel = orderedSheets.length > 0;

  const activeSource: "system" | number =
    source !== null ? source : "system";

  const sheetIndex =
    typeof activeSource === "number"
      ? Math.min(activeSource, orderedSheets.length - 1)
      : -1;

  const activeSheet =
    sheetIndex >= 0 ? orderedSheets[sheetIndex] : undefined;

  // Identificador independiente para cada hoja.
  const sheetKey = activeSheet
    ? `${sheetIndex}::${activeSheet.name}`
    : "";

  // Análisis de la hoja seleccionada.
  const sheetAnalysis = useMemo(
    () => (activeSheet ? analyzeSheet(activeSheet) : null),
    [activeSheet],
  );

  // Filas visibles según búsqueda, filtro y filas ocultadas.
  const sheetRows = useMemo(() => {
    if (!sheetAnalysis) return [];

    const filteredRows = filterSheetRows(
      sheetAnalysis,
      search,
      filterType,
    );

    const deletedRows = deletedExcelRows[sheetKey] ?? [];

    return filteredRows.filter(({ n }) => !deletedRows.includes(n));
  }, [
    sheetAnalysis,
    search,
    filterType,
    deletedExcelRows,
    sheetKey,
  ]);

  const sheetSums = useMemo(
    () =>
      sheetAnalysis
        ? sheetTotals(sheetAnalysis, sheetRows)
        : { ingresos: 0, salidas: 0 },
    [sheetAnalysis, sheetRows],
  );

  // Filas del Excel visibles en la hoja activa.
  const visibleExcelRowNumbers = sheetRows.map(({ n }) => n);

  const selectedRowsForSheet = selectedExcelRows[sheetKey] ?? [];

  // Solo cuenta la selección que corresponde a filas visibles.
  const selectedVisibleExcelRows = selectedRowsForSheet.filter((n) =>
    visibleExcelRowNumbers.includes(n),
  );

  const allVisibleExcelSelected =
    visibleExcelRowNumbers.length > 0 &&
    visibleExcelRowNumbers.every((n) =>
      selectedRowsForSheet.includes(n),
    );

  const hiddenInSheet = (deletedExcelRows[sheetKey] ?? []).length;

  // Marcar o desmarcar una fila del Excel.
  const toggleExcelRow = (rowNumber: number) => {
    if (!sheetKey) return;

    setSelectedExcelRows((current) => {
      const currentRows = current[sheetKey] ?? [];

      const nextRows = currentRows.includes(rowNumber)
        ? currentRows.filter((n) => n !== rowNumber)
        : [...currentRows, rowNumber];

      return {
        ...current,
        [sheetKey]: nextRows,
      };
    });
  };

  // Seleccionar o deseleccionar todas las filas visibles de la hoja.
  const toggleAllExcelRows = () => {
    if (!sheetKey || visibleExcelRowNumbers.length === 0) return;

    setSelectedExcelRows((current) => {
      const currentRows = current[sheetKey] ?? [];

      if (allVisibleExcelSelected) {
        return {
          ...current,
          [sheetKey]: currentRows.filter(
            (n) => !visibleExcelRowNumbers.includes(n),
          ),
        };
      }

      return {
        ...current,
        [sheetKey]: [
          ...new Set([
            ...currentRows,
            ...visibleExcelRowNumbers,
          ]),
        ],
      };
    });
  };

  // Ocultar las filas seleccionadas de la hoja (el Excel original no cambia).
  const deleteSelectedExcelRows = () => {
    if (!activeSheet || !sheetKey) return;

    const ids = selectedVisibleExcelRows;

    if (ids.length === 0) {
      window.alert("Selecciona al menos una fila del Excel.");
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar ${ids.length} fila(s) seleccionada(s) de la hoja "${activeSheet.name}"?\n\n` +
        "Dejarán de mostrarse en el Kárdex. " +
        "El archivo Excel original no se modifica y puedes descargarlo completo.",
    );

    if (!confirmed) return;

    updateHidden((current) => ({
      ...current,
      sheets: {
        ...current.sheets,
        [sheetKey]: [
          ...new Set([...(current.sheets[sheetKey] ?? []), ...ids]),
        ],
      },
    }));

    setSelectedExcelRows((current) => ({
      ...current,
      [sheetKey]: (current[sheetKey] ?? []).filter(
        (n) => !ids.includes(n),
      ),
    }));
  };

  const restoreSheetRows = () => {
    if (!sheetKey) return;

    updateHidden((current) => ({
      ...current,
      sheets: { ...current.sheets, [sheetKey]: [] },
    }));
  };

  // Kárdex del sistema.
  const systemRows = (type: KardexType) =>
    [...movements]
      .reverse()
      .filter((m) => {
        if (m.type !== "Entrada" && m.type !== "Salida") return false;

        const matchProd =
          selectedProduct === "all" ||
          m.productId === selectedProduct;

        const matchType = type === "Todos" || m.type === type;

        const matchSearch =
          !search ||
          m.productName.toLowerCase().includes(search.toLowerCase()) ||
          m.reference.toLowerCase().includes(search.toLowerCase());

        return matchProd && matchType && matchSearch;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

  const filtered = systemRows(filterType);

  type RowItem = {
    sort: string;
    m: (typeof movements)[number] | null;
    rec: Record<string, string> | null;
  };

  const workbook = useMemo(
    () => analyzeWorkbook(importedExcelSheets),
    [importedExcelSheets],
  );

  // Evita duplicar movimientos que ya están registrados en el sistema.
  const systemCount = new Map<string, number>();

  movements.forEach((m) => {
    const key = `${dateKey(m.date)}|${m.type}|${normText(m.productName)}|${normText(m.lotNumber)}|${m.qty}`;

    systemCount.set(key, (systemCount.get(key) || 0) + 1);
  });

  const selectedName =
    selectedProduct === "all"
      ? ""
      : normText(products.find((p) => p.id === selectedProduct)?.name);

  const searchTerm = normText(search);

  const excelRowsFor = (type: KardexType) => {
    const remaining = new Map(systemCount);

    return workbook.movements.filter((rec) => {
      // Movimientos que el usuario eliminó de la vista.
      if (hiddenMovKeys.has(rec._key)) return false;

      if (type !== "Todos" && rec.tipo !== type) return false;

      if (selectedName && normText(rec.nombre) !== selectedName) {
        return false;
      }

      if (
        searchTerm &&
        ![
          rec.nombre,
          rec.lote,
          rec.marca,
          rec.proveedor,
          rec.fecha,
          rec.observaciones,
        ].some((v) => normText(v).includes(searchTerm))
      ) {
        return false;
      }

      const key = `${dateKey(rec.fecha)}|${rec.tipo}|${normText(rec.nombre)}|${normText(rec.lote)}|${toNumber(rec.cantidad)}`;

      const left = remaining.get(key) || 0;

      if (left > 0) {
        remaining.set(key, left - 1);
        return false;
      }

      return true;
    });
  };

  const excelMovs = excelRowsFor(filterType);

  const countIn =
    systemRows("Entrada").length + excelRowsFor("Entrada").length;

  const countOut =
    systemRows("Salida").length + excelRowsFor("Salida").length;

  const totalIn =
    filtered
      .filter((m) => m.type === "Entrada")
      .reduce((a, m) => a + m.qty, 0) +
    excelMovs
      .filter((r) => r.tipo === "Entrada")
      .reduce((a, r) => a + toNumber(r.cantidad), 0);

  const totalOut =
    filtered
      .filter((m) => m.type === "Salida")
      .reduce((a, m) => a + m.qty, 0) +
    excelMovs
      .filter((r) => r.tipo === "Salida")
      .reduce((a, r) => a + toNumber(r.cantidad), 0);

  // Orden cronológico de todos los movimientos.
  const rows: RowItem[] = [
    ...filtered.map(
      (m): RowItem => ({
        sort: dateKey(m.date),
        m,
        rec: null,
      }),
    ),
    ...excelMovs.map(
      (rec): RowItem => ({
        sort: dateKey(rec.fecha),
        m: null,
        rec,
      }),
    ),
  ].sort((a, b) =>
    a.sort && b.sort
      ? a.sort < b.sort
        ? -1
        : a.sort > b.sort
          ? 1
          : 0
      : a.sort
        ? -1
        : b.sort
          ? 1
          : 0,
  );

  // ── Selección en la vista "Sistema + Excel" ──
  const visibleMovementIds = rows.flatMap((row) =>
    row.m ? [row.m.id] : [],
  );

  const visibleExcelMovKeys = rows.flatMap((row) =>
    row.rec ? [row.rec._key] : [],
  );

  const selectedSystemVisible = selectedMovementIds.filter((id) =>
    visibleMovementIds.includes(id),
  );

  const selectedExcelVisible = selectedExcelMovs.filter((key) =>
    visibleExcelMovKeys.includes(key),
  );

  const selectedTotal =
    selectedSystemVisible.length + selectedExcelVisible.length;

  const visibleTotal =
    visibleMovementIds.length + visibleExcelMovKeys.length;

  const allVisibleSelected =
    visibleTotal > 0 &&
    visibleMovementIds.every((id) => selectedMovementIds.includes(id)) &&
    visibleExcelMovKeys.every((key) => selectedExcelMovs.includes(key));

  const toggleMovement = (id: string) => {
    setSelectedMovementIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleExcelMov = (key: string) => {
    setSelectedExcelMovs((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  const toggleAllMovements = () => {
    if (allVisibleSelected) {
      setSelectedMovementIds((current) =>
        current.filter((id) => !visibleMovementIds.includes(id)),
      );
      setSelectedExcelMovs((current) =>
        current.filter((key) => !visibleExcelMovKeys.includes(key)),
      );
      return;
    }

    setSelectedMovementIds((current) => [
      ...new Set([...current, ...visibleMovementIds]),
    ]);
    setSelectedExcelMovs((current) => [
      ...new Set([...current, ...visibleExcelMovKeys]),
    ]);
  };

  const hideExcelMovs = (keys: string[]) => {
    if (keys.length === 0) return;

    updateHidden((current) => ({
      ...current,
      movs: [...new Set([...current.movs, ...keys])],
    }));

    setSelectedExcelMovs((current) =>
      current.filter((key) => !keys.includes(key)),
    );
  };

  // Elimina los movimientos del sistema seleccionados (van a la Papelera)
  // y oculta los del Excel seleccionados.
  const deleteSelectedMovements = () => {
    const systemIds = selectedSystemVisible;
    const excelKeys = selectedExcelVisible;

    if (systemIds.length + excelKeys.length === 0) {
      window.alert("Selecciona al menos un movimiento.");
      return;
    }

    const parts = [
      systemIds.length
        ? `${systemIds.length} movimiento(s) del sistema (irán a la Papelera)`
        : "",
      excelKeys.length
        ? `${excelKeys.length} fila(s) del Excel (solo se quitan de esta vista; el archivo original no cambia)`
        : "",
    ].filter(Boolean);

    if (!window.confirm(`¿Eliminar ${parts.join(" y ")}?`)) return;

    systemIds.forEach((id) => deleteMovement(id));

    setSelectedMovementIds((current) =>
      current.filter((id) => !systemIds.includes(id)),
    );

    hideExcelMovs(excelKeys);
  };

  const deleteSingleMovement = (id: string) => {
    if (!window.confirm("¿Eliminar este movimiento?")) return;

    deleteMovement(id);

    setSelectedMovementIds((current) =>
      current.filter((item) => item !== id),
    );
  };

  const deleteSingleExcelMov = (key: string) => {
    if (
      !window.confirm(
        "¿Eliminar esta fila del Kárdex?\n\nSolo se quita de esta vista; el Excel original no cambia.",
      )
    ) {
      return;
    }

    hideExcelMovs([key]);
  };

  const restoreExcelMovs = () => {
    updateHidden((current) => ({ ...current, movs: [] }));
  };

  // Proveedor a partir de su ID.
  const supplierNameFromId = (id?: unknown) => {
    const value = String(id ?? "").trim();

    if (!value) return "";

    const found = suppliers.find(
      (s: any) => String(s.id).trim() === value,
    );

    return String(
      (found as any)?.name ?? (found as any)?.nombre ?? "",
    ).trim();
  };

  const findProduct = (
    productId?: string,
    sku?: string,
    name?: string,
  ) =>
    products.find((p) => productId && p.id === productId) ||
    products.find(
      (p) => sku && String(p.sku).trim() === String(sku).trim(),
    ) ||
    products.find(
      (p) => name && normText(p.name) === normText(name),
    );

  // Presentación y proveedor de una fila de Excel.
  const excelExtras = (rec: Record<string, string>) => {
    const product = findProduct(undefined, undefined, rec.nombre);
    const loteKey = normText(rec.lote);

    const excelLot = (workbook.lots as any[]).find(
      (l) =>
        loteKey &&
        normText(l.lote) === loteKey &&
        (!l.producto ||
          !rec.nombre ||
          normText(l.producto) === normText(rec.nombre)),
    );

    const systemLot = lots.find(
      (l) =>
        loteKey &&
        normText(l.lotNumber) === loteKey &&
        (!product || l.productId === product.id),
    );

    const presentacion =
      String(rec.presentacion ?? "").trim() ||
      String(excelLot?.presentacion ?? "").trim() ||
      String(product?.presentation ?? "").trim();

    const proveedor =
      String(rec.proveedor ?? "").trim() ||
      String(excelLot?.proveedor ?? "").trim() ||
      supplierNameFromId(systemLot?.supplierId) ||
      supplierNameFromId(product?.supplierId);

    return { presentacion, proveedor };
  };

  const safeFileBase = (
    importedExcelFileName || "Excel_importado"
  ).replace(/\.[^.]+$/, "");

  // Descarga el archivo original sin aplicar los cambios visuales.
  const downloadOriginal = () => {
    if (importedExcelFile) {
      downloadOriginalFile(
        importedExcelFile,
        importedExcelFileName || "Excel_importado.xlsx",
      );
    } else {
      exportImportedExcel(
        importedExcelSheets,
        importedExcelFileName || "Excel_importado",
      );
    }
  };

  const downloadSheetDesigned = () => {
    if (!activeSheet) return;

    const sheetName = activeSheet.name
      .replace(/[\\/:*?"<>|]/g, " ")
      .trim();

    exportImportedExcel(
      [activeSheet],
      `${safeFileBase} - ${sheetName}`,
    );
  };

  const sourceButton = (active: boolean) =>
    active ? "btn-primary" : "btn-secondary";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #111820",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#E2E8F0",
              }}
            >
              Kárdex de Inventario
            </h1>

            <div
              style={{
                fontSize: 11,
                color: "#4B5A6B",
                fontFamily: "JetBrains Mono",
              }}
            >
              {activeSheet
                ? `Excel importado · hoja "${activeSheet.name}" · ${sheetRows.length} filas`
                : `${rows.length} movimientos`}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeSheet ? (
              <>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={downloadOriginal}
                  title="Descarga el archivo idéntico al que subiste"
                >
                  Excel original
                </button>

                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={downloadSheetDesigned}
                  title="Descarga esta hoja con diseño"
                >
                  Esta hoja con diseño
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() =>
                    exportProductControlExcel(
                      products,
                      [...filtered].reverse(),
                      lots,
                      suppliers,
                      filterType === "Todos" ? undefined : filterType,
                    )
                  }
                  disabled={filtered.length === 0}
                >
                  Excel
                </button>

                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() =>
                    exportMovementsPDF(
                      filtered,
                      suppliers,
                      "Kardex",
                      products,
                    )
                  }
                  disabled={filtered.length === 0}
                >
                  PDF
                </button>
              </>
            )}
          </div>
        </div>

        {hasExcel && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                color: "#4B5A6B",
                fontFamily: "Outfit",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginRight: 4,
              }}
            >
              Kárdex:
            </span>

            <button
              className={sourceButton(activeSource === "system")}
              style={{ fontSize: 11, padding: "4px 10px" }}
              onClick={() => setSource("system")}
            >
              Sistema + Excel
            </button>

            <span
              style={{
                fontSize: 11,
                color: "#4B5A6B",
                margin: "0 2px",
              }}
            >
              ·
            </span>

            <span
              style={{
                fontSize: 11,
                color: "#00C896",
                fontFamily: "JetBrains Mono",
              }}
            >
              {importedExcelFileName || "Excel importado"}
            </span>

            {orderedSheets.map((sheet, i) => (
              <button
                key={sheet.name + i}
                className={sourceButton(
                  activeSource !== "system" && sheetIndex === i,
                )}
                style={{ fontSize: 11, padding: "4px 10px" }}
                onClick={() => setSource(i)}
                title={`Hoja "${sheet.name}" del Excel importado`}
              >
                {sheet.name}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            className="wms-input"
            placeholder={
              activeSheet
                ? "Buscar en la hoja (producto, lote, fecha...)"
                : "Buscar producto, referencia..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />

          {!activeSheet && (
            <select
              className="wms-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="all">Todos los productos</option>

              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            className={
              filterType === "Todos" ? "btn-primary" : "btn-secondary"
            }
            onClick={() => setFilterType("Todos")}
          >
            Todos
          </button>

          <button
            className={
              filterType === "Entrada" ? "btn-primary" : "btn-secondary"
            }
            onClick={() => setFilterType("Entrada")}
          >
            Ingresos ({countIn})
          </button>

          <button
            className={
              filterType === "Salida" ? "btn-danger" : "btn-secondary"
            }
            onClick={() => setFilterType("Salida")}
          >
            Salidas ({countOut})
          </button>

          {activeSheet ? (
            <>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 10px",
                  border: "1px solid #263444",
                  borderRadius: 6,
                  color: "#CBD5E1",
                  fontSize: 11,
                  cursor:
                    visibleExcelRowNumbers.length > 0
                      ? "pointer"
                      : "not-allowed",
                  opacity:
                    visibleExcelRowNumbers.length > 0 ? 1 : 0.5,
                }}
                title="Seleccionar todas las filas visibles de esta hoja"
              >
                <input
                  type="checkbox"
                  checked={allVisibleExcelSelected}
                  onChange={toggleAllExcelRows}
                  disabled={visibleExcelRowNumbers.length === 0}
                  aria-label="Seleccionar todas las filas visibles del Excel"
                />
                Seleccionar todo ({visibleExcelRowNumbers.length})
              </label>

              <button
                className="btn-danger"
                onClick={deleteSelectedExcelRows}
                disabled={selectedVisibleExcelRows.length === 0}
                style={{
                  opacity:
                    selectedVisibleExcelRows.length === 0 ? 0.5 : 1,
                  cursor:
                    selectedVisibleExcelRows.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
                title={
                  selectedVisibleExcelRows.length === 0
                    ? "Marca primero las filas que quieres eliminar"
                    : "Eliminar las filas seleccionadas de esta vista"
                }
              >
                Eliminar seleccionados (
                {selectedVisibleExcelRows.length})
              </button>

              {hiddenInSheet > 0 && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={restoreSheetRows}
                  title="Volver a mostrar las filas eliminadas de esta hoja"
                >
                  Mostrar {hiddenInSheet} fila(s) eliminada(s)
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="btn-danger"
                onClick={deleteSelectedMovements}
                disabled={selectedTotal === 0}
                style={{
                  opacity: selectedTotal === 0 ? 0.5 : 1,
                  cursor: selectedTotal === 0 ? "not-allowed" : "pointer",
                }}
                title={
                  selectedTotal === 0
                    ? "Marca primero los movimientos que quieres eliminar"
                    : "Eliminar los movimientos seleccionados"
                }
              >
                Eliminar seleccionados ({selectedTotal})
              </button>

              {hidden.movs.length > 0 && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={restoreExcelMovs}
                  title="Volver a mostrar las filas del Excel eliminadas"
                >
                  Mostrar {hidden.movs.length} fila(s) del Excel eliminada(s)
                </button>
              )}
            </>
          )}
        </div>

        {sheetAnalysis &&
          filterType !== "Todos" &&
          sheetAnalysis.tipoCol < 0 &&
          ((filterType === "Entrada" && sheetAnalysis.ingresoCol < 0) ||
            (filterType === "Salida" && sheetAnalysis.salidaCol < 0)) && (
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: "#FBBF24",
              }}
            >
              Esta hoja no tiene una columna de{" "}
              {filterType === "Entrada" ? "ingresos" : "salidas"}; se muestra
              completa.
            </div>
          )}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {activeSheet && sheetAnalysis ? (
          <ImportedSheetTable
            analysis={sheetAnalysis}
            rows={sheetRows}
            selectable
            selectedRows={selectedRowsForSheet}
            onToggleRow={toggleExcelRow}
            onToggleAll={toggleAllExcelRows}
          />
        ) : movements.length === 0 && workbook.movements.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 40, color: "#1A2232" }}>≡</div>

            <div
              style={{
                fontFamily: "Outfit",
                fontSize: 14,
                color: "#4B5A6B",
              }}
            >
              Sin movimientos registrados
            </div>

            <div style={{ fontSize: 11, color: "#2D4050" }}>
              Registra entradas y salidas para ver el kárdex
            </div>
          </div>
        ) : (
          <table className="wms-table">
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#080B10",
                zIndex: 1,
              }}
            >
              <tr>
                <th>Fecha</th>
                <th>F. Producción</th>
                <th>F. Vencimiento</th>
                <th>Lote</th>
                <th style={{ textAlign: "right" }}>Ingreso</th>
                <th style={{ textAlign: "right" }}>Salida</th>
                <th style={{ textAlign: "right" }}>Saldo</th>
                <th>Observaciones</th>
                <th>Presentación</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Proveedor</th>

                <th style={{ textAlign: "center", width: 120 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllMovements}
                      disabled={visibleTotal === 0}
                      title="Seleccionar todos los movimientos visibles"
                      aria-label="Seleccionar todos los movimientos visibles"
                    />
                    <span>Acción</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => {
                const rec = row.rec;

                // Fila que viene del Excel: se puede seleccionar y eliminar de la vista.
                if (rec) {
                  const isIn = rec.tipo === "Entrada";
                  const extras = excelExtras(rec);

                  return (
                    <tr key={`excel-${rec._key}-${rowIndex}`}>
                      <td className="num">{rec.fecha || "—"}</td>
                      <td className="num">{rec.produccion || "—"}</td>
                      <td className="num">{rec.vencimiento || "—"}</td>

                      <td className="num" style={{ color: "#A78BFA" }}>
                        {rec.lote || "—"}
                      </td>

                      <td
                        className="num"
                        style={{
                          textAlign: "right",
                          color: "#00C896",
                          fontWeight: 700,
                        }}
                      >
                        {isIn ? rec.cantidad : "—"}
                      </td>

                      <td
                        className="num"
                        style={{
                          textAlign: "right",
                          color: "#F87171",
                          fontWeight: 700,
                        }}
                      >
                        {!isIn ? rec.cantidad : "—"}
                      </td>

                      <td
                        className="num"
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#E2E8F0",
                        }}
                      >
                        {rec.saldo || "—"}
                      </td>

                      <td style={{ maxWidth: 220, color: "#94A3B8" }}>
                        {rec.observaciones || "—"}
                      </td>

                      <td>{extras.presentacion || "—"}</td>

                      <td
                        style={{
                          fontWeight: 500,
                          color: "#D1D9E2",
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {rec.nombre}
                      </td>

                      <td>{rec.marca || "—"}</td>
                      <td>{extras.proveedor || "—"}</td>

                      <td
                        style={{
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExcelMovs.includes(rec._key)}
                          onChange={() => toggleExcelMov(rec._key)}
                          title="Seleccionar fila del Excel"
                          aria-label="Seleccionar fila del Excel"
                          style={{ marginRight: 6 }}
                        />

                        <span
                          className="badge badge-gray"
                          style={{ marginRight: 6 }}
                        >
                          Excel
                        </span>

                        <button
                          onClick={() => deleteSingleExcelMov(rec._key)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#F87171",
                            fontSize: 14,
                            lineHeight: 1,
                            padding: "2px 6px",
                            borderRadius: 3,
                          }}
                          title="Eliminar esta fila de la vista"
                          aria-label="Eliminar fila del Excel"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                }

                const m = row.m!;

                const movementProduct = findProduct(
                  m.productId,
                  m.sku,
                  m.productName,
                );

                const movementLot =
                  lots.find((lot) => lot.id === m.lotId) ||
                  lots.find(
                    (lot) =>
                      lot.productId ===
                        (movementProduct?.id ?? m.productId) &&
                      normText(lot.lotNumber) === normText(m.lotNumber),
                  );

                const defective = m.notes
                  ?.toLowerCase()
                  .includes("defect");

                const presentation =
                  String(m.presentation ?? "").trim() ||
                  String(movementProduct?.presentation ?? "").trim() ||
                  movementProduct?.unit ||
                  "No registrada";

                const supplierName =
                  supplierNameFromId(m.supplierId) ||
                  supplierNameFromId(movementLot?.supplierId) ||
                  supplierNameFromId(movementProduct?.supplierId) ||
                  "No registrado";

                return (
                  <tr key={m.id}>
                    <td className="num">{m.date}</td>

                    <td className="num">
                      {m.productionDate ||
                        movementLot?.productionDate ||
                        "No registrada"}
                    </td>

                    <td className="num">
                      {m.expiryDate ||
                        movementLot?.expiryDate ||
                        "No registrada"}
                    </td>

                    <td className="num" style={{ color: "#A78BFA" }}>
                      {m.lotNumber || "—"}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                        color: "#00C896",
                        fontWeight: 700,
                      }}
                    >
                      {m.type === "Entrada" ? `${m.qty} unid.` : "—"}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                        color: "#F87171",
                        fontWeight: 700,
                      }}
                    >
                      {m.type === "Salida" ? `${m.qty} unid.` : "—"}
                    </td>

                    <td
                      className="num"
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#E2E8F0",
                      }}
                    >
                      {m.balance} unid.
                    </td>

                    <td
                      style={{
                        maxWidth: 220,
                        color: defective ? "#F87171" : "#94A3B8",
                        fontWeight: defective ? 600 : 400,
                      }}
                    >
                      {m.notes || "—"}
                    </td>

                    <td>{presentation}</td>

                    <td
                      style={{
                        fontWeight: 500,
                        color: "#D1D9E2",
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.productName}
                    </td>

                    <td>
                      {m.brand || movementProduct?.brand || "Sin marca"}
                    </td>

                    <td>{supplierName}</td>

                    <td
                      style={{
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMovementIds.includes(m.id)}
                        onChange={() => toggleMovement(m.id)}
                        title="Seleccionar movimiento"
                        aria-label={`Seleccionar movimiento ${m.reference || m.id}`}
                        style={{ marginRight: 8 }}
                      />

                      <button
                        onClick={() => deleteSingleMovement(m.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#F87171",
                          fontSize: 14,
                          lineHeight: 1,
                          padding: "2px 6px",
                          borderRadius: 3,
                        }}
                        title="Eliminar este movimiento"
                        aria-label="Eliminar movimiento"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div
        style={{
          padding: "10px 24px",
          borderTop: "1px solid #111820",
          background: "#080B10",
          display: "flex",
          gap: 32,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {(activeSheet
          ? [
              {
                label: "Unidades ingresadas",
                value: sheetSums.ingresos.toLocaleString("es-PE"),
                color: "#00C896",
              },
              {
                label: "Unidades retiradas",
                value: sheetSums.salidas.toLocaleString("es-PE"),
                color: "#F87171",
              },
              {
                label: "Filas visibles",
                value: `${sheetRows.length}`,
                color: "#94A3B8",
              },
            ]
          : [
              {
                label: "Unidades ingresadas",
                value: totalIn.toLocaleString("es-PE"),
                color: "#00C896",
              },
              {
                label: "Unidades retiradas",
                value: totalOut.toLocaleString("es-PE"),
                color: "#F87171",
              },
              {
                label: "Total movs.",
                value: `${rows.length}`,
                color: "#94A3B8",
              },
            ]
        ).map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              gap: 6,
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#4B5A6B",
                fontFamily: "Outfit",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {s.label}:
            </span>

            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 13,
                fontWeight: 700,
                color: s.color,
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}