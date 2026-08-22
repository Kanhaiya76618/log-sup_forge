'use client'

import React from 'react'
import { ArrowRight, ShieldCheck, Clock, TrendingDown, Trash2 } from 'lucide-react'
import { AnalysisResult } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface HistoryCardProps {
  scenario: AnalysisResult
  onDelete?: (id: string) => void
}

export default function HistoryCard({ scenario, onDelete }: HistoryCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete && scenario?.id) {
      onDelete(scenario.id)
    }
  }

  return (
    <div className="relative group rounded-[24px] border border-[#d2d2d7] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#087ef5]/50 transition-all duration-200 overflow-hidden min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f0f0f2] pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#087ef5]">{scenario?.id || 'Unknown'}</span>
            <span className="text-[10px] text-[#86868b]">
              {scenario?.createdAt ? new Date(scenario.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
            </span>
          </div>
          <a href={`/scenarios/${scenario.id}`} className="hover:text-[#087ef5] transition">
            <h3 className="mt-1 text-sm font-bold text-[#1d1d1f]">{scenario?.scenarioInput?.title || 'Untitled Scenario'}</h3>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={scenario?.riskLevel === 'critical' ? 'CRITICAL RISK' : 'HIGH RISK'}
            variant={scenario?.riskLevel === 'critical' ? 'danger' : 'warning'}
          />
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              title="Delete this scenario from history"
              className="size-7 rounded-xl border border-transparent hover:border-[#ff3b30]/30 hover:bg-[#fff5f4] text-[#86868b] hover:text-[#ff3b30] flex items-center justify-center transition active:scale-90"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <a href={`/scenarios/${scenario.id}`} className="block">
        <div className="grid gap-3 sm:grid-cols-4 text-xs">
          <div>
            <span className="text-[10px] text-[#86868b] uppercase block">Trade Corridor</span>
            <strong className="text-[#1d1d1f] truncate block">{scenario?.affectedCorridor || 'Unknown'}</strong>
          </div>

          <div>
            <span className="text-[10px] text-[#86868b] uppercase block">Disruption Event</span>
            <strong className="text-[#ff3b30] truncate block">{scenario?.scenarioInput?.disruption?.type?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN EVENT'}</strong>
          </div>

          <div>
            <span className="text-[10px] text-[#86868b] uppercase block">Net Savings</span>
            <strong className="text-[#34c759] block">+${(scenario?.lossAvoidedAmountUsd || 0).toLocaleString()} USD</strong>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-xs font-bold text-[#087ef5] flex items-center gap-1 group-hover:translate-x-0.5 transition">
              View Analysis <ArrowRight className="size-3.5" />
            </span>
          </div>
        </div>
      </a>
    </div>
  )
}
