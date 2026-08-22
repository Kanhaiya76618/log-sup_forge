'use client'

import React, { useState } from 'react'
import { 
  AlertTriangle, Check, CircleCheck, Navigation, ShieldCheck, 
  X, Pause, AlertOctagon, Sparkles, Scale, Download, FileText
} from 'lucide-react'
import { AnalysisResult } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import AbandonmentModal from './AbandonmentModal'
import { submitDecision, DecisionResponse } from '@/lib/decisionsApi'
import { generateAndDownloadDecisionPdf } from '@/lib/decisionPdf'

interface RecommendationCardProps {
  result: AnalysisResult
  onDecisionRecorded?: () => void
}

export default function RecommendationCard({ result, onDecisionRecorded }: RecommendationCardProps) {
  const [decisionState, setDecisionState] = useState<'pending' | 'accepted' | 'paused' | 'abandoned'>('pending')
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalAction, setModalAction] = useState<'abandoned' | 'paused'>('abandoned')
  const [lastFeedback, setLastFeedback] = useState<DecisionResponse | null>(null)
  const [submittingAccept, setSubmittingAccept] = useState<boolean>(false)

  const route = result.recommendedRoute

  const triggerPoints = [
    {
      label: 'Verifier confidence',
      value: `${route.confidenceScore}%`,
      triggered: route.confidenceScore < 80,
      detail: 'Human review below 80%',
    },
    {
      label: 'SLA delay tolerance',
      value: `+${route.delayVsSlaHours}h / +${result.scenarioInput.constraints.maxDelayHours}h`,
      triggered: route.delayVsSlaHours > result.scenarioInput.constraints.maxDelayHours,
      detail: 'Human review when SLA limit is exceeded',
    },
    {
      label: 'Irreversible cost exposure',
      value: `$${route.penaltyCostUsd.toLocaleString()}`,
      triggered: route.penaltyCostUsd > 0,
      detail: 'Human review when penalty exposure remains',
    },
  ]

  const requiresApproval = triggerPoints.some((point) => point.triggered)

  const handleDownloadPdf = () => {
    let authUser = { name: 'Alex Mercer', email: 'alex.mercer@flowforge.internal', role: 'Operations VP' }
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('flowforge_auth_user')
      if (raw) {
        try { authUser = JSON.parse(raw) } catch {}
      }
    }

    generateAndDownloadDecisionPdf({
      result,
      decisionStatus: decisionState === 'pending' ? 'accepted' : decisionState,
      abandonmentReason: lastFeedback?.abandonment_reason,
      operatorName: authUser.name,
      operatorEmail: authUser.email,
      operatorRole: authUser.role,
      decisionId: lastFeedback?.decision_id
    })
  }

  const handleAccept = async () => {
    setSubmittingAccept(true)
    try {
      let authUser = { name: 'Alex Mercer', email: 'alex.mercer@flowforge.internal', role: 'Operations VP' }
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('flowforge_auth_user')
        if (raw) {
          try { authUser = JSON.parse(raw) } catch {}
        }
      }

      const res = await submitDecision({
        shipment_id: result.scenarioInput.shipmentId || result.id,
        recommended_route: route.name,
        recommended_cost: route.totalFinancialExposureUsd,
        recommended_eta: route.transitTimeHours,
        recommended_risk: parseFloat((result.disruptionProbability / 100).toFixed(2)),
        decision_status: 'accepted',
        profile_key: 'GLOBAL',
        user_id: authUser.email
      })
      setDecisionState('accepted')
      setLastFeedback(res)
      if (onDecisionRecorded) onDecisionRecorded()
    } finally {
      setSubmittingAccept(false)
    }
  }

  const handleOpenAbandon = () => {
    setModalAction('abandoned')
    setModalOpen(true)
  }

  const handleOpenPause = () => {
    setModalAction('paused')
    setModalOpen(true)
  }

  const handleModalSuccess = (res: DecisionResponse) => {
    setDecisionState(res.decision_status)
    setLastFeedback(res)
    if (onDecisionRecorded) onDecisionRecorded()
  }

  return (
    <>
      <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-5">
        
        {/* Card Header & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e5e5e7] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flow-label text-[#087ef5]">AI SUPERVISOR ACTIONABLE DIRECTIVE</span>
              <StatusBadge status="OPTIMAL" variant="success" pulse />
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
              {route.name}
            </h2>
            <p className="mt-0.5 text-xs text-[#6e6e73]">
              {route.pathSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {decisionState === 'pending' ? (
              <>
                <button
                  onClick={handleAccept}
                  disabled={submittingAccept}
                  className="flex items-center gap-1.5 rounded-xl bg-[#34c759] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#2eaf4f] transition active:scale-95 disabled:opacity-50"
                >
                  <Check className="size-4" />
                  {submittingAccept ? 'Dispatching...' : 'Accept & Dispatch'}
                </button>

                <button
                  onClick={handleOpenPause}
                  className="flex items-center gap-1.5 rounded-xl border border-[#ff9f0a]/40 bg-[#fff9ed] px-3.5 py-2.5 text-xs font-bold text-[#b45309] hover:bg-[#fff4e5] transition active:scale-95"
                >
                  <Pause className="size-3.5" /> Pause
                </button>

                <button
                  onClick={handleOpenAbandon}
                  className="flex items-center gap-1.5 rounded-xl border border-[#ff3b30]/30 bg-[#fff5f4] px-3.5 py-2.5 text-xs font-bold text-[#ff3b30] hover:bg-[#ffebe8] transition active:scale-95"
                >
                  <AlertOctagon className="size-3.5" /> Abandon / Skip
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold ${
                  decisionState === 'accepted' ? 'bg-[#e8f8ed] text-[#34c759]' :
                  decisionState === 'paused' ? 'bg-[#fff4e5] text-[#ff9f0a]' :
                  'bg-[#ffebe8] text-[#ff3b30]'
                }`}>
                  {decisionState === 'accepted' && <Check className="size-4" />}
                  {decisionState === 'paused' && <Pause className="size-4" />}
                  {decisionState === 'abandoned' && <AlertOctagon className="size-4" />}
                  <span>DECISION RECORDED: {decisionState.toUpperCase()}</span>
                </div>

                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 rounded-xl border border-[#087ef5] bg-[#f0f7ff] px-3 py-2 text-xs font-bold text-[#087ef5] hover:bg-[#e0effe] transition active:scale-95"
                  title="Download Decision Report PDF"
                >
                  <Download className="size-3.5" /> Download PDF Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Adaptive AI Feedback Banner if decision recorded */}
        {lastFeedback && (
          <div className="rounded-2xl border border-[#087ef5]/30 bg-[#f0f7ff] p-4 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#087ef5] flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> FlowForge Adaptive Learning Feedback
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#86868b]">
                  {lastFeedback.decision_id} · {new Date(lastFeedback.decision_timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#087ef5] hover:underline"
                >
                  <Download className="size-3" /> Download Audit PDF
                </button>
              </div>
            </div>
            <p className="text-[#1d1d1f]">
              {lastFeedback.message}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-[#6e6e73] uppercase">New Learned Weights:</span>
              <span className="bg-white px-2 py-0.5 rounded-md border text-[10px] font-mono text-[#087ef5]">
                Risk: {Math.round(lastFeedback.learned_weights.risk_weight * 100)}%
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border text-[10px] font-mono text-[#ff9f0a]">
                ETA: {Math.round(lastFeedback.learned_weights.eta_weight * 100)}%
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border text-[10px] font-mono text-[#34c759]">
                Cost: {Math.round(lastFeedback.learned_weights.cost_weight * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Execution Checkpoint Box */}
        <div className={`rounded-2xl border p-4 ${
          decisionState === 'abandoned'
            ? 'border-[#ff3b30]/30 bg-[#fff5f4]'
            : decisionState === 'paused'
            ? 'border-[#ff9f0a]/30 bg-[#fff9ed]'
            : requiresApproval && decisionState === 'pending'
            ? 'border-[#ff9f0a]/40 bg-[#fff9ed]'
            : 'border-[#34c759]/30 bg-[#f3fbf5]'
        }`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              {decisionState === 'abandoned' ? (
                <AlertOctagon className="mt-0.5 size-5 shrink-0 text-[#ff3b30]" />
              ) : decisionState === 'paused' ? (
                <Pause className="mt-0.5 size-5 shrink-0 text-[#ff9f0a]" />
              ) : requiresApproval && decisionState === 'pending' ? (
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#ff9f0a]" />
              ) : (
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#34c759]" />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flow-label text-[#6e6e73]">EXECUTION CHECKPOINT</span>
                  <StatusBadge
                    status={
                      decisionState === 'abandoned'
                        ? 'ABANDONED BY OPERATOR'
                        : decisionState === 'paused'
                        ? 'EXECUTION PAUSED'
                        : decisionState === 'accepted'
                        ? 'APPROVED & DISPATCHED'
                        : requiresApproval
                        ? 'HUMAN APPROVAL REQUIRED'
                        : 'AUTO-APPROVED'
                    }
                    variant={
                      decisionState === 'abandoned'
                        ? 'danger'
                        : decisionState === 'paused' || (requiresApproval && decisionState === 'pending')
                        ? 'warning'
                        : 'success'
                    }
                  />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#6e6e73]">
                  {decisionState === 'abandoned'
                    ? `Proposal abandoned with reason '${lastFeedback?.abandonment_reason?.replace(/_/g, ' ') || 'disagreement'}'. Decision Memory updated.`
                    : decisionState === 'paused'
                    ? 'Execution paused for stakeholder review. Buffer held at transshipment terminal.'
                    : decisionState === 'accepted'
                    ? 'The approved route has been dispatched and EDI transmission logged.'
                    : requiresApproval
                    ? 'Trigger point detected. Choose to Accept, Pause, or Abandon with structured reasoning.'
                    : 'All trigger points within policy. Ready for autonomous or manual dispatch.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {triggerPoints.map((point) => (
              <div key={point.label} className="rounded-xl border border-[#d2d2d7]/70 bg-white/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#86868b]">{point.label}</span>
                  {point.triggered ? <AlertTriangle className="size-3.5 text-[#ff9f0a]" /> : <CircleCheck className="size-3.5 text-[#34c759]" />}
                </div>
                <p className="mt-1 text-sm font-bold text-[#1d1d1f]">{point.value}</p>
                <p className="mt-1 text-[10px] text-[#86868b]">{point.triggered ? point.detail : 'Within autonomous policy'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7]">
            <span className="flow-label text-[#86868b]">NET FINANCIAL SAVINGS</span>
            <p className="mt-2 text-2xl font-bold text-[#34c759]">
              +${route.savingsVsDoNothingUsd.toLocaleString()} USD
            </p>
            <p className="text-[11px] text-[#6e6e73] mt-1">vs unmitigated exposure</p>
          </div>

          <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7]">
            <span className="flow-label text-[#86868b]">PREDICTED VOYAGE DELAY</span>
            <p className="mt-2 text-2xl font-bold text-[#ff9f0a]">
              +{route.delayVsSlaHours}h ({parseFloat((route.delayVsSlaHours / 24).toFixed(1))}d)
            </p>
            <p className="text-[11px] text-[#6e6e73] mt-1">SLA slip minimized from +{result.predictedDelayDays}d</p>
          </div>

          <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7]">
            <span className="flow-label text-[#86868b]">SLA ON-TIME CONFIDENCE</span>
            <p className="mt-2 text-2xl font-bold text-[#087ef5]">
              {route.confidenceScore}%
            </p>
            <p className="text-[11px] text-[#6e6e73] mt-1">500-iteration Monte Carlo twin</p>
          </div>

          <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7]">
            <span className="flow-label text-[#86868b]">CRUISING SPEED / DISTANCE</span>
            <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">
              {route.speedKnots} kn · {route.distanceNm} NM
            </p>
            <p className="text-[11px] text-[#6e6e73] mt-1">Fuel delta +${route.fuelCostUsd.toLocaleString()}</p>
          </div>
        </div>

      </div>

      {/* Challenge #705 Abandonment Reason Modal */}
      <AbandonmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        result={result}
        actionType={modalAction}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}
