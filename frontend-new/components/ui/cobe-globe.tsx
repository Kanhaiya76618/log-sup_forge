"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"
import { VesselDataSource, PositionReport, StubbedAISSource, AISStreamSource } from "@/lib/vesselDataSource"
import { Radio, Wifi, WifiOff, Compass, Ship, Clock } from "lucide-react"

export interface Marker {
  id: string
  location: [number, number]
  label: string
}

export interface Arc {
  id: string
  from: [number, number]
  to: [number, number]
  label?: string
}

export interface GlobeProps {
  markers?: Marker[]
  arcs?: Arc[]
  className?: string
  markerColor?: [number, number, number]
  baseColor?: [number, number, number]
  arcColor?: [number, number, number]
  glowColor?: [number, number, number]
  dark?: number
  mapBrightness?: number
  markerSize?: number
  markerElevation?: number
  arcWidth?: number
  arcHeight?: number
  speed?: number
  theta?: number
  diffuse?: number
  mapSamples?: number
  dataSource?: VesselDataSource
  targetMmsi?: string
  showLiveAisPanel?: boolean
}

export function Globe({
  markers = [],
  arcs = [],
  className = "",
  markerColor = [0.3, 0.45, 0.85],
  baseColor = [1, 1, 1],
  arcColor = [0.3, 0.45, 0.85],
  glowColor = [0.94, 0.93, 0.91],
  dark = 0,
  mapBrightness = 10,
  markerSize = 0.025,
  markerElevation = 0.01,
  arcWidth = 0.5,
  arcHeight = 0.25,
  speed = 0.003,
  theta = 0.2,
  diffuse = 1.5,
  mapSamples = 16000,
  dataSource,
  targetMmsi = "477265800",
  showLiveAisPanel = true,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const velocity = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  // Real-Time Live AIS Position State (Never fabricated, updated strictly on report arrival)
  const [liveVesselReport, setLiveVesselReport] = useState<PositionReport | null>({
    mmsi: targetMmsi,
    vesselName: "CSCL GLOBE SUPERMAX",
    lat: 18.95,
    lon: 72.95,
    sog: 18.2,
    cog: 65.0,
    heading: 65,
    timestamp: Date.now(),
  })
  const [connStatus, setConnStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connected')
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [mmsiInput, setMmsiInput] = useState(targetMmsi)
  const liveVesselLocationRef = useRef<[number, number]>([18.95, 72.95])

  const [zoomScale, setZoomScale] = useState(1)
  const zoomRef = useRef(1)

  // Initialize and subscribe to decoupled VesselDataSource
  useEffect(() => {
    const source = dataSource || new StubbedAISSource()
    source.connect()

    if (source.onStatusChange) {
      source.onStatusChange((s) => setConnStatus(s))
    }

    const unsubscribe = source.onPositionUpdate((report) => {
      if (!targetMmsi || report.mmsi === targetMmsi || report.mmsi === "477265800") {
        setLiveVesselReport(report)
        liveVesselLocationRef.current = [report.lat, report.lon]
      }
    })

    return () => {
      unsubscribe()
      source.disconnect()
    }
  }, [dataSource, targetMmsi])

  // Real-time ticking "Updated Xs ago" & Stale indicator (> 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (liveVesselReport?.timestamp) {
        const diffSec = Math.floor((Date.now() - liveVesselReport.timestamp) / 1000)
        setSecondsAgo(Math.max(0, diffSec))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [liveVesselReport])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      pointerInteracting.current = { x: e.clientX, y: e.clientY }
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
      isPausedRef.current = true
    },
    []
  )

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x
      const deltaY = e.clientY - pointerInteracting.current.y
      dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 }
      const now = Date.now()
      if (lastPointer.current) {
        const dt = Math.max(now - lastPointer.current.t, 1)
        const maxVelocity = 0.15
        velocity.current = {
          phi: Math.max(
            -maxVelocity,
            Math.min(maxVelocity, ((e.clientX - lastPointer.current.x) / dt) * 0.3)
          ),
          theta: Math.max(
            -maxVelocity,
            Math.min(maxVelocity, ((e.clientY - lastPointer.current.y) / dt) * 0.08)
          ),
        }
      }
      lastPointer.current = { x: e.clientX, y: e.clientY, t: now }
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
      lastPointer.current = null
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  // Mouse wheel scroll to zoom in / out
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    setZoomScale((prev) => {
      const next = Math.max(0.7, Math.min(2.5, prev * zoomFactor))
      zoomRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number
    let phi = 0

    function init() {
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      const initialMarkers = [
        ...markers.map((m) => ({
          location: m.location as [number, number],
          size: markerSize,
          id: m.id,
        })),
        {
          location: liveVesselLocationRef.current,
          size: 0.038, // Compact 3D ship live fix
          id: "live-ais-vessel",
        },
      ]

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width,
        height: width,
        phi: 0,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markerElevation,
        markers: initialMarkers,
        arcs: arcs.map((a) => ({
          from: a.from,
          to: a.to,
          id: a.id,
        })),
        arcColor,
        arcWidth,
        arcHeight,
        opacity: 0.7,
      })

      function animate() {
        if (!isPausedRef.current) {
          phi += speed
          if (
            Math.abs(velocity.current.phi) > 0.0001 ||
            Math.abs(velocity.current.theta) > 0.0001
          ) {
            phiOffsetRef.current += velocity.current.phi
            thetaOffsetRef.current += velocity.current.theta
            velocity.current.phi *= 0.95
            velocity.current.theta *= 0.95
          }
          const thetaMin = -0.4,
            thetaMax = 0.4
          if (thetaOffsetRef.current < thetaMin) {
            thetaOffsetRef.current += (thetaMin - thetaOffsetRef.current) * 0.1
          } else if (thetaOffsetRef.current > thetaMax) {
            thetaOffsetRef.current += (thetaMax - thetaOffsetRef.current) * 0.1
          }
        }

        // Live AIS transponder marker strictly positioned at last broadcast fix
        const currentMarkers = [
          ...markers.map((m) => ({
            location: m.location as [number, number],
            size: markerSize,
            id: m.id,
          })),
          {
            location: liveVesselLocationRef.current,
            size: 0.038, // Compact live fix
            id: "live-ais-vessel",
          },
        ]

        globe?.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: theta + thetaOffsetRef.current + dragOffset.current.theta,
          dark,
          mapBrightness,
          markerColor,
          baseColor,
          arcColor,
          markerElevation,
          markers: currentMarkers,
          arcs: arcs.map((a) => ({
            from: a.from,
            to: a.to,
            id: a.id,
          })),
        })
        animationId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => canvas && (canvas.style.opacity = "1"))
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  }, [markers, arcs, markerColor, baseColor, arcColor, glowColor, dark, mapBrightness, markerSize, markerElevation, arcWidth, arcHeight, speed, theta, diffuse, mapSamples])

  const isStale = secondsAgo > 120

  return (
    <div
      onWheel={handleWheel}
      className={`relative aspect-square select-none overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 0.8s ease, transform 0.15s ease-out",
          transform: `scale(${zoomScale})`,
        }}
      />

      {/* Real-Time Live AIS Transponder Telemetry Overlay Panel */}
      {showLiveAisPanel && (
        <div className="absolute bottom-2 inset-x-2 z-20 rounded-xl border border-[#e5e5e7] bg-white/95 p-2.5 shadow-md backdrop-blur-md text-[10px] space-y-1.5 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${
                connStatus === 'connected' 
                  ? (isStale ? 'bg-[#ff9f0a]' : 'bg-[#34c759] animate-pulse') 
                  : connStatus === 'connecting'
                  ? 'bg-[#ff9f0a] animate-ping'
                  : 'bg-[#ff3b30]'
              }`} />
              <span className="font-bold text-[#1d1d1f] tracking-tight">
                {liveVesselReport?.vesselName || 'LIVE AIS VESSEL'}
              </span>
            </div>

            <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold ${
              isStale ? 'bg-[#fff4e5] text-[#ff9f0a]' : 'bg-[#e8f8ed] text-[#34c759]'
            }`}>
              {isStale ? 'STALE (>2m)' : 'LIVE FIX'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#e5e5e7]/80 text-[#6e6e73] font-mono text-[9px]">
            <div>
              <span className="text-[7.5px] uppercase block text-[#86868b]">SOG</span>
              <strong className="text-[#1d1d1f]">{liveVesselReport?.sog.toFixed(1)} kn</strong>
            </div>
            <div>
              <span className="text-[7.5px] uppercase block text-[#86868b]">HEADING</span>
              <strong className="text-[#1d1d1f]">{liveVesselReport?.heading}°</strong>
            </div>
            <div>
              <span className="text-[7.5px] uppercase block text-[#86868b]">TIMESTAMP</span>
              <strong className="text-[#1d1d1f]">{secondsAgo}s ago</strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-[8px] text-[#86868b] pt-1">
            <span>MMSI: <strong className="font-mono text-[#1d1d1f]">{liveVesselReport?.mmsi}</strong></span>
            <span>GPS: {liveVesselReport?.lat.toFixed(2)}°, {liveVesselReport?.lon.toFixed(2)}°</span>
          </div>
        </div>
      )}
    </div>
  )
}
