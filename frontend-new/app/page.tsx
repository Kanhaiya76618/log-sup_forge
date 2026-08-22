'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Globe2, Menu, X } from 'lucide-react'

// Status dot badge component
function Status({ label, tone = 'success' }: { label: string; tone?: 'success' | 'warning' | 'critical' }) {
  const colors = { 
    success: 'bg-[#34C759]', 
    warning: 'bg-[#FF9F0A]', 
    critical: 'bg-[#FF3B30]' 
  }
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.13em] text-white">
      <span className={`size-1.5 rounded-full ${colors[tone]}`} />
      {label}
    </span>
  )
}

// Metric number + label component
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-medium tracking-[-0.05em] md:text-4xl text-white">{value}</div>
      <div className="mt-2 text-[10px] font-medium tracking-[0.14em] text-white/50">{label}</div>
    </div>
  )
}

// Team Orion lettermark in footer
function OrionTeamMark() {
  return (
    <div className="flex flex-col items-start text-[10px] font-medium tracking-[0.22em] text-white/70">
      <div className="flex gap-[0.18em]">
        {['O', 'R', 'I', 'O', 'N'].map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <span className="mt-2 h-px w-12 bg-white/35" />
      <span className="mt-2">TEAM ORION</span>
    </div>
  )
}

const navLinks = [
  { label: 'OVERVIEW', href: '/dashboard' },
  { label: 'NETWORK', href: '/network' },
  { label: 'DASHBOARD', href: '/dashboard' },
  { label: 'SIMULATE', href: '/dashboard' },
]

const agentList = [
  { name: 'AIS RADAR SENTINEL', status: 'READY' },
  { name: 'DISRUPTION FORECASTER (XGBoost)', status: 'INFERENCE ACTIVE' },
  { name: 'ETA SLIP ESTIMATOR (LightGBM)', status: 'READY' },
  { name: 'PORT QUAY SENTINEL', status: 'READY' },
  { name: 'SUPPLY CHAIN SHIELD', status: 'READY' },
  { name: 'DEMURRAGE & EXPOSURE ASSESSOR', status: 'READY' },
  { name: 'PARETO ROUTE NAVIGATOR', status: 'READY' },
  { name: 'STOCHASTIC HORIZON SIMULATOR', status: 'READY' },
  { name: 'AUTONOMOUS HARBOR ORCHESTRATOR', status: 'READY' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        window.location.href = '/dashboard'
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <main className="min-h-screen bg-[#0d0d0f] text-white selection:bg-[#087ef5] selection:text-white font-sans antialiased">
      
      {/* 🔝 Section 1 — Fixed Navigation Bar */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 md:px-8">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between rounded-2xl border border-white/10 bg-[#121214]/80 px-5 shadow-2xl backdrop-blur-xl">
          {/* Left — Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-xs font-bold tracking-[-0.02em]">
            <span className="flex size-6 items-center justify-center rounded-full bg-white">
              <span className="size-1.5 rounded-full bg-[#121214]" />
            </span>
            <span className="font-bold text-white tracking-[-0.02em]">FLOWFORGE</span>
            <span className="hidden font-normal text-white/50 sm:inline">/ MARITIME DISRUPTION OS</span>
          </Link>

          {/* Center — Nav Links */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[10px] font-semibold tracking-[0.14em] text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right — CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-slate-200 transition active:scale-95"
            >
              LAUNCH APP <ArrowRight className="size-3.5" />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle mobile menu"
              className="p-2 text-white/70 hover:text-white lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="mx-auto mt-2 max-w-[1440px] rounded-3xl border border-white/10 bg-[#121214] p-5 shadow-2xl backdrop-blur-2xl lg:hidden">
            <div className="flex flex-col gap-4 text-xs font-semibold">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-white/70 hover:text-white transition"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-white py-3 text-xs font-semibold text-black hover:bg-slate-200"
              >
                LAUNCH APP <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 🚢 Section 2 — Hero */}
      <section className="relative min-h-[880px] flex items-end overflow-hidden pt-24">
        {/* Background image */}
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/container_ship_bow_aerial-hNoZgjNIJAXUjGfXonFiDArBApenba.webp"
          alt="Container Ship Aerial Bow"
          className="absolute inset-0 size-full object-cover opacity-70"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/60 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-16 md:px-12 md:pb-24">
          <div className="max-w-3xl">
            <span className="mb-6 block text-[10px] font-semibold tracking-[0.22em] text-[#087ef5] uppercase">
              A LIVING INTELLIGENCE LAYER FOR GLOBAL SUPPLY CHAINS
            </span>

            <h1 className="text-6xl font-semibold leading-[.94] tracking-[-0.07em] text-white md:text-9xl">
              COMMAND<br />THE FLOW.
            </h1>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row">
              <p className="max-w-md text-sm leading-6 text-white/75 md:text-base">
                See the system. Predict the disruption. Shape the maritime outcome with 9 collaborative AI decision agents.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-[#087ef5] px-6 py-3.5 text-xs font-semibold text-white hover:bg-[#076ecf] transition active:scale-95 flex items-center gap-2"
              >
                ENTER COMMAND CENTER <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/network"
                className="rounded-full border border-white/25 px-6 py-3.5 text-xs font-medium text-white hover:bg-white/10 transition flex items-center gap-2"
              >
                GLOBAL NETWORK
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🌐 Section 3 — Global Network (01) */}
      <section className="bg-[#0d0d0f] py-24 md:py-32">
        <div className="mx-auto max-w-[1440px] px-5 md:px-12">
          {/* Header Row */}
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <span className="mb-3 block text-[10px] font-semibold tracking-[0.2em] text-[#087ef5] uppercase">
                01 · GLOBAL NETWORK
              </span>
              <h2 className="text-4xl font-semibold leading-[.98] tracking-[-0.065em] text-white md:text-6xl">
                The whole system,<br />in one view.
              </h2>
            </div>
            <p className="max-w-sm text-xs leading-6 text-white/60">
              Every vessel, port, route, facility, and satellite telemetry signal connected in a single operational digital twin.
            </p>
          </div>

          {/* Big Card */}
          <div className="relative mt-14 min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-[#161619]">
            {/* Background image */}
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/container_port_aerial-cfcTcy8nZNAaq4T0zDJ74VhW7yZJcp.webp"
              alt="Container Port Aerial"
              className="absolute inset-0 size-full object-cover opacity-50"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-[#0d0d0f]/60" />

            {/* Overlaid Content */}
            <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-6 md:p-10">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-white">
                  <Globe2 className="size-4 text-[#087ef5]" /> LIVE NETWORK
                </span>
                <Status label="NETWORK HEALTH 94.7%" tone="success" />
              </div>

              {/* Bottom Metrics Grid */}
              <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 md:grid-cols-4">
                <Metric value="1,842" label="ACTIVE VESSELS" />
                <Metric value="247" label="ACTIVE ROUTES" />
                <Metric value="12,430" label="FACILITIES" />
                <Metric value="94.7%" label="NETWORK HEALTH" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🤖 Section 4 — 9-Agent AI System (02) */}
      <section className="border-t border-white/10 bg-[#121215] py-24 md:py-32">
        <div className="mx-auto max-w-[1440px] px-5 md:px-12">
          <div className="grid gap-12 md:grid-cols-[.8fr_1.2fr]">
            {/* Left Column */}
            <div>
              <span className="mb-3 block text-[10px] font-semibold tracking-[0.2em] text-[#087ef5] uppercase">
                02 · MULTI-AGENT ARCHITECTURE
              </span>
              <h2 className="text-4xl font-semibold leading-[.98] tracking-[-0.065em] text-white md:text-6xl">
                Autonomous<br />decision loops.
              </h2>
              <p className="mt-6 max-w-sm text-xs leading-6 text-white/60">
                Machine learning models and combinatorial constraint solvers cooperate in sub-second intervals to resolve maritime exceptions.
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black hover:bg-slate-200 transition"
              >
                OPEN DECISION STUDIO <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Right Column — 9 Agent Cards */}
            <div className="space-y-2.5">
              {agentList.map((agent, index) => {
                const isHighlighted = index === 1
                return (
                  <div
                    key={agent.name}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-xs transition ${
                      isHighlighted
                        ? 'border-[#087ef5] bg-[#18181c] ring-1 ring-[#087ef5]'
                        : 'border-white/10 bg-[#18181c]'
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        isHighlighted ? 'bg-[#087ef5]' : 'bg-white/30'
                      }`}
                    />
                    <span className="font-semibold text-white truncate">{agent.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-white/50 shrink-0">
                      {agent.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 🔻 Section 5 — Footer */}
      <footer className="border-t border-white/10 bg-[#0d0d0f] py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 md:flex-row md:items-center md:justify-between md:px-12">
          {/* Left */}
          <div>
            <p className="text-2xl font-semibold tracking-[-0.04em] text-white">FLOWFORGE OS</p>
            <p className="mt-1 text-[10px] text-white/40 uppercase tracking-wider">
              MARITIME SUPPLY CHAIN DECISION INTELLIGENCE
            </p>
          </div>

          {/* Center — Team Mark */}
          <OrionTeamMark />

          {/* Right */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#087ef5] hover:underline"
          >
            ENTER DASHBOARD <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </footer>
    </main>
  )
}
