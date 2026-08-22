'use client'

import React, { useState } from 'react'
import {
  AlertTriangle, PauseCircle, SkipForward, XCircle,
  CheckCircle2, ChevronDown, ChevronUp, RotateCcw,
  User, Clock, MessageSquare, ArrowRightCircle, ShieldAlert
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ActionType = 'ABANDONED' | 'PAUSED' | 'SKIPPED'
export type OutcomeType = 'PENDING' | 'OVERRIDDEN' | 'ACCEPTED' | 'ESCALATED'
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface DecisionRecord {
  id: string
  voyage_id: string
  action_type: ActionType
  target: string
  reason: string
  decided_by: string
  checkpoint_id?: string
  proposed_alternative?: string
  severity: SeverityLevel
  outcome: OutcomeType
  timestamp_utc: string
  override_by?: string
  override_reason?: string
  override_timestamp_utc?: string
}

// ---------------------------------------------------------------------------
// API helpers (calls the FastAPI backend)
// ---------------------------------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

async function apiLogDecision(voyageId: string, payload: object): Promise<DecisionRecord> {
  const res = await fetch(`${API_BASE}/negotiations/${voyageId}/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function apiFetchDecisions(voyageId: string): Promise<DecisionRecord[]> {
  const res = await fetch(`${API_BASE}/negotiations/${voyageId}/decisions`)
  if (!res.ok) return []
  return res.json()
}

async function apiOverrideDecision(
  voyageId: string,
  decisionId: string,
  payload: object
): Promise<DecisionRecord> {
  const res = await fetch(`${API_BASE}/negotiations/${voyageId}/decisions/${decisionId}/override`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  ABANDONED: <XCircle className="size-4 text-[#ff3b30]" />,
  PAUSED: <PauseCircle className="size-4 text-[#ff9f0a]" />,
  SKIPPED: <SkipForward className="size-4 text-[#5856d6]" />,
}

const ACTION_COLORS: Record<ActionType, string> = {
  ABANDONED: 'bg-[#fff1f0] border-[#ffccc7] text-[#ff3b30]',
  PAUSED: 'bg-[#fffbe6] border-[#ffe58f] text-[#ff9f0a]',
  SKIPPED: 'bg-[#f3f0ff] border-[#d3adf7] text-[#5856d6]',
}

const SEVERITY_DOT: Record<SeverityLevel, string> = {
  LOW: 'bg-[#34c759]',
  MEDIUM: 'bg-[#ff9f0a]',
  HIGH: 'bg-[#ff6b00]',
  CRITICAL: 'bg-[#ff3b30]',
}

const OUTCOME_BADGE: Record<OutcomeType, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-[#f5f5f7] text-[#86868b] border-[#d2d2d7]' },
  OVERRIDDEN: { label: 'Overridden', cls: 'bg-[#f3f0ff] text-[#5856d6] border-[#d3adf7]' },
  ACCEPTED: { label: 'Accepted', cls: 'bg-[#f0fff4] text-[#34c759] border-[#b7eb8f]' },
  ESCALATED: { label: 'Escalated', cls: 'bg-[#fff1f0] text-[#ff3b30] border-[#ffccc7]' },
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ---------------------------------------------------------------------------
// Decision Card
// ---------------------------------------------------------------------------
function DecisionCard({
  record,
  onOverride,
}: {
  record: DecisionRecord
  onOverride: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const badge = OUTCOME_BADGE[record.outcome]
  const actionCls = ACTION_COLORS[record.action_type]

  return (
    <div className="rounded-2xl border border-[#d2d2d7] bg-white shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold tracking-widest uppercase shrink-0 ${actionCls}`}>
          {ACTION_ICONS[record.action_type]}
          {record.action_type}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#1d1d1f] truncate">{record.target}</span>
            <span className={`shrink-0 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-[#86868b]">
            <span className="flex items-center gap-1">
              <User className="size-3" /> {record.decided_by}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {formatTime(record.timestamp_utc)}
            </span>
            {record.checkpoint_id && (
              <span className="flex items-center gap-1 text-[#087ef5]">
                ◉ {record.checkpoint_id}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={`size-2 rounded-full ${SEVERITY_DOT[record.severity as SeverityLevel]}`} title={record.severity} />
          <button
            onClick={() => setExpanded(e => !e)}
            className="rounded-lg p-1.5 hover:bg-[#f5f5f7] transition text-[#86868b]"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-[#f5f5f7] px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-[#86868b] uppercase">Reason</p>
            <p className="mt-1 text-sm text-[#1d1d1f] leading-relaxed">{record.reason}</p>
          </div>

          {record.proposed_alternative && (
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[#86868b] uppercase">Proposed Alternative</p>
              <div className="mt-1 flex items-start gap-2 rounded-xl bg-[#f0f6ff] border border-[#d6e8ff] p-3">
                <ArrowRightCircle className="size-4 text-[#087ef5] shrink-0 mt-0.5" />
                <p className="text-sm text-[#087ef5]">{record.proposed_alternative}</p>
              </div>
            </div>
          )}

          {/* Override trail */}
          {record.override_by && (
            <div className="rounded-xl border border-[#d3adf7] bg-[#f9f0ff] p-3 space-y-1">
              <p className="text-[10px] font-bold tracking-wider text-[#5856d6] uppercase">Override on Record</p>
              <p className="text-xs text-[#1d1d1f]"><span className="font-semibold">{record.override_by}</span> — {formatTime(record.override_timestamp_utc ?? '')}</p>
              <p className="text-xs text-[#444]">{record.override_reason}</p>
            </div>
          )}

          {/* Actions */}
          {record.outcome === 'PENDING' && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onOverride(record.id)}
                className="flex items-center gap-1.5 rounded-xl bg-[#1d1d1f] px-3 py-2 text-xs font-semibold text-white hover:bg-black transition"
              >
                <RotateCcw className="size-3.5" /> Override Decision
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Override Modal
// ---------------------------------------------------------------------------
function OverrideModal({
  decisionId,
  onSubmit,
  onClose,
}: {
  decisionId: string
  onSubmit: (id: string, overrideBy: string, overrideReason: string) => void
  onClose: () => void
}) {
  const [overrideBy, setOverrideBy] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const valid = overrideBy.trim().length > 0 && overrideReason.trim().length >= 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[#d2d2d7] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#f3f0ff]">
            <RotateCcw className="size-5 text-[#5856d6]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f]">Override Decision</h3>
            <p className="text-xs text-[#86868b]">Record ID: {decisionId}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Your Identity / Role *</label>
          <input
            value={overrideBy}
            onChange={e => setOverrideBy(e.target.value)}
            placeholder="e.g. Ops Director — FlowForge Command Center"
            className="w-full rounded-xl border border-[#d2d2d7] px-3 py-2.5 text-sm outline-none focus:border-[#5856d6] focus:ring-2 focus:ring-[#5856d6]/20 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Override Justification * (min 10 chars)</label>
          <textarea
            rows={3}
            value={overrideReason}
            onChange={e => setOverrideReason(e.target.value)}
            placeholder="e.g. Port clearance received. Reinstating original route plan."
            className="w-full rounded-xl border border-[#d2d2d7] px-3 py-2.5 text-sm resize-none outline-none focus:border-[#5856d6] focus:ring-2 focus:ring-[#5856d6]/20 transition"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#d2d2d7] px-4 py-2.5 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onSubmit(decisionId, overrideBy, overrideReason)}
            disabled={!valid}
            className="flex-1 rounded-xl bg-[#5856d6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4643c2] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Confirm Override
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main NegotiationPanel component
// ---------------------------------------------------------------------------
interface NegotiationPanelProps {
  voyageId: string
}

const ACTION_OPTIONS: { type: ActionType; label: string; desc: string }[] = [
  { type: 'ABANDONED', label: 'Abandon Reroute', desc: 'Reject the proposed reroute or path change' },
  { type: 'PAUSED', label: 'Pause at Checkpoint', desc: 'Hold vessel at checkpoint pending clearance' },
  { type: 'SKIPPED', label: 'Skip Waypoint', desc: 'Bypass a planned port stop or waypoint' },
]

export default function NegotiationPanel({ voyageId }: NegotiationPanelProps) {
  // Form state
  const [actionType, setActionType] = useState<ActionType>('ABANDONED')
  const [target, setTarget] = useState('')
  const [reason, setReason] = useState('')
  const [decidedBy, setDecidedBy] = useState('')
  const [checkpointId, setCheckpointId] = useState('')
  const [proposedAlt, setProposedAlt] = useState('')
  const [severity, setSeverity] = useState<SeverityLevel>('MEDIUM')

  // Decisions list
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [overrideTarget, setOverrideTarget] = useState<string | null>(null)

  const formValid =
    target.trim().length > 0 &&
    reason.trim().length >= 10 &&
    decidedBy.trim().length > 0

  const fetchDecisions = async () => {
    setLoading(true)
    const data = await apiFetchDecisions(voyageId)
    setDecisions(data)
    setLoaded(true)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!formValid) return
    setSubmitting(true)
    setError(null)
    try {
      const record = await apiLogDecision(voyageId, {
        action_type: actionType,
        target,
        reason,
        decided_by: decidedBy,
        checkpoint_id: checkpointId || undefined,
        proposed_alternative: proposedAlt || undefined,
        severity,
      })
      setDecisions(prev => [record, ...prev])
      setTarget('')
      setReason('')
      setProposedAlt('')
      setCheckpointId('')
    } catch (e: any) {
      setError(e.message ?? 'Failed to log decision.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOverride = async (id: string, overrideBy: string, overrideReason: string) => {
    try {
      const updated = await apiOverrideDecision(voyageId, id, {
        override_by: overrideBy,
        override_reason: overrideReason,
        new_outcome: 'OVERRIDDEN',
      })
      setDecisions(prev => prev.map(d => d.id === updated.id ? updated : d))
    } catch (e: any) {
      setError(e.message ?? 'Override failed.')
    } finally {
      setOverrideTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section title */}
      <div>
        <p className="text-[10px] font-bold tracking-[.18em] text-[#5856d6] uppercase">Negotiation Support</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f]">Abandonment Log</h2>
        <p className="text-xs text-[#6e6e73] mt-0.5">
          Log and review decisions to abandon, pause, or skip voyage actions for <span className="font-semibold text-[#1d1d1f]">{voyageId}</span>
        </p>
      </div>

      {/* Log new decision form */}
      <div className="rounded-2xl border border-[#d2d2d7] bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-[#5856d6]" />
          <p className="text-sm font-semibold text-[#1d1d1f]">Record New Decision</p>
        </div>

        {/* Action type selector */}
        <div className="grid grid-cols-3 gap-2">
          {ACTION_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => setActionType(opt.type)}
              className={`rounded-xl border p-3 text-left transition ${
                actionType === opt.type
                  ? ACTION_COLORS[opt.type] + ' shadow-sm'
                  : 'border-[#d2d2d7] hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {ACTION_ICONS[opt.type]}
                <span className="text-[11px] font-bold">{opt.label}</span>
              </div>
              <p className="text-[10px] text-[#86868b] leading-tight">{opt.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Target Action / Route Decision *</label>
            <input
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="e.g. Dynamic reroute via Sunda Strait bypass"
              className="w-full rounded-xl border border-[#d2d2d7] px-3 py-2.5 text-sm outline-none focus:border-[#5856d6] focus:ring-2 focus:ring-[#5856d6]/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Decided By *</label>
            <input
              value={decidedBy}
              onChange={e => setDecidedBy(e.target.value)}
              placeholder="e.g. Capt. Anand Mehta"
              className="w-full rounded-xl border border-[#d2d2d7] px-3 py-2.5 text-sm outline-none focus:border-[#5856d6] focus:ring-2 focus:ring-[#5856d6]/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Checkpoint ID (optional)</label>
            <input
              value={checkpointId}
              onChange={e => setCheckpointId(e.target.value)}
              placeholder="e.g. CP-04"
              className="w-full rounded-xl border border-[#d2d2d7] px-3 py-2.5 text-sm outline-none focus:border-[#5856d6] focus:ring-2 focus:ring-[#5856d6]/20 transition"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Reason * (min 10 characters)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Mandatory: detailed justification for abandoning, pausing, or skipping this action…"
              className="w-full rounded-xl border border-[#d2d2d7] px-3 py-2.5 text-sm resize-none outline-none focus:border-[#5856d6] focus:ring-2 focus:ring-[#5856d6]/20 transition"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Proposed Alternative (optional)</label>
            <input
              value={proposedAlt}
              onChange={e => setProposedAlt(e.target.value)}
              placeholder="e.g. Hold at Singapore anchorage until manifest cleared — ETA +18h"
              className="w-full rounded-xl border border-[#d2d2d7] px-3 py-2.5 text-sm outline-none focus:border-[#5856d6] focus:ring-2 focus:ring-[#5856d6]/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Severity</label>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value as SeverityLevel)}
              className="w-full rounded-xl border border-[#d2d2d7] px-3 py-2.5 text-sm outline-none focus:border-[#5856d6] focus:ring-2 focus:ring-[#5856d6]/20 transition bg-white"
            >
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as SeverityLevel[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-[#fff1f0] border border-[#ffccc7] p-3 text-xs text-[#ff3b30]">
            <AlertTriangle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!formValid || submitting}
          className="w-full rounded-xl bg-[#5856d6] py-2.5 text-sm font-semibold text-white hover:bg-[#4643c2] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Logging Decision…' : 'Log Decision to Negotiation Ledger'}
        </button>
      </div>

      {/* Decision log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-[#86868b]" />
            <p className="text-sm font-semibold text-[#1d1d1f]">Negotiation Ledger</p>
            {decisions.length > 0 && (
              <span className="rounded-full bg-[#f5f5f7] border border-[#d2d2d7] px-2 py-0.5 text-[10px] font-semibold text-[#86868b]">
                {decisions.length}
              </span>
            )}
          </div>
          <button
            onClick={fetchDecisions}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[#d2d2d7] px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
          >
            <RotateCcw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loaded ? 'Refresh' : 'Load Ledger'}
          </button>
        </div>

        {!loaded && (
          <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-8 text-center">
            <MessageSquare className="size-8 text-[#d2d2d7] mx-auto mb-2" />
            <p className="text-sm text-[#86868b]">Click "Load Ledger" to view all negotiation decisions for this voyage.</p>
          </div>
        )}

        {loaded && decisions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-8 text-center">
            <CheckCircle2 className="size-8 text-[#34c759] mx-auto mb-2" />
            <p className="text-sm text-[#86868b]">No decisions logged yet for voyage <span className="font-semibold">{voyageId}</span>.</p>
          </div>
        )}

        <div className="space-y-3">
          {decisions.map(record => (
            <DecisionCard
              key={record.id}
              record={record}
              onOverride={id => setOverrideTarget(id)}
            />
          ))}
        </div>
      </div>

      {/* Override Modal */}
      {overrideTarget && (
        <OverrideModal
          decisionId={overrideTarget}
          onSubmit={handleOverride}
          onClose={() => setOverrideTarget(null)}
        />
      )}
    </div>
  )
}
