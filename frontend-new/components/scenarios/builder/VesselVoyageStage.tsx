'use client'

import React from 'react'
import { Ship, ArrowRight, ArrowLeft } from 'lucide-react'

interface VesselVoyageStageProps {
  vesselName: string
  currentSpeedKnots: number
  scheduledTransitHours: number
  onChange: (fields: Partial<{ vesselName: string; currentSpeedKnots: number; scheduledTransitHours: number }>) => void
  onNext: () => void
  onPrev: () => void
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
      {label}
      {required && <span className="text-[#ff3b30]">*</span>}
      <span className="ml-auto text-[10px] font-normal text-[#86868b] bg-[#f5f5f7] px-1.5 py-0.5 rounded-md">edit to change</span>
    </label>
  )
}

export default function VesselVoyageStage({
  vesselName,
  currentSpeedKnots,
  scheduledTransitHours,
  onChange,
  onNext,
  onPrev
}: VesselVoyageStageProps) {
  const canProceed = vesselName.trim().length > 0

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 02 OF 04</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Vessel & Nautical Profile</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Each field is pre-filled with a suggested value — keep it or edit to match your vessel.
        </p>
      </div>

      <div className="space-y-4">
        {/* Vessel Name */}
        <div className="space-y-1.5">
          <FieldLabel label="Vessel Name & Class" required />
          <div className="relative">
            <Ship className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#86868b]" />
            <input
              type="text"
              value={vesselName}
              onChange={(e) => onChange({ vesselName: e.target.value })}
              className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] pl-9 pr-4 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white transition"
            />
          </div>
          <p className="text-[10px] text-[#86868b]">Enter vessel IMO name, TEU class, or AIS call sign</p>
        </div>

        {/* Speed Slider */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1d1d1f]">Baseline Cruising Speed</span>
              <p className="text-[10px] text-[#86868b] mt-0.5">Drag to adjust — current value shown</p>
            </div>
            <span className="font-mono text-sm font-bold text-[#087ef5]">{currentSpeedKnots.toFixed(1)} kn</span>
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
            <span>8.0 kn (Slow Steam)</span>
            <span>18.0 kn (Eco-Speed)</span>
            <span>24.0 kn (Full Speed)</span>
          </div>
        </div>

        {/* Scheduled Transit Hours */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1d1d1f]">Scheduled Transit SLA Window</span>
              <p className="text-[10px] text-[#86868b] mt-0.5">Drag to adjust — current value shown</p>
            </div>
            <span className="font-mono text-sm font-bold text-[#1d1d1f]">
              {scheduledTransitHours}h <span className="text-[#86868b] text-xs">({Math.round(scheduledTransitHours / 24)}d)</span>
            </span>
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
            <span>192h (8-Day Voyage)</span>
            <span>480h (20-Day Global)</span>
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
          disabled={!canProceed}
          className="flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf] transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Disruption Event <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
