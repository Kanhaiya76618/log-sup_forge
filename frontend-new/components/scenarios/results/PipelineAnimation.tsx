'use client'

import React from 'react'
import { Sparkles, Terminal, CheckCircle2 } from 'lucide-react'
import { DecisionAgent } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface PipelineAnimationProps {
  steps: DecisionAgent[]
}

export default function PipelineAnimation({ steps }: PipelineAnimationProps) {
  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#087ef5]" />
          <h3 className="text-sm font-bold text-[#1d1d1f]">9-Agent Multi-Agent Decision Graph Stream</h3>
        </div>
        <StatusBadge status="COMPLETED (42ms)" variant="success" pulse />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((agent) => (
          <div
            key={agent.step}
            className="rounded-2xl border border-[#e5e5e7] bg-[#fafaf9] p-4 flex flex-col justify-between overflow-hidden min-w-0"
          >
            <div>
              <div className="flex items-center justify-between gap-2 min-w-0 mb-2">
                <span className="font-mono text-xs font-bold text-[#087ef5] shrink-0">{agent.step}</span>
                <StatusBadge status={agent.status} size="sm" />
              </div>
              <h4 className="text-xs font-bold text-[#1d1d1f] leading-snug truncate">{agent.name}</h4>
              <p className="text-[10px] text-[#86868b] mt-0.5 leading-snug truncate">{agent.category}</p>
            </div>

            <div className="mt-3 pt-2 border-t border-[#e5e5e7] text-[10px] text-[#1d1d1f] font-mono bg-white p-2 rounded-xl border overflow-hidden min-w-0">
              <p className="truncate">{agent.output}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
