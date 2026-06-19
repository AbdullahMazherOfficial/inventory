import { useRef, useState } from 'react'
import { Download, Upload, FileSpreadsheet } from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  canExportPurchasesReport,
  canExportVolumesReport,
  canExportProcessReport,
  canViewProductionDetailsReport,
  canImportProductionDetails,
  canViewAllReports,
  exportToCsv,
  formatPKR,
  getDesignLabel,
  getDesignColorSummary,
  aggregateConsumptionByCloth,
  getItemConsumption,
  getDesignStatus,
  designRequiresDyeing,
  PURCHASE_STATUS_LABELS,
  DESIGN_STATUS_OPTIONS,
  buildProductionDetailRows,
  buildProcessReportRows,
  parseProductionDetailImport,
  PRODUCTION_DETAIL_HEADERS,
} from '../utils/inventoryHelpers'

function ExportButton({ onClick, label = 'Export CSV' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  )
}

function VolumeStockSection({ finishedGoodsStock, production, onExport }) {
  const totalItems = finishedGoodsStock.reduce(
    (sum, volume) =>
      sum + volume.designs.reduce((designSum, design) => designSum + (design.items?.length || 0), 0),
    0
  )

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-charcoal">Volume Stock Report</h3>
          <p className="text-sm text-muted">All volumes, design codes, items, and process status</p>
        </div>
        <ExportButton onClick={onExport} />
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
                        <td className="px-6 py-4 text-sm text-charcoal">{getDesignColorSummary(design)}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal">
                          {(design.plannedUnits ?? design.units ?? 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-accent">
                          {design.actualUnits != null ? design.actualUnits.toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted capitalize">{getDesignStatus(design)}</td>
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
    </section>
  )
}

function PurchaseReportSection({ purchases, onExport }) {
  const grandTotal = purchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0)
  const pendingCount = purchases.filter((purchase) => purchase.status === 'in_progress').length

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-charcoal">Purchase Report</h3>
          <p className="text-sm text-muted">All purchase orders and their delivery status</p>
        </div>
        <ExportButton onClick={onExport} />
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
    </section>
  )
}

function ProcessReportSection({ productionVolumes, dyeingJobs, onExport }) {
  const volumeRows = buildProcessReportRows(productionVolumes, dyeingJobs)
  const globalTotalSent = volumeRows.reduce((s, row) => s + row.sentMeters, 0)
  const globalTotalWasted = volumeRows.reduce((s, row) => s + row.wastedMeters, 0)
  const globalPlannedUnits = volumeRows.reduce((s, row) => s + row.plannedUnits, 0)
  const globalActualUnits = volumeRows.reduce((s, row) => s + row.actualUnits, 0)

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-charcoal">Process Report</h3>
          <p className="text-sm text-muted">Manufacturing volumes, dyeing summaries, and production variances</p>
        </div>
        <ExportButton onClick={onExport} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Active Volumes</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">{volumeRows.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Total Fabric Dispatched</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">
            {globalTotalSent.toLocaleString(undefined, { maximumFractionDigits: 1 })} m
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-amber-600 uppercase">Total Fabric Loss</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">
            {globalTotalWasted.toLocaleString(undefined, { maximumFractionDigits: 1 })} m
            <span className="ml-2 text-sm font-normal text-muted">
              ({globalTotalSent > 0 ? ((globalTotalWasted / globalTotalSent) * 100).toFixed(2) : 0}%)
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-gold-light/5 p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-gold uppercase">Production Output</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">
            {globalActualUnits.toLocaleString()} <span className="text-sm font-normal text-muted">/ {globalPlannedUnits.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Volume</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Dyer</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Raw Sent</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Dyed Recv</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">Wastage</th>
                <th className="px-6 py-4 text-center text-[11px] font-semibold tracking-wider text-muted uppercase">Planned Units</th>
                <th className="px-6 py-4 text-center text-[11px] font-semibold tracking-wider text-muted uppercase">Actual Yield</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {volumeRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted">No processing volumes found.</td>
                </tr>
              ) : (
                volumeRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0 hover:bg-cream/30">
                    <td className="px-6 py-4 text-sm font-semibold text-charcoal">{row.volumeName}</td>
                    <td className="px-6 py-4 text-sm text-charcoal">{row.dyer}</td>
                    <td className="px-6 py-4 text-right text-sm text-charcoal">
                      {row.sentMeters.toLocaleString(undefined, { maximumFractionDigits: 1 })} m
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-charcoal">
                      {row.receivedMeters.toLocaleString(undefined, { maximumFractionDigits: 1 })} m
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium ${row.wastedMeters > 0 ? 'text-amber-600' : 'text-muted'}`}>
                      {row.wastedMeters > 0
                        ? `${row.wastedMeters.toLocaleString(undefined, { maximumFractionDigits: 1 })} m (${row.wastagePercentage.toFixed(1)}%)`
                        : '0 m'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-muted">{row.plannedUnits.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-emerald-accent">
                      {row.actualUnits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted max-w-xs">
                      {row.wastedMeters > 0 ? row.wastageDescription || 'No description logged' : 'Clean processing yield'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function ProductionDetailsSection({
  rows,
  importedRecords,
  canImport,
  onExport,
  onImport,
  onClearImport,
  importMessage,
  importError,
}) {
  const displayRows = importedRecords.length > 0
    ? importedRecords.map((record) => [
        record.volume,
        record.dyer,
        record.designCode,
        record.route,
        record.plannedUnits,
        record.actualUnits,
        record.balanceAtDyer,
        record.clothType,
        record.sentMeters,
        record.receivedMeters,
        record.remainingMeters,
        record.status,
      ])
    : rows

  const fileInputRef = useRef(null)

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-charcoal">Production Details Report</h3>
          <p className="text-sm text-muted">
            Volume, dyer, designs, planned/actual units, balance at dyer, and cloth breakdown
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onImport(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-charcoal shadow-sm hover:bg-cream"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </button>
              {importedRecords.length > 0 && (
                <button
                  type="button"
                  onClick={onClearImport}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-muted hover:bg-cream"
                >
                  Clear Import
                </button>
              )}
            </>
          )}
          <ExportButton onClick={onExport} />
        </div>
      </div>

      {importMessage && (
        <div className="rounded-xl border border-emerald-accent/30 bg-emerald-accent/5 px-4 py-3 text-sm text-emerald-accent">
          {importMessage}
        </div>
      )}
      {importError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {importError}
        </div>
      )}

      {importedRecords.length > 0 && (
        <div className="rounded-xl border border-indigo-accent/20 bg-indigo-accent/5 px-4 py-3 text-sm text-indigo-accent">
          Viewing {importedRecords.length} imported records. Clear import to return to live data.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                {PRODUCTION_DETAIL_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={PRODUCTION_DETAIL_HEADERS.length} className="px-6 py-8 text-center text-sm text-muted">
                    No production details available yet. Send volumes to dyeing or import a CSV.
                  </td>
                </tr>
              ) : (
                displayRows.map((row, index) => (
                  <tr key={`prod-row-${index}`} className="border-b border-border/50 last:border-0 hover:bg-cream/30">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-charcoal whitespace-nowrap">
                        {cell === '' || cell == null ? '—' : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default function Reports() {
  const {
    role,
    purchases,
    finishedGoodsStock,
    production,
    productionVolumes,
    dyeingJobs,
    importedProductionRecords,
    importProductionDetails,
    clearImportedProductionDetails,
  } = useInventory()

  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')

  const showVolumes = canExportVolumesReport(role)
  const showPurchases = canExportPurchasesReport(role)
  const showProcess = canExportProcessReport(role)
  const showProductionDetails = canViewProductionDetailsReport(role)
  const showAll = canViewAllReports(role)
  const canImport = canImportProductionDetails(role)

  const productionDetailRows = buildProductionDetailRows(
    finishedGoodsStock,
    dyeingJobs,
    productionVolumes
  )

  const handleExportVolumes = () => {
    const rows = finishedGoodsStock.flatMap((volume) =>
      volume.designs.flatMap((design) =>
        (design.items || []).map((item) => [
          volume.name,
          getDesignLabel(design),
          item.colorCode || '',
          designRequiresDyeing(design) ? 'Dyeing' : 'Raw Bypass',
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
      ['Volume', 'Design Code', 'Item Color', 'Route', 'Planned Units', 'Actual Units', 'Status', 'Item', 'Cloth Type', 'Meters/Unit', 'Total Meters'],
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

  const handleExportProcess = () => {
    const volumeRows = buildProcessReportRows(productionVolumes, dyeingJobs)
    exportToCsv(
      'process-report.csv',
      ['Volume', 'Dyer', 'Raw Sent (m)', 'Dyed Received (m)', 'Wastage (m)', 'Wastage (%)', 'Planned Units', 'Actual Units', 'Remarks'],
      volumeRows.map((row) => [
        row.volumeName,
        row.dyer,
        row.sentMeters,
        row.receivedMeters,
        row.wastedMeters,
        row.wastagePercentage.toFixed(2),
        row.plannedUnits,
        row.actualUnits,
        row.wastageDescription || '',
      ])
    )
  }

  const handleExportProductionDetails = () => {
    const rows = importedProductionRecords.length > 0
      ? importedProductionRecords.map((record) => [
          record.volume,
          record.dyer,
          record.designCode,
          record.route,
          record.plannedUnits,
          record.actualUnits,
          record.balanceAtDyer,
          record.clothType,
          record.sentMeters,
          record.receivedMeters,
          record.remainingMeters,
          record.status,
        ])
      : productionDetailRows

    exportToCsv('production-details-report.csv', PRODUCTION_DETAIL_HEADERS, rows)
  }

  const handleImportProductionDetails = (file) => {
    setImportError('')
    setImportMessage('')
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = parseProductionDetailImport(String(event.target?.result || ''))
      if (!result.success) {
        setImportError(result.error)
        return
      }
      const importResult = importProductionDetails(result.records)
      if (!importResult.success) {
        setImportError(importResult.error)
        return
      }
      setImportMessage(`Imported ${importResult.count} production detail records from ${file.name}.`)
    }
    reader.onerror = () => setImportError('Failed to read the CSV file.')
    reader.readAsText(file)
  }

  if (!showVolumes && !showPurchases && !showProcess && !showProductionDetails) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-sm text-muted">Reports are not available for the current role.</p>
      </div>
    )
  }

  if (showAll) {
    return (
      <div className="space-y-10 p-8">
        <div className="rounded-2xl border border-charcoal/10 bg-gradient-to-r from-charcoal to-indigo-accent p-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Super Admin Reports Hub</h3>
              <p className="mt-1 text-sm text-white/70">View and export all CSV reports from one place</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ExportButton onClick={handleExportVolumes} label="Volume CSV" />
              <ExportButton onClick={handleExportPurchases} label="Purchase CSV" />
              <ExportButton onClick={handleExportProcess} label="Process CSV" />
              <ExportButton onClick={handleExportProductionDetails} label="Production CSV" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { label: 'Volume Stock', count: finishedGoodsStock.length, icon: FileSpreadsheet },
            { label: 'Purchases', count: purchases.length, icon: FileSpreadsheet },
            { label: 'Process Volumes', count: productionVolumes.length, icon: FileSpreadsheet },
            { label: 'Production Rows', count: productionDetailRows.length, icon: FileSpreadsheet },
          ].map(({ label, count, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-medium uppercase">{label}</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-charcoal">{count}</p>
            </div>
          ))}
        </div>

        <VolumeStockSection
          finishedGoodsStock={finishedGoodsStock}
          production={production}
          onExport={handleExportVolumes}
        />
        <PurchaseReportSection purchases={purchases} onExport={handleExportPurchases} />
        <ProcessReportSection
          productionVolumes={productionVolumes}
          dyeingJobs={dyeingJobs}
          onExport={handleExportProcess}
        />
        <ProductionDetailsSection
          rows={productionDetailRows}
          importedRecords={importedProductionRecords}
          canImport={canImport}
          onExport={handleExportProductionDetails}
          onImport={handleImportProductionDetails}
          onClearImport={() => {
            clearImportedProductionDetails()
            setImportMessage('')
            setImportError('')
          }}
          importMessage={importMessage}
          importError={importError}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      {showVolumes && (
        <VolumeStockSection
          finishedGoodsStock={finishedGoodsStock}
          production={production}
          onExport={handleExportVolumes}
        />
      )}
      {showPurchases && (
        <PurchaseReportSection purchases={purchases} onExport={handleExportPurchases} />
      )}
      {showProcess && (
        <ProcessReportSection
          productionVolumes={productionVolumes}
          dyeingJobs={dyeingJobs}
          onExport={handleExportProcess}
        />
      )}
      {showProductionDetails && (
        <ProductionDetailsSection
          rows={productionDetailRows}
          importedRecords={importedProductionRecords}
          canImport={canImport}
          onExport={handleExportProductionDetails}
          onImport={handleImportProductionDetails}
          onClearImport={() => {
            clearImportedProductionDetails()
            setImportMessage('')
            setImportError('')
          }}
          importMessage={importMessage}
          importError={importError}
        />
      )}
    </div>
  )
}
