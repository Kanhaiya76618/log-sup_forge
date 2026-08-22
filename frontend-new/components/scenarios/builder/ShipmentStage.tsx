'use client'

import React from 'react'
import { Box, Ship, MapPin, ArrowRight } from 'lucide-react'
import { initialShipments } from '@/lib/mockData'

interface ShipmentStageProps {
  shipmentId: string
  title: string
  origin: string
  destination: string
  transshipmentHub: string
  onChange: (fields: Partial<{ shipmentId: string; title: string; origin: string; destination: string; transshipmentHub: string; vesselName: string }>) => void
  onNext: () => void
}

export default function ShipmentStage({
  shipmentId,
  title,
  origin,
  destination,
  transshipmentHub,
  onChange,
  onNext
}: ShipmentStageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 01 OF 06</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Select Shipment & Trade Corridor</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Choose an active container voyage or configure a customized maritime route.
        </p>
      </div>

      {/* Scenario Title Input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#1d1d1f]">Scenario Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Typhoon Malakas Avoidance & Reroute Evaluation"
          className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:ring-1 focus:ring-[#087ef5]"
        />
      </div>

      {/* Quick Select from Active Shipments */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[#1d1d1f]">Quick-Load Active Shipment</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {initialShipments.map((s) => {
            const isSelected = shipmentId === s.id
            return (
              <div
                key={s.id}
                onClick={() => onChange({
                  shipmentId: s.id,
                  vesselName: s.vessel,
                  origin: s.origin,
                  destination: s.destination,
                  transshipmentHub: s.origin.includes('Mumbai') ? 'Singapore Tuas Hub (SG)' : 'Colombo Port (LK)'
                })}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  isSelected 
                    ? 'border-[#087ef5] bg-[#f0f7ff] shadow-md ring-2 ring-[#087ef5]/15' 
                    : 'border-[#e5e5e7] bg-[#fafaf9] hover:bg-white hover:border-[#d2d2d7]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#087ef5]">{s.id}</span>
                  <span className={`flow-badge ${s.status === 'At Risk' ? 'bg-[#ffebe8] text-[#ff3b30]' : 'bg-[#e8f8ed] text-[#34c759]'}`}>
                    {s.status}
                  </span>
                </div>
                <h4 className="mt-2 text-xs font-bold text-[#1d1d1f]">{s.vessel}</h4>
                <p className="mt-1 text-[11px] text-[#6e6e73] leading-snug">{s.origin} ➔ {s.destination}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Origin, Transshipment, Destination Form Fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1d1d1f]">Origin Port</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => onChange({ origin: e.target.value })}
            className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1d1d1f]">Transshipment Hub</label>
          <input
            type="text"
            value={transshipmentHub}
            onChange={(e) => onChange({ transshipmentHub: e.target.value })}
            className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1d1d1f]">Destination Port</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => onChange({ destination: e.target.value })}
            className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#f0f0f2]">
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf] transition active:scale-95"
        >
          Next: Vessel & Voyage Details <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
