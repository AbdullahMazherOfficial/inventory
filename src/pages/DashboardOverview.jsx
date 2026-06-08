import {
  Package,
  Layers,
  DollarSign,
  Truck,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'

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

function StockAlertBar({ code, color, units, maxUnits, status }) {
  const percentage = Math.min((units / maxUnits) * 100, 100)
  const isLow = status === 'low'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-charcoal">{code}</span>
          <span className="text-muted">— {color}</span>
          {isLow && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Low Stock
            </span>
          )}
        </div>
        <span className="font-medium text-charcoal">{units} pcs</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-cream">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isLow
              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : 'bg-gradient-to-r from-emerald-accent to-emerald-light'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardOverview({ volumes, supplies, sales }) {
  const totalVolumes = volumes.length
  const totalPieces = volumes.reduce(
    (sum, vol) => sum + vol.designs.reduce((s, d) => s + d.units, 0),
    0
  )
  const monthlyExpense = supplies.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0)
  const pendingSupplies = supplies.filter((s) => s.quantity < 1000).length
  const pendingSales = sales.filter((s) => s.status === 'pending').length

  const topDesigns = volumes
    .flatMap((vol) =>
      vol.designs.map((d) => ({
        ...d,
        volumeName: vol.name,
      }))
    )
    .sort((a, b) => b.units - a.units)
    .slice(0, 4)

  const stockAlerts = volumes
    .flatMap((vol) => vol.designs)
    .filter((d) => d.units < 200)
    .map((d) => ({ ...d, status: 'low' }))

  const regularStock = volumes
    .flatMap((vol) => vol.designs)
    .filter((d) => d.units >= 200)
    .slice(0, 2)
    .map((d) => ({ ...d, status: 'ok' }))

  const displayStock = [...stockAlerts, ...regularStock].slice(0, 5)

  return (
    <div className="space-y-8 p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Layers}
          label="Total Volumes Active"
          value={totalVolumes}
          change="+2 this quarter"
          accent="emerald"
        />
        <MetricCard
          icon={Package}
          label="Total Pieces in Stock"
          value={totalPieces.toLocaleString()}
          change="+12.5%"
          accent="indigo"
        />
        <MetricCard
          icon={DollarSign}
          label="Monthly Material Expense"
          value={`$${monthlyExpense.toLocaleString()}`}
          change="+8.2%"
          accent="gold"
        />
        <MetricCard
          icon={Truck}
          label="Pending Supplies"
          value={pendingSupplies + pendingSales}
          accent="charcoal"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-charcoal">Stock Levels</h3>
              <p className="text-sm text-muted">Inventory health by design code</p>
            </div>
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-muted">
              Live
            </span>
          </div>
          <div className="space-y-5">
            {displayStock.map((item) => (
              <StockAlertBar
                key={item.id}
                code={item.code}
                color={item.color}
                units={item.units}
                maxUnits={500}
                status={item.status}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-charcoal">Top Selling Designs</h3>
              <p className="text-sm text-muted">Highest volume design codes</p>
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
                    {design.code} — {design.color}
                  </p>
                  <p className="text-xs text-muted">{design.volumeName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-charcoal">{design.units}</p>
                  <p className="text-[10px] text-muted">units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-r from-charcoal to-indigo-accent p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ramsha Factory — Production Summary</h3>
            <p className="mt-1 text-sm text-white/60">
              {totalVolumes} active volumes · {totalPieces.toLocaleString()} pieces in stock ·{' '}
              {sales.filter((s) => s.status === 'completed').length} completed sales this month
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gold-light">
                ${sales.reduce((s, sale) => s + sale.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-white/50">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-light">{pendingSales}</p>
              <p className="text-xs text-white/50">Pending Orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
