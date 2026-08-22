'use client'

import React from 'react'
import { Check } from 'lucide-react'

interface BuilderProgressProps {
  currentStep: number
  steps: string[]
  onSelectStep: (step: number) => void
}

export default function BuilderProgress({ currentStep, steps, onSelectStep }: BuilderProgressProps) {
  return (
    <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {steps.map((stepName, idx) => {
          const stepNum = idx + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep

          return (
            <button
              key={stepName}
              onClick={() => onSelectStep(stepNum)}
              disabled={stepNum > currentStep}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition text-left ${
                isCurrent 
                  ? 'bg-[#087ef5]/10 text-[#087ef5] font-bold ring-1 ring-[#087ef5]/30' 
                  : isCompleted 
                  ? 'bg-[#e8f8ed] text-[#34c759] font-medium hover:bg-[#d8f2df]' 
                  : 'text-[#86868b] opacity-60 cursor-not-allowed'
              }`}
            >
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isCompleted 
                  ? 'bg-[#34c759] text-white' 
                  : isCurrent 
                  ? 'bg-[#087ef5] text-white' 
                  : 'bg-[#e5e5e7] text-[#6e6e73]'
              }`}>
                {isCompleted ? <Check className="size-3" /> : stepNum}
              </span>
              <span className="text-xs font-semibold whitespace-nowrap">{stepName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
