import { useMemo, useState } from 'react'
import {
  Droplets,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowRight,
  CheckCircle2,
  X,
  Plus,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  canWriteProcess,
  getDesignStatus,
  isDesignEligibleForDyeing,
  isDesignInDyeing,
  isDesignRawBypass,
  getDesignLabel,
  getDesignColorSummary,
  getDesignClothTotals,
  getDyeingSendTotals,
  sortClothTotals,
  DESIGN_STATUS_STYLES,
  DESIGN_STATUS_OPTIONS,
  getReceivedMetersByItem,
  computeDesignBottleneck,
  computeJobWastageSummary,
} from '../utils/inventoryHelpers'

function StatusBadge({ design }) {
  const status = getDesignStatus(design)
  let label = DESIGN_STATUS_OPTIONS.find((o) => o.value === status)?.label || status
  if (isDesignInDyeing(design)) label = 'In Dyeing'
  if (isDesignRawBypass(design) && status === 'initiated') label = 'Raw (No Dye)'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${DESIGN_STATUS_STYLES[status] || DESIGN_STATUS_STYLES.initiated}`}>
      {label}
    </span>
  )
}

function ClothTags({ totals }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sortClothTotals(totals).map(([cloth, meters]) => (
        <span key={cloth} className="inline-flex rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-charcoal">
          {cloth}: {meters.toLocaleString()} m
        </span>
      ))}
    </div>
  )
}

function WastageModal({ wastageSummary, onConfirm, onClose }) {
  const [description, setDescription] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-charcoal">Wastage Detected</h3>
        </div>
        <p className="text-sm text-muted">
          Total loss: <strong>{wastageSummary.totalLostMeters.toLocaleString()} m</strong> (
          {wastageSummary.overallLossPercent.toFixed(2)}%). Describe the reason before closing.
        </p>
        <div className="mt-3 space-y-1">
          {sortClothTotals(wastageSummary.byCloth).map(([cloth, data]) => (
            <p key={cloth} className="text-xs text-muted">
              {cloth}: −{data.lostMeters.toLocaleString()} m ({data.lossPercent.toFixed(1)}%)
            </p>
          ))}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description of wastage (e.g. shrinkage, dye house loss...)"
          rows={3}
          className="mt-4 w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm focus:border-indigo-accent focus:outline-none"
        />
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-muted hover:bg-cream">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(description)}
            disabled={!description.trim()}
            className="flex-1 rounded-xl bg-indigo-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Close & Move to Production
          </button>
        </div>
      </div>
    </div>
  )
}

function ReceiveLotModal({ job, volumeDesigns, onSave, onClose }) {
  const dyedDesigns = volumeDesigns.filter((d) =>
    job.designs.some((jd) => jd.designId === d.id)
  )
  const [lotNumber, setLotNumber] = useState('')
  const [clothType, setClothType] = useState(sortClothTotals(job.plannedClothTotals)[0]?.[0] || '')
  const [colorCode, setColorCode] = useState('')
  const [receivedMeters, setReceivedMeters] = useState('')
  const [designId, setDesignId] = useState(dyedDesigns[0]?.id || '')
  const [error, setError] = useState('')

  const selectedDesign = dyedDesigns.find((d) => d.id === designId)
  const matchingItems = selectedDesign
    ? (selectedDesign.items || []).filter(
        (i) => i.clothType === clothType && i.colorCode === colorCode.toUpperCase()
      )
    : []

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = onSave({
      lotNumber,
      clothType,
      colorCode: colorCode.toUpperCase(),
      receivedMeters: parseFloat(receivedMeters) || 0,
      designId,
    })
    if (result?.success === false) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">Receive Dye Lot</h3>
            <p className="mt-1 text-sm text-muted">One lot → one design. Auto-matches items by fabric & color.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-cream"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-charcoal">Lot Number</label>
            <input value={lotNumber} onChange={(e) => setLotNumber(e.target.value.toUpperCase())} placeholder="LOT-01" className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-charcoal">Fabric Type</label>
              <select value={clothType} onChange={(e) => setClothType(e.target.value)} className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm">
                {sortClothTotals(job.plannedClothTotals).map(([t]) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-charcoal">Color Code</label>
              <input value={colorCode} onChange={(e) => setColorCode(e.target.value.toUpperCase())} placeholder="J1" className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-charcoal">Received Meters</label>
            <input type="number" min="0" step="0.01" value={receivedMeters} onChange={(e) => setReceivedMeters(e.target.value)} className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-charcoal">Assign to Design</label>
            <select value={designId} onChange={(e) => setDesignId(e.target.value)} className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm">
              {dyedDesigns.map((d) => (
                <option key={d.id} value={d.id}>{getDesignLabel(d)} ({getDesignColorSummary(d)})</option>
              ))}
            </select>
          </div>
          {selectedDesign && colorCode && (
            <div className="rounded-xl bg-indigo-accent/5 px-4 py-3 text-xs text-indigo-accent">
              Auto-matches: {matchingItems.length > 0
                ? matchingItems.map((i) => `${i.name} (${i.clothType}/${i.colorCode})`).join(', ')
                : 'No items match this fabric/color — check values'}
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-indigo-accent py-2.5 text-sm font-semibold text-white">Record Lot</button>
        </form>
      </div>
    </div>
  )
}

function ActiveJobCard({ job, volumeDesigns, canWrite, onReceiveLot, onRequestClose }) {
  const [showLot, setShowLot] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const wastageLive = computeJobWastageSummary(job)

  const liveOutcomes = useMemo(
    () =>
      job.designs.map((entry) => {
        const design = volumeDesigns.find((d) => d.id === entry.designId)
        if (!design) return null
        const receivedByItem = getReceivedMetersByItem(job, entry.designId, design)
        const { actualUnits, itemBreakdown, leftoverScrap } = computeDesignBottleneck(design, receivedByItem)
        return { ...entry, actualUnits, itemBreakdown, leftoverScrap, varianceUnits: actualUnits - entry.plannedUnits }
      }).filter(Boolean),
    [job, volumeDesigns]
  )

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-indigo-accent/30 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-indigo-accent/20 bg-indigo-accent/5 px-5 py-4">
          <button type="button" onClick={() => setExpanded((e) => !e)} className="flex flex-1 items-center gap-3 text-left">
            {expanded ? <ChevronDown className="h-5 w-5 text-indigo-accent" /> : <ChevronRight className="h-5 w-5 text-muted" />}
            <div>
              <span className="inline-flex rounded-lg bg-indigo-accent px-2.5 py-1 text-xs font-semibold text-white">{job.batchSerial}</span>
              <p className="mt-1 text-sm font-semibold text-charcoal">{job.volumeName}</p>
              <p className="text-xs text-muted">Sent {job.sentAt} · Stock deducted: {Object.values(job.stockDeducted || {}).reduce((s, v) => s + v, 0).toLocaleString()} m</p>
            </div>
          </button>
          {canWrite && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowLot(true)} className="inline-flex items-center gap-1 rounded-xl border border-indigo-accent/30 px-3 py-2 text-xs font-semibold text-indigo-accent hover:bg-indigo-accent/5">
                <Plus className="h-3.5 w-3.5" /> Receive Lot
              </button>
              <button type="button" onClick={() => onRequestClose(job.id)} className="inline-flex items-center gap-1 rounded-xl bg-indigo-accent px-3 py-2 text-xs font-semibold text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Close Dyeing
              </button>
            </div>
          )}
        </div>
        {expanded && (
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">Fabric Sent to Dyeing</p>
              <ClothTags totals={job.stockDeducted} />
            </div>
            {job.lots?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted">Received Lots</p>
                <div className="space-y-2">
                  {job.lots.map((lot) => (
                    <div key={lot.id} className="rounded-xl border border-border bg-cream/40 px-4 py-3 text-sm">
                      <div className="flex justify-between">
                        <strong>{lot.lotNumber}</strong>
                        <span className="font-bold text-indigo-accent">{lot.receivedMeters.toLocaleString()} m</span>
                      </div>
                      <p className="text-xs text-muted">{lot.clothType}/{lot.colorCode} → Design {volumeDesigns.find((d) => d.id === lot.designId)?.designCode}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-lg font-semibold text-amber-700">
                  Live Balance: {wastageLive.totalLostMeters.toLocaleString()} m ({wastageLive.overallLossPercent.toFixed(2)}%)
                </p>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">Production Estimate (Bottleneck)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {liveOutcomes.map((o) => (
                  <div key={o.designId} className="rounded-xl border border-border bg-cream/30 p-4">
                    <p className="font-semibold text-charcoal">{o.designCode}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg bg-surface px-2 py-2">
                        <p className="text-[10px] text-muted">Planned</p>
                        <p className="text-lg font-bold">{o.plannedUnits.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg bg-indigo-accent/10 px-2 py-2">
                        <p className="text-[10px] text-indigo-accent">Actual</p>
                        <p className="text-lg font-bold text-indigo-accent">{o.actualUnits.toLocaleString()}</p>
                      </div>
                    </div>
                    {o.leftoverScrap?.length > 0 && (
                      <p className="mt-2 text-[10px] text-amber-600">
                        Scrap: {o.leftoverScrap.map((s) => `${s.itemName} ${s.leftoverMeters.toFixed(0)}m`).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {showLot && (
        <ReceiveLotModal job={job} volumeDesigns={volumeDesigns} onSave={(f) => onReceiveLot(job.id, f)} onClose={() => setShowLot(false)} />
      )}
    </>
  )
}

export default function ProcessDyeing() {
  const { role, finishedGoodsStock, dyeingJobs, availableStock, sendVolumeToDyeing, receiveDyeLot, closeDyeingAndMoveToProduction } = useInventory()
  const canWrite = canWriteProcess(role)
  const [expandedVolumes, setExpandedVolumes] = useState(() => finishedGoodsStock.map((v) => v.id))
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState('')
  const [wastageModal, setWastageModal] = useState(null)

  const activeJobs = dyeingJobs.filter((j) => j.status === 'in_dyeing')

  const handleSend = (volumeId) => {
    setError('')
    const result = sendVolumeToDyeing(volumeId)
    if (!result.success) { setError(result.error); return }
    setFeedback({ message: `Sent to dyeing — ${result.job.batchSerial}. Stock deducted.` })
  }

  const handleRequestClose = (jobId) => {
    const job = dyeingJobs.find((j) => j.id === jobId)
    const wastage = computeJobWastageSummary(job)
    if (wastage.totalLostMeters > 0) {
      setWastageModal({ jobId, wastageSummary: wastage })
      return
    }
    finalizeClose(jobId, '')
  }

  const finalizeClose = (jobId, description) => {
    setError('')
    const result = closeDyeingAndMoveToProduction(jobId, description)
    if (!result.success) { setError(result.error); return }
    setWastageModal(null)
    setFeedback({ message: `Dyeing closed. Volume moved to Production. Loss: ${result.wastageSummary?.totalLostMeters?.toLocaleString() || 0} m` })
  }

  return (
    <div className="space-y-6 p-8">
      {feedback && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-accent/30 bg-emerald-accent/5 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-accent" />
          <p className="flex-1 text-sm">{feedback.message}</p>
          <button type="button" onClick={() => setFeedback(null)}><X className="h-4 w-4 text-muted" /></button>
        </div>
      )}
      {error && error !== 'wastage_description_required' && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {activeJobs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2"><Droplets className="h-5 w-5 text-indigo-accent" /><h3 className="font-semibold text-charcoal">Active Dyeing</h3></div>
          {activeJobs.map((job) => {
            const volume = finishedGoodsStock.find((v) => v.id === job.volumeId)
            return (
              <ActiveJobCard key={job.id} job={job} volumeDesigns={volume?.designs || []} canWrite={canWrite} onReceiveLot={receiveDyeLot} onRequestClose={handleRequestClose} />
            )
          })}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-emerald-accent" />
          <div>
            <h3 className="font-semibold text-charcoal">Volumes</h3>
            <p className="text-sm text-muted">Move initiated dyeing designs to the dye floor — raw bypass designs stay untouched</p>
          </div>
        </div>

        {finishedGoodsStock.filter((v) => !v.inProduction).map((volume) => {
          const isExpanded = expandedVolumes.includes(volume.id)
          const dyeEligible = volume.designs.filter(isDesignEligibleForDyeing)
          const rawBypass = volume.designs.filter(isDesignRawBypass)
          const dyeTotals = getDyeingSendTotals(dyeEligible)
          const hasActive = activeJobs.some((j) => j.volumeId === volume.id)

          return (
            <div key={volume.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-cream/30 px-5 py-4">
                <button type="button" onClick={() => setExpandedVolumes((p) => p.includes(volume.id) ? p.filter((id) => id !== volume.id) : [...p, volume.id])} className="flex flex-1 items-center gap-3 text-left">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-emerald-accent" /> : <ChevronRight className="h-5 w-5 text-muted" />}
                  <div>
                    <h4 className="font-semibold text-charcoal">{volume.name}</h4>
                    <p className="text-xs text-muted">{dyeEligible.length} to dye · {rawBypass.length} raw bypass</p>
                  </div>
                </button>
                {canWrite && dyeEligible.length > 0 && !hasActive && (
                  <button type="button" onClick={() => handleSend(volume.id)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-accent to-charcoal px-4 py-2.5 text-xs font-semibold text-white shadow-md">
                    <Droplets className="h-4 w-4" /> Move to Dyeing <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                {hasActive && <span className="rounded-full bg-indigo-accent/10 px-3 py-1 text-xs font-semibold text-indigo-accent">In Dyeing</span>}
              </div>
              {isExpanded && (
                <div className="p-5 space-y-4">
                  {dyeEligible.length > 0 && (
                    <div className="rounded-xl border border-indigo-accent/20 bg-indigo-accent/5 px-4 py-3">
                      <p className="text-xs font-semibold text-indigo-accent uppercase">Will deduct on Move to Dyeing</p>
                      <div className="mt-2"><ClothTags totals={dyeTotals} /></div>
                    </div>
                  )}
                  {rawBypass.length > 0 && (
                    <div className="rounded-xl border border-emerald-accent/20 bg-emerald-accent/5 px-4 py-3">
                      <p className="text-xs font-semibold text-emerald-accent uppercase">Raw bypass — deducted at production</p>
                      <div className="mt-2"><ClothTags totals={mergeBypassTotals(rawBypass)} /></div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {volume.designs.map((design) => (
                      <div key={design.id} className={`rounded-xl border px-4 py-3 ${isDesignInDyeing(design) ? 'border-indigo-accent/30 bg-indigo-accent/5' : 'border-border bg-cream/30'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-charcoal px-2 py-1 text-xs font-semibold text-white">{getDesignLabel(design)}</span>
                            <StatusBadge design={design} />
                          </div>
                          <span className="text-sm font-semibold">{(design.plannedUnits ?? design.units)?.toLocaleString()} units</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(design.items || []).map((item) => (
                            <span key={item.id} className="rounded-md bg-surface px-2 py-0.5 text-[10px] text-muted">
                              {item.name}: {item.clothType}/{item.colorCode} · {item.metersPerUnit}m/u
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2 mb-3"><Layers className="h-4 w-4 text-muted" /><p className="text-xs font-semibold uppercase text-muted">Available Raw Stock</p></div>
        <ClothTags totals={availableStock} />
      </section>

      {wastageModal && (
        <WastageModal
          wastageSummary={wastageModal.wastageSummary}
          onConfirm={(desc) => finalizeClose(wastageModal.jobId, desc)}
          onClose={() => setWastageModal(null)}
        />
      )}
    </div>
  )
}

function mergeBypassTotals(designs) {
  const t = {}
  designs.forEach((d) => {
    Object.entries(getDesignClothTotals(d)).forEach(([k, v]) => { t[k] = (t[k] || 0) + v })
  })
  return t
}
