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
  production_manager: 'Production Manager',
  super_admin: 'Super Admin',
}

export const DYER_OPTIONS = [
  { value: 'alharam_dyeing', label: 'ALHARAM DYEING' },
  { value: 'rk', label: 'RK' },
  { value: 'general_dyeing', label: 'GNEREAL DYEING' },
]

export function getDyerLabel(dyerValue) {
  return DYER_OPTIONS.find((d) => d.value === dyerValue)?.label || dyerValue || '—'
}

export const PURCHASE_STATUS_LABELS = {
  in_progress: 'In Progress',
  complete: 'Complete',
}

export function canWritePurchases(role) {
  return role === 'supply_admin'
}

export function canFilterPurchases(role) {
  return role === 'supply_admin' || role === 'super_admin'
}

export function canWriteProduction(role) {
  return role === 'production_manager'
}

export function canWriteProcess(role) {
  return role === 'production_manager'
}

export function canExportVolumesReport(role) {
  return role === 'production_manager' || role === 'super_admin'
}

export function canExportPurchasesReport(role) {
  return role === 'supply_admin' || role === 'super_admin'
}

export function canExportProcessReport(role) {
  return role === 'super_admin'
}

export function canViewProductionDetailsReport(role) {
  return role === 'production_manager' || role === 'super_admin'
}

export function canImportProductionDetails(role) {
  return role === 'production_manager' || role === 'super_admin'
}

export function canViewAllReports(role) {
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

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell.trim())
      cell = ''
    } else if (char === '\n' || (char === '\r' && next === '\n')) {
      row.push(cell.trim())
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      cell = ''
      if (char === '\r') i += 1
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim())
    if (row.some((value) => value !== '')) rows.push(row)
  }

  return rows
}

export const PRODUCTION_DETAIL_HEADERS = [
  'Volume',
  'Dyer',
  'Batch Serial',
  'Design Code',
  'Route',
  'Planned Units',
  'Actual Units',
  'Cloth Type',
  'Meters In',
  'Meters Out',
  'Balance Remaining',
  'Status',
]

function getDesignReceivedByCloth(job, designId) {
  const received = {}
  ;(job.lots || []).forEach((lot) => {
    if (lot.designId !== designId) return
    const clothType = lot.clothType?.trim()
    if (!clothType) return
    received[clothType] = (received[clothType] || 0) + (Number(lot.receivedMeters) || 0)
  })
  return received
}

function sumClothLines(lines) {
  return (lines || []).reduce(
    (totals, line) => ({
      metersIn: totals.metersIn + (Number(line.metersIn) || 0),
      metersOut: totals.metersOut + (Number(line.metersOut) || 0),
      balanceRemaining: totals.balanceRemaining + (Number(line.balanceRemaining) || 0),
    }),
    { metersIn: 0, metersOut: 0, balanceRemaining: 0 }
  )
}

function buildDesignClothLines(clothTotals, receivedByCloth) {
  return Object.entries(clothTotals || {}).map(([clothType, sentMeters]) => {
    const metersIn = Number(sentMeters) || 0
    const metersOut = Number(receivedByCloth[clothType]) || 0
    return {
      clothType,
      metersIn,
      metersOut,
      balanceRemaining: Math.max(0, metersIn - metersOut),
    }
  })
}

/**
 * One section per volume — no duplicate rows from dyeing job + production volume.
 * Meters in/out are per design + cloth type; volume footer sums all cloth lines.
 */
export function buildProductionDetailReport(finishedGoodsStock, dyeingJobs, productionVolumes) {
  const sections = []
  const volumesInProduction = new Set(productionVolumes.map((pv) => pv.volumeId))

  productionVolumes.forEach((pv) => {
    const job = dyeingJobs.find((j) => j.id === pv.dyeingJobId)
    const volume = finishedGoodsStock.find((v) => v.id === pv.volumeId)
    const designs = []
    const seenDesignIds = new Set()

    ;(job?.designs || []).forEach((entry) => {
      seenDesignIds.add(entry.designId)
      const design = volume?.designs.find((d) => d.id === entry.designId)
      const outcome = (pv.designOutcomes || []).find((o) => o.designId === entry.designId)
      const clothTotals = entry.clothTotals || getDesignClothTotals(design || { items: [] })
      const receivedByCloth = getDesignReceivedByCloth(job, entry.designId)
      const clothLines = buildDesignClothLines(clothTotals, receivedByCloth)

      designs.push({
        designCode: entry.designCode || getDesignLabel(design),
        route: 'Dyeing',
        plannedUnits: outcome?.plannedUnits ?? entry.plannedUnits ?? 0,
        actualUnits: outcome?.actualUnits ?? '',
        clothLines,
        totals: sumClothLines(clothLines),
      })
    })

    ;(pv.designOutcomes || [])
      .filter((outcome) => outcome.rawBypass || outcome.requiresDyeing === false)
      .forEach((outcome) => {
        if (seenDesignIds.has(outcome.designId)) return
        const design = volume?.designs.find((d) => d.id === outcome.designId)
        const clothTotals = getDesignClothTotals(design || { items: [] })
        const clothLines = buildDesignClothLines(clothTotals, clothTotals)

        designs.push({
          designCode: outcome.designCode || getDesignLabel(design),
          route: 'Raw Bypass',
          plannedUnits: outcome.plannedUnits ?? 0,
          actualUnits: outcome.actualUnits ?? outcome.plannedUnits ?? 0,
          clothLines,
          totals: sumClothLines(clothLines),
        })
      })

    const volumeTotals = designs.reduce(
      (acc, design) => ({
        metersIn: acc.metersIn + design.totals.metersIn,
        metersOut: acc.metersOut + design.totals.metersOut,
        balanceRemaining: acc.balanceRemaining + design.totals.balanceRemaining,
        plannedUnits: acc.plannedUnits + (Number(design.plannedUnits) || 0),
        actualUnits: acc.actualUnits + (Number(design.actualUnits) || 0),
      }),
      { metersIn: 0, metersOut: 0, balanceRemaining: 0, plannedUnits: 0, actualUnits: 0 }
    )

    sections.push({
      volumeId: pv.volumeId,
      volumeName: pv.volumeName,
      dyer: getDyerLabel(job?.dyer),
      batchSerial: job?.batchSerial || '—',
      status: 'In Production',
      sentAt: job?.sentAt,
      closedAt: job?.closedAt || pv.movedAt,
      designs,
      volumeTotals,
    })
  })

  dyeingJobs
    .filter((job) => job.status === 'in_dyeing' && !volumesInProduction.has(job.volumeId))
    .forEach((job) => {
      const volume = finishedGoodsStock.find((v) => v.id === job.volumeId)
      const designs = []

      ;(job.designs || []).forEach((entry) => {
        const design = volume?.designs.find((d) => d.id === entry.designId)
        const clothTotals = entry.clothTotals || getDesignClothTotals(design || { items: [] })
        const receivedByCloth = getDesignReceivedByCloth(job, entry.designId)
        const clothLines = buildDesignClothLines(clothTotals, receivedByCloth)

        let actualUnits = ''
        if (design) {
          const receivedByItem = getReceivedMetersByItem(job, entry.designId, design)
          actualUnits = computeDesignBottleneck(design, receivedByItem).actualUnits
        }

        designs.push({
          designCode: entry.designCode || getDesignLabel(design),
          route: 'Dyeing',
          plannedUnits: entry.plannedUnits ?? 0,
          actualUnits,
          clothLines,
          totals: sumClothLines(clothLines),
        })
      })

      const volumeTotals = designs.reduce(
        (acc, design) => ({
          metersIn: acc.metersIn + design.totals.metersIn,
          metersOut: acc.metersOut + design.totals.metersOut,
          balanceRemaining: acc.balanceRemaining + design.totals.balanceRemaining,
          plannedUnits: acc.plannedUnits + (Number(design.plannedUnits) || 0),
          actualUnits: acc.actualUnits + (Number(design.actualUnits) || 0),
        }),
        { metersIn: 0, metersOut: 0, balanceRemaining: 0, plannedUnits: 0, actualUnits: 0 }
      )

      sections.push({
        volumeId: job.volumeId,
        volumeName: job.volumeName,
        dyer: getDyerLabel(job.dyer),
        batchSerial: job.batchSerial,
        status: 'In Dyeing',
        sentAt: job.sentAt,
        closedAt: null,
        designs,
        volumeTotals,
      })
    })

  return sections
}

export function flattenProductionDetailReport(sections) {
  const rows = []

  sections.forEach((section) => {
    section.designs.forEach((design) => {
      if (design.clothLines.length === 0) {
        rows.push([
          section.volumeName,
          section.dyer,
          section.batchSerial,
          design.designCode,
          design.route,
          design.plannedUnits,
          design.actualUnits,
          '',
          '',
          '',
          '',
          section.status,
        ])
        return
      }

      design.clothLines.forEach((line, index) => {
        rows.push([
          section.volumeName,
          section.dyer,
          section.batchSerial,
          design.designCode,
          design.route,
          index === 0 ? design.plannedUnits : '',
          index === 0 ? design.actualUnits : '',
          line.clothType,
          line.metersIn,
          line.metersOut,
          line.balanceRemaining,
          index === 0 ? section.status : '',
        ])
      })
    })

    rows.push([
      `${section.volumeName} — TOTAL`,
      section.dyer,
      section.batchSerial,
      '',
      '',
      section.volumeTotals.plannedUnits,
      section.volumeTotals.actualUnits,
      'ALL CLOTH',
      section.volumeTotals.metersIn,
      section.volumeTotals.metersOut,
      section.volumeTotals.balanceRemaining,
      section.status,
    ])
  })

  return rows
}

export function buildProductionDetailRows(finishedGoodsStock, dyeingJobs, productionVolumes) {
  return flattenProductionDetailReport(
    buildProductionDetailReport(finishedGoodsStock, dyeingJobs, productionVolumes)
  )
}

export function buildProcessReportRows(productionVolumes, dyeingJobs) {
  return (productionVolumes || []).map((pv) => {
    const job = dyeingJobs.find((j) => j.id === pv.dyeingJobId)
    const sentMeters = job?.wastageSummary?.totalPlannedMeters
      ?? Object.values(job?.stockDeducted || {}).reduce((s, v) => s + v, 0)
    const receivedMeters = sentMeters - (pv.wastageSummary?.totalLostMeters || 0)
    const wastedMeters = pv.wastageSummary?.totalLostMeters || 0
    const wastagePercentage = sentMeters > 0 ? (wastedMeters / sentMeters) * 100 : 0
    const plannedUnits = (pv.designOutcomes || []).reduce((s, o) => s + (o.plannedUnits || 0), 0)
    const actualUnits = (pv.designOutcomes || []).reduce((s, o) => s + (o.actualUnits || 0), 0)

    return {
      id: pv.id,
      volumeName: pv.volumeName,
      dyer: getDyerLabel(job?.dyer),
      sentMeters,
      receivedMeters,
      wastedMeters,
      wastagePercentage,
      plannedUnits,
      actualUnits,
      wastageDescription: pv.wastageDescription,
    }
  })
}

export function parseProductionDetailImport(text) {
  const parsed = parseCsv(text)
  if (parsed.length < 2) return { success: false, error: 'CSV must include a header row and at least one data row.' }

  const headers = parsed[0].map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim())
  const findCol = (...names) => {
    for (const name of names) {
      const idx = headers.findIndex((h) => h.includes(name))
      if (idx >= 0) return idx
    }
    return -1
  }

  const col = {
    volume: findCol('volume'),
    dyer: findCol('dyer'),
    batch: findCol('batch'),
    design: findCol('design'),
    route: findCol('route'),
    planned: findCol('planned'),
    actual: findCol('actual'),
    cloth: findCol('cloth'),
    sent: findCol('sent', 'meters in'),
    received: findCol('received', 'meters out'),
    remaining: findCol('remaining', 'balance'),
    status: findCol('status'),
  }

  if (col.volume < 0 || col.design < 0) {
    return { success: false, error: 'CSV must include at least Volume and Design Code columns.' }
  }

  const records = parsed.slice(1).map((row, index) => ({
    id: `import-${Date.now()}-${index}`,
    volume: row[col.volume] || '',
    dyer: col.dyer >= 0 ? row[col.dyer] || '' : '',
    batchSerial: col.batch >= 0 ? row[col.batch] || '' : '',
    designCode: row[col.design] || '',
    route: col.route >= 0 ? row[col.route] || '' : '',
    plannedUnits: col.planned >= 0 ? Number(row[col.planned]) || row[col.planned] : '',
    actualUnits: col.actual >= 0 ? Number(row[col.actual]) || row[col.actual] : '',
    clothType: col.cloth >= 0 ? row[col.cloth] || '' : '',
    sentMeters: col.sent >= 0 ? Number(row[col.sent]) || row[col.sent] : '',
    receivedMeters: col.received >= 0 ? Number(row[col.received]) || row[col.received] : '',
    remainingMeters: col.remaining >= 0 ? Number(row[col.remaining]) || row[col.remaining] : '',
    status: col.status >= 0 ? row[col.status] || '' : '',
    importedAt: getTodayDate(),
  }))

  return { success: true, records }
}

export function filterPurchases(purchases, filters = {}) {
  const search = filters.search?.trim().toLowerCase() || ''
  const status = filters.status || 'all'
  const materialType = filters.materialType || 'all'
  const vendor = filters.vendor || 'all'

  return purchases.filter((purchase) => {
    if (status !== 'all' && purchase.status !== status) return false
    if (materialType !== 'all' && purchase.materialType !== materialType) return false
    if (vendor !== 'all' && purchase.vendor !== vendor) return false
    if (!search) return true

    const haystack = [
      purchase.batchSerial,
      purchase.materialType,
      purchase.vendor,
      purchase.date,
      PURCHASE_STATUS_LABELS[purchase.status],
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(search)
  })
}
