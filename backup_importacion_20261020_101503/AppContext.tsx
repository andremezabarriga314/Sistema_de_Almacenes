import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";

/* ─────────────────────────── Tipos ─────────────────────────── */

export type Product = {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  presentation?: string;
  gramsPerUnit?: number;
  costPrice: number;
  salePrice: number;
  stock: number;
  unit: string;
  location: string;
  supplierId?: string;
  status: "Activo" | "Inactivo";
  storageTemp: string;
  createdAt: string;
  lastMovement: string;
  deletedAt?: string;
};

export type Lot = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  lotNumber: string;
  productionDate: string;
  expiryDate: string;
  qty: number;
  gramsPerUnit?: number;
  totalGrams?: number;
  unitCost: number;
  receivedDate: string;
  receivedAt?: string;
  supplierId?: string;
  status: "Vigente" | "Por vencer" | "Vencido" | "Agotado";
};

export type LotAllocation = {
  lotId: string;
  lotNumber: string;
  qty: number;
  remainingAfter: number;
  productionDate?: string;
  expiryDate?: string;
};

export type Movement = {
  id: string;
  date: string;
  type: "Entrada" | "Salida" | "Ajuste" | "Devolución";
  productId: string;
  productName: string;
  sku: string;
  // Marca guardada en el propio movimiento (se conserva aunque el producto cambie)
  brand?: string;
  qty: number;
  unitCost: number;
  salePrice?: number;
  total: number;
  balance: number;
  reference: string;
  user: string;
  lotId?: string;
  lotNumber?: string;
  productionDate?: string;
  expiryDate?: string;
  supplierId?: string;
  presentation?: string;
  gramsPerUnit?: number;
  totalGrams?: number;
  client?: string;
  reason?: string;
  notes?: string;
  lotAllocations?: LotAllocation[];
  stockBefore?: number;
  stockAfter?: number;
};

export type Supplier = {
  id: string;
  name: string;
  ruc: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  deliveryDays: number;
  rating: number;
  status: "Activo" | "Inactivo";
  notes?: string;
  createdAt: string;
  deletedAt?: string;
};

export type ExcelMerge = {
  s: { r: number; c: number };
  e: { r: number; c: number };
};

export type ImportedExcelSheet = {
  name: string;
  headers: string[];
  // Filas tal como se muestran en Excel (texto)
  rows: string[][];
  // Valores originales con su tipo (números como números) para volver a descargar el archivo igual
  values?: (string | number)[][];
  merges?: ExcelMerge[];
  colWidths?: (number | null)[];
  // [fila, columna, formato] de números y fechas, para descargar el archivo igual
  numFmts?: [number, number, string][];
};

export type TrashItem = {
  id: string;
  type: "Alimento" | "Proveedor" | "Movimiento" | "Lote";
  name: string;
  deletedAt: string;
  payload: Product | Supplier | Movement | Lot;
};

export type InitialLotData = {
  lotNumber: string;
  // Referencia del movimiento de ingreso (por defecto "Stock inicial")
  reference?: string;
  productionDate: string;
  expiryDate: string;
  qty: number;
  receivedDate?: string;
  supplierId?: string;
};

export type ExistingStockLotData = {
  productId: string;
  lotNumber: string;
  productionDate: string;
  expiryDate: string;
  qty: number;
  receivedDate?: string;
  supplierId?: string;
};

export type MovementLotData = {
  lotNumber?: string;
  productionDate?: string;
  expiryDate?: string;
  lotId?: string;
};

export type MovementInput = Omit<Movement, "id" | "date"> & {
  date?: string;
};

type AppState = {
  seeded: boolean;
  seedAll: () => void;

  products: Product[];
  lots: Lot[];
  movements: Movement[];
  suppliers: Supplier[];
  trash: TrashItem[];

  importedExcelFileName: string;
  importedExcelSheets: ImportedExcelSheet[];
  importedExcelFile: ArrayBuffer | null;
  saveImportedExcelSheets: (fileName: string, sheets: ImportedExcelSheet[], originalFile?: ArrayBuffer) => void;
  clearImportedExcelSheets: () => void;

  replaceProducts: (products: Product[]) => void;

  addProduct: (
    p: Omit<Product, "id" | "createdAt" | "lastMovement" | "deletedAt">,
    lotData?: InitialLotData
  ) => Product;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  deleteProducts: (ids: string[]) => void;
  restoreProduct: (trashId: string) => void;

  registerExistingStockLot: (data: ExistingStockLotData) => Lot;
  registerLotEntry: (data: ExistingStockLotData) => Lot;
  importLots: (rows: ExistingStockLotData[]) => { created: number; stockAdded: number };

  addMovement: (m: MovementInput, lotData?: MovementLotData) => Movement;
  deleteMovement: (id: string) => void;
  deleteMovements: (ids: string[]) => void;
  restoreMovement: (trashId: string) => void;

  deleteLot: (id: string) => void;
  deleteLots: (ids: string[]) => void;
  restoreLot: (trashId: string) => void;

  addSupplier: (s: Omit<Supplier, "id" | "createdAt" | "deletedAt">) => Supplier;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  restoreSupplier: (trashId: string) => void;

  purgeTrash: (trashId: string) => void;
};

/* ─────────────────────── Persistencia ─────────────────────── */

const STORAGE_KEY = "INAMBU_WMS_DATA_V2";

type PersistedState = {
  products: Product[];
  lots: Lot[];
  movements: Movement[];
  suppliers: Supplier[];
  trash: TrashItem[];
  importedExcelFileName?: string;
  importedExcelSheets?: ImportedExcelSheet[];
};

/* ───────────────────────── Fechas ───────────────────────── */

function parseDateOnly(value: string): Date | null {
  if (!value) return null;

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);

  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }

  return date;
}

function getTodayDateOnly(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = parseDateOnly(expiryDate);
  if (!expiry) return 9999;

  return Math.round((expiry.getTime() - getTodayDateOnly().getTime()) / 86400000);
}

function isProductionAfterExpiry(productionDate: string, expiryDate: string): boolean {
  const production = parseDateOnly(productionDate);
  const expiry = parseDateOnly(expiryDate);

  return !!production && !!expiry && production.getTime() > expiry.getTime();
}

export function getLotStatus(expiryDate: string, qty: number): Lot["status"] {
  if (qty <= 0) return "Agotado";
  if (!expiryDate) return "Vigente";

  const days = getDaysUntilExpiry(expiryDate);

  if (days < 0) return "Vencido";
  if (days <= 30) return "Por vencer";

  return "Vigente";
}

function getDateTime(): string {
  return new Date().toISOString();
}

export function formatDateOnly(value: string): string {
  if (!value) return "";

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

export function formatDateTime(value: string): string {
  if (!value) return "";

  const v = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return formatDateOnly(v);
  }

  const date = new Date(v);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/* ───────────────────────── Utilidades ───────────────────────── */

const makeId = (prefix: string, n: number) => `${prefix}-${String(n).padStart(5, "0")}`;

const sameLot = (lot: Lot, productId: string, lotNumber: string) =>
  lot.productId === productId &&
  lot.lotNumber.trim().toLowerCase() === lotNumber.trim().toLowerCase();

/* ─────────── Almacenamiento grande (IndexedDB) para el Excel importado ─────────── */

const IDB_NAME = "INAMBU_WMS_FILES";
const IDB_STORE = "kv";
const EXCEL_KEY = "importedExcel";

function openFilesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openFilesDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openFilesDb();
  const result = await new Promise<T | undefined>((resolve, reject) => {
    const request = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

async function idbDelete(key: string): Promise<void> {
  const db = await openFilesDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

const AppContext = createContext<AppState | undefined>(undefined);

/* ───────────────────────── Provider ───────────────────────── */

export function AppProvider({ children }: { children: ReactNode }) {
  const [seeded, setSeeded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);

  const [importedExcelFileName, setImportedExcelFileName] = useState("");
  const [importedExcelSheets, setImportedExcelSheets] = useState<ImportedExcelSheet[]>([]);
  // Archivo original tal como se subió: se devuelve sin cambios al descargar
  const [importedExcelFile, setImportedExcelFile] = useState<ArrayBuffer | null>(null);

  const saveImportedExcelSheets = useCallback(
    (fileName: string, sheets: ImportedExcelSheet[], originalFile?: ArrayBuffer) => {
    setImportedExcelFileName(fileName);
    setImportedExcelFile(originalFile ?? null);
    setImportedExcelSheets(
      sheets.map((sheet) => ({
        name: sheet.name,
        headers: [...sheet.headers],
        rows: sheet.rows.map((row) => [...row]),
        values: sheet.values?.map((row) => [...row]),
        merges: sheet.merges?.map((m) => ({ s: { ...m.s }, e: { ...m.e } })),
        colWidths: sheet.colWidths ? [...sheet.colWidths] : undefined,
        numFmts: sheet.numFmts?.map((f) => [f[0], f[1], f[2]] as [number, number, string]),
      }))
    );
    },
    []
  );

  const clearImportedExcelSheets = useCallback(() => {
    setImportedExcelFileName("");
    setImportedExcelFile(null);
    setImportedExcelSheets([]);
  }, []);

  const [excelReady, setExcelReady] = useState(false);

  // Cargar el Excel importado (todas sus hojas) desde IndexedDB
  useEffect(() => {
    let cancelled = false;

    idbGet<{ fileName: string; sheets: ImportedExcelSheet[]; file?: ArrayBuffer }>(EXCEL_KEY)
      .then((saved) => {
        if (cancelled || !saved || !Array.isArray(saved.sheets) || !saved.sheets.length) return;
        // Si ya hay datos en memoria (por ejemplo, migrados), no se pisan
        setImportedExcelSheets((current) => (current.length ? current : saved.sheets));
        setImportedExcelFileName((current) => current || saved.fileName || "");
        setImportedExcelFile((current) => current ?? saved.file ?? null);
      })
      .catch((error) => console.error("Error cargando el Excel importado:", error))
      .finally(() => {
        if (!cancelled) setExcelReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Guardar el Excel importado en IndexedDB (sin el límite de ~5 MB de localStorage)
  useEffect(() => {
    if (!excelReady) return;

    if (importedExcelSheets.length === 0) {
      idbDelete(EXCEL_KEY).catch(() => undefined);
      return;
    }

    idbSet(EXCEL_KEY, {
      fileName: importedExcelFileName,
      sheets: importedExcelSheets,
      file: importedExcelFile ?? undefined,
    }).catch((error) => console.error("Error guardando el Excel importado:", error));
  }, [excelReady, importedExcelFileName, importedExcelSheets, importedExcelFile]);

  const productSeq = useRef(1);
  const movementSeq = useRef(1);
  const supplierSeq = useRef(1);
  const trashSeq = useRef(1);
  const lotSeq = useRef(1);
  const createdSupplierIds = useRef(new Set<string>());
  const loadedFromStorage = useRef(false);

  const getNextSequence = (items: { id: string }[], prefix: string) => {
    let max = 0;

    items.forEach((item) => {
      const match = new RegExp(`^${prefix}-(\\d+)$`).exec(item.id);
      if (match) {
        max = Math.max(max, Number(match[1]));
      }
    });

    return max + 1;
  };

  /* ── Cargar desde localStorage ── */
  useEffect(() => {
    if (loadedFromStorage.current) return;
    loadedFromStorage.current = true;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setSeeded(true);
        return;
      }

      const parsed = JSON.parse(saved) as PersistedState;

      const savedProducts = Array.isArray(parsed.products) ? parsed.products : [];
      const savedLots = Array.isArray(parsed.lots) ? parsed.lots : [];
      const savedMovements = Array.isArray(parsed.movements) ? parsed.movements : [];
      const savedSuppliers = Array.isArray(parsed.suppliers) ? parsed.suppliers : [];
      const savedTrash = Array.isArray(parsed.trash) ? parsed.trash : [];

      setProducts(savedProducts);
      setLots(savedLots);
      setMovements(savedMovements);
      setSuppliers(savedSuppliers);
      setTrash(savedTrash);
      setImportedExcelFileName(
        typeof parsed.importedExcelFileName === "string" ? parsed.importedExcelFileName : ""
      );
      setImportedExcelSheets(
        Array.isArray(parsed.importedExcelSheets)
          ? parsed.importedExcelSheets.filter(
              (sheet) =>
                sheet &&
                typeof sheet.name === "string" &&
                Array.isArray(sheet.headers) &&
                Array.isArray(sheet.rows)
            )
          : []
      );

      productSeq.current = getNextSequence(savedProducts, "PROD");
      movementSeq.current = getNextSequence(savedMovements, "MOV");
      supplierSeq.current = getNextSequence(savedSuppliers, "SUP");
      lotSeq.current = getNextSequence(savedLots, "LOT");
      trashSeq.current = getNextSequence(savedTrash, "TRASH");

      setSeeded(true);
    } catch (error) {
      console.error("Error cargando datos de INAMBU:", error);

      setProducts([]);
      setLots([]);
      setMovements([]);
      setSuppliers([]);
      setTrash([]);
      setImportedExcelFileName("");
      setImportedExcelSheets([]);

      setSeeded(true);
    }
  }, []);

  /* ── Guardar en localStorage ── */
  useEffect(() => {
    if (!loadedFromStorage.current) return;
    if (!seeded) return;

    const data: PersistedState = {
      products,
      lots,
      movements,
      suppliers,
      trash,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error guardando datos de INAMBU:", error);
    }
  }, [
    products,
    lots,
    movements,
    suppliers,
    trash,
    seeded,
  ]);

  const seedAll = useCallback(() => {
    setSeeded(true);
  }, []);

  /* ── Papelera ── */
  const addToTrash = (type: TrashItem["type"], name: string, payload: TrashItem["payload"]) => {
    const deletedAt = getDateTime();

    const item: TrashItem = {
      id: makeId("TRASH", trashSeq.current++),
      type,
      name,
      deletedAt,
      payload,
    };

    setTrash((current) => [...current, item]);

    return deletedAt;
  };

  const removeFromTrash = (trashId: string) => {
    setTrash((current) => current.filter((item) => item.id !== trashId));
  };

  /* ── Ayudas de stock y lotes ── */
  const adjustProductStock = (productId: string, delta: number) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, Number(product.stock || 0) + delta) }
          : product
      )
    );
  };

  const patchLot = (id: string, qty: number) => {
    setLots((current) =>
      current.map((lot) =>
        lot.id === id ? { ...lot, qty, status: getLotStatus(lot.expiryDate, qty) } : lot
      )
    );
  };

  /* ───────────────────── Productos ───────────────────── */

  // Importa/actualiza el catálogo sin borrar productos existentes ni alterar el stock real.
  const replaceProducts: AppState["replaceProducts"] = (incoming) => {
    setProducts((current) => {
      const incomingBySku = new Map(
        incoming.map((product) => [product.sku.trim().toLocaleLowerCase(), product])
      );
      const currentSkus = new Set(current.map((product) => product.sku.trim().toLocaleLowerCase()));

      const merged = current.map((existing) => {
        const imported = incomingBySku.get(existing.sku.trim().toLocaleLowerCase());
        if (!imported) return existing;

        return {
          ...existing,
          ...imported,
          id: existing.id,
          stock: existing.stock,
          createdAt: existing.createdAt,
          lastMovement: existing.lastMovement,
        };
      });

      for (const imported of incoming) {
        const key = imported.sku.trim().toLocaleLowerCase();
        if (!currentSkus.has(key)) {
          merged.push({ ...imported, stock: 0 });
        }
      }

      return merged;
    });
  };

  const addProduct: AppState["addProduct"] = (data, lotData) => {
    const initialQty = Number(lotData?.qty ?? data.stock ?? 0);

    if (!Number.isFinite(initialQty)) {
      throw new Error("El stock inicial no es válido.");
    }

    if (initialQty < 0) {
      throw new Error("El stock no puede ser negativo.");
    }

    if (initialQty > 0 && !lotData) {
      throw new Error(
        "Para crear un alimento con stock inicial debes registrar su lote inicial."
      );
    }

    if (lotData && lotData.qty > 0) {
      if (!lotData.lotNumber.trim()) {
        throw new Error("El número de lote es obligatorio.");
      }

      if (!lotData.productionDate || !lotData.expiryDate) {
        throw new Error("La fecha de producción y vencimiento son obligatorias.");
      }

      if (isProductionAfterExpiry(lotData.productionDate, lotData.expiryDate)) {
        throw new Error("La fecha de producción no puede ser posterior al vencimiento.");
      }
    }

    const now = getDateTime();
    const receivedDate = lotData?.receivedDate || now;

    const product: Product = {
      ...data,
      id: makeId("PROD", productSeq.current++),
      stock: initialQty,
      createdAt: now,
      lastMovement: now,
    };

    setProducts((current) => [...current, product]);

    if (lotData && lotData.qty > 0) {
      const lotId = makeId("LOT", lotSeq.current++);
      const lotNumber = lotData.lotNumber.trim();
      const grams = Number(product.gramsPerUnit || 0);

      const lot: Lot = {
        id: lotId,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        lotNumber,
        productionDate: lotData.productionDate,
        expiryDate: lotData.expiryDate,
        qty: lotData.qty,
        gramsPerUnit: grams,
        totalGrams: Number(lotData.qty) * grams,
        unitCost: product.costPrice || 0,
        receivedDate,
        receivedAt: receivedDate,
        supplierId: lotData.supplierId,
        status: getLotStatus(lotData.expiryDate, lotData.qty),
      };

      const movement: Movement = {
        id: makeId("MOV", movementSeq.current++),
        date: receivedDate,
        type: "Entrada",
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        brand: product.brand,
        presentation: product.presentation,
        qty: lotData.qty,
        gramsPerUnit: grams,
        totalGrams: Number(lotData.qty) * grams,
        unitCost: product.costPrice || 0,
        total: 0,
        balance: initialQty,
        reference: lotData.reference || "Stock inicial",
        user: "Admin",
        lotId,
        lotNumber,
        productionDate: lotData.productionDate,
        expiryDate: lotData.expiryDate,
        supplierId: lotData.supplierId,
        stockBefore: 0,
        stockAfter: initialQty,
      };

      setLots((current) => [...current, lot]);
      setMovements((current) => [movement, ...current]);
    }

    return product;
  };

  const updateProduct: AppState["updateProduct"] = (id, data) => {
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, ...data } : product))
    );
  };

  const deleteProduct = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    addToTrash("Alimento", product.name, product);

    setProducts((current) => current.filter((item) => item.id !== id));
  };

  const deleteProducts = (ids: string[]) => {
    ids.forEach((id) => {
      deleteProduct(id);
    });
  };

  const restoreProduct = (trashId: string) => {
    const item = trash.find(
      (trashItem) => trashItem.id === trashId && trashItem.type === "Alimento"
    );
    if (!item) return;

    const product = item.payload as Product;

    const restored: Product = {
      ...product,
      status: "Activo",
      deletedAt: undefined,
    };

    setProducts((current) =>
      current.some((p) => p.id === product.id)
        ? current.map((p) => (p.id === product.id ? restored : p))
        : [...current, restored]
    );

    removeFromTrash(trashId);
  };

  /* ───────────────────── Lotes ───────────────────── */

  const registerExistingStockLot: AppState["registerExistingStockLot"] = (data) => {
    const product = products.find((p) => p.id === data.productId);

    if (!product) {
      throw new Error("No se encontró el alimento.");
    }

    if (product.status !== "Activo") {
      throw new Error("El alimento está inactivo.");
    }

    const lotNumber = data.lotNumber.trim();

    if (!lotNumber) {
      throw new Error("El número de lote es obligatorio.");
    }

    if (data.qty <= 0) {
      throw new Error("La cantidad debe ser mayor a 0.");
    }

    if (!Number.isInteger(Number(data.qty))) {
      throw new Error("La cantidad debe ser un número entero de unidades.");
    }

    if (!data.productionDate || !data.expiryDate) {
      throw new Error("La fecha de producción y vencimiento son obligatorias.");
    }

    if (isProductionAfterExpiry(data.productionDate, data.expiryDate)) {
      throw new Error("La fecha de producción no puede ser posterior al vencimiento.");
    }

    if (lots.some((lot) => sameLot(lot, data.productId, lotNumber))) {
      throw new Error("Ese lote ya existe para este alimento.");
    }

    const assigned = lots
      .filter((lot) => lot.productId === data.productId)
      .reduce((sum, lot) => sum + Number(lot.qty || 0), 0);

    const unassigned = Math.max(0, Number(product.stock || 0) - assigned);

    if (data.qty > unassigned) {
      throw new Error(`Solo hay ${unassigned} ${product.unit} de stock sin lote asignado.`);
    }

    const receivedDate = data.receivedDate || getDateTime();

    const lot: Lot = {
      id: makeId("LOT", lotSeq.current++),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      lotNumber,
      productionDate: data.productionDate,
      expiryDate: data.expiryDate,
      qty: data.qty,
      unitCost: product.costPrice || 0,
      receivedDate,
      receivedAt: receivedDate,
      supplierId: data.supplierId,
      status: getLotStatus(data.expiryDate, data.qty),
    };

    setLots((current) => [...current, lot]);

    return lot;
  };

  const registerLotEntry: AppState["registerLotEntry"] = (data) => {
    const product = products.find((p) => p.id === data.productId);

    if (!product) {
      throw new Error("No se encontró el alimento.");
    }

    if (product.status !== "Activo") {
      throw new Error("El alimento está inactivo.");
    }

    const lotNumber = data.lotNumber.trim();

    if (!lotNumber) {
      throw new Error("El número de lote es obligatorio.");
    }

    const qty = Number(data.qty);

    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error("La cantidad debe ser mayor a 0.");
    }

    if (!data.productionDate) {
      throw new Error("La fecha de producción es obligatoria.");
    }

    if (!data.expiryDate) {
      throw new Error("La fecha de vencimiento es obligatoria.");
    }

    if (isProductionAfterExpiry(data.productionDate, data.expiryDate)) {
      throw new Error("La fecha de producción no puede ser posterior al vencimiento.");
    }

    if (lots.some((lot) => sameLot(lot, data.productId, lotNumber))) {
      throw new Error(
        "Ese lote ya existe para este alimento. Si estás recibiendo más mercadería del mismo lote, utiliza Entradas."
      );
    }

    const supplierId = String(data.supplierId || "").trim();

    if (
      supplierId &&
      !createdSupplierIds.current.has(supplierId) &&
      !suppliers.some((supplier) => supplier.id === supplierId && supplier.status === "Activo")
    ) {
      throw new Error("El proveedor seleccionado no es válido o está inactivo.");
    }

    const now = getDateTime();
    const receivedDate = data.receivedDate || now;
    const stockBefore = Number(product.stock || 0);
    const stockAfter = stockBefore + qty;
    const lotId = makeId("LOT", lotSeq.current++);
    const grams = Number(product.gramsPerUnit || 0);

    const lot: Lot = {
      id: lotId,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      lotNumber,
      productionDate: data.productionDate,
      expiryDate: data.expiryDate,
      qty,
      gramsPerUnit: grams,
      totalGrams: qty * grams,
      unitCost: product.costPrice || 0,
      receivedDate,
      receivedAt: receivedDate,
      supplierId: supplierId || undefined,
      status: getLotStatus(data.expiryDate, qty),
    };

    const movement: Movement = {
      id: makeId("MOV", movementSeq.current++),
      date: now,
      type: "Entrada",
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      brand: product.brand,
      qty,
      gramsPerUnit: grams,
      totalGrams: qty * grams,
      unitCost: product.costPrice || 0,
      total: qty * (product.costPrice || 0),
      balance: stockAfter,
      reference: "Ingreso de lote",
      user: "Admin",
      lotId,
      lotNumber,
      productionDate: data.productionDate,
      expiryDate: data.expiryDate,
      supplierId: supplierId || undefined,
      stockBefore,
      stockAfter,
    };

    setLots((current) => [...current, lot]);

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, stock: stockAfter, lastMovement: now } : item
      )
    );

    setMovements((current) => [movement, ...current]);

    return lot;
  };

  const importLots: AppState["importLots"] = (rows) => {
    if (!rows.length) return { created: 0, stockAdded: 0 };

    const pending: ExistingStockLotData[] = [];
    const seen = new Set(
      lots.map((lot) => `${lot.productId}::${lot.lotNumber.trim().toLocaleLowerCase()}`)
    );

    for (const row of rows) {
      const product = products.find((item) => item.id === row.productId);
      if (!product) throw new Error(`No se encontró el producto para el lote ${row.lotNumber}.`);
      if (product.status !== "Activo") throw new Error(`El producto ${product.name} está inactivo.`);

      const lotNumber = String(row.lotNumber || "").trim();
      if (!lotNumber) throw new Error("Hay un lote sin número.");

      const key = `${product.id}::${lotNumber.toLocaleLowerCase()}`;
      if (seen.has(key)) {
        throw new Error(`El lote ${lotNumber} ya existe o está repetido en el Excel.`);
      }
      seen.add(key);

      const qty = Number(row.qty);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`La cantidad del lote ${lotNumber} debe ser un entero mayor que cero.`);
      }
      if (!row.productionDate || !row.expiryDate) {
        throw new Error(`El lote ${lotNumber} necesita fecha de producción y vencimiento.`);
      }
      if (isProductionAfterExpiry(row.productionDate, row.expiryDate)) {
        throw new Error(`La producción del lote ${lotNumber} es posterior a su vencimiento.`);
      }

      pending.push({ ...row, lotNumber, qty });
    }

    const rowsByProduct = new Map<string, ExistingStockLotData[]>();
    for (const row of pending) {
      const group = rowsByProduct.get(row.productId) || [];
      group.push(row);
      rowsByProduct.set(row.productId, group);
    }

    const stockAddedByProduct = new Map<string, number>();
    let stockAdded = 0;

    for (const [productId, group] of rowsByProduct) {
      const product = products.find((item) => item.id === productId);
      if (!product) continue;

      const assigned = lots
        .filter((lot) => lot.productId === productId)
        .reduce((sum, lot) => sum + Number(lot.qty || 0), 0);
      const unassigned = Math.max(0, Number(product.stock || 0) - assigned);
      const incomingQty = group.reduce((sum, row) => sum + row.qty, 0);

      if (incomingQty <= unassigned) {
        stockAddedByProduct.set(productId, 0);
      } else if (Number(product.stock || 0) === 0 && assigned === 0) {
        stockAddedByProduct.set(productId, incomingQty);
        stockAdded += incomingQty;
      } else {
        throw new Error(
          `Los lotes nuevos de ${product.name} suman ${incomingQty} unidades, pero solo hay ${unassigned} unidades de stock sin lote asignado. No se importó ningún lote.`
        );
      }
    }

    const now = getDateTime();

    const createdLots: Lot[] = pending.map((row) => {
      const product = products.find((item) => item.id === row.productId)!;
      const receivedDate = row.receivedDate || now;
      const grams = Number(product.gramsPerUnit || 0);

      return {
        id: makeId("LOT", lotSeq.current++),
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        lotNumber: row.lotNumber,
        productionDate: row.productionDate,
        expiryDate: row.expiryDate,
        qty: row.qty,
        gramsPerUnit: grams,
        totalGrams: row.qty * grams,
        unitCost: product.costPrice || 0,
        receivedDate,
        receivedAt: receivedDate,
        supplierId: row.supplierId,
        status: getLotStatus(row.expiryDate, row.qty),
      };
    });

    const movementRows: Movement[] = [];
    const runningBalance = new Map<string, number>();

    for (let i = 0; i < pending.length; i++) {
      const row = pending[i];

      // CORREGIDO: Map.get() puede devolver undefined
      if ((stockAddedByProduct.get(row.productId) ?? 0) <= 0) continue;

      const product = products.find((item) => item.id === row.productId)!;
      const prior = runningBalance.get(row.productId) ?? Number(product.stock || 0);
      const balance = prior + row.qty;
      runningBalance.set(row.productId, balance);

      movementRows.push({
        id: makeId("MOV", movementSeq.current++),
        date: row.receivedDate || now,
        type: "Entrada",
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        brand: product.brand,
        qty: row.qty,
        unitCost: product.costPrice || 0,
        salePrice: product.salePrice || 0,
        total: row.qty * (product.costPrice || 0),
        balance,
        reference: `IMP-LOT-${Date.now()}-${i + 1}`,
        user: "Importación Excel",
        lotId: createdLots[i]?.id,
        lotNumber: row.lotNumber,
        productionDate: row.productionDate,
        expiryDate: row.expiryDate,
        supplierId: row.supplierId,
        presentation: product.presentation,
        gramsPerUnit: product.gramsPerUnit,
        totalGrams: row.qty * Number(product.gramsPerUnit || 0),
        notes: "Stock inicial importado desde la hoja LOTES",
      });
    }

    setLots((current) => [...current, ...createdLots]);

    setProducts((current) =>
      current.map((product) => {
        const delta = stockAddedByProduct.get(product.id) || 0;
        return delta
          ? { ...product, stock: Number(product.stock || 0) + delta, lastMovement: now }
          : product;
      })
    );

    // Los movimientos más recientes van primero, igual que en el resto del sistema
    if (movementRows.length) {
      setMovements((current) => [...[...movementRows].reverse(), ...current]);
    }

    return { created: createdLots.length, stockAdded };
  };

  /* ───────────────────── Movimientos ───────────────────── */

  const addMovement: AppState["addMovement"] = (data, lotData) => {
    const product = products.find((p) => p.id === data.productId);

    if (!product) {
      throw new Error("No se encontró el alimento.");
    }

    if (product.status !== "Activo") {
      throw new Error("El alimento está inactivo.");
    }

    const qty = Number(data.qty);

    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error("La cantidad debe ser mayor a 0.");
    }

    if (!Number.isInteger(qty)) {
      throw new Error("La cantidad debe ser un número entero de unidades.");
    }

    const now = data.date || getDateTime();
    const reference = data.reference?.trim() || "Sin referencia";
    const stockBefore = Number(product.stock || 0);
    let stockAfter = stockBefore;
    const lotNumber = lotData?.lotNumber?.trim();

    let selectedLot: Lot | undefined;
    let allocations: LotAllocation[] | undefined;

    const findSelectedLot = () => {
      if (lotData?.lotId) {
        return lots.find((lot) => lot.id === lotData.lotId);
      }

      if (lotNumber) {
        return lots.find((lot) => sameLot(lot, product.id, lotNumber));
      }

      return undefined;
    };

    const allocationFor = (lot: Lot, quantity: number, remaining: number): LotAllocation[] => [
      {
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        qty: quantity,
        remainingAfter: remaining,
        productionDate: lot.productionDate,
        expiryDate: lot.expiryDate,
      },
    ];

    /* ── ENTRADA ── */
    if (data.type === "Entrada") {
      if (!lotNumber) {
        throw new Error("El número de lote es obligatorio para una entrada.");
      }

      if (!lotData?.productionDate) {
        throw new Error("La fecha de producción del lote es obligatoria.");
      }

      if (!lotData?.expiryDate) {
        throw new Error("La fecha de vencimiento del lote es obligatoria.");
      }

      if (isProductionAfterExpiry(lotData.productionDate, lotData.expiryDate)) {
        throw new Error("La fecha de producción no puede ser posterior al vencimiento.");
      }

      if (
        data.supplierId &&
        !createdSupplierIds.current.has(data.supplierId) &&
        !suppliers.some(
          (supplier) => supplier.id === data.supplierId && supplier.status === "Activo"
        )
      ) {
        throw new Error("El proveedor seleccionado no es válido o está inactivo.");
      }

      const existingLot = lots.find((lot) => sameLot(lot, product.id, lotNumber));

      if (existingLot) {
        if (
          existingLot.productionDate &&
          existingLot.productionDate !== lotData.productionDate
        ) {
          throw new Error(
            `El lote ${existingLot.lotNumber} ya existe con una fecha de producción diferente.`
          );
        }

        if (existingLot.expiryDate && existingLot.expiryDate !== lotData.expiryDate) {
          throw new Error(
            `El lote ${existingLot.lotNumber} ya existe con una fecha de vencimiento diferente.`
          );
        }

        if (
          existingLot.supplierId &&
          data.supplierId &&
          existingLot.supplierId !== data.supplierId
        ) {
          throw new Error(
            `El lote ${existingLot.lotNumber} ya está asociado a otro proveedor.`
          );
        }

        const newQty = Number(existingLot.qty || 0) + qty;

        const updatedLot: Lot = {
          ...existingLot,
          qty: newQty,
          productionDate: existingLot.productionDate,
          expiryDate: existingLot.expiryDate,
          receivedDate: existingLot.receivedDate,
          receivedAt: existingLot.receivedAt,
          supplierId: existingLot.supplierId || data.supplierId,
          unitCost: existingLot.unitCost,
          status: getLotStatus(existingLot.expiryDate, newQty),
        };

        selectedLot = updatedLot;

        setLots((current) =>
          current.map((lot) => (lot.id === existingLot.id ? updatedLot : lot))
        );
      } else {
        const gramsPerUnit = Number(data.gramsPerUnit || product.gramsPerUnit || 0);

        // CORREGIDO: en esta rama el lote es nuevo, no existe `existingLot`
        const newLot: Lot = {
          id: makeId("LOT", lotSeq.current++),
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          lotNumber,
          productionDate: lotData.productionDate,
          expiryDate: lotData.expiryDate,
          qty,
          gramsPerUnit,
          totalGrams: qty * gramsPerUnit,
          unitCost: Number(data.unitCost || 0),
          receivedDate: now,
          receivedAt: now,
          supplierId: data.supplierId,
          status: getLotStatus(lotData.expiryDate, qty),
        };

        selectedLot = newLot;

        setLots((current) => [...current, newLot]);
      }

      stockAfter = stockBefore + qty;
    } else if (data.type === "Salida") {
      /* ── SALIDA ── */
      if (!lotNumber && !lotData?.lotId) {
        throw new Error("Debes seleccionar un lote para realizar la salida.");
      }

      selectedLot = findSelectedLot();

      if (!selectedLot) {
        throw new Error("No se encontró el lote seleccionado.");
      }

      if (selectedLot.productId !== product.id) {
        throw new Error("El lote no pertenece al alimento seleccionado.");
      }

      if (selectedLot.expiryDate && getDaysUntilExpiry(selectedLot.expiryDate) < 0) {
        throw new Error(
          `El lote ${selectedLot.lotNumber} está vencido y no puede despacharse.`
        );
      }

      if (qty > Number(selectedLot.qty || 0)) {
        throw new Error(
          `El lote ${selectedLot.lotNumber} solo tiene ${selectedLot.qty} disponibles.`
        );
      }

      if (qty > stockBefore) {
        throw new Error(`Stock total insuficiente. Disponible: ${stockBefore} unidades.`);
      }

      const remaining = Number(selectedLot.qty) - qty;

      patchLot(selectedLot.id, remaining);

      allocations = allocationFor(selectedLot, qty, remaining);

      stockAfter = Math.max(0, stockBefore - qty);
    } else if (data.type === "Devolución") {
      /* ── DEVOLUCIÓN ── */
      if (!lotNumber && !lotData?.lotId) {
        throw new Error("Debes seleccionar un lote para la devolución.");
      }

      selectedLot = findSelectedLot();

      if (!selectedLot) {
        throw new Error("No se encontró el lote seleccionado.");
      }

      const newQty = Number(selectedLot.qty) + qty;

      patchLot(selectedLot.id, newQty);

      allocations = allocationFor(selectedLot, qty, newQty);

      stockAfter = stockBefore + qty;
    } else if (data.type === "Ajuste") {
      /* ── AJUSTE ── */
      stockAfter = Math.max(0, Number(data.balance));

      if (lotData?.lotId || lotNumber) {
        selectedLot = findSelectedLot();

        if (selectedLot) {
          const diff = stockAfter - stockBefore;
          const newLotQty = Math.max(0, Number(selectedLot.qty) + diff);

          patchLot(selectedLot.id, newLotQty);
        }
      }
    }

    const movementGrams = Number(data.gramsPerUnit || product.gramsPerUnit || 0);

    const movement: Movement = {
      ...data,
      id: makeId("MOV", movementSeq.current++),
      date: now,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      brand: data.brand || product.brand,
      qty,
      gramsPerUnit: movementGrams,
      totalGrams: qty * movementGrams,
      unitCost: Number(data.unitCost || 0),
      salePrice: data.salePrice,
      total: 0,
      balance: stockAfter,
      reference,
      user: data.user || "Admin",
      lotId: selectedLot?.id || lotData?.lotId,
      lotNumber: selectedLot?.lotNumber || lotNumber,
      productionDate: selectedLot?.productionDate || lotData?.productionDate,
      expiryDate: selectedLot?.expiryDate || lotData?.expiryDate,
      supplierId: data.supplierId,
      stockBefore,
      stockAfter,
      lotAllocations: allocations,
    };

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, stock: stockAfter, lastMovement: now } : item
      )
    );

    setMovements((current) => [movement, ...current]);

    return movement;
  };

  const deleteMovement = (id: string) => {
    const movement = movements.find((item) => item.id === id);
    if (!movement) return;

    addToTrash("Movimiento", movement.reference || movement.id, movement);

    setMovements((current) => current.filter((item) => item.id !== id));
  };

  const deleteMovements = (ids: string[]) => {
    ids.forEach((id) => {
      deleteMovement(id);
    });
  };

  const restoreMovement = (trashId: string) => {
    const item = trash.find(
      (trashItem) => trashItem.id === trashId && trashItem.type === "Movimiento"
    );
    if (!item) return;

    const movement = item.payload as Movement;

    setMovements((current) =>
      current.some((m) => m.id === movement.id) ? current : [movement, ...current]
    );

    removeFromTrash(trashId);
  };

  /* ───────────────────── Eliminar / restaurar lotes ───────────────────── */

  const deleteLot = (id: string) => {
    const lot = lots.find((item) => item.id === id);
    if (!lot) return;

    addToTrash("Lote", lot.lotNumber, lot);

    setLots((current) => current.filter((item) => item.id !== id));

    adjustProductStock(lot.productId, -Number(lot.qty || 0));
  };

  const deleteLots = (ids: string[]) => {
    ids.forEach((id) => {
      deleteLot(id);
    });
  };

  const restoreLot = (trashId: string) => {
    const item = trash.find((trashItem) => trashItem.id === trashId && trashItem.type === "Lote");
    if (!item) return;

    const lot = item.payload as Lot;

    if (!lots.some((currentLot) => currentLot.id === lot.id)) {
      setLots((current) => [...current, lot]);

      adjustProductStock(lot.productId, Number(lot.qty || 0));
    }

    removeFromTrash(trashId);
  };

  /* ───────────────────── Proveedores ───────────────────── */

  const addSupplier: AppState["addSupplier"] = (data) => {
    const supplier: Supplier = {
      ...data,
      id: makeId("SUP", supplierSeq.current++),
      createdAt: getDateTime(),
    };

    createdSupplierIds.current.add(supplier.id);
    setSuppliers((current) => [...current, supplier]);

    return supplier;
  };

  const updateSupplier: AppState["updateSupplier"] = (id, data) => {
    setSuppliers((current) =>
      current.map((supplier) => (supplier.id === id ? { ...supplier, ...data } : supplier))
    );
  };

  const deleteSupplier = (id: string) => {
    const supplier = suppliers.find((item) => item.id === id);
    if (!supplier) return;

    const deletedAt = addToTrash("Proveedor", supplier.name, supplier);

    setSuppliers((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "Inactivo", deletedAt } : item
      )
    );
  };

  const restoreSupplier = (trashId: string) => {
    const item = trash.find(
      (trashItem) => trashItem.id === trashId && trashItem.type === "Proveedor"
    );
    if (!item) return;

    const supplier = item.payload as Supplier;

    const restored: Supplier = {
      ...supplier,
      status: "Activo",
      deletedAt: undefined,
    };

    setSuppliers((current) =>
      current.some((s) => s.id === supplier.id)
        ? current.map((s) => (s.id === supplier.id ? restored : s))
        : [...current, restored]
    );

    removeFromTrash(trashId);
  };

  const purgeTrash = (trashId: string) => {
    removeFromTrash(trashId);
  };

  /* ───────────────────── Valor del contexto ───────────────────── */

  return (
    <AppContext.Provider
      value={{
        seeded,
        seedAll,

        products,
        lots,
        movements,
        suppliers,
        trash,

        importedExcelFileName,
        importedExcelSheets,
        importedExcelFile,
        saveImportedExcelSheets,
        clearImportedExcelSheets,

        replaceProducts,

        addProduct,
        updateProduct,
        deleteProduct,
        deleteProducts,
        restoreProduct,

        registerExistingStockLot,
        registerLotEntry,
        importLots,

        addMovement,
        deleteMovement,
        deleteMovements,
        restoreMovement,

        deleteLot,
        deleteLots,
        restoreLot,

        addSupplier,
        updateSupplier,
        deleteSupplier,
        restoreSupplier,

        purgeTrash,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp debe utilizarse dentro de AppProvider.");
  }

  return context;
}

/* ───────────────────── Catálogos ───────────────────── */

export const categories = [
  "Conservas de Pescado",
  "Aceites y Grasas",
  "Harinas",
  "Cereales y Granos",
  "Legumbres y Menestras",
  "Fideos y Pastas",
  "Chocolates y Cacao",
  "Azúcares",
  "Levaduras",
  "Mejoradores",
  "Aditivos",
  "Esencias",
  "Colorantes",
  "Conservantes",
  "Lácteos",
  "Condimentos y Especias",
  "Frutas y Vegetales",
  "Carnes y Embutidos",
  "Bebidas",
  "Otros",
];

export const storageTempOptions = ["Ambiente", "Refrigerado", "Congelado"];

export const units = ["kg", "g", "L", "ml", "unidad", "saco", "caja", "balde"];