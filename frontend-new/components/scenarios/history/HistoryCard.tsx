'use client'

import React from 'react'
import { ArrowRight, ShieldCheck, Clock, TrendingDown } from 'lucide-react'
import { AnalysisResult } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface HistoryCardProps {
  scenario: AnalysisResult
}

export default function HistoryCard({ scenario }: HistoryCardProps) {
  return (
    <a
      href={`/scenarios/${scenario.id}`}
      className="block rounded-[24px] border border-[#d2d2d7] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#087ef5]/50 transition-all duration-200 overflow-hidden min-w-0"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f0f0f2] pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#087ef5]">{scenario.id}</span>
            <span className="text-[10px] text-[#86868b]">
              {new Date(scenario.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-bold text-[#1d1d1f]">{scenario.scenarioInput.title}</h3>
        </div>

        <StatusBadge
          status={scenario.riskLevel === 'critical' ? 'CRITICAL RISK' : 'HIGH RISK'}
          variant={scenario.riskLevel === 'critical' ? 'danger' : 'warning'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4 text-xs">
        <div>
          <span className="text-[10px] text-[#86868b] uppercase block">Trade Corridor</span>
          <strong className="text-[#1d1d1f] truncate block">{scenario.affectedCorridor}</strong>
        </div>

        <div>
          <span className="text-[10px] text-[#86868b] uppercase block">Disruption Event</span>
          <strong className="text-[#ff3b30] truncate block">{scenario.scenarioInput.disruption.type.replace('_', ' ').toUpperCase()}</strong>
        </div>

        <div>
          <span className="text-[10px] text-[#86868b] uppercase block">Net Savings</span>
          <strong className="text-[#34c759] block">+${scenario.lossAvoidedAmountUsd.toLocaleString()} USD</strong>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs font-bold text-[#087ef5] flex items-center gap-1 hover:underline">
            View Analysis <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </a>
  )
}
