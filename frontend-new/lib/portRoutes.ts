/**
 * frontend-new/lib/portRoutes.ts
 *
 * Pre-computed realistic maritime sea lane waypoints for 9 priority ports:
 *   India:     Mumbai JNPT, Chennai, Mundra
 *   Japan:     Yokohama, Tokyo, Nagoya
 *   Australia: Melbourne, Sydney, Brisbane
 *
 * All waypoints are [lat, lon] tuples navigating through real maritime
 * chokepoints: Malacca Strait, Sunda Strait, Lombok Strait, Luzon Strait,
 * Torres Strait, and the Coral/Tasman Sea basins.
 *
 * Routes are stored bidirectionally. resolveRoute() handles lookups + fallback.
 */

// ---------------------------------------------------------------------------
// Port coordinates (origin/destination anchors)
// ---------------------------------------------------------------------------
export const PORT_COORDS: Record<string, [number, number]> = {
  // India
  'Jawaharlal Nehru Port (Mumbai, IN)': [18.95, 72.95],
  'Chennai Port (IN)':                  [13.08, 80.29],
  'Mundra Port (IN)':                   [22.84, 69.70],
  // Japan
  'Port of Yokohama (JP)':              [35.44, 139.64],
  'Port of Tokyo (JP)':                 [35.62, 139.77],
  'Port of Nagoya (JP)':                [35.02, 136.87],
  // Australia
  'Port of Melbourne (AU)':             [-37.82, 144.92],
  'Port of Sydney (AU)':                [-33.87, 151.21],
  'Port of Brisbane (AU)':              [-27.47, 153.02],
  // Common hubs (for transshipment display)
  'Singapore Tuas Hub (SG)':            [1.29, 103.85],
  'Colombo Port (LK)':                  [6.93, 79.85],
  'Jebel Ali Port (AE)':               [25.01, 55.07],
  'Port Said — Suez Canal Gateway (EG)': [31.26, 32.31],
  'Rotterdam Gateway (NL)':             [51.92, 4.48],
}

// ---------------------------------------------------------------------------
// Named shared maritime passage segments (reused across multiple routes)
// ---------------------------------------------------------------------------

// Mumbai JNPT → Singapore via west coast India + Sri Lanka south + Malacca
const SEG_MUMBAI_TO_SINGAPORE: [number, number][] = [
  [18.95, 72.95],
  [16.50, 73.20],
  [13.50, 74.50],
  [10.50, 75.80],
  [8.00,  76.80],
  [6.50,  79.50],  // Sri Lanka south
  [5.80,  80.55],
  [4.50,  82.00],
  [3.00,  85.00],
  [2.00,  88.50],
  [1.50,  93.00],
  [3.50,  96.50],
  [5.50,  99.50],  // Malacca north entrance
  [4.00, 100.80],
  [2.50, 101.80],
  [1.70, 103.00],
  [1.29, 103.85],  // Singapore
]

// Mundra Port → Singapore via west coast Gujarat → Laccadive Sea → Sri Lanka
const SEG_MUNDRA_TO_SINGAPORE: [number, number][] = [
  [22.84, 69.70],
  [21.00, 70.50],
  [19.00, 71.00],
  [16.50, 73.20],
  [13.50, 74.50],
  [10.50, 75.80],
  [8.00,  76.80],
  [6.50,  79.50],  // Sri Lanka south
  [5.80,  80.55],
  [4.50,  82.00],
  [3.00,  85.00],
  [2.00,  88.50],
  [1.50,  93.00],
  [3.50,  96.50],
  [5.50,  99.50],
  [4.00, 100.80],
  [2.50, 101.80],
  [1.70, 103.00],
  [1.29, 103.85],
]

// Chennai Port → Singapore via Bay of Bengal → Nicobar Islands → Malacca
const SEG_CHENNAI_TO_SINGAPORE: [number, number][] = [
  [13.08, 80.29],
  [10.50, 81.50],
  [8.00,  82.80],
  [6.00,  84.00],
  [4.00,  86.00],
  [2.00,  90.00],
  [0.50,  94.00],
  [2.00,  97.00],
  [4.50,  99.50],  // Malacca north entrance
  [3.50, 100.50],
  [2.50, 101.80],
  [1.70, 103.00],
  [1.29, 103.85],
]

// Singapore → Yokohama via South China Sea → Luzon Strait → East China Sea
const SEG_SINGAPORE_TO_YOKOHAMA: [number, number][] = [
  [1.29, 103.85],
  [4.00, 107.00],
  [7.50, 109.50],  // South China Sea
  [11.00, 113.00],
  [15.00, 116.00],
  [18.50, 119.00],
  [21.50, 121.50],  // Luzon Strait
  [24.50, 123.00],
  [26.50, 127.00],
  [29.50, 132.00],  // East China Sea
  [32.00, 135.50],
  [33.80, 137.50],
  [35.00, 139.00],
  [35.44, 139.64],  // Yokohama
]

// Singapore → Tokyo (same corridor, slightly different endpoint)
const SEG_SINGAPORE_TO_TOKYO: [number, number][] = [
  [1.29, 103.85],
  [4.00, 107.00],
  [7.50, 109.50],
  [11.00, 113.00],
  [15.00, 116.00],
  [18.50, 119.00],
  [21.50, 121.50],
  [24.50, 123.00],
  [26.50, 127.00],
  [29.50, 132.00],
  [32.00, 135.50],
  [33.80, 137.80],
  [35.10, 139.20],
  [35.62, 139.77],  // Tokyo
]

// Singapore → Nagoya via ECS, curves north into Ise Bay
const SEG_SINGAPORE_TO_NAGOYA: [number, number][] = [
  [1.29, 103.85],
  [4.00, 107.00],
  [7.50, 109.50],
  [11.00, 113.00],
  [15.00, 116.00],
  [18.50, 119.00],
  [21.50, 121.50],
  [24.50, 123.00],
  [26.00, 127.00],
  [28.50, 131.00],
  [31.00, 133.50],
  [33.50, 136.00],
  [35.02, 136.87],  // Nagoya
]

// Mumbai → Sunda Strait (Indian Ocean route for Australia-bound vessels)
const SEG_MUMBAI_TO_SUNDA: [number, number][] = [
  [18.95, 72.95],
  [14.00, 73.50],
  [9.00,  75.00],
  [5.00,  79.00],
  [1.00,  82.00],
  [-2.00, 86.00],
  [-4.00, 92.00],
  [-5.50, 99.00],
  [-6.00, 102.00],
  [-6.00, 105.50],  // Sunda Strait
]

// Mundra → Sunda Strait (Indian Ocean)
const SEG_MUNDRA_TO_SUNDA: [number, number][] = [
  [22.84, 69.70],
  [20.00, 70.50],
  [16.00, 72.00],
  [12.00, 73.50],
  [8.00,  75.50],
  [4.00,  79.50],
  [0.00,  83.00],
  [-3.00, 88.00],
  [-5.00, 95.00],
  [-5.80, 101.00],
  [-6.00, 105.50],  // Sunda Strait
]

// Chennai → Sunda Strait via Andaman Sea
const SEG_CHENNAI_TO_SUNDA: [number, number][] = [
  [13.08, 80.29],
  [10.00, 81.50],
  [6.50,  84.00],
  [3.00,  87.00],
  [0.00,  91.00],
  [-2.50, 96.00],
  [-4.50, 100.00],
  [-5.50, 103.00],
  [-6.00, 105.50],  // Sunda Strait
]

// Sunda Strait → Melbourne via Java Sea → Lombok → NW Australia Shelf → Bass Strait
const SEG_SUNDA_TO_MELBOURNE: [number, number][] = [
  [-6.00, 105.50],
  [-7.50, 109.00],
  [-8.80, 115.70],  // Lombok Strait
  [-10.00, 120.00],
  [-12.00, 124.00],
  [-15.00, 128.00],
  [-20.00, 133.00],
  [-26.00, 137.00],
  [-30.00, 140.00],
  [-34.00, 143.00],
  [-37.82, 144.92],  // Melbourne
]

// Sunda Strait → Sydney via Java → Flores → Arafura → Coral Sea
const SEG_SUNDA_TO_SYDNEY: [number, number][] = [
  [-6.00, 105.50],
  [-7.50, 109.00],
  [-8.00, 115.00],
  [-9.00, 121.00],
  [-10.00, 128.00],
  [-11.00, 134.00],
  [-11.50, 140.00],
  [-14.00, 145.00],
  [-18.00, 148.00],
  [-23.00, 151.00],
  [-28.00, 153.00],
  [-33.87, 151.21],  // Sydney
]

// Sunda Strait → Brisbane via Arafura → Torres Strait → Coral Sea
const SEG_SUNDA_TO_BRISBANE: [number, number][] = [
  [-6.00, 105.50],
  [-7.50, 110.00],
  [-8.50, 116.00],
  [-9.50, 122.00],
  [-10.50, 128.00],
  [-10.50, 136.00],
  [-10.50, 142.00],  // Torres Strait
  [-13.00, 146.00],
  [-18.00, 150.00],
  [-23.00, 152.00],
  [-27.47, 153.02],  // Brisbane
]

// Yokohama → Melbourne via Philippine Sea → Coral Sea → Tasman
const SEG_YOKOHAMA_TO_MELBOURNE: [number, number][] = [
  [35.44, 139.64],
  [31.00, 140.00],
  [24.00, 142.00],
  [17.00, 143.00],
  [10.00, 144.00],
  [3.00,  144.50],
  [-5.00, 144.00],
  [-12.00, 144.00],
  [-19.00, 144.00],
  [-25.00, 144.50],
  [-32.00, 145.00],
  [-37.82, 144.92],  // Melbourne
]

// Tokyo → Melbourne (slightly east of Yokohama path)
const SEG_TOKYO_TO_MELBOURNE: [number, number][] = [
  [35.62, 139.77],
  [31.00, 140.50],
  [24.00, 142.00],
  [17.00, 143.00],
  [10.00, 144.00],
  [3.00,  144.50],
  [-5.00, 144.00],
  [-12.00, 144.00],
  [-19.00, 144.00],
  [-25.00, 144.50],
  [-32.00, 145.00],
  [-37.82, 144.92],
]

// Nagoya → Melbourne (via ECS south → Philippine Sea)
const SEG_NAGOYA_TO_MELBOURNE: [number, number][] = [
  [35.02, 136.87],
  [32.00, 135.50],
  [28.00, 136.00],
  [22.00, 140.00],
  [15.00, 142.50],
  [7.00,  143.50],
  [-1.00, 143.50],
  [-10.00, 143.50],
  [-18.00, 143.50],
  [-26.00, 143.50],
  [-32.00, 144.50],
  [-37.82, 144.92],
]

// Yokohama → Sydney via Pacific → Tasman Sea
const SEG_YOKOHAMA_TO_SYDNEY: [number, number][] = [
  [35.44, 139.64],
  [31.00, 141.00],
  [24.00, 144.00],
  [17.00, 147.00],
  [10.00, 149.00],
  [2.00,  150.00],
  [-6.00, 151.00],
  [-14.00, 152.00],
  [-22.00, 153.00],
  [-28.00, 153.00],
  [-33.87, 151.21],  // Sydney
]

// Tokyo → Sydney
const SEG_TOKYO_TO_SYDNEY: [number, number][] = [
  [35.62, 139.77],
  [31.00, 141.00],
  [24.00, 144.50],
  [17.00, 147.50],
  [10.00, 149.50],
  [2.00,  150.50],
  [-6.00, 151.50],
  [-14.00, 152.00],
  [-22.00, 153.00],
  [-28.00, 153.00],
  [-33.87, 151.21],
]

// Nagoya → Sydney
const SEG_NAGOYA_TO_SYDNEY: [number, number][] = [
  [35.02, 136.87],
  [32.00, 137.50],
  [27.00, 140.00],
  [20.00, 143.00],
  [13.00, 147.00],
  [5.00,  149.50],
  [-3.00, 150.50],
  [-12.00, 151.50],
  [-20.00, 152.50],
  [-27.00, 153.00],
  [-33.87, 151.21],
]

// Yokohama → Brisbane via Coral Sea
const SEG_YOKOHAMA_TO_BRISBANE: [number, number][] = [
  [35.44, 139.64],
  [31.00, 141.50],
  [24.00, 145.00],
  [17.00, 148.00],
  [10.00, 150.50],
  [2.00,  152.00],
  [-6.00, 153.00],
  [-14.00, 153.50],
  [-20.00, 153.50],
  [-24.00, 153.50],
  [-27.47, 153.02],  // Brisbane
]

// Tokyo → Brisbane
const SEG_TOKYO_TO_BRISBANE: [number, number][] = [
  [35.62, 139.77],
  [31.00, 141.50],
  [24.00, 145.50],
  [17.00, 148.50],
  [10.00, 151.00],
  [2.00,  152.50],
  [-6.00, 153.00],
  [-14.00, 153.50],
  [-20.00, 153.50],
  [-24.00, 153.50],
  [-27.47, 153.02],
]

// Nagoya → Brisbane
const SEG_NAGOYA_TO_BRISBANE: [number, number][] = [
  [35.02, 136.87],
  [32.00, 138.00],
  [27.00, 141.00],
  [20.00, 144.50],
  [13.00, 148.00],
  [5.00,  151.00],
  [-3.00, 152.00],
  [-12.00, 153.00],
  [-20.00, 153.00],
  [-24.00, 153.00],
  [-27.47, 153.02],
]

// ---------------------------------------------------------------------------
// Helper: join two segments, dropping the duplicate junction point
// ---------------------------------------------------------------------------
function join(a: [number, number][], b: [number, number][]): [number, number][] {
  return [...a, ...b.slice(1)]
}

// ---------------------------------------------------------------------------
// Route lookup table — key: "OriginPortName->DestinationPortName"
// ---------------------------------------------------------------------------
export const ROUTE_TABLE: Record<string, [number, number][]> = {
  // ── India → Japan ────────────────────────────────────────────────────────
  'Jawaharlal Nehru Port (Mumbai, IN)->Port of Yokohama (JP)':
    join(SEG_MUMBAI_TO_SINGAPORE, SEG_SINGAPORE_TO_YOKOHAMA),
  'Jawaharlal Nehru Port (Mumbai, IN)->Port of Tokyo (JP)':
    join(SEG_MUMBAI_TO_SINGAPORE, SEG_SINGAPORE_TO_TOKYO),
  'Jawaharlal Nehru Port (Mumbai, IN)->Port of Nagoya (JP)':
    join(SEG_MUMBAI_TO_SINGAPORE, SEG_SINGAPORE_TO_NAGOYA),

  'Chennai Port (IN)->Port of Yokohama (JP)':
    join(SEG_CHENNAI_TO_SINGAPORE, SEG_SINGAPORE_TO_YOKOHAMA),
  'Chennai Port (IN)->Port of Tokyo (JP)':
    join(SEG_CHENNAI_TO_SINGAPORE, SEG_SINGAPORE_TO_TOKYO),
  'Chennai Port (IN)->Port of Nagoya (JP)':
    join(SEG_CHENNAI_TO_SINGAPORE, SEG_SINGAPORE_TO_NAGOYA),

  'Mundra Port (IN)->Port of Yokohama (JP)':
    join(SEG_MUNDRA_TO_SINGAPORE, SEG_SINGAPORE_TO_YOKOHAMA),
  'Mundra Port (IN)->Port of Tokyo (JP)':
    join(SEG_MUNDRA_TO_SINGAPORE, SEG_SINGAPORE_TO_TOKYO),
  'Mundra Port (IN)->Port of Nagoya (JP)':
    join(SEG_MUNDRA_TO_SINGAPORE, SEG_SINGAPORE_TO_NAGOYA),

  // ── India → Australia ────────────────────────────────────────────────────
  'Jawaharlal Nehru Port (Mumbai, IN)->Port of Melbourne (AU)':
    join(SEG_MUMBAI_TO_SUNDA, SEG_SUNDA_TO_MELBOURNE),
  'Jawaharlal Nehru Port (Mumbai, IN)->Port of Sydney (AU)':
    join(SEG_MUMBAI_TO_SUNDA, SEG_SUNDA_TO_SYDNEY),
  'Jawaharlal Nehru Port (Mumbai, IN)->Port of Brisbane (AU)':
    join(SEG_MUMBAI_TO_SUNDA, SEG_SUNDA_TO_BRISBANE),

  'Chennai Port (IN)->Port of Melbourne (AU)':
    join(SEG_CHENNAI_TO_SUNDA, SEG_SUNDA_TO_MELBOURNE),
  'Chennai Port (IN)->Port of Sydney (AU)':
    join(SEG_CHENNAI_TO_SUNDA, SEG_SUNDA_TO_SYDNEY),
  'Chennai Port (IN)->Port of Brisbane (AU)':
    join(SEG_CHENNAI_TO_SUNDA, SEG_SUNDA_TO_BRISBANE),

  'Mundra Port (IN)->Port of Melbourne (AU)':
    join(SEG_MUNDRA_TO_SUNDA, SEG_SUNDA_TO_MELBOURNE),
  'Mundra Port (IN)->Port of Sydney (AU)':
    join(SEG_MUNDRA_TO_SUNDA, SEG_SUNDA_TO_SYDNEY),
  'Mundra Port (IN)->Port of Brisbane (AU)':
    join(SEG_MUNDRA_TO_SUNDA, SEG_SUNDA_TO_BRISBANE),

  // ── Japan → Australia ────────────────────────────────────────────────────
  'Port of Yokohama (JP)->Port of Melbourne (AU)': SEG_YOKOHAMA_TO_MELBOURNE,
  'Port of Yokohama (JP)->Port of Sydney (AU)':    SEG_YOKOHAMA_TO_SYDNEY,
  'Port of Yokohama (JP)->Port of Brisbane (AU)':  SEG_YOKOHAMA_TO_BRISBANE,

  'Port of Tokyo (JP)->Port of Melbourne (AU)':    SEG_TOKYO_TO_MELBOURNE,
  'Port of Tokyo (JP)->Port of Sydney (AU)':       SEG_TOKYO_TO_SYDNEY,
  'Port of Tokyo (JP)->Port of Brisbane (AU)':     SEG_TOKYO_TO_BRISBANE,

  'Port of Nagoya (JP)->Port of Melbourne (AU)':   SEG_NAGOYA_TO_MELBOURNE,
  'Port of Nagoya (JP)->Port of Sydney (AU)':      SEG_NAGOYA_TO_SYDNEY,
  'Port of Nagoya (JP)->Port of Brisbane (AU)':    SEG_NAGOYA_TO_BRISBANE,

  // ── Japan → India (same paths reversed) ─────────────────────────────────
  'Port of Yokohama (JP)->Jawaharlal Nehru Port (Mumbai, IN)':
    [...join(SEG_MUMBAI_TO_SINGAPORE, SEG_SINGAPORE_TO_YOKOHAMA)].reverse(),
  'Port of Yokohama (JP)->Chennai Port (IN)':
    [...join(SEG_CHENNAI_TO_SINGAPORE, SEG_SINGAPORE_TO_YOKOHAMA)].reverse(),
  'Port of Yokohama (JP)->Mundra Port (IN)':
    [...join(SEG_MUNDRA_TO_SINGAPORE, SEG_SINGAPORE_TO_YOKOHAMA)].reverse(),

  'Port of Tokyo (JP)->Jawaharlal Nehru Port (Mumbai, IN)':
    [...join(SEG_MUMBAI_TO_SINGAPORE, SEG_SINGAPORE_TO_TOKYO)].reverse(),
  'Port of Tokyo (JP)->Chennai Port (IN)':
    [...join(SEG_CHENNAI_TO_SINGAPORE, SEG_SINGAPORE_TO_TOKYO)].reverse(),
  'Port of Tokyo (JP)->Mundra Port (IN)':
    [...join(SEG_MUNDRA_TO_SINGAPORE, SEG_SINGAPORE_TO_TOKYO)].reverse(),

  'Port of Nagoya (JP)->Jawaharlal Nehru Port (Mumbai, IN)':
    [...join(SEG_MUMBAI_TO_SINGAPORE, SEG_SINGAPORE_TO_NAGOYA)].reverse(),
  'Port of Nagoya (JP)->Chennai Port (IN)':
    [...join(SEG_CHENNAI_TO_SINGAPORE, SEG_SINGAPORE_TO_NAGOYA)].reverse(),
  'Port of Nagoya (JP)->Mundra Port (IN)':
    [...join(SEG_MUNDRA_TO_SINGAPORE, SEG_SINGAPORE_TO_NAGOYA)].reverse(),

  // ── Australia → India ────────────────────────────────────────────────────
  'Port of Melbourne (AU)->Jawaharlal Nehru Port (Mumbai, IN)':
    [...join(SEG_MUMBAI_TO_SUNDA, SEG_SUNDA_TO_MELBOURNE)].reverse(),
  'Port of Melbourne (AU)->Chennai Port (IN)':
    [...join(SEG_CHENNAI_TO_SUNDA, SEG_SUNDA_TO_MELBOURNE)].reverse(),
  'Port of Melbourne (AU)->Mundra Port (IN)':
    [...join(SEG_MUNDRA_TO_SUNDA, SEG_SUNDA_TO_MELBOURNE)].reverse(),

  'Port of Sydney (AU)->Jawaharlal Nehru Port (Mumbai, IN)':
    [...join(SEG_MUMBAI_TO_SUNDA, SEG_SUNDA_TO_SYDNEY)].reverse(),
  'Port of Sydney (AU)->Chennai Port (IN)':
    [...join(SEG_CHENNAI_TO_SUNDA, SEG_SUNDA_TO_SYDNEY)].reverse(),
  'Port of Sydney (AU)->Mundra Port (IN)':
    [...join(SEG_MUNDRA_TO_SUNDA, SEG_SUNDA_TO_SYDNEY)].reverse(),

  'Port of Brisbane (AU)->Jawaharlal Nehru Port (Mumbai, IN)':
    [...join(SEG_MUMBAI_TO_SUNDA, SEG_SUNDA_TO_BRISBANE)].reverse(),
  'Port of Brisbane (AU)->Chennai Port (IN)':
    [...join(SEG_CHENNAI_TO_SUNDA, SEG_SUNDA_TO_BRISBANE)].reverse(),
  'Port of Brisbane (AU)->Mundra Port (IN)':
    [...join(SEG_MUNDRA_TO_SUNDA, SEG_SUNDA_TO_BRISBANE)].reverse(),

  // ── Australia → Japan ────────────────────────────────────────────────────
  'Port of Melbourne (AU)->Port of Yokohama (JP)': [...SEG_YOKOHAMA_TO_MELBOURNE].reverse(),
  'Port of Melbourne (AU)->Port of Tokyo (JP)':    [...SEG_TOKYO_TO_MELBOURNE].reverse(),
  'Port of Melbourne (AU)->Port of Nagoya (JP)':   [...SEG_NAGOYA_TO_MELBOURNE].reverse(),

  'Port of Sydney (AU)->Port of Yokohama (JP)':    [...SEG_YOKOHAMA_TO_SYDNEY].reverse(),
  'Port of Sydney (AU)->Port of Tokyo (JP)':       [...SEG_TOKYO_TO_SYDNEY].reverse(),
  'Port of Sydney (AU)->Port of Nagoya (JP)':      [...SEG_NAGOYA_TO_SYDNEY].reverse(),

  'Port of Brisbane (AU)->Port of Yokohama (JP)':  [...SEG_YOKOHAMA_TO_BRISBANE].reverse(),
  'Port of Brisbane (AU)->Port of Tokyo (JP)':     [...SEG_TOKYO_TO_BRISBANE].reverse(),
  'Port of Brisbane (AU)->Port of Nagoya (JP)':    [...SEG_NAGOYA_TO_BRISBANE].reverse(),

  // ── Intra-India ──────────────────────────────────────────────────────────
  'Jawaharlal Nehru Port (Mumbai, IN)->Chennai Port (IN)': [
    [18.95, 72.95], [16.0, 73.5], [13.5, 74.5], [11.0, 76.5], [10.0, 79.0], [13.08, 80.29],
  ],
  'Chennai Port (IN)->Jawaharlal Nehru Port (Mumbai, IN)': [
    [13.08, 80.29], [10.0, 79.0], [11.0, 76.5], [13.5, 74.5], [16.0, 73.5], [18.95, 72.95],
  ],
  'Jawaharlal Nehru Port (Mumbai, IN)->Mundra Port (IN)': [
    [18.95, 72.95], [20.0, 72.0], [21.5, 70.5], [22.84, 69.70],
  ],
  'Mundra Port (IN)->Jawaharlal Nehru Port (Mumbai, IN)': [
    [22.84, 69.70], [21.5, 70.5], [20.0, 72.0], [18.95, 72.95],
  ],
  'Mundra Port (IN)->Chennai Port (IN)': [
    [22.84, 69.70], [20.0, 72.0], [16.0, 73.5], [13.5, 74.5], [11.0, 76.5], [10.0, 79.0], [13.08, 80.29],
  ],
  'Chennai Port (IN)->Mundra Port (IN)': [
    [13.08, 80.29], [10.0, 79.0], [11.0, 76.5], [13.5, 74.5], [16.0, 73.5], [20.0, 72.0], [22.84, 69.70],
  ],

  // ── Intra-Japan ───────────────────────────────────────────────────────────
  'Port of Yokohama (JP)->Port of Tokyo (JP)': [
    [35.44, 139.64], [35.53, 139.70], [35.62, 139.77],
  ],
  'Port of Tokyo (JP)->Port of Yokohama (JP)': [
    [35.62, 139.77], [35.53, 139.70], [35.44, 139.64],
  ],
  'Port of Yokohama (JP)->Port of Nagoya (JP)': [
    [35.44, 139.64], [34.70, 138.50], [34.50, 137.50], [35.02, 136.87],
  ],
  'Port of Nagoya (JP)->Port of Yokohama (JP)': [
    [35.02, 136.87], [34.50, 137.50], [34.70, 138.50], [35.44, 139.64],
  ],
  'Port of Tokyo (JP)->Port of Nagoya (JP)': [
    [35.62, 139.77], [35.20, 138.80], [34.80, 137.80], [35.02, 136.87],
  ],
  'Port of Nagoya (JP)->Port of Tokyo (JP)': [
    [35.02, 136.87], [34.80, 137.80], [35.20, 138.80], [35.62, 139.77],
  ],

  // ── Intra-Australia ───────────────────────────────────────────────────────
  'Port of Melbourne (AU)->Port of Sydney (AU)': [
    [-37.82, 144.92], [-35.00, 148.00], [-33.87, 151.21],
  ],
  'Port of Sydney (AU)->Port of Melbourne (AU)': [
    [-33.87, 151.21], [-35.00, 148.00], [-37.82, 144.92],
  ],
  'Port of Melbourne (AU)->Port of Brisbane (AU)': [
    [-37.82, 144.92], [-33.00, 148.00], [-28.00, 152.00], [-27.47, 153.02],
  ],
  'Port of Brisbane (AU)->Port of Melbourne (AU)': [
    [-27.47, 153.02], [-28.00, 152.00], [-33.00, 148.00], [-37.82, 144.92],
  ],
  'Port of Sydney (AU)->Port of Brisbane (AU)': [
    [-33.87, 151.21], [-30.00, 152.50], [-27.47, 153.02],
  ],
  'Port of Brisbane (AU)->Port of Sydney (AU)': [
    [-27.47, 153.02], [-30.00, 152.50], [-33.87, 151.21],
  ],
}
