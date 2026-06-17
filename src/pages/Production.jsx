import { useState } from 'react'
import { Factory, ChevronDown, ChevronRight, TrendingDown, Package } from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import { sortClothTotals } from '../utils/inventoryHelpers'

export default function Production() {
  const { productionVolumes } = useInventory()
  const [expanded, setExpanded] = useState(() => productionVolumes.map((v) => v.id))

  if (productionVolumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <Factory className="h-12 w-12 text-muted/30" strokeWidth={1.5} />
        <h3 className="mt-4 text-lg font-semibold text-charcoal">No Volumes in Production</h3>
        <p className="mt-2 max-w-md text-sm text-muted">
          Close the dyeing process for a volume to move it here. Dyed and raw bypass designs will show their final actual produced units.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted">In Production</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">{productionVolumes.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-accent/20 bg-emerald-accent/5 p-5">
          <p className="text-xs font-medium uppercase text-emerald-accent">Total Actual Units</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">
            {productionVolumes.reduce(
              (s, v) => s + (v.designOutcomes || []).reduce((ds, o) => ds + (o.actualUnits || 0), 0),
              0
            ).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <p className="text-xs font-medium uppercase text-amber-700">Total Dyeing Loss</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">
            {productionVolumes.reduce((s, v) => s + (v.wastageSummary?.totalLostMeters || 0), 0).toLocaleString()} m
          </p>
        </div>
      </div>

      {productionVolumes.map((pv) => {
        const isOpen = expanded.includes(pv.id)
        return (
          <div key={pv.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <button
              type="button"
              onClick={() => setExpanded((p) => p.includes(pv.id) ? p.filter((id) => id !== pv.id) : [...p, pv.id])}
              className="flex w-full items-center gap-3 border-b border-border bg-cream/30 px-5 py-4 text-left"
            >
              {isOpen ? <ChevronDown className="h-5 w-5 text-emerald-accent" /> : <ChevronRight className="h-5 w-5 text-muted" />}
              <div className="flex-1">
                <h3 className="font-semibold text-charcoal">{pv.volumeName}</h3>
                <p className="text-xs text-muted">Moved {pv.movedAt} · {(pv.designOutcomes || []).length} designs</p>
              </div>
              <span className="rounded-full bg-emerald-accent/10 px-3 py-1 text-xs font-semibold text-emerald-accent">In Production</span>
            </button>

            {isOpen && (
              <div className="space-y-5 p-5">
                {pv.wastageSummary?.totalLostMeters > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold text-amber-800">Dyeing Wastage</p>
                    </div>
                    <p className="mt-2 text-sm text-charcoal">
                      {pv.wastageSummary.totalLostMeters.toLocaleString()} m lost ({pv.wastageSummary.overallLossPercent.toFixed(2)}%)
                    </p>
                    {pv.wastageDescription && (
                      <p className="mt-1 text-xs text-muted italic">"{pv.wastageDescription}"</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sortClothTotals(pv.wastageSummary.byCloth).map(([cloth, data]) => (
                        <span key={cloth} className="rounded-md bg-surface px-2 py-0.5 text-[10px] text-muted">
                          {cloth}: −{data.lostMeters.toLocaleString()} m
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(pv.rawStockDeductions || {}).length > 0 && (
                  <div className="rounded-xl border border-emerald-accent/20 bg-emerald-accent/5 p-4">
                    <p className="text-xs font-semibold uppercase text-emerald-accent">Raw Stock Deducted (Bypass Designs)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sortClothTotals(pv.rawStockDeductions).map(([cloth, m]) => (
                        <span key={cloth} className="text-sm font-medium text-charcoal">{cloth}: {m.toLocaleString()} m</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {(pv.designOutcomes || []).map((outcome) => (
                    <div key={outcome.designId} className="rounded-xl border border-border bg-gradient-to-br from-surface to-cream/30 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-accent" />
                          <span className="font-semibold text-charcoal">{outcome.designCode}</span>
                          {outcome.rawBypass && (
                            <span className="rounded-full bg-emerald-accent/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-accent">Raw Bypass</span>
                          )}
                        </div>
                        {outcome.varianceUnits !== 0 && (
                          <span className={`text-xs font-bold ${outcome.varianceUnits < 0 ? 'text-red-500' : 'text-emerald-accent'}`}>
                            {outcome.varianceUnits > 0 ? '+' : ''}{outcome.varianceUnits} units
                          </span>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                        <div className="rounded-lg bg-cream/60 px-3 py-3">
                          <p className="text-[10px] uppercase text-muted">Planned</p>
                          <p className="text-2xl font-bold text-charcoal">{outcome.plannedUnits.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-accent/10 px-3 py-3">
                          <p className="text-[10px] uppercase text-emerald-accent">Actual Produced</p>
                          <p className="text-2xl font-bold text-emerald-accent">{outcome.actualUnits.toLocaleString()}</p>
                        </div>
                      </div>
                      {outcome.itemBreakdown?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {outcome.itemBreakdown.map((item) => (
                            <p key={item.itemId} className="text-[10px] text-muted">
                              {item.itemName} ({item.clothType}/{item.colorCode}): {item.receivedMeters.toFixed(0)} m → {item.producibleUnits} units
                            </p>
                          ))}
                        </div>
                      )}
                      {outcome.leftoverScrap?.length > 0 && (
                        <p className="mt-2 text-[10px] text-amber-600">
                          Leftover scrap: {outcome.leftoverScrap.map((s) => `${s.itemName} ${s.leftoverMeters.toFixed(0)}m`).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
