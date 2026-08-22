'use client'

import React from 'react'
import { DollarSign, Fuel, AlertOctagon, TrendingDown, ArrowRight, ArrowLeft } from 'lucide-react'
import { CostBusinessInput } from '@/lib/types'

interface CostBusinessStageProps {
  costRules: CostBusinessInput
  onChange: (fields: Partial<CostBusinessInput>) => void
  onNext: () => void
  onPrev: () => void
}

export default function CostBusinessStage({
  costRules,
  onChange,
  onNext,
  onPrev
}: CostBusinessStageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 05 OF 06</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Financial & Contractual Parameters</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Configure contractual demurrage rates, inventory stockout penalties, and bunker fuel prices.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Fuel Cost */}
        <div className="space-y-1.5 rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d1d1f]">VLSFO Bunker Fuel Price</span>
            <span className="font-mono text-xs font-bold text-[#087ef5]">
              ${costRules.fuelCostPerTonUsd} / Ton
            </span>
          </div>
          <input
            type="number"
            value={costRules.fuelCostPerTonUsd}
            onChange={(e) => onChange({ fuelCostPerTonUsd: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>

        {/* Demurrage Rate */}
        <div className="space-y-1.5 rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d1d1f]">Contractual Demurrage Rate</span>
            <span className="font-mono text-xs font-bold text-[#ff9f0a]">
              ${costRules.demurrageRatePerHourUsd} / Hour
            </span>
          </div>
          <input
            type="number"
            value={costRules.demurrageRatePerHourUsd}
            onChange={(e) => onChange({ demurrageRatePerHourUsd: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>

        {/* Stockout Penalty */}
        <div className="space-y-1.5 rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d1d1f]">Downstream Factory Stockout Penalty</span>
            <span className="font-mono text-xs font-bold text-[#ff3b30]">
              ${costRules.stockoutPenaltyPerDayUsd.toLocaleString()} / Day
            </span>
          </div>
          <input
            type="number"
            value={costRules.stockoutPenaltyPerDayUsd}
            onChange={(e) => onChange({ stockoutPenaltyPerDayUsd: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>

        {/* Total Cargo Value */}
        <div className="space-y-1.5 rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d1d1f]">Total Manifest Cargo Value</span>
            <span className="font-mono text-xs font-bold text-[#34c759]">
              ${(costRules.cargoValueUsd / 1000000).toFixed(1)}M USD
            </span>
          </div>
          <input
            type="number"
            value={costRules.cargoValueUsd}
            onChange={(e) => onChange({ cargoValueUsd: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
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
          Next: Review & Run Simulation <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
