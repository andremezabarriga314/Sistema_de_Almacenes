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
  supplier: string;
  status: "Activo" | "Inactivo";
  expiryDate?: string;
  lastMovement: string;
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
  total: number;
  balance: number;
  reference: string;
  user: string;
  supplier?: string;
  client?: string;
  reason?: string;
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
  totalPurchases: number;
  transactions: number;
};

export const categories = [
  "Electrónica",
  "Herramientas",
  "Repuestos",
  "Consumibles",
  "Materiales de Construcción",
  "Equipos de Seguridad",
  "Mobiliario",
  "Insumos",
];

export const mockProducts: Product[] = [
  { id: "P001", sku: "ELEC-001", name: "Laptop Dell Latitude 5540", category: "Electrónica", subcategory: "Computadoras", costPrice: 850, salePrice: 1100, stock: 12, minStock: 5, maxStock: 30, unit: "Unidad", location: "A-1-02", supplier: "TechPro S.A.", status: "Activo", lastMovement: "2024-08-15" },
  { id: "P002", sku: "ELEC-002", name: "Monitor LG 27\" 4K", category: "Electrónica", subcategory: "Monitores", costPrice: 320, salePrice: 420, stock: 3, minStock: 5, maxStock: 20, unit: "Unidad", location: "A-1-03", supplier: "TechPro S.A.", status: "Activo", lastMovement: "2024-08-10" },
  { id: "P003", sku: "HERR-001", name: "Taladro Makita 18V Kit", category: "Herramientas", subcategory: "Eléctricas", costPrice: 145, salePrice: 195, stock: 28, minStock: 10, maxStock: 50, unit: "Unidad", location: "B-2-01", supplier: "FerroCentro Ltda.", status: "Activo", lastMovement: "2024-08-18" },
  { id: "P004", sku: "HERR-002", name: "Llave de Torque 1/2\"", category: "Herramientas", subcategory: "Manuales", costPrice: 42, salePrice: 65, stock: 0, minStock: 8, maxStock: 40, unit: "Unidad", location: "B-2-04", supplier: "FerroCentro Ltda.", status: "Activo", lastMovement: "2024-07-30" },
  { id: "P005", sku: "CONS-001", name: "Papel Bond A4 500 Hojas", category: "Consumibles", subcategory: "Papelería", costPrice: 4.8, salePrice: 7.5, stock: 156, minStock: 50, maxStock: 500, unit: "Resma", location: "C-3-01", supplier: "OfficeMax Corp.", status: "Activo", lastMovement: "2024-08-19" },
  { id: "P006", sku: "CONS-002", name: "Tóner HP LaserJet 85A", category: "Consumibles", subcategory: "Impresión", costPrice: 28, salePrice: 45, stock: 7, minStock: 10, maxStock: 60, unit: "Unidad", location: "C-3-05", supplier: "OfficeMax Corp.", status: "Activo", lastMovement: "2024-08-08" },
  { id: "P007", sku: "REP-001", name: "Filtro de Aceite W-713", category: "Repuestos", subcategory: "Filtros", costPrice: 8.5, salePrice: 14, stock: 45, minStock: 20, maxStock: 200, unit: "Unidad", location: "D-4-02", supplier: "AutoParts S.A.", status: "Activo", lastMovement: "2024-08-16" },
  { id: "P008", sku: "REP-002", name: "Correa Dentada K6 Gates", category: "Repuestos", subcategory: "Correas", costPrice: 22, salePrice: 35, stock: 2, minStock: 15, maxStock: 80, unit: "Unidad", location: "D-4-07", supplier: "AutoParts S.A.", status: "Activo", lastMovement: "2024-08-01" },
  { id: "P009", sku: "SEG-001", name: "Casco de Seguridad MSA V-Gard", category: "Equipos de Seguridad", subcategory: "Protección Cefálica", costPrice: 18, salePrice: 28, stock: 34, minStock: 20, maxStock: 100, unit: "Unidad", location: "E-5-01", supplier: "SafeWork Distribuciones", status: "Activo", lastMovement: "2024-08-12" },
  { id: "P010", sku: "SEG-002", name: "Guantes Dieléctricos Clase 0", category: "Equipos de Seguridad", subcategory: "Protección Manos", costPrice: 35, salePrice: 55, stock: 18, minStock: 10, maxStock: 50, unit: "Par", location: "E-5-03", supplier: "SafeWork Distribuciones", status: "Activo", lastMovement: "2024-08-14" },
  { id: "P011", sku: "MAT-001", name: "Cemento Portland Tipo I 50Kg", category: "Materiales de Construcción", subcategory: "Cementos", costPrice: 12, salePrice: 18, stock: 220, minStock: 100, maxStock: 1000, unit: "Saco", location: "F-6-01", supplier: "Construmax S.A.", status: "Activo", lastMovement: "2024-08-20" },
  { id: "P012", sku: "MAT-002", name: "Varilla Corrugada 3/8\" 6m", category: "Materiales de Construcción", subcategory: "Acero", costPrice: 8.5, salePrice: 12, stock: 0, minStock: 50, maxStock: 500, unit: "Unidad", location: "F-6-05", supplier: "Construmax S.A.", status: "Inactivo", lastMovement: "2024-06-15" },
  { id: "P013", sku: "ELEC-003", name: "Switch TP-Link 24 Puertos", category: "Electrónica", subcategory: "Redes", costPrice: 185, salePrice: 245, stock: 6, minStock: 3, maxStock: 15, unit: "Unidad", location: "A-1-08", supplier: "TechPro S.A.", status: "Activo", lastMovement: "2024-08-11" },
  { id: "P014", sku: "INS-001", name: "Aceite de Motor 5W-30 4L", category: "Insumos", subcategory: "Lubricantes", costPrice: 22, salePrice: 34, stock: 48, minStock: 30, maxStock: 200, unit: "Galón", location: "G-7-02", supplier: "LubriTech Corp.", status: "Activo", expiryDate: "2026-12-31", lastMovement: "2024-08-17" },
  { id: "P015", sku: "INS-002", name: "Grasa Multipropósito SKF", category: "Insumos", subcategory: "Lubricantes", costPrice: 15, salePrice: 24, stock: 22, minStock: 15, maxStock: 100, unit: "Kg", location: "G-7-04", supplier: "LubriTech Corp.", status: "Activo", lastMovement: "2024-08-09" },
];

export const mockMovements: Movement[] = [
  { id: "MOV-0851", date: "2024-08-20", type: "Entrada", productId: "P011", productName: "Cemento Portland Tipo I 50Kg", sku: "MAT-001", qty: 50, unitCost: 12, total: 600, balance: 220, reference: "OC-2024-0341", user: "J. Ramírez", supplier: "Construmax S.A." },
  { id: "MOV-0850", date: "2024-08-19", type: "Salida", productId: "P005", productName: "Papel Bond A4 500 Hojas", sku: "CONS-001", qty: 20, unitCost: 4.8, total: 96, balance: 156, reference: "VTA-2024-0892", user: "M. Torres", client: "Oficina Central" },
  { id: "MOV-0849", date: "2024-08-18", type: "Entrada", productId: "P003", productName: "Taladro Makita 18V Kit", sku: "HERR-001", qty: 10, unitCost: 145, total: 1450, balance: 28, reference: "OC-2024-0340", user: "J. Ramírez", supplier: "FerroCentro Ltda." },
  { id: "MOV-0848", date: "2024-08-17", type: "Salida", productId: "P014", productName: "Aceite de Motor 5W-30 4L", sku: "INS-001", qty: 8, unitCost: 22, total: 176, balance: 48, reference: "VTA-2024-0890", user: "K. Vargas", client: "Taller Municipal" },
  { id: "MOV-0847", date: "2024-08-16", type: "Entrada", productId: "P007", productName: "Filtro de Aceite W-713", sku: "REP-001", qty: 30, unitCost: 8.5, total: 255, balance: 45, reference: "OC-2024-0339", user: "J. Ramírez", supplier: "AutoParts S.A." },
  { id: "MOV-0846", date: "2024-08-15", type: "Salida", productId: "P001", productName: "Laptop Dell Latitude 5540", sku: "ELEC-001", qty: 2, unitCost: 850, total: 1700, balance: 12, reference: "VTA-2024-0885", user: "M. Torres", client: "Ministerio de Educación" },
  { id: "MOV-0845", date: "2024-08-14", type: "Salida", productId: "P010", productName: "Guantes Dieléctricos Clase 0", sku: "SEG-002", qty: 5, unitCost: 35, total: 175, balance: 18, reference: "VTA-2024-0883", user: "K. Vargas", client: "Empresa Eléctrica" },
  { id: "MOV-0844", date: "2024-08-12", type: "Entrada", productId: "P009", productName: "Casco de Seguridad MSA V-Gard", sku: "SEG-001", qty: 20, unitCost: 18, total: 360, balance: 34, reference: "OC-2024-0337", user: "J. Ramírez", supplier: "SafeWork Distribuciones" },
  { id: "MOV-0843", date: "2024-08-11", type: "Salida", productId: "P013", productName: "Switch TP-Link 24 Puertos", sku: "ELEC-003", qty: 1, unitCost: 185, total: 185, balance: 6, reference: "VTA-2024-0879", user: "M. Torres", client: "Empresa Privada XYZ" },
  { id: "MOV-0842", date: "2024-08-10", type: "Ajuste", productId: "P002", productName: "Monitor LG 27\" 4K", sku: "ELEC-002", qty: -2, unitCost: 320, total: -640, balance: 3, reference: "AJ-2024-0045", user: "L. Mendoza", reason: "Merma - daño en tránsito" },
  { id: "MOV-0841", date: "2024-08-09", type: "Entrada", productId: "P015", productName: "Grasa Multipropósito SKF", sku: "INS-002", qty: 15, unitCost: 15, total: 225, balance: 22, reference: "OC-2024-0335", user: "J. Ramírez", supplier: "LubriTech Corp." },
  { id: "MOV-0840", date: "2024-08-08", type: "Salida", productId: "P006", productName: "Tóner HP LaserJet 85A", sku: "CONS-002", qty: 5, unitCost: 28, total: 140, balance: 7, reference: "VTA-2024-0871", user: "K. Vargas", client: "Dirección Provincial" },
  { id: "MOV-0839", date: "2024-08-01", type: "Salida", productId: "P008", productName: "Correa Dentada K6 Gates", sku: "REP-002", qty: 12, unitCost: 22, total: 264, balance: 2, reference: "VTA-2024-0864", user: "M. Torres", client: "Flota Municipal" },
  { id: "MOV-0838", date: "2024-07-30", type: "Salida", productId: "P004", productName: "Llave de Torque 1/2\"", sku: "HERR-002", qty: 8, unitCost: 42, total: 336, balance: 0, reference: "VTA-2024-0861", user: "K. Vargas", client: "Taller Central" },
  { id: "MOV-0837", date: "2024-07-28", type: "Devolución", productId: "P003", productName: "Taladro Makita 18V Kit", sku: "HERR-001", qty: 2, unitCost: 145, total: 290, balance: 20, reference: "DEV-2024-0023", user: "L. Mendoza", client: "Cliente Final" },
];

export const mockSuppliers: Supplier[] = [
  { id: "S001", name: "TechPro S.A.", ruc: "1792145670001", contact: "Andrés Villafuerte", phone: "+593-2-2441890", email: "ventas@techpro.com.ec", address: "Av. República 2563, Quito", paymentTerms: "30 días", deliveryDays: 3, rating: 4.8, status: "Activo", totalPurchases: 48500, transactions: 34 },
  { id: "S002", name: "FerroCentro Ltda.", ruc: "1791234560001", contact: "Patricia Carvajal", phone: "+593-2-2334455", email: "compras@ferrocentro.com", address: "Parque Industrial La Ofelia, Quito", paymentTerms: "15 días", deliveryDays: 2, rating: 4.5, status: "Activo", totalPurchases: 32100, transactions: 28 },
  { id: "S003", name: "OfficeMax Corp.", ruc: "1790987650001", contact: "Luis Ibarra", phone: "+593-2-2556677", email: "pedidos@officemax.ec", address: "Av. 10 de Agosto 4523, Quito", paymentTerms: "Contado", deliveryDays: 1, rating: 4.2, status: "Activo", totalPurchases: 12300, transactions: 56 },
  { id: "S004", name: "AutoParts S.A.", ruc: "1793456780001", contact: "Roberto Herrera", phone: "+593-2-2778899", email: "ventas@autoparts.ec", address: "Zona Industrial Sur, Guayaquil", paymentTerms: "60 días", deliveryDays: 5, rating: 4.0, status: "Activo", totalPurchases: 27800, transactions: 19 },
  { id: "S005", name: "SafeWork Distribuciones", ruc: "1794567890001", contact: "Diana Salazar", phone: "+593-2-2901234", email: "info@safework.com.ec", address: "Av. Mariana de Jesús N32-55, Quito", paymentTerms: "30 días", deliveryDays: 4, rating: 4.6, status: "Activo", totalPurchases: 18900, transactions: 22 },
  { id: "S006", name: "Construmax S.A.", ruc: "1795678900001", contact: "Carlos Naranjo", phone: "+593-4-2456789", email: "gerencia@construmax.ec", address: "Puerto Marítimo, Guayaquil", paymentTerms: "45 días", deliveryDays: 7, rating: 3.8, status: "Activo", totalPurchases: 65400, transactions: 41 },
  { id: "S007", name: "LubriTech Corp.", ruc: "1796789010001", contact: "Mercedes Paz", phone: "+593-2-2112233", email: "ventas@lubritech.ec", address: "Av. Eloy Alfaro 2043, Quito", paymentTerms: "30 días", deliveryDays: 2, rating: 4.3, status: "Activo", totalPurchases: 9800, transactions: 15 },
  { id: "S008", name: "ImportTech Ecuador", ruc: "1797890120001", contact: "Juan Reyes", phone: "+593-2-2334566", email: "importtech@gmail.com", address: "Quito Centro", paymentTerms: "Contado", deliveryDays: 10, rating: 3.2, status: "Inactivo", totalPurchases: 4200, transactions: 6 },
];

export const chartMovementsData = [
  { mes: "Mar", entradas: 45200, salidas: 38100 },
  { mes: "Abr", entradas: 52300, salidas: 44600 },
  { mes: "May", entradas: 38900, salidas: 41200 },
  { mes: "Jun", entradas: 61500, salidas: 52800 },
  { mes: "Jul", entradas: 48700, salidas: 43100 },
  { mes: "Ago", entradas: 55400, salidas: 47300 },
];

export const chartCategoryData = [
  { name: "Electrónica", value: 38, fill: "#F5B21B" },
  { name: "Herramientas", value: 22, fill: "#38BDF8" },
  { name: "Repuestos", value: 18, fill: "#A78BFA" },
  { name: "Consumibles", value: 12, fill: "#FBBF24" },
  { name: "Otros", value: 10, fill: "#64748B" },
];

export const chartStockTrend = [
  { dia: "01", valor: 218400 },
  { dia: "04", valor: 224100 },
  { dia: "07", valor: 211800 },
  { dia: "10", valor: 235600 },
  { dia: "13", valor: 229300 },
  { dia: "16", valor: 242100 },
  { dia: "19", valor: 237800 },
  { dia: "20", valor: 241300 },
];
