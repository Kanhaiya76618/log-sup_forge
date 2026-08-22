'use client'

import React, { useState } from 'react'
import { ShieldCheck, TrendingDown, Clock, Navigation, Check, Send, Sparkles } from 'lucide-react'
import { AnalysisResult } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface RecommendationCardProps {
  result: AnalysisResult
}

export default function RecommendationCard({ result }: RecommendationCardProps) {
  const [executed, setExecuted] = useState(false)
  const route = result.recommendedRoute

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
          onClick={() => setExecuted(true)}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm self-start sm:self-center ${
            executed
              ? 'bg-[#34c759] text-white'
              : 'bg-[#087ef5] text-white hover:bg-[#076ecf] active:scale-95'
          }`}
        >
          {executed ? <Check className="size-4" /> : <Navigation className="size-4" />}
          {executed ? 'Plan Executed & Active' : 'Execute Recommended Plan'}
        </button>
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
