'use client'

import React from 'react'
import { Ship, Gauge, Clock, ArrowRight, ArrowLeft } from 'lucide-react'

interface VesselVoyageStageProps {
  vesselName: string
  currentSpeedKnots: number
  scheduledTransitHours: number
  onChange: (fields: Partial<{ vesselName: string; currentSpeedKnots: number; scheduledTransitHours: number }>) => void
  onNext: () => void
  onPrev: () => void
}

export default function VesselVoyageStage({
  vesselName,
  currentSpeedKnots,
  scheduledTransitHours,
  onChange,
  onNext,
  onPrev
}: VesselVoyageStageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 02 OF 06</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Vessel & Nautical Telemetry</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Configure vessel cruising speed, baseline transit SLA, and maritime fuel profile.
        </p>
      </div>

      <div className="space-y-4">
        {/* Vessel Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1d1d1f]">Vessel Name & Class</label>
          <input
            type="text"
            value={vesselName}
            onChange={(e) => onChange({ vesselName: e.target.value })}
            placeholder="e.g. CSCL Globe Supermax (19,100 TEU Ultra-Large Container Vessel)"
            className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>

        {/* Speed Slider */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d1d1f]">Current Cruising Speed</span>
            <span className="font-mono text-sm font-bold text-[#087ef5]">{currentSpeedKnots} Knots</span>
          </div>
          <input
            type="range"
            min="8.0"
            max="24.0"
            step="0.2"
            value={currentSpeedKnots}
            onChange={(e) => onChange({ currentSpeedKnots: parseFloat(e.target.value) })}
            className="w-full accent-[#087ef5]"
          />
          <div className="flex justify-between text-[10px] text-[#86868b]">
            <span>8.0 kn (Slow Steaming)</span>
            <span>18.0 kn (Nominal Eco-Speed)</span>
            <span>24.0 kn (Max Speed Burn)</span>
          </div>
        </div>

        {/* Scheduled Transit Hours */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d1d1f]">Scheduled Transit SLA Window</span>
            <span className="font-mono text-sm font-bold text-[#1d1d1f]">{scheduledTransitHours} Hours ({Math.round(scheduledTransitHours / 24)} Days)</span>
          </div>
          <input
            type="range"
            min="72"
            max="480"
            step="12"
            value={scheduledTransitHours}
            onChange={(e) => onChange({ scheduledTransitHours: parseInt(e.target.value) })}
            className="w-full accent-[#1d1d1f]"
          />
          <div className="flex justify-between text-[10px] text-[#86868b]">
            <span>72h (Short Feeder)</span>
            <span>192h (8-Day Ocean Voyage)</span>
            <span>480h (20-Day Global Transit)</span>
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
          Next: Disruption Inputs <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
