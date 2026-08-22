'use client'

import React, { useState } from 'react'
import { FileText, Download, TrendingUp, BarChart3, PieChart, ArrowUpRight, DollarSign, Calendar } from 'lucide-react'

export default function ReportsView() {
  const reports = [
    { id: 'REP-001', title: 'Q4 Global Disruption & Demurrage Audit', category: 'Financial Loss Engine', date: 'Nov 18, 2026', size: '2.4 MB', status: 'Generated', impact: '$42,000 Risk Saved' },
    { id: 'REP-002', title: 'Port Congestion & Dwell Benchmark Report', category: 'Terminal Operations', date: 'Nov 15, 2026', size: '4.1 MB', status: 'Generated', impact: 'Yokohama 74% load' },
    { id: 'REP-003', title: 'OR-Tools CP-SAT Solver Recovery Synthesis', category: 'Mathematical Solver', date: 'Nov 12, 2026', size: '1.8 MB', status: 'Generated', impact: '3 Route Options' },
    { id: 'REP-004', title: 'SKU Stockout Predictive Horizon (30 Days)', category: 'Inventory Intelligence', date: 'Nov 08, 2026', size: '3.2 MB', status: 'Generated', impact: '6 Critical Items' },
  ]

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">ANALYTICS & EXECUTIVE EXPORTS</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f]">Reports & Decision Audit</h2>
          <p className="text-xs text-[#6e6e73]">Downloadable executive summaries, financial risk distribution, and ML model accuracy logs</p>
        </div>

        <button 
          onClick={() => alert('📥 Generating Executive Supply Chain Summary PDF...')}
          className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition"
        >
          <Download className="size-4" /> Export All Reports (PDF)
        </button>
      </div>

      {/* Reports Summary KPI */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">TOTAL FINANCIAL LOSS MITIGATED</p>
          <p className="mt-2 text-2xl font-bold text-[#34c759]">$324,500 USD</p>
          <p className="mt-1 text-xs text-[#34c759]">Through OR-Tools automated rerouting</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">MODEL PREDICTION ACCURACY</p>
          <p className="mt-2 text-2xl font-bold text-[#087ef5]">94.6%</p>
          <p className="mt-1 text-xs text-[#6e6e73]">Across XGBoost & LightGBM models</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">AVG TIME TO RECOVER VOYAGE</p>
          <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">14.2 Mins</p>
          <p className="mt-1 text-xs text-[#34c759]">Down from 6.8 hours manual</p>
        </div>
      </div>

      {/* Reports List */}
      <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1d1d1f]">
            <thead className="border-b border-[#e5e5e7] bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
              <tr>
                <th className="px-5 py-3.5">Report Title</th>
                <th className="px-5 py-3.5">Intelligence Category</th>
                <th className="px-5 py-3.5">Key Impact / Metric</th>
                <th className="px-5 py-3.5">Date Generated</th>
                <th className="px-5 py-3.5 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f2]">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-[#fafaf9] transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-[#087ef5]/10 text-[#087ef5]">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1d1d1f]">{report.title}</p>
                        <p className="text-[10px] font-mono text-[#86868b]">{report.id} · {report.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#6e6e73]">{report.category}</td>
                  <td className="px-5 py-4 font-semibold text-[#087ef5]">{report.impact}</td>
                  <td className="px-5 py-4 text-[#6e6e73]">{report.date}</td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => alert(`📥 Downloading ${report.title} (${report.size})...`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e5e7] bg-[#f5f5f7] px-3 py-1.5 text-[10px] font-semibold hover:bg-slate-200 transition"
                    >
                      <Download className="size-3" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
