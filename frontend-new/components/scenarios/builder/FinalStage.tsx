'use client'

import React, { useState } from 'react'
import { ArrowLeft, Play, Sparkles, DollarSign, Shield } from 'lucide-react'
import { ScenarioInput } from '@/lib/types'

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider">
      {label}
      <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-[#86868b] bg-[#f5f5f7] px-1.5 py-0.5 rounded-md">edit to change</span>
    </label>
  )
}

interface FinalStageProps {
  input: ScenarioInput
  isSubmitting: boolean
  onChangeConstraints: (fields: Partial<ScenarioInput['constraints']>) => void
  onChangeCostRules: (fields: Partial<ScenarioInput['costRules']>) => void
  onSubmit: () => void
  onPrev: () => void
}

export default function FinalStage({
  input,
  isSubmitting,
  onChangeConstraints,
  onChangeCostRules,
  onSubmit,
  onPrev
}: FinalStageProps) {
  const { constraints, costRules } = input

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 04 OF 04</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Business Rules & Launch Simulation</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Set solver constraints and financial parameters, then execute the 9-agent pipeline.
        </p>
      </div>

      {/* === CONSTRAINTS === */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
          <Shield className="size-3.5 text-[#087ef5]" /> Operational Constraints
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Max Budget */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1d1d1f]">Max Reroute Budget</span>
                <p className="text-[10px] text-[#86868b] mt-0.5">Drag to adjust — current value shown</p>
              </div>
              <span className="font-mono text-xs font-bold text-[#087ef5]">
                ${constraints.maxBudgetUsd.toLocaleString()}
              </span>
            </div>
            <input
              type="range" min="10000" max="150000" step="5000"
              value={constraints.maxBudgetUsd}
              onChange={(e) => onChangeConstraints({ maxBudgetUsd: parseInt(e.target.value) })}
              className="w-full accent-[#087ef5]"
            />
            <div className="flex justify-between text-[10px] text-[#86868b]">
              <span>$10k</span><span>$50k</span><span>$150k</span>
            </div>
          </div>

          {/* Max Delay */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1d1d1f]">Max Tolerable Delay</span>
                <p className="text-[10px] text-[#86868b] mt-0.5">Drag to adjust — current value shown</p>
              </div>
              <span className="font-mono text-xs font-bold text-[#ff9f0a]">
                {constraints.maxDelayHours}h
              </span>
            </div>
            <input
              type="range" min="6" max="96" step="6"
              value={constraints.maxDelayHours}
              onChange={(e) => onChangeConstraints({ maxDelayHours: parseInt(e.target.value) })}
              className="w-full accent-[#ff9f0a]"
            />
            <div className="flex justify-between text-[10px] text-[#86868b]">
              <span>6h (Critical)</span><span>24h</span><span>96h (Flexible)</span>
            </div>
          </div>
        </div>

        {/* Solver Toggles */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Solver Policy Toggles</h4>
          {[
            {
              key: 'allowTransshipment' as const,
              label: 'Allow Dynamic Intermediate Transshipment',
              desc: 'Permit container offloading at alternative hub (e.g. Tuas or Colombo)',
              color: '#087ef5'
            },
            {
              key: 'strictSla' as const,
              label: 'Enforce Strict Factory SLA Penalty',
              desc: 'Treat delivery delay past berth window as maximum financial penalty',
              color: '#087ef5'
            },
            {
              key: 'prioritizeCarbon' as const,
              label: 'Prioritize Low-Carbon Maritime Route',
              desc: 'Weight CO₂ emissions equally with delay in multi-objective loss function',
              color: '#34c759'
            },
          ].map(({ key, label, desc, color }) => (
            <label key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#fafaf9] border border-[#e5e5e7] cursor-pointer hover:bg-white transition">
              <div>
                <p className="text-xs font-bold text-[#1d1d1f]">{label}</p>
                <p className="text-[10px] text-[#86868b] mt-0.5">{desc}</p>
              </div>
              <input
                type="checkbox"
                checked={constraints[key]}
                onChange={(e) => onChangeConstraints({ [key]: e.target.checked })}
                style={{ accentColor: color }}
                className="size-4 shrink-0 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </section>

      {/* === FINANCIAL PARAMETERS === */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
          <DollarSign className="size-3.5 text-[#087ef5]" /> Financial & Contractual Parameters
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'VLSFO Bunker Fuel', unit: '/ Ton', key: 'fuelCostPerTonUsd' as const, color: '#087ef5', prefix: '$' },
            { label: 'Demurrage Rate', unit: '/ Hour', key: 'demurrageRatePerHourUsd' as const, color: '#ff9f0a', prefix: '$' },
            { label: 'Stockout Penalty', unit: '/ Day', key: 'stockoutPenaltyPerDayUsd' as const, color: '#ff3b30', prefix: '$' },
            { label: 'Total Cargo Value', unit: 'USD', key: 'cargoValueUsd' as const, color: '#34c759', prefix: '$' },
          ].map(({ label, unit, key, color, prefix }) => (
            <div key={key} className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm space-y-2">
              <FieldLabel label={label} />
              <p style={{ color }} className="font-mono text-sm font-bold">
                {prefix}{Number(costRules[key]).toLocaleString()} <span className="text-[10px] font-normal text-[#86868b]">{unit}</span>
              </p>
              <input
                type="number"
                value={costRules[key]}
                onChange={(e) => onChangeCostRules({ [key]: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-3 py-1.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white transition"
              />
            </div>
          ))}
        </div>
      </section>

      {/* === SCENARIO SUMMARY === */}
      <section className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-4">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
          <Sparkles className="size-3.5 text-[#087ef5]" /> Scenario Summary
        </h3>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Shipment & Route</span>
            <p className="font-mono text-[11px] font-bold text-[#087ef5] mt-1">{input.shipmentId}</p>
            <p className="font-bold text-[#1d1d1f] mt-0.5 text-[11px]">{input.vesselName}</p>
            <p className="text-[#6e6e73] mt-0.5 text-[10px]">{input.origin} ➔ {input.destination}</p>
          </div>

          <div className="bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Disruption Profile</span>
            <p className="font-bold text-[#ff3b30] mt-1 text-[11px]">{input.disruption.type.replace(/_/g, ' ').toUpperCase()}</p>
            <p className="text-[#6e6e73] mt-0.5 text-[10px]">{input.disruption.affectedNode}</p>
            {input.disruption.severity > 0 && (
              <p className="text-[10px] font-mono text-[#ff9f0a] mt-0.5">Severity: {input.disruption.severity}%</p>
            )}
          </div>

          <div className="bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Solver Limits</span>
            <p className="font-bold text-[#1d1d1f] mt-1 text-[11px]">Budget: ${constraints.maxBudgetUsd.toLocaleString()}</p>
            <p className="text-[#6e6e73] mt-0.5 text-[10px]">Max Delay: {constraints.maxDelayHours}h · Strict SLA: {constraints.strictSla ? 'Yes' : 'No'}</p>
            <p className="text-[10px] text-[#6e6e73] mt-0.5">Carbon Priority: {constraints.prioritizeCarbon ? 'On' : 'Off'}</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#1d1d1f] px-4 py-3.5 text-white space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#34c759]">
            <Sparkles className="size-3.5" /> 9-Agent Pipeline Execution Plan
          </div>
          <p className="text-[10px] text-[#a1a1a6] leading-relaxed">
            Upon triggering, Agent 01–09 (ExtraTrees Classifier, LightGBM ETA Predictor, OR-Tools CP-SAT Solver, Monte Carlo Digital Twin ×500 samples) will compute Pareto-optimal reroutes, calculate demurrage savings, and generate a Port Authority EDI notice.
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between pt-4 border-t border-[#f0f0f2]">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 rounded-xl border border-[#d2d2d7] px-4 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7] transition disabled:opacity-50"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2.5 rounded-xl bg-[#1d1d1f] px-7 py-3 text-xs font-bold text-white shadow-lg hover:bg-black transition active:scale-95 disabled:opacity-50"
        >
          <Play className={`size-4 text-[#087ef5] ${isSubmitting ? 'animate-pulse' : ''}`} />
          {isSubmitting ? 'Running 9-Agent Simulation...' : 'Execute Scenario Simulation'}
        </button>
      </div>
    </div>
  )
}
