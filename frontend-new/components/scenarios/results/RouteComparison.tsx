'use client'

import React from 'react'
import { Check, ArrowRight, ShieldCheck, Navigation } from 'lucide-react'
import { RouteOption } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface RouteComparisonProps {
  routes: RouteOption[]
  selectedRouteId: string
  onSelectRoute: (id: string) => void
}

export default function RouteComparison({
  routes,
  selectedRouteId,
  onSelectRoute
}: RouteComparisonProps) {
  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
        <div>
          <p className="flow-label text-[#087ef5]">OR-TOOLS CP-SAT SOLVER</p>
          <h3 className="text-base font-bold text-[#1d1d1f]">Side-by-Side Pareto Route Comparison</h3>
        </div>
        <span className="text-xs text-[#86868b]">3 Solved Alternative Corridors</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#fafaf9] text-[10px] font-bold uppercase text-[#86868b] tracking-wider border-b border-[#e5e5e7]">
            <tr>
              <th className="p-3.5">Plan / Scenario</th>
              <th className="p-3.5">Route Path</th>
              <th className="p-3.5">Predicted Delay</th>
              <th className="p-3.5">Fuel Burn</th>
              <th className="p-3.5">Demurrage Loss</th>
              <th className="p-3.5">Net Exposure</th>
              <th className="p-3.5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f2]">
            {routes.map((r) => {
              const isSelected = selectedRouteId === r.id
              return (
                <tr 
                  key={r.id}
                  onClick={() => onSelectRoute(r.id)}
                  className={`cursor-pointer transition ${
                    r.recommended 
                      ? 'bg-[#f0f7ff]/70 font-semibold' 
                      : isSelected 
                      ? 'bg-[#f5f5f7]' 
                      : 'hover:bg-[#fafaf9]'
                  }`}
                >
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#087ef5] font-bold">{r.id}</span>
                      <span className="text-xs font-bold text-[#1d1d1f]">{r.name.split(':')[0]}</span>
                      {r.recommended && (
                        <span className="flow-badge bg-[#087ef5] text-white">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-[#6e6e73] max-w-[200px] truncate">{r.pathSummary}</td>
                  <td className="p-3.5 font-bold">
                    <span className={r.delayVsSlaHours > 24 ? 'text-[#ff3b30]' : r.delayVsSlaHours > 12 ? 'text-[#ff9f0a]' : 'text-[#34c759]'}>
                      +{r.delayVsSlaHours}h ({parseFloat((r.delayVsSlaHours / 24).toFixed(1))}d)
                    </span>
                  </td>
                  <td className="p-3.5 text-[#1d1d1f] font-mono">${r.fuelCostUsd.toLocaleString()}</td>
                  <td className="p-3.5 text-[#ff9f0a] font-mono">${r.demurrageCostUsd.toLocaleString()}</td>
                  <td className="p-3.5 font-mono font-bold text-[#1d1d1f]">${r.totalFinancialExposureUsd.toLocaleString()}</td>
                  <td className="p-3.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectRoute(r.id)
                      }}
                      className={`flow-pill ${
                        r.recommended ? 'bg-[#087ef5] text-white' : 'bg-[#e5e5e7] text-[#1d1d1f]'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
