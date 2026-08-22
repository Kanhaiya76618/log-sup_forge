'use client'

import React from 'react'
import { AlertTriangle, GitBranch, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface DisruptionSummaryProps {
  summary: {
    event: string
    severity: string
    rootCauses: string[]
    immediateImpacts: string[]
    cascadingRisks: string[]
  }
}

export default function DisruptionSummary({ summary }: DisruptionSummaryProps) {
  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="size-4 text-[#ff9f0a]" />
          <h3 className="text-sm font-bold text-[#1d1d1f]">Disruption Event & Cascading Impact Diagnostic</h3>
        </div>
        <span className="flow-badge bg-[#ffebe8] text-[#ff3b30]">{summary.severity}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-xs">
        <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] space-y-2">
          <p className="flow-label text-[#86868b]">ROOT CAUSE TELEMETRY</p>
          <ul className="space-y-1.5 text-[#1d1d1f]">
            {summary.rootCauses.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#ff9f0a] mt-1.5 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] space-y-2">
          <p className="flow-label text-[#86868b]">IMMEDIATE VESSEL IMPACTS</p>
          <ul className="space-y-1.5 text-[#1d1d1f]">
            {summary.immediateImpacts.map((imp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#ff3b30] mt-1.5 shrink-0" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] space-y-2">
          <p className="flow-label text-[#86868b]">CASCADING DOWNSTREAM RISKS</p>
          <ul className="space-y-1.5 text-[#1d1d1f]">
            {summary.cascadingRisks.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#087ef5] mt-1.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
