'use client'

import React, { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { 
  Navigation, Ship, ShieldCheck, AlertTriangle, CheckCircle2, 
  Layers, ZoomIn, ZoomOut, RotateCcw, MapPin, Waves, Compass,
  ChevronDown, ChevronUp, X, Maximize2, Minimize2, Sparkles, Check,
  CloudRain, ShieldAlert, Anchor, Activity
} from 'lucide-react'
import { AnalysisResult } from '@/lib/types'
import { getPortCoordinates, generateNauticalWaypoints } from '@/lib/nauticalRoutes'
import seaRoutesData from '@/lib/searoutes.json'
import { getMaritimeRiskZones, type MaritimeRiskZone } from '@/lib/api'
import { MAP_CONFIG, MARITIME_CORRIDORS } from '@/lib/config'

export interface GlobalMapProps {
  result?: AnalysisResult
  origin?: string
  hub?: string
  destination?: string
  vesselName?: string
  waypoints?: [number, number][]
  bypassWaypoints?: [number, number][]
  riskFactor?: number
  speed?: string
}

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
  name: `${MARITIME_CORRIDORS.ORIGIN.name} ➔ ${MARITIME_CORRIDORS.TRANSSHIPMENT.name} ➔ ${MARITIME_CORRIDORS.DESTINATION.name}`,
  vessel: 'CSCL Globe Supermax / CMA CGM Jacques Saadé',
  originName: MARITIME_CORRIDORS.ORIGIN.name,
  hubName: MARITIME_CORRIDORS.TRANSSHIPMENT.name,
  destName: MARITIME_CORRIDORS.DESTINATION.name,
  originCoords: MARITIME_CORRIDORS.ORIGIN.coords,
  hubCoords: MARITIME_CORRIDORS.TRANSSHIPMENT.coords,
  destCoords: MARITIME_CORRIDORS.DESTINATION.coords,
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

export default function GlobalMap({
  result,
  origin,
  hub,
  destination,
  vesselName,
  waypoints,
  bypassWaypoints,
  riskFactor,
  speed,
}: GlobalMapProps = {}) {
  const originName = origin || result?.scenarioInput.origin || MARITIME_CORRIDORS.ORIGIN.name
  const hubName = hub || result?.scenarioInput.transshipmentHub || MARITIME_CORRIDORS.TRANSSHIPMENT.name
  const destName = destination || result?.scenarioInput.destination || MARITIME_CORRIDORS.DESTINATION.name
  const vessel = vesselName || result?.scenarioInput.vesselName || 'CSCL Globe Supermax'

  const originCoords = getPortCoordinates(originName, MARITIME_CORRIDORS.ORIGIN.coords)
  const hubCoords = getPortCoordinates(hubName, MARITIME_CORRIDORS.TRANSSHIPMENT.coords)
  const destCoords = getPortCoordinates(destName, MARITIME_CORRIDORS.DESTINATION.coords)

  const nominalWaypoints = waypoints || generateNauticalWaypoints(originName, hubName, destName, false)
  const dynamicBypassWaypoints = bypassWaypoints || generateNauticalWaypoints(originName, hubName, destName, true)

  const dynamicCorridor: RouteDetail = {
    id: result?.id || 'COR-01',
    name: result?.affectedCorridor || `${originName} ➔ ${hubName} ➔ ${destName}`,
    vessel: vessel,
    originName,
    hubName,
    destName,
    originCoords,
    hubCoords,
    destCoords,
    waypoints: nominalWaypoints,
    bypassWaypoints: dynamicBypassWaypoints,
    status: (result?.riskLevel as any) || 'critical',
    speed: speed || (result?.scenarioInput ? `${result.scenarioInput.currentSpeedKnots} kn` : '18.2 kn'),
    heading: '065° ENE',
    eta: result ? `+${result.predictedDelayDays}d slip` : 'Nov 26, 2026 (+4.2d)',
    riskFactor: riskFactor ?? result?.disruptionProbability ?? 82,
    cargo: result ? `Cargo manifest value $${(result.scenarioInput.costRules.cargoValueUsd / 1000000).toFixed(1)}M` : 'Automotive ECUs & Battery Packs ($35.2M)',
    color: '#ff3b30',
  }

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const shipMarkerRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const vesselProgressRef = useRef<number>(0.24) // Start along Indian Ocean
  const [selectedCorridor, setSelectedCorridor] = useState<RouteDetail>(dynamicCorridor)
  const [showBypass, setShowBypass] = useState<boolean>(true)
  const [showWeather, setShowWeather] = useState<boolean>(true)
  const [showGeopolitical, setShowGeopolitical] = useState<boolean>(true)
  const [showCongestion, setShowCongestion] = useState<boolean>(true)
  const [riskZones, setRiskZones] = useState<MaritimeRiskZone[]>([])
  const [selectedZone, setSelectedZone] = useState<MaritimeRiskZone | null>(null)
  const [isMapReady, setIsMapReady] = useState<boolean>(false)
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  useEffect(() => {
    setSelectedCorridor(dynamicCorridor)
  }, [result, origin, hub, destination, vesselName])

  // Fetch real-time maritime risk & disruption zones from backend API
  useEffect(() => {
    let active = true
    getMaritimeRiskZones()
      .then(res => {
        if (active && res && res.zones) {
          setRiskZones(res.zones)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

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

      // Initialize Leaflet Map framed on the Mumbai -> Singapore -> Yokohama Corridor
      map = L.map(mapContainerRef.current, {
        center: MAP_CONFIG.DEFAULT_CENTER,
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        zoomControl: false,
        attributionControl: false,
      })

      if (isCancelled) {
        try {
          map.remove()
        } catch {}
        return
      }

      // Add high-resolution light CartoDB Positron tile layer from config
      L.tileLayer(MAP_CONFIG.TILE_URL, {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      setIsMapReady(true)
      renderCorridors(L, map)
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

  // Re-render routes when layer toggles, risk zones, or map ready status change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    const render = async () => {
      const L = (await import('leaflet')).default
      renderCorridors(L, mapInstanceRef.current)
    }
    render()
  }, [showBypass, showWeather, showGeopolitical, showCongestion, isMapReady, riskZones])

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
      if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    // 1. Render Dynamic Operational Risk & Disruption Layers (Underneath routes & ship marker)
    if (riskZones.length > 0) {
      riskZones.forEach(zone => {
        // A. Weather / Sea-State Swell Risk Zones
        if (zone.type === 'weather' && showWeather && zone.polygon) {
          const poly = L.polygon(zone.polygon, {
            color: zone.severity === 'CRITICAL' ? '#0284c7' : '#0ea5e9',
            fillColor: '#38bdf8',
            fillOpacity: 0.22,
            weight: 1.5,
            dashArray: '5, 5',
            className: 'risk-zone-weather-polygon',
          }).addTo(map)

          poly.bindTooltip(`<b>🌊 ${zone.name}</b><br/>${zone.description}`, {
            direction: 'top',
            className: 'custom-leaflet-tooltip',
          })
          poly.on('click', () => {
            setSelectedZone(zone)
            setInspectorOpen(true)
          })
        }

        // B. Geopolitical & Chokepoint Security Risk Zones
        if (zone.type === 'geopolitical' && showGeopolitical && zone.polygon) {
          const poly = L.polygon(zone.polygon, {
            color: '#e11d48',
            fillColor: '#f43f5e',
            fillOpacity: 0.24,
            weight: 1.5,
            dashArray: '4, 6',
            className: 'risk-zone-geo-polygon',
          }).addTo(map)

          poly.bindTooltip(`<b>🛡️ ${zone.name}</b><br/>${zone.description}`, {
            direction: 'top',
            className: 'custom-leaflet-tooltip',
          })
          poly.on('click', () => {
            setSelectedZone(zone)
            setInspectorOpen(true)
          })
        }

        // C. Port Congestion & Bottleneck Rings
        if (zone.type === 'congestion' && showCongestion && zone.center) {
          const circle = L.circle(zone.center, {
            radius: (zone.radius_km || 35) * 1000,
            color: zone.severity === 'HIGH' ? '#f59e0b' : '#eab308',
            fillColor: '#f59e0b',
            fillOpacity: 0.22,
            weight: 1.5,
            dashArray: '3, 4',
          }).addTo(map)

          circle.bindTooltip(`<b>⚓ ${zone.name}</b><br/>${zone.description}`, {
            direction: 'top',
            className: 'custom-leaflet-tooltip',
          })
          circle.on('click', () => {
            setSelectedZone(zone)
            setInspectorOpen(true)
          })
        }
      })
    }

    const corridor = dynamicCorridor

    // 2. Standard Commercial Route Polyline (Nominal Mumbai -> Singapore -> Yokohama)
    const line = L.polyline(corridor.waypoints, {
      color: corridor.color,
      weight: 3.5,
      opacity: 0.9,
      dashArray: '7, 9',
      lineCap: 'round',
      lineJoin: 'round',
      className: 'corridor-line-nominal',
    }).addTo(map)

    line.on('click', () => {
      setSelectedZone(null)
      setInspectorOpen(true)
    })

    // 3. Scenario B Southern Bypass Path (OR-Tools CP-SAT Typhoon Swell Bypass)
    if (corridor.bypassWaypoints && showBypass) {
      const bypassLine = L.polyline(corridor.bypassWaypoints, {
        color: '#34c759',
        weight: 3.5,
        opacity: 0.95,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'corridor-line-bypass',
      }).addTo(map)

      bypassLine.on('click', () => {
        setSelectedZone(null)
        setInspectorOpen(true)
      })
    }

    // 4. Origin Pin (Mumbai JNPT)
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

    // 4. Transshipment Hub Pin (Singapore Tuas)
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

    // 5. Destination Pin (Port of Yokohama)
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

    // 6. Uber-Style Moving 3D Vessel Marker along Active Route
    const activeRouteWaypoints = (showBypass && corridor.bypassWaypoints)
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
            className="flex items-center gap-2.5 rounded-full border border-[#d2d2d7]/90 bg-white/95 px-4 py-2 text-xs font-semibold text-[#1d1d1f] shadow-lg backdrop-blur-xl hover:bg-white active:scale-95 transition"
          >
            <Navigation className="size-3.5 text-[#087ef5]" />
            <span>{selectedZone ? selectedZone.name : selectedCorridor.name}</span>
            <span className={`flow-badge ${selectedZone ? 'bg-[#fff4e5] text-[#b45309]' : 'bg-[#ffebe8] text-[#ff3b30]'}`}>
              {selectedZone ? `${selectedZone.severity} RISK` : `${selectedCorridor.riskFactor}% Risk`}
            </span>
            <ChevronDown className="size-3.5 text-[#86868b]" />
          </button>
        ) : selectedZone ? (
          /* Zone Risk Inspector Card */
          <div className="rounded-2xl border border-[#d2d2d7]/80 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-2 mb-3">
              <div className="flex items-center gap-2">
                {selectedZone.type === 'weather' && <CloudRain className="size-4 text-[#0284c7]" />}
                {selectedZone.type === 'geopolitical' && <ShieldAlert className="size-4 text-[#e11d48]" />}
                {selectedZone.type === 'congestion' && <Anchor className="size-4 text-[#f59e0b]" />}
                <span className="flow-label text-[#1d1d1f] uppercase">
                  {selectedZone.type} RISK ZONE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flow-badge ${
                  selectedZone.severity === 'CRITICAL' ? 'bg-[#ffebe8] text-[#ff3b30]' : 'bg-[#fff4e5] text-[#b45309]'
                }`}>
                  {selectedZone.severity} SEVERITY
                </span>
                <button 
                  onClick={() => { setSelectedZone(null); setInspectorOpen(false); }}
                  className="rounded-full p-1 text-[#86868b] hover:bg-[#f5f5f7] transition"
                  title="Close Inspector"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#1d1d1f]">{selectedZone.name}</h4>
              <p className="text-[11px] text-[#4b5563] mt-1 leading-relaxed">{selectedZone.description}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] bg-[#fafaf9] p-2.5 rounded-xl border border-[#e5e5e7]">
                {selectedZone.metrics.map(m => (
                  <div key={m.label}>
                    <span className="text-[#86868b] uppercase text-[8px]">{m.label}</span>
                    <p className="font-mono font-bold text-[#1d1d1f]">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[9px] text-[#9ca3af]">
                <span>Telemetry: <strong className="text-[#4b5563]">{selectedZone.source}</strong></span>
                <span className="font-mono text-[#34c759] flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#34c759] inline-block"></span> LIVE
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#f0f0f2] flex items-center justify-between">
              <button
                onClick={() => setSelectedZone(null)}
                className="text-[10px] font-semibold text-[#087ef5] hover:underline"
              >
                ← View Active Corridor
              </button>
              <button
                onClick={() => { setSelectedZone(null); setInspectorOpen(false); }}
                className="text-[10px] font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
              >
                Close ✕
              </button>
            </div>
          </div>
        ) : (
          /* Expanded Floating Corridor Telemetry Card */
          <div className="rounded-2xl border border-[#d2d2d7]/80 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="size-4 text-[#087ef5]" />
                <span className="flow-label text-[#087ef5]">
                  ACTIVE MARITIME CORRIDOR
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flow-badge bg-[#ffebe8] text-[#ff3b30]">
                  {selectedCorridor.riskFactor}% RISK · CRITICAL
                </span>
                <button 
                  onClick={() => setInspectorOpen(false)}
                  className="rounded-full p-1 text-[#86868b] hover:bg-[#f5f5f7] transition"
                  title="Collapse Panel"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#1d1d1f]">{selectedCorridor.name}</h4>
              <p className="text-[11px] text-[#6e6e73] font-medium mt-0.5">{selectedCorridor.vessel}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] bg-[#fafaf9] p-2.5 rounded-xl border border-[#e5e5e7]">
                <div>
                  <span className="text-[#86868b] uppercase text-[8px]">Live Speed / Course</span>
                  <p className="font-mono font-bold text-[#1d1d1f]">{selectedCorridor.speed} · {selectedCorridor.heading}</p>
                </div>
                <div>
                  <span className="text-[#86868b] uppercase text-[8px]">ETA Arrival Slip</span>
                  <p className="font-mono font-bold text-[#ff3b30]">
                    {selectedCorridor.eta}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-[#6e6e73] mt-2 line-clamp-1">
                <strong>Cargo:</strong> {selectedCorridor.cargo}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#f0f0f2] flex items-center justify-between">
              <button
                onClick={() => setShowBypass(v => !v)}
                className="text-[10px] font-semibold text-[#34c759] flex items-center gap-1 hover:underline"
              >
                <Layers className="size-3" />
                {showBypass ? 'Hide Southern Bypass Path' : 'Show Southern Bypass Path (+$42K)'}
              </button>
              <button
                onClick={() => setInspectorOpen(false)}
                className="text-[10px] font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
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

      {/* Bottom Floating Operational Toolbar & Legend (Non-overlapping container) */}
      <div className="absolute bottom-4 inset-x-4 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none z-10">
        {/* Left: Risk Layer Toggles */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#d2d2d7]/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl text-[10px]">
          <span className="px-2 font-semibold text-[#86868b] uppercase text-[8px] tracking-wider flex items-center gap-1">
            <Layers className="size-3 text-[#087ef5]" /> Risk Layers:
          </span>

          {/* Weather Layer Toggle */}
          <button
            onClick={() => setShowWeather(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-medium transition ${
              showWeather ? 'bg-[#0284c7]/15 text-[#0369a1] border border-[#0284c7]/30' : 'bg-transparent text-[#9ca3af] hover:text-[#4b5563]'
            }`}
          >
            <CloudRain className="size-3" />
            <span>Weather Swell</span>
          </button>

          {/* Geopolitical Layer Toggle */}
          <button
            onClick={() => setShowGeopolitical(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-medium transition ${
              showGeopolitical ? 'bg-[#e11d48]/15 text-[#be123c] border border-[#e11d48]/30' : 'bg-transparent text-[#9ca3af] hover:text-[#4b5563]'
            }`}
          >
            <ShieldAlert className="size-3" />
            <span>Geopolitics</span>
          </button>

          {/* Port Congestion Toggle */}
          <button
            onClick={() => setShowCongestion(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-medium transition ${
              showCongestion ? 'bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30' : 'bg-transparent text-[#9ca3af] hover:text-[#4b5563]'
            }`}
          >
            <Anchor className="size-3" />
            <span>Port Congestion</span>
          </button>

          {/* Bypass Route Toggle */}
          <button
            onClick={() => setShowBypass(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-medium transition ${
              showBypass ? 'bg-[#34c759]/15 text-[#15803d] border border-[#34c759]/30' : 'bg-transparent text-[#9ca3af] hover:text-[#4b5563]'
            }`}
          >
            <Activity className="size-3" />
            <span>Bypass Route</span>
          </button>
        </div>

        {/* Right: Route Legend */}
        <div className="pointer-events-auto hidden xl:flex items-center gap-2 rounded-xl border border-[#d2d2d7]/80 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-xl text-[10px]">
          <span className="flex items-center gap-1.5 font-medium text-[#1d1d1f]">
            <span className="inline-block w-3.5 h-0.5 border-b-2 border-dashed border-[#ff3b30]" /> Nominal Voyage
          </span>
          <span className="text-[#d2d2d7]">|</span>
          <span className="flex items-center gap-1.5 font-medium text-[#34c759]">
            <span className="inline-block w-3.5 h-0.5 border-b-2 border-dashed border-[#34c759]" /> Southern Bypass
          </span>
        </div>
      </div>

    </div>
  )
}
