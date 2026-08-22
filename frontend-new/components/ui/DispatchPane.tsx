'use client'

import React from 'react'
import { X, MapPin, Zap, Layers3, ArrowRight } from 'lucide-react'
import { Globe, Marker, Arc } from '@/components/ui/cobe-globe'
import { GLOBE_MARKERS as globeMarkers, GLOBE_ARCS as globeArcs } from '@/lib/config'
import StatusBadge from './StatusBadge'

export default function DispatchPane({
  onClose,
  onNavigateToTab,
  activeLayers,
  onToggleLayer
}: DispatchPaneProps) {
  return (
    <aside className="fixed inset-x-4 bottom-4 z-40 max-h-[calc(100vh-7rem)] overflow-auto rounded-[32px] border border-white/90 bg-white/85 p-5 shadow-[0_24px_60px_rgba(0,0,0,.12),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(0,0,0,0.02)] backdrop-blur-2xl md:static md:block md:w-[330px] md:shrink-0 md:rounded-[32px] md:p-5">
      {/* Pane Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e7]/80 pb-3">
        <div>
          <p className="flow-label text-[#087ef5]">DISPATCH PANE</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1d1d1f]">Live Brief</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close drawer"
          className="rounded-full p-2 text-[#86868b] hover:bg-[#f5f5f7] transition"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 3D Earth Globe Clay-Glass Card */}
      <div className="mt-4 rounded-3xl border border-white/90 bg-white/70 p-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-md">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[9px] font-bold tracking-[.14em] text-[#087ef5] uppercase">3D Earth Corridors</span>
          <span className="text-[8px] text-[#86868b] font-medium">Scroll to Zoom</span>
        </div>
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/90 border border-white/90 shadow-inner">
          <Globe
            markers={globeMarkers}
            arcs={globeArcs}
            markerColor={[0.03, 0.52, 1]}
            baseColor={[1, 1, 1]}
            arcColor={[0.03, 0.52, 1]}
            glowColor={[0.92, 0.95, 1]}
            dark={0}
            speed={0.005}
          />
        </div>
        <button
          onClick={() => onNavigateToTab('suppliers')}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#087ef5] py-2.5 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(8,126,245,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)] hover:bg-[#076ecf] transition active:scale-95"
        >
          <MapPin className="size-3.5" /> Track Shipment (2D Map)
        </button>
      </div>

      {/* Port Disruption Target Alert — Clay Card */}
      <div className="mt-4 rounded-3xl bg-[#fafaf9] p-4 border border-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,0.95)]">
        <div className="flex items-center justify-between">
          <span className="flow-label text-[#6e6e73]">YOKOHAMA PORT</span>
          <StatusBadge status="AT RISK" variant="danger" />
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight text-[#1d1d1f]">82%</p>
        <p className="text-xs text-[#86868b] font-medium">Disruption probability</p>
        
        <button 
          onClick={() => onNavigateToTab('decision-agents')} 
          className="mt-4 flex w-full items-center justify-between rounded-full bg-[#1d1d1f] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.25)] hover:bg-black transition active:scale-95"
        >
          RUN SIMULATION <Zap className="size-3.5 text-[#ff9f0a]" />
        </button>
      </div>

      {/* Network Layers Toggles */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="flow-label text-[#86868b]">Network Layers</p>
          <Layers3 className="size-4 text-[#86868b]" />
        </div>
        <div className="mt-3 space-y-2">
          {['VESSELS', 'PORTS', 'ROUTES'].map(layer => (
            <button 
              key={layer} 
              onClick={() => onToggleLayer(layer)} 
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2 text-left text-xs font-bold hover:bg-[#f5f5f7] transition"
            >
              <span className={`size-2 rounded-full ${activeLayers.includes(layer) ? 'bg-[#087ef5] shadow-[0_0_6px_#087ef5]' : 'bg-[#d2d2d7]'}`} />
              <span className="font-bold text-[#1d1d1f]">{layer}</span>
              <span className="ml-auto text-[10px] font-bold text-[#86868b]">{activeLayers.includes(layer) ? 'ON' : 'OFF'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Scenario Builder Entry */}
      <div className="mt-6 rounded-3xl bg-[#087ef5]/5 p-4 border border-[#087ef5]/20 shadow-[0_8px_20px_rgba(8,126,245,0.04),inset_0_2px_4px_rgba(255,255,255,0.95)]">
        <p className="flow-label text-[#087ef5]">SCENARIO BUILDER</p>
        <h4 className="mt-1 text-xs font-bold text-[#1d1d1f]">Simulate Custom Disruptions</h4>
        <p className="mt-1 text-[11px] text-[#6e6e73] leading-relaxed font-medium">
          Create customized weather, labor strike, or port blockage scenarios with the 6-stage wizard.
        </p>
        <a 
          href="/scenarios/new"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-[#087ef5] py-2 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(8,126,245,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)] hover:bg-[#076ecf] transition active:scale-95"
        >
          Create Scenario <ArrowRight className="size-3.5" />
        </a>
      </div>
    </aside>
  )
}
