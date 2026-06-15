import { useState, Fragment } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  Filter,
  Factory,
  Layers,
  Shirt,
  Scissors,
} from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  canWriteProduction,
  getPurchasedFabricTypes,
  getRawStockEntries,
  getItemConsumption,
  aggregateConsumptionByCloth,
  getDesignLabel,
  getColorLabel,
  formatConsumptionFormula,
  PROCESS_STATUS_OPTIONS,
  PROCESS_STATUS_STYLES,
} from '../utils/inventoryHelpers'

const EMPTY_ITEM_DRAFT = { name: '', clothType: '', metersPerUnit: 0 }

function ClothTypeSelect({ value, onChange, options, getAvailable }) {
  return (
    <div className="relative">
      <Layers
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-emerald-accent"
        strokeWidth={1.5}
      />
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-xl border border-border bg-surface py-2.5 pr-10 pl-10 text-sm font-medium text-charcoal shadow-sm transition-all focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
      >
        {options.length === 0 ? (
          <option value="">No cloth purchased yet</option>
        ) : (
          options.map((type) => (
            <option key={type} value={type}>
              {type} — {getAvailable(type).toLocaleString()} m available
            </option>
          ))
        )}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
        strokeWidth={1.5}
      />
    </div>
  )
}

function DesignModal({ design, volumeName, purchases, rawMaterialStock, onSave, onClose }) {
  const clothTypes = getPurchasedFabricTypes(purchases)
  const isEditing = Boolean(design)

  const [designCode, setDesignCode] = useState(design?.designCode || design?.code || '')
  const [colorCode, setColorCode] = useState(design?.colorCode || design?.color || '')
  const [units, setUnits] = useState(design?.units || 0)
  const [processStatus, setProcessStatus] = useState(design?.processStatus || 'pending')
  const [savedItems, setSavedItems] = useState(
    design?.items?.map((item) => ({ ...item })) || []
  )
  const [itemDraft, setItemDraft] = useState({
    ...EMPTY_ITEM_DRAFT,
    clothType: clothTypes[0] || '',
  })
  const [itemError, setItemError] = useState('')
  const [error, setError] = useState('')

  const getAvailableForCloth = (clothType) => {
    const base = rawMaterialStock[clothType] || 0
    const existingTotal = isEditing
      ? aggregateConsumptionByCloth(design.items || [], design.units || 0)[clothType] || 0
      : 0
    const currentTotal = aggregateConsumptionByCloth(savedItems, units)[clothType] || 0
    return Math.max(0, base + existingTotal - currentTotal)
  }

  const handleSaveItem = () => {
    if (!itemDraft.name.trim()) {
      setItemError('Item name is required.')
      return
    }
    if (!itemDraft.clothType) {
      setItemError('Select a cloth type from purchased stock.')
      return
    }
    if (itemDraft.metersPerUnit <= 0) {
      setItemError('Enter meters consumed per unit.')
      return
    }
    if (units <= 0) {
      setItemError('Enter design units first so consumption can be calculated.')
      return
    }

    const itemTotal = getItemConsumption(itemDraft, units)
    const available = getAvailableForCloth(itemDraft.clothType)

    if (itemTotal > available) {
      setItemError(`Only ${available.toLocaleString()} m available for ${itemDraft.clothType}.`)
      return
    }

    setSavedItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: itemDraft.name.trim(),
        clothType: itemDraft.clothType,
        metersPerUnit: Number(itemDraft.metersPerUnit),
      },
    ])
    setItemDraft({ ...EMPTY_ITEM_DRAFT, clothType: clothTypes[0] || '' })
    setItemError('')
  }

  const handleRemoveItem = (itemId) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = onSave({
      designCode,
      colorCode,
      units,
      processStatus,
      items: savedItems,
    })

    if (result?.success === false) {
      setError(result.error)
      return
    }
    onClose()
  }

  const consumptionByCloth = aggregateConsumptionByCloth(savedItems, units)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">
              {isEditing ? 'Edit Design' : 'Add Design'}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Build a design with items — stock deducts when you save
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-cream hover:text-charcoal">
            <X className="h-5 w-5" />
          </button>
        </div>

        {volumeName && (
          <div className="mb-5 rounded-xl border border-emerald-accent/20 bg-emerald-accent/5 px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-emerald-accent uppercase">Volume</p>
            <p className="mt-0.5 text-sm font-semibold text-charcoal">{volumeName}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-border bg-cream/30 p-4">
            <p className="mb-4 text-xs font-semibold tracking-wide text-muted uppercase">Step 1 · Design Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Design Code</label>
                <input
                  value={designCode}
                  onChange={(e) => setDesignCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="6211"
                  maxLength={4}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm tracking-widest focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-muted">4-digit code</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Color Code</label>
                <input
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value.toUpperCase())}
                  placeholder="J1"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-muted">e.g. J1, J2</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Units to Initiate</label>
                <input
                  type="number"
                  min="0"
                  value={units || ''}
                  onChange={(e) => setUnits(parseInt(e.target.value, 10) || 0)}
                  placeholder="1500"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-muted">How many sets to produce</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Process Status</label>
                <select
                  value={processStatus}
                  onChange={(e) => setProcessStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
                >
                  {PROCESS_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-cream/40 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shirt className="h-4 w-4 text-emerald-accent" />
                <h4 className="text-sm font-semibold text-charcoal">Step 2 · Design Items</h4>
              </div>
              {units > 0 && (
                <span className="rounded-full bg-emerald-accent/10 px-3 py-1 text-xs font-semibold text-emerald-accent">
                  {units.toLocaleString()} units per item
                </span>
              )}
            </div>

            {savedItems.length > 0 && (
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                {savedItems.map((item, index) => {
                  const itemMeters = getItemConsumption(item, units)

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-gradient-to-r from-surface to-cream/40 p-3 transition-all hover:border-emerald-accent/30 hover:shadow-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-accent/10 text-xs font-bold text-emerald-accent">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-charcoal">{item.name}</p>
                        <span className="mt-1 inline-flex rounded-md bg-indigo-accent/10 px-2 py-0.5 text-[10px] font-medium text-indigo-accent">
                          {item.clothType}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-accent">
                          {units > 0 ? `${itemMeters.toLocaleString()} m` : `${item.metersPerUnit} m/u`}
                        </p>
                        <p className="text-[10px] text-muted">{item.metersPerUnit} m per unit</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-lg p-1.5 text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="rounded-xl border border-dashed border-emerald-accent/30 bg-surface p-4">
              <p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">
                {savedItems.length === 0 ? 'Add your first item' : 'Add another item'}
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted uppercase">Item Name</label>
                  <input
                    value={itemDraft.name}
                    onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })}
                    placeholder="Kamiz, Shalwar, Dupatta..."
                    className="w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted uppercase">Cloth Type</label>
                  <ClothTypeSelect
                    value={itemDraft.clothType}
                    onChange={(e) => setItemDraft({ ...itemDraft, clothType: e.target.value })}
                    options={clothTypes}
                    getAvailable={getAvailableForCloth}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted uppercase">Meters / Unit</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemDraft.metersPerUnit || ''}
                    onChange={(e) =>
                      setItemDraft({ ...itemDraft, metersPerUnit: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="3"
                    className="w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
                  />
                </div>
              </div>

              {units > 0 && itemDraft.metersPerUnit > 0 && (
                <div className="mt-3 rounded-lg bg-indigo-accent/5 px-3 py-2 text-xs text-indigo-accent">
                  Preview: {formatConsumptionFormula(itemDraft.metersPerUnit, units)}
                  {itemDraft.clothType && (
                    <span className="text-muted"> · {getAvailableForCloth(itemDraft.clothType).toLocaleString()} m available</span>
                  )}
                </div>
              )}

              {itemError && (
                <p className="mt-2 text-xs text-red-600">{itemError}</p>
              )}

              <button
                type="button"
                onClick={handleSaveItem}
                disabled={clothTypes.length === 0}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-accent/30 bg-emerald-accent/5 px-4 py-2.5 text-xs font-semibold text-emerald-accent transition-colors hover:bg-emerald-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Save Item
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-gold-light/5 p-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-gold" strokeWidth={1.5} />
              <p className="text-xs font-semibold tracking-wide text-gold uppercase">Fabric to Reserve by Cloth</p>
            </div>
            {units <= 0 && (
              <p className="mt-3 text-xs text-muted">Enter units above to calculate fabric per cloth type.</p>
            )}
            {Object.keys(consumptionByCloth).length > 0 ? (
              <div className="mt-4 space-y-2">
                {Object.entries(consumptionByCloth).map(([clothType, meters]) => (
                  <div
                    key={clothType}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-charcoal">{clothType}</span>
                    <span className="rounded-lg bg-gold/10 px-3 py-1 text-sm font-bold text-charcoal">
                      {meters.toLocaleString()} m
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              units > 0 && (
                <p className="mt-3 text-xs text-muted">Add items above to see fabric reservation per cloth type.</p>
              )
            )}
            <p className="mt-3 text-xs text-muted">
              Deducted from Raw Purchase Stock per cloth type when you click Add Design.
            </p>
          </section>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted transition-colors hover:bg-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savedItems.length === 0 || units <= 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditing ? 'Save Design' : 'Add Design'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VolumeModal({ onSave, onClose }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal">Add New Volume</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-cream hover:text-charcoal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Volume Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Volume 72 (Festive Collection)"
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-cream">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light py-2.5 text-sm font-semibold text-white shadow-md">
              Create Volume
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProcessStatusBadge({ status }) {
  const label = PROCESS_STATUS_OPTIONS.find((option) => option.value === status)?.label || status
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${PROCESS_STATUS_STYLES[status] || PROCESS_STATUS_STYLES.pending}`}>
      {label}
    </span>
  )
}

export default function StockManagement() {
  const {
    role,
    purchases,
    production,
    rawMaterialStock,
    finishedGoodsStock,
    addDesign,
    updateDesign,
    addVolume,
    deleteVolume,
    deleteDesign,
  } = useInventory()

  const canWrite = canWriteProduction(role)

  const [search, setSearch] = useState('')
  const [filterVolume, setFilterVolume] = useState('all')
  const [expandedVolumes, setExpandedVolumes] = useState(
    () => finishedGoodsStock.map((volume) => volume.id)
  )
  const [expandedDesigns, setExpandedDesigns] = useState([])
  const [showVolumeModal, setShowVolumeModal] = useState(false)
  const [designModal, setDesignModal] = useState(null)

  const toggleVolume = (id) => {
    setExpandedVolumes((prev) =>
      prev.includes(id) ? prev.filter((volumeId) => volumeId !== id) : [...prev, id]
    )
  }

  const toggleDesign = (id) => {
    setExpandedDesigns((prev) =>
      prev.includes(id) ? prev.filter((designId) => designId !== id) : [...prev, id]
    )
  }

  const filteredVolumes = finishedGoodsStock
    .filter((volume) => filterVolume === 'all' || volume.id === filterVolume)
    .map((volume) => ({
      ...volume,
      designs: volume.designs.filter((design) => {
        if (!search) return true
        const query = search.toLowerCase()
        const itemMatch = (design.items || []).some(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.clothType.toLowerCase().includes(query)
        )
        return (
          getDesignLabel(design).toLowerCase().includes(query) ||
          getColorLabel(design).toLowerCase().includes(query) ||
          itemMatch
        )
      }),
    }))
    .filter((volume) => volume.designs.length > 0 || !search)

  const totalDesigns = finishedGoodsStock.reduce((sum, volume) => sum + volume.designs.length, 0)
  const totalUnits = finishedGoodsStock.reduce(
    (sum, volume) =>
      sum + volume.designs.reduce((designSum, design) => designSum + (design.units || 0), 0),
    0
  )
  const rawStockEntries = getRawStockEntries(purchases, rawMaterialStock)

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-semibold text-charcoal">{totalDesigns}</p>
            <p className="text-xs text-muted">Designs</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-charcoal">{totalUnits.toLocaleString()}</p>
            <p className="text-xs text-muted">Units Initiated</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-charcoal">{finishedGoodsStock.length}</p>
            <p className="text-xs text-muted">Volumes</p>
          </div>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowVolumeModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Add Volume
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-accent/10 to-indigo-accent/5 p-3 text-indigo-accent">
              <Layers className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal">Raw Purchase Stock</h3>
              <p className="text-sm text-muted">Live fabric roll availability (view only)</p>
            </div>
          </div>
          <div className="space-y-3">
            {rawStockEntries.length === 0 ? (
              <p className="rounded-xl bg-cream px-4 py-6 text-center text-sm text-muted">
                No raw material stock available.
              </p>
            ) : (
              rawStockEntries.map(([materialType, balance]) => (
                <div
                  key={materialType}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                    balance > 0
                      ? 'border-border bg-cream/50 hover:border-emerald-accent/20'
                      : 'border-border/60 bg-cream/20'
                  }`}
                >
                  <span className="text-sm font-medium text-charcoal">{materialType}</span>
                  <span
                    className={`text-sm font-semibold ${
                      balance > 0 ? 'text-emerald-accent' : 'text-muted'
                    }`}
                  >
                    {balance.toLocaleString()} m
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-accent/10 to-emerald-light/5 p-3 text-emerald-accent">
              <Factory className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal">Design Pipeline</h3>
              <p className="text-sm text-muted">Designs in pre-production workflow (view only)</p>
            </div>
          </div>
          <div className="space-y-4">
            {finishedGoodsStock.map((volume) => (
              <div key={volume.id} className="rounded-xl border border-border bg-cream/30 p-4">
                <p className="text-sm font-semibold text-charcoal">{volume.name}</p>
                <div className="mt-3 space-y-2">
                  {volume.designs.length === 0 ? (
                    <p className="text-xs text-muted">No designs yet.</p>
                  ) : (
                    volume.designs.map((design) => (
                      <div key={design.id} className="flex items-center justify-between text-sm">
                        <span className="text-charcoal">
                          {getDesignLabel(design)} · {getColorLabel(design)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">{(design.units || 0).toLocaleString()} units</span>
                          <ProcessStatusBadge status={design.processStatus || 'pending'} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <h3 className="text-base font-semibold text-charcoal">Production Logs</h3>
          <p className="text-sm text-muted">
            Reserved for the production stage — designs are not logged here yet
          </p>
        </div>
        <div className="px-6 py-8 text-center text-sm text-muted">
          {production.length === 0
            ? 'No production runs yet. Designs are currently in pre-production workflow.'
            : `${production.length} legacy production entries`}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-charcoal">Volume & Design Catalog</h3>
            <p className="text-sm text-muted">Create designs with multiple items — Kamiz, Shalwar, Dupatta, etc.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search design, color, or item..."
                className="w-full rounded-xl border border-border bg-surface py-2.5 pr-4 pl-10 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
              <select
                value={filterVolume}
                onChange={(e) => setFilterVolume(e.target.value)}
                className="appearance-none rounded-xl border border-border bg-surface py-2.5 pr-8 pl-10 text-sm focus:border-emerald-accent focus:outline-none"
              >
                <option value="all">All Volumes</option>
                {finishedGoodsStock.map((volume) => (
                  <option key={volume.id} value={volume.id}>
                    {volume.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredVolumes.map((volume) => {
          const isExpanded = expandedVolumes.includes(volume.id)

          return (
            <div
              key={volume.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between border-b border-border bg-cream/30 px-6 py-4">
                <button
                  type="button"
                  onClick={() => toggleVolume(volume.id)}
                  className="flex items-center gap-3 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-emerald-accent" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted" />
                  )}
                  <div>
                    <h3 className="text-base font-semibold text-charcoal">{volume.name}</h3>
                    <p className="text-xs text-muted">{volume.designs.length} designs</p>
                  </div>
                </button>
                {canWrite && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDesignModal({ volumeId: volume.id, volumeName: volume.name })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-emerald-accent transition-colors hover:border-emerald-accent/30 hover:bg-emerald-accent/5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Design
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteVolume(volume.id)}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-cream/50">
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Design</th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Color</th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Units</th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Fabric Reserve</th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Status</th>
                        {canWrite && (
                          <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {volume.designs.length === 0 ? (
                        <tr>
                          <td colSpan={canWrite ? 7 : 6} className="px-6 py-8 text-center text-sm text-muted">
                            No designs yet. Click "Add Design" to get started.
                          </td>
                        </tr>
                      ) : (
                        volume.designs.map((design) => {
                          const isDesignExpanded = expandedDesigns.includes(design.id)
                          const clothConsumption = aggregateConsumptionByCloth(
                            design.items || [],
                            design.units || 0
                          )

                          return (
                            <Fragment key={design.id}>
                              <tr
                                key={design.id}
                                className="border-b border-border/50 transition-colors hover:bg-cream/30"
                              >
                                <td className="px-6 py-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleDesign(design.id)}
                                    className="flex items-center gap-2 text-left"
                                  >
                                    {isDesignExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-emerald-accent" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted" />
                                    )}
                                    <span className="inline-flex rounded-lg bg-charcoal px-2.5 py-1 text-xs font-semibold tracking-wider text-white">
                                      {getDesignLabel(design)}
                                    </span>
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-charcoal">
                                  {getColorLabel(design)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal">
                                  {(design.units || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-muted">
                                  {(design.items || []).length} items
                                </td>
                                <td className="px-6 py-4">
                                  {Object.keys(clothConsumption).length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(clothConsumption).map(([clothType, meters]) => (
                                        <span
                                          key={clothType}
                                          className="inline-flex rounded-lg border border-border bg-cream/60 px-2 py-1 text-[10px] font-medium text-charcoal"
                                        >
                                          {clothType}: {meters.toLocaleString()} m
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <ProcessStatusBadge status={design.processStatus || 'pending'} />
                                </td>
                                {canWrite && (
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDesignModal({
                                            volumeId: volume.id,
                                            volumeName: volume.name,
                                            design,
                                          })
                                        }
                                        className="rounded-lg p-1.5 text-muted hover:bg-cream hover:text-emerald-accent"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteDesign(volume.id, design.id)}
                                        className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                              {isDesignExpanded && (
                                <tr key={`${design.id}-items`} className="bg-cream/20">
                                  <td colSpan={canWrite ? 7 : 6} className="px-6 py-4">
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                      {(design.items || []).map((item, index) => {
                                        const itemMeters = getItemConsumption(item, design.units || 0)

                                        return (
                                        <div
                                          key={item.id}
                                          className="rounded-xl border border-border bg-surface px-4 py-3"
                                        >
                                          <p className="text-sm font-medium text-charcoal">
                                            {index + 1}. {item.name}
                                          </p>
                                          <p className="mt-1 text-xs text-muted">{item.clothType}</p>
                                          <p className="mt-2 text-sm font-semibold text-emerald-accent">
                                            {itemMeters.toLocaleString()} m
                                          </p>
                                        </div>
                                        )
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </section>

      {showVolumeModal && (
        <VolumeModal
          onSave={(name) => {
            addVolume(name)
            setShowVolumeModal(false)
          }}
          onClose={() => setShowVolumeModal(false)}
        />
      )}

      {designModal && (
        <DesignModal
          design={designModal.design}
          volumeName={designModal.volumeName}
          purchases={purchases}
          rawMaterialStock={rawMaterialStock}
          onSave={(data) => {
            if (designModal.design) {
              return updateDesign(designModal.volumeId, designModal.design.id, data)
            }
            return addDesign(designModal.volumeId, data)
          }}
          onClose={() => setDesignModal(null)}
        />
      )}
    </div>
  )
}
