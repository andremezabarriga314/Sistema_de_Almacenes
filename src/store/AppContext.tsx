import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import { seedSuppliers, seedProducts, seedEntries } from "../data/seedData";

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location: string;
  supplierId: string;
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
  expiryDate: string;
  qty: number;
  unitCost: number;
  receivedDate: string;
  supplierId?: string;
  status: "Vigente" | "Por vencer" | "Vencido" | "Agotado";
};

export type Movement = {
  id: string;
  date: string;
  type: "Entrada" | "Salida" | "Ajuste" | "Devolución";
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitCost: number;
  salePrice?: number;
  total: number;
  balance: number;
  reference: string;
  user: string;
  lotId?: string;
  lotNumber?: string;
  expiryDate?: string;
  supplierId?: string;
  client?: string;
  reason?: string;
  notes?: string;
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

export type TrashItem = {
  id: string;
  type: "Alimento" | "Proveedor" | "Movimiento" | "Lote";
  name: string;
  deletedAt: string;
  payload: Product | Supplier | Movement | Lot;
};

type AppState = {
  seeded: boolean;
  seedAll: () => void;
  products: Product[];
  lots: Lot[];
  movements: Movement[];
  suppliers: Supplier[];
  trash: TrashItem[];
  addProduct: (p: Omit<Product, "id" | "createdAt" | "lastMovement" | "deletedAt">) => Product;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  deleteProducts: (ids: string[]) => void;
  restoreProduct: (trashId: string) => void;
  addMovement: (m: Omit<Movement, "id">, lotData?: { lotNumber: string; expiryDate: string }) => Movement;
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

const AppContext = createContext<AppState | null>(null);

let productSeq = 1;
let movementSeq = 1;
let supplierSeq = 1;
let trashSeq = 1;
let lotSeq = 1;

function getLotStatus(expiryDate: string, qty: number): Lot["status"] {
  if (qty <= 0) return "Agotado";
  const today = new Date();
  const exp = new Date(expiryDate);
  const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "Vencido";
  if (diff <= 30) return "Por vencer";
  return "Vigente";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const seedingRef = useRef(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [seeded, setSeeded] = useState(false);

  const addProduct = (data: Omit<Product, "id" | "createdAt" | "lastMovement" | "deletedAt">) => {
    const now = new Date().toISOString().slice(0, 10);
    const p: Product = {
      ...data,
      id: `P${String(productSeq++).padStart(4, "0")}`,
      createdAt: now,
      lastMovement: now,
    };
    setProducts((prev) => [...prev, p]);
    return p;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const deleteProduct = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const item: TrashItem = {
      id: `TRS-${String(trashSeq++).padStart(3, "0")}`,
      type: "Alimento",
      name: p.name,
      deletedAt: new Date().toISOString().slice(0, 10),
      payload: p,
    };
    setTrash((prev) => [item, ...prev]);
    setProducts((prev) => prev.filter((x) => x.id !== id));
  };

  const deleteProducts = (ids: string[]) => {
    const selected = new Set(ids);
    const removed = products.filter((p) => selected.has(p.id));
    if (removed.length === 0) return;
    const deletedOn = new Date().toISOString().slice(0, 10);
    const items: TrashItem[] = removed.map((p) => ({
      id: `TRS-${String(trashSeq++).padStart(3, "0")}`,
      type: "Alimento",
      name: p.name,
      deletedAt: deletedOn,
      payload: p,
    }));
    setTrash((prev) => [...items.reverse(), ...prev]);
    setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
  };

  const restoreProduct = (trashId: string) => {
    const item = trash.find((t) => t.id === trashId);
    if (!item || item.type !== "Alimento") return;
    setProducts((prev) => [...prev, item.payload as Product]);
    setTrash((prev) => prev.filter((t) => t.id !== trashId));
  };

  const addMovement = (data: Omit<Movement, "id">, lotData?: { lotNumber: string; expiryDate: string }) => {
    const m: Movement = {
      ...data,
      id: `MOV-${String(movementSeq++).padStart(5, "0")}`,
      lotNumber: lotData?.lotNumber || data.lotNumber,
      expiryDate: lotData?.expiryDate || data.expiryDate,
    };
    setMovements((prev) => [m, ...prev]);

    // Create or update lot on Entrada
    if (data.type === "Entrada" && lotData) {
      const newLot: Lot = {
        id: `LOT-${String(lotSeq++).padStart(5, "0")}`,
        productId: data.productId,
        sku: data.sku,
        productName: data.productName,
        lotNumber: lotData.lotNumber,
        expiryDate: lotData.expiryDate,
        qty: data.qty,
        unitCost: data.unitCost,
        receivedDate: data.date,
        supplierId: data.supplierId,
        status: getLotStatus(lotData.expiryDate, data.qty),
      };
      setLots((prev) => [newLot, ...prev]);
    }

    // On Salida, reduce lot qty (FIFO - oldest expiry first)
    if (data.type === "Salida") {
      let remaining = data.qty;
      setLots((prev) => {
        const productLots = prev
          .filter((l) => l.productId === data.productId && l.qty > 0)
          .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
        const updated = [...prev];
        for (const lot of productLots) {
          if (remaining <= 0) break;
          const idx = updated.findIndex((l) => l.id === lot.id);
          const consume = Math.min(remaining, lot.qty);
          updated[idx] = { ...updated[idx], qty: lot.qty - consume, status: getLotStatus(lot.expiryDate, lot.qty - consume) };
          remaining -= consume;
        }
        return updated;
      });
    }

    // Update product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== data.productId) return p;
        let newStock = p.stock;
        if (data.type === "Entrada" || data.type === "Devolución") newStock += data.qty;
        else if (data.type === "Salida") newStock -= data.qty;
        else if (data.type === "Ajuste") newStock = data.balance;
        return { ...p, stock: Math.max(0, newStock), lastMovement: data.date };
      })
    );
    return m;
  };

  const deleteMovement = (id: string) => {
    deleteMovements([id]);
  };

  const deleteMovements = (ids: string[]) => {
    const selected = new Set(ids);
    const removed = movements.filter((m) => selected.has(m.id));
    if (removed.length === 0) return;
    const deletedOn = new Date().toISOString().slice(0, 10);
    const items: TrashItem[] = removed.map((m) => ({
      id: `TRS-${String(trashSeq++).padStart(3, "0")}`,
      type: "Movimiento",
      name: `${m.type}: ${m.productName}`,
      deletedAt: deletedOn,
      payload: m,
    }));
    setTrash((prev) => [...items.reverse(), ...prev]);

    setProducts((prev) => prev.map((p) => {
      const productMovements = removed.filter((m) => m.productId === p.id);
      const stockDelta = productMovements.reduce((total, m) => {
        if (m.type === "Entrada" || m.type === "Devolución") return total - m.qty;
        if (m.type === "Salida") return total + m.qty;
        return total;
      }, 0);
      return stockDelta === 0 ? p : { ...p, stock: Math.max(0, p.stock + stockDelta) };
    }));

    const removedEntries = new Set(removed.filter((m) => m.type === "Entrada").map((m) => `${m.productId}|${m.lotNumber}|${m.date}`));
    setLots((prev) => prev
      .filter((l) => !removedEntries.has(`${l.productId}|${l.lotNumber}|${l.receivedDate}`))
      .map((l) => {
        const restored = removed
          .filter((m) => m.type === "Salida" && m.productId === l.productId)
          .reduce((total, m) => total + m.qty, 0);
        return restored === 0 ? l : { ...l, qty: l.qty + restored, status: getLotStatus(l.expiryDate, l.qty + restored) };
      }));
    setMovements((prev) => prev.filter((m) => !selected.has(m.id)));
  };

  const restoreMovement = (trashId: string) => {
    const item = trash.find((t) => t.id === trashId);
    if (!item || item.type !== "Movimiento") return;
    const movement = item.payload as Movement;
    setMovements((prev) => prev.some((m) => m.id === movement.id) ? prev : [movement, ...prev]);
    setProducts((prev) => prev.map((p) => {
      if (p.id !== movement.productId) return p;
      const delta = movement.type === "Entrada" || movement.type === "Devolución" ? movement.qty : movement.type === "Salida" ? -movement.qty : 0;
      return { ...p, stock: Math.max(0, p.stock + delta), lastMovement: movement.date };
    }));
    if (movement.type === "Entrada" && movement.lotNumber) {
      const lot: Lot = {
        id: `LOT-${String(lotSeq++).padStart(5, "0")}`,
        productId: movement.productId,
        sku: movement.sku,
        productName: movement.productName,
        lotNumber: movement.lotNumber,
        expiryDate: movement.expiryDate || movement.date,
        qty: movement.qty,
        unitCost: movement.unitCost,
        receivedDate: movement.date,
        supplierId: movement.supplierId,
        status: getLotStatus(movement.expiryDate || movement.date, movement.qty),
      };
      setLots((prev) => prev.some((l) => l.productId === lot.productId && l.lotNumber === lot.lotNumber && l.receivedDate === lot.receivedDate) ? prev : [lot, ...prev]);
    }
    if (movement.type === "Salida") {
      let remaining = movement.qty;
      setLots((prev) => {
        const updated = [...prev];
        const productLots = prev
          .filter((l) => l.productId === movement.productId && l.qty > 0)
          .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
        for (const lot of productLots) {
          if (remaining <= 0) break;
          const index = updated.findIndex((l) => l.id === lot.id);
          const consumed = Math.min(remaining, lot.qty);
          updated[index] = { ...lot, qty: lot.qty - consumed, status: getLotStatus(lot.expiryDate, lot.qty - consumed) };
          remaining -= consumed;
        }
        return updated;
      });
    }
    setTrash((prev) => prev.filter((t) => t.id !== trashId));
  };

  const deleteLot = (id: string) => {
    deleteLots([id]);
  };

  const deleteLots = (ids: string[]) => {
    const selected = new Set(ids);
    const removed = lots.filter((l) => selected.has(l.id));
    if (removed.length === 0) return;
    const deletedOn = new Date().toISOString().slice(0, 10);
    const items: TrashItem[] = removed.map((l) => ({
      id: `TRS-${String(trashSeq++).padStart(3, "0")}`,
      type: "Lote",
      name: `${l.productName}: ${l.lotNumber}`,
      deletedAt: deletedOn,
      payload: l,
    }));
    setTrash((prev) => [...items.reverse(), ...prev]);
    setLots((prev) => prev.filter((l) => !selected.has(l.id)));
  };

  const restoreLot = (trashId: string) => {
    const item = trash.find((t) => t.id === trashId);
    if (!item || item.type !== "Lote") return;
    const lot = item.payload as Lot;
    setLots((prev) => prev.some((l) => l.id === lot.id) ? prev : [lot, ...prev]);
    setTrash((prev) => prev.filter((t) => t.id !== trashId));
  };

  const addSupplier = (data: Omit<Supplier, "id" | "createdAt" | "deletedAt">) => {
    const s: Supplier = {
      ...data,
      id: `S${String(supplierSeq++).padStart(4, "0")}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSuppliers((prev) => [...prev, s]);
    return s;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSupplier = (id: string) => {
    const s = suppliers.find((x) => x.id === id);
    if (!s) return;
    const item: TrashItem = {
      id: `TRS-${String(trashSeq++).padStart(3, "0")}`,
      type: "Proveedor",
      name: s.name,
      deletedAt: new Date().toISOString().slice(0, 10),
      payload: s,
    };
    setTrash((prev) => [item, ...prev]);
    setSuppliers((prev) => prev.filter((x) => x.id !== id));
  };

  const restoreSupplier = (trashId: string) => {
    const item = trash.find((t) => t.id === trashId);
    if (!item || item.type !== "Proveedor") return;
    setSuppliers((prev) => [...prev, item.payload as Supplier]);
    setTrash((prev) => prev.filter((t) => t.id !== trashId));
  };

  const purgeTrash = (trashId: string) => {
    setTrash((prev) => prev.filter((t) => t.id !== trashId));
  };

  const seedAll = useCallback(() => {
    if (seeded || seedingRef.current) return;
    seedingRef.current = true;
    const now = new Date().toISOString().slice(0, 10);
    const supMap: Record<string, string> = {};

    // Add suppliers
    seedSuppliers.forEach((s) => {
      const sup: Supplier = { ...s, id: `S${String(supplierSeq++).padStart(4, "0")}`, createdAt: now };
      supMap[s.name] = sup.id;
      setSuppliers((prev) => [...prev, sup]);
    });

    // Add products (stock starts at 0, entries will fill it)
    const prodMap: Record<string, string> = {};
    seedProducts.forEach(([name, category, unit, sku, storageTemp, supplierName]) => {
      const p: Product = {
        id: `P${String(productSeq++).padStart(4, "0")}`,
        sku, name, category, subcategory: "", costPrice: 0, salePrice: 0,
        stock: 0, minStock: 10, maxStock: 999999, unit, location: "Almacén Central",
        supplierId: supMap[supplierName] || "", status: "Activo", storageTemp,
        createdAt: now, lastMovement: now,
      };
      prodMap[sku] = p.id;
      setProducts((prev) => [...prev, p]);
    });

    // Add entries with lots
    seedEntries.forEach(([sku, date, lotNumber, expiryDate, qty, supplierName, reference]) => {
      const productId = prodMap[sku];
      const productData = seedProducts.find((p) => p[3] === sku);
      if (!productId || !productData) return;
      const numQty = Number(qty);
      if (numQty <= 0) return;
      const unitCost = 0;

      const m: Movement = {
        id: `MOV-${String(movementSeq++).padStart(5, "0")}`,
        date, type: "Entrada", productId,
        productName: productData[0], sku: productData[3],
        qty: numQty, unitCost, total: 0,
        balance: numQty, reference: String(reference),
        user: "Admin", supplierId: supMap[supplierName] || "",
        lotNumber: String(lotNumber), expiryDate: String(expiryDate),
      };
      setMovements((prev) => [m, ...prev]);

      const newLot: Lot = {
        id: `LOT-${String(lotSeq++).padStart(5, "0")}`,
        productId, sku: productData[3], productName: productData[0],
        lotNumber: String(lotNumber), expiryDate: String(expiryDate),
        qty: numQty, unitCost: 0, receivedDate: date,
        supplierId: supMap[supplierName] || "",
        status: getLotStatus(String(expiryDate), numQty),
      };
      setLots((prev) => [newLot, ...prev]);
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, stock: p.stock + numQty, lastMovement: date } : p));
    });

    setSeeded(true);
  }, [seeded]);

  useEffect(() => {
    seedAll();
  }, [seedAll]);

  return (
    <AppContext.Provider
      value={{
        seeded, seedAll,
        products, lots, movements, suppliers, trash,
        addProduct, updateProduct, deleteProduct, deleteProducts, restoreProduct,
        addMovement, deleteMovement, deleteMovements, restoreMovement, deleteLot, deleteLots, restoreLot,
        addSupplier, updateSupplier, deleteSupplier, restoreSupplier,
        purgeTrash,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const categories = [
  "Lácteos", "Carnes y Embutidos", "Aves y Huevos", "Pescados y Mariscos",
  "Frutas", "Verduras y Hortalizas", "Granos y Cereales", "Legumbres",
  "Panadería y Repostería", "Bebidas", "Conservas y Enlatados",
  "Aceites y Grasas", "Condimentos y Especias", "Congelados", "Snacks", "Otro",
];

export const storageTempOptions = [
  "Ambiente (15–25 °C)",
  "Refrigerado (0–4 °C)",
  "Refrigerado (4–8 °C)",
  "Congelado (-18 °C)",
  "Ultracongelado (-25 °C)",
];

export const units = ["Kg", "g", "Lb", "L", "ml", "Unidad", "Caja", "Saco", "Bulto", "Paquete", "Docena", "Bandeja", "Atado", "Canasta"];
