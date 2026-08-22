'use client'

import React, { useState } from 'react'
import { Cpu, RefreshCw } from 'lucide-react'
import { IntegrationItem } from '@/lib/types'
import IntegrationCard from '@/components/ui/IntegrationCard'

interface IntegrationsViewProps {
  integrations: IntegrationItem[]
  onSyncAll: () => void
}

export default function IntegrationsView({ integrations, onSyncAll }: IntegrationsViewProps) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      onSyncAll()
    }, 1000)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="flow-label text-[#087ef5]">ERP, RADAR & TELEMETRY CONNECTORS</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">System Integrations</h2>
          <p className="mt-1 text-xs text-[#6e6e73]">PostgreSQL database, AIS marine streams, Open-Meteo weather radar, and SAP S/4HANA</p>
        </div>

        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-xl bg-[#087ef5] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf] transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} /> Sync All Connectors
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((item) => (
          <IntegrationCard key={item.id} integration={item} />
        ))}
      </div>
    </div>
  )
}
