'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Layers3, Sparkles, ArrowRight, ShieldCheck, RefreshCw, Trash2 } from 'lucide-react'
import { getSavedScenarios, deleteScenario, clearAllScenarios } from '@/lib/scenarioData'
import { AnalysisResult } from '@/lib/types'
import HistoryCard from '@/components/scenarios/history/HistoryCard'

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<AnalysisResult[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [deletedMsg, setDeletedMsg] = useState<string | null>(null)

  useEffect(() => {
    setScenarios(getSavedScenarios())
  }, [])

  const handleDelete = (id: string) => {
    const updated = deleteScenario(id)
    setScenarios(updated)
    setDeletedMsg(`Deleted scenario ${id}`)
    setTimeout(() => setDeletedMsg(null), 2500)
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all scenario history?')) {
      clearAllScenarios()
      setScenarios([])
      setDeletedMsg('Cleared all scenario history')
      setTimeout(() => setDeletedMsg(null), 2500)
    }
  }

  const filtered = scenarios.filter(s => 
    s?.scenarioInput?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s?.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s?.affectedCorridor?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#1d1d1f] selection:bg-[#087ef5] selection:text-white">
      {/* Top Floating Glass Header */}
      <header className="fixed inset-x-4 top-4 z-50 mx-auto flex h-14 max-w-[1600px] items-center justify-between rounded-2xl border border-[#d2d2d7]/70 bg-white/80 px-4 shadow-[0_12px_40px_rgba(0,0,0,.08)] backdrop-blur-2xl md:inset-x-8 md:px-5">
        <a href="/dashboard" className="flex items-center gap-2 text-xs font-semibold tracking-[-.02em] shrink-0">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#1d1d1f]">
            <span className="size-1.5 rounded-full bg-white" />
          </span>
          <span className="whitespace-nowrap font-black">FLOWFORGE</span>
          <span className="hidden xl:inline text-[#86868b] font-normal whitespace-nowrap">/ SCENARIO INTELLIGENCE</span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition"
          >
            ← Back to Dashboard
          </a>
          <a
            href="/scenarios/new"
            className="flex items-center gap-1.5 rounded-xl bg-[#087ef5] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf] transition"
          >
            <Plus className="size-3.5" /> Create Scenario
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-[1400px] px-4 pb-12 pt-28 md:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="flow-label text-[#087ef5]">DISRUPTION SIMULATION REPOSITORY</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f] md:text-3xl">
              Scenario History & Recovery Models
            </h1>
            <p className="mt-1 text-xs text-[#6e6e73]">
              Review past disruption evaluations, OR-Tools solver runs, and digital twin results. ({scenarios.length} saved)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            {scenarios.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-xl border border-[#ff3b30]/30 bg-[#fff5f4] px-3.5 py-2.5 text-xs font-semibold text-[#ff3b30] hover:bg-[#ffebe8] transition active:scale-95"
              >
                <Trash2 className="size-3.5" /> Clear All
              </button>
            )}
            <a
              href="/scenarios/new"
              className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-black transition active:scale-95"
            >
              <Plus className="size-4" /> New Simulation Wizard
            </a>
          </div>
        </div>

        {deletedMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] text-white px-4 py-2.5 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <Trash2 className="size-3.5 text-[#ff3b30]" />
            <span>{deletedMsg}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#d2d2d7] bg-white p-3 shadow-sm">
          <Search className="size-4 text-[#86868b]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scenarios by title, ID, or corridor..."
            className="w-full bg-transparent text-xs text-[#1d1d1f] outline-none placeholder:text-[#86868b]"
          />
        </div>

        {/* History List */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <HistoryCard key={item.id} scenario={item} onDelete={handleDelete} />
            ))
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center border border-[#d2d2d7]">
              <p className="text-sm font-semibold text-[#1d1d1f]">No scenarios in history</p>
              <p className="text-xs text-[#86868b] mt-1">Create a new scenario simulation to start building decision models.</p>
              <a
                href="/scenarios/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#087ef5] px-4 py-2 text-xs font-semibold text-white shadow-sm"
              >
                <Plus className="size-3.5" /> Create Scenario
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
