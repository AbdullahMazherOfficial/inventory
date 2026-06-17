import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  INITIAL_FINISHED_GOODS_STOCK,
  INITIAL_PRODUCTION,
  INITIAL_PURCHASES,
  INITIAL_DYEING_JOBS,
  INITIAL_PRODUCTION_VOLUMES,
} from '../data/initialData'
import {
  generateBatchSerial,
  getTodayDate,
  computeAvailableStock,
  normalizeDesignItems,
  validateDesignCode,
  generateDyeBatchSerial,
  getDesignStatus,
  isDesignEligibleForDyeing,
  designRequiresDyeing,
  getDesignClothTotals,
  getDyeingSendTotals,
  mergeClothTotals,
  getDesignLabel,
  validateStockAvailability,
  distributeLotToItems,
  computeJobWastageSummary,
  computeProductionVolumeOutcomes,
  computeBypassDesignDeductions,
} from '../utils/inventoryHelpers'

const InventoryContext = createContext(null)

export function InventoryProvider({ children, initialRole = 'factory_admin' }) {
  const [role, setRole] = useState(initialRole)
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES)
  const [production, setProduction] = useState(INITIAL_PRODUCTION)
  const [finishedGoodsStock, setFinishedGoodsStock] = useState(INITIAL_FINISHED_GOODS_STOCK)
  const [dyeingJobs, setDyeingJobs] = useState(INITIAL_DYEING_JOBS)
  const [productionVolumes, setProductionVolumes] = useState(INITIAL_PRODUCTION_VOLUMES)

  const availableStock = useMemo(
    () => computeAvailableStock(purchases, dyeingJobs, productionVolumes),
    [purchases, dyeingJobs, productionVolumes]
  )

  const addPurchase = useCallback((form) => {
    const quantity = Number(form.quantity) || 0
    const unitPrice = Number(form.unitPrice) || 0
    const materialType = form.materialType?.trim()
    const status = form.status || 'in_progress'
    if (!materialType || quantity <= 0) return false

    setPurchases((prev) => [
      ...prev,
      {
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
      },
    ])
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
      const existing = prev.find((p) => p.id === id)
      if (!existing) return prev
      updated = true
      return prev.map((p) =>
        p.id === id
          ? {
              ...p,
              materialType,
              vendor: form.vendor?.trim() || p.vendor,
              quantity,
              unit: form.unit || p.unit,
              unitPrice,
              totalPrice: quantity * unitPrice,
              status,
            }
          : p
      )
    })
    return updated
  }, [])

  const completePurchase = useCallback((id) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === id && p.status !== 'complete' ? { ...p, status: 'complete' } : p))
    )
  }, [])

  const deletePurchase = useCallback((id) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addDesign = useCallback(
    (volumeId, form) => {
      const designCode = form.designCode?.trim()
      const units = Number(form.units) || 0
      const requiresDyeing = form.requiresDyeing !== false
      const items = normalizeDesignItems(form.items)

      if (!validateDesignCode(designCode)) {
        return { success: false, error: 'Design code must be exactly 4 digits.' }
      }
      if (units <= 0) {
        return { success: false, error: 'Enter the number of units to initiate.' }
      }
      if (items.length === 0) {
        return { success: false, error: 'Add at least one item to the design.' }
      }
      if (
        items.some(
          (item) => !item.name || !item.clothType || !item.colorCode || item.metersPerUnit <= 0
        )
      ) {
        return {
          success: false,
          error: 'Each item needs a name, cloth type, color code, and meters per unit.',
        }
      }

      const volume = finishedGoodsStock.find((v) => v.id === volumeId)
      if (!volume) return { success: false, error: 'Volume not found.' }

      const design = {
        id: `d-${Date.now()}`,
        designCode,
        status: 'initiated',
        requiresDyeing,
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
    [finishedGoodsStock]
  )

  const updateDesign = useCallback(
    (volumeId, designId, form) => {
      const designCode = form.designCode?.trim()
      const units = Number(form.units) || 0
      const requiresDyeing = form.requiresDyeing !== false
      const items = normalizeDesignItems(form.items)

      if (!validateDesignCode(designCode)) {
        return { success: false, error: 'Design code must be exactly 4 digits.' }
      }
      if (units <= 0) {
        return { success: false, error: 'Enter the number of units to initiate.' }
      }
      if (items.length === 0) {
        return { success: false, error: 'Add at least one item to the design.' }
      }
      if (
        items.some(
          (item) => !item.name || !item.clothType || !item.colorCode || item.metersPerUnit <= 0
        )
      ) {
        return {
          success: false,
          error: 'Each item needs a name, cloth type, color code, and meters per unit.',
        }
      }

      const existing = finishedGoodsStock
        .find((v) => v.id === volumeId)
        ?.designs.find((d) => d.id === designId)

      if (!existing) return { success: false, error: 'Design not found.' }
      if (getDesignStatus(existing) !== 'initiated') {
        return { success: false, error: 'Only initiated designs can be edited.' }
      }

      setFinishedGoodsStock((prev) =>
        prev.map((vol) => {
          if (vol.id !== volumeId) return vol
          return {
            ...vol,
            designs: vol.designs.map((d) =>
              d.id === designId
                ? { ...d, designCode, units, plannedUnits: units, requiresDyeing, items }
                : d
            ),
          }
        })
      )
      return { success: true }
    },
    [finishedGoodsStock]
  )

  const addVolume = useCallback((name) => {
    setFinishedGoodsStock((prev) => [
      ...prev,
      { id: `vol-${Date.now()}`, name, inProduction: false, designs: [] },
    ])
  }, [])

  const deleteVolume = useCallback((volumeId) => {
    setFinishedGoodsStock((prev) => prev.filter((v) => v.id !== volumeId))
  }, [])

  const deleteDesign = useCallback((volumeId, designId) => {
    const existing = finishedGoodsStock
      .find((v) => v.id === volumeId)
      ?.designs.find((d) => d.id === designId)
    if (!existing || getDesignStatus(existing) !== 'initiated') return false

    setFinishedGoodsStock((prev) =>
      prev.map((vol) =>
        vol.id === volumeId
          ? { ...vol, designs: vol.designs.filter((d) => d.id !== designId) }
          : vol
      )
    )
    return true
  }, [finishedGoodsStock])

  const sendVolumeToDyeing = useCallback(
    (volumeId) => {
      const volume = finishedGoodsStock.find((v) => v.id === volumeId)
      if (!volume) return { success: false, error: 'Volume not found.' }
      if (volume.inProduction) {
        return { success: false, error: 'Volume is already in production.' }
      }

      const activeJob = dyeingJobs.find(
        (j) => j.volumeId === volumeId && j.status === 'in_dyeing'
      )
      if (activeJob) {
        return { success: false, error: 'This volume already has an active dyeing job.' }
      }

      const dyeDesigns = volume.designs.filter(isDesignEligibleForDyeing)
      if (dyeDesigns.length === 0) {
        return {
          success: false,
          error: 'No initiated dyeing designs in this volume. Raw bypass designs are not sent.',
        }
      }

      const stockNeeded = getDyeingSendTotals(dyeDesigns)
      const stockCheck = validateStockAvailability(stockNeeded, availableStock)
      if (!stockCheck.valid) return { success: false, error: stockCheck.error }

      const jobId = `dye-job-${Date.now()}`
      const sentAt = getTodayDate()

      const jobDesigns = dyeDesigns.map((design) => ({
        designId: design.id,
        designCode: getDesignLabel(design),
        plannedUnits: design.plannedUnits ?? design.units ?? 0,
        clothTotals: getDesignClothTotals(design),
      }))

      const job = {
        id: jobId,
        batchSerial: generateDyeBatchSerial(),
        volumeId,
        volumeName: volume.name,
        status: 'in_dyeing',
        sentAt,
        closedAt: null,
        designs: jobDesigns,
        plannedClothTotals: stockNeeded,
        stockDeducted: { ...stockNeeded },
        lots: [],
        wastageSummary: null,
        wastageDescription: null,
        designOutcomes: null,
      }

      setDyeingJobs((prev) => [job, ...prev])

      setFinishedGoodsStock((prev) =>
        prev.map((vol) => {
          if (vol.id !== volumeId) return vol
          return {
            ...vol,
            designs: vol.designs.map((d) =>
              dyeDesigns.some((dd) => dd.id === d.id)
                ? { ...d, status: 'in_dyeing', dyeingJobId: jobId, sentToDyeingAt: sentAt }
                : d
            ),
          }
        })
      )

      return { success: true, job }
    },
    [finishedGoodsStock, dyeingJobs, availableStock]
  )

  const receiveDyeLot = useCallback(
    (jobId, form) => {
      const lotNumber = form.lotNumber?.trim()
      const clothType = form.clothType?.trim()
      const colorCode = form.colorCode?.trim().toUpperCase()
      const receivedMeters = Number(form.receivedMeters) || 0
      const designId = form.designId

      if (!lotNumber) return { success: false, error: 'Lot number is required.' }
      if (!clothType || !colorCode || receivedMeters <= 0) {
        return { success: false, error: 'Enter fabric type, color code, and received meters.' }
      }
      if (!designId) return { success: false, error: 'Select a design to assign this lot to.' }

      const job = dyeingJobs.find((j) => j.id === jobId)
      if (!job || job.status !== 'in_dyeing') {
        return { success: false, error: 'Active dyeing job not found.' }
      }

      const volume = finishedGoodsStock.find((v) => v.id === job.volumeId)
      const design = volume?.designs.find((d) => d.id === designId)
      if (!design) return { success: false, error: 'Design not found in this volume.' }

      const lotDraft = { clothType, colorCode, receivedMeters }
      const matchingItems = (design.items || []).filter((item) =>
        item.clothType?.trim() === clothType && item.colorCode?.trim() === colorCode
      )
      if (matchingItems.length === 0) {
        return {
          success: false,
          error: `Design ${getDesignLabel(design)} has no items matching ${clothType}/${colorCode}.`,
        }
      }

      const itemDistribution = distributeLotToItems(lotDraft, design)
      const lot = {
        id: `lot-${Date.now()}`,
        lotNumber,
        clothType,
        colorCode,
        receivedMeters,
        designId,
        receivedAt: getTodayDate(),
        itemDistribution,
      }

      setDyeingJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, lots: [...(j.lots || []), lot] } : j))
      )

      return { success: true, lot }
    },
    [dyeingJobs, finishedGoodsStock]
  )

  const closeDyeingAndMoveToProduction = useCallback(
    (jobId, wastageDescription = '') => {
      const job = dyeingJobs.find((j) => j.id === jobId)
      if (!job || job.status !== 'in_dyeing') {
        return { success: false, error: 'Active dyeing job not found.' }
      }

      const volume = finishedGoodsStock.find((v) => v.id === job.volumeId)
      if (!volume) return { success: false, error: 'Volume not found.' }

      const wastageSummary = computeJobWastageSummary(job)
      if (wastageSummary.totalLostMeters > 0 && !wastageDescription?.trim()) {
        return {
          success: false,
          error: 'wastage_description_required',
          wastageSummary,
        }
      }

      const designOutcomes = computeProductionVolumeOutcomes(job, volume.designs)

      const bypassDesigns = volume.designs.filter(
        (d) => !designRequiresDyeing(d) && getDesignStatus(d) === 'initiated'
      )
      const rawStockDeductions = mergeClothTotals(
        ...bypassDesigns.map((d) => computeBypassDesignDeductions(d))
      )

      const stockCheck = validateStockAvailability(rawStockDeductions, availableStock)
      if (!stockCheck.valid) return { success: false, error: stockCheck.error }

      const closedAt = getTodayDate()

      setDyeingJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: 'closed',
                closedAt,
                wastageSummary,
                wastageDescription: wastageDescription.trim(),
                designOutcomes,
              }
            : j
        )
      )

      const productionVolume = {
        id: `prod-vol-${Date.now()}`,
        volumeId: volume.id,
        volumeName: volume.name,
        dyeingJobId: jobId,
        movedAt: closedAt,
        rawStockDeductions,
        designOutcomes,
        wastageSummary,
        wastageDescription: wastageDescription.trim(),
      }

      setProductionVolumes((prev) => [productionVolume, ...prev])

      setFinishedGoodsStock((prev) =>
        prev.map((vol) => {
          if (vol.id !== job.volumeId) return vol
          return {
            ...vol,
            inProduction: true,
            productionMovedAt: closedAt,
            designs: vol.designs.map((design) => {
              const outcome = designOutcomes.find((o) => o.designId === design.id)
              if (!outcome) return design
              return {
                ...design,
                status: 'in_production',
                actualUnits: outcome.actualUnits,
                plannedUnits: outcome.plannedUnits,
                productionOutcome: outcome,
                dyeingJobId: null,
              }
            }),
          }
        })
      )

      return { success: true, productionVolume, wastageSummary, designOutcomes }
    },
    [dyeingJobs, finishedGoodsStock, availableStock]
  )

  const value = useMemo(
    () => ({
      role,
      setRole,
      purchases,
      production,
      rawMaterialStock: availableStock,
      availableStock,
      finishedGoodsStock,
      dyeingJobs,
      productionVolumes,
      addPurchase,
      updatePurchase,
      completePurchase,
      deletePurchase,
      addDesign,
      updateDesign,
      addVolume,
      deleteVolume,
      deleteDesign,
      sendVolumeToDyeing,
      receiveDyeLot,
      closeDyeingAndMoveToProduction,
      volumes: finishedGoodsStock,
      supplies: purchases,
    }),
    [
      role,
      purchases,
      production,
      availableStock,
      finishedGoodsStock,
      dyeingJobs,
      productionVolumes,
      addPurchase,
      updatePurchase,
      completePurchase,
      deletePurchase,
      addDesign,
      updateDesign,
      addVolume,
      deleteVolume,
      deleteDesign,
      sendVolumeToDyeing,
      receiveDyeLot,
      closeDyeingAndMoveToProduction,
    ]
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) throw new Error('useInventory must be used within InventoryProvider')
  return context
}
