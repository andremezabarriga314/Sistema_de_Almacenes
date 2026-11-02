import type {
  ImportedExcelSheet,
  Lot,
  Movement,
  Product,
  Supplier,
} from "../store/AppContext"

import {
  analyzeWorkbook,
  dateKey,
  parseGrams,
  type ExcelLotRow,
  type KardexProduct,
} from "./excelKardex"

export type ExcelImportSummary = {
  productsCreated: number

  lotsCreated: number

  suppliersCreated: number
}

export type ExcelImportInput = {
  sheets: ImportedExcelSheet[]

  // Lo que ya existe en el sistema (no se duplica al volver a importar).

  products: Product[]

  lots: Lot[]

  suppliers: Supplier[]

  now: string

  newProductId: () => string

  newLotId: () => string

  newSupplierId: () => string

  lotStatus: (expiryDate: string, qty: number) => Lot["status"]
}

export type ExcelImportResult = ExcelImportSummary & {
  newProducts: Product[]

  newLots: Lot[]

  newSuppliers: Supplier[]

  // Unidades que se suman al stock de productos que ya existían.

  stockAdded: Record<string, number>
}

const norm = (value: unknown) =>
  String(value ?? "")

    .toLowerCase()

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .replace(/\s+/g, " ")

    .trim()

const normalizeBrand = (value: unknown) => norm(value).replace(/\s+%/g, "%")

const normalizeLot = (value: unknown) => norm(value).replace(/\s+/g, "")

const isNumericText = (text: string) => /^[\d.,\s]+$/.test(text)

function namesMatchForImport(left: unknown, right: unknown): boolean {
  const a = norm(left).replace(/[^a-z0-9]/g, "")
  const b = norm(right).replace(/[^a-z0-9]/g, "")

  if (a === b) return true
  if (
    !a ||
    !b ||
    Math.abs(a.length - b.length) > 1 ||
    Math.min(a.length, b.length) < 6
  ) {
    return false
  }

  let aIndex = 0
  let bIndex = 0
  let differences = 0

  while (aIndex < a.length && bIndex < b.length) {
    if (a[aIndex] === b[bIndex]) {
      aIndex++
      bIndex++
      continue
    }

    differences++
    if (differences > 1) return false
    if (a.length > b.length) aIndex++
    else if (b.length > a.length) bIndex++
    else {
      aIndex++
      bIndex++
    }
  }

  return differences + (a.length - aIndex) + (b.length - bIndex) <= 1
}

const sameImportedProduct = (
  product: Product,
  source: Pick<KardexProduct, "nombre" | "marca">,
) =>
  namesMatchForImport(product.name, source.nombre) &&
  normalizeBrand(product.brand) === normalizeBrand(source.marca)

function mergeWorkbookProducts(products: KardexProduct[]): KardexProduct[] {
  const grouped = new Map<string, KardexProduct>()

  for (const product of products) {
    const name = norm(product.nombre)

    if (!name) continue

    const code = norm(product.codigo)

    const key = code
      ? `sku:${code}`
      : `name:${name}|brand:${normalizeBrand(product.marca)}`

    const current = grouped.get(key)

    if (!current) {
      grouped.set(key, {
        ...product,

        lots: product.lots.map((lot) => ({ ...lot })),
      })

      continue
    }

    const lotsByNumber = new Map(
      current.lots.map((lot) => [normalizeLot(lot.lote), lot]),
    )

    for (const lot of product.lots) {
      const lotKey = normalizeLot(lot.lote)

      if (!lotKey) continue

      const existing = lotsByNumber.get(lotKey)

      if (!existing || lot.remaining > existing.remaining) {
        lotsByNumber.set(lotKey, { ...lot })
      } else {
        existing.produccion ||= lot.produccion

        existing.vencimiento ||= lot.vencimiento

        existing.proveedor ||= lot.proveedor

        existing.presentacion ||= lot.presentacion

        existing.vencimientoCrudo ||= lot.vencimientoCrudo
      }
    }

    current.lots = [...lotsByNumber.values()]

    current.marca ||= product.marca

    current.presentacion ||= product.presentacion

    current.proveedor ||= product.proveedor
  }

  return [...grouped.values()]
}

export type ImportedLotRepair = {
  products: Product[]

  lots: Lot[]

  movements: Movement[]

  duplicateLots: Lot[]

  duplicateProducts: Product[]

  correctedAssociations: number

  correctedLots: number

  createdLots: number
}

export function repairImportedLotAssociations(
  sheets: ImportedExcelSheet[],

  products: Product[],

  lots: Lot[],

  movements: Movement[],

  lotStatus: (expiryDate: string, qty: number) => Lot["status"],

  newLotId: () => string,

  now: string,

  reconcileImportedBalances = false,
): ImportedLotRepair {
  const workbookProducts = mergeWorkbookProducts(
    analyzeWorkbook(sheets).products,
  ).filter((product) => product.nombre.trim() && product.lots.length)

  const productIdMap = new Map<string, Product>()

  const duplicateProducts: Product[] = []

  for (const source of workbookProducts) {
    const code = norm(source.codigo)

    const skuMatches = code
      ? products.filter((product) => norm(product.sku) === code)
      : []

    const nameMatches = products.filter((product) =>
      sameImportedProduct(product, source),
    )

    const candidates = skuMatches.length === 1 ? skuMatches : nameMatches

    if (!candidates.length) continue

    const sourceLotNumbers = new Set(
      source.lots.map((lot) => normalizeLot(lot.lote)),
    )

    const rank = (product: Product) => {
      const associatedLots = lots.filter(
        (lot) =>
          lot.productId === product.id &&
          sourceLotNumbers.has(normalizeLot(lot.lotNumber)),
      ).length

      return [associatedLots, Number(product.stock || 0)]
    }

    const canonical = [...candidates].sort((a, b) => {
      const [aLots, aStock] = rank(a)

      const [bLots, bStock] = rank(b)

      return bLots - aLots || bStock - aStock
    })[0]

    for (const candidate of candidates) {
      productIdMap.set(candidate.id, canonical)

      if (candidate.id !== canonical.id) duplicateProducts.push(candidate)
    }
  }

  const productBySourceLot = new Map<string, {
    source: ExcelLotRow
    product: Product
  }>()

  for (const source of workbookProducts) {
    const code = norm(source.codigo)

    const skuMatch = code
      ? products.find((product) => norm(product.sku) === code)
      : undefined

    const canonical =
      (skuMatch && productIdMap.get(skuMatch.id)) ||
      products.find(
        (product) =>
          sameImportedProduct(product, source) && productIdMap.has(product.id),
      )

    if (!canonical) continue

    for (const sourceLot of source.lots) {
      const key = `${canonical.id}::${normalizeLot(sourceLot.lote)}`

      if (!normalizeLot(sourceLot.lote) || productBySourceLot.has(key)) continue

      productBySourceLot.set(key, {
        source: {
          ...sourceLot,

          producto: source.nombre,

          codigo: source.codigo,

          marca: source.marca,

          presentacion: sourceLot.presentacion || source.presentacion,
        },

        product: canonical,
      })
    }
  }

  const mappedLots = lots.map((lot) => {
    const sourceMatch = productBySourceLot.get(
      `${productIdMap.get(lot.productId)?.id || lot.productId}::${normalizeLot(lot.lotNumber)}`,
    )

    const target = sourceMatch?.product || productIdMap.get(lot.productId)

    if (!target) return { ...lot }

    const mapped = {
      ...lot,

      productId: target.id,

      sku: target.sku,

      productName: target.name,
    }

    if (!reconcileImportedBalances || !sourceMatch) return mapped

    const source = sourceMatch.source
    const reportedQty = Math.max(0, Math.round(source.remaining))
    const legacyQty = Math.max(
      0,
      Math.round(source.legacyRemaining ?? source.remaining),
    )
    const qty =
      lot.qty === reportedQty
        ? lot.qty
        : Math.max(0, lot.qty + reportedQty - legacyQty)
    const productionDate =
      dateKey(source.produccion) || mapped.productionDate
    const expiryDate =
      dateKey(source.vencimiento || source.vencimientoCrudo || "") ||
      mapped.expiryDate
    const sourcePresentation = String(source.presentacion || "").trim()
    const sourceGrams =
      parseGrams(sourcePresentation) ||
      (isNumericText(sourcePresentation)
        ? Number.parseFloat(sourcePresentation.replace(",", ".")) * 1000
        : 0)
    const gramsPerUnit = sourceGrams || mapped.gramsPerUnit || 0

    return {
      ...mapped,
      productionDate,
      expiryDate,
      qty,
      gramsPerUnit,
      totalGrams: qty * gramsPerUnit,
      status: lotStatus(expiryDate, qty),
    }
  })

  const sourceForLot = (lot: Lot) =>
    productBySourceLot.get(`${lot.productId}::${normalizeLot(lot.lotNumber)}`)

  const archivedLots: Lot[] = []

  const duplicateGroups = new Map<string, number[]>()

  mappedLots.forEach((lot, index) => {
    const key = `${lot.productId}::${normalizeLot(lot.lotNumber)}`

    duplicateGroups.set(key, [...(duplicateGroups.get(key) || []), index])
  })

  const removedIndexes = new Set<number>()

  for (const indexes of duplicateGroups.values()) {
    if (indexes.length < 2) continue

    const firstLot = mappedLots[indexes[0]]

    const sourceMatch = sourceForLot(firstLot)

    const sourceQty = sourceMatch
      ? Math.max(0, Math.round(sourceMatch.source.remaining))
      : undefined

    const groupLots = indexes.map((index) => mappedLots[index])

    const survivor =
      groupLots.find((lot) => lot.qty === sourceQty) ||
      [...groupLots].sort((a, b) => b.qty - a.qty)[0]

    const survivorIndex = mappedLots.findIndex((lot) => lot.id === survivor.id)

    const qty = sourceQty ?? survivor.qty

    const sourcePresentation = String(
      sourceMatch?.source.presentacion || "",
    ).trim()

    const sourceGrams =
      parseGrams(sourcePresentation) ||
      (isNumericText(sourcePresentation)
        ? Number.parseFloat(sourcePresentation.replace(",", ".")) * 1000
        : 0)

    const expiryDate =
      dateKey(
        sourceMatch?.source.vencimiento ||
          sourceMatch?.source.vencimientoCrudo ||
          "",
      ) || survivor.expiryDate

    mappedLots[survivorIndex] = {
      ...survivor,

      productionDate:
        dateKey(sourceMatch?.source.produccion || "") ||
        survivor.productionDate,

      expiryDate,

      gramsPerUnit: sourceGrams || survivor.gramsPerUnit,

      totalGrams: qty * (sourceGrams || survivor.gramsPerUnit || 0),

      qty,

      status: lotStatus(expiryDate, qty),
    }

    for (const index of indexes) {
      if (mappedLots[index].id === survivor.id) continue

      removedIndexes.add(index)

      archivedLots.push(lots[index])
    }
  }

  const repairedLots = mappedLots.filter(
    (_, index) => !removedIndexes.has(index),
  )

  const missingLots: Lot[] = []

  for (const { source, product } of productBySourceLot.values()) {
    const exists = repairedLots.some(
      (lot) =>
        lot.productId === product.id &&
        normalizeLot(lot.lotNumber) === normalizeLot(source.lote),
    )

    if (
      exists ||
      !source.lote.trim() ||
      normalizeLot(source.lote) === "sinlote"
    )
      continue

    const presentationText = String(source.presentacion || "").trim()

    const numericPresentation = isNumericText(presentationText)

    const gramsPerUnit =
      parseGrams(presentationText) ||
      (numericPresentation
        ? Number.parseFloat(presentationText.replace(",", ".")) * 1000
        : Number(product.gramsPerUnit || 0))

    const qty = Math.max(0, Math.round(source.remaining))

    const productionDate = dateKey(source.produccion)

    const expiryDate = dateKey(source.vencimiento || source.vencimientoCrudo || "")

    missingLots.push({
      id: newLotId(),

      productId: product.id,

      sku: product.sku,

      productName: product.name,

      lotNumber: source.lote.trim(),

      productionDate,

      expiryDate,

      qty,

      gramsPerUnit,

      totalGrams: qty * gramsPerUnit,

      unitCost: product.costPrice || 0,

      receivedDate: now,

      receivedAt: now,

      supplierId: product.supplierId,

      status: lotStatus(expiryDate, qty),
    })
  }

  const allRepairedLots = [...repairedLots, ...missingLots]

  const duplicateIds = new Set(duplicateProducts.map((product) => product.id))

  const productGroups = new Map<string, Product[]>()

  for (const product of products) {
    const canonical = productIdMap.get(product.id) || product

    productGroups.set(canonical.id, [
      ...(productGroups.get(canonical.id) || []),

      product,
    ])
  }

  const originalLotStock = new Map<string, number>()

  for (const lot of lots) {
    const productId = productIdMap.get(lot.productId)?.id || lot.productId

    originalLotStock.set(
      productId,

      (originalLotStock.get(productId) || 0) + Number(lot.qty || 0),
    )
  }

  const repairedLotStock = new Map<string, number>()

  for (const lot of allRepairedLots) {
    repairedLotStock.set(
      lot.productId,

      (repairedLotStock.get(lot.productId) || 0) + Number(lot.qty || 0),
    )
  }

  const repairedProducts = products

    .filter((product) => !duplicateIds.has(product.id))

    .map((product) => {
      const mergedStock = (productGroups.get(product.id) || [product]).reduce(
        (sum, member) => sum + Number(member.stock || 0),

        0,
      )

      const lotStockDelta =
        (repairedLotStock.get(product.id) || 0) -
        (originalLotStock.get(product.id) || 0)

      return {
        ...product,

        stock: Math.max(0, mergedStock + lotStockDelta),
      }
    })

  const repairedMovements = movements.map((movement) => {
    const target = productIdMap.get(movement.productId)

    return target
      ? { ...movement, productId: target.id, sku: target.sku }
      : movement
  })

  const correctedAssociations = allRepairedLots.filter((lot) => {
    const original = lots.find((item) => item.id === lot.id)

    return original && original.productId !== lot.productId
  }).length

  const correctedLots = allRepairedLots.filter((lot) => {
    const original = lots.find((item) => item.id === lot.id)

    return (
      original &&
      (original.qty !== lot.qty ||
        original.productionDate !== lot.productionDate ||
        original.expiryDate !== lot.expiryDate ||
        original.status !== lot.status ||
        original.totalGrams !== lot.totalGrams)
    )
  }).length

  return {
    products: repairedProducts,

    lots: allRepairedLots,

    movements: repairedMovements,

    duplicateLots: archivedLots,

    duplicateProducts,

    correctedAssociations,

    correctedLots,

    createdLots: missingLots.length,
  }
}

// Convierte los productos y lotes que trae el Excel en productos y lotes del

// sistema. Es seguro repetirlo: lo que ya existe (mismo producto, mismo lote)

// no se vuelve a crear.

export function buildProductsFromExcel(
  input: ExcelImportInput,
): ExcelImportResult {
  const { sheets, now } = input

  const workbookProducts = mergeWorkbookProducts(
    analyzeWorkbook(sheets).products,
  )

  const newProducts: Product[] = []

  const newLots: Lot[] = []

  const newSuppliers: Supplier[] = []

  const stockAdded: Record<string, number> = {}

  const allProducts = () => [...input.products, ...newProducts]

  const allLots = () => [...input.lots, ...newLots]

  const allSuppliers = () => [...input.suppliers, ...newSuppliers]

  const sheetNames = new Set(sheets.map((sheet) => norm(sheet.name)))

  const supplierIdFor = (rawName: string): string | undefined => {
    const name = String(rawName ?? "").trim()

    if (!name || isNumericText(name)) return undefined

    const found = allSuppliers().find(
      (supplier) => norm(supplier.name) === norm(name),
    )

    if (found) return found.id

    const supplier: Supplier = {
      id: input.newSupplierId(),

      name,

      ruc: "",

      contact: "",

      phone: "",

      email: "",

      address: "",

      paymentTerms: "",

      deliveryDays: 0,

      rating: 0,

      status: "Activo",

      notes: "Creado desde el Excel importado",

      createdAt: now,
    }

    newSuppliers.push(supplier)

    return supplier.id
  }

  const uniqueSku = (source: string) => {
    const base =
      source

        .toUpperCase()

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .replace(/[^A-Z0-9]+/g, "-")

        .replace(/^-|-$/g, "")

        .slice(0, 12) || "PRODUCTO"

    let sku = base

    let suffix = 2

    while (allProducts().some((product) => norm(product.sku) === norm(sku))) {
      sku = `${base.slice(0, 9)}-${suffix++}`
    }

    return sku
  }

  workbookProducts.forEach((item) => {
    const name = item.nombre.trim()

    // Sin nombre, o el "nombre" es el de una hoja del Excel: no es un producto.

    if (!name || sheetNames.has(norm(name))) return

    const presentationText = String(item.presentacion ?? "").trim()

    const numericPresentation = isNumericText(presentationText)

    // Gramos por unidad: de la columna de gramos, del texto de presentación

    // ("Lata 170 g") o, si es solo un número, de kg/l.

    let grams = Number(item.gramos || 0)

    if (!grams) grams = parseGrams(presentationText)

    if (!grams && numericPresentation) {
      const value = parseFloat(presentationText.replace(",", "."))

      if (Number.isFinite(value) && value > 0) grams = value * 1000
    }

    const presentation = numericPresentation
      ? `${presentationText} kg/l`
      : presentationText

    const code = norm(item.codigo)

    const brandKey = normalizeBrand(item.marca)

    const skuMatches = code
      ? allProducts().filter((existing) => norm(existing.sku) === code)
      : []

    const nameMatches = allProducts().filter((existing) =>
      namesMatchForImport(existing.name, name),
    )

    const exactBrandMatches = brandKey
      ? nameMatches.filter(
          (existing) => normalizeBrand(existing.brand) === brandKey,
        )
      : []

    const nameMatch = !brandKey
      ? nameMatches.length === 1
        ? nameMatches[0]
        : undefined
      : exactBrandMatches.length === 1
        ? exactBrandMatches[0]
        : exactBrandMatches.length === 0 &&
            nameMatches.length === 1 &&
            !norm(nameMatches[0].brand)
          ? nameMatches[0]
          : undefined

    let product =
      skuMatches.length === 1
        ? skuMatches[0]
        : skuMatches.length > 1
          ? undefined
          : nameMatch

    if (!product && (skuMatches.length > 1 || nameMatches.length > 1)) return

    const existed = Boolean(product)

    if (!product) {
      product = {
        id: input.newProductId(),

        sku: uniqueSku(item.codigo || name),

        name,

        brand: item.marca || "",

        presentation,

        gramsPerUnit: grams || undefined,

        costPrice: 0,

        salePrice: 0,

        stock: 0,

        unit: "Unidad",

        location: "",

        supplierId: supplierIdFor(item.proveedor),

        status: "Activo",

        storageTemp: "Ambiente (15–25 °C)",

        createdAt: now,

        lastMovement: now,
      }

      newProducts.push(product)
    }

    const target = product

    item.lots.forEach((lot) => {
      const lotNumber = lot.lote.trim()

      const qty = Math.max(0, Math.round(lot.remaining))

      if (!lotNumber || norm(lotNumber) === "sin lote") return

      const duplicated = allLots().some(
        (existing) =>
          existing.productId === target.id &&
          normalizeLot(existing.lotNumber) === normalizeLot(lotNumber),
      )

      if (duplicated) return

      const productionDate = dateKey(lot.produccion)

      const expiryDate = dateKey(lot.vencimiento || lot.vencimientoCrudo || "")

      const lotPresentation = String(
        lot.presentacion || item.presentacion || "",
      ).trim()

      const lotGrams =
        parseGrams(lotPresentation) ||
        (isNumericText(lotPresentation)
          ? Number.parseFloat(lotPresentation.replace(",", ".")) * 1000
          : Number(target.gramsPerUnit || 0))

      newLots.push({
        id: input.newLotId(),

        productId: target.id,

        sku: target.sku,

        productName: target.name,

        lotNumber,

        productionDate,

        expiryDate,

        qty,

        gramsPerUnit: lotGrams,

        totalGrams: qty * lotGrams,

        unitCost: 0,

        receivedDate: now,

        receivedAt: now,

        supplierId: supplierIdFor(lot.proveedor) || target.supplierId,

        status: input.lotStatus(expiryDate, qty),
      })

      if (existed) {
        stockAdded[target.id] = (stockAdded[target.id] || 0) + qty
      } else {
        target.stock += qty
      }
    })
  })

  return {
    productsCreated: newProducts.length,

    lotsCreated: newLots.length,

    suppliersCreated: newSuppliers.length,

    newProducts,

    newLots,

    newSuppliers,

    stockAdded,
  }
}
