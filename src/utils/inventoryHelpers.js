export function generateBatchSerial() {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `RS-BATCH-${datePart}-${randomPart}`
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function formatPKR(amount) {
  return `PKR ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function getPurchasedFabricTypes(purchases) {
  const types = new Set()

  purchases.forEach((purchase) => {
    if (purchase.status === 'complete') {
      types.add(purchase.materialType)
    }
  })

  return Array.from(types).sort()
}

export function getRawStockEntries(purchases, rawMaterialStock) {
  return getPurchasedFabricTypes(purchases).map((materialType) => [
    materialType,
    rawMaterialStock[materialType] || 0,
  ])
}

export function getActiveClothTypes(purchases) {
  return getPurchasedFabricTypes(purchases)
}

export function exportToCsv(filename, headers, rows) {
  const escapeCell = (value) => {
    const cell = String(value ?? '')
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`
    }
    return cell
  }

  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const ROLE_LABELS = {
  supply_admin: 'Purchase Incharge',
  factory_admin: 'Factory Admin',
}

export const PURCHASE_STATUS_LABELS = {
  in_progress: 'In Progress',
  complete: 'Complete',
}

export function canWritePurchases(role) {
  return role === 'supply_admin'
}

export function canWriteProduction(role) {
  return role === 'factory_admin'
}

export function canExportVolumesReport(role) {
  return role === 'factory_admin'
}

export function canExportPurchasesReport(role) {
  return role === 'supply_admin'
}

export function buildRawStockFromPurchases(purchases) {
  return purchases.reduce((stock, purchase) => {
    if (purchase.status === 'complete') {
      stock[purchase.materialType] = (stock[purchase.materialType] || 0) + purchase.quantity
    }
    return stock
  }, {})
}

export function computeRawMaterialStock(purchases, finishedGoodsStock, production = []) {
  const stock = buildRawStockFromPurchases(purchases)

  finishedGoodsStock.forEach((volume) => {
    volume.designs.forEach((design) => {
      const totals = aggregateConsumptionByCloth(design.items || [], design.units || 0)
      Object.entries(totals).forEach(([clothType, meters]) => {
        stock[clothType] = Math.max(0, (stock[clothType] || 0) - meters)
      })
    })
  })

  production.forEach((entry) => {
    if (entry.clothType && entry.consumptionMeters) {
      stock[entry.clothType] = Math.max(0, (stock[entry.clothType] || 0) - entry.consumptionMeters)
    }
  })

  return stock
}

export const PROCESS_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'dyeing', label: 'Dyeing' },
  { value: 'painting', label: 'Painting' },
  { value: 'embroidery', label: 'Embroidery' },
]

export const PROCESS_STATUS_STYLES = {
  pending: 'bg-cream text-muted border border-border',
  dyeing: 'bg-indigo-accent/10 text-indigo-accent',
  painting: 'bg-gold/10 text-gold',
  embroidery: 'bg-emerald-accent/10 text-emerald-accent',
}

export function validateDesignCode(code) {
  return /^\d{4}$/.test(String(code || '').trim())
}

export function getItemConsumption(item, units = 1) {
  return (Number(item.metersPerUnit) || 0) * (Number(units) || 0)
}

export function aggregateConsumptionByCloth(items = [], units = 1) {
  return items.reduce((totals, item) => {
    const clothType = item.clothType?.trim()
    const meters = getItemConsumption(item, units)
    if (!clothType || meters <= 0) return totals
    totals[clothType] = (totals[clothType] || 0) + meters
    return totals
  }, {})
}

export function getDesignTotalConsumption(items = [], units = 1) {
  return items.reduce((sum, item) => sum + getItemConsumption(item, units), 0)
}

export function formatConsumptionFormula(metersPerUnit, units) {
  const total = getItemConsumption({ metersPerUnit }, units)
  return `${metersPerUnit} m × ${Number(units).toLocaleString()} = ${total.toLocaleString()} m`
}

export function getDesignLabel(design) {
  return design.designCode || design.code || '—'
}

export function getColorLabel(design) {
  return design.colorCode || design.color || '—'
}

export function normalizeDesignItems(items = []) {
  return items.map((item) => ({
    id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: item.name?.trim() || '',
    clothType: item.clothType?.trim() || '',
    metersPerUnit: Number(item.metersPerUnit) || 0,
  }))
}

export function validateItemsAgainstStock(
  items,
  rawMaterialStock,
  restoredItems = [],
  units = 1,
  restoredUnits = 1
) {
  const restored = aggregateConsumptionByCloth(restoredItems, restoredUnits)
  const needed = aggregateConsumptionByCloth(items, units)

  for (const [clothType, meters] of Object.entries(needed)) {
    const available = (rawMaterialStock[clothType] || 0) + (restored[clothType] || 0)
    if (meters > available) {
      return {
        valid: false,
        error: `Insufficient ${clothType} stock. Need ${meters.toLocaleString()} m, only ${available.toLocaleString()} m available.`,
      }
    }
  }

  return { valid: true }
}
