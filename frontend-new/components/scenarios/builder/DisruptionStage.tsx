'use client'

import React from 'react'
import { CloudLightning, Anchor, AlertTriangle, Waves, Wind, ArrowRight, ArrowLeft } from 'lucide-react'
import { DisruptionInput } from '@/lib/types'

interface DisruptionStageProps {
  disruption: DisruptionInput
  onChange: (fields: Partial<DisruptionInput>) => void
  onNext: () => void
  onPrev: () => void
}

const disruptionTypes: Array<{
  id: DisruptionInput['type']
  label: string
  icon: any
  desc: string
}> = [
  {
    id: 'severe_weather',
    label: 'Tropical Storm / Swell',
    icon: Waves,
    desc: 'High wave swells and heavy headwinds causing vessel speed degradation.'
  },
  {
    id: 'port_congestion',
    label: 'Port Terminal Congestion',
    icon: Anchor,
    desc: 'Severe berth queue and quay crane backlog delaying discharge.'
  },
  {
    id: 'canal_blockage',
    label: 'Chokepoint / Canal Delay',
    icon: AlertTriangle,
    desc: 'Malacca Strait or Suez transit bottleneck requiring route diversion.'
  },
  {
    id: 'labor_strike',
    label: 'Dockworker Labor Strike',
    icon: CloudLightning,
    desc: 'Terminal operations suspended with zero crane throughput.'
  }
]

export default function DisruptionStage({
  disruption,
  onChange,
  onNext,
  onPrev
}: DisruptionStageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 03 OF 06</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Disruption Profile & Severity</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Define the nature, location, and quantitative parameters of the disruption event.
        </p>
      </div>

      {/* Disruption Type Grid */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#1d1d1f]">Disruption Category</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {disruptionTypes.map((t) => {
            const isSelected = disruption.type === t.id
            const Icon = t.icon
            return (
              <div
                key={t.id}
                onClick={() => onChange({ type: t.id })}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-[#087ef5] bg-[#f0f7ff] shadow-md ring-2 ring-[#087ef5]/15'
                    : 'border-[#e5e5e7] bg-[#fafaf9] hover:bg-white hover:border-[#d2d2d7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex size-9 items-center justify-center rounded-xl ${
                    isSelected ? 'bg-[#087ef5] text-white' : 'bg-[#e5e5e7] text-[#6e6e73]'
                  }`}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1d1d1f]">{t.label}</h4>
                    <p className="text-[10px] text-[#86868b] leading-tight mt-0.5">{t.desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Affected Node & Description */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1d1d1f]">Affected Geographic Node / Terminal</label>
          <input
            type="text"
            value={disruption.affectedNode}
            onChange={(e) => onChange({ affectedNode: e.target.value })}
            placeholder="e.g. South China Sea / Luzon Strait"
            className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1d1d1f]">Event Summary</label>
          <input
            type="text"
            value={disruption.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="e.g. 3.4m wave swell causing 21.1% speed loss"
            className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>
      </div>

      {/* Severity & Quantitative Sliders */}
      <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d1d1f]">Disruption Severity Index</span>
            <span className={`flow-badge ${
              disruption.severity >= 70 ? 'bg-[#ffebe8] text-[#ff3b30]' : disruption.severity >= 45 ? 'bg-[#fff4e5] text-[#ff9f0a]' : 'bg-[#e8f8ed] text-[#34c759]'
            }`}>
              {disruption.severity}% ({disruption.severity >= 70 ? 'CRITICAL' : disruption.severity >= 45 ? 'HIGH' : 'MODERATE'})
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={disruption.severity}
            onChange={(e) => onChange({ severity: parseInt(e.target.value) })}
            className="w-full accent-[#ff3b30]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#f0f0f2]">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#6e6e73]">Wave Swell Amplitude</span>
              <strong className="font-mono text-[#1d1d1f]">{disruption.waveHeightMeters || 2.8}m</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.1"
              value={disruption.waveHeightMeters || 2.8}
              onChange={(e) => onChange({ waveHeightMeters: parseFloat(e.target.value) })}
              className="w-full accent-[#087ef5]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#6e6e73]">Wind Gust Velocity</span>
              <strong className="font-mono text-[#1d1d1f]">{disruption.windSpeedKmh || 45} km/h</strong>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={disruption.windSpeedKmh || 45}
              onChange={(e) => onChange({ windSpeedKmh: parseInt(e.target.value) })}
              className="w-full accent-[#087ef5]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#f0f0f2]">
        <button
          onClick={onPrev}
          className="flex items-center gap-1.5 rounded-xl border border-[#d2d2d7] px-4 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7] transition"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf] transition active:scale-95"
        >
          Next: Operational Constraints <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
