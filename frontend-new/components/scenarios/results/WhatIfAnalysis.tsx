'use client'

import React from 'react'
import { Sparkles, Sliders, TrendingDown, Gauge } from 'lucide-react'
import { WhatIfScenarioVariant } from '@/lib/types'

interface WhatIfAnalysisProps {
  scenarios: WhatIfScenarioVariant[]
}

export default function WhatIfAnalysis({ scenarios }: WhatIfAnalysisProps) {
  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#ff9f0a]" />
          <h3 className="text-sm font-bold text-[#1d1d1f]">500-Sample Monte Carlo Digital Twin What-If Analysis</h3>
        </div>
        <span className="flow-badge bg-[#e8f8ed] text-[#34c759]">STOCHASTIC CONVERGED</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {scenarios.map((variant, i) => (
          <div key={i} className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] space-y-3">
            <h4 className="text-xs font-bold text-[#1d1d1f] leading-snug">{variant.name}</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Target Speed</span>
                <strong className="font-mono text-[#1d1d1f]">{variant.speedChangeKnots} kn</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Delay Slip</span>
                <strong className="font-mono text-[#ff9f0a]">+{variant.predictedSlipDays}d</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Net Cost Savings</span>
                <strong className="font-mono text-[#34c759]">+${variant.netSavingsUsd.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">SLA Compliance</span>
                <strong className="font-mono text-[#087ef5]">{variant.slaConfidencePct}%</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
