'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, Clock, ShieldAlert, ArrowRight, CheckCircle2, AlertTriangle, 
  TrendingUp, RefreshCw, Zap, Anchor, Truck, GitBranch, MapPin, 
  Layers, Compass, Eye, ShieldCheck, Gauge, Flame, Sparkles, Navigation,
  Activity, AlertCircle
} from 'lucide-react'
import { 
  getUnifiedShipmentRisk, 
  UnifiedShipmentRiskResult 
} from '@/lib/api'

export default function CargoJourneyRiskView() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<UnifiedShipmentRiskResult | null>(null)
  const [selectedNode, setSelectedNode] = useState<number>(1)
  
  // Interactive Simulation Controls
  const [speedKnots, setSpeedKnots] = useState(14.2)
  const [portCongestion, setPortCongestion] = useState(74)
  const [weatherSeverity, setWeatherSeverity] = useState(68)
  const [connectingDeparture, setConnectingDeparture] = useState(68)
  const [inboundArrival, setInboundArrival] = useState(52)
  const [routeDeviation, setRouteDeviation] = useState(32)
  const [aisGapHours, setAisGapHours] = useState(0)

  const fetchRiskReport = async () => {
    setLoading(true)
    try {
      const res = await getUnifiedShipmentRisk({
        shipment_id: 'SH-4092',
        origin: 'Mumbai JNPT (IN)',
        destination: 'Port of Yokohama (JP)',
        transshipment_port: 'Singapore Tuas (SG)',
        cargo_type: 'Automotive ECUs & High-Voltage Battery Modules',
        cargo_value_usd: 35200000.0,
        current_speed_knots: speedKnots,
        baseline_speed_knots: 18.0,
        scheduled_transit_hours: 192.0,
        port_congestion_score: portCongestion / 100.0,
        weather_severity: weatherSeverity / 100.0,
        geopolitical_risk: 0.55,
        operational_stress: 0.72,
        connecting_departure_hours: connectingDeparture,
        inbound_arrival_hours: inboundArrival,
        route_deviation_km: routeDeviation,
        ais_gap_hours: aisGapHours
      })
      setData(res)
    } catch (err) {
      console.error('Failed to load unified cargo risk report:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiskReport()
  }, [speedKnots, portCongestion, weatherSeverity, connectingDeparture, inboundArrival, routeDeviation, aisGapHours])

  const calculatedBuffer = Math.max(0, connectingDeparture - inboundArrival - 9.5).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#087ef5] text-white shadow-sm">
              <Box className="size-3.5" />
            </span>
            <p className="flow-label text-[#087ef5]">
              CARGO JOURNEY DIGITAL TWIN
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1d1d1f] md:text-3xl">
            Predictive Cargo Journey Risk & Decision Support
          </h1>
          <p className="mt-1 text-xs text-[#6e6e73]">
            Tracking Container <strong className="text-[#1d1d1f]">#MSKU-9824-0</strong> · Mumbai JNPT ➔ Singapore Tuas Hub ➔ Port of Yokohama
          </p>
        </div>

        <button
          onClick={fetchRiskReport}
          disabled={loading}
          className="flow-pill bg-[#1d1d1f] text-white shadow-sm hover:bg-black transition active:scale-95 disabled:opacity-50 self-start"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Simulating...' : 'Recalculate Risk'}
        </button>
      </div>

      {/* Main 4 Metric Cards with Fluid Badges */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        
        {/* Card 1: Overall Journey Risk */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between gap-2">
            <span className="flow-label text-[#86868b]">OVERALL RISK</span>
            <span className={`flow-badge ${
              (data?.overall_risk || 0) >= 0.7 ? 'bg-[#ffebe8] text-[#ff3b30]' : (data?.overall_risk || 0) >= 0.45 ? 'bg-[#fff4e5] text-[#ff9f0a]' : 'bg-[#e8f8ed] text-[#34c759]'
            }`}>
              {(data?.overall_risk || 0) >= 0.7 ? 'CRITICAL' : (data?.overall_risk || 0) >= 0.45 ? 'HIGH RISK' : 'LOW RISK'}
            </span>
          </div>
          <div className="my-2">
            <span className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              (data?.overall_risk || 0) >= 0.7 ? 'text-[#ff3b30]' : (data?.overall_risk || 0) >= 0.45 ? 'text-[#ff9f0a]' : 'text-[#34c759]'
            }`}>
              {Math.round((data?.overall_risk || 0.58) * 100)}%
            </span>
          </div>
          <p className="text-xs text-[#6e6e73] leading-snug">Correlation-discounted risk score</p>
        </div>

        {/* Card 2: Predicted Delay */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between gap-2">
            <span className="flow-label text-[#86868b]">PREDICTED DELAY</span>
            <span className="flow-badge bg-[#ffebe8] text-[#ff3b30]">
              EARLY WARNING
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ff3b30]">
              +{data?.predicted_delay_hours || 26.4}h
            </span>
            <span className="text-xs font-medium text-[#86868b]">vs SLA</span>
          </div>
          <p className="text-xs text-[#6e6e73] leading-snug">Weak speed & port backlog signals</p>
        </div>

        {/* Card 3: Transshipment Buffer */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between gap-2">
            <span className="flow-label text-[#86868b]">TRANSSHIPMENT BUFFER</span>
            <span className={`flow-badge ${
              parseFloat(calculatedBuffer) < 3 ? 'bg-[#ffebe8] text-[#ff3b30]' : 'bg-[#fff4e5] text-[#ff9f0a]'
            }`}>
              {parseFloat(calculatedBuffer) < 3 ? 'CRITICAL' : 'AT RISK'}
            </span>
          </div>
          <div className="my-2">
            <span className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              parseFloat(calculatedBuffer) < 3 ? 'text-[#ff3b30]' : parseFloat(calculatedBuffer) < 8 ? 'text-[#ff9f0a]' : 'text-[#34c759]'
            }`}>
              {calculatedBuffer}h
            </span>
          </div>
          <p className="text-xs text-[#6e6e73] leading-snug">Mother vessel: CMA CGM Jacques Saadé</p>
        </div>

        {/* Card 4: Cargo Gate-Out ETA */}
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between gap-2">
            <span className="flow-label text-[#86868b]">CARGO GATE-OUT ETA</span>
            <span className="flow-badge bg-[#e8f8ed] text-[#34c759]">
              P80: Hr 256
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
              Hr {data?.cargo_eta_hours ? Math.round(data.cargo_eta_hours) : 245}
            </span>
          </div>
          <p className="text-xs text-[#6e6e73] leading-snug">Includes crane discharge + customs clearance</p>
        </div>
      </div>

      {/* Multi-Node Container Journey Timeline */}
      <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#e5e5e7] pb-4">
          <div>
            <p className="flow-label text-[#087ef5]">MULTI-MODAL CONTAINER LIFECYCLE</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1d1d1f]">
              Container Journey Dependency Timeline
            </h2>
          </div>
          <span className="text-xs text-[#86868b] flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-[#087ef5]" /> Click any leg to inspect live telemetry
          </span>
        </div>

        {/* Milestone Cards Grid with Fluid Badges */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {data?.journey_timeline.map((node, idx) => {
            const isSelected = selectedNode === idx
            const isCritical = node.risk_tier === 'HIGH' || node.risk_tier === 'CRITICAL'
            const isMedium = node.risk_tier === 'MEDIUM'

            return (
              <button
                key={node.node_id}
                onClick={() => setSelectedNode(idx)}
                className={`relative flex flex-col justify-between rounded-2xl p-4 text-left transition duration-200 border min-h-[145px] ${
                  isSelected
                    ? 'border-[#087ef5] bg-[#f0f7ff] shadow-md ring-2 ring-[#087ef5]/20'
                    : 'border-[#e5e5e7] bg-[#fafaf9] hover:border-[#d2d2d7] hover:bg-white'
                }`}
              >
                {/* Card Top Row */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-mono text-xs font-bold text-[#087ef5]">{node.node_id}</span>
                    <span className={`flow-badge ${
                      node.status === 'COMPLETED' ? 'bg-[#e8f8ed] text-[#34c759]' :
                      node.status === 'IN_PROGRESS' ? 'bg-[#e8f0fe] text-[#087ef5]' :
                      node.status === 'AT_RISK' ? 'bg-[#ffebe8] text-[#ff3b30]' : 'bg-[#f1f1f3] text-[#6e6e73]'
                    }`}>
                      <span className={`size-1.5 rounded-full ${
                        node.status === 'COMPLETED' ? 'bg-[#34c759]' :
                        node.status === 'IN_PROGRESS' ? 'bg-[#087ef5] animate-pulse' :
                        node.status === 'AT_RISK' ? 'bg-[#ff3b30]' : 'bg-[#86868b]'
                      }`} />
                      {node.status}
                    </span>
                  </div>

                  {/* Stage & Location */}
                  <h4 className="text-xs sm:text-sm font-bold text-[#1d1d1f] leading-snug">{node.stage}</h4>
                  <p className="mt-1 text-xs text-[#6e6e73] leading-snug">{node.location}</p>
                </div>

                {/* Card Footer */}
                <div className="mt-3 flex items-center justify-between border-t border-[#e5e5e7]/80 pt-2 text-xs">
                  <span className="text-[#86868b] font-medium">Dwell: {node.dwell_hours}h</span>
                  <span className={`flow-badge ${
                    isCritical ? 'bg-[#ffebe8] text-[#ff3b30]' : isMedium ? 'bg-[#fff4e5] text-[#ff9f0a]' : 'bg-[#e8f8ed] text-[#34c759]'
                  }`}>
                    {node.risk_tier}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Leg Telemetry & Mitigation Inspector (Fully Contained, Responsive, No Overflow) */}
        {data?.journey_timeline[selectedNode] && (
          <div className="mt-5 rounded-2xl bg-[#f5f5f7] p-4 sm:p-5 border border-[#e5e5e7] overflow-hidden">
            <div className="flex flex-col gap-3.5">
              {/* Top Row: Icon + Title + Dwell Badge */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#1d1d1f] text-white shadow-sm">
                  <Compass className="size-4 text-[#087ef5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#087ef5]">
                      {data.journey_timeline[selectedNode].node_id}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f]">
                      {data.journey_timeline[selectedNode].stage} · {data.journey_timeline[selectedNode].location}
                    </h3>
                    <span className="flow-badge bg-white border border-[#d2d2d7] text-[#1d1d1f]">
                      Dwell: {data.journey_timeline[selectedNode].dwell_hours}h
                    </span>
                  </div>
                  <p className="text-xs text-[#6e6e73] leading-relaxed">
                    {data.journey_timeline[selectedNode].detail}
                  </p>
                </div>
              </div>

              {/* Bottom Action Bar: Plan & Telemetry */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#e5e5e7] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flow-label text-[#86868b]">Mitigation Protocol:</span>
                  <span className="flow-pill bg-[#1d1d1f] text-white text-xs font-semibold shadow-sm">
                    Continuous Telemetry Monitor
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6e6e73]">
                  <span className="size-1.5 rounded-full bg-[#34c759] animate-pulse" />
                  Live Satellite Telemetry
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Grid: Left Intelligence Modules vs Right Live Simulation Controls */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        
        {/* Left Column: 6 Deep-Dive Modules */}
        <div className="space-y-6">
          
          {/* Module 1: Early Delay Warning Weak Signals */}
          <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3.5">
              <div className="flex items-center gap-2.5">
                <Clock className="size-4 text-[#087ef5]" />
                <h3 className="text-sm font-bold text-[#1d1d1f]">1. Early Delay Warning (Weak Signal Radar)</h3>
              </div>
              <span className="flow-badge bg-[#ffebe8] text-[#ff3b30]">
                HIGH WARNING LEVEL
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {data?.key_risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-[#fafaf9] p-3.5 border border-[#e5e5e7]">
                  <AlertTriangle className="size-4 shrink-0 text-[#ff9f0a] mt-0.5" />
                  <p className="text-xs text-[#1d1d1f] leading-relaxed">{risk}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Module 2: Cascading Disruption Graph */}
          <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3.5">
              <div className="flex items-center gap-2.5">
                <GitBranch className="size-4 text-[#087ef5]" />
                <h3 className="text-sm font-bold text-[#1d1d1f]">2. Cascading Disruption Ripple Engine</h3>
              </div>
              <span className="flow-label text-[#86868b]">NetworkX Directed Graph</span>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
                <span className="text-[#6e6e73]">Corridor Weather Swell</span>
                <ArrowRight className="size-3.5 text-[#86868b] shrink-0 mx-2" />
                <span className="font-semibold text-[#1d1d1f]">Inbound Vessel Delay (+8.5h)</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
                <span className="text-[#6e6e73]">Inbound Arrival Delay</span>
                <ArrowRight className="size-3.5 text-[#86868b] shrink-0 mx-2" />
                <span className="font-semibold text-[#ff9f0a]">Squeezed Hub Buffer ({calculatedBuffer}h)</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-[#fafaf9] p-3.5 rounded-xl border border-[#e5e5e7]">
                <span className="text-[#6e6e73]">Destination Berth Backlog</span>
                <ArrowRight className="size-3.5 text-[#86868b] shrink-0 mx-2" />
                <span className="font-semibold text-[#ff3b30]">Final Consignee Gate Slip (+38.5h)</span>
              </div>
            </div>
          </div>

          {/* Module 3: Executive Recommendations */}
          <div className="rounded-[28px] border border-[#d2d2d7] bg-[#1d1d1f] p-6 text-white shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-[#34c759]" />
                <h3 className="text-sm font-bold">Autonomous Decision Support Recommendations</h3>
              </div>
              <span className="flow-badge bg-[#34c759]/20 text-[#34c759]">
                ACTIONABLE
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {data?.recommended_actions.map((act, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white/5 p-3.5 border border-white/10">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#087ef5] text-white text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed text-[#e5e5e7]">{act}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Digital Twin Live Controls */}
        <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="flow-label text-[#087ef5]">WHAT-IF SIMULATION</p>
              <Sparkles className="size-4 text-[#ff9f0a]" />
            </div>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#1d1d1f]">
              Live Journey Parameter Sliders
            </h3>
            <p className="mt-1 text-xs text-[#6e6e73]">
              Tweak telemetry inputs to observe real-time recalculation of risk scores, buffer windows, and ETAs.
            </p>
          </div>

          {/* Slider 1: Speed */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1d1d1f]">Current Vessel Speed</span>
              <span className="font-mono font-bold text-[#087ef5]">{speedKnots} Knots</span>
            </div>
            <input 
              type="range" 
              min="8.0" 
              max="22.0" 
              step="0.2" 
              value={speedKnots}
              onChange={(e) => setSpeedKnots(parseFloat(e.target.value))}
              className="w-full accent-[#087ef5]"
            />
            <div className="flex justify-between text-xs text-[#86868b]">
              <span>8 kn (Slow)</span>
              <span>18 kn (Nominal Cruise)</span>
              <span>22 kn (Full Throttle)</span>
            </div>
          </div>

          {/* Slider 2: Port Congestion */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1d1d1f]">Destination Port Congestion</span>
              <span className="font-mono font-bold text-[#ff9f0a]">{portCongestion}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="95" 
              step="1" 
              value={portCongestion}
              onChange={(e) => setPortCongestion(parseInt(e.target.value))}
              className="w-full accent-[#ff9f0a]"
            />
            <div className="flex justify-between text-xs text-[#86868b]">
              <span>10% (Clear Quay)</span>
              <span>50% (Normal)</span>
              <span>95% (Severe Gridlock)</span>
            </div>
          </div>

          {/* Slider 3: Weather Severity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1d1d1f]">Voyage Corridor Weather Swell</span>
              <span className="font-mono font-bold text-[#ff3b30]">{weatherSeverity}%</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="1" 
              value={weatherSeverity}
              onChange={(e) => setWeatherSeverity(parseInt(e.target.value))}
              className="w-full accent-[#ff3b30]"
            />
            <div className="flex justify-between text-xs text-[#86868b]">
              <span>Calm Sea</span>
              <span>Monsoon Front</span>
              <span>Super Typhoon</span>
            </div>
          </div>

          {/* Slider 4: Inbound Arrival Time */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1d1d1f]">Inbound Arrival at Hub</span>
              <span className="font-mono font-bold text-[#1d1d1f]">Hour {inboundArrival}</span>
            </div>
            <input 
              type="range" 
              min="30" 
              max="65" 
              step="1" 
              value={inboundArrival}
              onChange={(e) => setInboundArrival(parseInt(e.target.value))}
              className="w-full accent-[#1d1d1f]"
            />
          </div>

          {/* Quick Risk Diagnostics Breakdown Card */}
          <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] space-y-2.5">
            <p className="flow-label text-[#86868b]">CORRELATION MATRIX BREAKDOWN</p>
            
            <div className="flex justify-between text-xs">
              <span className="text-[#6e6e73]">Hidden Delay Risk</span>
              <strong className="text-[#1d1d1f]">{Math.round((data?.hidden_delay_risk || 0.78) * 100)}%</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6e6e73]">Transshipment Risk</span>
              <strong className="text-[#1d1d1f]">{Math.round((data?.transshipment_risk || 0.62) * 100)}%</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6e6e73]">Cargo Security Risk</span>
              <strong className="text-[#1d1d1f]">{Math.round((data?.cargo_security_risk || 0.22) * 100)}%</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6e6e73]">Cascading Ripple Risk</span>
              <strong className="text-[#1d1d1f]">{Math.round((data?.cascade_risk || 0.71) * 100)}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
