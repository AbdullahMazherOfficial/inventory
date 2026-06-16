import {
  Package,
  Layers,
  DollarSign,
  Truck,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  formatPKR,
  getDesignLabel,
  getColorLabel,
  getDesignTotalConsumption,
  getDesignStatus,
  isDesignInDyeing,
  DESIGN_STATUS_OPTIONS,
  DESIGN_STATUS_STYLES,
} from '../utils/inventoryHelpers'

function MetricCard({ icon: Icon, label, value, change, accent }) {
  const accentClasses = {
    emerald: 'from-emerald-accent/10 to-emerald-light/5 text-emerald-accent',
    gold: 'from-gold/10 to-gold-light/5 text-gold',
    indigo: 'from-indigo-accent/10 to-indigo-accent/5 text-indigo-accent',
    charcoal: 'from-charcoal/10 to-charcoal/5 text-charcoal',
  }

  return (
    <div className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:border-emerald-accent/20 hover:shadow-lg hover:shadow-emerald-accent/5">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl bg-gradient-to-br p-3 ${accentClasses[accent]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        {change && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-accent/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-accent">
            <ArrowUpRight className="h-3 w-3" />
            {change}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-charcoal">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}

function DesignStockBar({ design, volumeName, maxMeters }) {
  const meters = getDesignTotalConsumption(design.items || [], design.units || 0)
  const percentage = Math.min((meters / maxMeters) * 100, 100)
  const status = getDesignStatus(design)
  const statusLabel = isDesignInDyeing(design)
    ? 'In Dyeing'
    : DESIGN_STATUS_OPTIONS.find((option) => option.value === status)?.label || status

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-charcoal">{getDesignLabel(design)}</span>
          <span className="text-muted">· {getColorLabel(design)}</span>
          <span className="text-[10px] text-muted">({volumeName})</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DESIGN_STATUS_STYLES[status] || DESIGN_STATUS_STYLES.initiated}`}>
            {statusLabel}
          </span>
        </div>
        <span className="font-medium text-charcoal">{meters.toLocaleString()} m</span>
        <span className="text-[10px] text-muted">{(design.units || 0).toLocaleString()} units</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-cream">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-accent to-emerald-light transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardOverview() {
  const {
    finishedGoodsStock,
    purchases,
    rawMaterialStock,
  } = useInventory()

  const totalVolumes = finishedGoodsStock.length
  const totalFabricMeters = Object.values(rawMaterialStock).reduce((sum, balance) => sum + balance, 0)
  const purchaseSpend = purchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0)
  const pendingPurchases = purchases.filter((purchase) => purchase.status === 'in_progress').length
  const totalDesigns = finishedGoodsStock.reduce((sum, volume) => sum + volume.designs.length, 0)

  const topDesigns = finishedGoodsStock
    .flatMap((volume) =>
      volume.designs.map((design) => ({
        ...design,
        volumeName: volume.name,
        totalMeters: getDesignTotalConsumption(design.items || [], design.units || 0),
      }))
    )
    .sort((a, b) => b.totalMeters - a.totalMeters)
    .slice(0, 4)

  const allVolumeStock = finishedGoodsStock.flatMap((volume) =>
    volume.designs.map((design) => ({
      ...design,
      volumeName: volume.name,
    }))
  )

  const maxMeters = Math.max(
    ...allVolumeStock.map((design) => getDesignTotalConsumption(design.items || [], design.units || 0)),
    10
  )

  return (
    <div className="space-y-8 p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Layers}
          label="Total Volumes Active"
          value={totalVolumes}
          change={`${totalDesigns} designs`}
          accent="emerald"
        />
        <MetricCard
          icon={Package}
          label="Total Fabric in Stock"
          value={`${totalFabricMeters.toLocaleString()} m`}
          change={`${Object.keys(rawMaterialStock).length} fabric types`}
          accent="indigo"
        />
        <MetricCard
          icon={DollarSign}
          label="Purchase Spend"
          value={formatPKR(purchaseSpend)}
          change={`${purchases.length} orders`}
          accent="gold"
        />
        <MetricCard
          icon={Truck}
          label="Alerts & Pending"
          value={pendingPurchases}
          change={pendingPurchases === 1 ? 'purchase in progress' : 'purchases in progress'}
          accent="charcoal"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-charcoal">Stock Levels</h3>
              <p className="text-sm text-muted">All volume design stock levels</p>
            </div>
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-muted">
              Live
            </span>
          </div>
          <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1">
            {allVolumeStock.length === 0 ? (
              <p className="text-sm text-muted">No designs in stock yet.</p>
            ) : (
              allVolumeStock.map((design) => (
                <DesignStockBar
                  key={design.id}
                  design={design}
                  volumeName={design.volumeName}
                  maxMeters={maxMeters}
                />
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-charcoal">Top Selling Designs</h3>
              <p className="text-sm text-muted">Highest fabric consumption design codes</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-accent" strokeWidth={1.5} />
          </div>
          <div className="space-y-4">
            {topDesigns.map((design, idx) => (
              <div
                key={design.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-cream/50 p-4 transition-colors hover:border-emerald-accent/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-charcoal to-indigo-accent text-sm font-bold text-white">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">
                    {getDesignLabel(design)} · {getColorLabel(design)}
                  </p>
                  <p className="text-xs text-muted">{design.volumeName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-charcoal">{design.totalMeters} m</p>
                  <p className="text-[10px] text-muted">reserved</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-r from-charcoal to-indigo-accent p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ramsha Factory — Stock Summary</h3>
            <p className="mt-1 text-sm text-white/60">
              {totalVolumes} active volumes · {totalFabricMeters.toLocaleString()} m fabric in stock ·{' '}
              {totalDesigns} designs in pipeline
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gold-light">{formatPKR(purchaseSpend)}</p>
              <p className="text-xs text-white/50">Total Purchase Spend</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-light">{pendingPurchases}</p>
              <p className="text-xs text-white/50">Pending Purchases</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
