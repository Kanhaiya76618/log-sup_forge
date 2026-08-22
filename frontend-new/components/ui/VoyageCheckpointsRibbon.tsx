'use client'

import React, { useState, useEffect } from 'react'
import { 
  Ship, Compass, Wind, Waves, MapPin, CheckCircle2, 
  Clock, AlertTriangle, Activity, Gauge, Flame, ArrowRight,
  ShieldCheck, ShieldAlert, Navigation, Sparkles, Eye, ChevronRight
} from 'lucide-react'
import { 
  VoyageCheckpoint, 
  VoyageCheckpointsPayload, 
  getVoyageCheckpoints 
} from '@/lib/api'

interface Props {
  voyageId?: string
  onSelectCheckpoint?: (cp: VoyageCheckpoint) => void
  selectedCheckpointId?: string
}

export default function VoyageCheckpointsRibbon({
  voyageId = 'SH-2049',
  onSelectCheckpoint,
  selectedCheckpointId
}: Props) {
  const [data, setData] = useState<VoyageCheckpointsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCpId, setActiveCpId] = useState<string>('CP-04')
  const [viewMode, setViewMode] = useState<'milestones' | 'daily'>('milestones')

  useEffect(() => {
    let isMounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await getVoyageCheckpoints(voyageId)
        if (isMounted) {
          setData(res)
          if (selectedCheckpointId) {
            setActiveCpId(selectedCheckpointId)
          } else {
            setActiveCpId(res.active_checkpoint_id || 'CP-04')
          }
        }
      } catch (e) {
        console.error('Failed loading checkpoints:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [voyageId, selectedCheckpointId])

  if (loading || !data) {
    return (
      <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded-md mb-4" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  const activeCheckpoint = data.checkpoints.find(c => c.checkpoint_id === activeCpId) || data.checkpoints[3]

  const handleSelect = (cp: VoyageCheckpoint) => {
    setActiveCpId(cp.checkpoint_id)
    if (onSelectCheckpoint) {
      onSelectCheckpoint(cp)
    }
  }

  const getRiskBadge = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-[#ffebe8] text-[#ff3b30] border-[#ffc2be]'
      case 'HIGH':
        return 'bg-[#fff5eb] text-[#ff9f0a] border-[#ffd8b2]'
      case 'MEDIUM':
        return 'bg-[#fffbeb] text-[#f59e0b] border-[#fde68a]'
      default:
        return 'bg-[#e8f8ed] text-[#34c759] border-[#b7ebc7]'
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'COMPLETED') {
      return <CheckCircle2 className="size-4 text-[#34c759]" />
    }
    if (status === 'ACTIVE_CURRENT') {
      return (
        <span className="relative flex size-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#087ef5] opacity-75"></span>
          <span className="relative inline-flex rounded-full size-3 bg-[#087ef5]"></span>
        </span>
      )
    }
    return <Clock className="size-4 text-[#86868b]" />
  }

  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-sm space-y-6">
      
      {/* Header & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e5e5e7] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-[#087ef5]/10 text-[#087ef5]">
              <Navigation className="size-3.5" />
            </span>
            <span className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">
              VOYAGE CHECKPOINTS & TELEMETRY PROGRESSION
            </span>
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-[#1d1d1f]">
            {data.route_name}
          </h3>
          <p className="text-xs text-[#6e6e73]">
            Tracked Vessel: <strong className="text-[#1d1d1f]">{data.vessel_name}</strong> · Voyage ID: {data.voyage_id}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 rounded-xl bg-[#f5f5f7] p-1 border border-[#e5e5e7] self-start">
          <button
            onClick={() => setViewMode('milestones')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'milestones'
                ? 'bg-white text-[#1d1d1f] shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Corridor Milestones (7 CPs)
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'daily'
                ? 'bg-white text-[#1d1d1f] shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            24h Noon Shift
          </button>
        </div>
      </div>

      {/* Voyage Progress Gauge Card */}
      <div className="rounded-2xl bg-[#fafaf9] p-4 border border-[#e5e5e7] grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-[#86868b] uppercase">TOTAL CORRIDOR</span>
          <p className="mt-0.5 text-xl font-bold text-[#1d1d1f]">{data.total_distance_nm.toLocaleString()} NM</p>
          <span className="text-[11px] text-[#86868b]">Est. {data.total_transit_days} transit days</span>
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-wider text-[#34c759] uppercase">VOYAGE COVERED</span>
          <p className="mt-0.5 text-xl font-bold text-[#34c759]">{data.distance_covered_nm.toLocaleString()} NM ({data.progress_percent}%)</p>
          <span className="text-[11px] text-[#86868b]">{data.elapsed_days} days elapsed</span>
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-wider text-[#087ef5] uppercase">TO BE COVERED</span>
          <p className="mt-0.5 text-xl font-bold text-[#087ef5]">{data.distance_remaining_nm.toLocaleString()} NM ({(100 - data.progress_percent).toFixed(1)}%)</p>
          <span className="text-[11px] text-[#86868b]">{data.remaining_days} days remaining</span>
        </div>

        {/* Mini Linear Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-semibold text-[#86868b]">
            <span>Origin Departure</span>
            <span className="text-[#087ef5] font-bold">{data.progress_percent}% Complete</span>
            <span>Berth Arrival</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e5e5e7]">
            <div 
              className="h-full rounded-full bg-linear-to-r from-[#34c759] via-[#087ef5] to-[#0051a8] transition-all duration-700" 
              style={{ width: `${data.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper / Timeline Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#86868b]">
          <span>VOYAGE CHECKPOINT CORRIDOR</span>
          <span>Click any checkpoint to inspect ship telemetry & sea forecast</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
          {data.checkpoints.map((cp, idx) => {
            const isSelected = cp.checkpoint_id === activeCpId
            const isActive = cp.status === 'ACTIVE_CURRENT'
            const isCompleted = cp.status === 'COMPLETED'

            return (
              <button
                key={cp.checkpoint_id}
                onClick={() => handleSelect(cp)}
                className={`relative flex flex-col justify-between rounded-2xl p-3.5 text-left border transition cursor-pointer ${
                  isSelected
                    ? 'border-[#087ef5] bg-[#f0f7ff] shadow-sm ring-2 ring-[#087ef5]/20'
                    : isActive
                    ? 'border-[#087ef5]/50 bg-white shadow-xs'
                    : isCompleted
                    ? 'border-[#e5e5e7] bg-[#fafafa] hover:border-gray-300'
                    : 'border-[#e5e5e7] bg-white hover:border-gray-300'
                }`}
              >
                {/* Checkpoint Sequence & Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-[#087ef5] text-white' : isCompleted ? 'bg-[#e8f8ed] text-[#34c759]' : 'bg-gray-100 text-[#86868b]'
                  }`}>
                    {cp.checkpoint_id}
                  </span>
                  {getStatusIcon(cp.status)}
                </div>

                {/* Name */}
                <div className="my-2.5">
                  <h4 className="text-xs font-bold text-[#1d1d1f] line-clamp-1 leading-snug">
                    {cp.name}
                  </h4>
                  <p className="text-[10px] text-[#86868b] line-clamp-1">
                    {cp.location_name}
                  </p>
                </div>

                {/* Metrics */}
                <div className="space-y-1 pt-2 border-t border-black/5 text-[10px]">
                  <div className="flex justify-between text-[#6e6e73]">
                    <span>Covered:</span>
                    <strong className="text-[#1d1d1f]">{cp.distance_covered_nm} NM</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[#6e6e73]">
                      <Waves className="size-3 text-[#087ef5]" /> {cp.forecast_conditions.wave_height_m}m
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${getRiskBadge(cp.forecast_conditions.risk_tier)}`}>
                      {cp.forecast_conditions.risk_tier}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Checkpoint Telemetry & Forecast Inspector Card */}
      {activeCheckpoint && (
        <div className="rounded-2xl border border-[#087ef5]/30 bg-linear-to-br from-[#f8fbff] to-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e5e7] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#087ef5] text-white shadow-xs">
                <Ship className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-[#087ef5] uppercase">
                    SELECTED CHECKPOINT INSPECTOR
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRiskBadge(activeCheckpoint.forecast_conditions.risk_tier)}`}>
                    {activeCheckpoint.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#1d1d1f]">
                  {activeCheckpoint.name} ({activeCheckpoint.checkpoint_id})
                </h4>
                <p className="text-xs text-[#6e6e73]">
                  Coordinates: {activeCheckpoint.coordinates.lat}° N, {activeCheckpoint.coordinates.lon}° E · Milestone: Day {activeCheckpoint.elapsed_days} · {activeCheckpoint.eta_or_passed}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-[#86868b] block uppercase font-semibold">Distance Split</span>
                <strong className="text-[#1d1d1f]">
                  {activeCheckpoint.distance_covered_nm} NM Covered · {activeCheckpoint.distance_remaining_nm} NM To Go
                </strong>
              </div>
            </div>
          </div>

          {/* Dual Column: Ship Telemetry vs Forecasted Sea State */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Left Box: Ship Telemetry at Checkpoint */}
            <div className="rounded-xl border border-[#e5e5e7] bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
                  <Gauge className="size-4 text-[#087ef5]" /> Vessel Telemetry & Engine State
                </span>
                <span className="text-[10px] font-semibold text-[#087ef5] bg-[#087ef5]/10 px-2 py-0.5 rounded-md">
                  {activeCheckpoint.ship_telemetry.safety_status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">SOG Speed</span>
                  <strong className="text-sm font-bold text-[#1d1d1f]">{activeCheckpoint.ship_telemetry.speed_knots} kn</strong>
                </div>
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">True Heading</span>
                  <strong className="text-sm font-bold text-[#1d1d1f]">{activeCheckpoint.ship_telemetry.heading_deg}°</strong>
                </div>
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Engine Load</span>
                  <strong className="text-sm font-bold text-[#1d1d1f]">{activeCheckpoint.ship_telemetry.engine_load_pct}%</strong>
                </div>
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Fuel Burn</span>
                  <strong className="text-sm font-bold text-[#1d1d1f]">{activeCheckpoint.ship_telemetry.fuel_burn_mt_day} MT/day</strong>
                </div>
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Vessel Draft</span>
                  <strong className="text-sm font-bold text-[#1d1d1f]">{activeCheckpoint.ship_telemetry.draft_m} m</strong>
                </div>
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Progress</span>
                  <strong className="text-sm font-bold text-[#34c759]">{activeCheckpoint.progress_percent}%</strong>
                </div>
              </div>
            </div>

            {/* Right Box: Marine Weather Forecast at Checkpoint */}
            <div className="rounded-xl border border-[#e5e5e7] bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
                  <Waves className="size-4 text-[#087ef5]" /> Predicted Marine Forecast & Sea State
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRiskBadge(activeCheckpoint.forecast_conditions.risk_tier)}`}>
                  Risk Score: {activeCheckpoint.forecast_conditions.risk_score}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Wave Swell Height</span>
                  <strong className="text-sm font-bold text-[#1d1d1f] flex items-center gap-1">
                    <Waves className="size-3.5 text-[#087ef5]" /> {activeCheckpoint.forecast_conditions.wave_height_m} m
                  </strong>
                </div>
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Wind Gusts</span>
                  <strong className="text-sm font-bold text-[#1d1d1f] flex items-center gap-1">
                    <Wind className="size-3.5 text-[#087ef5]" /> {activeCheckpoint.forecast_conditions.wind_speed_kmh} km/h
                  </strong>
                </div>
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Wind Direction</span>
                  <strong className="text-sm font-bold text-[#1d1d1f]">{activeCheckpoint.forecast_conditions.wind_direction}</strong>
                </div>
                <div className="col-span-2 rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Sea State Classification</span>
                  <strong className="text-xs font-semibold text-[#1d1d1f]">{activeCheckpoint.forecast_conditions.sea_state}</strong>
                </div>
                <div className="rounded-lg bg-[#f5f5f7] p-2.5">
                  <span className="text-[9px] text-[#86868b] block font-medium">Visibility</span>
                  <strong className="text-sm font-bold text-[#1d1d1f]">{activeCheckpoint.forecast_conditions.visibility_nm} NM</strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
