import { Download } from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  canExportPurchasesReport,
  canExportVolumesReport,
  exportToCsv,
  formatPKR,
  getDesignLabel,
  getColorLabel,
  aggregateConsumptionByCloth,
  getItemConsumption,
  getDesignStatus,
  PURCHASE_STATUS_LABELS,
  DESIGN_STATUS_OPTIONS,
} from '../utils/inventoryHelpers'

export default function Reports() {
  const { role, purchases, finishedGoodsStock, production } = useInventory()

  const canExportVolumes = canExportVolumesReport(role)
  const canExportPurchases = canExportPurchasesReport(role)

  const handleExportVolumes = () => {
    const rows = finishedGoodsStock.flatMap((volume) =>
      volume.designs.flatMap((design) =>
        (design.items || []).map((item) => [
          volume.name,
          getDesignLabel(design),
          getColorLabel(design),
          design.plannedUnits ?? design.units ?? 0,
          design.actualUnits ?? '',
          DESIGN_STATUS_OPTIONS.find((option) => option.value === getDesignStatus(design))?.label ||
            getDesignStatus(design),
          item.name,
          item.clothType,
          item.metersPerUnit,
          getItemConsumption(item, design.units || 0),
        ])
      )
    )

    exportToCsv(
      'volume-stock-report.csv',
      ['Volume', 'Design Code', 'Color Code', 'Planned Units', 'Actual Units', 'Status', 'Item', 'Cloth Type', 'Meters/Unit', 'Total Meters'],
      rows
    )
  }

  const handleExportPurchases = () => {
    exportToCsv(
      'purchase-report.csv',
      ['Batch Serial', 'Date', 'Material', 'Vendor', 'Quantity', 'Unit', 'Unit Price (PKR)', 'Total (PKR)', 'Status'],
      purchases.map((purchase) => [
        purchase.batchSerial,
        purchase.date,
        purchase.materialType,
        purchase.vendor,
        purchase.quantity,
        purchase.unit,
        purchase.unitPrice,
        purchase.totalPrice,
        PURCHASE_STATUS_LABELS[purchase.status],
      ])
    )
  }

  if (canExportVolumes) {
    const totalItems = finishedGoodsStock.reduce(
      (sum, volume) =>
        sum + volume.designs.reduce((designSum, design) => designSum + (design.items?.length || 0), 0),
      0
    )

    return (
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-charcoal">Volume Stock Report</h3>
            <p className="text-sm text-muted">
              All volumes, design codes, items, and process status
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportVolumes}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Total Volumes</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">{finishedGoodsStock.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Design Codes</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">
              {finishedGoodsStock.reduce((sum, volume) => sum + volume.designs.length, 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Total Items</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-accent">{totalItems}</p>
          </div>
        </div>

        <div className="space-y-4">
          {finishedGoodsStock.map((volume) => (
            <div key={volume.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border bg-cream/30 px-6 py-4">
                <h4 className="text-base font-semibold text-charcoal">{volume.name}</h4>
                <p className="text-xs text-muted">{volume.designs.length} design codes</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-cream/50">
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Design</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Color</th>
                      <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Planned</th>
                      <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Actual</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Fabric Reserve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volume.designs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-6 text-center text-sm text-muted">No designs in this volume.</td>
                      </tr>
                    ) : (
                      volume.designs.map((design) => (
                        <tr key={design.id} className="border-b border-border/50 last:border-0 hover:bg-cream/30">
                          <td className="px-6 py-4 text-sm font-medium text-charcoal">{getDesignLabel(design)}</td>
                          <td className="px-6 py-4 text-sm text-charcoal">{getColorLabel(design)}</td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal">
                            {(design.plannedUnits ?? design.units ?? 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-accent">
                            {design.actualUnits != null ? design.actualUnits.toLocaleString() : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted capitalize">
                            {getDesignStatus(design)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            {(design.items || []).map((item) => item.name).join(', ') || '—'}
                          </td>
                          <td className="px-6 py-4">
                            {Object.entries(
                              aggregateConsumptionByCloth(design.items || [], design.units || 0)
                            ).map(([clothType, meters]) => (
                              <span
                                key={clothType}
                                className="mr-2 inline-flex rounded-md border border-border bg-cream/60 px-2 py-0.5 text-[10px] font-medium text-charcoal"
                              >
                                {clothType}: {meters.toLocaleString()} m
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-cream/50 px-6 py-4 text-sm text-muted">
          {production.length} production runs logged across all volumes.
        </div>
      </div>
    )
  }

  if (canExportPurchases) {
    const grandTotal = purchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0)
    const pendingCount = purchases.filter((purchase) => purchase.status === 'in_progress').length

    return (
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-charcoal">Purchase Report</h3>
            <p className="text-sm text-muted">All purchase orders and their delivery status</p>
          </div>
          <button
            type="button"
            onClick={handleExportPurchases}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Total Purchases</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">{purchases.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">In Progress</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-gold-light/5 p-6 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-gold uppercase">Total Spend</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">{formatPKR(grandTotal)}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Batch</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Material</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Vendor</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Qty</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Total</th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold tracking-wider text-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-border/50 last:border-0 hover:bg-cream/30">
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{purchase.batchSerial}</td>
                    <td className="px-6 py-4 text-sm text-muted">{purchase.date}</td>
                    <td className="px-6 py-4 text-sm text-charcoal">{purchase.materialType}</td>
                    <td className="px-6 py-4 text-sm text-charcoal">{purchase.vendor}</td>
                    <td className="px-6 py-4 text-right text-sm text-charcoal">
                      {purchase.quantity.toLocaleString()} {purchase.unit}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal">
                      {formatPKR(purchase.totalPrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        purchase.status === 'complete'
                          ? 'bg-emerald-accent/10 text-emerald-accent'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {PURCHASE_STATUS_LABELS[purchase.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <p className="text-sm text-muted">Reports are not available for the current role.</p>
    </div>
  )
}
