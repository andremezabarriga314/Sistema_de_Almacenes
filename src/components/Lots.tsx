import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { exportLotsExcel, downloadOriginalFile } from "../lib/exportExcel";
import { exportLotsPDF } from "../lib/exportPDF";
import { analyzeWorkbook, dateKey } from "../lib/excelKardex";
import ExcelLotsPanel from "./ExcelLotsPanel";

// Normaliza nombres para comparar sin distinguir tildes, mayúsculas
// ni espacios repetidos.
const normalizeSupplierName = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();

const getSupplierName = (supplier: any) =>
  String(
    supplier?.name ??
      supplier?.nombre ??
      supplier?.razonSocial ??
      supplier?.razon_social ??
      supplier?.["razón social"] ??
      ""
  ).trim();

const badgeClass: Record<string, string> = {
  Vigente: "badge-green",
  "Por vencer": "badge-amber",
  Critico: "badge-red",
  Vencido: "badge-red",
  Agotado: "badge-gray",
};

const pill = (bg: string, border: string, color: string): React.CSSProperties => ({
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 5,
  padding: "5px 12px",
  fontSize: 11,
  color,
  fontFamily: "JetBrains Mono",
});

export default function Lots() {
  const {
    lots,
    products,
    suppliers,
    deleteLot,
    importLots,
    clearAllLots,
    clearImportedLotsView,
    importedExcelSheets,
    importedExcelFile,
    importedExcelFileName,
  } = useApp();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteScope, setDeleteScope] = useState<"selected" | "all">("selected");

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const excelLots = useMemo(
    () =>
      analyzeWorkbook(
        importedExcelSheets.filter(
          (sheet) =>
            !sheet.hiddenFromLots &&
            sheet.name.trim().toLocaleLowerCase() !== "alkathymar",
        ),
      ).lots,
    [importedExcelSheets],
  );

  const enriched = useMemo(() => {
    const systemLots = lots.map((lot: any) => {
      const product = products.find(
        (p: any) =>
          String(p.id) === String(lot.productId) ||
          (!!lot.sku && String(p.sku) === String(lot.sku))
      );

      const lotSupplierId =
        lot.supplierId ?? lot.supplierID ?? lot.idProveedor ?? lot.id_proveedor;

      const productSupplierId = product
        ? (product as any).supplierId ??
          (product as any).supplierID ??
          (product as any).idProveedor ??
          (product as any).id_proveedor
        : undefined;

      const supplierId = lotSupplierId || productSupplierId;

      const supplierById = suppliers.find(
        (s: any) =>
          supplierId != null &&
          String(s.id).trim() !== "" &&
          String(s.id).trim() === String(supplierId).trim()
      );

      // También reconoce nombres que ya estén guardados directamente
      // en el registro del lote.
      const lotSupplierName = String(
        lot.supplierName ??
          lot.supplier_name ??
          lot.supplier ??
          lot.proveedor ??
          lot.nombreProveedor ??
          lot.nombre_proveedor ??
          lot.razonSocial ??
          lot.razon_social ??
          lot["razón social"] ??
          ""
      ).trim();

      const normalizedLotSupplierName = normalizeSupplierName(lotSupplierName);

      const supplierByName = normalizedLotSupplierName
        ? suppliers.find(
            (s: any) =>
              normalizeSupplierName(getSupplierName(s)) ===
              normalizedLotSupplierName
          )
        : undefined;

      const supplier = supplierById || supplierByName;
      const supplierName = getSupplierName(supplier) || lotSupplierName;

      const expiryDate = new Date(String(lot.expiryDate ?? "") + "T00:00:00");
      const daysLeft = Number.isNaN(expiryDate.getTime())
        ? 0
        : Math.floor(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

      let status: string;
      if (Number(lot.qty) <= 0) status = "Agotado";
      else if (daysLeft < 0) status = "Vencido";
      else if (daysLeft <= 7) status = "Critico";
      else if (daysLeft <= 30) status = "Por vencer";
      else status = "Vigente";

      return {
        ...lot,
        daysLeft,
        statusLabel: status,
        product,
        code: lot.sku || (product as any)?.sku || "---",
        presentation: product?.presentation?.trim() || "---",
        supplierName: supplierName || "No registrado",
        unitLabel: product?.unit || "---",
        isExcelOnly: false,
      };
    });

    const registeredKeys = new Set(
      systemLots.map((lot) => {
        const productName = normalizeSupplierName(
          lot.product?.name || lot.productName,
        );
        const brand = normalizeSupplierName(lot.product?.brand);
        const sku = normalizeSupplierName(lot.sku || lot.product?.sku);
        return [
          `${productName}|${brand}|${normalizeSupplierName(lot.lotNumber)}`,
          sku
            ? `sku:${sku}|${normalizeSupplierName(lot.lotNumber)}`
            : "",
        ];
      }).flat().filter(Boolean),
    );

    const excelOnlyLots = excelLots.flatMap((lot) => {
      const sourceName = normalizeSupplierName(lot.producto);
      const sourceBrand = normalizeSupplierName(lot.marca);
      const sourceSku = normalizeSupplierName(lot.codigo);
      const lotNumber = normalizeSupplierName(lot.lote);
      const productMatches = products.filter((product) => {
        if (sourceSku && normalizeSupplierName(product.sku) === sourceSku) {
          return true;
        }
        return (
          normalizeSupplierName(product.name) === sourceName &&
          (!sourceBrand ||
            normalizeSupplierName(product.brand) === sourceBrand)
        );
      });
      const product = productMatches.length === 1 ? productMatches[0] : undefined;
      const productIdentity = product
        ? `${normalizeSupplierName(product.name)}|${normalizeSupplierName(product.brand)}`
        : `${sourceName}|${sourceBrand}`;
      const excelKey = `${productIdentity}|${lotNumber}`;
      const skuKey = sourceSku ? `sku:${sourceSku}|${lotNumber}` : "";
      if (registeredKeys.has(excelKey) || (skuKey && registeredKeys.has(skuKey))) {
        return [];
      }

      const expiryDate = dateKey(lot.vencimiento);
      const productionDate = dateKey(lot.produccion);
      const expiry = expiryDate ? new Date(`${expiryDate}T00:00:00`) : null;
      const daysLeft =
        expiry && !Number.isNaN(expiry.getTime())
          ? Math.floor((expiry.getTime() - today.getTime()) / 86400000)
          : 0;
      const qty = Math.max(0, Number(lot.remaining) || 0);
      const status =
        qty <= 0
          ? "Agotado"
          : daysLeft < 0
            ? "Vencido"
            : daysLeft <= 7
              ? "Critico"
              : daysLeft <= 30
                ? "Por vencer"
                : "Vigente";

      return [{
        id: `EXCEL-${excelKey}`,
        productId: product?.id,
        product,
        productName: product?.name || lot.producto,
        lotNumber: lot.lote,
        sku: product?.sku || lot.codigo,
        code: product?.sku || lot.codigo || "---",
        productionDate,
        expiryDate,
        qty,
        receivedDate: lot.receivedDate || "Excel",
        daysLeft,
        statusLabel: status,
        presentation: product?.presentation?.trim() || lot.presentacion || "---",
        supplierName:
          lot.proveedor ||
          suppliers.find((supplier) => supplier.id === product?.supplierId)?.name ||
          "No registrado",
        unitLabel: product?.unit || "---",
        isExcelOnly: true,
      }];
    });

    return [...systemLots, ...excelOnlyLots];
  }, [lots, products, suppliers, today, excelLots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    const has = (v: unknown) => String(v || "").toLocaleLowerCase().includes(q);

    return enriched.filter((lot) => {
      const matchSearch =
        !q ||
        has(lot.productName) ||
        has(lot.lotNumber) ||
        has(lot.sku) ||
        has(lot.code) ||
        has(lot.supplierName) ||
        has(lot.presentation);

      const matchStatus =
        filterStatus === "Todos" || lot.statusLabel === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [enriched, search, filterStatus]);

  const countBy = (label: string) =>
    enriched.filter((lot) => lot.statusLabel === label).length;

  const expiredCount = countBy("Vencido");
  const criticalCount = countBy("Critico");
  const soonCount = countBy("Por vencer");
  const validCount = countBy("Vigente");

  const toggleLotSelection = (lotId: string) => {
    setSelectedLotIds((current) =>
      current.includes(lotId)
        ? current.filter((id) => id !== lotId)
        : [...current, lotId]
    );
  };

  const toggleAllVisibleLots = () => {
    const visibleIds = filtered
      .filter((lot) => !lot.isExcelOnly)
      .map((lot) => lot.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedLotIds.includes(id));

    setSelectedLotIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    );
  };

  const confirmLotDeletion = () => {
    const ids =
      deleteScope === "all" ? lots.map((lot) => lot.id) : selectedLotIds;
    ids.forEach((id) => deleteLot(id));
    setSelectedLotIds([]);
    setShowDeleteModal(false);
  };

  const registerExcelLot = (lot: (typeof enriched)[number]) => {
    if (!lot.isExcelOnly || !lot.productId) {
      window.alert("No se encontró el producto del sistema para este lote.");
      return;
    }

    try {
      const result = importLots(
        [
          {
            productId: lot.productId,
            lotNumber: lot.lotNumber,
            productionDate: lot.productionDate,
            expiryDate: lot.expiryDate,
            qty: lot.qty,
            receivedDate: dateKey(lot.receivedDate) || undefined,
            supplierId:
              suppliers.find(
                (supplier) =>
                  normalizeSupplierName(supplier.name) ===
                  normalizeSupplierName(lot.supplierName),
              )?.id || lot.product?.supplierId,
          },
        ],
        { reconcileStockWithImportedLots: true },
      );
      if (result.created !== 1) {
        window.alert(`No se registró el lote ${lot.lotNumber}.`);
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : `No se pudo registrar el lote ${lot.lotNumber}.`,
      );
    }
  };

  const deleteCount =
    deleteScope === "all" ? lots.length : selectedLotIds.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Encabezado */}
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
              Control de Lotes
            </h1>
            <div
              style={{
                fontSize: 11,
                color: "#4B5A6B",
                fontFamily: "JetBrains Mono",
              }}
            >
              {filtered.filter((lot) => !lot.isExcelOnly).length} registrados
              {filtered.some((lot) => lot.isExcelOnly) &&
                ` · ${filtered.filter((lot) => lot.isExcelOnly).length} solo Excel`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={pill("#08120E", "#0D3D26", "#00C896")}>
              {validCount} VIGENTE{validCount === 1 ? "" : "S"}
            </div>

            {expiredCount > 0 && (
              <div style={pill("#1E0808", "#3D1010", "#F87171")}>
                {expiredCount} VENCIDOS
              </div>
            )}

            {criticalCount > 0 && (
              <div style={pill("#1E0808", "#3D1010", "#F87171")}>
                {criticalCount} CRITICO{criticalCount > 1 ? "S" : ""} (&lt;7d)
              </div>
            )}

            {soonCount > 0 && (
              <div style={pill("#2A1E08", "#3D2C10", "#FBBF24")}>
                {soonCount} POR VENCER
              </div>
            )}

            <button
  type="button"
  className="btn-danger"
  style={{ fontSize: 11 }}
  onClick={() => {
    const cantidad = lots.length;
    clearAllLots();
    clearImportedLotsView();
    setSelectedLotIds([]);
    setShowDeleteModal(false);
    window.alert(
      `Se eliminaron ${cantidad} lotes registrados y se ocultaron las hojas importadas de la vista Lotes. El archivo Excel original se conserva.`
    );

  }}
>
  ELIMINAR TODO
</button>

            <button
  className="btn-secondary"
  style={{ fontSize: 11 }}
  onClick={() => {
    if (importedExcelFile) {
      downloadOriginalFile(
        importedExcelFile,
        importedExcelFileName || "Excel_importado.xlsx"
      );
    }
  }}
  disabled={!importedExcelFile}
>
  Excel importado
</button>

<button
  className="btn-secondary"
  style={{ fontSize: 11 }}
  onClick={() => exportLotsExcel(lots, suppliers)}
  disabled={lots.length === 0}
>
  Excel lotes registrados
</button>

            <button
              className="btn-secondary"
              style={{ fontSize: 11 }}
              onClick={() => exportLotsPDF(lots)}
              disabled={lots.length === 0 && !importedExcelFile}
            >
              PDF
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="wms-input"
            placeholder="Buscar por lote, alimento, código, proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <select
            className="wms-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>Todos</option>
            <option>Vigente</option>
            <option>Por vencer</option>
            <option>Critico</option>
            <option value="Vencido">Vencidos</option>
            <option>Agotado</option>
          </select>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {enriched.length === 0 && importedExcelSheets.length === 0 ? (
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
            <div style={{ fontSize: 40, color: "#1A2232" }}>L</div>
            <div
              style={{ fontFamily: "Outfit", fontSize: 14, color: "#4B5A6B" }}
            >
              Sin lotes registrados
            </div>
            <div style={{ fontSize: 11, color: "#2D4050" }}>
              Los lotes se crean automáticamente al registrar una entrada, o al
              importar un Excel con lotes
            </div>
          </div>
        ) : (
          <>
            {enriched.length > 0 && (
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
                    <th style={{ width: 38, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={
                          filtered.some((lot) => !lot.isExcelOnly) &&
                          filtered
                            .filter((lot) => !lot.isExcelOnly)
                            .every((lot) => selectedLotIds.includes(lot.id))
                        }
                        onChange={toggleAllVisibleLots}
                        aria-label="Seleccionar todos los lotes visibles"
                      />
                    </th>
                    <th>ID Lote</th>
                    <th>Num. Lote</th>
                    <th>Código</th>
                    <th>Alimento</th>
                    <th>Presentación</th>
                    <th>Proveedor</th>
                    <th>Vencimiento</th>
                    <th style={{ textAlign: "right" }}>Días Restantes</th>
                    <th style={{ textAlign: "right" }}>Unidades</th>
                    <th>Recibido</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filtered
                    .slice()
                    .sort((a, b) =>
                      String(a.expiryDate || "").localeCompare(
                        String(b.expiryDate || "")
                      )
                    )
                    .map((lot) => {
                      const isUrgent =
                        lot.statusLabel === "Vencido" ||
                        lot.statusLabel === "Critico";

                      return (
                        <tr
                          key={lot.id}
                          style={{
                            background: isUrgent
                              ? "rgba(239,68,68,0.03)"
                              : undefined,
                          }}
                        >
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedLotIds.includes(lot.id)}
                              onChange={() => toggleLotSelection(lot.id)}
                              disabled={lot.isExcelOnly}
                              title={lot.isExcelOnly ? "Este lote aparece en el Excel, pero aún no está registrado en el sistema." : undefined}
                              aria-label={`Seleccionar lote ${lot.lotNumber}`}
                            />
                          </td>

                          {/* ID Lote */}
                          <td
                            className="num"
                            style={{ color: "#4B5A6B", fontSize: 10 }}
                          >
                            {lot.isExcelOnly ? "EXCEL" : lot.id}
                          </td>

                          {/* Num. Lote */}
                          <td
                            className="num"
                            style={{ color: "#A78BFA", fontWeight: 600 }}
                          >
                            {lot.lotNumber}
                          </td>

                          {/* Código */}
                          <td
                            className="num"
                            style={{ color: "#94A3B8", fontSize: 11 }}
                          >
                            {lot.code}
                          </td>

                          {/* Alimento */}
                          <td
                            style={{
                              fontWeight: 500,
                              color: "#D1D9E2",
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={lot.productName}
                          >
                            {lot.productName}
                          </td>

                          {/* Presentación */}
                          <td
                            style={{
                              color:
                                lot.presentation === "---" ? "#64748B" : "#CBD5E1",
                              fontSize: 11,
                              maxWidth: 150,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={lot.presentation}
                          >
                            {lot.presentation}
                          </td>

                          {/* Proveedor */}
                          <td
                            style={{
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={lot.supplierName}
                          >
                            {lot.supplierName}
                          </td>

                          {/* Vencimiento */}
                          <td
                            className="num"
                            style={{
                              color: isUrgent
                                ? "#F87171"
                                : lot.statusLabel === "Por vencer"
                                  ? "#FBBF24"
                                  : "#00C896",
                            }}
                          >
                            {lot.expiryDate}
                          </td>

                          {/* Días Restantes */}
                          <td
                            className="num"
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color:
                                lot.daysLeft <= 7
                                  ? "#F87171"
                                  : lot.daysLeft <= 30
                                    ? "#FBBF24"
                                    : "#00C896",
                            }}
                          >
                            {lot.daysLeft < 0 ? "VENCIDO" : `${lot.daysLeft}d`}
                          </td>

                          {/* Unidades */}
                          <td
                            className="num"
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: lot.qty === 0 ? "#4B5A6B" : "#E2E8F0",
                            }}
                          >
                            {lot.qty}
                          </td>

                          {/* Recibido */}
                          <td className="num">{lot.receivedDate}</td>

                          {/* Estado */}
                          <td>
                            <span
                              className={
                                "badge " +
                                (lot.isExcelOnly
                                  ? "badge-amber"
                                  : badgeClass[lot.statusLabel] || "badge-gray")
                              }
                              title={lot.isExcelOnly ? "Lote detectado en el Excel; todavía no está registrado en el inventario." : undefined}
                            >
                              {lot.isExcelOnly
                                ? "SOLO EXCEL"
                                : lot.statusLabel === "Vencido"
                                  ? "VENCIDOS"
                                  : lot.statusLabel}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td style={{ textAlign: "center" }}>
                            {!lot.isExcelOnly && (
                              <button
                                className="btn-danger"
                                onClick={() => {
                                  if (confirm(`¿Eliminar el lote "${lot.lotNumber}"?`)) {
                                    deleteLot(lot.id);
                                    setSelectedLotIds((current) =>
                                      current.filter((id) => id !== lot.id)
                                    );
                                  }
                                }}
                                style={{ padding: "3px 8px", fontSize: 11 }}
                              >
                                Eliminar
                              </button>
                            )}
                            {lot.isExcelOnly && (
                              <button
                                className="btn-primary"
                                disabled={!lot.productId}
                                onClick={() => registerExcelLot(lot)}
                                style={{ padding: "3px 8px", fontSize: 11 }}
                                title={
                                  lot.productId
                                    ? "Registrar este lote faltante en el inventario."
                                    : "Primero importa el producto desde la sección Productos."
                                }
                              >
                                Registrar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}

            <ExcelLotsPanel />
          </>
        )}
      </div>

      {/* Modal de eliminación */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div className="wms-card" style={{ width: 470 }}>
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #1A2232",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "Outfit",
                    fontSize: 16,
                    color: "#E2E8F0",
                  }}
                >
                  Eliminar lotes
                </h2>
                <div style={{ marginTop: 4, fontSize: 11, color: "#64748B" }}>
                  Selecciona los lotes que deseas eliminar.
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748B",
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 20, display: "grid", gap: 10 }}>
              {/* Seleccionados */}
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "12px 14px",
                  border:
                    deleteScope === "selected"
                      ? "1px solid #00C896"
                      : "1px solid #1A2232",
                  borderRadius: 6,
                  background:
                    deleteScope === "selected"
                      ? "rgba(0,200,150,0.06)"
                      : "#0A0F17",
                  cursor: selectedLotIds.length ? "pointer" : "not-allowed",
                  opacity: selectedLotIds.length ? 1 : 0.5,
                }}
              >
                <input
                  type="radio"
                  name="delete-lot-scope"
                  checked={deleteScope === "selected"}
                  disabled={!selectedLotIds.length}
                  onChange={() => setDeleteScope("selected")}
                />
                <span>
                  <span
                    style={{
                      display: "block",
                      color: "#E2E8F0",
                      fontFamily: "Outfit",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Eliminar seleccionados
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      color: "#64748B",
                      fontSize: 11,
                    }}
                  >
                    {selectedLotIds.length} lote
                    {selectedLotIds.length === 1 ? "" : "s"} seleccionado
                    {selectedLotIds.length === 1 ? "" : "s"}
                  </span>
                </span>
              </label>

              {/* Todos */}
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "12px 14px",
                  border:
                    deleteScope === "all"
                      ? "1px solid #EF4444"
                      : "1px solid #1A2232",
                  borderRadius: 6,
                  background:
                    deleteScope === "all"
                      ? "rgba(239,68,68,0.06)"
                      : "#0A0F17",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="delete-lot-scope"
                  checked={deleteScope === "all"}
                  onChange={() => setDeleteScope("all")}
                />
                <span>
                  <span
                    style={{
                      display: "block",
                      color: "#F87171",
                      fontFamily: "Outfit",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Eliminar todos
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      color: "#64748B",
                      fontSize: 11,
                    }}
                  >
                    {lots.length} lotes serán eliminados
                  </span>
                </span>
              </label>

              <div
                className="alert-critical"
                style={{
                  marginTop: 4,
                  padding: "9px 12px",
                  borderRadius: 5,
                  color: "#FCA5A5",
                  fontSize: 11,
                }}
              >
                Se eliminarán {deleteCount} lote{deleteCount === 1 ? "" : "s"}.
              </div>
            </div>

            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #1A2232",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={confirmLotDeletion}
                disabled={deleteScope === "selected" && !selectedLotIds.length}
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