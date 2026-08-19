'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown, Command, Globe2, Menu, Play, ShieldCheck, Truck, X } from 'lucide-react'

const shipImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/container_ship_bow_aerial-hNoZgjNIJAXUjGfXonFiDArBApenba.webp'
const portImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/container_port_aerial-cfcTcy8nZNAaq4T0zDJ74VhW7yZJcp.webp'

const navItems = ['OVERVIEW', 'NETWORK', 'RISKS', 'SIMULATE', 'RECOVERY']
const scenarios = ['PORT CLOSURE', 'TYPHOON', 'FACTORY FAILURE', 'SUPPLIER FAILURE', 'SHIPPING DELAY']
const agents = ['SIGNAL', 'IMPACT', 'ROUTING', 'INVENTORY', 'FINANCE', 'RECOVERY', 'EXECUTION']

function Metric({ value, label }: { value: string; label: string }) {
  return <div><div className="text-3xl font-medium tracking-[-0.05em] md:text-4xl">{value}</div><div className="mt-2 text-[10px] font-medium tracking-[0.14em] text-muted-foreground">{label}</div></div>
}

function Status({ label, tone = 'success' }: { label: string; tone?: 'success' | 'warning' | 'critical' }) {
  const colors = { success: 'bg-[#34C759]', warning: 'bg-[#FF9F0A]', critical: 'bg-[#FF3B30]' }
  return <span className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.13em]"><span className={`size-1.5 rounded-full ${colors[tone]}`} />{label}</span>
}

function OrionTeamMark() {
  return <div className="flex flex-col items-start text-[10px] font-medium tracking-[0.22em] text-white/70 motion-safe:animate-[orionMark_1.5s_cubic-bezier(.22,1,.36,1)_both]" aria-label="Team Orion">
    <div className="flex gap-[0.18em]" aria-hidden="true">{['O', 'R', 'I', 'O', 'N'].map((letter, index) => <span key={`${letter}-${index}`} style={{ animationDelay: `${index * 120}ms` }} className="motion-safe:animate-[orionLetter_420ms_cubic-bezier(.22,1,.36,1)_both]">{letter}</span>)}</div>
    <span className="mt-2 h-px w-12 bg-white/35 motion-safe:animate-[orionLine_500ms_650ms_cubic-bezier(.22,1,.36,1)_both]" />
    <span className="mt-2 motion-safe:animate-[orionTeam_500ms_850ms_cubic-bezier(.22,1,.36,1)_both]">TEAM ORION</span>
  </div>
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [scenario, setScenario] = useState(1)
  const [recoveryStep, setRecoveryStep] = useState(0)
  const [recovered, setRecovered] = useState(false)
  
  // Backend Integration States
  const [backendStatus, setBackendStatus] = useState<'CONNECTED' | 'OFFLINE'>('OFFLINE')
  const [networkHealth, setNetworkHealth] = useState('94.7%')
  const [activeVesselsCount, setActiveVesselsCount] = useState('1,842')
  const [disruptionProb, setDisruptionProb] = useState('82%')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    // Fetch live backend telemetry
    async function fetchBackendData() {
      try {
        const res = await fetch('http://localhost:8000/api/v1/network')
        if (res.ok) {
          const data = await res.json()
          setBackendStatus('CONNECTED')
          if (data.network_health) setNetworkHealth(data.network_health)
          if (data.active_vessels) setActiveVesselsCount(data.active_vessels.toLocaleString())
        }
      } catch (err) {
        setBackendStatus('OFFLINE')
      }
    }
    fetchBackendData()
  }, [])

  function executeRecovery() {
    if (recoveryStep > 0) return
    let step = 1
    setRecoveryStep(step)
    const timer = window.setInterval(() => { step += 1; setRecoveryStep(step); if (step === 5) { window.clearInterval(timer); setRecovered(true) } }, 850)
  }

  return <main id="top" className="min-h-screen overflow-hidden bg-background text-foreground">
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between rounded-2xl border border-border/70 bg-background/72 px-5 shadow-[0_10px_32px_rgba(0,0,0,.06)] backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_14px_40px_rgba(0,0,0,.08)]">
        <a href="#top" className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] motion-safe:animate-[logoReveal_800ms_100ms_cubic-bezier(.22,1,.36,1)_both]"><span className="flex size-6 items-center justify-center rounded-full bg-foreground"><span className="size-1.5 rounded-full bg-background" /></span>FLOWFORGE</a>
        <nav className="hidden items-center gap-6 text-[10px] font-medium tracking-[0.12em] text-muted-foreground lg:flex">{navItems.map((item) => <a key={item} href={item === 'NETWORK' ? '/network' : `#${item.toLowerCase()}`} className="relative transition-colors duration-300 hover:text-foreground">{item}</a>)}</nav>
        <div className="flex items-center gap-4"><button onClick={() => setCommandOpen(true)} className="hidden items-center gap-2 text-[10px] tracking-[0.1em] text-muted-foreground sm:flex"><Command className="size-3.5" />⌘ K</button><span className="hidden items-center gap-2 text-[10px] tracking-[0.1em] md:flex"><span className={`size-1.5 rounded-full ${backendStatus === 'CONNECTED' ? 'bg-[#34C759]' : 'bg-[#FF9F0A]'}`} />{backendStatus === 'CONNECTED' ? 'SYSTEM · OPERATIONAL (FASTAPI LIVE)' : 'SYSTEM · OPERATIONAL'}</span><span className="hidden text-[10px] font-medium tracking-[0.14em] text-muted-foreground lg:inline">ORION</span><button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button></div>
      </div>
      {menuOpen && <nav className="mx-auto mt-2 flex max-w-[1440px] flex-col gap-4 rounded-3xl border border-border bg-background p-5 text-xs shadow-xl lg:hidden">{navItems.map((item) => <a key={item} href={item === 'NETWORK' ? '/network' : `#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{item}</a>)}</nav>}
    </header>

    <section id="overview" className="relative flex min-h-[820px] items-end overflow-hidden pt-24">
      <img src={shipImage} alt="Container vessel moving through deep blue ocean" className="absolute inset-0 size-full object-cover object-center motion-safe:animate-[heroReveal_900ms_ease-out_both]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,.12),rgba(17,17,17,.06)_35%,rgba(17,17,17,.78))]" />
      <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-16 md:px-12 md:pb-24"><div className="max-w-3xl text-white">
        <p className="mb-6 text-[10px] font-medium tracking-[0.22em] text-white/65 motion-safe:animate-[rise_700ms_650ms_cubic-bezier(.22,1,.36,1)_both]">A LIVING INTELLIGENCE LAYER FOR GLOBAL SUPPLY CHAINS</p>
        <h1 className="text-balance text-6xl font-semibold leading-[.94] tracking-[-0.07em] md:text-9xl motion-safe:animate-[rise_700ms_850ms_cubic-bezier(.22,1,.36,1)_both]">COMMAND<br />THE FLOW.</h1>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center motion-safe:animate-[rise_700ms_1050ms_cubic-bezier(.22,1,.36,1)_both]"><p className="max-w-md text-sm leading-6 text-white/72 md:text-base">See the system. Predict the disruption. Shape the outcome.</p><div className="flex gap-3"><a href="#network" className="rounded-full bg-white px-5 py-3 text-xs font-medium text-[#111111] transition-transform hover:scale-[1.015]">EXPLORE NETWORK</a><a href="#simulate" className="rounded-full border border-white/35 px-5 py-3 text-xs font-medium text-white transition-colors hover:bg-white/10">RUN SIMULATION</a></div></div>
      </div></div>
    </section>

    <section id="network" className="mx-auto max-w-[1440px] px-5 py-24 md:px-12 md:py-36"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="mb-5 text-[10px] font-medium tracking-[0.2em] text-[#0A84FF]">01 · GLOBAL NETWORK</p><h2 className="max-w-2xl text-balance text-5xl font-medium leading-[.98] tracking-[-0.065em] md:text-7xl">The whole system,<br />in one view.</h2></div><p className="max-w-sm text-sm leading-6 text-muted-foreground">Every vessel, port, route, facility, and signal connected in a single operational picture.</p></div>
      <div className="mt-16 overflow-hidden rounded-[28px] border border-border bg-[#111111] text-white"><div className="relative min-h-[430px] overflow-hidden"><img src={portImage} alt="Container port viewed from above" className="absolute inset-0 size-full object-cover opacity-75 transition-transform duration-700 hover:scale-[1.02]" /><div className="absolute inset-0 bg-[#111111]/35" /><div className="relative flex min-h-[430px] flex-col justify-between p-6 md:p-9"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[10px] tracking-[0.16em]"><Globe2 className="size-4" /> LIVE NETWORK</span><Status label={`NETWORK HEALTH ${networkHealth}`} /></div><div className="grid grid-cols-2 gap-8 md:grid-cols-4"><Metric value={activeVesselsCount} label="ACTIVE VESSELS" /><Metric value="247" label="ACTIVE ROUTES" /><Metric value="12,430" label="FACILITIES" /><Metric value={networkHealth} label="NETWORK HEALTH" /></div></div></div></div>
    </section>

    <section id="risks" className="border-y border-border bg-[#F0F0EE]"><div className="mx-auto max-w-[1440px] px-5 py-24 md:px-12 md:py-36"><div className="grid gap-12 md:grid-cols-[.7fr_1.3fr]"><div><p className="mb-5 text-[10px] font-medium tracking-[0.2em] text-[#0A84FF]">02 · VESSEL INTELLIGENCE</p><h2 className="text-balance text-5xl font-medium leading-[.98] tracking-[-0.065em] md:text-7xl">Know before<br />it changes.</h2><p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">Signals become decisions before uncertainty becomes delay.</p></div><div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]"><article className="relative min-h-[420px] overflow-hidden rounded-[24px] bg-[#111111] text-white"><img src={shipImage} alt="MV Orion container vessel" className="absolute inset-0 size-full object-cover opacity-65 transition-transform duration-700 hover:scale-[1.02]" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" /><div className="relative flex min-h-[420px] flex-col justify-between p-6"><div className="flex justify-between text-[10px] tracking-[0.14em]"><span>MV ORION</span><Status label="RISK · MODERATE" tone="warning" /></div><div><p className="text-xs text-white/60">CONTAINER VESSEL</p><h3 className="mt-2 text-2xl font-medium tracking-[-0.04em]">SHANGHAI → YOKOHAMA</h3><div className="mt-7 grid grid-cols-2 gap-5 text-xs"><div><p className="text-white/50">ETA</p><p className="mt-1 text-lg">14h 32m</p></div><div><p className="text-white/50">CARGO VALUE</p><p className="mt-1 text-lg">$28.4M</p></div></div></div></div></article><article className="rounded-[24px] border border-border bg-background p-6"><div className="flex items-center justify-between"><p className="text-[10px] tracking-[0.14em]">YOKOHAMA PORT</p><Status label="AT RISK" tone="critical" /></div><div className="mt-12 text-6xl font-medium tracking-[-0.07em]">{disruptionProb}</div><p className="mt-2 text-xs text-muted-foreground">DISRUPTION PROBABILITY</p><div className="mt-10 space-y-4 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">CAPACITY</span><span>63%</span></div><div className="flex justify-between"><span className="text-muted-foreground">INCOMING / OUTGOING</span><span>42 / 61</span></div><div className="flex justify-between"><span className="text-muted-foreground">EXPECTED DELAY</span><span>7.2 DAYS</span></div></div><button className="mt-10 flex w-full items-center justify-between border-t border-border pt-4 text-xs font-medium text-[#0A84FF]">DIVERT TO KOBE <ArrowRight className="size-4" /></button></article></div></div></div></section>

    <section id="simulate" className="mx-auto max-w-[1440px] px-5 py-24 md:px-12 md:py-36"><div className="grid gap-12 md:grid-cols-[.65fr_1.35fr]"><div><p className="mb-5 text-[10px] font-medium tracking-[0.2em] text-[#0A84FF]">03 · SIMULATION</p><h2 className="text-balance text-5xl font-medium leading-[.98] tracking-[-0.065em] md:text-7xl">Make the<br />next move.</h2><p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">Test the decisions that matter before the network has to live with them.</p><div className="mt-10 flex flex-wrap gap-2">{scenarios.map((item, i) => <button key={item} onClick={() => setScenario(i)} className={`rounded-full border px-3 py-2 text-[10px] tracking-[0.08em] transition-colors ${scenario === i ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground'}`}>{item}</button>)}</div></div><div className="rounded-[24px] border border-border bg-[#111111] p-6 text-white md:p-9"><div className="flex items-center justify-between"><span className="text-[10px] tracking-[0.16em]">SCENARIO · {scenarios[scenario]}</span><Status label="RUNNING MODEL" /></div><div className="mt-16 grid gap-6 md:grid-cols-3"><div><p className="text-[10px] text-white/50">BASELINE</p><p className="mt-2 text-3xl">{networkHealth}</p><p className="mt-1 text-xs text-white/50">NETWORK HEALTH</p></div><div><p className="text-[10px] text-white/50">DISRUPTION</p><p className="mt-2 text-3xl text-[#FF9F0A]">{scenario === 1 ? '82%' : scenario === 0 ? '90%' : '64%'}</p><p className="mt-1 text-xs text-white/50">RISK EXPOSURE</p></div><div><p className="text-[10px] text-white/50">RECOVERY</p><p className="mt-2 text-3xl text-[#34C759]">91.6%</p><p className="mt-1 text-xs text-white/50">PROJECTED HEALTH</p></div></div><div className="mt-16 flex h-24 items-end gap-1 border-b border-white/15">{[20,28,25,35,40,34,50,46,55,67,61,76,72,88,82,94].map((height, i) => <span key={i} className={`flex-1 rounded-t-sm transition-all duration-500 ${i > 11 ? 'bg-[#0A84FF]' : 'bg-white/20'}`} style={{ height: `${height}%` }} />)}</div></div></div></section>

    <section id="recovery" className="border-y border-border bg-[#F0F0EE]"><div className="mx-auto max-w-[1440px] px-5 py-24 md:px-12 md:py-36"><div className="grid gap-12 md:grid-cols-[.8fr_1.2fr]"><div><p className="mb-5 text-[10px] font-medium tracking-[0.2em] text-[#0A84FF]">04 · RECOVERY PLAN</p><h2 className="text-balance text-5xl font-medium leading-[.98] tracking-[-0.065em] md:text-7xl">From risk<br />to resolved.</h2><p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">A coordinated response for the Yokohama port disruption.</p><div className="mt-10 grid grid-cols-3 gap-4"><Metric value="18H" label="RECOVERY TIME" /><Metric value="64%" label="RISK REDUCTION" /><Metric value="$1.42M" label="EST. SAVINGS" /></div></div><div className="rounded-[24px] border border-border bg-background p-6 md:p-9"><div className="space-y-0">{['DIVERT 4 VESSELS → KOBE', 'INCREASE OSAKA INVENTORY → +18%', 'SWITCH SUPPLIER ROUTE → NAGOYA', 'PRIORITIZE HIGH-VALUE CARGO', 'REBALANCE WAREHOUSE CAPACITY'].map((item, i) => <div key={item} className={`flex items-center gap-4 border-b border-border py-5 text-xs transition-opacity ${recoveryStep > i ? 'opacity-100' : 'opacity-65'}`}><span className="font-mono text-muted-foreground">0{i + 1}</span><span>{item}</span>{recoveryStep > i && <span className="ml-auto text-[#34C759]">✓</span>}</div>)}</div><button onClick={executeRecovery} disabled={recoveryStep > 0} className="mt-8 flex w-full items-center justify-between rounded-full bg-foreground px-5 py-4 text-xs font-medium text-background transition-transform hover:scale-[1.01] disabled:opacity-70">{recoveryStep === 0 ? 'EXECUTE RECOVERY PLAN' : recoveryStep < 5 ? ['AI ANALYZING', 'ROUTES OPTIMIZING', 'VESSELS REROUTING', 'INVENTORY REBALANCING'][recoveryStep - 1] : 'NETWORK RECOVERED'}<ArrowRight className="size-4" /></button>{recovered && <div className="mt-6 border-t border-border pt-6 text-xs text-[#34C759]">RECOVERY COMPLETE · NETWORK HEALTH 91.6% · EXPECTED DELAY 1.8 DAYS</div>}</div></div></div></section>

    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-12 md:py-36"><div className="grid gap-12 md:grid-cols-[.8fr_1.2fr]"><div><p className="mb-5 text-[10px] font-medium tracking-[0.2em] text-[#0A84FF]">FLOWFORGE INTELLIGENCE</p><h2 className="text-balance text-5xl font-medium leading-[.98] tracking-[-0.065em] md:text-7xl">Operational<br />clarity.</h2><p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">The intelligence layer stays focused on what changes outcomes.</p></div><div className="grid gap-8 md:grid-cols-[1fr_1.1fr]"><div className="space-y-3">{agents.map((agent, i) => <div key={agent} className={`flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-xs transition-colors ${i === 1 ? 'bg-[#F0F0EE]' : ''}`}><span className={`size-1.5 rounded-full ${i === 1 ? 'bg-[#0A84FF]' : 'bg-[#D2D2D7]'}`} />{agent}<span className="ml-auto font-mono text-[10px] text-muted-foreground">{i === 1 ? 'ACTIVE' : 'READY'}</span></div>)}</div><div className="rounded-[24px] bg-[#111111] p-6 text-white"><Status label="MONITORING GLOBAL NETWORK" /><p className="mt-10 text-2xl font-medium tracking-[-0.04em]">Weather anomaly detected.</p><p className="mt-4 text-sm leading-6 text-white/55">Yokohama disruption probability: <span className="text-white">{disruptionProb}</span><br />27 vessels potentially affected.<br />14 alternative strategies identified.</p><div className="mt-8 border-t border-white/15 pt-5"><p className="text-[10px] text-white/45">RECOMMENDATION</p><p className="mt-2 text-sm">DIVERT → KOBE</p><p className="mt-1 text-xs text-[#34C759]">1.8 DAYS · $1.42M SAVINGS</p></div></div></div></div></section>

    <footer className="bg-[#111111] text-white"><div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-5 py-20 md:flex-row md:items-end md:justify-between md:px-12"><div><p className="text-4xl font-medium tracking-[-0.06em] md:text-6xl">COMMAND THE FLOW.</p><p className="mt-6 text-[10px] tracking-[0.16em] text-white/45">BUILT BY ORION · © 2026 FLOWFORGE</p></div><OrionTeamMark /><button onClick={() => setCommandOpen(true)} className="flex items-center gap-3 text-xs text-white/65 transition-colors hover:text-white"><Command className="size-4" /> ASK FLOWFORGE ANYTHING</button></div></footer>

    {commandOpen && <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/30 px-5 pt-28 backdrop-blur-sm" onClick={() => setCommandOpen(false)}><div className="w-full max-w-xl rounded-2xl border border-border bg-background p-2 shadow-2xl motion-safe:animate-[modalIn_250ms_ease-out_both]" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-border px-4 py-4 text-sm text-muted-foreground"><Command className="size-4" />Ask FlowForge anything...<button className="ml-auto" onClick={() => setCommandOpen(false)} aria-label="Close command bar"><X className="size-4" /></button></div><div className="p-2">{['Simulate Yokohama closure.', 'Which ports are most vulnerable?', 'Find the safest route to Europe.', 'What happens if Shanghai closes?'].map((item) => <a key={item} href="#simulate" onClick={() => setCommandOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors hover:bg-muted">{item}<ChevronDown className="size-4 -rotate-90 text-muted-foreground" /></a>)}</div></div></div>}
  </main>
}
