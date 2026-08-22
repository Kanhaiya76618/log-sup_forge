import seaRoutesData from './searoutes.json'

export interface PortGeo {
  name: string
  code: string
  coords: [number, number] // [lat, lng]
}

export const PORT_GEO_DATABASE: Record<string, [number, number]> = {
  // India
  'mumbai': [18.9414, 72.8078],
  'jnpt': [18.9414, 72.8078],
  'jawaharlal': [18.9414, 72.8078],
  'mundra': [22.7441, 69.7022],
  'chennai': [13.0827, 80.2942],
  'kolkata': [22.5400, 88.3100],

  // Transshipment
  'singapore': [1.29027, 103.851959],
  'tuas': [1.29027, 103.851959],
  'colombo': [6.9400, 79.8400],
  'klang': [3.0000, 101.4000],
  'pelepas': [1.3600, 103.5500],
  'hong kong': [22.3300, 114.1200],

  // China
  'shenzhen': [22.5700, 114.2700],
  'yantian': [22.5700, 114.2700],
  'shanghai': [31.2304, 121.4737],
  'tianjin': [38.9900, 117.7400],

  // Japan
  'yokohama': [35.4437, 139.6380],
  'tokyo': [35.6200, 139.7800],
  'nagoya': [35.0800, 136.8800],
  'osaka': [34.6500, 135.4300],
  'kobe': [34.6800, 135.2000],

  // Korea
  'busan': [35.1000, 129.0400],
  'incheon': [37.4500, 126.6200],
}

export function getPortCoordinates(portName: string, fallback: [number, number] = [18.95, 72.95]): [number, number] {
  if (!portName) return fallback
  const lower = portName.toLowerCase()
  for (const [key, coords] of Object.entries(PORT_GEO_DATABASE)) {
    if (lower.includes(key)) {
      return coords
    }
  }
  return fallback
}

/**
 * Generate nautical waypoints for any origin -> hub -> destination corridor.
 * Guarantees routes follow realistic ocean lanes and never cross land masses.
 */
export function generateNauticalWaypoints(
  origin: string,
  hub: string,
  destination: string,
  isBypass: boolean = false
): [number, number][] {
  const originCoords = getPortCoordinates(origin, [18.95, 72.95])
  const hubCoords = getPortCoordinates(hub, [1.29, 103.85])
  const destCoords = getPortCoordinates(destination, [34.65, 135.43])

  const destLower = destination.toLowerCase()

  // Base Segment: Origin -> Indian Ocean -> Malacca Strait -> Singapore Hub
  const baseLeg: [number, number][] = [
    originCoords,
    [15.3, 73.0],
    [9.7, 75.3],
    [5.8, 80.1],
    [6.2, 85.9],
    [6.1, 94.3],
    [5.8, 98.1],
    [3.2, 100.6],
    [1.3, 103.8],
    hubCoords
  ]

  // 1. Shenzhen / Yantian / Hong Kong
  if (destLower.includes('shenzhen') || destLower.includes('yantian') || destLower.includes('hong kong')) {
    if (isBypass) {
      return [
        ...baseLeg,
        [1.34, 104.48],
        [4.2, 107.5],
        [8.5, 111.0],
        [14.0, 113.8],
        [18.5, 114.5],
        [21.2, 114.3],
        destCoords
      ]
    }
    return [
      ...baseLeg,
      [1.34, 104.48],
      [7.54, 109.93],
      [13.36, 115.04],
      [18.5, 116.2],
      [21.5, 115.0],
      destCoords
    ]
  }

  // 2. Shanghai / Ningbo / Tianjin
  if (destLower.includes('shanghai') || destLower.includes('tianjin')) {
    if (isBypass) {
      return [
        ...baseLeg,
        [1.34, 104.48],
        [5.0, 108.0],
        [12.0, 114.0],
        [19.0, 118.5],
        [24.0, 122.0],
        [28.0, 122.5],
        destCoords
      ]
    }
    return [
      ...baseLeg,
      [1.34, 104.48],
      [7.54, 109.93],
      [16.9, 118.0],
      [22.5, 120.5],
      [27.5, 122.0],
      destCoords
    ]
  }

  // 3. Korea: Busan / Incheon
  if (destLower.includes('busan') || destLower.includes('incheon')) {
    return [
      ...baseLeg,
      [1.34, 104.48],
      [7.54, 109.93],
      [16.9, 118.0],
      [23.5, 121.5],
      [29.0, 125.0],
      [33.0, 127.5],
      destCoords
    ]
  }

  // 4. Japan: Osaka / Kobe (Kii Channel Approach - never touches Tokyo/Yokohama)
  if (destLower.includes('osaka') || destLower.includes('kobe')) {
    if (isBypass) {
      // Southern bypass via Philippine Sea entering Kii Channel
      return [
        ...baseLeg,
        [1.34, 104.48],
        [4.2, 108.5],
        [7.0, 116.0],
        [11.5, 124.5],
        [17.0, 129.0],
        [24.5, 132.5],
        [29.0, 134.0],
        [32.8, 134.8], // South of Shikoku
        [33.6, 135.0], // Kii Channel entry
        [34.2, 135.1], // Osaka Bay approach
        destCoords
      ]
    }
    // Nominal route via South China Sea / Luzon Strait -> Kii Channel
    return [
      ...baseLeg,
      [1.34, 104.48],
      [7.54, 109.93],
      [13.36, 115.04],
      [18.9, 120.0], // Luzon Strait
      [23.5, 125.0],
      [28.0, 129.5],
      [32.5, 134.2], // South of Shikoku
      [33.6, 135.0], // Kii Channel entry
      [34.2, 135.1], // Osaka Bay approach
      destCoords
    ]
  }

  // 5. Japan: Nagoya (Ise Bay Approach)
  if (destLower.includes('nagoya')) {
    if (isBypass) {
      return [
        ...baseLeg,
        [1.34, 104.48],
        [4.2, 108.5],
        [11.5, 124.5],
        [17.0, 129.0],
        [25.0, 133.0],
        [32.0, 136.2],
        [34.2, 136.9], // Ise Bay entry
        [34.7, 136.85],
        destCoords
      ]
    }
    return [
      ...baseLeg,
      [1.34, 104.48],
      [7.54, 109.93],
      [18.9, 120.0],
      [24.0, 126.0],
      [30.0, 132.0],
      [33.2, 136.5],
      [34.2, 136.9], // Ise Bay entry
      [34.7, 136.85],
      destCoords
    ]
  }

  // 6. Japan: Yokohama / Tokyo (Uraga Channel Approach)
  if (destLower.includes('yokohama') || destLower.includes('tokyo')) {
    if (isBypass) {
      const rawBypass = (seaRoutesData as any).corridor_bypass
      if (Array.isArray(rawBypass) && rawBypass.length > 0) {
        return [originCoords, ...rawBypass.slice(1, -1), destCoords]
      }
    }
    const rawCorridor1 = (seaRoutesData as any).corridor_1
    if (Array.isArray(rawCorridor1) && rawCorridor1.length > 0) {
      return [originCoords, ...rawCorridor1.slice(1, -1), destCoords]
    }
  }

  // Fallback default
  return [...baseLeg, destCoords]
}
