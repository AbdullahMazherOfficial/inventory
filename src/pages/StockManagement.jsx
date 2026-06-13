import { useState } from 'react'
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
} from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  canWriteProduction,
  getPurchasedFabricTypes,
} from '../utils/inventoryHelpers'

function DesignModal({ design, volumeName, purchases, rawMaterialStock, onSave, onClose }) {
  const clothTypes = getPurchasedFabricTypes(purchases, rawMaterialStock)
  const isEditing = Boolean(design)

  const [form, setForm] = useState(
    design
      ? { code: design.code, color: design.color }
      : {
          code: '',
          color: '',
          clothType: clothTypes[0] || '',
          metersPerUnit: 0,
          unitsProduced: 0,
        }
  )
  const [error, setError] = useState('')

  const totalConsumption = (form.metersPerUnit || 0) * (form.unitsProduced || 0)
  const availableStock = rawMaterialStock[form.clothType] || 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.code || !form.color) return

    if (isEditing) {
      onSave(form)
      onClose()
      return
    }

    const result = onSave(form)
    if (result?.success === false) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal">
            {isEditing ? 'Edit Design' : 'Add Design & Produce'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-cream hover:text-charcoal">
            <X className="h-5 w-5" />
          </button>
        </div>
        {volumeName && (
          <p className="mb-4 text-sm text-muted">
            Volume: <span className="font-medium text-charcoal">{volumeName}</span>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Design Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. J1"
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Color</label>
            <input
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              placeholder="e.g. Crimson Red"
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
            />
          </div>

          {!isEditing && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Fabric (from purchases)</label>
                <select
                  value={form.clothType}
                  onChange={(e) => setForm({ ...form, clothType: e.target.value })}
                  className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
                >
                  {clothTypes.length === 0 ? (
                    <option value="">No purchased fabric in stock</option>
                  ) : (
                    clothTypes.map((type) => (
                      <option key={type} value={type}>
                        {type} ({(rawMaterialStock[type] || 0).toLocaleString()} m available)
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Meters per Unit</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.metersPerUnit}
                    onChange={(e) =>
                      setForm({ ...form, metersPerUnit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Units Produced</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unitsProduced}
                    onChange={(e) =>
                      setForm({ ...form, unitsProduced: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
                  />
                </div>
              </div>
              <div className="rounded-xl bg-cream p-4 text-sm">
                <p className="text-muted">Total fabric consumption</p>
                <p className="text-lg font-semibold text-charcoal">{totalConsumption.toLocaleString()} m</p>
                <p className="mt-1 text-xs text-muted">
                  Available: <span className="font-medium text-emerald-accent">{availableStock.toLocaleString()} m</span>
                </p>
              </div>
            </>
          )}

          {isEditing && design?.fabric && (
            <p className="text-xs text-muted">
              Fabric: <span className="font-medium text-charcoal">{design.fabric}</span> ·{' '}
              {design.units?.toLocaleString()} units in stock
            </p>
          )}

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
              disabled={!isEditing && clothTypes.length === 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditing ? 'Save Changes' : 'Add & Produce'}
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
              placeholder="e.g. Volume 3 (Festive Collection)"
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

function ProductionEditModal({ productionEntry, purchases, rawMaterialStock, onSave, onClose }) {
  const clothTypes = getPurchasedFabricTypes(purchases, rawMaterialStock)
  const [form, setForm] = useState({
    clothType: productionEntry.clothType,
    metersPerUnit: productionEntry.metersPerUnit || productionEntry.consumptionMeters / productionEntry.finishedPieces,
    finishedPieces: productionEntry.finishedPieces,
  })
  const [error, setError] = useState('')

  const restoredAvailable =
    (rawMaterialStock[form.clothType] || 0) +
    (form.clothType === productionEntry.clothType ? productionEntry.consumptionMeters : 0)
  const totalConsumption = (form.metersPerUnit || 0) * (form.finishedPieces || 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = onSave({
      clothType: form.clothType,
      metersPerUnit: form.metersPerUnit,
      finishedPieces: form.finishedPieces,
      consumptionMeters: totalConsumption,
    })
    if (result?.success === false) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal">Edit Production Run</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-cream hover:text-charcoal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Fabric</label>
            <select
              value={form.clothType}
              onChange={(e) => setForm({ ...form, clothType: e.target.value })}
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
            >
              {clothTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Meters per Unit</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.metersPerUnit}
                onChange={(e) => setForm({ ...form, metersPerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Units Produced</label>
              <input
                type="number"
                min="0"
                value={form.finishedPieces}
                onChange={(e) => setForm({ ...form, finishedPieces: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="rounded-xl bg-cream p-4 text-sm text-muted">
            Total consumption: <span className="font-semibold text-charcoal">{totalConsumption.toLocaleString()} m</span>
            <br />
            Available after restore: <span className="font-semibold text-emerald-accent">{restoredAvailable.toLocaleString()} m</span>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-cream">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light py-2.5 text-sm font-semibold text-white shadow-md">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
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
    updateProduction,
    deleteProduction,
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
  const [showVolumeModal, setShowVolumeModal] = useState(false)
  const [designModal, setDesignModal] = useState(null)
  const [productionEditModal, setProductionEditModal] = useState(null)

  const toggleVolume = (id) => {
    setExpandedVolumes((prev) =>
      prev.includes(id) ? prev.filter((volumeId) => volumeId !== id) : [...prev, id]
    )
  }

  const filteredVolumes = finishedGoodsStock
    .filter((volume) => filterVolume === 'all' || volume.id === filterVolume)
    .map((volume) => ({
      ...volume,
      designs: volume.designs.filter(
        (design) =>
          !search ||
          design.code.toLowerCase().includes(search.toLowerCase()) ||
          design.color.toLowerCase().includes(search.toLowerCase()) ||
          design.fabric.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((volume) => volume.designs.length > 0 || !search)

  const totalDesigns = finishedGoodsStock.reduce((sum, volume) => sum + volume.designs.length, 0)
  const totalUnits = finishedGoodsStock.reduce(
    (sum, volume) => sum + volume.designs.reduce((designSum, design) => designSum + design.units, 0),
    0
  )
  const rawStockEntries = Object.entries(rawMaterialStock).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-semibold text-charcoal">{totalDesigns}</p>
            <p className="text-xs text-muted">Design Codes</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-charcoal">{totalUnits.toLocaleString()}</p>
            <p className="text-xs text-muted">Finished Pieces</p>
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
                  className="flex items-center justify-between rounded-xl border border-border bg-cream/50 px-4 py-3 transition-colors hover:border-emerald-accent/20"
                >
                  <span className="text-sm font-medium text-charcoal">{materialType}</span>
                  <span className="text-sm font-semibold text-emerald-accent">
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
              <h3 className="text-base font-semibold text-charcoal">Finished Production Stock</h3>
              <p className="text-sm text-muted">Retail-ready balances by volume & design (view only)</p>
            </div>
          </div>
          <div className="space-y-4">
            {finishedGoodsStock.map((volume) => (
              <div key={volume.id} className="rounded-xl border border-border bg-cream/30 p-4">
                <p className="text-sm font-semibold text-charcoal">{volume.name}</p>
                <div className="mt-3 space-y-2">
                  {volume.designs.length === 0 ? (
                    <p className="text-xs text-muted">No design codes yet.</p>
                  ) : (
                    volume.designs.map((design) => (
                      <div key={design.id} className="flex items-center justify-between text-sm">
                        <span className="text-charcoal">
                          {design.code} — {design.color}
                        </span>
                        <span className="font-semibold text-charcoal">{design.units.toLocaleString()} pcs</span>
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
            Auto-logged when designs are produced — fabric deducted, finished pieces added
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Date</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Fabric</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Volume</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Design</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">m/Unit</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Consumption</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Produced</th>
                {canWrite && (
                  <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {production.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 8 : 7} className="px-6 py-8 text-center text-sm text-muted">
                    No production runs logged yet. Add a design to a volume to produce stock.
                  </td>
                </tr>
              ) : (
                production.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-cream/30">
                    <td className="px-6 py-4 text-sm text-muted">{entry.date}</td>
                    <td className="px-6 py-4 text-sm text-charcoal">{entry.clothType}</td>
                    <td className="px-6 py-4 text-sm text-charcoal">{entry.volumeName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-charcoal px-2.5 py-1 text-xs font-semibold text-white">
                        {entry.designCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-muted">
                      {(entry.metersPerUnit || entry.consumptionMeters / entry.finishedPieces).toFixed(2)} m
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-charcoal">
                      {entry.consumptionMeters.toLocaleString()} m
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-accent">
                      +{entry.finishedPieces.toLocaleString()} pcs
                    </td>
                    {canWrite && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setProductionEditModal(entry)}
                            className="rounded-lg p-1.5 text-muted hover:bg-cream hover:text-emerald-accent"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduction(entry.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-charcoal">Volume & Design Catalog</h3>
            <p className="text-sm text-muted">Add designs with per-unit consumption to produce finished stock</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, color, or fabric..."
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
          const volUnits = volume.designs.reduce((sum, design) => sum + design.units, 0)

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
                    <p className="text-xs text-muted">
                      {volume.designs.length} designs · {volUnits.toLocaleString()} units
                    </p>
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
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Color</th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Fabric</th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">m/Unit</th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Units</th>
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
                        volume.designs.map((design) => (
                          <tr
                            key={design.id}
                            className="border-b border-border/50 transition-colors last:border-0 hover:bg-cream/30"
                          >
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-lg bg-charcoal px-2.5 py-1 text-xs font-semibold text-white">
                                {design.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-charcoal">{design.color}</td>
                            <td className="px-6 py-4 text-sm text-muted">{design.fabric}</td>
                            <td className="px-6 py-4 text-right text-sm text-muted">
                              {design.metersPerUnit ? `${design.metersPerUnit} m` : '—'}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal">
                              {design.units.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                                  design.units < 200
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-emerald-accent/10 text-emerald-accent'
                                }`}
                              >
                                {design.units < 200 ? 'Low Stock' : 'In Stock'}
                              </span>
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
                        ))
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
              updateDesign(designModal.volumeId, designModal.design.id, data)
              return { success: true }
            }
            return addDesign(designModal.volumeId, data)
          }}
          onClose={() => setDesignModal(null)}
        />
      )}

      {productionEditModal && (
        <ProductionEditModal
          productionEntry={productionEditModal}
          purchases={purchases}
          rawMaterialStock={rawMaterialStock}
          onSave={(form) => updateProduction(productionEditModal.id, form)}
          onClose={() => setProductionEditModal(null)}
        />
      )}
    </div>
  )
}
