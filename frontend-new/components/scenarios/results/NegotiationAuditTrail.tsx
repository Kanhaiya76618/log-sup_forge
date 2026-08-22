'use client'

import React, { useState, useEffect } from 'react'
import { 
  History, RotateCcw, Sparkles, Scale, CheckCircle2, 
  AlertOctagon, Pause, Check, DollarSign, Clock, ShieldAlert, FileText, Download
} from 'lucide-react'
import { 
  getPreferenceWeights, getDecisionHistory, resetPreferenceWeights, clearDecisionHistory,
  PreferenceProfile, DecisionHistoryItem 
} from '@/lib/decisionsApi'
import { generateAndDownloadDecisionPdf } from '@/lib/decisionPdf'
import { defaultPreloadedScenarios } from '@/lib/scenarioData'

interface NegotiationAuditTrailProps {
  refreshTrigger?: number
  shipmentId?: string
}

const REASON_ICONS: Record<string, any> = {
  cost: DollarSign,
  eta: Clock,
  risk: ShieldAlert,
  default: FileText,
}

export default function NegotiationAuditTrail({ refreshTrigger, shipmentId }: NegotiationAuditTrailProps) {
  const [profile, setProfile] = useState<PreferenceProfile | null>(null)
  const [history, setHistory] = useState<DecisionHistoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [resetting, setResetting] = useState<boolean>(false)
  const [clearing, setClearing] = useState<boolean>(false)
  const [filterScope, setFilterScope] = useState<'scenario' | 'all'>('scenario')

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, h] = await Promise.all([
        getPreferenceWeights('GLOBAL'),
        getDecisionHistory()
      ])
      setProfile(p)
      setHistory(h)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [refreshTrigger])

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await resetPreferenceWeights('GLOBAL')
      setProfile(res)
    } finally {
      setResetting(false)
    }
  }

  const handleClearHistory = async () => {
    if (window.confirm('Clear all decision audit records?')) {
      setClearing(true)
      try {
        await clearDecisionHistory()
        setHistory([])
      } finally {
        setClearing(false)
      }
    }
  }

  const riskPct = profile ? Math.round(profile.risk_weight * 100) : 35
  const etaPct = profile ? Math.round(profile.eta_weight * 100) : 35
  const costPct = profile ? Math.round(profile.cost_weight * 100) : 30

  const displayedHistory = filterScope === 'scenario' && shipmentId
    ? history.filter(item => {
        const itemRef = item.shipment_id?.toLowerCase() || ''
        const targetRef = shipmentId.toLowerCase()
        return itemRef.includes(targetRef) || targetRef.includes(itemRef)
      })
    : history

  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e5e5e7] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#f0f7ff] text-[#087ef5]">
            <Scale className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="flow-label text-[#087ef5]">CHALLENGE #705 AUDIT TRAIL</span>
              <span className="flow-badge bg-[#e8f8ed] text-[#34c759]">DECISION MEMORY ACTIVE</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1d1d1f] mt-0.5">
              Human Negotiation Support & Adaptive Learning Profile
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleClearHistory}
            disabled={clearing || history.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-[#ff3b30]/30 bg-[#fff5f4] px-3.5 py-2 text-xs font-semibold text-[#ff3b30] hover:bg-[#ffebe8] transition active:scale-95 disabled:opacity-40"
          >
            {clearing ? 'Clearing...' : 'Clear Audit Log'}
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7] transition active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className={`size-3.5 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : 'Reset Preferences'}
          </button>
        </div>
      </div>

      {/* 1. Interactive Preference Weights Display */}
      <div className="rounded-2xl bg-[#fafaf9] p-5 border border-[#e5e5e7] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#087ef5]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
              Adaptive Objective Weights (Dynamically Adjusted via Decision Memory)
            </h4>
          </div>
          <span className="text-xs font-mono text-[#86868b]">
            Learned from {profile?.update_count || 0} Human Overrides
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#ff3b30] uppercase tracking-wider">Meteorological / Swell Risk (w_risk)</span>
            <p className="font-mono text-lg font-bold text-[#1d1d1f] mt-0.5">{riskPct}%</p>
            <p className="text-[10px] text-[#86868b]">Vessel & cargo preservation</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#087ef5] uppercase tracking-wider">Schedule & Lead Time SLA (w_eta)</span>
            <p className="font-mono text-lg font-bold text-[#1d1d1f] mt-0.5">{etaPct}%</p>
            <p className="text-[10px] text-[#86868b]">On-time transit guarantee</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#e5e5e7]">
            <span className="text-[10px] font-bold text-[#34c759] uppercase tracking-wider">Bunker Fuel & Demurrage (w_cost)</span>
            <p className="font-mono text-lg font-bold text-[#1d1d1f] mt-0.5">{costPct}%</p>
            <p className="text-[10px] text-[#86868b]">Total financial exposure</p>
          </div>
        </div>
      </div>

      {/* 2. Decision History Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
            <History className="size-3.5 text-[#087ef5]" /> Human Decision Audit Trail ({displayedHistory.length} Events)
          </h4>
          
          {shipmentId && history.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl border border-[#d2d2d7] bg-[#fafaf9] p-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilterScope('scenario')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterScope === 'scenario' ? 'bg-white text-[#087ef5] shadow-xs font-bold' : 'text-[#6e6e73]'
                }`}
              >
                This Scenario ({displayedHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterScope === 'all' ? 'bg-white text-[#087ef5] shadow-xs font-bold' : 'text-[#6e6e73]'
                }`}
              >
                All Global ({history.length})
              </button>
            </div>
          )}
        </div>

        {displayedHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d2d2d7] bg-[#fafaf9] p-6 text-center text-xs text-[#86868b]">
            No human decisions recorded for this scenario yet. Click <strong>Accept & Dispatch</strong>, <strong>Pause</strong>, or <strong>Abandon</strong> above to record your first decision!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#e5e5e7]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafaf9] border-b border-[#e5e5e7] text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                <tr>
                  <th className="px-4 py-3">Decision ID & Time</th>
                  <th className="px-4 py-3">Shipment Ref</th>
                  <th className="px-4 py-3">Action Status</th>
                  <th className="px-4 py-3">Abandonment Reason</th>
                  <th className="px-4 py-3">Alternative Action</th>
                  <th className="px-4 py-3">Operator Notes</th>
                  <th className="px-4 py-3 text-right">Audit PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f2]">
                {displayedHistory.map((item) => {
                  const isAccepted = item.decision_status === 'accepted'
                  const isPaused = item.decision_status === 'paused'
                  const isAbandoned = item.decision_status === 'abandoned'
                  const ReasonIcon = REASON_ICONS[item.abandonment_reason || ''] || REASON_ICONS.default

                  const handleRowPdf = () => {
                    const fallbackScenario = defaultPreloadedScenarios[0]
                    generateAndDownloadDecisionPdf({
                      result: fallbackScenario,
                      decisionStatus: (item.decision_status as any) || 'accepted',
                      abandonmentReason: item.abandonment_reason,
                      abandonmentReasonText: item.abandonment_reason_text,
                      alternativeRoute: item.alternative_route,
                      operatorEmail: item.user_id || 'operator@flowforge.internal',
                      decisionId: item.decision_id
                    })
                  }

                  return (
                    <tr key={item.decision_id} className="hover:bg-[#fafaf9] transition">
                      <td className="px-4 py-3 font-mono text-[11px] font-semibold text-[#1d1d1f]">
                        {item.decision_id}
                        <p className="font-sans text-[10px] text-[#86868b] font-normal">
                          {new Date(item.decision_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(item.decision_timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#087ef5]">
                        {item.shipment_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAccepted ? 'bg-[#e8f8ed] text-[#34c759]' :
                          isPaused ? 'bg-[#fff4e5] text-[#ff9f0a]' :
                          'bg-[#ffebe8] text-[#ff3b30]'
                        }`}>
                          {isAccepted && <Check className="size-3" />}
                          {isPaused && <Pause className="size-3" />}
                          {isAbandoned && <AlertOctagon className="size-3" />}
                          {item.decision_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.abandonment_reason ? (
                          <div className="flex items-center gap-1.5">
                            <span className="capitalize font-semibold text-[#1d1d1f]">
                              {item.abandonment_reason.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#86868b]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#6e6e73]">
                        {item.alternative_route || item.recommended_route}
                      </td>
                      <td className="px-4 py-3 text-[#86868b] italic max-w-xs truncate">
                        {item.abandonment_reason_text || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={handleRowPdf}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#087ef5] bg-[#f0f7ff] hover:bg-[#e0effe] px-2.5 py-1 rounded-lg border border-[#087ef5]/30 transition active:scale-95"
                          title="Download PDF report for this decision"
                        >
                          <Download className="size-3" /> PDF
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
