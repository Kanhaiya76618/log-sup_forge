'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import BuilderProgress from '@/components/scenarios/builder/BuilderProgress'
import ShipmentStage from '@/components/scenarios/builder/ShipmentStage'
import VesselVoyageStage from '@/components/scenarios/builder/VesselVoyageStage'
import DisruptionStage from '@/components/scenarios/builder/DisruptionStage'
import FinalStage from '@/components/scenarios/builder/FinalStage'
import { ScenarioInput } from '@/lib/types'
import { evaluateScenarioInput } from '@/lib/scenarioData'

const steps = [
  'Shipment & Route',
  'Vessel Profile',
  'Disruption Event',
  'Rules & Run'
]

export default function NewScenarioPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<ScenarioInput>({
    id: `SCN-${Date.now().toString().slice(-6)}`,
    title: 'Typhoon Swell & South China Sea Reroute Analysis',
    shipmentId: 'SH-4092',
    vesselName: 'CSCL Globe Supermax (19,100 TEU)',
    origin: 'Jawaharlal Nehru Port (Mumbai, IN)',
    destination: 'Port of Yokohama (JP)',
    transshipmentHub: 'Singapore Tuas Hub (SG)',
    currentSpeedKnots: 14.2,
    scheduledTransitHours: 192,
    disruption: {
      type: 'severe_weather',
      severity: 0,
      affectedNode: 'South China Sea / Luzon Strait',
      predictedDelayHours: 0,
      waveHeightMeters: 0,
      windSpeedKmh: 0,
      description: ''
    },
    constraints: {
      maxBudgetUsd: 50000,
      maxDelayHours: 24,
      allowTransshipment: true,
      prioritizeCarbon: false,
      strictSla: true
    },
    costRules: {
      fuelCostPerTonUsd: 620,
      demurrageRatePerHourUsd: 850,
      stockoutPenaltyPerDayUsd: 12000,
      carbonTaxPerTonUsd: 65,
      cargoValueUsd: 35200000
    },
    createdAt: new Date().toISOString()
  })

  const updateFormData = (fields: Partial<ScenarioInput>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }

  const updateDisruption = (fields: Partial<ScenarioInput['disruption']>) => {
    setFormData(prev => ({ ...prev, disruption: { ...prev.disruption, ...fields } }))
  }

  const updateConstraints = (fields: Partial<ScenarioInput['constraints']>) => {
    setFormData(prev => ({ ...prev, constraints: { ...prev.constraints, ...fields } }))
  }

  const updateCostRules = (fields: Partial<ScenarioInput['costRules']>) => {
    setFormData(prev => ({ ...prev, costRules: { ...prev.costRules, ...fields } }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    const result = evaluateScenarioInput(formData)
    router.push(`/scenarios/${result.id}`)
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#1d1d1f] selection:bg-[#087ef5] selection:text-white">
      {/* Header */}
      <header className="fixed inset-x-4 top-4 z-50 mx-auto flex h-14 max-w-[1600px] items-center justify-between rounded-2xl border border-[#d2d2d7]/70 bg-white/80 px-4 shadow-[0_12px_40px_rgba(0,0,0,.08)] backdrop-blur-2xl md:inset-x-8 md:px-5">
        <a href="/dashboard" className="flex items-center gap-2 text-xs font-semibold tracking-[-.02em]">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#1d1d1f]">
            <span className="size-1.5 rounded-full bg-white" />
          </span>
          <span>FLOWFORGE</span>
          <span className="hidden xl:inline text-[#86868b] font-normal">/ SCENARIO BUILDER</span>
        </a>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
            Step {currentStep} of {steps.length}
          </span>
          <a
            href="/scenarios"
            className="text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition"
          >
            Cancel & Exit
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-4 pb-20 pt-28 space-y-5">
        <BuilderProgress
          currentStep={currentStep}
          steps={steps}
          onSelectStep={(step) => setCurrentStep(step)}
        />

        <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 sm:p-8 shadow-sm">
          {currentStep === 1 && (
            <ShipmentStage
              shipmentId={formData.shipmentId}
              title={formData.title}
              origin={formData.origin}
              destination={formData.destination}
              transshipmentHub={formData.transshipmentHub || ''}
              onChange={updateFormData}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <VesselVoyageStage
              vesselName={formData.vesselName}
              currentSpeedKnots={formData.currentSpeedKnots}
              scheduledTransitHours={formData.scheduledTransitHours}
              onChange={updateFormData}
              onNext={() => setCurrentStep(3)}
              onPrev={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <DisruptionStage
              disruption={formData.disruption}
              onChange={updateDisruption}
              onNext={() => setCurrentStep(4)}
              onPrev={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <FinalStage
              input={formData}
              isSubmitting={isSubmitting}
              onChangeConstraints={updateConstraints}
              onChangeCostRules={updateCostRules}
              onSubmit={handleSubmit}
              onPrev={() => setCurrentStep(3)}
            />
          )}
        </div>
      </div>
    </main>
  )
}
