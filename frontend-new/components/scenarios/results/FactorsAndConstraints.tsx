'use client'

import React from 'react'
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react'

interface FactorsAndConstraintsProps {
  data: {
    criticalFactors: string[]
    activeConstraints: string[]
    mitigationDirectives: string[]
  }
}

export default function FactorsAndConstraints({ data }: FactorsAndConstraintsProps) {
  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-[#087ef5]" />
          <h3 className="text-sm font-bold text-[#1d1d1f]">Critical Factors, Active Constraints & Directives</h3>
        </div>
        <span className="text-xs text-[#86868b]">Governance Boundary</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-xs">
        <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] space-y-2">
          <p className="flow-label text-[#86868b]">KEY CRITICAL FACTORS</p>
          <ul className="space-y-1.5 text-[#1d1d1f]">
            {data.criticalFactors.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#087ef5] mt-1.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] space-y-2">
          <p className="flow-label text-[#86868b]">ACTIVE BOUNDARY CONSTRAINTS</p>
          <ul className="space-y-1.5 text-[#1d1d1f]">
            {data.activeConstraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#ff9f0a] mt-1.5 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] space-y-2">
          <p className="flow-label text-[#86868b]">AUTONOMOUS MITIGATION DIRECTIVES</p>
          <ul className="space-y-1.5 text-[#1d1d1f]">
            {data.mitigationDirectives.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#34c759] mt-1.5 shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
