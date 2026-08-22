'use client'

import React, { useState } from 'react'
import { Sliders, Zap, Plus, CheckCircle2, Clock, Play, Power } from 'lucide-react'
import { AutomationRule } from '@/lib/mockData'

interface AutomationViewProps {
  rules: AutomationRule[]
  onToggleRule: (id: string) => void
}

export default function AutomationView({ rules, onToggleRule }: AutomationViewProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">AGENT TRIGGER POLICIES</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f]">Automation & HITL Rules</h2>
          <p className="text-xs text-[#6e6e73]">Configure multi-agent triggers, automated recovery rerouting, and threshold alerts</p>
        </div>

        <button className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition">
          <Plus className="size-4" /> Create Rule
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm hover:border-[#087ef5]/50 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex size-8 items-center justify-center rounded-xl ${
                  rule.enabled ? 'bg-[#087ef5]/10 text-[#087ef5]' : 'bg-[#f0f0f2] text-[#86868b]'
                }`}>
                  <Zap className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1d1d1f]">{rule.title}</h3>
                  <p className="text-[10px] font-mono text-[#087ef5] mt-0.5">{rule.agent}</p>
                </div>
              </div>

              <button 
                onClick={() => onToggleRule(rule.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold transition ${
                  rule.enabled 
                    ? 'bg-[#e8f8ed] text-[#34c759]' 
                    : 'bg-[#f0f0f2] text-[#86868b]'
                }`}
              >
                <Power className="size-3" /> {rule.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-xl bg-[#fafaf9] p-3 border border-[#e5e5e7] text-xs">
              <div>
                <span className="text-[9px] font-semibold text-[#86868b] uppercase">Trigger Condition:</span>
                <p className="font-medium text-[#1d1d1f] mt-0.5">{rule.trigger}</p>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-[#86868b] uppercase">Autonomous Action:</span>
                <p className="font-medium text-[#1d1d1f] mt-0.5">{rule.action}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-[#86868b]">
              <span>Last Execution: <strong>{rule.lastRun}</strong></span>
              <span className="text-[#34c759] font-medium">● 0 errors in last 50 runs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
