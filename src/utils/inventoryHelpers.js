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
    if (purchase.status === 'complete') types.add(purchase.materialType)
  })
  return Array.from(types).sort()
}

export function getRawStockEntries(purchases, availableStock) {
  return getPurchasedFabricTypes(purchases).map((materialType) => [
    materialType,
    availableStock[materialType] || 0,
  ])
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

export function canExportProcessReport(role) {
  return role === 'super_admin'
}

export function buildRawStockFromPurchases(purchases) {
  return purchases.reduce((stock, purchase) => {
    if (purchase.status === 'complete') {
      stock[purchase.materialType] = (stock[purchase.materialType] || 0) + purchase.quantity
    }
    return stock
  }, {})
}

/** Available = purchased − dyeing allocations − production raw-as-is deductions */
export function computeAvailableStock(purchases, dyeingJobs = [], productionVolumes = []) {
  const stock = buildRawStockFromPurchases(purchases)

  dyeingJobs.forEach((job) => {
    if (job.status === 'in_dyeing' || job.status === 'closed') {
      Object.entries(job.stockDeducted || {}).forEach(([clothType, meters]) => {
        stock[clothType] = Math.max(0, (stock[clothType] || 0) - meters)
      })
    }
  })

  productionVolumes.forEach((vol) => {
    Object.entries(vol.rawStockDeductions || {}).forEach(([clothType, meters]) => {
      stock[clothType] = Math.max(0, (stock[clothType] || 0) - meters)
    })
  })

  return stock
}

export const DESIGN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'initiated', label: 'Initiated' },
  { value: 'in_dyeing', label: 'In Dyeing' },
  { value: 'in_production', label: 'In Production' },
]

export const DESIGN_STATUS_STYLES = {
  draft: 'bg-cream text-muted border border-border',
  initiated: 'bg-indigo-accent/10 text-indigo-accent',
  in_dyeing: 'bg-gold/10 text-gold',
  in_production: 'bg-emerald-accent/10 text-emerald-accent',
}

export const PROCESS_STATUS_OPTIONS = DESIGN_STATUS_OPTIONS
export const PROCESS_STATUS_STYLES = DESIGN_STATUS_STYLES

export function getDesignStatus(design) {
  return design?.status || 'initiated'
}

export function designRequiresDyeing(design) {
  return design?.requiresDyeing !== false
}

export function isDesignEligibleForDyeing(design) {
  return getDesignStatus(design) === 'initiated' && designRequiresDyeing(design)
}

export function isDesignInDyeing(design) {
  return getDesignStatus(design) === 'in_dyeing'
}

export function isDesignInProduction(design) {
  return getDesignStatus(design) === 'in_production'
}

export function isDesignRawBypass(design) {
  return !designRequiresDyeing(design)
}

export function generateDyeBatchSerial() {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DYE-${datePart}-${randomPart}`
}

export function getItemFabricColorKey(item) {
  return `${item.clothType?.trim()}::${item.colorCode?.trim()}`
}

export function itemMatchesLot(item, lot) {
  return (
    item.clothType?.trim() === lot.clothType?.trim() &&
    item.colorCode?.trim() === lot.colorCode?.trim()
  )
}

export function getDesignLabel(design) {
  return design.designCode || design.code || '—'
}

export function getDesignColorSummary(design) {
  const colors = [
    ...new Set((design.items || []).map((item) => item.colorCode?.trim()).filter(Boolean)),
  ]
  return colors.length ? colors.join(', ') : '—'
}

/** @deprecated use getDesignColorSummary */
export function getColorLabel(design) {
  return getDesignColorSummary(design)
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

export function getDesignClothTotals(design, units) {
  const u = units ?? design.plannedUnits ?? design.units ?? 0
  return aggregateConsumptionByCloth(design.items || [], u)
}

export function getDyeingSendTotals(designs) {
  const totals = {}
  designs.filter(designRequiresDyeing).forEach((design) => {
    const cloth = getDesignClothTotals(design)
    Object.entries(cloth).forEach(([type, meters]) => {
      totals[type] = (totals[type] || 0) + meters
    })
  })
  return totals
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

export function normalizeDesignItems(items = []) {
  return items.map((item) => ({
    id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: item.name?.trim() || '',
    clothType: item.clothType?.trim() || '',
    colorCode: item.colorCode?.trim().toUpperCase() || '',
    metersPerUnit: Number(item.metersPerUnit) || 0,
  }))
}

export function validateStockAvailability(neededTotals, availableStock) {
  for (const [clothType, meters] of Object.entries(neededTotals)) {
    const available = availableStock[clothType] || 0
    if (meters > available) {
      return {
        valid: false,
        error: `Insufficient ${clothType}. Need ${meters.toLocaleString()} m, only ${available.toLocaleString()} m available.`,
      }
    }
  }
  return { valid: true }
}

/** Proportionally distribute lot meters to matching items by planned consumption */
export function distributeLotToItems(lot, design) {
  const matchingItems = (design.items || []).filter((item) => itemMatchesLot(item, lot))
  if (matchingItems.length === 0) return []

  const plannedUnits = design.plannedUnits ?? design.units ?? 0
  const plannedByItem = matchingItems.map((item) => ({
    itemId: item.id,
    itemName: item.name,
    plannedMeters: getItemConsumption(item, plannedUnits),
  }))
  const totalPlanned = plannedByItem.reduce((s, i) => s + i.plannedMeters, 0)
  if (totalPlanned <= 0) return []

  return plannedByItem.map((entry) => ({
    itemId: entry.itemId,
    itemName: entry.itemName,
    meters: (lot.receivedMeters * entry.plannedMeters) / totalPlanned,
  }))
}

/** Sum received meters per item from all lots assigned to a design */
export function getReceivedMetersByItem(job, designId, design) {
  const byItem = {}
  ;(design.items || []).forEach((item) => {
    byItem[item.id] = 0
  })

  ;(job.lots || []).forEach((lot) => {
    if (lot.designId !== designId) return
    const distribution = lot.itemDistribution || distributeLotToItems(lot, design)
    distribution.forEach(({ itemId, meters }) => {
      byItem[itemId] = (byItem[itemId] || 0) + meters
    })
  })

  return byItem
}

export function computeDesignBottleneck(design, receivedByItemId) {
  const items = design.items || []
  if (items.length === 0) return { actualUnits: 0, itemBreakdown: [], leftoverScrap: [] }

  const itemBreakdown = items.map((item) => {
    const received = receivedByItemId[item.id] || 0
    const producible = item.metersPerUnit > 0 ? Math.floor(received / item.metersPerUnit) : 0
    return {
      itemId: item.id,
      itemName: item.name,
      clothType: item.clothType,
      colorCode: item.colorCode,
      metersPerUnit: item.metersPerUnit,
      receivedMeters: received,
      producibleUnits: producible,
    }
  })

  const actualUnits = Math.min(...itemBreakdown.map((i) => i.producibleUnits))

  const leftoverScrap = itemBreakdown
    .map((item) => {
      const used = actualUnits * item.metersPerUnit
      const leftover = Math.max(0, item.receivedMeters - used)
      const isBottleneck = item.producibleUnits === actualUnits
      return leftover > 0.01
        ? {
            itemName: item.itemName,
            clothType: item.clothType,
            colorCode: item.colorCode,
            leftoverMeters: leftover,
            isBottleneck,
          }
        : null
    })
    .filter(Boolean)

  return { actualUnits, itemBreakdown, leftoverScrap }
}

export function computeJobWastageSummary(job) {
  const planned = job.stockDeducted || job.plannedClothTotals || {}
  const received = {}
  ;(job.lots || []).forEach((lot) => {
    received[lot.clothType] = (received[lot.clothType] || 0) + (lot.receivedMeters || 0)
  })

  const byCloth = {}
  let totalLostMeters = 0
  let totalPlannedMeters = 0

  Object.entries(planned).forEach(([clothType, plannedMeters]) => {
    const receivedMeters = received[clothType] || 0
    const lostMeters = Math.max(0, plannedMeters - receivedMeters)
    totalLostMeters += lostMeters
    totalPlannedMeters += plannedMeters
    byCloth[clothType] = {
      plannedMeters,
      receivedMeters,
      lostMeters,
      lossPercent: plannedMeters > 0 ? (lostMeters / plannedMeters) * 100 : 0,
    }
  })

  return {
    byCloth,
    totalLostMeters,
    totalPlannedMeters,
    overallLossPercent:
      totalPlannedMeters > 0 ? (totalLostMeters / totalPlannedMeters) * 100 : 0,
  }
}

export function computeBypassDesignDeductions(design) {
  return getDesignClothTotals(design)
}

export function computeProductionVolumeOutcomes(job, volumeDesigns) {
  const dyedDesignIds = new Set((job.designs || []).map((d) => d.designId))
  const outcomes = []

  volumeDesigns.forEach((design) => {
    const plannedUnits = design.plannedUnits ?? design.units ?? 0

    if (dyedDesignIds.has(design.id)) {
      const receivedByItem = getReceivedMetersByItem(job, design.id, design)
      const { actualUnits, itemBreakdown, leftoverScrap } = computeDesignBottleneck(
        design,
        receivedByItem
      )
      outcomes.push({
        designId: design.id,
        designCode: getDesignLabel(design),
        requiresDyeing: true,
        plannedUnits,
        actualUnits,
        varianceUnits: actualUnits - plannedUnits,
        variancePercent: plannedUnits > 0 ? ((actualUnits - plannedUnits) / plannedUnits) * 100 : 0,
        itemBreakdown,
        leftoverScrap,
        receivedByItem,
      })
    } else if (!designRequiresDyeing(design)) {
      outcomes.push({
        designId: design.id,
        designCode: getDesignLabel(design),
        requiresDyeing: false,
        plannedUnits,
        actualUnits: plannedUnits,
        varianceUnits: 0,
        variancePercent: 0,
        itemBreakdown: (design.items || []).map((item) => ({
          itemId: item.id,
          itemName: item.name,
          clothType: item.clothType,
          colorCode: item.colorCode,
          metersPerUnit: item.metersPerUnit,
          receivedMeters: getItemConsumption(item, plannedUnits),
          producibleUnits: plannedUnits,
        })),
        leftoverScrap: [],
        rawBypass: true,
      })
    }
  })

  return outcomes
}

export function getDashboardMetrics(purchases, dyeingJobs, productionVolumes, finishedGoodsStock) {
  const totalPurchasedMeters = Object.values(buildRawStockFromPurchases(purchases)).reduce(
    (s, v) => s + v,
    0
  )

  let totalWastageMeters = 0
  let totalSentToDyeing = 0
  dyeingJobs
    .filter((j) => j.status === 'closed')
    .forEach((job) => {
      totalWastageMeters += job.wastageSummary?.totalLostMeters || 0
      totalSentToDyeing += job.wastageSummary?.totalPlannedMeters || 0
    })

  let totalActualUnits = 0
  let totalPlannedUnits = 0
  productionVolumes.forEach((pv) => {
    ;(pv.designOutcomes || []).forEach((o) => {
      totalActualUnits += o.actualUnits || 0
      totalPlannedUnits += o.plannedUnits || 0
    })
  })

  const activeDesigns = finishedGoodsStock.reduce((s, v) => s + v.designs.length, 0)
  const inProductionVolumes = productionVolumes.length

  return {
    totalPurchasedMeters,
    totalWastageMeters,
    wastagePercent: totalSentToDyeing > 0 ? (totalWastageMeters / totalSentToDyeing) * 100 : 0,
    totalActualUnits,
    totalPlannedUnits,
    activeDesigns,
    inProductionVolumes,
    totalPurchaseSpend: purchases.reduce((s, p) => s + p.totalPrice, 0),
  }
}

export function formatConsumptionFormula(metersPerUnit, units) {
  const total = getItemConsumption({ metersPerUnit }, units)
  return `${metersPerUnit} m × ${Number(units).toLocaleString()} = ${total.toLocaleString()} m`
}

export function getDesignTotalConsumption(items = [], units = 1) {
  return items.reduce((sum, item) => sum + getItemConsumption(item, units), 0)
}
