import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  INITIAL_FINISHED_GOODS_STOCK,
  INITIAL_PRODUCTION,
  INITIAL_PURCHASES,
  INITIAL_RAW_MATERIAL_STOCK,
} from '../data/initialData'
import {
  generateBatchSerial,
  getTodayDate,
} from '../utils/inventoryHelpers'

const InventoryContext = createContext(null)

function adjustRawStock(stock, materialType, delta) {
  const next = { ...stock }
  const current = next[materialType] || 0
  const updated = current + delta
  if (updated <= 0) {
    delete next[materialType]
  } else {
    next[materialType] = updated
  }
  return next
}

function adjustFinishedStock(stock, volumeId, designId, delta) {
  return stock.map((volume) => {
    if (volume.id !== volumeId) return volume
    return {
      ...volume,
      designs: volume.designs.map((design) =>
        design.id === designId
          ? { ...design, units: Math.max(0, design.units + delta) }
          : design
      ),
    }
  })
}

export function InventoryProvider({ children, initialRole = 'factory_admin' }) {
  const [role, setRole] = useState(initialRole)
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES)
  const [production, setProduction] = useState(INITIAL_PRODUCTION)
  const [rawMaterialStock, setRawMaterialStock] = useState(INITIAL_RAW_MATERIAL_STOCK)
  const [finishedGoodsStock, setFinishedGoodsStock] = useState(INITIAL_FINISHED_GOODS_STOCK)

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

    if (status === 'complete') {
      setRawMaterialStock((prev) => adjustRawStock(prev, materialType, quantity))
    }

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

      setRawMaterialStock((stock) => {
        let next = { ...stock }

        if (existing.status === 'complete') {
          next = adjustRawStock(next, existing.materialType, -existing.quantity)
        }

        if (status === 'complete') {
          next = adjustRawStock(next, materialType, quantity)
        }

        return next
      })

      return prev.map((purchase) => (purchase.id === id ? nextPurchase : purchase))
    })

    return updated
  }, [])

  const completePurchase = useCallback((id) => {
    setPurchases((prev) => {
      const existing = prev.find((purchase) => purchase.id === id)
      if (!existing || existing.status === 'complete') return prev

      setRawMaterialStock((stock) =>
        adjustRawStock(stock, existing.materialType, existing.quantity)
      )

      return prev.map((purchase) =>
        purchase.id === id ? { ...purchase, status: 'complete' } : purchase
      )
    })
  }, [])

  const deletePurchase = useCallback((id) => {
    setPurchases((prev) => {
      const existing = prev.find((purchase) => purchase.id === id)
      if (!existing) return prev

      if (existing.status === 'complete') {
        setRawMaterialStock((stock) =>
          adjustRawStock(stock, existing.materialType, -existing.quantity)
        )
      }

      return prev.filter((purchase) => purchase.id !== id)
    })
  }, [])

  const applyProductionDelta = useCallback((entry, direction) => {
    const multiplier = direction === 'apply' ? 1 : -1
    const consumption = entry.consumptionMeters * multiplier
    const finishedPieces = entry.finishedPieces * multiplier

    setRawMaterialStock((stock) => adjustRawStock(stock, entry.clothType, -consumption))
    setFinishedGoodsStock((stock) =>
      adjustFinishedStock(stock, entry.volumeId, entry.designId, finishedPieces)
    )
  }, [])

  const addDesign = useCallback(
    (volumeId, form) => {
      const metersPerUnit = Number(form.metersPerUnit) || 0
      const unitsProduced = Number(form.unitsProduced) || 0
      const clothType = form.clothType?.trim()
      const consumptionMeters = metersPerUnit * unitsProduced
      const available = rawMaterialStock[clothType] || 0

      if (
        !form.code?.trim() ||
        !form.color?.trim() ||
        !clothType ||
        metersPerUnit <= 0 ||
        unitsProduced <= 0 ||
        consumptionMeters > available
      ) {
        return { success: false, error: 'Invalid design entry or insufficient raw stock.' }
      }

      const volume = finishedGoodsStock.find((item) => item.id === volumeId)
      if (!volume) {
        return { success: false, error: 'Selected volume was not found.' }
      }

      const designId = `d-${Date.now()}`
      const entry = {
        id: `prod-${Date.now()}`,
        clothType,
        volumeId,
        volumeName: volume.name,
        designId,
        designCode: form.code.trim(),
        designColor: form.color.trim(),
        consumptionMeters,
        finishedPieces: unitsProduced,
        metersPerUnit,
        date: getTodayDate(),
      }

      setFinishedGoodsStock((prev) =>
        prev.map((vol) =>
          vol.id === volumeId
            ? {
                ...vol,
                designs: [
                  ...vol.designs,
                  {
                    id: designId,
                    code: form.code.trim(),
                    color: form.color.trim(),
                    fabric: clothType,
                    units: unitsProduced,
                    metersPerUnit,
                  },
                ],
              }
            : vol
        )
      )

      setProduction((prev) => [...prev, entry])
      setRawMaterialStock((stock) => adjustRawStock(stock, clothType, -consumptionMeters))

      return { success: true }
    },
    [finishedGoodsStock, rawMaterialStock]
  )

  const updateDesign = useCallback((volumeId, designId, form) => {
    setFinishedGoodsStock((prev) =>
      prev.map((volume) => {
        if (volume.id !== volumeId) return volume
        return {
          ...volume,
          designs: volume.designs.map((design) =>
            design.id === designId
              ? {
                  ...design,
                  code: form.code?.trim() || design.code,
                  color: form.color?.trim() || design.color,
                }
              : design
          ),
        }
      })
    )

    setProduction((prev) =>
      prev.map((entry) =>
        entry.designId === designId
          ? {
              ...entry,
              designCode: form.code?.trim() || entry.designCode,
              designColor: form.color?.trim() || entry.designColor,
            }
          : entry
      )
    )
  }, [])

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

  const deleteDesign = useCallback(
    (volumeId, designId) => {
      const relatedProduction = production.filter((entry) => entry.designId === designId)

      relatedProduction.forEach((entry) => {
        applyProductionDelta(entry, 'reverse')
      })

      setProduction((prev) => prev.filter((entry) => entry.designId !== designId))
      setFinishedGoodsStock((prev) =>
        prev.map((volume) =>
          volume.id === volumeId
            ? { ...volume, designs: volume.designs.filter((design) => design.id !== designId) }
            : volume
        )
      )
      return true
    },
    [applyProductionDelta, production]
  )

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
