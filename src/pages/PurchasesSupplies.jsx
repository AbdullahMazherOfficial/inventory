import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, X, Package, CheckCircle, Search, Filter } from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  canWritePurchases,
  canFilterPurchases,
  formatPKR,
  PURCHASE_STATUS_LABELS,
  filterPurchases,
} from '../utils/inventoryHelpers'

const STATUS_STYLES = {
  in_progress: 'bg-amber-50 text-amber-600',
  complete: 'bg-emerald-accent/10 text-emerald-accent',
}

function PurchaseModal({ purchase, onSave, onClose }) {
  const [form, setForm] = useState(
    purchase || {
      materialType: '',
      vendor: '',
      quantity: 0,
      unit: 'meters',
      unitPrice: 0,
      status: 'in_progress',
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.materialType || !form.vendor || form.quantity <= 0) return
    onSave(form)
  }

  const estimatedTotal = form.quantity * form.unitPrice

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal">
            {purchase ? 'Edit Purchase Order' : 'Add Purchase Order'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-cream hover:text-charcoal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Material Type</label>
            <input
              value={form.materialType}
              onChange={(e) => setForm({ ...form, materialType: e.target.value })}
              placeholder="e.g. Premium Lawn"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
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
                <option>rolls</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Unit Price (PKR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-emerald-accent focus:outline-none"
            >
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div className="rounded-xl bg-cream p-4">
            <p className="text-xs text-muted">Computed Total Price</p>
            <p className="text-xl font-semibold text-charcoal">{formatPKR(estimatedTotal)}</p>
            {!purchase && (
              <p className="mt-2 text-xs text-muted">
                Batch serial and purchase date will be stamped automatically on save.
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-cream">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light py-2.5 text-sm font-semibold text-white shadow-md">
              {purchase ? 'Save Changes' : 'Log Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchasesSupplies() {
  const { role, purchases, addPurchase, updatePurchase, completePurchase, deletePurchase } = useInventory()
  const [showModal, setShowModal] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [materialFilter, setMaterialFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')

  const canWrite = canWritePurchases(role)
  const canFilter = canFilterPurchases(role)

  const materialOptions = useMemo(
    () => [...new Set(purchases.map((purchase) => purchase.materialType))].sort(),
    [purchases]
  )
  const vendorOptions = useMemo(
    () => [...new Set(purchases.map((purchase) => purchase.vendor))].sort(),
    [purchases]
  )

  const filteredPurchases = useMemo(
    () =>
      canFilter
        ? filterPurchases(purchases, {
            search,
            status: statusFilter,
            materialType: materialFilter,
            vendor: vendorFilter,
          })
        : purchases,
    [purchases, canFilter, search, statusFilter, materialFilter, vendorFilter]
  )

  const grandTotal = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0)
  const totalQuantity = filteredPurchases.reduce((sum, purchase) => sum + purchase.quantity, 0)
  const pendingPurchases = filteredPurchases.filter((purchase) => purchase.status === 'in_progress').length

  const handleSave = (form) => {
    if (editingPurchase) {
      updatePurchase(editingPurchase.id, form)
    } else {
      addPurchase(form)
    }
    setShowModal(false)
    setEditingPurchase(null)
  }

  return (
    <div className="space-y-6 p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Purchase Orders</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">{filteredPurchases.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">In Progress</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{pendingPurchases}</p>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-gold-light/5 p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-gold uppercase">Grand Total Cost</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal transition-all duration-300">
            {formatPKR(grandTotal)}
          </p>
        </div>
      </div>

      {canFilter && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-accent" />
            <h4 className="text-sm font-semibold text-charcoal">Filter Purchases</h4>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search batch, material, vendor..."
                className="w-full rounded-xl border border-border bg-cream py-2.5 pr-4 pl-10 text-sm focus:border-emerald-accent focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:outline-none"
            >
              <option value="all">All Materials</option>
              {materialOptions.map((material) => (
                <option key={material} value={material}>{material}</option>
              ))}
            </select>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:outline-none"
            >
              <option value="all">All Vendors</option>
              {vendorOptions.map((vendor) => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-muted">
            Showing {filteredPurchases.length} of {purchases.length} purchase orders
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-charcoal">Purchase History</h3>
          <p className="text-sm text-muted">
            Stock is added when a purchase is marked complete
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => {
              setEditingPurchase(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Add Purchase
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Batch Serial</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Date</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Material</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Vendor</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Qty</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Unit Price</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Total</th>
                <th className="px-6 py-4 text-center text-[11px] font-semibold tracking-wider text-muted uppercase">Status</th>
                {canWrite && (
                  <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-cream/30"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-lg bg-charcoal px-2.5 py-1 text-xs font-semibold text-white">
                      {purchase.batchSerial}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{purchase.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-accent/10 to-emerald-accent/10">
                        <Package className="h-4 w-4 text-indigo-accent" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-charcoal">{purchase.materialType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal">{purchase.vendor}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-charcoal">
                    {purchase.quantity.toLocaleString()} {purchase.unit}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-charcoal">
                    {formatPKR(purchase.unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal">
                    {formatPKR(purchase.totalPrice)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[purchase.status]}`}>
                      {PURCHASE_STATUS_LABELS[purchase.status]}
                    </span>
                  </td>
                  {canWrite && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {purchase.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => completePurchase(purchase.id)}
                            title="Mark complete"
                            className="rounded-lg p-1.5 text-muted hover:bg-emerald-accent/10 hover:text-emerald-accent"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPurchase(purchase)
                            setShowModal(true)
                          }}
                          className="rounded-lg p-1.5 text-muted hover:bg-cream hover:text-emerald-accent"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePurchase(purchase.id)}
                          className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPurchases.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted">
            {purchases.length === 0 ? 'No purchase orders logged yet.' : 'No purchases match your filters.'}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-charcoal/10 bg-gradient-to-r from-charcoal to-indigo-accent p-6 text-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/60">All purchases combined</p>
            <p className="text-xs text-white/40">
              {totalQuantity.toLocaleString()} total units across {filteredPurchases.length} filtered purchase entries
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/60">Grand Total</p>
            <p className="text-3xl font-bold text-gold-light transition-all duration-300">
              {formatPKR(grandTotal)}
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <PurchaseModal
          purchase={editingPurchase}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingPurchase(null)
          }}
        />
      )}
    </div>
  )
}
