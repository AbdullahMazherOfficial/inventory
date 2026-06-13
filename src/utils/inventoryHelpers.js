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

export function getPurchasedFabricTypes(purchases, rawMaterialStock) {
  const types = new Set()

  purchases.forEach((purchase) => {
    if ((rawMaterialStock[purchase.materialType] || 0) > 0) {
      types.add(purchase.materialType)
    }
  })

  return Array.from(types).sort()
}

export function getActiveClothTypes(purchases, rawMaterialStock) {
  return getPurchasedFabricTypes(purchases, rawMaterialStock)
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
