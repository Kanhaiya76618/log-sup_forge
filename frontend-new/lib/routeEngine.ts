/**
 * frontend-new/lib/routeEngine.ts
 *
 * Resolves a maritime route between any two ports:
 *   1. Looks up pre-computed realistic waypoints from ROUTE_TABLE (portRoutes.ts)
 *   2. Falls back to great circle interpolation for port pairs not in the table
 *
 * Great circle fallback generates smooth curved paths across the sphere,
 * producing visually correct ocean arcs without requiring any external API.
 */

import { ROUTE_TABLE, PORT_COORDS } from './portRoutes'
import { GLOBAL_PORTS } from '@/components/scenarios/builder/ShipmentStage'

// ---------------------------------------------------------------------------
// Haversine distance (km) between two lat/lon points
// ---------------------------------------------------------------------------
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ---------------------------------------------------------------------------
// Great circle interpolation — generates N intermediate points on a sphere
// ---------------------------------------------------------------------------
function greatCircleWaypoints(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  numPoints = 18
): [number, number][] {
  const toRad = (d: number) => d * Math.PI / 180
  const toDeg = (r: number) => r * 180 / Math.PI

  const φ1 = toRad(lat1), λ1 = toRad(lon1)
  const φ2 = toRad(lat2), λ2 = toRad(lon2)

  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
  ))

  if (d === 0) return [[lat1, lon1]]

  const points: [number, number][] = []
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
    const z = A * Math.sin(φ1) + B * Math.sin(φ2)
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))
    const lon = toDeg(Math.atan2(y, x))
    points.push([lat, lon])
  }
  return points
}

// ---------------------------------------------------------------------------
// Resolve port coordinates from name
// ---------------------------------------------------------------------------
function coordsForPort(portName: string): [number, number] | null {
  // Check pre-defined PORT_COORDS first
  if (PORT_COORDS[portName]) return PORT_COORDS[portName]
  // Fall back to GLOBAL_PORTS list
  const found = GLOBAL_PORTS.find(p => p.name === portName)
  if (found) {
    // Use approximate coords from the port catalogue
    // These are not precise but good enough for great circle fallback
    return getApproxCoords(found.code)
  }
  return null
}

// Approximate coordinates for global ports not in PORT_COORDS
const APPROX_COORDS: Record<string, [number, number]> = {
  'LKCMB': [6.93,  79.85], 'BDCGP': [22.33,  91.82], 'PKKHI': [24.85,  67.01],
  'MYPKG': [3.00, 101.38], 'MYPTP': [1.36,  103.55], 'THLCH': [13.08, 100.92],
  'VNSGN': [10.78, 106.70],'IDJKT': [-6.10, 106.88], 'PHMNL': [14.59, 120.97],
  'KHSNV': [10.60, 103.52],'JPTYO': [35.62, 139.77], 'JPOSA': [34.66, 135.47],
  'JPUKB': [34.68, 135.19],'JPNGO': [35.02, 136.87], 'CNSHA': [30.63, 122.07],
  'CNSZX': [22.56, 114.10],'CNGZH': [22.59, 113.59], 'CNNGB': [29.87, 121.55],
  'CNTAO': [36.07, 120.38],'CNTSN': [38.98, 117.72], 'KRPUS': [35.10, 129.04],
  'KRINC': [37.45, 126.62],'TWKHH': [22.62, 120.27], 'HKHKG': [22.29, 114.16],
  'AEJEA': [25.01,  55.07],'OMSLL': [17.01,  54.09], 'IRBND': [27.19,  56.27],
  'SAKAP': [22.96,  38.98],'KEMBA': [-4.04,  39.67], 'TZDRS': [-6.81,  39.29],
  'DJJIB': [11.59,  43.14],'EGPSD': [31.26,  32.31], 'GRPIR': [37.94,  23.63],
  'ESALG': [36.13,  -5.45],'ITGOA': [44.41,   8.93], 'ESVLC': [39.45,  -0.34],
  'TRIST': [41.04,  28.98],'NLRTM': [51.92,   4.48], 'BEANR': [51.26,   4.39],
  'DEHAM': [53.55,   9.97],'GBFXT': [51.96,   1.34], 'FRLEH': [49.49,   0.11],
  'DEBRV': [53.55,   8.56],'USNYC': [40.67,  -74.04],'USSAV': [32.09,  -81.10],
  'USLAX': [33.74, -118.27],'USLGB': [33.75, -118.22],'USSEA': [47.60, -122.33],
  'CAVAN': [49.29, -123.11],'BRSSZ': [-23.92,  -46.31],'PECLL': [-12.05,  -77.15],
  'MXZLO': [19.06, -104.32],'PAONX': [9.35,  -79.89], 'AUMEL': [-37.82, 144.92],
  'AUSYD': [-33.87, 151.21],
}

function getApproxCoords(code: string): [number, number] | null {
  return APPROX_COORDS[code] || null
}

// ---------------------------------------------------------------------------
// Main export: resolve a sea route between any two port name strings
// ---------------------------------------------------------------------------
export function resolveRoute(
  originName: string,
  destinationName: string
): [number, number][] {
  const key = `${originName}->${destinationName}`

  // 1. Exact pre-computed route
  if (ROUTE_TABLE[key]) return ROUTE_TABLE[key]

  // 2. Reverse lookup — reverse the reverse route if it exists
  const reverseKey = `${destinationName}->${originName}`
  if (ROUTE_TABLE[reverseKey]) return [...ROUTE_TABLE[reverseKey]].reverse()

  // 3. Great circle fallback
  const originCoords  = coordsForPort(originName)
  const destCoords    = coordsForPort(destinationName)

  if (!originCoords || !destCoords) {
    // Can't resolve at all — return a straight line between 0,0 and destination
    return [[0, 0], [0, 0]]
  }

  const distKm = haversineKm(
    originCoords[0], originCoords[1],
    destCoords[0], destCoords[1]
  )
  // More points for longer routes
  const numPoints = Math.max(8, Math.min(30, Math.floor(distKm / 500)))

  return greatCircleWaypoints(
    originCoords[0], originCoords[1],
    destCoords[0], destCoords[1],
    numPoints
  )
}

// ---------------------------------------------------------------------------
// Get port coordinates for any registered port name
// ---------------------------------------------------------------------------
export function getPortCoords(portName: string): [number, number] | null {
  return coordsForPort(portName)
}

// ---------------------------------------------------------------------------
// Calculate approximate total distance in nautical miles
// ---------------------------------------------------------------------------
export function routeDistanceNm(waypoints: [number, number][]): number {
  let totalKm = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalKm += haversineKm(waypoints[i][0], waypoints[i][1], waypoints[i+1][0], waypoints[i+1][1])
  }
  return Math.round(totalKm * 0.539957) // km → nautical miles
}
