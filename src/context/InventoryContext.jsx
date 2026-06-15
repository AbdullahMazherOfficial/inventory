import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  INITIAL_FINISHED_GOODS_STOCK,
  INITIAL_PRODUCTION,
  INITIAL_PURCHASES,
} from '../data/initialData'
import {
  generateBatchSerial,
  getTodayDate,
  computeRawMaterialStock,
  normalizeDesignItems,
  validateDesignCode,
  validateItemsAgainstStock,
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
      const processStatus = form.processStatus || 'pending'
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
        processStatus,
        units,
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
      const processStatus = form.processStatus || 'pending'
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
                ? { ...design, designCode, colorCode, processStatus, units, items }
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

  const value = useMemo(
    () => ({
      role,
      setRole,
      purchases,
      production,
      rawMaterialStock,
      finishedGoodsStock,
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
      volumes: finishedGoodsStock,
      supplies: purchases,
    }),
    [
      role,
      purchases,
      production,
      rawMaterialStock,
      finishedGoodsStock,
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
