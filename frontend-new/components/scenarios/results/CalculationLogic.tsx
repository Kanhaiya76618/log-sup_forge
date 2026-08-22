'use client'

import React from 'react'
import { Calculator, ArrowRight } from 'lucide-react'
import { CalculationStep } from '@/lib/types'

interface CalculationLogicProps {
  steps: CalculationStep[]
}

export default function CalculationLogic({ steps }: CalculationLogicProps) {
  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-[#087ef5]" />
          <h3 className="text-sm font-bold text-[#1d1d1f]">Deterministic Mathematical Calculation Logic</h3>
        </div>
        <span className="text-xs text-[#86868b]">Cost & Delay Matrices</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((st, i) => (
          <div key={i} className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] flex flex-col justify-between">
            <div>
              <p className="flow-label text-[#087ef5]">{st.factor}</p>
              <p className="mt-1 text-[11px] font-mono text-[#6e6e73] leading-snug">{st.formula}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e5e5e7] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#86868b] block">Baseline</span>
                <span className="font-mono font-bold text-[#1d1d1f]">{st.baselineValue}</span>
              </div>
              <ArrowRight className="size-3.5 text-[#86868b]" />
              <div className="text-right">
                <span className="text-[10px] text-[#86868b] block">Result</span>
                <span className="font-mono font-bold text-[#087ef5]">{st.disruptedValue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
