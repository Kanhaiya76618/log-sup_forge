'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Send, Check, Sparkles, MapPin, Layers } from 'lucide-react'
import { getScenarioById, evaluateScenarioInput } from '@/lib/scenarioData'
import { AnalysisResult } from '@/lib/types'
import RecommendationCard from '@/components/scenarios/results/RecommendationCard'
import RouteComparison from '@/components/scenarios/results/RouteComparison'
import DisruptionSummary from '@/components/scenarios/results/DisruptionSummary'
import PipelineAnimation from '@/components/scenarios/results/PipelineAnimation'
import DecisionEvidence from '@/components/scenarios/results/DecisionEvidence'
import CalculationLogic from '@/components/scenarios/results/CalculationLogic'
import WhatIfAnalysis from '@/components/scenarios/results/WhatIfAnalysis'
import FactorsAndConstraints from '@/components/scenarios/results/FactorsAndConstraints'
import GlobalMap from '@/components/ui/GlobalMap'
import StatusBadge from '@/components/ui/StatusBadge'

export default function ScenarioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params?.id === 'string' ? params.id : 'SCN-2026-001'
  
  const [scenario, setScenario] = useState<AnalysisResult | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ROUTE-B')
  const [ediSent, setEdiSent] = useState(false)
  const [isRecomputing, setIsRecomputing] = useState(false)

  useEffect(() => {
    const loaded = getScenarioById(id)
    if (loaded) {
      setScenario(loaded)
      setSelectedRouteId(loaded.recommendedRoute.id)
    }
  }, [id])

  if (!scenario) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <p className="text-xs font-semibold text-[#86868b]">Loading scenario results...</p>
      </main>
    )
  }

  const handleRecompute = async () => {
    setIsRecomputing(true)
    await new Promise(r => setTimeout(r, 400))
    const recomputed = evaluateScenarioInput(scenario.scenarioInput)
    setScenario(recomputed)
    setIsRecomputing(false)
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#1d1d1f] selection:bg-[#087ef5] selection:text-white">
      {/* Top Floating Glass Header */}
      <header className="fixed inset-x-4 top-4 z-50 mx-auto flex h-14 max-w-[1600px] items-center justify-between rounded-2xl border border-[#d2d2d7]/70 bg-white/80 px-4 shadow-[0_12px_40px_rgba(0,0,0,.08)] backdrop-blur-2xl md:inset-x-8 md:px-5">
        <div className="flex items-center gap-3">
          <a
            href="/scenarios"
            className="flex items-center gap-1 text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition"
          >
            <ArrowLeft className="size-4" /> Scenarios
          </a>
          <span className="text-[#d2d2d7]">/</span>
          <span className="font-mono text-xs font-bold text-[#087ef5]">{scenario.id}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecompute}
            disabled={isRecomputing}
            className="flex items-center gap-1.5 rounded-xl border border-[#d2d2d7] bg-white px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
          >
            <RefreshCw className={`size-3.5 ${isRecomputing ? 'animate-spin' : ''}`} />
            Re-solve
          </button>
          <a
            href="/scenarios/new"
            className="flow-pill bg-[#087ef5] text-white shadow-sm hover:bg-[#076ecf]"
          >
            + New Scenario
          </a>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-28 md:px-8 space-y-6">
        
        {/* Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#087ef5]">{scenario.id}</span>
              <StatusBadge status={scenario.riskLevel === 'critical' ? 'CRITICAL DISRUPTION' : 'HIGH RISK'} variant="danger" pulse />
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
              {scenario.scenarioInput.title}
            </h1>
            <p className="mt-1 text-xs text-[#6e6e73]">
              Corridor: <strong className="text-[#1d1d1f]">{scenario.affectedCorridor}</strong> · Vessel: {scenario.scenarioInput.vesselName}
            </p>
          </div>
        </div>

        {/* 1. Recommendation Summary Card */}
        <RecommendationCard result={scenario} />

        {/* 2. Interactive Global Sea Lanes Map */}
        <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-[#087ef5]" />
              <h3 className="text-sm font-bold text-[#1d1d1f]">Active Maritime Sea Route & Weather Bypass Map</h3>
            </div>
            <span className="flow-badge bg-[#e8f8ed] text-[#34c759]">OR-TOOLS CP-SAT ROUTE ACTIVE</span>
          </div>
          <GlobalMap scenarioResult={scenario} />
        </div>

        {/* 3. Side-by-Side Route Comparison Table */}
        <RouteComparison
          routes={scenario.routeComparison}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(rid) => setSelectedRouteId(rid)}
        />

        {/* 4. Disruption & Root Cause Summary */}
        <DisruptionSummary summary={scenario.disruptionSummary} />

        {/* 5. 9-Agent Pipeline Execution Animation */}
        <PipelineAnimation steps={scenario.pipelineSteps} />

        {/* 6. AI Decision Evidence & Model Interpretability */}
        <DecisionEvidence evidence={scenario.decisionEvidence} />

        {/* 7. Deterministic Calculation Logic */}
        <CalculationLogic steps={scenario.calculationLogic} />

        {/* 8. 500-Sample Monte Carlo Digital Twin What-If Analysis */}
        <WhatIfAnalysis scenarios={scenario.whatIfScenarios} />

        {/* 9. Factors & Constraints */}
        <FactorsAndConstraints data={scenario.factorsAndConstraints} />

        {/* 10. Automated Port Authority EDI Notice Dispatch */}
        <div className="rounded-[28px] border border-[#d2d2d7] bg-[#1d1d1f] p-6 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <Send className="size-4 text-[#087ef5]" />
              <div>
                <h3 className="text-sm font-bold">Automated Port Authority EDI 214 & Harbor Notice</h3>
                <p className="text-[11px] text-[#86868b]">Generated automatically based on AI supervisor optimization</p>
              </div>
            </div>

            <button
              onClick={() => setEdiSent(true)}
              className={`flow-pill ${
                ediSent ? 'bg-[#34c759] text-white' : 'bg-[#087ef5] text-white hover:bg-[#076ecf]'
              }`}
            >
              {ediSent ? <Check className="size-3.5" /> : <Send className="size-3.5" />}
              {ediSent ? 'EDI Notice Transmitted' : 'Transmit Notice to Harbor Master'}
            </button>
          </div>

          <div className="rounded-xl bg-black/40 p-4 border border-white/10 font-mono text-[11px] text-[#e5e5e7] leading-relaxed">
            <p className="text-[9px] font-bold text-[#087ef5] uppercase mb-1">TRANSMISSION TARGET: HARBOR MASTER @ DESTINATION PORT (EDI 214)</p>
            IMO NOTICE: Vessel {scenario.scenarioInput.vesselName} executing {scenario.recommendedRoute.name}. Predicted delay reduced from +{scenario.predictedDelayDays}d to +{scenario.recommendedRoute.delayVsSlaHours}h. Net exposure reduced by ${scenario.lossAvoidedAmountUsd.toLocaleString()} USD. Automated berth arrival adjustment logged.
          </div>
        </div>

      </div>
    </main>
  )
}
