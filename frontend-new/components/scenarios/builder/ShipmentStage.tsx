'use client'

import React from 'react'
import { ArrowRight, Hash } from 'lucide-react'
import { initialShipments } from '@/lib/mockData'
import PortDropdown from './PortDropdown'

interface ShipmentStageProps {
  shipmentId: string
  title: string
  origin: string
  destination: string
  transshipmentHub: string
  onChange: (fields: Partial<{ shipmentId: string; title: string; origin: string; destination: string; transshipmentHub: string; vesselName: string }>) => void
  onNext: () => void
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
      {label}
      {required && <span className="text-[#ff3b30]">*</span>}
      <span className="ml-auto text-[10px] font-normal text-[#86868b] bg-[#f5f5f7] px-1.5 py-0.5 rounded-md">edit to change</span>
    </label>
  )
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
  const canProceed = Boolean(title.trim() && shipmentId.trim() && origin.trim() && destination.trim())

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="flow-label text-[#087ef5]">STAGE 01 OF 04</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Shipment & Trade Corridor</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Each field is pre-filled with a suggested value — keep it or pick from the dropdown menus to match your scenario.
        </p>
      </div>

      {/* Scenario Title + Shipment ID */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <FieldLabel label="Scenario Title" required />
          <input
            type="text"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-4 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white focus:ring-1 focus:ring-[#087ef5] transition"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel label="Shipment ID" required />
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#86868b]" />
            <input
              type="text"
              value={shipmentId}
              onChange={(e) => onChange({ shipmentId: e.target.value })}
              className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] pl-8 pr-4 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white focus:ring-1 focus:ring-[#087ef5] transition"
            />
          </div>
          <p className="text-[10px] text-[#86868b]">Internal shipment tracking reference</p>
        </div>
      </div>

      {/* Quick Select Active Shipments */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[#1d1d1f]">
          Quick-Load Active Shipment
          <span className="ml-2 text-[10px] font-normal text-[#86868b]">(auto-fills all route fields below)</span>
        </label>
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

      {/* Route Fields - 3 Port Dropdowns */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#1d1d1f]">Trade Corridor (Select Ports)</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <PortDropdown
            label="Origin Port"
            value={origin}
            onChange={(val) => onChange({ origin: val })}
            required
            filter={['origin']}
            placeholder="Select Origin Port..."
          />

          <PortDropdown
            label="Transshipment Hub"
            value={transshipmentHub}
            onChange={(val) => onChange({ transshipmentHub: val })}
            filter={['transshipment']}
            placeholder="Select Transshipment Hub..."
          />

          <PortDropdown
            label="Destination Port"
            value={destination}
            onChange={(val) => onChange({ destination: val })}
            required
            filter={['destination']}
            placeholder="Select Destination Port..."
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#f0f0f2]">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf] transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Vessel Profile <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
