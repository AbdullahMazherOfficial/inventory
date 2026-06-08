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
} from 'lucide-react'

function DesignModal({ design, volumeName, onSave, onClose }) {
  const [form, setForm] = useState(
    design || { code: '', color: '', fabric: 'Premium Lawn', units: 0 }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.code || !form.color) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal">
            {design ? 'Edit Design' : 'Add Design Code'}
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
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Fabric Type</label>
            <select
              value={form.fabric}
              onChange={(e) => setForm({ ...form, fabric: e.target.value })}
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
            >
              <option>Premium Lawn</option>
              <option>Chiffon</option>
              <option>Silk</option>
              <option>Organza</option>
              <option>Velvet</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Units in Stock</label>
            <input
              type="number"
              min="0"
              value={form.units}
              onChange={(e) => setForm({ ...form, units: parseInt(e.target.value) || 0 })}
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
            />
          </div>
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
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              {design ? 'Save Changes' : 'Add Design'}
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

export default function StockManagement({ volumes, setVolumes }) {
  const [search, setSearch] = useState('')
  const [filterVolume, setFilterVolume] = useState('all')
  const [expandedVolumes, setExpandedVolumes] = useState(
    () => volumes.map((v) => v.id)
  )
  const [showVolumeModal, setShowVolumeModal] = useState(false)
  const [designModal, setDesignModal] = useState(null)

  const toggleVolume = (id) => {
    setExpandedVolumes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const addVolume = (name) => {
    setVolumes([
      ...volumes,
      { id: `vol-${Date.now()}`, name, designs: [] },
    ])
    setShowVolumeModal(false)
  }

  const deleteVolume = (volId) => {
    setVolumes(volumes.filter((v) => v.id !== volId))
  }

  const saveDesign = (volId, designData, existingId) => {
    setVolumes(
      volumes.map((vol) => {
        if (vol.id !== volId) return vol
        if (existingId) {
          return {
            ...vol,
            designs: vol.designs.map((d) =>
              d.id === existingId ? { ...d, ...designData } : d
            ),
          }
        }
        return {
          ...vol,
          designs: [
            ...vol.designs,
            { ...designData, id: `d-${Date.now()}` },
          ],
        }
      })
    )
    setDesignModal(null)
  }

  const deleteDesign = (volId, designId) => {
    setVolumes(
      volumes.map((vol) =>
        vol.id === volId
          ? { ...vol, designs: vol.designs.filter((d) => d.id !== designId) }
          : vol
      )
    )
  }

  const filteredVolumes = volumes
    .filter((v) => filterVolume === 'all' || v.id === filterVolume)
    .map((vol) => ({
      ...vol,
      designs: vol.designs.filter(
        (d) =>
          !search ||
          d.code.toLowerCase().includes(search.toLowerCase()) ||
          d.color.toLowerCase().includes(search.toLowerCase()) ||
          d.fabric.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((v) => v.designs.length > 0 || !search)

  const totalDesigns = volumes.reduce((s, v) => s + v.designs.length, 0)
  const totalUnits = volumes.reduce(
    (s, v) => s + v.designs.reduce((ds, d) => ds + d.units, 0),
    0
  )

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
            <p className="text-xs text-muted">Total Units</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-charcoal">{volumes.length}</p>
            <p className="text-xs text-muted">Volumes</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowVolumeModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add Volume
        </button>
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
            {volumes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredVolumes.map((volume) => {
          const isExpanded = expandedVolumes.includes(volume.id)
          const volUnits = volume.designs.reduce((s, d) => s + d.units, 0)

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
              </div>

              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-cream/50">
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
                          Color
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
                          Fabric
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">
                          Units
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {volume.designs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted">
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
      </div>

      {showVolumeModal && (
        <VolumeModal onSave={addVolume} onClose={() => setShowVolumeModal(false)} />
      )}

      {designModal && (
        <DesignModal
          design={designModal.design}
          volumeName={designModal.volumeName}
          onSave={(data) =>
            saveDesign(designModal.volumeId, data, designModal.design?.id)
          }
          onClose={() => setDesignModal(null)}
        />
      )}
    </div>
  )
}
