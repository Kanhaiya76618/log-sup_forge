'use client'

import React from 'react'
import { Radio, Waves, Building2, Box, Cpu, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { IntegrationItem } from '@/lib/types'
import StatusBadge from './StatusBadge'

interface IntegrationCardProps {
  integration: IntegrationItem
  onToggleStatus?: (id: string) => void
}

const iconMap: Record<string, any> = {
  Radio,
  Waves,
  Building2,
  Box,
  Cpu
}

export default function IntegrationCard({ integration, onToggleStatus }: IntegrationCardProps) {
  const IconComponent = iconMap[integration.icon] || Box

  return (
    <div className="rounded-[24px] border border-[#d2d2d7] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden min-w-0">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#087ef5]/10 text-[#087ef5] shadow-sm">
              <IconComponent className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[#1d1d1f] leading-snug truncate">{integration.name}</h3>
              <p className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider truncate">{integration.category}</p>
            </div>
          </div>

          <StatusBadge status={integration.status} pulse={integration.status === 'Connected'} />
        </div>

        {integration.description && (
          <p className="mt-3 text-xs text-[#6e6e73] leading-relaxed">
            {integration.description}
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#f0f0f2] pt-3 text-[11px]">
        <span className="text-[#86868b]">
          Last Sync: <strong className="text-[#1d1d1f] font-mono">{integration.lastSync}</strong>
        </span>

        <button 
          onClick={() => onToggleStatus?.(integration.id)}
          className="font-semibold text-[#087ef5] hover:underline flex items-center gap-1"
        >
          Configure <ArrowUpRight className="size-3" />
        </button>
      </div>
    </div>
  )
}
