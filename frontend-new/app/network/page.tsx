'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Globe2, MapPin, Ship, Warehouse } from 'lucide-react'

const metricData = [
  { value: 1842, display: (value: number) => Math.round(value).toLocaleString(), label: 'ACTIVE VESSELS' },
  { value: 247, display: (value: number) => Math.round(value).toLocaleString(), label: 'ACTIVE ROUTES' },
  { value: 12430, display: (value: number) => Math.round(value).toLocaleString(), label: 'FACILITIES' },
  { value: 94.7, display: (value: number) => `${value.toFixed(1)}%`, label: 'NETWORK HEALTH' },
]

const nodes = [
  { name: 'SUPPLIER', x: '8%', y: '70%', icon: Warehouse },
  { name: 'FACTORY', x: '26%', y: '35%', icon: Warehouse },
  { name: 'PORT', x: '46%', y: '70%', icon: MapPin },
  { name: 'VESSEL', x: '66%', y: '30%', icon: Ship },
  { name: 'WAREHOUSE', x: '78%', y: '72%', icon: Warehouse },
  { name: 'CUSTOMER', x: '94%', y: '42%', icon: MapPin },
]

function AnimatedMetric({ value, display, label }: typeof metricData[number]) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 1300
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <div><div className="text-3xl font-medium tracking-[-0.06em] md:text-5xl">{display(current)}</div><div className="mt-2 text-[10px] font-medium tracking-[0.16em] text-muted-foreground">{label}</div></div>
}

export default function NetworkPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#1d1d1f] selection:bg-[#087ef5] selection:text-white font-sans antialiased">
      {/* Top Floating Glass Navigation Header */}
      <header className="fixed top-4 inset-x-4 z-50 mx-auto flex h-14 max-w-[1440px] items-center justify-between rounded-[24px] border border-white/90 bg-white/80 px-6 shadow-[0_16px_36px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-2xl md:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-xs font-bold tracking-[-0.02em]">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <span className="size-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
          </span>
          <span className="font-black text-[#1d1d1f]">FLOWFORGE</span>
          <span className="text-[#86868b] font-medium hidden sm:inline">/ GLOBAL NETWORK</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#6e6e73] transition-colors hover:text-[#087ef5]">
          <ArrowLeft className="size-3.5" /> BACK TO OVERVIEW
        </Link>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-32 md:px-12 md:pb-24 md:pt-36">
        <div className="grid gap-8 md:grid-cols-[.75fr_1.25fr] md:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#087ef5]/30 bg-[#087ef5]/10 px-4 py-1 text-[10px] font-black tracking-[0.2em] text-[#087ef5] uppercase">
              NETWORK COMMAND · 01
            </span>
            <h1 className="text-6xl font-black leading-[.92] tracking-[-0.08em] text-[#1d1d1f] md:text-8xl">
              The whole<br />system.
            </h1>
          </div>
          <p className="max-w-md text-sm font-semibold leading-6 text-[#6e6e73]">
            A living operational digital twin of every vessel, port, route, facility, and satellite telemetry signal moving through the global maritime supply chain network.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-3 text-[10px] font-bold tracking-[0.16em] text-[#86868b]">
          <span className="flex items-center gap-2 text-[#1d1d1f] rounded-full bg-white px-3 py-1 border border-white/90 shadow-sm">
            <span className="size-2 rounded-full bg-[#34C759] shadow-[0_0_6px_#34C759] animate-pulse" /> LIVE TELEMETRY
          </span>
          <span>·</span>
          <span>08:42 UTC</span>
          <span>·</span>
          <span>GLOBAL VIEW</span>
        </div>
      </section>

      {/* Big Clay-Glass Network Topology Card */}
      <section className="mx-auto max-w-[1440px] px-5 md:px-12">
        <div className="relative min-h-[520px] overflow-hidden rounded-[36px] border border-white/90 bg-white/80 p-6 md:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.08),inset_0_3px_6px_rgba(255,255,255,0.95)] backdrop-blur-2xl text-[#1d1d1f]">
          <div className="relative flex min-h-[480px] flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 rounded-full border border-white/90 bg-white px-4 py-1.5 text-[10px] font-black tracking-[0.16em] text-[#1d1d1f] shadow-sm">
                <Globe2 className="size-4 text-[#087ef5]" /> GLOBAL TOPOLOGY TWIN
              </span>
              <span className="text-[10px] font-bold tracking-[0.14em] text-[#86868b]">ORION INTELLIGENCE LAYER</span>
            </div>

            <div className="relative mx-auto h-[245px] w-full max-w-5xl my-6">
              <svg className="absolute inset-0 size-full" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
                <path d="M80 215 C220 80 330 220 465 205 S650 75 940 130" fill="none" stroke="#d2d2d7" strokeWidth="2" strokeDasharray="5 8" className="motion-safe:animate-[routeDraw_2.5s_ease-out_both]" />
                <path d="M250 105 C370 180 580 170 780 220" fill="none" stroke="#087ef5" strokeWidth="2.5" strokeDasharray="4 7" className="motion-safe:animate-[routeDraw_2.8s_300ms_ease-out_both]" />
                <path d="M80 215 C245 245 330 90 470 205 S780 220 940 130" fill="none" stroke="#34c759" strokeWidth="1.8" strokeDasharray="3 8" className="motion-safe:animate-[routeDraw_3s_500ms_ease-out_both]" />
              </svg>
              {nodes.map(({ name, x, y, icon: Icon }, index) => (
                <div key={name} className="absolute -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[nodeIn_500ms_cubic-bezier(.22,1,.36,1)_both]" style={{ left: x, top: y, animationDelay: `${index * 120}ms` }}>
                  <div className={`flex size-12 items-center justify-center rounded-2xl border shadow-[0_6px_16px_rgba(0,0,0,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] ${name === 'PORT' || name === 'VESSEL' ? 'border-[#087ef5] bg-[#087ef5] text-white shadow-[0_8px_20px_rgba(8,126,245,0.35)]' : 'border-white/90 bg-white text-[#1d1d1f]'}`}>
                    <Icon className="size-5" />
                  </div>
                  <span className="mt-2 block whitespace-nowrap text-center text-[10px] font-black tracking-[0.14em] text-[#1d1d1f]">{name}</span>
                </div>
              ))}
            </div>

            {/* Bottom Metrics Grid in Clay-Glass Style */}
            <div className="grid grid-cols-2 gap-4 rounded-3xl border border-white/90 bg-white/70 p-5 md:grid-cols-4 shadow-[0_12px_28px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-md">
              {metricData.map((metric) => (
                <AnimatedMetric key={metric.label} {...metric} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Transitions */}
      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-12 md:py-32">
        <div className="grid gap-12 md:grid-cols-[.65fr_1.35fr] md:items-start">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#087ef5]/30 bg-[#087ef5]/10 px-4 py-1 text-[10px] font-black tracking-[0.2em] text-[#087ef5] uppercase">
              NETWORK VIEW · 02
            </span>
            <h2 className="text-5xl font-black leading-[.96] tracking-[-0.07em] text-[#1d1d1f] md:text-7xl">
              From Earth<br />to Yokohama.
            </h2>
            <p className="mt-6 max-w-sm text-sm font-semibold leading-6 text-[#6e6e73]">
              The same unified system, viewed at the tactical and strategic scale where operational decisions become visible.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/90 bg-white/80 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between text-[10px] font-black tracking-[0.16em]">
              <span className="text-[#1d1d1f]">WAYPOINT CORRIDOR CONTINUITY</span>
              <span className="text-[#087ef5]">OR-TOOLS CP-SAT READY</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              {['EARTH', 'MUMBAI', 'SINGAPORE', 'YOKOHAMA'].map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`rounded-full px-5 py-3 text-[10px] font-black tracking-[0.16em] shadow-sm ${
                    index === 3
                      ? 'bg-[#087ef5] text-white shadow-[0_8px_20px_rgba(8,126,245,0.35)]'
                      : 'border border-white/90 bg-white text-[#1d1d1f]'
                  }`}>
                    {label}
                  </span>
                  {index < 3 && <ArrowRight className="size-3.5 text-[#86868b]" />}
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-lg text-sm font-medium leading-6 text-[#6e6e73]">
              A calm and continuous handoff between operational scales. Move through these waypoints seamlessly with live AIS satellite and ocean radar feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e7]/80 bg-white py-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 md:px-12">
          <span className="text-[10px] font-bold tracking-[0.16em] text-[#86868b]">FLOWFORGE · GLOBAL NETWORK</span>
          <Link href="/" className="text-[10px] font-black tracking-[0.16em] text-[#087ef5] hover:underline">RETURN HOME</Link>
        </div>
      </footer>
    </main>
  )
}
