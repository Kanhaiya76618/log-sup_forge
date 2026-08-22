'use client'

import React from 'react'
import { ShieldCheck, Cpu, Terminal } from 'lucide-react'
import { DecisionEvidenceItem } from '@/lib/types'

interface DecisionEvidenceProps {
  evidence: DecisionEvidenceItem[]
}

export default function DecisionEvidence({ evidence }: DecisionEvidenceProps) {
  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-[#087ef5]" />
          <h3 className="text-sm font-bold text-[#1d1d1f]">AI Decision Evidence & Model Interpretability</h3>
        </div>
        <span className="text-xs text-[#86868b]">Deterministic Inference Audit</span>
      </div>

      <div className="space-y-3">
        {evidence.map((item) => (
          <div key={item.agentStep} className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#087ef5]">STAGE {item.agentStep}</span>
                <h4 className="text-xs font-bold text-[#1d1d1f]">{item.agentName}</h4>
                <span className="flow-badge bg-white border text-[#6e6e73]">{item.inferenceModel}</span>
              </div>
              <p className="text-xs text-[#6e6e73] leading-relaxed">{item.reasoning}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
              <span className="flow-badge bg-[#e8f8ed] text-[#34c759]">{item.confidence}% Confidence</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
