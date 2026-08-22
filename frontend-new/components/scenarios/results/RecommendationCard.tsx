'use client'

import React, { useState } from 'react'
import { AlertTriangle, Check, CircleCheck, Navigation, ShieldCheck, X } from 'lucide-react'
import { AnalysisResult } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface RecommendationCardProps {
  result: AnalysisResult
}

export default function RecommendationCard({ result }: RecommendationCardProps) {
  const [decision, setDecision] = useState<'pending' | 'approved' | 'rejected'>('pending')
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
      detail: 'Human review when the SLA limit is exceeded',
    },
    {
      label: 'Irreversible cost exposure',
      value: `$${route.penaltyCostUsd.toLocaleString()}`,
      triggered: route.penaltyCostUsd > 0,
      detail: 'Human review when penalty exposure remains',
    },
  ]
  const requiresApproval = triggerPoints.some((point) => point.triggered)
  const executed = decision === 'approved'
  const rejected = decision === 'rejected'

  const handleExecute = () => {
    if (requiresApproval && decision === 'pending') return
    setDecision('approved')
  }

  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-5">
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

        <button
          onClick={handleExecute}
          disabled={rejected || (requiresApproval && decision === 'pending')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm self-start sm:self-center ${
            executed
              ? 'bg-[#34c759] text-white'
              : 'bg-[#087ef5] text-white hover:bg-[#076ecf] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
          }`}
        >
          {executed ? <Check className="size-4" /> : <Navigation className="size-4" />}
          {executed ? 'Plan Executed & Active' : requiresApproval ? 'Awaiting Approval' : 'Execute Recommended Plan'}
        </button>
      </div>

      <div className={`rounded-2xl border p-4 ${
        rejected
          ? 'border-[#ff3b30]/30 bg-[#fff5f4]'
          : requiresApproval && decision === 'pending'
            ? 'border-[#ff9f0a]/40 bg-[#fff9ed]'
            : 'border-[#34c759]/30 bg-[#f3fbf5]'
      }`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            {rejected ? <X className="mt-0.5 size-5 shrink-0 text-[#ff3b30]" /> : requiresApproval && decision === 'pending' ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#ff9f0a]" /> : <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#34c759]" />}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flow-label text-[#6e6e73]">EXECUTION CHECKPOINT</span>
                <StatusBadge
                  status={rejected ? 'REJECTED' : requiresApproval && decision === 'pending' ? 'HUMAN APPROVAL REQUIRED' : executed ? 'APPROVED & DISPATCHED' : 'AUTO-APPROVED'}
                  variant={rejected ? 'danger' : requiresApproval && decision === 'pending' ? 'warning' : 'success'}
                />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#6e6e73]">
                {rejected
                  ? 'Proposal rejected by the operator. No route action was dispatched.'
                  : requiresApproval && decision === 'pending'
                    ? 'A triggering point was detected. Review the proposal before dispatching an irreversible action.'
                    : executed
                      ? 'The approved route has been dispatched and is now active.'
                      : 'All trigger points are within policy. This reversible route can execute autonomously.'}
              </p>
            </div>
          </div>

          {requiresApproval && decision === 'pending' && (
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setDecision('approved')} className="flex items-center gap-1.5 rounded-xl bg-[#34c759] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#2eaf4f]">
                <Check className="size-3.5" /> Approve & Dispatch
              </button>
              <button onClick={() => setDecision('rejected')} className="flex items-center gap-1.5 rounded-xl border border-[#ff3b30]/30 bg-white px-3 py-2 text-xs font-bold text-[#ff3b30] transition hover:bg-[#fff5f4]">
                <X className="size-3.5" /> Reject
              </button>
            </div>
          )}
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
  )
}
