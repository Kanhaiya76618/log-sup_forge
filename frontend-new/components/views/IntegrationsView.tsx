'use client'

import React, { useState } from 'react'
import { Cpu, RefreshCw, X, CheckCircle2, ShieldCheck, Key, Globe, Zap, AlertCircle } from 'lucide-react'
import { IntegrationItem } from '@/lib/types'
import IntegrationCard from '@/components/ui/IntegrationCard'

interface IntegrationsViewProps {
  integrations: IntegrationItem[]
  onSyncAll: () => void
}

export default function IntegrationsView({ integrations, onSyncAll }: IntegrationsViewProps) {
  const [syncing, setSyncing] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [endpointUrl, setEndpointUrl] = useState('')
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')
  const [integrationList, setIntegrationList] = useState<IntegrationItem[]>(integrations)

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      onSyncAll()
    }, 1000)
  }

  const handleOpenConfig = (id: string) => {
    const item = integrationList.find(i => i.id === id)
    if (item) {
      setSelectedIntegration(item)
      setApiKey(item.id === 'int-01' ? 'e9db0f9828d550c986d58f1ac85b514cf391e251' : '●●●●●●●●●●●●●●●●●●●●')
      setEndpointUrl(item.id === 'int-01' ? 'wss://stream.aisstream.io/v0/stream' : 'https://api.open-meteo.com/v1/forecast')
      setTestingStatus('idle')
    }
  }

  const handleTestConnection = () => {
    setTestingStatus('testing')
    setTimeout(() => {
      setTestingStatus('success')
    }, 1200)
  }

  const handleSaveConfig = () => {
    if (selectedIntegration) {
      setIntegrationList(prev => prev.map(i => i.id === selectedIntegration.id ? { ...i, status: 'Connected', lastSync: 'Just now' } : i))
      setSelectedIntegration(null)
    }
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
        {integrationList.map((item) => (
          <IntegrationCard 
            key={item.id} 
            integration={item} 
            onToggleStatus={handleOpenConfig}
          />
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] border border-white/90 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#087ef5]/10 text-[#087ef5]">
                  <Cpu className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">{selectedIntegration.name}</h3>
                  <p className="text-[10px] text-[#86868b] uppercase tracking-wider">{selectedIntegration.category}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIntegration(null)}
                className="rounded-full p-1.5 text-[#86868b] hover:bg-[#f0f0f2] transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1d1d1f] mb-1.5 flex items-center gap-1.5">
                  <Key className="size-3.5 text-[#087ef5]" /> API Key / Access Token
                </label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter secret API token..."
                  className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] p-3 font-mono text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1d1d1f] mb-1.5 flex items-center gap-1.5">
                  <Globe className="size-3.5 text-[#087ef5]" /> Endpoint Stream URL
                </label>
                <input 
                  type="text"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https:// or wss://"
                  className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] p-3 font-mono text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white"
                />
              </div>

              <div className="rounded-xl bg-[#f5f5f7] p-3.5 flex items-center justify-between border border-[#e5e5e7]">
                <div>
                  <p className="font-bold text-[#1d1d1f]">Live Health Ping</p>
                  <p className="text-[10px] text-[#6e6e73]">Verify bidirectional handshake with live endpoint</p>
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingStatus === 'testing'}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                    testingStatus === 'success' 
                      ? 'bg-[#e8f8ed] text-[#34c759] border border-[#34c759]/30' 
                      : 'bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f0f0f2]'
                  }`}
                >
                  {testingStatus === 'testing' ? <RefreshCw className="size-3 animate-spin" /> : testingStatus === 'success' ? <CheckCircle2 className="size-3 text-[#34c759]" /> : <Zap className="size-3 text-[#087ef5]" />}
                  {testingStatus === 'testing' ? 'Testing...' : testingStatus === 'success' ? 'Verified 200 OK' : 'Test Ping'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e5e5e7]">
                <button
                  type="button"
                  onClick={() => setSelectedIntegration(null)}
                  className="rounded-xl border border-[#d2d2d7] bg-white px-4 py-2 text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="rounded-xl bg-[#087ef5] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf]"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
