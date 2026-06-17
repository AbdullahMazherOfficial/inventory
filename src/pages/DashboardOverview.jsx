import {
  Package,
  Layers,
  DollarSign,
  TrendingDown,
  Factory,
  ArrowUpRight,
} from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  formatPKR,
  getDesignLabel,
  getDesignColorSummary,
  getDesignTotalConsumption,
  getDesignStatus,
  getDashboardMetrics,
  DESIGN_STATUS_OPTIONS,
  DESIGN_STATUS_STYLES,
} from '../utils/inventoryHelpers'

function MetricCard({ icon: Icon, label, value, change, accent }) {
  const accentClasses = {
    emerald: 'from-emerald-accent/10 to-emerald-light/5 text-emerald-accent',
    gold: 'from-gold/10 to-gold-light/5 text-gold',
    indigo: 'from-indigo-accent/10 to-indigo-accent/5 text-indigo-accent',
    charcoal: 'from-charcoal/10 to-charcoal/5 text-charcoal',
    amber: 'from-amber-100 to-amber-50 text-amber-600',
  }

  return (
    <div className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:border-emerald-accent/20 hover:shadow-lg">
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

export default function DashboardOverview() {
  const { finishedGoodsStock, purchases, availableStock, dyeingJobs, productionVolumes } =
    useInventory()

  const metrics = getDashboardMetrics(
    purchases,
    dyeingJobs,
    productionVolumes,
    finishedGoodsStock
  )

  const pendingPurchases = purchases.filter((p) => p.status === 'in_progress').length

  const productionDesigns = productionVolumes.flatMap((pv) =>
    (pv.designOutcomes || []).map((o) => ({ ...o, volumeName: pv.volumeName }))
  )

  return (
    <div className="space-y-8 p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Total Purchase Spend"
          value={formatPKR(metrics.totalPurchaseSpend)}
          change={`${metrics.totalPurchasedMeters.toLocaleString()} m purchased`}
          accent="gold"
        />
        <MetricCard
          icon={Package}
          label="Available Raw Stock"
          value={`${Object.values(availableStock).reduce((s, v) => s + v, 0).toLocaleString()} m`}
          change={`${Object.keys(availableStock).length} fabric types`}
          accent="indigo"
        />
        <MetricCard
          icon={TrendingDown}
          label="Dyeing Wastage"
          value={`${metrics.totalWastageMeters.toLocaleString()} m`}
          change={metrics.wastagePercent > 0 ? `${metrics.wastagePercent.toFixed(1)}% of sent` : 'No closed jobs yet'}
          accent="amber"
        />
        <MetricCard
          icon={Factory}
          label="Actual Units in Production"
          value={metrics.totalActualUnits.toLocaleString()}
          change={`${metrics.inProductionVolumes} volume(s) · planned ${metrics.totalPlannedUnits.toLocaleString()}`}
          accent="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-base font-semibold text-charcoal">Design Pipeline</h3>
          <p className="text-sm text-muted">{metrics.activeDesigns} designs across volumes</p>
          <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
            {finishedGoodsStock.flatMap((vol) =>
              vol.designs.map((design) => {
                const status = getDesignStatus(design)
                const label = DESIGN_STATUS_OPTIONS.find((o) => o.value === status)?.label || status
                return (
                  <div key={design.id} className="flex items-center justify-between rounded-xl border border-border bg-cream/30 px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium text-charcoal">{getDesignLabel(design)}</span>
                      <span className="ml-2 text-muted">{getDesignColorSummary(design)}</span>
                      <p className="text-[10px] text-muted">{vol.name}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DESIGN_STATUS_STYLES[status]}`}>
                      {label}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-base font-semibold text-charcoal">Production Output</h3>
          <p className="text-sm text-muted">Final actual units after dyeing closure</p>
          <div className="mt-4 space-y-3">
            {productionDesigns.length === 0 ? (
              <p className="text-sm text-muted">No designs in production yet. Close dyeing to move volumes here.</p>
            ) : (
              productionDesigns.map((o) => (
                <div key={o.designId} className="flex items-center justify-between rounded-xl border border-emerald-accent/20 bg-emerald-accent/5 px-4 py-3">
                  <div>
                    <p className="font-medium text-charcoal">{o.designCode}</p>
                    <p className="text-[10px] text-muted">{o.volumeName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-accent">{o.actualUnits.toLocaleString()} actual</p>
                    <p className="text-[10px] text-muted">{o.plannedUnits.toLocaleString()} planned</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-r from-charcoal to-indigo-accent p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Manufacturing Lifecycle Summary</h3>
            <p className="mt-1 text-sm text-white/60">
              Purchases → Dyeing (with wastage tracking) → Production (actual units)
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gold-light">{pendingPurchases}</p>
              <p className="text-xs text-white/50">Pending Purchases</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-light">
                {dyeingJobs.filter((j) => j.status === 'in_dyeing').length}
              </p>
              <p className="text-xs text-white/50">Active Dyeing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
