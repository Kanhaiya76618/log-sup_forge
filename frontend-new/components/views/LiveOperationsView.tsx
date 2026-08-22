'use client'

import React, { useState } from 'react'
import { Activity, Radio, AlertTriangle, ShieldCheck, Ship, Wind, Waves, ArrowRight, Gauge, Play, RefreshCw, Navigation } from 'lucide-react'
import VoyageCheckpointsRibbon from '@/components/ui/VoyageCheckpointsRibbon'
import NegotiationPanel from '@/components/ui/NegotiationPanel'
import { VoyageCheckpoint } from '@/lib/api'

export default function LiveOperationsView() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedVoyageId, setSelectedVoyageId] = useState('SH-2049')
  const [activeCheckpoint, setActiveCheckpoint] = useState<VoyageCheckpoint | null>(null)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const liveFeeds = [
    { id: 'SH-2049', source: 'Satellite Uplink #1092', vessel: 'CSCL Globe Supermax', speed: '14.2 kn', heading: '065° ENE', lat: '1.29 N', lng: '103.85 E', status: 'Warning - High Swell Risk', corridor: 'Mumbai ➔ Singapore ➔ Yokohama' },
    { id: 'SH-2048', source: 'AIS Transponder #8842', vessel: 'MV Tokyo Express', speed: '18.2 kn', heading: '065° ENE', lat: '18.95 N', lng: '72.95 E', status: 'Optimal', corridor: 'Mumbai ➔ Yokohama (Direct)' },
    { id: 'SH-2050', source: 'Tuas Marine Radar Station', vessel: 'Maersk Mc-Kinney', speed: '19.5 kn', heading: '280° W', lat: '1.29 N', lng: '103.85 E', status: 'Optimal', corridor: 'Singapore ➔ Rotterdam Gateway' },
  ]

  const liveTelemetry = [
    { label: 'Pacific Sea Swell', value: '2.8m', delta: '+0.4m in 1h', trend: 'up' },
    { label: 'Wind Velocity (Suez/Malacca)', value: '34 km/h', delta: 'Nominal gusts', trend: 'stable' },
    { label: 'Mean Port Dwell (Yokohama)', value: '31.4 hrs', delta: '+6.2h vs normal', trend: 'up' },
    { label: 'Fleet Fuel Burn Efficiency', value: '94.2%', delta: 'Optimal trim', trend: 'stable' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">REAL-TIME TELEMETRY & AIS STREAMS</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f]">Live Operations Command</h2>
          <p className="text-xs text-[#6e6e73]">Active satellite feeds, marine weather radars, and autonomous checkpoint telemetry</p>
        </div>

        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition cursor-pointer"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Live Operations KPIs */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {liveTelemetry.map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">{item.value}</p>
            <p className={`mt-1 text-xs ${item.trend === 'up' ? 'text-[#ff9f0a]' : 'text-[#34c759]'}`}>{item.delta}</p>
          </div>
        ))}
      </div>

      {/* 🚀 Checkpoints & Telemetry Ribbon */}
      <VoyageCheckpointsRibbon 
        voyageId={selectedVoyageId}
        onSelectCheckpoint={(cp) => setActiveCheckpoint(cp)}
      />

      {/* Real-time Feeds Grid */}
      <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-[#34c759] animate-pulse" />
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Active Fleet Vessels & Corridors</h3>
          </div>
          <span className="rounded-full bg-[#e8f8ed] px-2.5 py-0.5 text-[9px] font-semibold text-[#34c759]">
            3 BEACONS ONLINE
          </span>
        </div>

        <div className="space-y-3">
          {liveFeeds.map((feed) => {
            const isSelected = feed.id === selectedVoyageId
            return (
              <div 
                key={feed.id} 
                onClick={() => setSelectedVoyageId(feed.id)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-4 border transition cursor-pointer ${
                  isSelected 
                    ? 'bg-[#f0f7ff] border-[#087ef5] shadow-xs ring-1 ring-[#087ef5]/20' 
                    : 'bg-[#fafaf9] border-[#e5e5e7] hover:border-[#087ef5]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`flex size-9 items-center justify-center rounded-xl ${
                    isSelected ? 'bg-[#087ef5] text-white' : 'bg-[#087ef5]/10 text-[#087ef5]'
                  }`}>
                    <Ship className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[#1d1d1f]">{feed.vessel}</h4>
                      <span className="text-[9px] text-[#86868b]">({feed.id})</span>
                    </div>
                    <p className="text-[10px] text-[#86868b]">{feed.corridor} · Lat {feed.lat}, Lng {feed.lng}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-[9px] text-[#86868b] block">Speed / Heading</span>
                    <strong className="text-[#1d1d1f]">{feed.speed} · {feed.heading}</strong>
                  </div>

                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                    feed.status.includes('Warning') ? 'bg-[#fff5eb] text-[#ff9f0a]' : 'bg-[#e8f8ed] text-[#34c759]'
                  }`}>
                    {feed.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Negotiation Support — Abandonment Reason Ledger */}
      <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
        <NegotiationPanel voyageId={selectedVoyageId} />
      </div>
    </div>
  )
}

