import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  INITIAL_FINISHED_GOODS_STOCK,
  INITIAL_PRODUCTION,
  INITIAL_PURCHASES,
  INITIAL_DYEING_JOBS,
} from '../data/initialData'
import {
  generateBatchSerial,
  getTodayDate,
  computeRawMaterialStock,
  normalizeDesignItems,
  validateDesignCode,
  validateItemsAgainstStock,
  generateDyeBatchSerial,
  getDesignStatus,
  isDesignInitiated,
  getDesignClothTotals,
  mergeClothTotals,
  getDesignLabel,
  getColorLabel,
  computeJobWastageSummary,
  computeDesignOutcomes,
} from '../utils/inventoryHelpers'

const InventoryContext = createContext(null)

function adjustFinishedStock(stock, volumeId, designId, delta) {
  return stock.map((volume) => {
    if (volume.id !== volumeId) return volume
    return {
      ...volume,
      designs: volume.designs.map((design) =>
        design.id === designId
          ? { ...design, units: Math.max(0, (design.units || 0) + delta) }
          : design
      ),
    }
  })
}

export function InventoryProvider({ children, initialRole = 'factory_admin' }) {
  const [role, setRole] = useState(initialRole)
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES)
  const [production, setProduction] = useState(INITIAL_PRODUCTION)
  const [finishedGoodsStock, setFinishedGoodsStock] = useState(INITIAL_FINISHED_GOODS_STOCK)
  const [dyeingJobs, setDyeingJobs] = useState(INITIAL_DYEING_JOBS)

  const rawMaterialStock = useMemo(
    () => computeRawMaterialStock(purchases, finishedGoodsStock, production),
    [purchases, finishedGoodsStock, production]
  )

  const addPurchase = useCallback((form) => {
    const quantity = Number(form.quantity) || 0
    const unitPrice = Number(form.unitPrice) || 0
    const materialType = form.materialType?.trim()
    const status = form.status || 'in_progress'

    if (!materialType || quantity <= 0) return false

    const purchase = {
      id: `pur-${Date.now()}`,
      materialType,
      vendor: form.vendor?.trim() || 'Unknown Vendor',
      quantity,
      unit: form.unit || 'meters',
      unitPrice,
      totalPrice: quantity * unitPrice,
      date: getTodayDate(),
      batchSerial: generateBatchSerial(),
      status,
    }

    setPurchases((prev) => [...prev, purchase])

    return true
  }, [])

  const updatePurchase = useCallback((id, form) => {
    const quantity = Number(form.quantity) || 0
    const unitPrice = Number(form.unitPrice) || 0
    const materialType = form.materialType?.trim()
    const status = form.status || 'in_progress'

    if (!materialType || quantity <= 0) return false

    let updated = false

    setPurchases((prev) => {
      const existing = prev.find((purchase) => purchase.id === id)
      if (!existing) return prev

      updated = true
      const nextPurchase = {
        ...existing,
        materialType,
        vendor: form.vendor?.trim() || existing.vendor,
        quantity,
        unit: form.unit || existing.unit,
        unitPrice,
        totalPrice: quantity * unitPrice,
        status,
      }

      return prev.map((purchase) => (purchase.id === id ? nextPurchase : purchase))
    })

    return updated
  }, [])

  const completePurchase = useCallback((id) => {
    setPurchases((prev) => {
      const existing = prev.find((purchase) => purchase.id === id)
      if (!existing || existing.status === 'complete') return prev

      return prev.map((purchase) =>
        purchase.id === id ? { ...purchase, status: 'complete' } : purchase
      )
    })
  }, [])

  const deletePurchase = useCallback((id) => {
    setPurchases((prev) => {
      const existing = prev.find((purchase) => purchase.id === id)
      if (!existing) return prev

      return prev.filter((purchase) => purchase.id !== id)
    })
  }, [])

  const applyProductionDelta = useCallback((entry, direction) => {
    const multiplier = direction === 'apply' ? 1 : -1
    const finishedPieces = entry.finishedPieces * multiplier

    setFinishedGoodsStock((stock) =>
      adjustFinishedStock(stock, entry.volumeId, entry.designId, finishedPieces)
    )
  }, [])

  const addDesign = useCallback(
    (volumeId, form) => {
      const designCode = form.designCode?.trim()
      const colorCode = form.colorCode?.trim()
      const units = Number(form.units) || 0
      const items = normalizeDesignItems(form.items)

      if (!validateDesignCode(designCode)) {
        return { success: false, error: 'Design code must be exactly 4 digits.' }
      }

      if (!colorCode) {
        return { success: false, error: 'Color code is required.' }
      }

      if (units <= 0) {
        return { success: false, error: 'Enter the number of units to initiate for this design.' }
      }

      if (items.length === 0) {
        return { success: false, error: 'Add at least one item to the design.' }
      }

      if (items.some((item) => !item.name || !item.clothType || item.metersPerUnit <= 0)) {
        return { success: false, error: 'Each item needs a name, cloth type, and consumption in meters.' }
      }

      const stockCheck = validateItemsAgainstStock(items, rawMaterialStock, [], units)
      if (!stockCheck.valid) {
        return { success: false, error: stockCheck.error }
      }

      const volume = finishedGoodsStock.find((item) => item.id === volumeId)
      if (!volume) {
        return { success: false, error: 'Selected volume was not found.' }
      }

      const design = {
        id: `d-${Date.now()}`,
        designCode,
        colorCode,
        status: 'initiated',
        units,
        plannedUnits: units,
        actualUnits: null,
        items,
        createdAt: getTodayDate(),
      }

      setFinishedGoodsStock((prev) =>
        prev.map((vol) =>
          vol.id === volumeId ? { ...vol, designs: [...vol.designs, design] } : vol
        )
      )

      return { success: true }
    },
    [finishedGoodsStock, rawMaterialStock]
  )

  const updateDesign = useCallback(
    (volumeId, designId, form) => {
      const designCode = form.designCode?.trim()
      const colorCode = form.colorCode?.trim()
      const units = Number(form.units) || 0
      const items = normalizeDesignItems(form.items)

      if (!validateDesignCode(designCode)) {
        return { success: false, error: 'Design code must be exactly 4 digits.' }
      }

      if (!colorCode) {
        return { success: false, error: 'Color code is required.' }
      }

      if (units <= 0) {
        return { success: false, error: 'Enter the number of units to initiate for this design.' }
      }

      if (items.length === 0) {
        return { success: false, error: 'Add at least one item to the design.' }
      }

      if (items.some((item) => !item.name || !item.clothType || item.metersPerUnit <= 0)) {
        return { success: false, error: 'Each item needs a name, cloth type, and consumption in meters.' }
      }

      const existing = finishedGoodsStock
        .find((volume) => volume.id === volumeId)
        ?.designs.find((design) => design.id === designId)

      if (!existing) {
        return { success: false, error: 'Design not found.' }
      }

      if (getDesignStatus(existing) === 'completed') {
        return { success: false, error: 'Completed designs cannot be edited.' }
      }

      if (existing.dyeingJobId) {
        return { success: false, error: 'Design is in dyeing and cannot be edited.' }
      }

      const stockCheck = validateItemsAgainstStock(
        items,
        rawMaterialStock,
        existing.items || [],
        units,
        existing.units || 0
      )
      if (!stockCheck.valid) {
        return { success: false, error: stockCheck.error }
      }

      setFinishedGoodsStock((prev) =>
        prev.map((volume) => {
          if (volume.id !== volumeId) return volume
          return {
            ...volume,
            designs: volume.designs.map((design) =>
              design.id === designId
                ? {
                    ...design,
                    designCode,
                    colorCode,
                    units,
                    plannedUnits: units,
                    items,
                  }
                : design
            ),
          }
        })
      )

      return { success: true }
    },
    [finishedGoodsStock, rawMaterialStock]
  )

  const updateProduction = useCallback(
    (id, form) => {
      const existing = production.find((entry) => entry.id === id)
      if (!existing) {
        return { success: false, error: 'Production log not found.' }
      }

      const metersPerUnit = Number(form.metersPerUnit) || 0
      const finishedPieces = Number(form.finishedPieces) || 0
      const consumptionMeters =
        Number(form.consumptionMeters) || metersPerUnit * finishedPieces || 0

      if (
        !form.clothType ||
        consumptionMeters <= 0 ||
        finishedPieces <= 0
      ) {
        return { success: false, error: 'Invalid production entry.' }
      }

      const restoredStock = {
        ...rawMaterialStock,
        [existing.clothType]:
          (rawMaterialStock[existing.clothType] || 0) + existing.consumptionMeters,
      }
      const availableAfterRestore = restoredStock[form.clothType] || 0

      if (consumptionMeters > availableAfterRestore) {
        return { success: false, error: 'Insufficient raw stock for updated consumption.' }
      }

      const currentDesignUnits =
        finishedGoodsStock
          .find((item) => item.id === existing.volumeId)
          ?.designs.find((item) => item.id === existing.designId)?.units || 0

      if (currentDesignUnits - existing.finishedPieces + finishedPieces < 0) {
        return { success: false, error: 'Cannot reduce finished pieces below zero.' }
      }

      applyProductionDelta(existing, 'reverse')

      const updatedEntry = {
        ...existing,
        clothType: form.clothType,
        consumptionMeters,
        finishedPieces,
        metersPerUnit: metersPerUnit || consumptionMeters / finishedPieces,
      }

      setProduction((prev) => prev.map((entry) => (entry.id === id ? updatedEntry : entry)))
      applyProductionDelta(updatedEntry, 'apply')

      setFinishedGoodsStock((prev) =>
        prev.map((volume) => {
          if (volume.id !== existing.volumeId) return volume
          return {
            ...volume,
            designs: volume.designs.map((design) =>
              design.id === existing.designId
                ? { ...design, metersPerUnit: updatedEntry.metersPerUnit, fabric: form.clothType }
                : design
            ),
          }
        })
      )

      return { success: true }
    },
    [applyProductionDelta, finishedGoodsStock, production, rawMaterialStock]
  )

  const deleteProduction = useCallback(
    (id) => {
      const existing = production.find((entry) => entry.id === id)
      if (!existing) return

      applyProductionDelta(existing, 'reverse')
      setProduction((prev) => prev.filter((entry) => entry.id !== id))
    },
    [applyProductionDelta, production]
  )

  const addVolume = useCallback((name) => {
    setFinishedGoodsStock((prev) => [
      ...prev,
      { id: `vol-${Date.now()}`, name, designs: [] },
    ])
  }, [])

  const deleteVolume = useCallback((volumeId) => {
    setFinishedGoodsStock((prev) => prev.filter((volume) => volume.id !== volumeId))
  }, [])

  const deleteDesign = useCallback((volumeId, designId) => {
    const existing = finishedGoodsStock
      .find((volume) => volume.id === volumeId)
      ?.designs.find((design) => design.id === designId)

    if (!existing) return false

    setFinishedGoodsStock((prev) =>
      prev.map((volume) =>
        volume.id === volumeId
          ? { ...volume, designs: volume.designs.filter((design) => design.id !== designId) }
          : volume
      )
    )
    return true
  }, [finishedGoodsStock])

  const sendVolumeToDyeing = useCallback(
    (volumeId) => {
      const volume = finishedGoodsStock.find((v) => v.id === volumeId)
      if (!volume) {
        return { success: false, error: 'Volume not found.' }
      }

      const activeJob = dyeingJobs.find(
        (job) => job.volumeId === volumeId && job.status === 'in_dyeing'
      )
      if (activeJob) {
        return { success: false, error: 'This volume already has an active dyeing job.' }
      }

      const eligibleDesigns = volume.designs.filter(isDesignInitiated)
      if (eligibleDesigns.length === 0) {
        return { success: false, error: 'No initiated designs available to send to dyeing.' }
      }

      const jobId = `dye-job-${Date.now()}`
      const sentAt = getTodayDate()
      const batchSerial = generateDyeBatchSerial()

      const jobDesigns = eligibleDesigns.map((design) => ({
        designId: design.id,
        designCode: getDesignLabel(design),
        colorCode: getColorLabel(design),
        plannedUnits: design.plannedUnits ?? design.units ?? 0,
        clothTotals: getDesignClothTotals(design),
      }))

      const plannedClothTotals = mergeClothTotals(...jobDesigns.map((d) => d.clothTotals))

      const job = {
        id: jobId,
        batchSerial,
        volumeId,
        volumeName: volume.name,
        status: 'in_dyeing',
        sentAt,
        completedAt: null,
        designs: jobDesigns,
        plannedClothTotals,
        lots: [],
        wastageSummary: null,
        designOutcomes: null,
      }

      setDyeingJobs((prev) => [job, ...prev])

      setFinishedGoodsStock((prev) =>
        prev.map((vol) => {
          if (vol.id !== volumeId) return vol
          return {
            ...vol,
            designs: vol.designs.map((design) => {
              if (!eligibleDesigns.some((d) => d.id === design.id)) return design
              return { ...design, dyeingJobId: jobId, sentToDyeingAt: sentAt }
            }),
          }
        })
      )

      return { success: true, job }
    },
    [finishedGoodsStock, dyeingJobs]
  )

  const receiveDyeLot = useCallback(
    (jobId, form) => {
      const lotNumber = form.lotNumber?.trim()
      const clothType = form.clothType?.trim()
      const receivedMeters = Number(form.receivedMeters) || 0
      const assignments = form.assignments || []

      if (!lotNumber) {
        return { success: false, error: 'Lot number is required.' }
      }
      if (!clothType || receivedMeters <= 0) {
        return { success: false, error: 'Enter cloth type and received meters.' }
      }

      const job = dyeingJobs.find((j) => j.id === jobId)
      if (!job || job.status !== 'in_dyeing') {
        return { success: false, error: 'Active dyeing job not found.' }
      }

      const assignedTotal = assignments.reduce(
        (sum, a) => sum + (Number(a.assignedMeters) || 0),
        0
      )
      if (assignedTotal > receivedMeters) {
        return {
          success: false,
          error: 'Assigned meters cannot exceed lot received meters.',
        }
      }

      const lot = {
        id: `lot-${Date.now()}`,
        lotNumber,
        clothType,
        receivedMeters,
        receivedAt: getTodayDate(),
        assignments: assignments
          .filter((a) => (Number(a.assignedMeters) || 0) > 0)
          .map((a) => ({
            designId: a.designId,
            assignedMeters: Number(a.assignedMeters),
          })),
      }

      setDyeingJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, lots: [...(j.lots || []), lot] } : j
        )
      )

      return { success: true, lot }
    },
    [dyeingJobs]
  )

  const completeDyeingJob = useCallback(
    (jobId) => {
      const job = dyeingJobs.find((j) => j.id === jobId)
      if (!job || job.status !== 'in_dyeing') {
        return { success: false, error: 'Active dyeing job not found.' }
      }

      if (!job.lots?.length) {
        return { success: false, error: 'Receive at least one lot before completing dyeing.' }
      }

      const volume = finishedGoodsStock.find((v) => v.id === job.volumeId)
      if (!volume) {
        return { success: false, error: 'Volume not found.' }
      }

      const wastageSummary = computeJobWastageSummary(job)
      const designOutcomes = computeDesignOutcomes(job, volume.designs)
      const completedAt = getTodayDate()

      setDyeingJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: 'completed',
                completedAt,
                wastageSummary,
                designOutcomes,
              }
            : j
        )
      )

      setFinishedGoodsStock((prev) =>
        prev.map((vol) => {
          if (vol.id !== job.volumeId) return vol
          return {
            ...vol,
            designs: vol.designs.map((design) => {
              const outcome = designOutcomes.find((o) => o.designId === design.id)
              if (!outcome) return design
              return {
                ...design,
                status: 'completed',
                actualUnits: outcome.actualUnits,
                plannedUnits: outcome.plannedUnits,
                units: outcome.plannedUnits,
                dyeingJobId: null,
                dyeingCompletedAt: completedAt,
                dyeingOutcome: {
                  varianceUnits: outcome.varianceUnits,
                  variancePercent: outcome.variancePercent,
                  wastageByCloth: outcome.wastageByCloth,
                  assignedCloth: outcome.assignedCloth,
                },
              }
            }),
          }
        })
      )

      return { success: true, wastageSummary, designOutcomes }
    },
    [dyeingJobs, finishedGoodsStock]
  )

  const value = useMemo(
    () => ({
      role,
      setRole,
      purchases,
      production,
      rawMaterialStock,
      finishedGoodsStock,
      dyeingJobs,
      addPurchase,
      updatePurchase,
      completePurchase,
      deletePurchase,
      addDesign,
      updateDesign,
      updateProduction,
      deleteProduction,
      addVolume,
      deleteVolume,
      deleteDesign,
      sendVolumeToDyeing,
      receiveDyeLot,
      completeDyeingJob,
      volumes: finishedGoodsStock,
      supplies: purchases,
    }),
    [
      role,
      purchases,
      production,
      rawMaterialStock,
      finishedGoodsStock,
      dyeingJobs,
      addPurchase,
      updatePurchase,
      completePurchase,
      deletePurchase,
      addDesign,
      updateDesign,
      updateProduction,
      deleteProduction,
      addVolume,
      deleteVolume,
      deleteDesign,
      sendVolumeToDyeing,
      receiveDyeLot,
      completeDyeingJob,
    ]
  )

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider')
  }
  return context
}
