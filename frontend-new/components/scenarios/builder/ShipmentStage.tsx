'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowRight, MapPin, Search, ChevronDown } from 'lucide-react'
import { initialShipments } from '@/lib/mockData'

// ---------------------------------------------------------------------------
// Global port catalogue — 60+ major commercial ports
// ---------------------------------------------------------------------------
export interface PortEntry {
  name: string
  city: string
  country: string
  region: string
  code: string
  flag: string
}

export const GLOBAL_PORTS: PortEntry[] = [
  // South Asia
  { name: 'Jawaharlal Nehru Port (Mumbai, IN)', city: 'Mumbai',       country: 'India',        region: 'South Asia',     code: 'INNSA', flag: '🇮🇳' },
  { name: 'Chennai Port (IN)',                  city: 'Chennai',      country: 'India',        region: 'South Asia',     code: 'INMAA', flag: '🇮🇳' },
  { name: 'Mundra Port (IN)',                   city: 'Mundra',       country: 'India',        region: 'South Asia',     code: 'INMUN', flag: '🇮🇳' },
  { name: 'Kochi Port (IN)',                    city: 'Kochi',        country: 'India',        region: 'South Asia',     code: 'INCOK', flag: '🇮🇳' },
  { name: 'Colombo Port (LK)',                  city: 'Colombo',      country: 'Sri Lanka',    region: 'South Asia',     code: 'LKCMB', flag: '🇱🇰' },
  { name: 'Port of Chittagong (BD)',            city: 'Chittagong',   country: 'Bangladesh',   region: 'South Asia',     code: 'BDCGP', flag: '🇧🇩' },
  { name: 'Karachi Port (PK)',                  city: 'Karachi',      country: 'Pakistan',     region: 'South Asia',     code: 'PKKHI', flag: '🇵🇰' },
  // Southeast Asia
  { name: 'Singapore Tuas Hub (SG)',            city: 'Singapore',    country: 'Singapore',    region: 'Southeast Asia', code: 'SGSIN', flag: '🇸🇬' },
  { name: 'Port Klang (MY)',                    city: 'Klang',        country: 'Malaysia',     region: 'Southeast Asia', code: 'MYPKG', flag: '🇲🇾' },
  { name: 'Tanjung Pelepas (MY)',               city: 'Johor',        country: 'Malaysia',     region: 'Southeast Asia', code: 'MYPTP', flag: '🇲🇾' },
  { name: 'Laem Chabang Port (TH)',             city: 'Laem Chabang', country: 'Thailand',     region: 'Southeast Asia', code: 'THLCH', flag: '🇹🇭' },
  { name: 'Ho Chi Minh City Port (VN)',         city: 'Ho Chi Minh',  country: 'Vietnam',      region: 'Southeast Asia', code: 'VNSGN', flag: '🇻🇳' },
  { name: 'Tanjung Priok Jakarta (ID)',         city: 'Jakarta',      country: 'Indonesia',    region: 'Southeast Asia', code: 'IDJKT', flag: '🇮🇩' },
  { name: 'Manila International Port (PH)',     city: 'Manila',       country: 'Philippines',  region: 'Southeast Asia', code: 'PHMNL', flag: '🇵🇭' },
  { name: 'Port of Sihanoukville (KH)',         city: 'Sihanoukville',country: 'Cambodia',     region: 'Southeast Asia', code: 'KHSNV', flag: '🇰🇭' },
  // East Asia
  { name: 'Port of Yokohama (JP)',              city: 'Yokohama',     country: 'Japan',        region: 'East Asia',      code: 'JPYOK', flag: '🇯🇵' },
  { name: 'Port of Tokyo (JP)',                 city: 'Tokyo',        country: 'Japan',        region: 'East Asia',      code: 'JPTYO', flag: '🇯🇵' },
  { name: 'Port of Osaka (JP)',                 city: 'Osaka',        country: 'Japan',        region: 'East Asia',      code: 'JPOSA', flag: '🇯🇵' },
  { name: 'Port of Kobe (JP)',                  city: 'Kobe',         country: 'Japan',        region: 'East Asia',      code: 'JPUKB', flag: '🇯🇵' },
  { name: 'Port of Nagoya (JP)',                city: 'Nagoya',       country: 'Japan',        region: 'East Asia',      code: 'JPNGO', flag: '🇯🇵' },
  { name: 'Shanghai Yangshan Port (CN)',        city: 'Shanghai',     country: 'China',        region: 'East Asia',      code: 'CNSHA', flag: '🇨🇳' },
  { name: 'Shenzhen Yantian Port (CN)',         city: 'Shenzhen',     country: 'China',        region: 'East Asia',      code: 'CNSZX', flag: '🇨🇳' },
  { name: 'Guangzhou Nansha Port (CN)',         city: 'Guangzhou',    country: 'China',        region: 'East Asia',      code: 'CNGZH', flag: '🇨🇳' },
  { name: 'Ningbo-Zhoushan Port (CN)',          city: 'Ningbo',       country: 'China',        region: 'East Asia',      code: 'CNNGB', flag: '🇨🇳' },
  { name: 'Qingdao Port (CN)',                  city: 'Qingdao',      country: 'China',        region: 'East Asia',      code: 'CNTAO', flag: '🇨🇳' },
  { name: 'Tianjin Xingang Port (CN)',          city: 'Tianjin',      country: 'China',        region: 'East Asia',      code: 'CNTSN', flag: '🇨🇳' },
  { name: 'Busan New Port (KR)',                city: 'Busan',        country: 'South Korea',  region: 'East Asia',      code: 'KRPUS', flag: '🇰🇷' },
  { name: 'Incheon Port (KR)',                  city: 'Incheon',      country: 'South Korea',  region: 'East Asia',      code: 'KRINC', flag: '🇰🇷' },
  { name: 'Port of Kaohsiung (TW)',             city: 'Kaohsiung',    country: 'Taiwan',       region: 'East Asia',      code: 'TWKHH', flag: '🇹🇼' },
  { name: 'Port of Hong Kong (HK)',             city: 'Hong Kong',    country: 'Hong Kong',    region: 'East Asia',      code: 'HKHKG', flag: '🇭🇰' },
  // Middle East
  { name: 'Jebel Ali Port (AE)',                city: 'Dubai',        country: 'UAE',          region: 'Middle East',    code: 'AEJEA', flag: '🇦🇪' },
  { name: 'Port of Salalah (OM)',               city: 'Salalah',      country: 'Oman',         region: 'Middle East',    code: 'OMSLL', flag: '🇴🇲' },
  { name: 'Port of Bandar Abbas (IR)',          city: 'Bandar Abbas', country: 'Iran',         region: 'Middle East',    code: 'IRBND', flag: '🇮🇷' },
  { name: 'King Abdullah Port (SA)',            city: 'Rabigh',       country: 'Saudi Arabia', region: 'Middle East',    code: 'SAKAP', flag: '🇸🇦' },
  // East Africa
  { name: 'Port of Mombasa (KE)',               city: 'Mombasa',      country: 'Kenya',        region: 'East Africa',    code: 'KEMBA', flag: '🇰🇪' },
  { name: 'Port of Dar es Salaam (TZ)',         city: 'Dar es Salaam',country: 'Tanzania',     region: 'East Africa',    code: 'TZDRS', flag: '🇹🇿' },
  { name: 'Port of Djibouti (DJ)',              city: 'Djibouti',     country: 'Djibouti',     region: 'East Africa',    code: 'DJJIB', flag: '🇩🇯' },
  // Mediterranean & Suez
  { name: 'Port Said — Suez Canal Gateway (EG)', city: 'Port Said',  country: 'Egypt',        region: 'Mediterranean',  code: 'EGPSD', flag: '🇪🇬' },
  { name: 'Port of Piraeus (GR)',               city: 'Athens',       country: 'Greece',       region: 'Mediterranean',  code: 'GRPIR', flag: '🇬🇷' },
  { name: 'Port of Algeciras (ES)',             city: 'Algeciras',    country: 'Spain',        region: 'Mediterranean',  code: 'ESALG', flag: '🇪🇸' },
  { name: 'Port of Genoa (IT)',                 city: 'Genoa',        country: 'Italy',        region: 'Mediterranean',  code: 'ITGOA', flag: '🇮🇹' },
  { name: 'Port of Valencia (ES)',              city: 'Valencia',     country: 'Spain',        region: 'Mediterranean',  code: 'ESVLC', flag: '🇪🇸' },
  { name: 'Port of Istanbul (TR)',              city: 'Istanbul',     country: 'Turkey',       region: 'Mediterranean',  code: 'TRIST', flag: '🇹🇷' },
  // North Europe
  { name: 'Rotterdam Gateway (NL)',             city: 'Rotterdam',    country: 'Netherlands',  region: 'North Europe',   code: 'NLRTM', flag: '🇳🇱' },
  { name: 'Port of Antwerp-Bruges (BE)',        city: 'Antwerp',      country: 'Belgium',      region: 'North Europe',   code: 'BEANR', flag: '🇧🇪' },
  { name: 'Port of Hamburg (DE)',               city: 'Hamburg',      country: 'Germany',      region: 'North Europe',   code: 'DEHAM', flag: '🇩🇪' },
  { name: 'Port of Felixstowe (GB)',            city: 'Felixstowe',   country: 'UK',           region: 'North Europe',   code: 'GBFXT', flag: '🇬🇧' },
  { name: 'Port of Le Havre (FR)',              city: 'Le Havre',     country: 'France',       region: 'North Europe',   code: 'FRLEH', flag: '🇫🇷' },
  { name: 'Port of Bremerhaven (DE)',           city: 'Bremerhaven',  country: 'Germany',      region: 'North Europe',   code: 'DEBRV', flag: '🇩🇪' },
  // North America
  { name: 'Port of New York & New Jersey (US)', city: 'New York',     country: 'USA',          region: 'North America',  code: 'USNYC', flag: '🇺🇸' },
  { name: 'Port of Savannah (US)',              city: 'Savannah',     country: 'USA',          region: 'North America',  code: 'USSAV', flag: '🇺🇸' },
  { name: 'Port of Los Angeles (US)',           city: 'Los Angeles',  country: 'USA',          region: 'North America',  code: 'USLAX', flag: '🇺🇸' },
  { name: 'Port of Long Beach (US)',            city: 'Long Beach',   country: 'USA',          region: 'North America',  code: 'USLGB', flag: '🇺🇸' },
  { name: 'Port of Seattle-Tacoma (US)',        city: 'Seattle',      country: 'USA',          region: 'North America',  code: 'USSEA', flag: '🇺🇸' },
  { name: 'Port of Vancouver (CA)',             city: 'Vancouver',    country: 'Canada',       region: 'North America',  code: 'CAVAN', flag: '🇨🇦' },
  // Latin America
  { name: 'Port of Santos (BR)',                city: 'Santos',       country: 'Brazil',       region: 'Latin America',  code: 'BRSSZ', flag: '🇧🇷' },
  { name: 'Port of Callao (PE)',                city: 'Lima',         country: 'Peru',         region: 'Latin America',  code: 'PECLL', flag: '🇵🇪' },
  { name: 'Port of Manzanillo (MX)',            city: 'Manzanillo',   country: 'Mexico',       region: 'Latin America',  code: 'MXZLO', flag: '🇲🇽' },
  { name: 'Port of Colon (PA)',                 city: 'Colon',        country: 'Panama',       region: 'Latin America',  code: 'PAONX', flag: '🇵🇦' },
  // Oceania
  { name: 'Port of Melbourne (AU)',             city: 'Melbourne',    country: 'Australia',    region: 'Oceania',        code: 'AUMEL', flag: '🇦🇺' },
  { name: 'Port of Sydney (AU)',                city: 'Sydney',       country: 'Australia',    region: 'Oceania',        code: 'AUSYD', flag: '🇦🇺' },
  { name: 'Port of Brisbane (AU)',              city: 'Brisbane',     country: 'Australia',    region: 'Oceania',        code: 'AUBNE', flag: '🇦🇺' },
]

// ---------------------------------------------------------------------------
// Reusable searchable port dropdown
// ---------------------------------------------------------------------------
interface PortSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  exclude?: string[]
}

function PortSelect({ label, value, onChange, placeholder = 'Search ports…', exclude = [] }: PortSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = GLOBAL_PORTS.filter(p =>
    !exclude.includes(p.name) &&
    (query === '' ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.city.toLowerCase().includes(query.toLowerCase()) ||
      p.country.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase()))
  )

  const regions = Array.from(new Set(filtered.map(p => p.region)))
  const selected = GLOBAL_PORTS.find(p => p.name === value)

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-[#1d1d1f]">{label}</label>

      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery('') }}
        className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs text-left transition bg-white ${
          open ? 'border-[#087ef5] ring-1 ring-[#087ef5]' : 'border-[#d2d2d7] hover:border-[#aeaeb2]'
        }`}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="truncate text-[#1d1d1f]">{selected.name}</span>
          </span>
        ) : (
          <span className="text-[#86868b]">{placeholder}</span>
        )}
        <ChevronDown className={`size-3.5 text-[#86868b] shrink-0 transition-transform ml-2 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-2xl border border-[#d2d2d7] bg-white shadow-xl max-h-72 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 border-b border-[#f0f0f2] px-3 py-2 shrink-0">
            <Search className="size-3.5 text-[#86868b] shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by port, city, country, or code…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-[#aeaeb2]"
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {regions.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#86868b]">No ports found for &ldquo;{query}&rdquo;</div>
            ) : (
              regions.map(region => (
                <div key={region}>
                  <div className="sticky top-0 bg-[#f7f7f5] px-3 py-1.5 text-[9px] font-bold tracking-widest text-[#86868b] uppercase border-b border-[#f0f0f2]">
                    {region}
                  </div>
                  {filtered.filter(p => p.region === region).map(port => (
                    <button
                      key={port.code}
                      type="button"
                      onClick={() => { onChange(port.name); setOpen(false); setQuery('') }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                        value === port.name ? 'bg-[#f0f7ff]' : 'hover:bg-[#f0f7ff]'
                      }`}
                    >
                      <span className="text-base leading-none shrink-0">{port.flag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#1d1d1f] truncate">{port.name}</p>
                        <p className="text-[10px] text-[#86868b]">{port.city} · {port.country} · {port.code}</p>
                      </div>
                      {value === port.name && (
                        <span className="text-[#087ef5] text-[10px] font-bold shrink-0">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ShipmentStage
// ---------------------------------------------------------------------------
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
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Select Shipment &amp; Trade Corridor</h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Choose an active container voyage or configure a customized maritime route.
        </p>
      </div>

      {/* Scenario Title */}
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

      {/* Quick-Load Active Shipments */}
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
                  <span className={`flow-badge ${
                    s.status === 'At Risk' ? 'bg-[#ffebe8] text-[#ff3b30]' :
                    s.status === 'Delayed' ? 'bg-[#fff5eb] text-[#ff9f0a]' :
                    'bg-[#e8f8ed] text-[#34c759]'
                  }`}>
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

      {/* Searchable port dropdowns */}
      <div className="grid gap-4 sm:grid-cols-3">
        <PortSelect
          label="Origin Port"
          value={origin}
          onChange={(val) => onChange({ origin: val })}
          exclude={[destination, transshipmentHub].filter(Boolean)}
        />
        <PortSelect
          label="Transshipment Hub"
          value={transshipmentHub}
          onChange={(val) => onChange({ transshipmentHub: val })}
          exclude={[origin, destination].filter(Boolean)}
        />
        <PortSelect
          label="Destination Port"
          value={destination}
          onChange={(val) => onChange({ destination: val })}
          exclude={[origin, transshipmentHub].filter(Boolean)}
        />
      </div>

      {/* Route preview strip */}
      {(origin || destination) && (
        <div className="flex items-center gap-2 rounded-xl bg-[#f0f7ff] border border-[#d6e8ff] px-4 py-2.5">
          <MapPin className="size-3.5 text-[#087ef5] shrink-0" />
          <p className="text-xs text-[#087ef5] truncate">
            <span className="font-semibold">{origin || '—'}</span>
            {transshipmentHub && (
              <> &nbsp;→&nbsp; <span className="font-medium">{transshipmentHub}</span></>
            )}
            &nbsp;→&nbsp; <span className="font-semibold">{destination || '—'}</span>
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-[#f0f0f2]">
        <button
          onClick={onNext}
          disabled={!origin || !destination}
          className="flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#076ecf] transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Vessel &amp; Voyage Details <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
