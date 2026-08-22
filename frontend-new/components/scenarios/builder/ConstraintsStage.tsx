'use client'

import React from 'react'
import { Shield, Clock, DollarSign, Leaf, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { ConstraintInput } from '@/lib/types'

interface ConstraintsStageProps {
  constraints: ConstraintInput
  onChange: (fields: Partial<ConstraintInput>) => void
  onNext: () => void
  onPrev: () => void
}

export default function ConstraintsStage({
  constraints,
  onChange,
  onNext,
  onPrev
}: ConstraintsStageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 04 OF 06</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Operational Constraints & Solvers</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Set mathematical boundary limits for Google OR-Tools CP-SAT solver.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Max Budget Limit */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#1d1d1f]">Maximum Reroute Surcharge Budget</span>
            <span className="font-mono text-xs font-bold text-[#087ef5]">
              ${constraints.maxBudgetUsd.toLocaleString()} USD
            </span>
          </div>
          <input
            type="range"
            min="10000"
            max="150000"
            step="5000"
            value={constraints.maxBudgetUsd}
            onChange={(e) => onChange({ maxBudgetUsd: parseInt(e.target.value) })}
            className="w-full accent-[#087ef5]"
          />
          <div className="flex justify-between text-[10px] text-[#86868b]">
            <span>$10,000 (Strict Cap)</span>
            <span>$50,000 (Nominal)</span>
            <span>$150,000 (Emergency)</span>
          </div>
        </div>

        {/* Max Delay Tolerance */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#1d1d1f]">Maximum Tolerable Delay Window</span>
            <span className="font-mono text-xs font-bold text-[#ff9f0a]">
              {constraints.maxDelayHours} Hours ({Math.round(constraints.maxDelayHours / 24)}d)
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="96"
            step="6"
            value={constraints.maxDelayHours}
            onChange={(e) => onChange({ maxDelayHours: parseInt(e.target.value) })}
            className="w-full accent-[#ff9f0a]"
          />
          <div className="flex justify-between text-[10px] text-[#86868b]">
            <span>6h (Critical SLA)</span>
            <span>24h (1 Day)</span>
            <span>96h (Flexible)</span>
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Solver Policy Toggles</h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border border-[#e5e5e7] cursor-pointer hover:bg-white transition">
            <div>
              <p className="text-xs font-bold text-[#1d1d1f]">Allow Dynamic Intermediate Transshipment</p>
              <p className="text-[10px] text-[#86868b]">Permit container offloading at alternative hub (e.g. Tuas or Colombo)</p>
            </div>
            <input
              type="checkbox"
              checked={constraints.allowTransshipment}
              onChange={(e) => onChange({ allowTransshipment: e.target.checked })}
              className="size-4 accent-[#087ef5] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border border-[#e5e5e7] cursor-pointer hover:bg-white transition">
            <div>
              <p className="text-xs font-bold text-[#1d1d1f]">Enforce Strict Factory SLA Penalty Threshold</p>
              <p className="text-[10px] text-[#86868b]">Treat delivery delay past berth window as maximum financial penalty</p>
            </div>
            <input
              type="checkbox"
              checked={constraints.strictSla}
              onChange={(e) => onChange({ strictSla: e.target.checked })}
              className="size-4 accent-[#087ef5] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border border-[#e5e5e7] cursor-pointer hover:bg-white transition">
            <div>
              <p className="text-xs font-bold text-[#1d1d1f]">Prioritize Low-Carbon Maritime Fuel Route</p>
              <p className="text-[10px] text-[#86868b]">Weigh CO2 emissions equally with voyage delay in multi-objective loss function</p>
            </div>
            <input
              type="checkbox"
              checked={constraints.prioritizeCarbon}
              onChange={(e) => onChange({ prioritizeCarbon: e.target.checked })}
              className="size-4 accent-[#34c759] cursor-pointer"
            />
          </label>
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
          Next: Cost & Business Rules <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
