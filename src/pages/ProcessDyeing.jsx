import { useMemo, useState } from 'react'
import {
  Droplets,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  X,
  Plus,
  AlertTriangle,
  TrendingDown,
  ClipboardList,
} from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import {
  canWriteProcess,
  getDesignStatus,
  isDesignInitiated,
  isDesignInDyeing,
  getDesignLabel,
  getColorLabel,
  getDesignClothTotals,
  mergeClothTotals,
  sortClothTotals,
  DESIGN_STATUS_STYLES,
  DESIGN_STATUS_OPTIONS,
  getAssignedClothForDesign,
  computeActualUnitsForDesign,
  computeDesignClothWastage,
} from '../utils/inventoryHelpers'

function StatusBadge({ design }) {
  const status = getDesignStatus(design)
  const label = DESIGN_STATUS_OPTIONS.find((o) => o.value === status)?.label || status
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${DESIGN_STATUS_STYLES[status] || DESIGN_STATUS_STYLES.initiated}`}
    >
      {isDesignInDyeing(design) ? 'In Dyeing' : label}
    </span>
  )
}

function ClothTags({ totals }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sortClothTotals(totals).map(([cloth, meters]) => (
        <span
          key={cloth}
          className="inline-flex rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-charcoal"
        >
          {cloth}: {meters.toLocaleString()} m
        </span>
      ))}
    </div>
  )
}

function ReceiveLotModal({ job, onSave, onClose }) {
  const [lotNumber, setLotNumber] = useState('')
  const [clothType, setClothType] = useState(
    sortClothTotals(job.plannedClothTotals)[0]?.[0] || ''
  )
  const [receivedMeters, setReceivedMeters] = useState('')
  const [assignments, setAssignments] = useState(() =>
    job.designs.map((d) => ({ designId: d.designId, assignedMeters: '' }))
  )
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = onSave({
      lotNumber,
      clothType,
      receivedMeters: parseFloat(receivedMeters) || 0,
      assignments: assignments.map((a) => ({
        designId: a.designId,
        assignedMeters: parseFloat(a.assignedMeters) || 0,
      })),
    })
    if (result?.success === false) {
      setError(result.error)
      return
    }
    onClose()
  }

  const assignedSum = assignments.reduce(
    (s, a) => s + (parseFloat(a.assignedMeters) || 0),
    0
  )
  const received = parseFloat(receivedMeters) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">Receive Dye Lot</h3>
            <p className="mt-1 text-sm text-muted">
              Enter lot number, received meters, and assign to design codes
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-cream">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">
                Lot Number
              </label>
              <input
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value.toUpperCase())}
                placeholder="LOT-PL-6211-A"
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-indigo-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal uppercase">
                Cloth Type
              </label>
              <select
                value={clothType}
                onChange={(e) => setClothType(e.target.value)}
                className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-indigo-accent focus:outline-none"
              >
                {sortClothTotals(job.plannedClothTotals).map(([type]) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal uppercase">
              Received Meters
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={receivedMeters}
              onChange={(e) => setReceivedMeters(e.target.value)}
              placeholder="Actual meters returned from dye house"
              className="w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm focus:border-indigo-accent focus:outline-none"
            />
            {clothType && job.plannedClothTotals[clothType] && (
              <p className="mt-1 text-xs text-muted">
                Planned sent: {job.plannedClothTotals[clothType].toLocaleString()} m
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-cream/30 p-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
              Assign to Design Codes
            </p>
            <div className="space-y-3">
              {job.designs.map((entry, index) => {
                const plannedForCloth = entry.clothTotals[clothType] || 0
                return (
                  <div
                    key={entry.designId}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="min-w-[100px]">
                      <p className="text-sm font-semibold text-charcoal">
                        {entry.designCode} · {entry.colorCode}
                      </p>
                      <p className="text-[10px] text-muted">
                        Planned: {plannedForCloth.toLocaleString()} m
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={assignments[index].assignedMeters}
                      onChange={(e) => {
                        const next = [...assignments]
                        next[index] = { ...next[index], assignedMeters: e.target.value }
                        setAssignments(next)
                      }}
                      placeholder="Assign meters"
                      className="ml-auto w-36 rounded-xl border border-border bg-cream px-3 py-2 text-sm focus:border-indigo-accent focus:outline-none"
                    />
                  </div>
                )
              })}
            </div>
            {received > 0 && (
              <p className="mt-3 text-xs text-muted">
                Assigned: {assignedSum.toLocaleString()} m / Received: {received.toLocaleString()} m
                {assignedSum < received && (
                  <span className="ml-1 text-amber-600">
                    ({(received - assignedSum).toLocaleString()} m unassigned)
                  </span>
                )}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-accent to-charcoal py-2.5 text-sm font-semibold text-white shadow-md"
            >
              Record Lot
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ActiveDyeingJobCard({ job, volumeDesigns, canWrite, onReceiveLot, onComplete }) {
  const [showLotModal, setShowLotModal] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const liveOutcomes = useMemo(
    () =>
      job.designs.map((entry) => {
        const design = volumeDesigns.find((d) => d.id === entry.designId)
        const assigned = getAssignedClothForDesign(job, entry.designId)
        const actualUnits = design ? computeActualUnitsForDesign(design, assigned) : 0
        const wastage = design ? computeDesignClothWastage(design, assigned) : {}
        return {
          ...entry,
          assigned,
          actualUnits,
          wastage,
          varianceUnits: actualUnits - entry.plannedUnits,
        }
      }),
    [job, volumeDesigns]
  )

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-indigo-accent/30 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-indigo-accent/20 bg-indigo-accent/5 px-5 py-4">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-indigo-accent" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted" />
            )}
            <div>
              <span className="inline-flex rounded-lg bg-indigo-accent px-2.5 py-1 text-xs font-semibold text-white">
                {job.batchSerial}
              </span>
              <p className="mt-1 text-sm font-semibold text-charcoal">{job.volumeName}</p>
              <p className="text-xs text-muted">Sent {job.sentAt} · {job.designs.length} designs</p>
            </div>
          </button>
          {canWrite && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLotModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-accent/30 bg-surface px-3 py-2 text-xs font-semibold text-indigo-accent hover:bg-indigo-accent/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Receive Lot
              </button>
              <button
                type="button"
                onClick={() => onComplete(job.id)}
                disabled={!job.lots?.length}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-accent px-3 py-2 text-xs font-semibold text-white shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete Dyeing
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div className="space-y-5 p-5">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                Planned Fabric Sent
              </p>
              <ClothTags totals={job.plannedClothTotals} />
            </div>

            {job.lots?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                  Received Lots
                </p>
                <div className="space-y-2">
                  {job.lots.map((lot) => (
                    <div
                      key={lot.id}
                      className="rounded-xl border border-border bg-cream/40 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-charcoal">{lot.lotNumber}</span>
                        <span className="text-sm font-bold text-indigo-accent">
                          {lot.receivedMeters.toLocaleString()} m · {lot.clothType}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {lot.assignments.map((a) => {
                          const design = job.designs.find((d) => d.designId === a.designId)
                          return (
                            <span
                              key={a.designId}
                              className="rounded-md bg-surface px-2 py-0.5 text-[10px] text-muted"
                            >
                              {design?.designCode}: {a.assignedMeters.toLocaleString()} m
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                Live Production Estimate
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {liveOutcomes.map((outcome) => (
                  <div
                    key={outcome.designId}
                    className="rounded-xl border border-border bg-gradient-to-br from-surface to-cream/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-charcoal">
                        {outcome.designCode} · {outcome.colorCode}
                      </p>
                      {outcome.varianceUnits !== 0 && (
                        <span
                          className={`text-xs font-bold ${outcome.varianceUnits < 0 ? 'text-red-500' : 'text-emerald-accent'}`}
                        >
                          {outcome.varianceUnits > 0 ? '+' : ''}
                          {outcome.varianceUnits} units
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg bg-cream/60 px-2 py-2">
                        <p className="text-[10px] text-muted uppercase">Planned</p>
                        <p className="text-lg font-bold text-charcoal">
                          {outcome.plannedUnits.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg bg-indigo-accent/10 px-2 py-2">
                        <p className="text-[10px] text-indigo-accent uppercase">Actual</p>
                        <p className="text-lg font-bold text-indigo-accent">
                          {outcome.actualUnits.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showLotModal && (
        <ReceiveLotModal
          job={job}
          onSave={(form) => onReceiveLot(job.id, form)}
          onClose={() => setShowLotModal(false)}
        />
      )}
    </>
  )
}

function CompletedJobCard({ job }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 border-b border-border bg-cream/30 px-5 py-4 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-emerald-accent" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted" />
        )}
        <div className="flex-1">
          <span className="text-xs font-semibold text-emerald-accent">{job.batchSerial}</span>
          <p className="text-sm font-semibold text-charcoal">{job.volumeName}</p>
          <p className="text-xs text-muted">
            Completed {job.completedAt} · Loss:{' '}
            {job.wastageSummary?.totalLostMeters?.toLocaleString() || 0} m
          </p>
        </div>
      </button>

      {expanded && job.designOutcomes && (
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-800 uppercase">Process Wastage</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {sortClothTotals(job.wastageSummary?.byCloth).map(([cloth, data]) => (
                <div key={cloth} className="rounded-lg bg-surface px-3 py-2 text-sm">
                  <p className="font-medium text-charcoal">{cloth}</p>
                  <p className="text-xs text-muted">
                    Lost {data.lostMeters.toLocaleString()} m ({data.lossPercent.toFixed(1)}%)
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-bold text-charcoal">
              Total meters lost: {job.wastageSummary?.totalLostMeters?.toLocaleString()} m
            </p>
          </div>

          {job.designOutcomes.map((outcome) => (
            <div
              key={outcome.designId}
              className="rounded-xl border border-border bg-cream/30 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-charcoal">
                  {outcome.designCode} · {outcome.colorCode}
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    outcome.varianceUnits < 0
                      ? 'bg-red-50 text-red-600'
                      : 'bg-emerald-accent/10 text-emerald-accent'
                  }`}
                >
                  {outcome.varianceUnits > 0 ? '+' : ''}
                  {outcome.varianceUnits} units ({outcome.variancePercent.toFixed(1)}%)
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <span>
                  Planned: <strong>{outcome.plannedUnits.toLocaleString()}</strong>
                </span>
                <span>
                  Actual: <strong className="text-emerald-accent">{outcome.actualUnits.toLocaleString()}</strong>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sortClothTotals(outcome.wastageByCloth).map(([cloth, w]) => (
                  <span key={cloth} className="text-[10px] text-muted">
                    {cloth}: −{w.lostMeters.toLocaleString()} m ({w.lossPercent.toFixed(1)}%)
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProcessDyeing() {
  const {
    role,
    finishedGoodsStock,
    dyeingJobs,
    sendVolumeToDyeing,
    receiveDyeLot,
    completeDyeingJob,
  } = useInventory()

  const canWrite = canWriteProcess(role)
  const [expandedVolumes, setExpandedVolumes] = useState(() =>
    finishedGoodsStock.map((v) => v.id)
  )
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState('')

  const activeJobs = dyeingJobs.filter((j) => j.status === 'in_dyeing')
  const completedJobs = dyeingJobs.filter((j) => j.status === 'completed')

  const readyVolumes = useMemo(
    () =>
      finishedGoodsStock
        .map((volume) => ({
          ...volume,
          eligibleDesigns: volume.designs.filter(isDesignInitiated),
        }))
        .filter((v) => v.eligibleDesigns.length > 0),
    [finishedGoodsStock]
  )

  const handleSendToDyeing = (volumeId) => {
    setError('')
    const result = sendVolumeToDyeing(volumeId)
    if (result.success === false) {
      setError(result.error)
      return
    }
    setFeedback({
      type: 'success',
      message: `Volume sent to dyeing — batch ${result.job.batchSerial}`,
    })
  }

  const handleComplete = (jobId) => {
    setError('')
    const result = completeDyeingJob(jobId)
    if (result.success === false) {
      setError(result.error)
      return
    }
    setFeedback({
      type: 'success',
      message: `Dyeing completed. Total loss: ${result.wastageSummary.totalLostMeters.toLocaleString()} m`,
    })
  }

  return (
    <div className="space-y-6 p-8">
      {feedback && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-accent/30 bg-emerald-accent/5 px-5 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-accent" />
          <p className="flex-1 text-sm text-charcoal">{feedback.message}</p>
          <button type="button" onClick={() => setFeedback(null)} className="text-muted hover:text-charcoal">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-medium text-muted uppercase">Ready Volumes</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">{readyVolumes.length}</p>
        </div>
        <div className="rounded-2xl border border-indigo-accent/20 bg-indigo-accent/5 p-5">
          <p className="text-xs font-medium text-indigo-accent uppercase">In Dyeing</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">{activeJobs.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-medium text-muted uppercase">Completed Jobs</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-accent">{completedJobs.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-medium text-muted uppercase">Initiated Designs</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">
            {finishedGoodsStock.reduce(
              (sum, v) => sum + v.designs.filter((d) => getDesignStatus(d) === 'initiated').length,
              0
            )}
          </p>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-indigo-accent" />
            <h3 className="text-base font-semibold text-charcoal">Active Dyeing Jobs</h3>
          </div>
          {activeJobs.map((job) => {
            const volume = finishedGoodsStock.find((v) => v.id === job.volumeId)
            return (
              <ActiveDyeingJobCard
                key={job.id}
                job={job}
                volumeDesigns={volume?.designs || []}
                canWrite={canWrite}
                onReceiveLot={receiveDyeLot}
                onComplete={handleComplete}
              />
            )
          })}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-emerald-accent" />
          <div>
            <h3 className="text-base font-semibold text-charcoal">Initiated Designs — Ready for Dyeing</h3>
            <p className="text-sm text-muted">
              Select a volume to send all initiated designs to the dyeing floor
            </p>
          </div>
        </div>

        {finishedGoodsStock.map((volume) => {
          const isExpanded = expandedVolumes.includes(volume.id)
          const eligible = volume.designs.filter(isDesignInitiated)
          const inDyeing = volume.designs.filter(isDesignInDyeing)
          const hasActiveJob = activeJobs.some((j) => j.volumeId === volume.id)
          const eligibleCloth = mergeClothTotals(...eligible.map(getDesignClothTotals))

          return (
            <div
              key={volume.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border bg-cream/30 px-5 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedVolumes((prev) =>
                      prev.includes(volume.id)
                        ? prev.filter((id) => id !== volume.id)
                        : [...prev, volume.id]
                    )
                  }
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-emerald-accent" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted" />
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal">{volume.name}</h4>
                    <p className="text-xs text-muted">
                      {eligible.length} ready · {inDyeing.length} in dyeing ·{' '}
                      {volume.designs.filter((d) => getDesignStatus(d) === 'completed').length}{' '}
                      completed
                    </p>
                  </div>
                </button>
                {canWrite && eligible.length > 0 && !hasActiveJob && (
                  <button
                    type="button"
                    onClick={() => handleSendToDyeing(volume.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-accent to-charcoal px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg"
                  >
                    <Droplets className="h-4 w-4" />
                    Send to Dyeing
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                {hasActiveJob && (
                  <span className="rounded-full bg-indigo-accent/10 px-3 py-1 text-xs font-semibold text-indigo-accent">
                    In Dyeing
                  </span>
                )}
              </div>

              {isExpanded && (
                <div className="p-5">
                  {eligible.length > 0 && (
                    <div className="mb-4 rounded-xl border border-indigo-accent/20 bg-indigo-accent/5 px-4 py-3">
                      <p className="text-xs font-semibold text-indigo-accent uppercase">
                        Fabric to send ({eligible.length} designs)
                      </p>
                      <div className="mt-2">
                        <ClothTags totals={eligibleCloth} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {volume.designs.map((design) => {
                      const clothTotals = getDesignClothTotals(design)
                      const status = getDesignStatus(design)

                      return (
                        <div
                          key={design.id}
                          className={`rounded-xl border px-4 py-3 ${
                            isDesignInDyeing(design)
                              ? 'border-indigo-accent/30 bg-indigo-accent/5'
                              : status === 'completed'
                                ? 'border-emerald-accent/20 bg-emerald-accent/5'
                                : 'border-border bg-cream/30'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-charcoal px-2 py-1 text-xs font-semibold text-white">
                                {getDesignLabel(design)}
                              </span>
                              <span className="text-sm font-medium text-charcoal">
                                {getColorLabel(design)}
                              </span>
                              <StatusBadge design={design} />
                            </div>
                            <div className="text-right text-sm">
                              {status === 'completed' ? (
                                <p>
                                  <span className="text-muted">Planned </span>
                                  <strong>{(design.plannedUnits ?? design.units)?.toLocaleString()}</strong>
                                  <span className="mx-1 text-muted">→</span>
                                  <span className="text-muted">Actual </span>
                                  <strong className="text-emerald-accent">
                                    {design.actualUnits?.toLocaleString()}
                                  </strong>
                                </p>
                              ) : (
                                <p className="font-semibold text-charcoal">
                                  {(design.plannedUnits ?? design.units)?.toLocaleString()} units planned
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-2">
                            <ClothTags totals={clothTotals} />
                          </div>
                          {design.dyeingOutcome && (
                            <p className="mt-2 text-xs text-red-500">
                              Variance: {design.dyeingOutcome.varianceUnits} units (
                              {design.dyeingOutcome.variancePercent.toFixed(1)}%)
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>

      {completedJobs.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-charcoal">Completed Dyeing — Loss Reports</h3>
          {completedJobs.map((job) => (
            <CompletedJobCard key={job.id} job={job} />
          ))}
        </section>
      )}
    </div>
  )
}
