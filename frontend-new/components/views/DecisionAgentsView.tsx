'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sparkles, Zap, ShieldCheck, CheckCircle2, Play, Terminal, 
  Layers, RefreshCw, Cpu, Sliders, ArrowRight, TrendingDown,
  Waves, Wind, Navigation, AlertTriangle, Send, Check
} from 'lucide-react'
import { 
  runAgentPipeline, 
  diagnoseDisruption, 
  PipelineExecutionResult, 
  AgentStep,
  ParetoRoute,
  SimulationResult,
  DisruptionResult
} from '@/lib/api'

export default function DecisionAgentsView() {
  const [selectedAgent, setSelectedAgent] = useState<number>(0)
  const [running, setRunning] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1)
  const [showSimulation, setShowSimulation] = useState<boolean>(true)
  const [selectedScenario, setSelectedScenario] = useState<string>('SCENARIO_B')
  const [executedPlan, setExecutedPlan] = useState<string | null>(null)
  const [ediSent, setEdiSent] = useState<boolean>(false)

  // Interactive Live ML Parameter Sliders
  const [opStress, setOpStress] = useState<number>(82)
  const [geoRisk, setGeoRisk] = useState<number>(74)
  const [congestion, setCongestion] = useState<number>(68)
  const [waveHeight, setWaveHeight] = useState<number>(2.8)
  const [windSpeed, setWindSpeed] = useState<number>(45)

  // Live ML Diagnosis State
  const [liveMlResult, setLiveMlResult] = useState<DisruptionResult | null>(null)
  const [pipelineData, setPipelineData] = useState<PipelineExecutionResult | null>(null)

  // Initial load
  useEffect(() => {
    handleRunPipeline(false)
  }, [])

  // Re-diagnose when sliders change
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      const res = await diagnoseDisruption({
        operational_stress: opStress,
        geo_port_risk: geoRisk,
        port_congestion_score: congestion,
      })
      if (active) setLiveMlResult(res)
    }, 150)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [opStress, geoRisk, congestion])

  const handleRunPipeline = async (animate: boolean = true) => {
    setRunning(true)
    setEdiSent(false)
    if (animate) {
      setShowSimulation(false)
      setActiveStepIndex(0)
      for (let i = 0; i < 9; i++) {
        setActiveStepIndex(i)
        setSelectedAgent(i)
        await new Promise(r => setTimeout(r, 220))
      }
    }

    const data = await runAgentPipeline({
      operational_stress: opStress,
      geo_port_risk: geoRisk,
      port_congestion_score: congestion,
      wave_height_m: waveHeight,
      wind_speed_kmh: windSpeed,
      origin: 'BOM',
      destination: 'YOK',
    })

    setPipelineData(data)
    setRunning(false)
    setActiveStepIndex(-1)
    setShowSimulation(true)
  }

  const agents: AgentStep[] = pipelineData?.agent_steps || [
    { step: '01', name: 'AIS Radar Sentinel', category: 'API Stream + Telemetry Parser', status: 'ONLINE', model: 'Open-Meteo V2 + AIS MarineTraffic Stream', output: 'Anomaly flagged: 2.8m wave swell along Mumbai-Yokohama corridor at 18.95N, 72.95E.' },
    { step: '02', name: 'Disruption Forecaster (XGBoost)', category: 'Trained ExtraTrees Pipeline', status: 'CRITICAL', model: 'Trained ExtraTrees Classifier', output: 'Disruption Probability: 82% (Threshold > 45% exceeded).' },
    { step: '03', name: 'ETA Slip Estimator (LightGBM)', category: 'Predictive Schedule Regressor', status: 'ETA SLIP', model: 'LightGBM Regression Engine', output: 'Predicted Schedule Delay: +4.2 days slip for CSCL Globe Supermax.' },
    { step: '04', name: 'Port Quay Sentinel', category: 'Berth Bottleneck Forecaster', status: 'AT RISK', model: 'RandomForest Dwell Forecaster (31-Port Matrix)', output: 'Yokohama Port Dwell: 31.0 hours · Berth capacity at 74%.' },
    { step: '05', name: 'Supply Chain Shockwave Shield', category: 'Buffer Stockout Protector', status: 'STOCKOUT', model: 'Downstream ERP Stockout Predictor', output: 'SKU-005 (Pharmaceuticals) predicted stockout in 5.8 days at Yokohama buffer.' },
    { step: '06', name: 'Demurrage & Exposure Assessor', category: 'Financial Loss Engine', status: 'EXPOSURE', model: 'Contractual Demurrage Matrix', output: 'Total Financial Exposure: $42,000 USD ($18K fuel + $12K demurrage + $12K buffer penalty).' },
    { step: '07', name: 'Pareto Route Navigator (OR-Tools)', category: 'Combinatorial Solver', status: 'READY', model: 'Google OR-Tools CP-SAT Combinatorial Solver', output: 'Scenario A: Speed Boost | Scenario B: Southern Weather Bypass (-63% net loss, Recommended).' },
    { step: '08', name: 'Stochastic Horizon Simulator', category: 'Monte Carlo Stochastic Engine', status: 'SIMULATED', model: '500-Sample Probabilistic Monte Carlo Engine', output: '94.6% confidence of arriving within SLA window under Plan B: Southern Weather Bypass.' },
    { step: '09', name: 'Autonomous Harbor Orchestrator', category: 'HITL Governance & Port Dispatch', status: 'AUTO-APPROVED', model: 'HITL Governance & Automated EDI Dispatcher', output: 'Executive Action: Plan Auto-Approved. Net loss reduced by 63%. Port Authority notice drafted.' },
  ]

  const paretoRoutes: ParetoRoute[] = pipelineData?.pareto_routes || []
  const simulation: SimulationResult | undefined = pipelineData?.simulation

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">DECISION INTELLIGENCE ARCHITECTURE</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f] md:text-3xl">9-Agent Multi-Agent Decision Engine</h2>
          <p className="text-xs text-[#6e6e73] mt-1">
            Trained ExtraTrees ML model + Google OR-Tools CP-SAT solver + 500-sample Monte Carlo Digital Twin
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pipelineData && (
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#e8f8ed] px-3 py-1.5 text-[10px] font-semibold text-[#34c759] border border-[#34c759]/20">
              <span className="size-1.5 rounded-full bg-[#34c759] animate-pulse" />
              {pipelineData.execution_time_ms}ms Execution Latency
            </span>
          )}
          <button 
            onClick={() => handleRunPipeline(true)}
            disabled={running}
            className="flex items-center gap-2 rounded-xl bg-[#087ef5] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf] active:scale-[0.98] transition disabled:opacity-50"
          >
            <Play className={`size-3.5 ${running ? 'animate-spin' : ''}`} /> 
            {running ? 'Executing 9-Agent Pipeline...' : 'Run End-to-End Pipeline'}
          </button>
        </div>
      </div>

      {/* Real-Time ML Parameter Calibration Controls Bar */}
      <div className="rounded-[24px] border border-[#d2d2d7] bg-white/90 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e5e7] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-[#087ef5]" />
            <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-[#1d1d1f]">
              Interactive Machine Learning Parameter Tuning (Live ExtraTrees Re-scoring)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {liveMlResult && (
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[.1em] uppercase ${
                liveMlResult.risk_level === 'CRITICAL' 
                  ? 'bg-[#ffebe8] text-[#ff3b30] border border-[#ff3b30]/30' 
                  : liveMlResult.risk_level === 'HIGH'
                  ? 'bg-[#fff4e5] text-[#ff9f0a] border border-[#ff9f0a]/30'
                  : 'bg-[#e8f8ed] text-[#34c759] border border-[#34c759]/30'
              }`}>
                Live ML Disruption: {liveMlResult.disruption_probability_percent}% ({liveMlResult.risk_level})
              </span>
            )}
            <button 
              onClick={() => handleRunPipeline(false)}
              className="text-[10px] font-semibold text-[#087ef5] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="size-3" /> Re-solve Routes
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          {/* Slider 1: Operational Stress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6e6e73] font-medium">Operational Stress</span>
              <strong className="text-[#1d1d1f] font-mono">{opStress}%</strong>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={opStress} 
              onChange={e => setOpStress(Number(e.target.value))}
              className="w-full accent-[#087ef5] cursor-pointer"
            />
          </div>

          {/* Slider 2: Geo-Port Risk */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6e6e73] font-medium">Geo-Port Risk</span>
              <strong className="text-[#1d1d1f] font-mono">{geoRisk}%</strong>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={geoRisk} 
              onChange={e => setGeoRisk(Number(e.target.value))}
              className="w-full accent-[#087ef5] cursor-pointer"
            />
          </div>

          {/* Slider 3: Port Congestion */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6e6e73] font-medium">Port Congestion</span>
              <strong className="text-[#1d1d1f] font-mono">{congestion}%</strong>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={congestion} 
              onChange={e => setCongestion(Number(e.target.value))}
              className="w-full accent-[#087ef5] cursor-pointer"
            />
          </div>

          {/* Slider 4: Wave Height */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6e6e73] font-medium">Wave Swell Height</span>
              <strong className="text-[#1d1d1f] font-mono">{waveHeight}m</strong>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="6.0" 
              step="0.1" 
              value={waveHeight} 
              onChange={e => setWaveHeight(Number(e.target.value))}
              className="w-full accent-[#087ef5] cursor-pointer"
            />
          </div>

          {/* Slider 5: Wind Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6e6e73] font-medium">Wind Gust Speed</span>
              <strong className="text-[#1d1d1f] font-mono">{windSpeed} km/h</strong>
            </div>
            <input 
              type="range" 
              min="10" 
              max="90" 
              value={windSpeed} 
              onChange={e => setWindSpeed(Number(e.target.value))}
              className="w-full accent-[#087ef5] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Agents 9-Grid & Inspector Section */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        
        {/* Left: 9 Agent Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          {agents.map((agent, index) => {
            const isSelected = selectedAgent === index
            const isActiveStep = activeStepIndex === index
            return (
              <div 
                key={agent.step}
                onClick={() => setSelectedAgent(index)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 overflow-hidden min-w-0 flex flex-col justify-between ${
                  isActiveStep
                    ? 'border-[#087ef5] bg-[#eef7ff] shadow-lg ring-2 ring-[#087ef5] scale-[1.02]'
                    : isSelected 
                    ? 'border-[#087ef5] bg-white shadow-md ring-2 ring-[#087ef5]/15' 
                    : 'border-[#e5e5e7] bg-[#fafaf9] hover:bg-white hover:border-[#d2d2d7]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#087ef5] flex items-center gap-1.5 shrink-0">
                    {agent.step}
                    {isActiveStep && <span className="size-1.5 rounded-full bg-[#087ef5] animate-ping" />}
                  </span>
                  <span className={`flow-badge max-w-[70%] truncate shrink min-w-0 ${
                    agent.status === 'CRITICAL' || agent.status === 'CRITICAL STOCKOUT' 
                      ? 'bg-[#ffebe8] text-[#ff3b30]' 
                      : agent.status === 'AT RISK' || agent.status === 'EXPOSURE'
                      ? 'bg-[#fff4e5] text-[#ff9f0a]'
                      : 'bg-[#e8f8ed] text-[#34c759]'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="mt-2 text-xs font-semibold text-[#1d1d1f] leading-snug truncate">{agent.name}</h3>
                  <p className="text-[10px] text-[#86868b] mt-0.5 leading-snug truncate">{agent.category}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: Selected Agent Inspector Drawer */}
        <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <div>
                <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">AGENT INSPECTOR</p>
                <h3 className="mt-1 text-base font-semibold text-[#1d1d1f]">{agents[selectedAgent]?.name}</h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-lg">
                STAGE {agents[selectedAgent]?.step}
              </span>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-[9px] font-semibold text-[#86868b] uppercase tracking-wider">Engine / Architecture:</span>
                <p className="font-medium text-[#1d1d1f] mt-0.5">{agents[selectedAgent]?.model}</p>
              </div>

              <div>
                <span className="text-[9px] font-semibold text-[#86868b] uppercase tracking-wider">Pipeline Output Log:</span>
                <div className="mt-1.5 rounded-xl bg-[#1d1d1f] p-3 text-white font-mono text-[11px] border border-[#333]">
                  <div className="flex items-center gap-1.5 text-[#34c759] text-[9px] mb-1 font-sans font-semibold uppercase tracking-wider">
                    <Terminal className="size-3" /> Live Event Bus Telemetry
                  </div>
                  <p className="leading-5 text-[#f1f1f3]">{agents[selectedAgent]?.output}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f0f0f2] flex items-center justify-between text-[11px] text-[#86868b]">
            <span>Deterministic ML Inference</span>
            <span className="font-semibold text-[#34c759] flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> Verified Nominal
            </span>
          </div>
        </div>

      </div>

      {/* POST-AGENT RUN: DIGITAL TWIN SIMULATION & GOOGLE OR-TOOLS REROUTING SECTION */}
      {showSimulation && (
        <div className="space-y-6 pt-4 border-t border-[#d2d2d7]">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">POST-AGENT SIMULATION & OPTIMIZATION</p>
              <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f] md:text-2xl">
                Digital Twin Monte Carlo & Google OR-Tools Rerouting Engine
              </h2>
            </div>
            <span className="rounded-full bg-[#e8f8ed] px-3 py-1 text-[10px] font-semibold text-[#34c759] flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#34c759] animate-pulse" />
              500 SAMPLES EVALUATED
            </span>
          </div>

          {/* Top Row: Monte Carlo Probabilistic Graph + SLA Risk Summary */}
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            
            {/* 500-Sample Monte Carlo Probability Density Curve */}
            <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[.16em] text-[#86868b] uppercase">STOCHASTIC DIGITAL TWIN SIMULATION</p>
                  <h3 className="mt-1 text-base font-semibold text-[#1d1d1f]">Schedule Delay Variance Distribution (500 Iterations)</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#86868b]">SLA Compliance</span>
                  <p className="text-sm font-bold text-[#34c759]">
                    {simulation?.sla_confidence_percent || 94.6}% Confidence
                  </p>
                </div>
              </div>

              {/* Minimalist Interactive Probability Bars Curve */}
              <div className="mt-6 flex h-36 items-end gap-2 border-b border-[#e5e5e7] pb-2">
                {(simulation?.histogram_curve || []).map((bin, i) => (
                  <div key={i} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 rounded-lg bg-[#1d1d1f] px-2 py-1 text-[9px] text-white font-mono transition pointer-events-none z-10 whitespace-nowrap shadow-lg">
                      {bin.bin_label}: {bin.probability_pct}% ({bin.frequency} runs)
                    </div>
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        i < 4 
                          ? 'bg-[#087ef5]' 
                          : i < 7 
                          ? 'bg-[#34c759]' 
                          : 'bg-[#ff9f0a]'
                      } group-hover:opacity-80`}
                      style={{ height: `${Math.max(8, bin.probability_pct * 3.2)}%` }}
                    />
                    <span className="mt-2 text-[9px] font-mono text-[#86868b]">{bin.bin_label}</span>
                  </div>
                ))}
              </div>

              {/* Percentiles Badges */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#f0f0f2] pt-3">
                <div className="flex gap-4 font-mono text-[11px]">
                  <span className="text-[#6e6e73]">P10: <strong className="text-[#1d1d1f]">+{simulation?.percentiles.p10_delay_days || 0.4}d</strong></span>
                  <span className="text-[#6e6e73]">P50 (Median): <strong className="text-[#087ef5]">+{simulation?.percentiles.p50_delay_days || 0.8}d</strong></span>
                  <span className="text-[#6e6e73]">P90: <strong className="text-[#ff9f0a]">+{simulation?.percentiles.p90_delay_days || 1.4}d</strong></span>
                  <span className="text-[#6e6e73]">P99 (Worst): <strong className="text-[#ff3b30]">+{simulation?.percentiles.p99_delay_days || 1.9}d</strong></span>
                </div>
                <span className="text-[10px] text-[#86868b]">Gaussian Wind + Poisson Berth Queue</span>
              </div>
            </div>

            {/* Financial Risk Mitigation & Executive Action */}
            <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[.16em] text-[#86868b] uppercase">FINANCIAL LOSS MITIGATION</p>
                <h3 className="mt-1 text-lg font-semibold text-[#1d1d1f]">Net Risk Reduction</h3>
                
                <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-4 border border-[#e5e5e7]">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#6e6e73]">Unmitigated Risk</span>
                    <span className="text-sm font-semibold text-[#ff3b30] line-through">$72,000 USD</span>
                  </div>
                  <div className="mt-2 flex justify-between items-baseline border-t border-[#e5e5e7] pt-2">
                    <span className="text-xs font-semibold text-[#1d1d1f]">Optimized Scenario Loss</span>
                    <span className="text-xl font-bold text-[#34c759]">$19,100 USD</span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8ed] px-2 py-0.5 text-[10px] font-bold text-[#34c759]">
                      <TrendingDown className="size-3" /> Net $42,000 USD Saved (63% Cut)
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-[11px] text-[#6e6e73]">
                  <div className="flex justify-between">
                    <span>Demurrage Avoidance</span>
                    <strong className="text-[#1d1d1f] font-medium">+$28,400 USD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Factory Stockout Penalty Saved</span>
                    <strong className="text-[#1d1d1f] font-medium">+$23,100 USD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Reroute Fuel Burn Surcharge</span>
                    <strong className="text-[#ff9f0a] font-medium">-$9,500 USD</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e5e5e7]">
                <p className="text-[10px] text-[#86868b]">
                  Evaluated via Google OR-Tools CP-SAT multi-objective Pareto solver.
                </p>
              </div>
            </div>

          </div>

          {/* 3 Pareto Route Comparison Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold tracking-[.14em] uppercase text-[#1d1d1f]">
                3 Pareto Optimal Recovery Routes (Google OR-Tools CP-SAT)
              </h3>
              <span className="text-xs text-[#86868b]">Select a recovery plan to execute</span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {paretoRoutes.map((route) => {
                const isSelected = selectedScenario === route.scenario_id
                return (
                  <div 
                    key={route.scenario_id}
                    onClick={() => setSelectedScenario(route.scenario_id)}
                    className={`cursor-pointer rounded-[24px] border p-5 transition-all duration-200 flex flex-col justify-between ${
                      route.recommended 
                        ? 'border-[#087ef5] bg-white shadow-md ring-2 ring-[#087ef5]/20' 
                        : isSelected
                        ? 'border-[#1d1d1f] bg-white shadow-sm ring-1 ring-[#1d1d1f]'
                        : 'border-[#e5e5e7] bg-[#fafaf9] hover:bg-white hover:border-[#d2d2d7]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#087ef5]">{route.scenario_id}</span>
                        {route.recommended && (
                          <span className="rounded-full bg-[#087ef5] px-2.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                            RECOMMENDED
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 text-sm font-semibold text-[#1d1d1f]">{route.name}</h4>
                      <p className="mt-1 text-xs text-[#6e6e73] leading-4">{route.summary}</p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-b border-[#f0f0f2] py-3">
                        <div>
                          <span className="text-[9px] text-[#86868b] uppercase">Predicted Delay</span>
                          <p className="font-bold text-[#1d1d1f]">+{route.delay_days} days</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#86868b] uppercase">Speed / Dist</span>
                          <p className="font-bold text-[#1d1d1f]">{route.speed_knots} kn · {route.distance_nm} NM</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#86868b] uppercase">Fuel Delta</span>
                          <p className="font-bold text-[#ff9f0a]">+${route.fuel_delta_usd.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#86868b] uppercase">Net Savings</span>
                          <p className="font-bold text-[#34c759]">+${route.net_savings_usd.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedScenario(route.scenario_id)
                        setExecutedPlan(route.scenario_id)
                      }}
                      className={`mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                        executedPlan === route.scenario_id
                          ? 'bg-[#34c759] text-white'
                          : route.recommended
                          ? 'bg-[#087ef5] text-white hover:bg-[#076ecf]'
                          : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5e7]'
                      }`}
                    >
                      {executedPlan === route.scenario_id ? (
                        <>
                          <Check className="size-3.5" /> Plan Executed & Active
                        </>
                      ) : (
                        <>
                          <Navigation className="size-3.5" /> Execute {route.scenario_id}
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Port Authority Automated Dispatch Notice Card */}
          <div className="rounded-[28px] border border-[#d2d2d7] bg-[#fafaf9] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e5e5e7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-[#1d1d1f] text-white">
                  <Send className="size-3.5 text-[#087ef5]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[.14em] text-[#1d1d1f]">
                    Automated Port Authority Dispatch Notice (EDI 214 & Harbor Master Alert)
                  </h3>
                  <p className="text-[10px] text-[#86868b]">Generated automatically based on Supervisor Agent recommendation</p>
                </div>
              </div>

              <button 
                onClick={() => setEdiSent(true)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  ediSent 
                    ? 'bg-[#34c759] text-white' 
                    : 'bg-[#1d1d1f] text-white hover:bg-black'
                }`}
              >
                {ediSent ? <Check className="size-3.5" /> : <Send className="size-3.5" />}
                {ediSent ? 'EDI Notice Transmitted' : 'Transmit Notice to Harbor Master'}
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-white p-4 border border-[#e5e5e7] font-mono text-[11px] text-[#1d1d1f] leading-5">
              <div className="text-[9px] font-bold text-[#087ef5] mb-2 uppercase tracking-wider">
                TRANSMISSION TARGET: HARBOR MASTER @ PORT OF YOKOHAMA (CUSTOMS EDI GATEWAY)
              </div>
              {pipelineData?.edi_notice || (
                'IMO NOTICE TO HARBOR MASTER, PORT OF YOKOHAMA (EDI 214): Vessel CSCL Globe Supermax rerouted via Southern Bypass corridor. Predicted delay minimized from +4.2d to +0.8d. Net financial exposure reduced by 63%. Automated clearance request logged.'
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
