'use client'

import React from 'react'
import { Play, Sparkles, ShieldCheck, ArrowLeft, CheckCircle2, AlertTriangle, Box, Ship } from 'lucide-react'
import { ScenarioInput } from '@/lib/types'

interface ReviewStageProps {
  input: ScenarioInput
  isSubmitting: boolean
  onSubmit: () => void
  onPrev: () => void
}

export default function ReviewStage({
  input,
  isSubmitting,
  onSubmit,
  onPrev
}: ReviewStageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 06 OF 06</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Review & Run Decision Simulation</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Verify scenario parameters before launching the 9-agent autonomous optimization pipeline.
        </p>
      </div>

      {/* Scenario Overview Card */}
      <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3.5">
          <div>
            <span className="font-mono text-xs font-bold text-[#087ef5]">{input.shipmentId}</span>
            <h3 className="text-base font-bold text-[#1d1d1f] mt-0.5">{input.title}</h3>
          </div>
          <span className="flow-badge bg-[#e8f0fe] text-[#087ef5]">
            READY FOR SOLVER
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Corridor & Vessel</span>
            <p className="font-bold text-[#1d1d1f] mt-1">{input.vesselName}</p>
            <p className="text-[#6e6e73] mt-0.5">{input.origin} ➔ {input.destination}</p>
          </div>

          <div className="bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Disruption Profile</span>
            <p className="font-bold text-[#ff3b30] mt-1">{input.disruption.type.replace('_', ' ').toUpperCase()} ({input.disruption.severity}%)</p>
            <p className="text-[#6e6e73] mt-0.5">{input.disruption.affectedNode}</p>
          </div>

          <div className="bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Solver Constraints</span>
            <p className="font-bold text-[#1d1d1f] mt-1">Budget: ${input.constraints.maxBudgetUsd.toLocaleString()}</p>
            <p className="text-[#6e6e73] mt-0.5">Max Delay: {input.constraints.maxDelayHours}h · Strict SLA: {input.constraints.strictSla ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Expected AI Output Summary */}
        <div className="rounded-2xl bg-[#1d1d1f] p-4 text-white space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#34c759]">
            <Sparkles className="size-4" /> 9-Agent Pipeline Execution Plan
          </div>
          <p className="text-xs text-[#e5e5e7] leading-relaxed">
            Upon triggering, the 9 agents (ExtraTrees Classifier, LightGBM Delay Predictor, Google OR-Tools CP-SAT Solver, and 500-sample Monte Carlo Digital Twin) will calculate Pareto optimal reroutes, financial demurrage savings, and generate an automated Port Authority EDI notice.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#f0f0f2]">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 rounded-xl border border-[#d2d2d7] px-4 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7] transition disabled:opacity-50"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-black transition active:scale-95 disabled:opacity-50"
        >
          <Play className={`size-4 text-[#087ef5] ${isSubmitting ? 'animate-spin' : ''}`} />
          {isSubmitting ? 'Running 9-Agent Simulation...' : 'Execute Scenario Simulation'}
        </button>
      </div>
    </div>
  )
}
