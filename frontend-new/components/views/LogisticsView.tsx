'use client'

import React, { useState } from 'react'
import { Ship, Navigation, Plus, Search, MapPin, AlertTriangle, ShieldCheck, ArrowRight, Gauge, Radio } from 'lucide-react'
import { ShipmentItem } from '@/lib/mockData'
import StatusBadge from '@/components/ui/StatusBadge'

interface LogisticsViewProps {
  shipments: ShipmentItem[]
  onSelectShipment: (shipment: ShipmentItem) => void
  onCreateShipment: (shipment: ShipmentItem) => void
}

export default function LogisticsView({ shipments, onSelectShipment, onCreateShipment }: LogisticsViewProps) {
  const [selectedVessel, setSelectedVessel] = useState<ShipmentItem>(shipments[0])
  const [isCreating, setIsCreating] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isPinging, setIsPinging] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<{ plan: string; savings: string; eta: string } | null>(null)
  const [pingFeedback, setPingFeedback] = useState<string | null>(null)

  // Form State
  const [vessel, setVessel] = useState('')
  const [origin, setOrigin] = useState('Jawaharlal Nehru Port (Mumbai, IN)')
  const [destination, setDestination] = useState('Port of Yokohama (JP)')
  const [containers, setContainers] = useState(3500)
  const [speed, setSpeed] = useState('17.5 kn')

  const handleOptimizeRoute = () => {
    setIsOptimizing(true)
    setOptimizationResult(null)
    setTimeout(() => {
      setIsOptimizing(false)
      setOptimizationResult({
        plan: 'Plan B: Southern Weather Bypass (Pareto Optimal)',
        savings: '$42,000 USD Net Loss Reduction (-63%)',
        eta: 'Nov 24, 2026 14:00 UTC (1.8d saved)'
      })
    }, 1200)
  }

  const handleRequestAisPing = () => {
    setIsPinging(true)
    setPingFeedback(null)
    setTimeout(() => {
      setIsPinging(false)
      setPingFeedback(`Live Fix Confirmed · Lat 18.95°N Lon 72.95°E · SOG ${selectedVessel.speed} · COG 065° ENE`)
    }, 1000)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vessel) return
    const newShipment: ShipmentItem = {
      id: `SH-${Math.floor(1000 + Math.random() * 9000)}`,
      trackingId: `TRK-2026-00${shipments.length + 1}`,
      vessel,
      origin,
      destination,
      eta: 'Dec 05, 2026',
      speed,
      containers: Number(containers),
      status: 'On Schedule',
      riskFactor: 15
    }
    onCreateShipment(newShipment)
    setSelectedVessel(newShipment)
    setIsCreating(false)
    setVessel('')
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">MARITIME AIS FLEET & ROUTING</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f]">Logistics & Fleet Operations</h2>
          <p className="text-xs text-[#6e6e73]">Live AIS satellite tracking, active sea voyages, and OR-Tools route optimization</p>
        </div>

        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition"
        >
          <Plus className="size-4" /> Create Sea Voyage
        </button>
      </div>

      {/* Fleet Summary KPI */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">ACTIVE FLEETS</p>
          <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">{shipments.length} Vessels</p>
          <p className="mt-1 text-xs text-[#34c759]">100% AIS beacon synced</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">TOTAL TEU CAPACITY</p>
          <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">{shipments.reduce((a,c) => a + c.containers, 0).toLocaleString()} TEUs</p>
          <p className="mt-1 text-xs text-[#6e6e73]">In ocean transit</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">AVERAGE SPEED</p>
          <p className="mt-2 text-2xl font-bold text-[#087ef5]">16.8 Knots</p>
          <p className="mt-1 text-xs text-[#34c759]">Fuel burn optimal</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">AT RISK VOYAGES</p>
          <p className="mt-2 text-2xl font-bold text-[#ff9f0a]">{shipments.filter(s => s.status !== 'On Schedule').length} Voyages</p>
          <p className="mt-1 text-xs text-[#ff9f0a]">Requires route recovery</p>
        </div>
      </div>

      {/* Main Logistics Grid */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_.9fr]">
        
        {/* Active Voyages List */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[.15em] text-[#86868b] uppercase">ACTIVE TRANSIT VOYAGES</p>
          
          {shipments.map((shipment) => {
            const isSelected = selectedVessel.id === shipment.id
            return (
              <div 
                key={shipment.id}
                onClick={() => {
                  setSelectedVessel(shipment)
                  onSelectShipment(shipment)
                }}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                  isSelected 
                    ? 'border-[#087ef5] bg-white shadow-md ring-2 ring-[#087ef5]/10' 
                    : 'border-[#e5e5e7] bg-[#fafaf9] hover:bg-white hover:border-[#d2d2d7]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 items-center justify-center rounded-xl ${
                      shipment.status === 'At Risk' ? 'bg-[#ffebe8] text-[#ff3b30]' : 'bg-[#e8f8ed] text-[#34c759]'
                    }`}>
                      <Ship className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#1d1d1f]">{shipment.vessel}</h4>
                      <p className="text-[10px] font-mono text-[#86868b]">{shipment.trackingId} · {shipment.id}</p>
                    </div>
                  </div>

                  <StatusBadge status={shipment.status} size="sm" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-[#f0f0f2] pt-2.5 text-[#6e6e73]">
                  <div>
                    <span className="text-[9px] text-[#86868b] block">Origin:</span>
                    <p className="font-medium text-[#1d1d1f] truncate">{shipment.origin}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#86868b] block">Destination:</span>
                    <p className="font-medium text-[#1d1d1f] truncate">{shipment.destination}</p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#86868b]">
                  <span>Speed: <strong className="text-[#1d1d1f]">{shipment.speed}</strong></span>
                  <span>Manifest: <strong className="text-[#1d1d1f]">{shipment.containers} TEU</strong></span>
                  <span>ETA: <strong className="text-[#087ef5]">{shipment.eta}</strong></span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Vessel Telemetry & Action Drawer */}
        <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
            <div>
              <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">TELEMETRY INSPECTOR</p>
              <h3 className="mt-1 text-lg font-semibold text-[#1d1d1f]">{selectedVessel.vessel}</h3>
            </div>
            <span className="rounded-full bg-[#f0f0f2] px-2.5 py-1 text-[9px] font-mono text-[#6e6e73]">
              {selectedVessel.trackingId}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-xl bg-[#fafaf9] p-3 border border-[#e5e5e7]">
              <span className="text-[9px] font-semibold text-[#86868b] uppercase">Disruption Probability</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xl font-bold text-[#1d1d1f]">{selectedVessel.riskFactor}%</span>
                <span className={`text-[10px] font-semibold ${selectedVessel.riskFactor > 50 ? 'text-[#ff3b30]' : 'text-[#34c759]'}`}>
                  {selectedVessel.riskFactor > 50 ? 'Severe Disruption Risk' : 'Nominal Transit'}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e5e5e7]">
                <div 
                  className={`h-full ${selectedVessel.riskFactor > 50 ? 'bg-[#ff3b30]' : 'bg-[#34c759]'}`}
                  style={{ width: `${selectedVessel.riskFactor}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <p className="flex justify-between"><span className="text-[#86868b]">Vessel Capacity:</span> <strong className="text-[#1d1d1f]">{selectedVessel.containers} TEUs</strong></p>
              <p className="flex justify-between"><span className="text-[#86868b]">Current Speed:</span> <strong className="text-[#1d1d1f]">{selectedVessel.speed}</strong></p>
              <p className="flex justify-between"><span className="text-[#86868b]">Estimated Schedule:</span> <strong className="text-[#087ef5]">{selectedVessel.eta}</strong></p>
              <p className="flex justify-between"><span className="text-[#86868b]">Departure Port:</span> <strong className="text-[#1d1d1f]">{selectedVessel.origin}</strong></p>
              <p className="flex justify-between"><span className="text-[#86868b]">Arrival Port:</span> <strong className="text-[#1d1d1f]">{selectedVessel.destination}</strong></p>
            </div>

            <div className="pt-4 border-t border-[#e5e5e7] space-y-2">
              <button 
                onClick={handleOptimizeRoute}
                disabled={isOptimizing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#087ef5] py-2.5 text-xs font-semibold text-white hover:bg-[#076ecf] transition active:scale-98 disabled:opacity-50"
              >
                <Navigation className={`size-3.5 ${isOptimizing ? 'animate-spin' : ''}`} /> 
                {isOptimizing ? 'Solving CP-SAT Optimizer...' : 'Re-optimize Route (OR-Tools)'}
              </button>

              <button 
                onClick={handleRequestAisPing}
                disabled={isPinging}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#d2d2d7] bg-white py-2.5 text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition active:scale-98 disabled:opacity-50"
              >
                <Radio className={`size-3.5 text-[#087ef5] ${isPinging ? 'animate-pulse' : ''}`} /> 
                {isPinging ? 'Interrogating Transponder...' : 'Request AIS Ping Stream'}
              </button>

              {/* Optimization Result Feedback */}
              {optimizationResult && (
                <div className="mt-2 rounded-xl bg-[#e8f8ed] p-3 border border-[#34c759]/30 text-[11px] text-[#1d1d1f] space-y-1 animate-in fade-in">
                  <p className="font-bold text-[#15803d]">✓ Route Solved: {optimizationResult.plan}</p>
                  <p className="text-[#1d1d1f]">{optimizationResult.savings}</p>
                  <p className="text-[10px] text-[#6e6e73]">New Recovered ETA: {optimizationResult.eta}</p>
                </div>
              )}

              {/* AIS Ping Result Feedback */}
              {pingFeedback && (
                <div className="mt-2 rounded-xl bg-[#fafaf9] p-3 border border-[#087ef5]/30 text-[11px] text-[#1d1d1f] space-y-1 animate-in fade-in">
                  <p className="font-bold text-[#087ef5]">🛰️ AIS Satellite Telemetry Received</p>
                  <p className="font-mono text-[10px] text-[#6e6e73]">{pingFeedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Create Voyage Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d2d2d7] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Create New Sea Voyage</h3>
            <p className="text-xs text-[#86868b] mt-0.5">Register a vessel for active AIS tracking & disruption analysis</p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Vessel Name</label>
                <input 
                  value={vessel} 
                  onChange={e => setVessel(e.target.value)} 
                  placeholder="e.g. MV Pacific Voyager" 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Origin Port</label>
                <input 
                  value={origin} 
                  onChange={e => setOrigin(e.target.value)} 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Destination Port</label>
                <input 
                  value={destination} 
                  onChange={e => setDestination(e.target.value)} 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#6e6e73] mb-1">Containers (TEU)</label>
                  <input 
                    type="number"
                    value={containers} 
                    onChange={e => setContainers(Number(e.target.value))} 
                    className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#6e6e73] mb-1">Target Speed</label>
                  <input 
                    value={speed} 
                    onChange={e => setSpeed(e.target.value)} 
                    className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e5e7]">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)} 
                  className="rounded-xl px-4 py-2 text-xs font-medium text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-[#087ef5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#076ecf]"
                >
                  Launch Voyage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
