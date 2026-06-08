import { useState } from 'react'
import { Plus, Minus, Trash2, X, Package } from 'lucide-react'

function SupplyModal({ volumes, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    vendor: '',
    type: 'Fabric',
    volumeId: volumes[0]?.id || '',
    quantity: 0,
    unit: 'meters',
    unitPrice: 0,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.vendor) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal">Add New Supply</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-cream hover:text-charcoal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Supply Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Lawn Fabric"
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Vendor</label>
              <input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="Vendor name"
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Supply Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
              >
                <option>Fabric</option>
                <option>Embroidery</option>
                <option>Dupatta</option>
                <option>Trim</option>
                <option>Lace</option>
                <option>Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Volume Assignment</label>
              <select
                value={form.volumeId}
                onChange={(e) => setForm({ ...form, volumeId: e.target.value })}
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
              >
                {volumes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
              >
                <option>meters</option>
                <option>yards</option>
                <option>pieces</option>
                <option>rolls</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Unit Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="rounded-xl bg-cream p-4">
            <p className="text-xs text-muted">Estimated Total</p>
            <p className="text-xl font-semibold text-charcoal">
              ${(form.quantity * form.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-cream">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light py-2.5 text-sm font-semibold text-white shadow-md">
              Add Supply
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchasesSupplies({ supplies, setSupplies, volumes }) {
  const [showModal, setShowModal] = useState(false)

  const updateQuantity = (id, delta) => {
    setSupplies(
      supplies.map((s) =>
        s.id === id
          ? { ...s, quantity: Math.max(0, s.quantity + delta) }
          : s
      )
    )
  }

  const deleteSupply = (id) => {
    setSupplies(supplies.filter((s) => s.id !== id))
  }

  const addSupply = (form) => {
    setSupplies([
      ...supplies,
      { ...form, id: `sup-${Date.now()}` },
    ])
    setShowModal(false)
  }

  const grandTotal = supplies.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0)
  const totalQuantity = supplies.reduce((sum, s) => sum + s.quantity, 0)

  const getVolumeName = (volumeId) =>
    volumes.find((v) => v.id === volumeId)?.name || 'Unassigned'

  return (
    <div className="space-y-6 p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Total Supplies</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">{supplies.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Combined Quantity</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">{totalQuantity.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-gold-light/5 p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-gold uppercase">Grand Total Cost</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal transition-all duration-300">
            ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-charcoal">Supply Inventory</h3>
          <p className="text-sm text-muted">Use +/- buttons to adjust quantities in real-time</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add Supply
        </button>
      </div>

      <div className="space-y-4">
        {supplies.map((supply) => {
          const lineTotal = supply.quantity * supply.unitPrice

          return (
            <div
              key={supply.id}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:border-emerald-accent/20 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-accent/10 to-emerald-accent/10">
                    <Package className="h-5 w-5 text-indigo-accent" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-charcoal">{supply.name}</h4>
                    <p className="mt-0.5 text-sm text-muted">
                      {supply.vendor} · {supply.type}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-cream px-2.5 py-0.5 text-[10px] font-medium text-muted">
                      {getVolumeName(supply.volumeId)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Unit Price</p>
                    <p className="mt-1 text-sm font-semibold text-charcoal">
                      ${supply.unitPrice.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-center text-[10px] font-medium tracking-wide text-muted uppercase">
                      Quantity ({supply.unit})
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(supply.id, -10)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-cream text-muted transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="min-w-[80px] rounded-xl border border-emerald-accent/20 bg-emerald-accent/5 px-4 py-2 text-center">
                        <span className="text-lg font-bold text-emerald-accent transition-all duration-200">
                          {supply.quantity.toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQuantity(supply.id, 10)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-cream text-muted transition-all hover:border-emerald-accent/30 hover:bg-emerald-accent/5 hover:text-emerald-accent active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="min-w-[120px] rounded-xl border border-gold/20 bg-gold/5 px-5 py-3 text-center">
                    <p className="text-[10px] font-medium tracking-wide text-gold uppercase">Line Total</p>
                    <p className="mt-0.5 text-lg font-bold text-charcoal transition-all duration-200">
                      ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteSupply(supply.id)}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-charcoal/10 bg-gradient-to-r from-charcoal to-indigo-accent p-6 text-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/60">All supplies combined</p>
            <p className="text-xs text-white/40">
              {totalQuantity.toLocaleString()} total units across {supplies.length} supply entries
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/60">Grand Total</p>
            <p className="text-3xl font-bold text-gold-light transition-all duration-300">
              ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <SupplyModal
          volumes={volumes}
          onSave={addSupply}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
