'use client'

import React, { useEffect, useState } from 'react'
import { 
  Bell, Box, ChevronLeft, Command, Compass, Globe as GlobeIcon, 
  Layers3, Menu, PanelRight, Search, Send, Ship, Sparkles, 
  X, Zap, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, 
  TrendingUp, RefreshCw, BarChart3, Maximize2, Waves, Wind,
  Users, Building2, Sliders, Cpu, MapPin
} from 'lucide-react'
import { Globe, Marker, Arc } from '@/components/ui/cobe-globe'
import GlobalMap from '@/components/ui/GlobalMap'
import InventoryView from '@/components/views/InventoryView'
import LogisticsView from '@/components/views/LogisticsView'
import SuppliersView from '@/components/views/SuppliersView'
import UsersView from '@/components/views/UsersView'
import AutomationView from '@/components/views/AutomationView'
import IntegrationsView from '@/components/views/IntegrationsView'
import LiveOperationsView from '@/components/views/LiveOperationsView'
import ReportsView from '@/components/views/ReportsView'
import DecisionAgentsView from '@/components/views/DecisionAgentsView'
import CargoJourneyRiskView from '@/components/views/CargoJourneyRiskView'
import DispatchPane from '@/components/ui/DispatchPane'
import { getSavedScenarios } from '@/lib/scenarioData'
import { AnalysisResult } from '@/lib/types'
import { 
  initialInventory, 
  initialShipments, 
  initialSuppliers, 
  initialUsers, 
  initialAutomations, 
  initialIntegrations,
  InventoryItem,
  ShipmentItem,
  SupplierItem,
  UserAccessItem,
  AutomationRule,
  IntegrationItem
} from '@/lib/mockData'

const globeMarkers: Marker[] = [
  { id: 'mumbai', location: [18.95, 72.95], label: 'Mumbai JNPT (BOM)' },
  { id: 'singapore', location: [1.29, 103.85], label: 'Singapore Tuas (SIN)' },
  { id: 'yokohama', location: [35.44, 139.64], label: 'Port of Yokohama (YOK)' },
]

const globeArcs: Arc[] = [
  { id: 'mumbai-singapore', from: [18.95, 72.95], to: [1.29, 103.85], label: 'Mumbai → Singapore' },
  { id: 'singapore-yokohama', from: [1.29, 103.85], to: [35.44, 139.64], label: 'Singapore → Yokohama' },
]

const pipelineAgents = [
  { step: '01', name: 'AIS Radar Sentinel', detail: 'Ingesting Open-Meteo & AIS GPS · Storm anomaly flagged', status: 'ACTIVE', type: 'RADAR SCOUT' },
  { step: '02', name: 'Disruption Forecaster (XGBoost)', detail: 'Trained ExtraTrees Pipeline · Disruption probability: 82%', status: 'CRITICAL', type: 'ML CLASSIFIER' },
  { step: '03', name: 'ETA Slip Estimator (LightGBM)', detail: 'LightGBM Regression · Predicted delay: +4.2 days', status: 'ETA SLIP', type: 'ML REGRESSOR' },
  { step: '04', name: 'Port Quay Sentinel', detail: 'RandomForest Dwell Model · Yokohama dwell 31h · 74% load', status: 'AT RISK', type: 'QUAY DWELL' },
  { step: '05', name: 'Supply Chain Shockwave Shield', detail: 'Inventory Predictor · SKU-284 stockout in 5.8 days (Mumbai hub)', status: 'STOCKOUT', type: 'BUFFER GUARD' },
  { step: '06', name: 'Demurrage & Exposure Assessor', detail: '$42,000 USD demurrage + penalty risk computed', status: 'EXPOSURE', type: 'EXPOSURE ENGINE' },
  { step: '07', name: 'Pareto Route Navigator (OR-Tools)', detail: 'OR-Tools CP-SAT · 3 viable recovery routes generated', status: 'READY', type: 'OR SOLVER' },
  { step: '08', name: 'Stochastic Horizon Simulator', detail: '500-sample Monte Carlo stress simulation complete', status: 'SIMULATE', type: 'HORIZON TWIN' },
  { step: '09', name: 'Autonomous Harbor Orchestrator', detail: 'Auto-approved: Execute Scenario B (Loss reduced by 63%)', status: 'RECOMMEND', type: 'ORCHESTRATOR' },
]

function Donut({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="relative flex size-24 shrink-0 items-center justify-center">
      <div 
        className="absolute inset-0 rounded-full transition-all duration-700" 
        style={{ background: `conic-gradient(${color} 0 42%, #e5e5e7 42% 100%)` }} 
      />
      <div className="absolute inset-2.5 flex flex-col items-center justify-center rounded-full bg-white shadow-sm">
        <strong className="text-sm font-semibold tracking-[-.04em] text-[#1d1d1f]">{value}</strong>
        <span className="text-[8px] font-medium tracking-[.1em] text-[#86868b] uppercase">{label}</span>
      </div>
    </div>
  )
}

function Status({ text, critical = false }: { text: string; critical?: boolean }) {
  return (
    <span className={`flow-badge ${
      critical ? 'bg-[#ffebe8] text-[#ff3b30]' : 'bg-[#f1f1f3] text-[#6e6e73]'
    }`}>
      {text}
    </span>
  )
}

export default function Dashboard() {
  const [sidebar, setSidebar] = useState(true)
  const [drawer, setDrawer] = useState(true)
  const [command, setCommand] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'logistics' | 'suppliers' | 'users' | 'automation' | 'integrations' | 'live-operations' | 'reports' | 'decision-agents' | 'cargo-journey'>('dashboard')
  const [simulation, setSimulation] = useState(false)
  const [layers, setLayers] = useState<string[]>(['VESSELS', 'PORTS', 'ROUTES'])

  // Dynamic Workspace Data State (Fully flexible & modifiable)
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [shipments, setShipments] = useState<ShipmentItem[]>(initialShipments)
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers)
  const [users, setUsers] = useState<UserAccessItem[]>(initialUsers)
  const [automations, setAutomations] = useState<AutomationRule[]>(initialAutomations)
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations)

  const toggleLayer = (layer: string) => {
    setLayers(current => current.includes(layer) ? current.filter(item => item !== layer) : [...current, layer])
  }

  // Actions
  const handleAddInventory = (item: InventoryItem) => setInventory(prev => [item, ...prev])
  const handleUpdateStock = (sku: string, newStock: number) => {
    setInventory(prev => prev.map(i => i.sku === sku ? { 
      ...i, 
      stock: newStock, 
      status: newStock === 0 ? 'Stockout' : newStock <= i.reorderPoint ? 'Low Stock' : 'In Stock' 
    } : i))
  }
  const handleCreateShipment = (shipment: ShipmentItem) => setShipments(prev => [shipment, ...prev])
  const handleAddSupplier = (supplier: SupplierItem) => setSuppliers(prev => [supplier, ...prev])
  const handleAddUser = (user: UserAccessItem) => setUsers(prev => [user, ...prev])
  const handleToggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }
  const handleSyncIntegrations = () => {
    setIntegrations(prev => prev.map(item => ({ ...item, status: 'Connected', lastSync: 'Just now' })))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommand(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setSidebar(v => !v)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setDrawer(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#1d1d1f] selection:bg-[#087ef5] selection:text-white">
      {/* Top Floating Glass Navigation Header */}
      <header className="fixed inset-x-4 top-4 z-50 mx-auto flex h-14 max-w-[1600px] items-center justify-between rounded-[24px] border border-white/90 bg-white/80 px-4 shadow-[0_16px_36px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-2xl md:inset-x-8 md:px-5">
        <a href="/" className="flex items-center gap-2.5 text-xs font-bold tracking-[-.02em] shrink-0 group">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <span className="size-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
          </span>
          <span className="whitespace-nowrap font-black text-[#1d1d1f]">FLOWFORGE</span>
          <span className="hidden xl:inline text-[#86868b] font-medium whitespace-nowrap">/ MARITIME DISRUPTION OS</span>
        </a>

        <div className="hidden items-center gap-2 lg:gap-4 xl:gap-6 text-[9px] xl:text-[10px] font-bold tracking-[.10em] xl:tracking-[.14em] text-[#6e6e73] md:flex whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`pb-0.5 whitespace-nowrap shrink-0 transition ${activeTab === 'dashboard' ? 'text-[#087ef5] font-black border-b-2 border-[#087ef5]' : 'hover:text-[#1d1d1f]'}`}
          >
            GLOBAL NETWORK
          </button>
          <button 
            onClick={() => setActiveTab('live-operations')} 
            className={`pb-0.5 whitespace-nowrap shrink-0 transition ${activeTab === 'live-operations' ? 'text-[#087ef5] font-black border-b-2 border-[#087ef5]' : 'hover:text-[#1d1d1f]'}`}
          >
            LIVE OPERATIONS
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className={`pb-0.5 whitespace-nowrap shrink-0 transition ${activeTab === 'reports' ? 'text-[#087ef5] font-black border-b-2 border-[#087ef5]' : 'hover:text-[#1d1d1f]'}`}
          >
            REPORTS
          </button>
          <button 
            onClick={() => setActiveTab('decision-agents')} 
            className={`pb-0.5 whitespace-nowrap shrink-0 transition ${activeTab === 'decision-agents' ? 'text-[#087ef5] font-black border-b-2 border-[#087ef5]' : 'hover:text-[#1d1d1f]'}`}
          >
            DECISION AGENTS
          </button>
          <button 
            onClick={() => setActiveTab('cargo-journey')} 
            className={`pb-0.5 whitespace-nowrap shrink-0 transition ${activeTab === 'cargo-journey' ? 'text-[#087ef5] font-black border-b-2 border-[#087ef5]' : 'hover:text-[#1d1d1f]'}`}
          >
            CARGO JOURNEY RISK
          </button>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={() => setCommand(true)} 
            className="hidden items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#86868b] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.9)] hover:text-[#1d1d1f] sm:flex transition whitespace-nowrap shrink-0"
          >
            <Command className="size-3" />⌘K
          </button>
          
          <span className="flow-badge bg-[#e8f8ed] text-[#34c759] border border-[#34c759]/20 shadow-[0_2px_8px_rgba(52,199,89,0.15)]">
            <span className="size-1.5 rounded-full bg-[#34c759] animate-pulse shadow-[0_0_6px_#34c759]" />
            LIVE AIS ACTIVE
          </span>

          <button 
            onClick={() => setDrawer(v => !v)} 
            aria-label="Toggle dispatch drawer" 
            className="rounded-full p-1.5 text-[#6e6e73] hover:bg-[#f0f0f0] transition shrink-0"
          >
            <PanelRight className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-4 pb-8 pt-24 md:px-8">
        
        {/* Left Collapsible Navigation Sidebar with Clay-Glass styling */}
        <aside className={`${sidebar ? 'w-60' : 'w-14'} hidden shrink-0 flex-col rounded-[32px] border border-white/90 bg-white/80 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-2xl transition-all duration-500 md:flex`}>
          <button 
            onClick={() => setSidebar(v => !v)} 
            aria-label="Toggle sidebar" 
            className="mb-6 flex items-center gap-3 rounded-2xl p-2 text-[#6e6e73] hover:bg-[#f5f5f7] transition"
          >
            {sidebar ? <ChevronLeft className="size-4" /> : <Menu className="size-4" />}
            {sidebar && <span className="text-[10px] font-bold tracking-[.14em]">COLLAPSE (⌘B)</span>}
          </button>

          {sidebar && (
            <>
              <p className="px-2.5 text-[9px] font-bold tracking-[.18em] text-[#86868b] uppercase">Workspace</p>
              <nav className="mt-2.5 space-y-1.5">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeTab === 'dashboard' ? 'bg-[#087ef5] text-white shadow-[0_8px_20px_rgba(8,126,245,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)]' : 'text-[#6e6e73] hover:bg-white/70'
                  }`}
                >
                  <Compass className={`size-4 ${activeTab === 'dashboard' ? 'text-white' : ''}`} />
                  Dashboard
                </button>

                <button 
                  onClick={() => setActiveTab('logistics')}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeTab === 'logistics' ? 'bg-[#087ef5] text-white shadow-[0_8px_20px_rgba(8,126,245,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)]' : 'text-[#6e6e73] hover:bg-white/70'
                  }`}
                >
                  <Ship className={`size-4 ${activeTab === 'logistics' ? 'text-white' : ''}`} />
                  Logistics & Fleet <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${activeTab === 'logistics' ? 'bg-white/20 text-white' : 'bg-[#f0f0f2]'}`}>{shipments.length}</span>
                </button>

                <button 
                  onClick={() => setActiveTab('suppliers')}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeTab === 'suppliers' ? 'bg-[#087ef5] text-white shadow-[0_8px_20px_rgba(8,126,245,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)]' : 'text-[#6e6e73] hover:bg-white/70'
                  }`}
                >
                  <Building2 className={`size-4 ${activeTab === 'suppliers' ? 'text-white' : ''}`} />
                  Suppliers
                </button>

                <button 
                  onClick={() => setActiveTab('automation')}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeTab === 'automation' ? 'bg-[#087ef5] text-white shadow-[0_8px_20px_rgba(8,126,245,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)]' : 'text-[#6e6e73] hover:bg-white/70'
                  }`}
                >
                  <Sliders className={`size-4 ${activeTab === 'automation' ? 'text-white' : ''}`} />
                  Automation
                </button>

                <button 
                  onClick={() => setActiveTab('integrations')}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeTab === 'integrations' ? 'bg-[#087ef5] text-white shadow-[0_8px_20px_rgba(8,126,245,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)]' : 'text-[#6e6e73] hover:bg-white/70'
                  }`}
                >
                  <Cpu className={`size-4 ${activeTab === 'integrations' ? 'text-white' : ''}`} />
                  Integrations
                </button>
              </nav>

              <p className="mt-8 px-2.5 text-[9px] font-semibold tracking-[.18em] text-[#86868b] uppercase">Operational Intelligence</p>
              <nav className="mt-2.5 space-y-1">
                <button 
                  onClick={() => setActiveTab('cargo-journey')} 
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${
                    activeTab === 'cargo-journey' ? 'bg-[#f0f0f2] text-[#1d1d1f] font-semibold shadow-sm' : 'text-[#6e6e73] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <Box className="size-4 text-[#087ef5]" />
                  Maritime Corridor Twin
                </button>
                <button 
                  onClick={() => setActiveTab('decision-agents')} 
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${
                    activeTab === 'decision-agents' ? 'bg-[#f0f0f2] text-[#1d1d1f] font-semibold shadow-sm' : 'text-[#6e6e73] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <Zap className="size-4 text-[#ff9f0a]" />
                  Disruption Sandbox
                </button>
                <a 
                  href="/scenarios" 
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition"
                >
                  <Sliders className="size-4 text-[#087ef5]" />
                  Voyage Architect
                </a>
                <button 
                  onClick={() => setDrawer(true)} 
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[#6e6e73] hover:bg-[#f5f5f7] transition"
                >
                  <Send className="size-4 text-[#087ef5]" />
                  Harbor Master Dispatch
                </button>
              </nav>

              <div className="mt-auto rounded-2xl border border-[#e5e5e7] bg-[#fafaf9] p-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#34c759] animate-ping" />
                  <p className="text-[10px] font-semibold text-[#1d1d1f]">PostgreSQL Sync Active</p>
                </div>
                <p className="mt-1 text-[9px] text-[#86868b]">SQLAlchemy 2.0 ORM · Alembic</p>
              </div>
            </>
          )}
        </aside>

        {/* Center Canvas Section */}
        <section className="flex min-w-0 flex-1 flex-col gap-5">
          
          {/* Main Dashboard View */}
          {activeTab === 'dashboard' && (
            <>
              {/* Header Row with Title */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-1">
                <div>
                  <p className="text-[10px] font-semibold tracking-[.2em] text-[#087ef5] uppercase">OPERATIONS COMMAND CENTER</p>
                  <h1 className="mt-1.5 text-3xl font-semibold tracking-[-.06em] text-[#1d1d1f] md:text-5xl">Good morning, Alex.</h1>
                  <p className="mt-1.5 text-sm text-[#6e6e73]">Jawaharlal Nehru (Mumbai) ➔ Port of Yokohama · Active Maritime Exception Corridor</p>
                </div>
              </div>

              {/* Autonomous Multi-Agent Operational Command Section — Clay-Glass Master Card */}
              <div className="relative rounded-[32px] border border-white/90 bg-white/85 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08),inset_0_3px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(0,0,0,0.02)] backdrop-blur-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 border-b border-[#e5e5e7]/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                      <Sparkles className="size-4 text-[#087ef5]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-[#1d1d1f]">Autonomous Decision Agents Command Grid</h3>
                      <p className="text-[10px] text-[#86868b] font-medium">Real-time cooperative AI agent loop evaluating maritime routes and inventory impact</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#e8f8ed] px-3 py-1.5 text-[9px] font-bold text-[#34c759] border border-[#34c759]/20 flex items-center gap-1.5 shadow-sm">
                      <span className="size-1.5 rounded-full bg-[#34c759] animate-ping" />
                      9 AGENTS ACTIVE & SYNCED
                    </span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="relative min-h-[280px]">
                  {/* Left: Active Agent Traces & Pipeline Flow */}
                  <div className="space-y-3 lg:pr-52">
                    <p className="text-[10px] font-black tracking-[.16em] text-[#86868b] uppercase">LIVE AGENT INFERENCE & EVENT BUS</p>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 border border-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1.5px_3px_rgba(255,255,255,0.95)] hover:border-[#087ef5] transition overflow-hidden min-w-0">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#087ef5]/15 text-[#087ef5] font-mono text-[10px] font-black shadow-sm">
                          01
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <h4 className="text-xs font-bold text-[#1d1d1f] truncate">Risk Detection Agent</h4>
                            <span className="text-[8px] font-bold bg-[#e8f8ed] text-[#34c759] px-2 py-0.5 rounded-full shrink-0 border border-[#34c759]/20">INGESTING AIS</span>
                          </div>
                          <p className="text-[11px] text-[#6e6e73] mt-0.5 font-medium">Satellite AIS telemetry stream ingested. 2.8m swell anomaly detected along Mumbai-Yokohama corridor.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 border border-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1.5px_3px_rgba(255,255,255,0.95)] hover:border-[#ff9f0a] transition overflow-hidden min-w-0">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ff9f0a]/15 text-[#ff9f0a] font-mono text-[10px] font-black shadow-sm">
                          02
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <h4 className="text-xs font-bold text-[#1d1d1f] truncate">Shipment Disruption Predictor (XGBoost)</h4>
                            <span className="text-[8px] font-bold bg-[#ffebe8] text-[#ff3b30] px-2 py-0.5 rounded-full shrink-0 border border-[#ff3b30]/20">82% DISRUPTED</span>
                          </div>
                          <p className="text-[11px] text-[#6e6e73] mt-0.5 font-medium">ML model inference finished in 18ms. High probability of vessel speed degradation and severe schedule slip.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 border border-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1.5px_3px_rgba(255,255,255,0.95)] hover:border-[#087ef5] transition overflow-hidden min-w-0">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#087ef5]/15 text-[#087ef5] font-mono text-[10px] font-black shadow-sm">
                          07
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <h4 className="text-xs font-bold text-[#1d1d1f] truncate">Route Optimization Agent (OR-Tools CP-SAT)</h4>
                            <span className="text-[8px] font-bold bg-[#eef7ff] text-[#087ef5] px-2 py-0.5 rounded-full shrink-0 border border-[#087ef5]/20">3 SOLVED ROUTES</span>
                          </div>
                          <p className="text-[11px] text-[#6e6e73] mt-0.5 font-medium">Mathematical solver evaluated 5,000 nautical miles. Scenario B (South bypass) optimal with $42K net savings.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-[#86868b] font-medium">Supervisor Loop Latency: <strong className="text-[#1d1d1f]">42ms</strong></span>
                      <button 
                        onClick={() => setActiveTab('decision-agents')}
                        className="text-xs font-bold text-[#087ef5] hover:underline flex items-center gap-1"
                      >
                        Open Full 9-Agent Studio <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Floating Telemetry Pills */}
                <div className="mt-5 flex flex-wrap gap-2 text-[9px] tracking-[.1em] border-t border-[#f0f0f2] pt-4">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-3.5 py-1.5 font-bold text-[#466274] shadow-sm">
                    <span className="size-1.5 rounded-full bg-[#34c759] shadow-[0_0_6px_#34c759]" /> AIS LIVE · 18.2 KNOTS · HEADING 065°
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-3.5 py-1.5 font-bold text-[#466274] shadow-sm">
                    <Waves className="size-3 text-[#087ef5]" /> WAVE 2.1M
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-3.5 py-1.5 font-bold text-[#466274] shadow-sm">
                    <Wind className="size-3 text-[#087ef5]" /> WIND GUSTS 32 KM/H
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-3.5 py-1.5 font-bold text-[#466274] shadow-sm">
                    <ShieldCheck className="size-3 text-[#34c759]" /> SUPERVISOR AUTO-DISPATCH ACTIVE
                  </span>
                </div>
              </div>

              {/* Key Metric Telemetry Cards — Claymorphic 3D */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-md transition hover:translate-y-[-2px]">
                  <p className="text-[10px] font-bold tracking-[.13em] text-[#86868b] uppercase">LIVE FLEET VESSEL</p>
                  <p className="mt-2 text-3xl font-black tracking-[-.06em] text-[#1d1d1f]">18.2 kn</p>
                  <p className="mt-1 text-xs text-[#34c759] font-bold">065° heading · AIS live Open-Meteo sync</p>
                </div>

                <div className="rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-md transition hover:translate-y-[-2px]">
                  <p className="text-[10px] font-bold tracking-[.13em] text-[#86868b] uppercase">YOKOHAMA PORT RISK</p>
                  <p className="mt-2 text-3xl font-black tracking-[-.06em] text-[#ff9f0a]">82%</p>
                  <p className="mt-1 text-xs text-[#ff9f0a] font-bold">ML Model 3 · 74% congestion · 31h dwell</p>
                </div>

                <div className="rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-md transition hover:translate-y-[-2px]">
                  <p className="text-[10px] font-bold tracking-[.13em] text-[#86868b] uppercase">CORRIDOR ETA SLIP</p>
                  <p className="mt-2 text-3xl font-black tracking-[-.06em] text-[#ff3b30]">+4.2d</p>
                  <p className="mt-1 text-xs text-[#ff3b30] font-bold">ML Model 2 (LightGBM) schedule slip</p>
                </div>
              </div>

              {/* The FlowForge 9-Agent Decision Intelligence Pipeline Card */}
              <div className="grid gap-5 rounded-[32px] border border-white/90 bg-white/85 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06),inset_0_3px_6px_rgba(255,255,255,0.95)] backdrop-blur-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#e5e5e7]/80 pb-4">
                  <div>
                    <p className="text-[10px] font-black tracking-[.18em] text-[#087ef5] uppercase">AUTONOMOUS MULTI-AGENT SYSTEM</p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-.05em] text-[#1d1d1f]">9-Agent Decision Pipeline</h2>
                  </div>
                  <Status text={simulation ? 'DIGITAL TWIN SIMULATION ACTIVE' : 'LIVE PIPELINE OPERATIONAL'} />
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {pipelineAgents.map((agent) => (
                    <div 
                      key={agent.step} 
                      className="rounded-[22px] border border-white/90 bg-white/80 p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1.5px_3px_rgba(255,255,255,0.95)] overflow-hidden min-w-0 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="font-mono text-[10px] font-black text-[#087ef5] shrink-0">{agent.step}</span>
                        <span className="flow-badge bg-[#f0f0f2] text-[#425466] max-w-[75%] truncate shrink min-w-0 font-bold">
                          {agent.type}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="mt-2.5 text-xs font-bold text-[#1d1d1f] truncate">{agent.name}</p>
                        <p className="mt-1 text-[11px] leading-4 text-[#6e6e73] line-clamp-2 font-medium">{agent.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Supervisor Executive Action Pill */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#1d1d1f] p-4 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.25)]">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-[#34c759]" />
                    <span className="text-xs font-medium">
                      <strong>Supervisor Recommendation:</strong> Auto-approved Scenario B (Reroute). Net financial exposure reduced by 63% ($42K saved).
                    </span>
                  </div>

                  <button 
                    onClick={() => setActiveTab('decision-agents')} 
                    className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[10px] font-bold tracking-[.1em] text-[#1d1d1f] hover:bg-[#f0f0f0] transition shadow-sm active:scale-95"
                  >
                    RUN DIGITAL TWIN <Zap className="size-3 text-[#087ef5]" />
                  </button>
                </div>
              </div>

              {/* Inventory Trends & Live Operations Activities */}
              <div className="grid gap-5 md:grid-cols-[1.2fr_.8fr]">
                {/* Inventory Trends Line Graph */}
                <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[.16em] text-[#86868b] uppercase">INVENTORY TRENDS</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#1d1d1f]">Monthly Stock Turnover & Flow</h3>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-medium text-[#6e6e73]">
                      <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#1d1d1f]" /> Line 01 (Auto)</span>
                      <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#fca5a5]" /> Line 02 (Electronics)</span>
                      <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#fde047]" /> Line 03 (Pharma)</span>
                    </div>
                  </div>

                  {/* Minimalist SVG Smooth Wave Chart */}
                  <div className="relative h-48 w-full">
                    <svg viewBox="0 0 500 150" className="size-full overflow-visible" preserveAspectRatio="none">
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f1f3" strokeWidth="1" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f1f3" strokeWidth="1" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f1f3" strokeWidth="1" />

                      <path d="M0,110 C50,90 100,130 150,115 C200,100 250,50 300,70 C350,90 400,60 450,105 L500,85" fill="none" stroke="#fde047" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                      <path d="M0,90 C50,70 100,120 150,100 C200,80 250,35 300,55 C350,75 400,35 450,90 L500,70" fill="none" stroke="#fca5a5" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
                      <path d="M0,80 C50,60 100,110 150,85 C200,65 250,20 300,40 C350,65 400,20 450,80 L500,60" fill="none" stroke="#1d1d1f" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>

                    <div className="mt-2 flex justify-between text-[9px] font-medium text-[#86868b]">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Supply Chain Activities */}
                <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-semibold tracking-[.16em] text-[#86868b] uppercase">RECENT ACTIVITIES</p>
                    <div className="text-right">
                      <span className="text-[10px] text-[#86868b]">Total Filtered Cost</span>
                      <p className="text-sm font-semibold text-[#1d1d1f]">$21,049.00 <span className="text-[9px] font-normal text-[#34c759]">● On track</span></p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl bg-[#fafaf9] p-3 border border-[#e5e5e7]">
                      <div className="flex size-7 items-center justify-center rounded-full bg-[#087ef5]/10 text-[#087ef5]">
                        <Ship className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1d1d1f]">New shipment created</p>
                        <p className="text-[10px] text-[#6e6e73]">Order #12345 has been shipped to New York</p>
                      </div>
                      <span className="text-[9px] text-[#86868b]">2h ago</span>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-[#fafaf9] p-3 border border-[#e5e5e7]">
                      <div className="flex size-7 items-center justify-center rounded-full bg-[#ff9f0a]/10 text-[#ff9f0a]">
                        <AlertTriangle className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1d1d1f]">Low stock alert</p>
                        <p className="text-[10px] text-[#6e6e73]">Product SKU-789 is running low (Mumbai hub)</p>
                      </div>
                      <span className="text-[9px] text-[#86868b]">4h ago</span>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-[#fafaf9] p-3 border border-[#e5e5e7]">
                      <div className="flex size-7 items-center justify-center rounded-full bg-[#34c759]/10 text-[#34c759]">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1d1d1f]">New supplier approved</p>
                        <p className="text-[10px] text-[#6e6e73]">Global Electronics Ltd. has been verified</p>
                      </div>
                      <span className="text-[9px] text-[#86868b]">6h ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manifest Breakdown & Financial Cost Donut Charts */}
              <div className="grid gap-5 md:grid-cols-[1.1fr_.9fr]">
                <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[.16em] text-[#86868b] uppercase">MANIFEST BREAKDOWN</p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-[-.05em] text-[#1d1d1f]">4,200 TEUs</h2>
                    </div>
                    <Box className="size-5 text-[#087ef5]" />
                  </div>

                  <p className="mt-1.5 text-xs text-[#6e6e73]">$35.2M USD total cargo value · Automotive $14.8M · Consumer Electronics $20.4M</p>

                  <div className="mt-5 flex items-center gap-6">
                    <Donut value="42%" label="AUTO" color="#087ef5" />
                    <div className="space-y-2 text-[10px] text-[#6e6e73]">
                      <p className="flex items-center"><span className="mr-2 inline-block size-2 rounded-full bg-[#087ef5]" />Automotive parts (42%)</p>
                      <p className="flex items-center"><span className="mr-2 inline-block size-2 rounded-full bg-[#34c759]" />Consumer electronics (35%)</p>
                      <p className="flex items-center"><span className="mr-2 inline-block size-2 rounded-full bg-[#ff9f0a]" />Pharmaceuticals (15%)</p>
                      <p className="flex items-center"><span className="mr-2 inline-block size-2 rounded-full bg-[#86868b]" />Machinery (8%)</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-semibold tracking-[.16em] text-[#86868b] uppercase">COST & LOSS DISTRIBUTION</p>
                  <div className="mt-5 flex items-center gap-6">
                    <Donut value="$42K" label="RISK" color="#ff9f0a" />
                    <div className="space-y-2.5 text-[10px] text-[#6e6e73]">
                      <p className="flex justify-between gap-6"><span>Fuel Delta</span> <strong className="text-[#1d1d1f]">$18,000</strong></p>
                      <p className="flex justify-between gap-6"><span>Port Congestion Surcharge</span> <strong className="text-[#1d1d1f]">$12,000</strong></p>
                      <p className="flex justify-between gap-6"><span>Cargo Stockout Buffer</span> <strong className="text-[#1d1d1f]">$12,000</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Inventory Workspace View */}
          {activeTab === 'inventory' && (
            <InventoryView 
              items={inventory} 
              onAddItem={handleAddInventory} 
              onUpdateStock={handleUpdateStock} 
            />
          )}

          {/* Logistics Workspace View */}
          {activeTab === 'logistics' && (
            <LogisticsView 
              shipments={shipments} 
              onSelectShipment={(s) => console.log('Selected voyage:', s)} 
              onCreateShipment={handleCreateShipment} 
            />
          )}

          {/* Suppliers Workspace View */}
          {activeTab === 'suppliers' && (
            <SuppliersView 
              suppliers={suppliers} 
              onAddSupplier={handleAddSupplier} 
            />
          )}

          {/* Users Workspace View */}
          {activeTab === 'users' && (
            <UsersView 
              users={users} 
              onAddUser={handleAddUser} 
            />
          )}

          {/* Automation Workspace View */}
          {activeTab === 'automation' && (
            <AutomationView 
              rules={automations} 
              onToggleRule={handleToggleAutomation} 
            />
          )}

          {/* Integrations Workspace View */}
          {activeTab === 'integrations' && (
            <IntegrationsView 
              integrations={integrations} 
              onSyncAll={handleSyncIntegrations} 
            />
          )}

          {/* Top Header - Live Operations View */}
          {activeTab === 'live-operations' && (
            <LiveOperationsView />
          )}

          {/* Top Header - Reports View */}
          {activeTab === 'reports' && (
            <ReportsView />
          )}

          {/* Top Header - Decision Agents View */}
          {activeTab === 'decision-agents' && (
            <DecisionAgentsView />
          )}

          {/* Top Header / Sidebar - Cargo Journey Risk Digital Twin */}
          {activeTab === 'cargo-journey' && (
            <CargoJourneyRiskView />
          )}

        </section>

        {/* Right-Side Auxiliary Dispatch & Live Brief Drawer */}
        {drawer && (
          <DispatchPane
            onClose={() => setDrawer(false)}
            onNavigateToTab={setActiveTab}
            activeLayers={layers}
            onToggleLayer={toggleLayer}
          />
        )}
      </div>

      {/* Command Palette (⌘K) */}
      {command && (
        <div 
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/25 px-4 pt-24 backdrop-blur-sm" 
          onClick={() => setCommand(false)}
        >
          <div 
            className="w-full max-w-lg rounded-2xl border border-[#d2d2d7] bg-white p-2.5 shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#e5e5e7] px-4 py-3 text-sm text-[#86868b]">
              <Search className="size-4" />
              <input 
                autoFocus 
                className="min-w-0 flex-1 bg-transparent text-[#1d1d1f] placeholder:text-[#86868b] outline-none" 
                placeholder="Search fleet, routes, or dispatch commands..." 
              />
              <button onClick={() => setCommand(false)} aria-label="Close command palette">
                <X className="size-4" />
              </button>
            </div>
            
            <div className="mt-2 space-y-1">
              {[
                'Open Yokohama Port Disruption Report',
                'Inspect Vessel MV Tokyo Express AIS Telemetry',
                'Trigger 500-Sample Digital Twin Monte Carlo',
                'Dispatch Daily IMO Notice to Destination Port',
              ].map(item => (
                <button 
                  key={item} 
                  onClick={() => setCommand(false)} 
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
                >
                  <Sparkles className="size-4 text-[#087ef5]" />
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
