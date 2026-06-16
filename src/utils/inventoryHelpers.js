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

export function canWriteProcess(role) {
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

export const DESIGN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'initiated', label: 'Initiated' },
  { value: 'completed', label: 'Completed' },
]

export const DESIGN_STATUS_STYLES = {
  draft: 'bg-cream text-muted border border-border',
  initiated: 'bg-indigo-accent/10 text-indigo-accent',
  completed: 'bg-emerald-accent/10 text-emerald-accent',
}

/** @deprecated use DESIGN_STATUS_OPTIONS */
export const PROCESS_STATUS_OPTIONS = DESIGN_STATUS_OPTIONS

/** @deprecated use DESIGN_STATUS_STYLES */
export const PROCESS_STATUS_STYLES = DESIGN_STATUS_STYLES

export function getDesignStatus(design) {
  if (design?.status) return design.status
  const legacy = design?.processStatus
  if (legacy === 'pending' || !legacy) return 'initiated'
  if (legacy === 'embroidery' || legacy === 'painting' || legacy === 'dyeing') return 'completed'
  return 'initiated'
}

export function isDesignInitiated(design) {
  return getDesignStatus(design) === 'initiated' && !design?.dyeingJobId
}

export function isDesignInDyeing(design) {
  return getDesignStatus(design) === 'initiated' && Boolean(design?.dyeingJobId)
}

export function generateDyeBatchSerial() {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DYE-${datePart}-${randomPart}`
}

export function getDesignClothTotals(design) {
  return aggregateConsumptionByCloth(design.items || [], design.plannedUnits ?? design.units ?? 0)
}

export function mergeClothTotals(...totalsList) {
  return totalsList.reduce((merged, totals) => {
    Object.entries(totals || {}).forEach(([clothType, meters]) => {
      merged[clothType] = (merged[clothType] || 0) + meters
    })
    return merged
  }, {})
}

export function sortClothTotals(totals) {
  return Object.entries(totals || {}).sort(([a], [b]) => a.localeCompare(b))
}

export function getAssignedClothForDesign(job, designId) {
  const totals = {}
  ;(job?.lots || []).forEach((lot) => {
    ;(lot.assignments || []).forEach((assignment) => {
      if (assignment.designId !== designId) return
      totals[lot.clothType] = (totals[lot.clothType] || 0) + (assignment.assignedMeters || 0)
    })
  })
  return totals
}

export function getTotalReceivedByCloth(job) {
  const totals = {}
  ;(job?.lots || []).forEach((lot) => {
    totals[lot.clothType] = (totals[lot.clothType] || 0) + (lot.receivedMeters || 0)
  })
  return totals
}

export function computeActualUnitsForDesign(design, assignedClothByType) {
  const items = design.items || []
  if (items.length === 0) return 0

  const unitsPerItem = items.map((item) => {
    const assigned = assignedClothByType[item.clothType] || 0
    if (item.metersPerUnit <= 0) return 0
    return Math.floor(assigned / item.metersPerUnit)
  })

  return Math.min(...unitsPerItem)
}

export function computeDesignClothWastage(design, assignedClothByType) {
  const plannedUnits = design.plannedUnits ?? design.units ?? 0
  const planned = aggregateConsumptionByCloth(design.items || [], plannedUnits)
  const wastage = {}

  Object.entries(planned).forEach(([clothType, plannedMeters]) => {
    const received = assignedClothByType[clothType] || 0
    const lostMeters = Math.max(0, plannedMeters - received)
    wastage[clothType] = {
      plannedMeters,
      receivedMeters: received,
      lostMeters,
      lossPercent: plannedMeters > 0 ? (lostMeters / plannedMeters) * 100 : 0,
    }
  })

  return wastage
}

export function computeJobWastageSummary(job) {
  const planned = job.plannedClothTotals || {}
  const received = getTotalReceivedByCloth(job)
  const byCloth = {}
  let totalLostMeters = 0

  Object.entries(planned).forEach(([clothType, plannedMeters]) => {
    const receivedMeters = received[clothType] || 0
    const lostMeters = Math.max(0, plannedMeters - receivedMeters)
    totalLostMeters += lostMeters
    byCloth[clothType] = {
      plannedMeters,
      receivedMeters,
      lostMeters,
      lossPercent: plannedMeters > 0 ? (lostMeters / plannedMeters) * 100 : 0,
    }
  })

  return { byCloth, totalLostMeters }
}

export function computeDesignOutcomes(job, designsInVolume) {
  return (job.designs || []).map((entry) => {
    const design = designsInVolume.find((d) => d.id === entry.designId)
    const assigned = getAssignedClothForDesign(job, entry.designId)
    const plannedUnits = entry.plannedUnits ?? 0
    const actualUnits = design ? computeActualUnitsForDesign(design, assigned) : 0
    const varianceUnits = actualUnits - plannedUnits
    const variancePercent = plannedUnits > 0 ? (varianceUnits / plannedUnits) * 100 : 0
    const wastageByCloth = design ? computeDesignClothWastage(design, assigned) : {}

    return {
      designId: entry.designId,
      designCode: entry.designCode,
      colorCode: entry.colorCode,
      plannedUnits,
      actualUnits,
      varianceUnits,
      variancePercent,
      wastageByCloth,
      assignedCloth: assigned,
    }
  })
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
