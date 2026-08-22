'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Globe2, Menu, X, ShieldCheck, Sparkles, Navigation, Layers3 } from 'lucide-react'

// Status dot badge component with Clay-Glass styling
function Status({ label, tone = 'success' }: { label: string; tone?: 'success' | 'warning' | 'critical' }) {
  const colors = {
    success: 'bg-[#34C759] shadow-[0_0_8px_#34C759]',
    warning: 'bg-[#FF9F0A] shadow-[0_0_8px_#FF9F0A]',
    critical: 'bg-[#FF3B30] shadow-[0_0_8px_#FF3B30]'
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#1d1d1f] shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-md">
      <span className={`size-2 rounded-full ${colors[tone]} animate-pulse`} />
      {label}
    </span>
  )
}

// Metric number + label component with Clay-Glass card effect
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-sm transition hover:translate-y-[-2px]">
      <div className="text-3xl font-black tracking-[-0.05em] text-[#1d1d1f] md:text-4xl">{value}</div>
      <div className="mt-1.5 text-[10px] font-bold tracking-[0.14em] text-[#86868b] uppercase">{label}</div>
    </div>
  )
}

// Team Orion lettermark in footer
function OrionTeamMark() {
  return (
    <div className="flex flex-col items-start text-[10px] font-medium tracking-[0.22em] text-[#6e6e73]">
      <div className="flex gap-[0.18em]">
        {['O', 'R', 'I', 'O', 'N'].map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <span className="mt-2 h-px w-12 bg-[#d2d2d7]" />
      <span className="mt-2 text-[9px] font-bold tracking-[0.18em] text-[#86868b]">TEAM ORION</span>
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
  { name: 'AIS RADAR SENTINEL', status: 'READY', desc: 'Real-time satellite & terrestrial transponder tracking' },
  { name: 'DISRUPTION FORECASTER (XGBoost)', status: 'INFERENCE ACTIVE', desc: 'Swell decay & multi-chokepoint early warning' },
  { name: 'ETA SLIP ESTIMATOR (LightGBM)', status: 'READY', desc: 'Predictive port arrival delay estimation' },
  { name: 'PORT QUAY SENTINEL', status: 'READY', desc: 'Crane velocity & berth queue forecasting' },
  { name: 'SUPPLY CHAIN SHIELD', status: 'READY', desc: 'Tier-1/2 inventory shockwave containment' },
  { name: 'DEMURRAGE & EXPOSURE ASSESSOR', status: 'READY', desc: 'Financial penalty & SLA risk quantification' },
  { name: 'PARETO ROUTE NAVIGATOR', status: 'READY', desc: 'Google OR-Tools multi-objective combinatorial solver' },
  { name: 'STOCHASTIC HORIZON SIMULATOR', status: 'READY', desc: '500-sample Monte Carlo probabilistic twin' },
  { name: 'AUTONOMOUS HARBOR ORCHESTRATOR', status: 'READY', desc: 'Automated EDI 214 & dispatch notifications' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  // Guarantee continuous smooth video playback without pause
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: already muted
      })
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#1d1d1f] selection:bg-[#087ef5] selection:text-white font-sans antialiased">

      {/* 🔝 Section 1 — Clay-Glass Navigation Bar */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 md:px-8">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between rounded-[24px] border border-white/90 bg-white/80 px-6 shadow-[0_16px_36px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(0,0,0,0.02)] backdrop-blur-2xl">
          {/* Left — Logo */}
          <Link href="/" className="flex items-center gap-3 text-xs font-bold tracking-[-0.02em] group">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#1d1d1f] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)] transition group-hover:scale-105">
              <span className="size-2 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
            </span>
            <span className="font-extrabold text-[#1d1d1f] tracking-[-0.02em] text-sm">FLOWFORGE</span>
            <span className="hidden font-medium text-[#86868b] sm:inline">/ MARITIME DISRUPTION OS</span>
          </Link>

          {/* Center — Nav Links */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[10px] font-extrabold tracking-[0.16em] text-[#6e6e73] hover:text-[#087ef5] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right — CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full bg-[#087ef5] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(8,126,245,0.35),inset_0_2px_3px_rgba(255,255,255,0.4)] hover:bg-[#076ecf] hover:shadow-[0_10px_24px_rgba(8,126,245,0.45)] transition active:scale-95"
            >
              LAUNCH APP <ArrowRight className="size-3.5" />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle mobile menu"
              className="p-2 text-[#6e6e73] hover:text-[#1d1d1f] lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="mx-auto mt-2 max-w-[1440px] rounded-[28px] border border-white/90 bg-white/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)] backdrop-blur-2xl lg:hidden">
            <div className="flex flex-col gap-4 text-xs font-bold">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-[#1d1d1f] hover:text-[#087ef5] transition"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] py-3.5 text-xs font-bold text-white shadow-lg"
              >
                LAUNCH APP <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 🚢 Section 2 — Hero with Continuous Looping 4K MP4 Video */}
      <section className="relative min-h-[920px] flex items-end overflow-hidden pt-28">
        {/* Full Seamless Looping 4K Video Background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          className="absolute inset-0 size-full object-cover object-center pointer-events-none transform-gpu will-change-transform"
          onEnded={(e) => {
            e.currentTarget.currentTime = 0
            e.currentTarget.play()
          }}
          onPause={(e) => {
            e.currentTarget.play()
          }}
        >
          <source src="/0822.mp4" type="video/mp4" />
          Your browser does not support HTML5 video.
        </video>

        {/* Delicate Ambient Gradient for Soft Transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f7f8fa]/80 via-transparent to-black/10 pointer-events-none" />

        {/* Hero Content — Perfectly Balanced Compact Glassmorphic Card */}
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-12 md:px-12 md:pb-16">
          <div className="max-w-[560px] rounded-[30px] border border-white/55 bg-white/20 p-6 md:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.16),inset_0_1.5px_3px_rgba(255,255,255,0.7),inset_0_-1.5px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl transition hover:bg-white/25">

            {/* Pill Header */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/40 px-3.5 py-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-md">
              <Sparkles className="size-3 text-[#087ef5]" />
              <span className="text-[9px] font-black tracking-[0.18em] text-[#087ef5] uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                A LIVING INTELLIGENCE LAYER FOR GLOBAL SUPPLY CHAINS
              </span>
            </div>

            <h1 className="text-4xl font-black leading-[.94] tracking-[-0.06em] text-[#1d1d1f] sm:text-5xl md:text-6xl drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
              COMMAND<br />THE FLOW.
            </h1>

            <p className="mt-3.5 max-w-md text-xs sm:text-sm font-bold leading-relaxed text-[#1d1d1f] drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)]">
              See the whole system. Predict maritime disruptions before they cascade. Solve multi-objective route and cost alternatives with 9 collaborative AI decision agents.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-full bg-[#087ef5] px-5 py-3 text-[11px] font-black text-white shadow-[0_10px_24px_rgba(8,126,245,0.4),inset_0_1.5px_2px_rgba(255,255,255,0.45)] hover:bg-[#076ecf] hover:shadow-[0_14px_30px_rgba(8,126,245,0.5)] transition active:scale-95"
              >
                ENTER COMMAND CENTER <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/network"
                className="flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-5 py-3 text-[11px] font-bold text-[#1d1d1f] shadow-[0_6px_16px_rgba(0,0,0,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.9)] backdrop-blur-md hover:bg-white transition active:scale-95"
              >
                <Globe2 className="size-3.5 text-[#087ef5]" /> GLOBAL NETWORK
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🌐 Section 3 — Global Network (01) */}
      <section className="bg-[#f7f8fa] py-24 md:py-32 border-t border-[#e5e5e7]/80">
        <div className="mx-auto max-w-[1440px] px-5 md:px-12">
          {/* Header Row */}
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#087ef5]/25 bg-[#087ef5]/10 px-3.5 py-1 text-[10px] font-black tracking-[0.2em] text-[#087ef5] uppercase">
                01 · GLOBAL NETWORK
              </span>
              <h2 className="mt-2 text-4xl font-black leading-[.98] tracking-[-0.065em] text-[#1d1d1f] md:text-6xl">
                The whole system,<br />in one view.
              </h2>
            </div>
            <p className="max-w-sm text-xs font-medium leading-6 text-[#6e6e73]">
              Every vessel, port, route, facility, and satellite telemetry signal connected in a single operational digital twin.
            </p>
          </div>

          {/* Big Clay-Glass Card */}
          <div className="relative mt-14 min-h-[480px] overflow-hidden rounded-[36px] border border-white/90 bg-white/60 shadow-[0_24px_70px_rgba(0,0,0,0.08),inset_0_3px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(0,0,0,0.03)] backdrop-blur-xl">
            {/* Background image */}
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/container_port_aerial-cfcTcy8nZNAaq4T0zDJ74VhW7yZJcp.webp"
              alt="Container Port Aerial"
              className="absolute inset-0 size-full object-cover opacity-100"
            />
            {/* Soft vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

            {/* Overlaid Content */}
            <div className="relative z-10 flex min-h-[480px] flex-col justify-between p-6 md:p-10">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 rounded-full border border-white/90 bg-white/85 px-4 py-1.5 text-[10px] font-black tracking-[0.16em] text-[#1d1d1f] shadow-[0_6px_18px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] backdrop-blur-md">
                  <Globe2 className="size-4 text-[#087ef5]" /> LIVE NETWORK
                </span>
                <Status label="NETWORK HEALTH 94.7%" tone="success" />
              </div>

              {/* Bottom Metrics Frosted Glass Grid */}
              <div className="grid grid-cols-2 gap-4 rounded-3xl border border-white/90 bg-white/80 p-5 md:grid-cols-4 shadow-[0_16px_40px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-xl">
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
      <section className="border-t border-[#e5e5e7]/80 bg-[#f0f2f5] py-24 md:py-32">
        <div className="mx-auto max-w-[1440px] px-5 md:px-12">
          <div className="grid gap-12 md:grid-cols-[.8fr_1.2fr]">
            {/* Left Column */}
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#087ef5]/25 bg-[#087ef5]/10 px-3.5 py-1 text-[10px] font-black tracking-[0.2em] text-[#087ef5] uppercase">
                02 · MULTI-AGENT ARCHITECTURE
              </span>
              <h2 className="mt-2 text-4xl font-black leading-[.98] tracking-[-0.065em] text-[#1d1d1f] md:text-6xl">
                Autonomous<br />decision loops.
              </h2>
              <p className="mt-6 max-w-sm text-xs font-medium leading-6 text-[#6e6e73]">
                Machine learning models and combinatorial constraint solvers cooperate in sub-second intervals to resolve maritime exceptions.
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-6 py-3.5 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)] hover:bg-black transition active:scale-95"
              >
                OPEN DECISION STUDIO <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Right Column — 9 Agent Cards in Clay-Glass Style */}
            <div className="space-y-3">
              {agentList.map((agent, index) => {
                const isHighlighted = index === 1
                return (
                  <div
                    key={agent.name}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-[22px] border p-4 text-xs transition duration-200 ${
                      isHighlighted
                        ? 'border-[#087ef5] bg-white ring-2 ring-[#087ef5]/20 shadow-[0_12px_28px_rgba(8,126,245,0.15),inset_0_2px_4px_rgba(255,255,255,0.95)]'
                        : 'border-white/90 bg-white/80 shadow-[0_6px_18px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:bg-white hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-2.5 rounded-full shrink-0 ${
                          isHighlighted ? 'bg-[#087ef5] shadow-[0_0_8px_#087ef5] animate-pulse' : 'bg-[#d2d2d7]'
                        }`}
                      />
                      <div>
                        <span className="font-extrabold text-[#1d1d1f] block">{agent.name}</span>
                        <span className="text-[10px] text-[#86868b] font-medium">{agent.desc}</span>
                      </div>
                    </div>

                    <span className={`self-start sm:self-center font-mono text-[9.5px] font-bold shrink-0 px-2.5 py-1 rounded-full ${
                      isHighlighted ? 'bg-[#eef7ff] text-[#087ef5] border border-[#087ef5]/20' : 'bg-[#f5f5f7] text-[#86868b]'
                    }`}>
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
      <footer className="border-t border-[#e5e5e7]/80 bg-white py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 md:flex-row md:items-center md:justify-between md:px-12">
          {/* Left */}
          <div>
            <p className="text-2xl font-black tracking-[-0.04em] text-[#1d1d1f]">FLOWFORGE OS</p>
            <p className="mt-1 text-[10px] text-[#86868b] uppercase tracking-wider font-bold">
              MARITIME SUPPLY CHAIN DECISION INTELLIGENCE
            </p>
          </div>

          {/* Center — Team Mark */}
          <OrionTeamMark />

          {/* Right */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-black text-[#087ef5] hover:underline"
          >
            ENTER DASHBOARD <ArrowRight className="size-4" />
          </Link>
        </div>
      </footer>
    </main>
  )
}
