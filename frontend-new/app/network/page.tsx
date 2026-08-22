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
  return <main className="min-h-screen bg-background text-foreground">
    <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-6 md:px-12">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em]"><span className="flex size-6 items-center justify-center rounded-full bg-foreground"><span className="size-1.5 rounded-full bg-background" /></span>FLOWFORGE</Link>
      <Link href="/" className="flex items-center gap-2 text-[10px] font-medium tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-3.5" /> BACK TO OVERVIEW</Link>
    </header>

    <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-20 md:px-12 md:pb-32 md:pt-28">
      <div className="grid gap-12 md:grid-cols-[.75fr_1.25fr] md:items-end"><div><p className="mb-5 text-[10px] font-medium tracking-[0.22em] text-[#0A84FF]">NETWORK COMMAND · 01</p><h1 className="text-balance text-6xl font-medium leading-[.92] tracking-[-0.08em] md:text-9xl">The whole<br />system.</h1></div><p className="max-w-md text-sm leading-6 text-muted-foreground">A living operational picture of every vessel, port, route, facility, and signal moving through the global network.</p></div>
      <div className="mt-20 flex flex-wrap items-center gap-3 text-[10px] font-medium tracking-[0.16em] text-muted-foreground"><span className="flex items-center gap-2 text-foreground"><span className="size-1.5 rounded-full bg-[#34C759]" /> LIVE</span><span>·</span><span>08:42 UTC</span><span>·</span><span>GLOBAL VIEW</span></div>
    </section>

    <section className="mx-auto max-w-[1440px] px-5 md:px-12"><div className="relative min-h-[510px] overflow-hidden rounded-[28px] border border-border bg-[#111111] text-white"><div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.09) 1px, transparent 1px)', backgroundSize: '80px 80px' }} /><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,.16),transparent_65%)]" /><div className="relative flex min-h-[510px] flex-col justify-between p-6 md:p-10"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[10px] tracking-[0.16em]"><Globe2 className="size-4" /> GLOBAL NETWORK</span><span className="text-[10px] tracking-[0.14em] text-white/45">ORION INTELLIGENCE LAYER</span></div><div className="relative mx-auto h-[245px] w-full max-w-5xl"><svg className="absolute inset-0 size-full" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><path d="M80 215 C220 80 330 220 465 205 S650 75 940 130" fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="1" strokeDasharray="5 8" className="motion-safe:animate-[routeDraw_2.5s_ease-out_both]" /><path d="M250 105 C370 180 580 170 780 220" fill="none" stroke="rgba(10,132,255,.9)" strokeWidth="1.2" strokeDasharray="4 7" className="motion-safe:animate-[routeDraw_2.8s_300ms_ease-out_both]" /><path d="M80 215 C245 245 330 90 470 205 S780 220 940 130" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1" strokeDasharray="2 10" className="motion-safe:animate-[routeDraw_3s_500ms_ease-out_both]" /></svg>{nodes.map(({ name, x, y, icon: Icon }, index) => <div key={name} className="absolute -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[nodeIn_500ms_cubic-bezier(.22,1,.36,1)_both]" style={{ left: x, top: y, animationDelay: `${index * 120}ms` }}><div className={`flex size-10 items-center justify-center rounded-full border ${name === 'PORT' ? 'border-[#0A84FF] bg-[#0A84FF]/20' : 'border-white/35 bg-white/10'} backdrop-blur`}><Icon className="size-4" /></div><span className="mt-2 block whitespace-nowrap text-[9px] tracking-[0.14em] text-white/65">{name}</span></div>)}</div><div className="grid grid-cols-2 gap-8 border-t border-white/15 pt-7 md:grid-cols-4">{metricData.map((metric) => <AnimatedMetric key={metric.label} {...metric} />)}</div></div></div></section>

    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-12 md:py-36"><div className="grid gap-12 md:grid-cols-[.65fr_1.35fr] md:items-start"><div><p className="mb-5 text-[10px] font-medium tracking-[0.22em] text-[#0A84FF]">NETWORK VIEW · 02</p><h2 className="text-balance text-5xl font-medium leading-[.96] tracking-[-0.07em] md:text-7xl">From Earth<br />to Yokohama.</h2><p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">The same system, viewed at the level where decisions become visible.</p></div><div className="rounded-[24px] border border-border bg-[#F0F0EE] p-6 md:p-9"><div className="mb-8 flex items-center justify-between text-[10px] font-medium tracking-[0.16em]"><span>CAMERA TRANSITION PLACEHOLDER</span><span className="text-muted-foreground">GSAP READY</span></div><div className="flex flex-wrap items-center gap-3 md:gap-5">{['EARTH', 'ASIA', 'JAPAN', 'YOKOHAMA'].map((label, index) => <div key={label} className="flex items-center gap-3"><span className={`rounded-full border px-4 py-3 text-[10px] font-medium tracking-[0.16em] ${index === 3 ? 'border-foreground bg-foreground text-background' : 'border-border bg-background'}`}>{label}</span>{index < 3 && <ArrowRight className="size-3.5 text-muted-foreground" />}</div>)}</div><p className="mt-10 max-w-lg text-sm leading-6 text-muted-foreground">A calm handoff between scales. The future camera sequence can move through these waypoints without changing the operational context.</p></div></div></section>

    <footer className="border-t border-border"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-8 md:px-12"><span className="text-[10px] tracking-[0.16em] text-muted-foreground">FLOWFORGE · GLOBAL NETWORK</span><Link href="/" className="text-[10px] font-medium tracking-[0.16em]">RETURN HOME</Link></div></footer>
  </main>
}
