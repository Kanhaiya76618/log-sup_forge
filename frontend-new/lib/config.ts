/**
 * FlowForge Frontend Centralized Configuration & Constants
 * Environment-driven with safe fallbacks and runtime validation.
 */

export const APP_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  DEFAULT_DISRUPTION_THRESHOLD: 0.45,
  POLL_INTERVAL_MS: 3000,
  REQUEST_TIMEOUT_MS: 8000,
  PORT_API_KEY: process.env.NEXT_PUBLIC_PORT_API_KEY || '',
  NEWS_API_KEY: process.env.NEXT_PUBLIC_NEWS_API_KEY || '',
  JAPAN_MSIL_API_KEY: process.env.NEXT_PUBLIC_JAPAN_MSIL_API_KEY || '',
} as const

export const MAP_CONFIG = {
  TILE_URL: process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  DEFAULT_CENTER: [16.0, 98.0] as [number, number],
  DEFAULT_ZOOM: 4,
  MIN_ZOOM: 2,
  MAX_ZOOM: 12,
} as const

export const ASSETS_CONFIG = {
  HERO_VIDEO_SRC: process.env.NEXT_PUBLIC_HERO_VIDEO_SRC || '/0822.mp4',
  PORT_AERIAL_IMAGE: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/container_port_aerial-cfcTcy8nZNAaq4T0zDJ74VhW7yZJcp.webp',
} as const

export const AIS_CONFIG = {
  WS_URL: process.env.NEXT_PUBLIC_AISSTREAM_WS_URL || 'wss://stream.aisstream.io/v0/stream',
  API_KEY: process.env.NEXT_PUBLIC_AISSTREAM_API_KEY || '',
  DEFAULT_MMSI: process.env.NEXT_PUBLIC_DEFAULT_MMSI || '477265800',
  DEFAULT_VESSEL_NAME: 'CSCL GLOBE SUPERMAX',
  DEFAULT_LOCATION: [18.95, 72.95] as [number, number],
  STALE_TIMEOUT_SEC: 120,
  TELEMETRY_INTERVAL_MS: 1500,
} as const

export const MARITIME_CORRIDORS = {
  ORIGIN: { code: 'BOM', name: 'Jawaharlal Nehru Port (Mumbai)', coords: [18.95, 72.95] as [number, number] },
  TRANSSHIPMENT: { code: 'SIN', name: 'Port of Singapore (Tuas)', coords: [1.29, 103.85] as [number, number] },
  DESTINATION: { code: 'YOK', name: 'Port of Yokohama', coords: [35.44, 139.64] as [number, number] },
} as const

export const GLOBE_MARKERS = [
  { id: 'mumbai', location: MARITIME_CORRIDORS.ORIGIN.coords, label: 'Mumbai JNPT (BOM)' },
  { id: 'singapore', location: MARITIME_CORRIDORS.TRANSSHIPMENT.coords, label: 'Singapore Tuas (SIN)' },
  { id: 'yokohama', location: MARITIME_CORRIDORS.DESTINATION.coords, label: 'Port of Yokohama (YOK)' },
]

export const GLOBE_ARCS = [
  { id: 'mumbai-singapore', from: MARITIME_CORRIDORS.ORIGIN.coords, to: MARITIME_CORRIDORS.TRANSSHIPMENT.coords, label: 'Mumbai → Singapore' },
  { id: 'singapore-yokohama', from: MARITIME_CORRIDORS.TRANSSHIPMENT.coords, to: MARITIME_CORRIDORS.DESTINATION.coords, label: 'Singapore → Yokohama' },
]
