'use client'

import React, { useState } from 'react'
import { 
  X, AlertOctagon, Pause, ArrowRight, Check, Sparkles, 
  DollarSign, Clock, ShieldAlert, UserCheck, Anchor, Ship, FileText, Scale, Download
} from 'lucide-react'
import { AnalysisResult } from '@/lib/types'
import { submitDecision, DecisionResponse } from '@/lib/decisionsApi'
import { generateAndDownloadDecisionPdf } from '@/lib/decisionPdf'

interface AbandonmentModalProps {
  isOpen: boolean
  onClose: () => void
  result: AnalysisResult
  actionType: 'abandoned' | 'paused'
  onSuccess: (res: DecisionResponse) => void
}

const ABANDONMENT_REASONS = [
  {
    id: 'cost',
    label: 'Reroute Cost Too High',
    icon: DollarSign,
    desc: 'Fuel surcharge or demurrage rate exceeds financial tolerance cap.',
    impact: 'Increases Cost Weight (+8%), decreases Risk & ETA weights'
  },
  {
    id: 'eta',
    label: 'ETA Schedule Delay Unacceptable',
    icon: Clock,
    desc: 'Voyage transit time breaches critical customer SLA delivery window.',
    impact: 'Increases ETA Weight (+8%), decreases Risk & Cost weights'
  },
  {
    id: 'risk',
    label: 'Storm / Operational Risk Unacceptable',
    icon: ShieldAlert,
    desc: 'Wave swell amplitude or weather impedance exceeds safety threshold.',
    impact: 'Increases Risk Weight (+8%), decreases Cost & ETA weights'
  },
  {
    id: 'customer_preference',
    label: 'Customer / Buyer Special Directive',
    icon: UserCheck,
    desc: 'Consignee contract explicitly requires or forbids specific corridors.',
    impact: 'Balances Risk & ETA (+4% each), lowers Cost weight'
  },
  {
    id: 'port_constraint',
    label: 'Port / Terminal Berth Bottleneck',
    icon: Anchor,
    desc: 'Target terminal has severe crane congestion or berth reservation freeze.',
    impact: 'Increases Risk weight (+6%)'
  },
  {
    id: 'carrier_constraint',
    label: 'Carrier Alliance / Vessel Restriction',
    icon: Ship,
    desc: 'Vessel class, draft limit, or ocean carrier operational constraint.',
    impact: 'Increases Risk weight (+6%)'
  },
  {
    id: 'regulatory',
    label: 'Regulatory & Carbon Tax Compliance',
    icon: Scale,
    desc: 'IMO CII carbon intensity rating or maritime compliance restriction.',
    impact: 'Increases Risk weight (+6%)'
  },
  {
    id: 'route_preference',
    label: 'Operational Route Preference',
    icon: FileText,
    desc: 'Fleet command prefers alternative commercial lane or direct voyage.',
    impact: 'Balances ETA & Risk weights'
  },
]

export default function AbandonmentModal({
  isOpen,
  onClose,
  result,
  actionType,
  onSuccess,
}: AbandonmentModalProps) {
  const [reason, setReason] = useState<string>('cost')
  const [notes, setNotes] = useState<string>('')
  const [alternativeRoute, setAlternativeRoute] = useState<string>('Plan A: Direct Nominal Corridor')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const selectedReasonObj = ABANDONMENT_REASONS.find(r => r.id === reason)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      let authUser = { name: 'Alex Mercer', email: 'alex.mercer@flowforge.internal', role: 'Operations VP' }
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('flowforge_auth_user')
        if (raw) {
          try { authUser = JSON.parse(raw) } catch {}
        }
      }

      const payload = {
        shipment_id: result.scenarioInput.shipmentId || result.id,
        recommended_route: result.recommendedRoute.name,
        recommended_cost: result.recommendedRoute.totalFinancialExposureUsd,
        recommended_eta: result.recommendedRoute.transitTimeHours,
        recommended_risk: parseFloat((result.disruptionProbability / 100).toFixed(2)),
        decision_status: actionType,
        abandonment_reason: reason,
        abandonment_reason_text: notes.trim() || undefined,
        alternative_route: alternativeRoute,
        profile_key: 'GLOBAL',
        user_id: authUser.email
      }

      const response = await submitDecision(payload)
      onSuccess(response)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to record decision')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#d2d2d7] bg-white p-6 sm:p-7 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e5e5e7] pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-2xl ${
              actionType === 'abandoned' ? 'bg-[#ffebe8] text-[#ff3b30]' : 'bg-[#fff4e5] text-[#ff9f0a]'
            }`}>
              {actionType === 'abandoned' ? <AlertOctagon className="size-5" /> : <Pause className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flow-label text-[#087ef5]">CHALLENGE #705 NEGOTIATION SUPPORT</span>
                <span className={`flow-badge ${
                  actionType === 'abandoned' ? 'bg-[#ffebe8] text-[#ff3b30]' : 'bg-[#fff4e5] text-[#ff9f0a]'
                }`}>
                  {actionType === 'abandoned' ? 'ABANDON / SKIP PROPOSAL' : 'PAUSE / HOLD PROPOSAL'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1d1d1f] mt-0.5">
                Capture Reason for {actionType === 'abandoned' ? 'Abandoning' : 'Pausing'} Recommendation
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#86868b] hover:bg-[#f5f5f7] transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Info Box */}
        <div className="rounded-xl bg-[#fafaf9] p-3.5 border border-[#e5e5e7] text-xs text-[#6e6e73] space-y-1">
          <p className="font-semibold text-[#1d1d1f]">
            Active Proposal: <span className="font-mono text-[#087ef5]">{result.recommendedRoute.name}</span>
          </p>
          <p className="text-[11px]">
            When an operator declines or pauses an AI recommendation, capturing structured reasoning allows FlowForge's <strong>Adaptive Preference Learning Engine</strong> to learn trade-off priorities and optimize future solutions.
          </p>
        </div>

        {/* Reason Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#1d1d1f]">
            Primary Reason for Disagreement / Abandonment <span className="text-[#ff3b30]">*</span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {ABANDONMENT_REASONS.map((r) => {
              const isSelected = reason === r.id
              const Icon = r.icon
              return (
                <div
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all text-left ${
                    isSelected
                      ? 'border-[#087ef5] bg-[#f0f7ff] shadow-sm ring-2 ring-[#087ef5]/15'
                      : 'border-[#e5e5e7] bg-[#fafaf9] hover:bg-white hover:border-[#d2d2d7]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-[#087ef5] text-white' : 'bg-[#e5e5e7] text-[#6e6e73]'
                    }`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#1d1d1f] leading-snug">{r.label}</h4>
                      <p className="text-[10px] text-[#86868b] leading-tight mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Learning Feedback Preview */}
        {selectedReasonObj && (
          <div className="rounded-2xl border border-[#087ef5]/20 bg-[#f0f7ff] p-3.5 text-xs text-[#087ef5] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <Sparkles className="size-3.5" /> Adaptive AI Weight Shift Preview:
            </div>
            <p className="text-[11px] text-[#1d1d1f]">
              {selectedReasonObj.impact}. Future OR-Tools Pareto runs for profile <strong>GLOBAL</strong> will favor this constraint.
            </p>
          </div>
        )}

        {/* Alternative Plan Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1d1d1f]">
            Alternative Route / Decision Taken
          </label>
          <select
            value={alternativeRoute}
            onChange={(e) => setAlternativeRoute(e.target.value)}
            className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-3.5 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white transition"
          >
            <option value="Plan A: Direct Nominal Corridor">Plan A: Do Nothing (Direct Nominal Corridor in Weather)</option>
            <option value="Plan C: Full Throttle Speed Recovery">Plan C: Engine Throttle Speed Boost (21 kn Engine Burn)</option>
            <option value="Hold in Port / Delay Departure">Hold in Port / Delay Berth Departure by 24h</option>
            <option value="Air-Freight Emergency Split">Air-Freight Emergency Buffer SKU Order</option>
            <option value="Manual Dispatcher Custom Reroute">Manual Dispatcher Custom Waypoints</option>
          </select>
        </div>

        {/* Custom Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1d1d1f]">
            Operator Justification Notes <span className="text-[10px] font-normal text-[#86868b]">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Buyer rejected the $42K fuel surcharge; decided to take minor berth delay instead."
            className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] p-3 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white transition"
          />
        </div>

        {error && (
          <p className="text-xs text-[#ff3b30] font-medium">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f2]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-[#d2d2d7] px-4 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 ${
              actionType === 'abandoned' ? 'bg-[#ff3b30] hover:bg-[#e03026]' : 'bg-[#ff9f0a] hover:bg-[#e68e09]'
            }`}
          >
            {submitting ? 'Recording Decision...' : (
              <>
                <Check className="size-4" /> Confirm & Apply Adaptive Learning
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
