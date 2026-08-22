'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, MapPin, Check } from 'lucide-react'

export interface PortOption {
  name: string
  code: string
  country: string
  flag: string
  type: 'origin' | 'transshipment' | 'destination' | 'all'
}

export const ALL_PORTS: PortOption[] = [
  // Origin Ports
  { name: 'Jawaharlal Nehru Port (Mumbai)', code: 'INNSA', country: 'India', flag: '🇮🇳', type: 'origin' },
  { name: 'Mundra Port (Gujarat)', code: 'INMUN', country: 'India', flag: '🇮🇳', type: 'origin' },
  { name: 'Chennai Port (Tamil Nadu)', code: 'INMAA', country: 'India', flag: '🇮🇳', type: 'origin' },
  { name: 'Kolkata Port (West Bengal)', code: 'INCCU', country: 'India', flag: '🇮🇳', type: 'origin' },

  // Transshipment Hubs
  { name: 'Singapore Tuas Hub', code: 'SGSIN', country: 'Singapore', flag: '🇸🇬', type: 'transshipment' },
  { name: 'Colombo Port', code: 'LKCMB', country: 'Sri Lanka', flag: '🇱🇰', type: 'transshipment' },
  { name: 'Port Klang (Malaysia)', code: 'MYPKG', country: 'Malaysia', flag: '🇲🇾', type: 'transshipment' },
  { name: 'Tanjung Pelepas', code: 'MYPTP', country: 'Malaysia', flag: '🇲🇾', type: 'transshipment' },
  { name: 'Hong Kong Container Terminals', code: 'HKHKG', country: 'Hong Kong', flag: '🇭🇰', type: 'transshipment' },

  // Destination Ports
  { name: 'Port of Yokohama', code: 'JPYOK', country: 'Japan', flag: '🇯🇵', type: 'destination' },
  { name: 'Port of Tokyo', code: 'JPTYO', country: 'Japan', flag: '🇯🇵', type: 'destination' },
  { name: 'Port of Nagoya', code: 'JPNGO', country: 'Japan', flag: '🇯🇵', type: 'destination' },
  { name: 'Port of Osaka', code: 'JPOSA', country: 'Japan', flag: '🇯🇵', type: 'destination' },
  { name: 'Busan Port', code: 'KRPUS', country: 'South Korea', flag: '🇰🇷', type: 'destination' },
  { name: 'Incheon Port', code: 'KRICN', country: 'South Korea', flag: '🇰🇷', type: 'destination' },
  { name: 'Shanghai Port', code: 'CNSHA', country: 'China', flag: '🇨🇳', type: 'destination' },
  { name: 'Tianjin Port', code: 'CNTSN', country: 'China', flag: '🇨🇳', type: 'destination' },
  { name: 'Shenzhen Yantian Port', code: 'CNSZX', country: 'China', flag: '🇨🇳', type: 'destination' },
]

const TYPE_LABEL: Record<PortOption['type'], string> = {
  origin: 'Origin Port',
  transshipment: 'Transshipment Hub',
  destination: 'Destination Port',
  all: 'All Ports',
}

const TYPE_COLOR: Record<PortOption['type'], string> = {
  origin: 'bg-[#e8f0fe] text-[#087ef5]',
  transshipment: 'bg-[#fff4e5] text-[#ff9f0a]',
  destination: 'bg-[#e8f8ed] text-[#34c759]',
  all: 'bg-[#f0f0f2] text-[#6e6e73]',
}

interface PortDropdownProps {
  value: string
  onChange: (portName: string) => void
  label: string
  required?: boolean
  filter?: PortOption['type'][]
  placeholder?: string
}

export default function PortDropdown({ value, onChange, label, required, filter, placeholder }: PortDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = ALL_PORTS.filter((p) => {
    const matchesType = !filter || filter.includes(p.type)
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  // Group by type
  const grouped = filtered.reduce<Record<string, PortOption[]>>((acc, p) => {
    const key = TYPE_LABEL[p.type]
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedPort = ALL_PORTS.find(p => {
    if (!value) return false
    const valLower = value.toLowerCase()
    const portLower = p.name.toLowerCase()
    const baseVal = valLower.split('(')[0].trim()
    const basePort = portLower.split('(')[0].trim()
    return (
      valLower === portLower ||
      valLower.includes(basePort) ||
      portLower.includes(baseVal) ||
      (p.code && valLower.includes(p.code.toLowerCase()))
    )
  })

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
        {label}
        {required && <span className="text-[#ff3b30]">*</span>}
        <span className="ml-auto text-[10px] font-normal text-[#86868b] bg-[#f5f5f7] px-1.5 py-0.5 rounded-md">
          {value ? 'edit to change' : 'select a port'}
        </span>
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen(!open); setSearch('') }}
          className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs transition text-left ${
            open
              ? 'border-[#087ef5] bg-white ring-1 ring-[#087ef5]'
              : 'border-[#d2d2d7] bg-[#fafaf9] hover:bg-white hover:border-[#c7c7cc]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedPort ? (
              <>
                <span className="text-base leading-none shrink-0">{selectedPort.flag}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-[#1d1d1f] truncate">{selectedPort.name}</p>
                  <p className="text-[10px] text-[#86868b]">{selectedPort.code} · {selectedPort.country}</p>
                </div>
              </>
            ) : (
              <span className="text-[#86868b]">{placeholder || 'Select a port...'}</span>
            )}
          </div>
          <ChevronDown className={`size-3.5 shrink-0 text-[#86868b] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-2xl border border-[#d2d2d7] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-[#f0f0f2]">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search port name, code, or country..."
                className="w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-3 py-2 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:bg-white transition"
              />
            </div>

            {/* Options */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
              {Object.entries(grouped).length === 0 && (
                <p className="text-center text-xs text-[#86868b] py-4">No ports match your search</p>
              )}

              {Object.entries(grouped).map(([group, ports]) => (
                <div key={group}>
                  <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">{group}</p>
                  {ports.map((port) => {
                    const isSelected = value.includes(port.name) || value.includes(port.code)
                    return (
                      <button
                        key={port.code}
                        type="button"
                        onClick={() => {
                          onChange(port.name)
                          setOpen(false)
                          setSearch('')
                        }}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          isSelected ? 'bg-[#f0f7ff]' : 'hover:bg-[#f5f5f7]'
                        }`}
                      >
                        <span className="text-base leading-none shrink-0">{port.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${isSelected ? 'text-[#087ef5]' : 'text-[#1d1d1f]'} truncate`}>{port.name}</p>
                          <p className="text-[10px] text-[#86868b]">{port.code} · {port.country}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${TYPE_COLOR[port.type]}`}>
                          {port.type === 'origin' ? 'ORIGIN' : port.type === 'transshipment' ? 'HUB' : 'DEST'}
                        </span>
                        {isSelected && <Check className="size-3.5 text-[#087ef5] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Show typed value if not from the list */}
      {value && !selectedPort && (
        <div className="flex items-center gap-1.5 rounded-xl border border-[#e5e5e7] bg-[#fafaf9] px-3 py-1.5">
          <MapPin className="size-3 text-[#86868b] shrink-0" />
          <p className="text-xs text-[#6e6e73] truncate">{value}</p>
        </div>
      )}
    </div>
  )
}
