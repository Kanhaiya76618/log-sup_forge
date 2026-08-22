'use client'

import React, { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { 
  Navigation, Ship, ShieldCheck, AlertTriangle, CheckCircle2, 
  Layers, ZoomIn, ZoomOut, RotateCcw, MapPin, Waves, Compass,
  ChevronDown, ChevronUp, X, Maximize2, Minimize2, Sparkles, Check
} from 'lucide-react'
import seaRoutesData from '@/lib/searoutes.json'

export interface RouteDetail {
  id: string
  name: string
  vessel: string
  originName: string
  hubName: string
  destName: string
  originCoords: [number, number]
  hubCoords: [number, number]
  destCoords: [number, number]
  waypoints: [number, number][]
  bypassWaypoints?: [number, number][]
  status: 'critical' | 'delayed' | 'optimal'
  speed: string
  heading: string
  eta: string
  riskFactor: number
  cargo: string
  color: string
}

// Commercial maritime corridor for tracked container #MSKU-9824-0
const activeCorridor: RouteDetail = {
  id: 'COR-01',
  name: 'Mumbai JNPT ➔ Singapore Tuas Hub ➔ Port of Yokohama',
  vessel: 'CSCL Globe Supermax / CMA CGM Jacques Saadé',
  originName: 'Jawaharlal Nehru Port (Mumbai, IN)',
  hubName: 'Singapore Tuas Transshipment Hub (SG)',
  destName: 'Port of Yokohama (JP)',
  originCoords: [18.95, 72.95],
  hubCoords: [1.29, 103.85],
  destCoords: [35.44, 139.64],
  waypoints: (seaRoutesData as any).corridor_1 as [number, number][],
  bypassWaypoints: (seaRoutesData as any).corridor_bypass as [number, number][],
  status: 'critical',
  speed: '18.2 kn',
  heading: '065° ENE',
  eta: 'Nov 26, 2026 (+4.2d)',
  riskFactor: 82,
  cargo: 'Automotive ECUs & Battery Packs ($35.2M)',
  color: '#ff3b30',
}

// Calculate cumulative segment distances and interpolated coordinates with heading angle
function getRoutePathStats(waypoints: [number, number][]) {
  const distances: number[] = [0]
  let total = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]
    const p2 = waypoints[i + 1]
    const dLat = p2[0] - p1[0]
    const dLng = p2[1] - p1[1]
    const dist = Math.hypot(dLat, dLng)
    total += dist
    distances.push(total)
  }
  return { distances, total }
}

function getInterpolatedVesselPosition(waypoints: [number, number][], t: number) {
  if (!waypoints || waypoints.length === 0) return { lat: 18.95, lng: 72.95, heading: 65 }
  if (waypoints.length === 1) return { lat: waypoints[0][0], lng: waypoints[0][1], heading: 0 }

  const { distances, total } = getRoutePathStats(waypoints)
  if (total === 0) return { lat: waypoints[0][0], lng: waypoints[0][1], heading: 0 }

  const targetDist = (((t % 1) + 1) % 1) * total

  let segIdx = 0
  for (let i = 0; i < distances.length - 1; i++) {
    if (targetDist >= distances[i] && targetDist <= distances[i + 1]) {
      segIdx = i
      break
    }
  }

  const segStartDist = distances[segIdx]
  const segEndDist = distances[segIdx + 1]
  const segLen = segEndDist - segStartDist
  const u = segLen > 0 ? (targetDist - segStartDist) / segLen : 0

  const p1 = waypoints[segIdx]
  const p2 = waypoints[segIdx + 1] || p1

  const lat = p1[0] + u * (p2[0] - p1[0])
  const lng = p1[1] + u * (p2[1] - p1[1])

  // Screen direction angle in degrees (North = 0, East = 90, South = 180, West = 270)
  const dLat = p2[0] - p1[0]
  const dLng = p2[1] - p1[1]
  const angleRad = Math.atan2(dLng, dLat)
  let heading = (angleRad * 180) / Math.PI
  if (heading < 0) heading += 360

  return { lat, lng, heading }
}

export default function GlobalMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const shipMarkerRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const vesselProgressRef = useRef<number>(0.24) // Start along Indian Ocean
  const [activeCorridorMode, setActiveCorridorMode] = useState<'nominal' | 'bypass'>('nominal')
  const [selectedCorridor, setSelectedCorridor] = useState<RouteDetail>(activeCorridor)
  const [showBypass, setShowBypass] = useState<boolean>(true)
  const [isMapReady, setIsMapReady] = useState<boolean>(false)
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  useEffect(() => {
    let isCancelled = false
    let map: any = null

    const initMap = async () => {
      if (!mapContainerRef.current) return

      const L = (await import('leaflet')).default
      if (isCancelled || !mapContainerRef.current) return

      // Tear down any existing instance on the DOM element if present
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {}
        mapInstanceRef.current = null
      }

      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null
      }

      // Initialize map with Pacific/Indian Ocean center
      map = L.map(mapContainerRef.current, {
        center: [16.0, 98.0],
        zoom: 4,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
      })

      mapInstanceRef.current = map

      // Clean, muted modern basemap tile layer (CartoDB Positron style)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Add marine bathymetry / ocean contour layer for maritime realism
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        opacity: 0.22,
        maxZoom: 10,
      }).addTo(map)

      renderCorridors(L, map)
      setIsMapReady(true)
    }

    initMap()

    return () => {
      isCancelled = true
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {}
        mapInstanceRef.current = null
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null
      }
      setIsMapReady(false)
    }
  }, [])

  // Re-render routes when showBypass or activeCorridorMode changes
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    const render = async () => {
      const L = (await import('leaflet')).default
      renderCorridors(L, mapInstanceRef.current)
    }
    render()
  }, [showBypass, activeCorridorMode, isMapReady])

  // Invalidate map size when fullscreen toggles
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize()
      }, 200)
    }
  }, [isFullscreen])

  const renderCorridors = (L: any, map: any) => {
    // Clear previous animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Clear previous layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    const corridor = activeCorridor

    // 1. Standard Commercial Route Polyline (Nominal Mumbai -> Singapore -> Yokohama)
    const line = L.polyline(corridor.waypoints, {
      color: corridor.color,
      weight: activeCorridorMode === 'nominal' ? 4.5 : 2.5,
      opacity: activeCorridorMode === 'nominal' ? 1.0 : 0.45,
      dashArray: '7, 9',
      lineCap: 'round',
      lineJoin: 'round',
      className: 'corridor-line-nominal',
    }).addTo(map)

    line.on('click', () => {
      setActiveCorridorMode('nominal')
      setInspectorOpen(true)
    })

    // 2. Scenario B Southern Bypass Path (OR-Tools CP-SAT Typhoon Swell Bypass)
    if (corridor.bypassWaypoints && showBypass) {
      const bypassLine = L.polyline(corridor.bypassWaypoints, {
        color: '#34c759',
        weight: activeCorridorMode === 'bypass' ? 4.5 : 2.5,
        opacity: activeCorridorMode === 'bypass' ? 1.0 : 0.45,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'corridor-line-bypass',
      }).addTo(map)

      bypassLine.on('click', () => {
        setActiveCorridorMode('bypass')
        setInspectorOpen(true)
      })
    }

    // 3. Dynamic Checkpoints Based on Active Path Mode
    const nominalCheckpoints = [
      { id: 'CP-01', name: 'Mumbai JNPT Departure', coords: [18.95, 72.95], status: 'COMPLETED', covered: '0 NM (0%)', remaining: '5,170 NM', wave: '1.2m', wind: '18 km/h', risk: 'LOW', color: '#34c759' },
      { id: 'CP-02', name: 'Sri Lanka Dondra Corridor', coords: [5.85, 80.55], status: 'COMPLETED', covered: '980 NM (19%)', remaining: '4,190 NM', wave: '2.1m', wind: '28 km/h', risk: 'MEDIUM', color: '#34c759' },
      { id: 'CP-03', name: 'Malacca Strait Entry', coords: [5.25, 97.50], status: 'COMPLETED', covered: '1,890 NM (36.6%)', remaining: '3,280 NM', wave: '0.8m', wind: '14 km/h', risk: 'LOW', color: '#34c759' },
      { id: 'CP-04', name: 'Singapore Tuas Hub', coords: [1.29, 103.85], status: 'ACTIVE', covered: '2,140 NM (41.4%)', remaining: '3,030 NM', wave: '0.6m', wind: '12 km/h', risk: 'HIGH', color: '#087ef5' },
      { id: 'CP-05', name: 'South China Sea Mid Basin', coords: [12.50, 114.20], status: 'UPCOMING', covered: '3,250 NM (62.9%)', remaining: '1,920 NM', wave: '2.6m', wind: '36 km/h', risk: 'HIGH', color: '#ff9f0a' },
      { id: 'CP-06', name: 'Luzon Strait / Taiwan (Storm Hazard)', coords: [22.80, 123.50], status: 'UPCOMING', covered: '4,310 NM (83.4%)', remaining: '860 NM', wave: '3.8m', wind: '52 km/h', risk: 'CRITICAL', color: '#ff3b30' },
      { id: 'CP-07', name: 'Port of Yokohama Berth (+4.2d Slip)', coords: [35.44, 139.64], status: 'UPCOMING', covered: '5,170 NM (100%)', remaining: '0 NM', wave: '1.4m', wind: '20 km/h', risk: 'MEDIUM', color: '#1d1d1f' },
    ]

    const bypassCheckpoints = [
      { id: 'BP-01', name: 'Mumbai JNPT Departure', coords: [18.95, 72.95], status: 'COMPLETED', covered: '0 NM (0%)', remaining: '5,170 NM', wave: '1.2m', wind: '18 km/h', risk: 'LOW', color: '#34c759' },
      { id: 'BP-02', name: 'Sri Lanka Equatorial Corridor', coords: [5.85, 80.55], status: 'COMPLETED', covered: '980 NM (19%)', remaining: '4,190 NM', wave: '2.1m', wind: '28 km/h', risk: 'MEDIUM', color: '#34c759' },
      { id: 'BP-03', name: 'Sunda Strait Corridor (Indonesia)', coords: [-5.95, 105.75], status: 'OPTIMAL', covered: '2,350 NM (45.4%)', remaining: '2,820 NM', wave: '1.1m', wind: '16 km/h', risk: 'LOW', color: '#34c759' },
      { id: 'BP-04', name: 'Java Sea / Makassar Passage', coords: [-2.50, 118.80], status: 'OPTIMAL', covered: '2,980 NM (57.6%)', remaining: '2,190 NM', wave: '0.9m', wind: '14 km/h', risk: 'LOW', color: '#34c759' },
      { id: 'BP-05', name: 'South Philippine Sea Deep Basin', coords: [12.00, 126.00], status: 'OPTIMAL', covered: '3,840 NM (74.3%)', remaining: '1,330 NM', wave: '1.4m', wind: '22 km/h', risk: 'LOW', color: '#34c759' },
      { id: 'BP-06', name: 'Pacific East Kuroshio Approach', coords: [26.50, 134.20], status: 'OPTIMAL', covered: '4,620 NM (89.4%)', remaining: '550 NM', wave: '1.3m', wind: '19 km/h', risk: 'LOW', color: '#34c759' },
      { id: 'BP-07', name: 'Port of Yokohama Berth (On-Time +0.8d)', coords: [35.44, 139.64], status: 'RECOMMENDED', covered: '5,170 NM (100%)', remaining: '0 NM', wave: '1.4m', wind: '20 km/h', risk: 'LOW', color: '#34c759' },
    ]

    const activeCheckpoints = activeCorridorMode === 'nominal' ? nominalCheckpoints : bypassCheckpoints

    activeCheckpoints.forEach((cp) => {
      const cpDiv = L.divIcon({
        className: 'custom-cp-marker',
        html: `
          <div style="
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: ${cp.color}; 
            color: white; 
            border-radius: 9999px; 
            width: 26px; 
            height: 26px; 
            font-size: 9px; 
            font-weight: 800; 
            border: 2px solid #ffffff; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            ${cp.status === 'ACTIVE' || cp.status === 'OPTIMAL' ? 'ring: 3px solid #087ef5; animation: pulse 2s infinite;' : ''}
          ">
            ${cp.id.replace('CP-0', '').replace('BP-0', '')}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      })

      const cpMarker = L.marker(cp.coords as [number, number], { icon: cpDiv }).addTo(map)
      
      cpMarker.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px 4px;">
          <div style="font-weight: 800; color: #1d1d1f; border-bottom: 1px solid #e5e5e7; padding-bottom: 3px; margin-bottom: 3px;">
            ${cp.id}: ${cp.name}
          </div>
          <div style="color: ${activeCorridorMode === 'nominal' ? '#087ef5' : '#34c759'}; font-weight: 600;">
            Covered: ${cp.covered} · Remaining: ${cp.remaining}
          </div>
          <div style="color: #6e6e73; margin-top: 2px;">
            🌊 Swell: <b>${cp.wave}</b> · 💨 Wind: <b>${cp.wind}</b> (${cp.risk} Risk)
          </div>
        </div>
      `, {
        permanent: false,
        direction: 'top',
        className: 'custom-leaflet-tooltip'
      })

      cpMarker.on('click', () => setInspectorOpen(true))
    })

    // 4. Origin & Hub High-Visibility Markers
    const originPin = L.circleMarker(corridor.originCoords, {
      radius: 6,
      fillColor: '#ff3b30',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.95,
    }).addTo(map)

    originPin.bindTooltip(`<b>Origin: ${corridor.originName}</b>`, {
      permanent: false,
      direction: 'top',
      className: 'custom-leaflet-tooltip',
    })
    originPin.on('click', () => setInspectorOpen(true))

    const hubPin = L.circleMarker(corridor.hubCoords, {
      radius: 6,
      fillColor: '#087ef5',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.95,
    }).addTo(map)

    hubPin.bindTooltip(`<b>Transshipment Hub: ${corridor.hubName}</b>`, {
      permanent: false,
      direction: 'top',
      className: 'custom-leaflet-tooltip',
    })
    hubPin.on('click', () => setInspectorOpen(true))

    const destPin = L.circleMarker(corridor.destCoords, {
      radius: 6,
      fillColor: '#1d1d1f',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.95,
    }).addTo(map)

    destPin.bindTooltip(`<b>Destination: ${corridor.destName}</b>`, {
      permanent: false,
      direction: 'top',
      className: 'custom-leaflet-tooltip',
    })
    destPin.on('click', () => setInspectorOpen(true))

    // 5. Uber-Style Moving 3D Vessel Marker along Selected Active Route
    const activeRouteWaypoints = (activeCorridorMode === 'bypass' && corridor.bypassWaypoints)
      ? corridor.waypoints.slice(0, 6).concat(corridor.bypassWaypoints.slice(1))
      : corridor.waypoints

    const initialPos = getInterpolatedVesselPosition(activeRouteWaypoints, vesselProgressRef.current)

    // Custom Full 3D Ship HTML Icon with Realistic Hull, Bridge Tower, Funnels, Wake Ripple & Floating Status Pill
    const createShipIconHtml = (heading: number) => `
      <div class="vessel-marker-root" style="position: relative; width: 72px; height: 96px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <!-- Pulsing Ocean AIS Radar Ring -->
        <div class="vessel-radar-ring"></div>
        <!-- Hydrodynamic V-Formation Ocean Wake -->
        <div class="vessel-wake-trail" style="transform: rotate(${heading}deg);"></div>
        <!-- Full 3D Vessel Hull Graphic -->
        <div class="vessel-hull-3d" style="transform: rotate(${heading}deg); transition: transform 0.15s ease-out; width: 48px; height: 80px; display: flex; align-items: center; justify-content: center;">
          <svg viewBox="0 0 52 86" width="46" height="76" style="filter: drop-shadow(0 8px 16px rgba(0,0,0,0.45));">
            <defs>
              <!-- Hull Metallic Linear Gradient -->
              <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0a2540" />
                <stop offset="25%" stop-color="#087ef5" />
                <stop offset="75%" stop-color="#087ef5" />
                <stop offset="100%" stop-color="#0a2540" />
              </linearGradient>
              <linearGradient id="deckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#2d3436" />
                <stop offset="100%" stop-color="#1e272e" />
              </linearGradient>
              <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#c0392b" />
                <stop offset="50%" stop-color="#e74c3c" />
                <stop offset="100%" stop-color="#962d22" />
              </linearGradient>
            </defs>

            <!-- 1. Outer Anti-Fouling Waterline Red Trim -->
            <path d="M26 2 C32 2, 42 16, 42 34 L42 70 C42 78, 36 84, 26 84 C16 84, 10 78, 10 70 L10 34 C10 16, 20 2, 26 2 Z" fill="#c0392b" opacity="0.9"/>

            <!-- 2. Main Full Ship Hull Body -->
            <path d="M26 4 C31 4, 40 17, 40 34 L40 69 C40 76, 35 82, 26 82 C17 82, 12 76, 12 69 L12 34 C12 17, 21 4, 26 4 Z" fill="url(#hullGrad)" stroke="#ffffff" stroke-width="1.2"/>

            <!-- 3. Cargo Hold Deck Interior Bed -->
            <path d="M26 7 C29.5 7, 37 18, 37 34 L37 67 C37 73, 33 78, 26 78 C19 78, 15 73, 15 67 L15 34 C15 18, 22.5 7, 26 7 Z" fill="url(#deckGrad)"/>

            <!-- 4. Forecastle Bow & Anchor Winch Platform -->
            <path d="M26 7 L32 17 L20 17 Z" fill="#dfe6e9" stroke="#b2bec3" stroke-width="0.5"/>
            <circle cx="26" cy="11" r="1.5" fill="#0984e3"/>
            <circle cx="23" cy="14" r="1" fill="#636e72"/>
            <circle cx="29" cy="14" r="1" fill="#636e72"/>

            <!-- 5. Forward Cargo Bay 1 (Container Stacks: Teal & Orange) -->
            <rect x="17" y="19" width="8.5" height="11" rx="1.2" fill="#00b894" stroke="#ffffff" stroke-width="0.5"/>
            <line x1="17" y1="24.5" x2="25.5" y2="24.5" stroke="#ffffff" stroke-width="0.4" opacity="0.7"/>
            <rect x="26.5" y="19" width="8.5" height="11" rx="1.2" fill="#e17055" stroke="#ffffff" stroke-width="0.5"/>
            <line x1="26.5" y1="24.5" x2="35" y2="24.5" stroke="#ffffff" stroke-width="0.4" opacity="0.7"/>

            <!-- 6. Midship Cargo Bay 2 (Container Stacks: Cobalt & Gold) -->
            <rect x="17" y="32" width="8.5" height="12" rx="1.2" fill="#0984e3" stroke="#ffffff" stroke-width="0.5"/>
            <line x1="17" y1="38" x2="25.5" y2="38" stroke="#ffffff" stroke-width="0.4" opacity="0.7"/>
            <rect x="26.5" y="32" width="8.5" height="12" rx="1.2" fill="#fdcb6e" stroke="#ffffff" stroke-width="0.5"/>
            <line x1="26.5" y1="38" x2="35" y2="38" stroke="#ffffff" stroke-width="0.4" opacity="0.7"/>

            <!-- 7. Aft Cargo Bay 3 (Reefer Containers: Clean White & Emerald) -->
            <rect x="17" y="46" width="8.5" height="11" rx="1.2" fill="#ffffff" stroke="#b2bec3" stroke-width="0.5"/>
            <line x1="17" y1="51.5" x2="25.5" y2="51.5" stroke="#b2bec3" stroke-width="0.4"/>
            <rect x="26.5" y="46" width="8.5" height="11" rx="1.2" fill="#00cec9" stroke="#ffffff" stroke-width="0.5"/>
            <line x1="26.5" y1="51.5" x2="35" y2="51.5" stroke="#ffffff" stroke-width="0.4" opacity="0.7"/>

            <!-- 8. Accommodation Superstructure / Navigation Bridge Tower -->
            <rect x="17" y="59" width="18" height="10" rx="1.5" fill="#ffffff" stroke="#b2bec3" stroke-width="0.7"/>
            <!-- Bridge Windows (Cyan Tinted Panoramic Glass) -->
            <rect x="18.5" y="60" width="15" height="2.5" rx="0.6" fill="#0984e3"/>
            <!-- Bridge Wings -->
            <rect x="15.5" y="60.5" width="21" height="1.6" rx="0.5" fill="#ffffff" stroke="#b2bec3" stroke-width="0.4"/>

            <!-- 9. Twin Marine Exhaust Smokestack Funnels (Red & Black Livery) -->
            <rect x="20.5" y="70" width="4" height="4.5" rx="0.8" fill="url(#funnelGrad)" stroke="#2d3436" stroke-width="0.4"/>
            <rect x="20.5" y="70" width="4" height="1.2" rx="0.3" fill="#2d3436"/>
            <rect x="27.5" y="70" width="4" height="4.5" rx="0.8" fill="url(#funnelGrad)" stroke="#2d3436" stroke-width="0.4"/>
            <rect x="27.5" y="70" width="4" height="1.2" rx="0.3" fill="#2d3436"/>

            <!-- 10. Radar Tower Mast & Navigation Transponder Beacon -->
            <line x1="26" y1="62" x2="26" y2="56" stroke="#2d3436" stroke-width="1"/>
            <circle cx="26" cy="55.5" r="1.5" fill="#e74c3c"/>
            <circle cx="26" cy="55.5" r="0.7" fill="#ffffff"/>

            <!-- 11. Stern Mooring Deck -->
            <circle cx="26" cy="76" r="1.2" fill="#636e72"/>
          </svg>
        </div>
        <!-- Floating Live Vessel Telemetry Badge -->
        <div class="vessel-live-badge">
          <span class="vessel-pulse-dot"></span>
          <span class="vessel-badge-text">🚢 CSCL GLOBE · 18.2 kn</span>
        </div>
      </div>
    `

    const shipDivIcon = L.divIcon({
      html: createShipIconHtml(initialPos.heading),
      className: 'custom-moving-vessel-marker',
      iconSize: [72, 96],
      iconAnchor: [36, 48],
    })

    const shipMarker = L.marker([initialPos.lat, initialPos.lng], {
      icon: shipDivIcon,
      zIndexOffset: 1000,
    }).addTo(map)

    shipMarker.on('click', () => {
      setInspectorOpen(true)
    })

    shipMarkerRef.current = shipMarker

    // Continuous Real-Time Navigation Loop (Uber-style smooth interpolation)
    let lastTime = performance.now()
    const cycleDuration = 32000 // 32 seconds full corridor journey

    const animateVessel = (now: number) => {
      const delta = now - lastTime
      lastTime = now

      // Advance progress smoothly
      vesselProgressRef.current = (vesselProgressRef.current + (delta / cycleDuration)) % 1.0

      const currentPos = getInterpolatedVesselPosition(activeRouteWaypoints, vesselProgressRef.current)

      if (shipMarkerRef.current) {
        shipMarkerRef.current.setLatLng([currentPos.lat, currentPos.lng])

        // Update rotation on inner hull element without remounting DOM
        const el = shipMarkerRef.current.getElement()
        if (el) {
          const hull = el.querySelector('.vessel-hull-3d') as HTMLElement
          const wake = el.querySelector('.vessel-wake-trail') as HTMLElement
          if (hull) hull.style.transform = `rotate(${currentPos.heading}deg)`
          if (wake) wake.style.transform = `rotate(${currentPos.heading}deg)`
        }
      }

      animationFrameRef.current = requestAnimationFrame(animateVessel)
    }

    animationFrameRef.current = requestAnimationFrame(animateVessel)
  }

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn()
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut()
  const handleReset = () => mapInstanceRef.current?.setView([16.0, 98.0], 4)

  return (
    <div className={`relative w-full rounded-[24px] overflow-hidden border border-[#d2d2d7] bg-[#f8fafc] shadow-sm select-none transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-[9999] h-[calc(100vh-2rem)]' : 'h-[620px]'
    }`}>
      
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Global CSS for Leaflet Dotted Flow, 3D Ship & Tooltips */}
      <style jsx global>{`
        .leaflet-container {
          background: #f1f5f9;
          font-family: inherit;
          width: 100% !important;
          height: 100% !important;
        }
        /* Animated flowing dotted sea lines */
        path.leaflet-interactive {
          animation: dashFlow 2s linear infinite;
        }
        @keyframes dashFlow {
          from {
            stroke-dashoffset: 32;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        /* Full 3D Vessel Marker & Hydrodynamic Wake Animations */
        .custom-moving-vessel-marker {
          background: transparent !important;
          border: none !important;
        }
        .vessel-radar-ring {
          position: absolute;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 1.5px solid rgba(8, 126, 245, 0.45);
          background: rgba(8, 126, 245, 0.08);
          animation: radarPing 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        }
        @keyframes radarPing {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          80%, 100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .vessel-wake-trail {
          position: absolute;
          width: 22px;
          height: 42px;
          bottom: 2px;
          border-radius: 0 0 14px 14px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(8, 126, 245, 0.2), transparent);
          opacity: 0.75;
          filter: blur(1px);
          pointer-events: none;
        }
        .vessel-live-badge {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4.5px;
          background: rgba(29, 29, 31, 0.95);
          color: #ffffff;
          padding: 2.5px 8.5px;
          border-radius: 9999px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.04em;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          border: 0.5px solid rgba(255,255,255,0.25);
          pointer-events: none;
          backdrop-filter: blur(8px);
        }
        .vessel-pulse-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #34c759;
          box-shadow: 0 0 6px #34c759;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .custom-leaflet-tooltip {
          background: rgba(29, 29, 31, 0.92) !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 4px 8px !important;
          font-size: 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
          backdrop-filter: blur(12px) !important;
        }
        .custom-leaflet-tooltip::before {
          border-top-color: rgba(29, 29, 31, 0.92) !important;
        }
      `}</style>

      {/* Top Left Floating Inspector Button & Collapsible Card */}
      <div className="absolute top-4 left-4 z-10 max-w-sm">
        {!inspectorOpen ? (
          /* Sleek Collapsed Pill */
          <button
            onClick={() => setInspectorOpen(true)}
            className="flex items-center gap-2.5 rounded-full border border-[#d2d2d7]/90 bg-white/95 px-4 py-2 text-xs font-semibold text-[#1d1d1f] shadow-lg backdrop-blur-xl hover:bg-white active:scale-95 transition cursor-pointer"
          >
            <Navigation className={`size-3.5 ${activeCorridorMode === 'bypass' ? 'text-[#34c759]' : 'text-[#087ef5]'}`} />
            <span>{activeCorridorMode === 'bypass' ? 'Plan B: Southern Bypass (Optimal)' : selectedCorridor.name}</span>
            <span className={`flow-badge ${activeCorridorMode === 'bypass' ? 'bg-[#e8f8ed] text-[#34c759]' : 'bg-[#ffebe8] text-[#ff3b30]'}`}>
              {activeCorridorMode === 'bypass' ? '96 Safety Score' : `${selectedCorridor.riskFactor}% Risk`}
            </span>
            <ChevronDown className="size-3.5 text-[#86868b]" />
          </button>
        ) : (
          /* Expanded Floating Telemetry Card */
          <div className="rounded-2xl border border-[#d2d2d7]/80 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Navigation className={`size-4 ${activeCorridorMode === 'bypass' ? 'text-[#34c759]' : 'text-[#087ef5]'}`} />
                <span className={`flow-label ${activeCorridorMode === 'bypass' ? 'text-[#34c759]' : 'text-[#087ef5]'}`}>
                  {activeCorridorMode === 'bypass' ? 'OR-TOOLS OPTIMAL RECOVERY PLAN' : 'ACTIVE MARITIME CORRIDOR'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flow-badge ${activeCorridorMode === 'bypass' ? 'bg-[#e8f8ed] text-[#34c759]' : 'bg-[#ffebe8] text-[#ff3b30]'}`}>
                  {activeCorridorMode === 'bypass' ? 'SAFE · LOSS REDUCED 63%' : `${selectedCorridor.riskFactor}% RISK · CRITICAL`}
                </span>
                <button 
                  onClick={() => setInspectorOpen(false)}
                  className="rounded-full p-1 text-[#86868b] hover:bg-[#f5f5f7] transition cursor-pointer"
                  title="Collapse Panel"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#1d1d1f]">
                {activeCorridorMode === 'bypass' 
                  ? 'Plan B: Southern Weather Bypass (OR-Tools CP-SAT)' 
                  : selectedCorridor.name}
              </h4>
              <p className="text-[11px] text-[#6e6e73] font-medium mt-0.5">{selectedCorridor.vessel}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] bg-[#fafaf9] p-2.5 rounded-xl border border-[#e5e5e7]">
                <div>
                  <span className="text-[#86868b] uppercase text-[8px]">Live Speed / Course</span>
                  <p className="font-mono font-bold text-[#1d1d1f]">
                    {activeCorridorMode === 'bypass' ? '16.0 kn · 035° NE' : `${selectedCorridor.speed} · ${selectedCorridor.heading}`}
                  </p>
                </div>
                <div>
                  <span className="text-[#86868b] uppercase text-[8px]">
                    {activeCorridorMode === 'bypass' ? 'Net Savings / ETA' : 'ETA Arrival Slip'}
                  </span>
                  <p className={`font-mono font-bold ${activeCorridorMode === 'bypass' ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                    {activeCorridorMode === 'bypass' ? '+$42,000 USD (Nov 24)' : selectedCorridor.eta}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-[#6e6e73] mt-2 line-clamp-1">
                <strong>Strategy:</strong> {activeCorridorMode === 'bypass' 
                  ? 'Deviates 320 NM south of typhoon swell window to avoid hull stress.' 
                  : selectedCorridor.cargo}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#f0f0f2] flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveCorridorMode(m => m === 'nominal' ? 'bypass' : 'nominal')}
                  className="font-semibold text-[#087ef5] hover:underline cursor-pointer"
                >
                  Switch to {activeCorridorMode === 'nominal' ? 'Optimal Bypass' : 'Nominal Path'}
                </button>
              </div>
              <button
                onClick={() => setInspectorOpen(false)}
                className="font-medium text-[#6e6e73] hover:text-[#1d1d1f] cursor-pointer"
              >
                Collapse ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Right Map Control Buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => setIsFullscreen(v => !v)}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          className="size-8 flex items-center justify-center rounded-xl bg-white/90 border border-[#d2d2d7] text-[#1d1d1f] shadow-md hover:bg-[#f5f5f7] transition backdrop-blur-md active:scale-95"
        >
          {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5 text-[#087ef5]" />}
        </button>
        <button
          onClick={handleZoomIn}
          title="Zoom in"
          className="size-8 flex items-center justify-center rounded-xl bg-white/90 border border-[#d2d2d7] text-[#1d1d1f] shadow-md hover:bg-[#f5f5f7] transition backdrop-blur-md active:scale-95"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom out"
          className="size-8 flex items-center justify-center rounded-xl bg-white/90 border border-[#d2d2d7] text-[#1d1d1f] shadow-md hover:bg-[#f5f5f7] transition backdrop-blur-md active:scale-95"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset map view"
          className="size-8 flex items-center justify-center rounded-xl bg-white/90 border border-[#d2d2d7] text-[#1d1d1f] shadow-md hover:bg-[#f5f5f7] transition backdrop-blur-md active:scale-95"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      {/* Bottom Floating Interactive Path Legend Selector */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-2xl border border-[#d2d2d7]/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl text-[10px] z-10">
        <button
          onClick={() => setActiveCorridorMode('nominal')}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-semibold transition cursor-pointer ${
            activeCorridorMode === 'nominal'
              ? 'bg-[#ffebe8] text-[#ff3b30] border border-[#ffc2be] shadow-xs'
              : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
          }`}
        >
          <span className="inline-block w-4 h-0.5 border-b-2 border-dashed border-[#ff3b30]" />
          <span>Nominal Path (Storm Disrupted)</span>
          {activeCorridorMode === 'nominal' && (
            <span className="size-1.5 rounded-full bg-[#ff3b30] animate-pulse" />
          )}
        </button>

        <span className="text-[#d2d2d7]">|</span>

        <button
          onClick={() => setActiveCorridorMode('bypass')}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-semibold transition cursor-pointer ${
            activeCorridorMode === 'bypass'
              ? 'bg-[#e8f8ed] text-[#34c759] border border-[#b7ebc7] shadow-xs'
              : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
          }`}
        >
          <span className="inline-block w-4 h-0.5 border-b-2 border-dashed border-[#34c759]" />
          <span>OR-Tools Optimal Bypass (Safe)</span>
          {activeCorridorMode === 'bypass' && (
            <span className="size-1.5 rounded-full bg-[#34c759] animate-pulse" />
          )}
        </button>
      </div>

    </div>
  )
}
