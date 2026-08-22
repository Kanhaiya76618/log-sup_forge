export * from './types'
import { 
  InventoryItem, 
  ShipmentItem, 
  SupplierItem, 
  AutomationRule, 
  IntegrationItem,
  DecisionAgent
} from './types'

export const initialInventory: InventoryItem[] = [
  {
    sku: 'SKU-001',
    productName: 'Semiconductor Microcontrollers (Automotive Grade)',
    category: 'Automotive',
    stock: 450,
    quantity: 450,
    reorderPoint: 200,
    warehouse: 'Mumbai JNPT Port Buffer Hub',
    location: 'Mumbai JNPT Port Buffer Hub',
    unitCost: 85,
    status: 'In Stock',
    updatedAt: '2026-08-21T14:30:00Z'
  },
  {
    sku: 'SKU-002',
    productName: 'Solid-State Battery Cells (High Energy Density)',
    category: 'Clean Energy',
    stock: 120,
    quantity: 120,
    reorderPoint: 150,
    warehouse: 'Singapore Tuas Transshipment Warehouse',
    location: 'Singapore Tuas Transshipment Warehouse',
    unitCost: 320,
    status: 'Low Stock',
    updatedAt: '2026-08-21T15:00:00Z'
  },
  {
    sku: 'SKU-003',
    productName: 'PCIe Gen5 NVMe Storage Arrays (16TB Enterprise)',
    category: 'Consumer Electronics',
    stock: 0,
    quantity: 0,
    reorderPoint: 80,
    warehouse: 'Port of Yokohama Terminal Buffer',
    location: 'Port of Yokohama Terminal Buffer',
    unitCost: 1450,
    status: 'Stockout',
    updatedAt: '2026-08-21T16:15:00Z'
  },
  {
    sku: 'SKU-004',
    productName: 'High-Precision CNC Marine Drive Bearings',
    category: 'Industrial Machinery',
    stock: 65,
    quantity: 65,
    reorderPoint: 50,
    warehouse: 'Mumbai JNPT Port Buffer Hub',
    location: 'Mumbai JNPT Port Buffer Hub',
    unitCost: 680,
    status: 'In Stock',
    updatedAt: '2026-08-21T13:45:00Z'
  },
  {
    sku: 'SKU-005',
    productName: 'Cold-Chain Insulin & Biopharmaceutical Vials',
    category: 'Pharmaceuticals',
    stock: 35,
    quantity: 35,
    reorderPoint: 100,
    warehouse: 'Port of Yokohama Terminal Buffer',
    location: 'Port of Yokohama Terminal Buffer',
    unitCost: 240,
    status: 'Low Stock',
    updatedAt: '2026-08-21T17:00:00Z'
  }
]

export const initialShipments: ShipmentItem[] = [
  {
    id: 'SH-4092',
    trackingId: 'TRK-2026-001',
    vessel: 'CSCL Globe Supermax',
    origin: 'Jawaharlal Nehru Port (Mumbai, IN)',
    destination: 'Port of Yokohama (JP)',
    eta: 'Nov 26, 2026 (+4.2d)',
    speed: '18.2 kn',
    containers: 4200,
    status: 'At Risk',
    riskFactor: 82
  },
  {
    id: 'SH-3810',
    trackingId: 'TRK-2026-002',
    vessel: 'MV Tokyo Express',
    origin: 'Singapore Tuas Hub (SG)',
    destination: 'Port of Yokohama (JP)',
    eta: 'Nov 24, 2026',
    speed: '19.5 kn',
    containers: 3850,
    status: 'On Schedule',
    riskFactor: 14
  },
  {
    id: 'SH-5129',
    trackingId: 'TRK-2026-003',
    vessel: 'Maersk Mc-Kinney',
    origin: 'Jawaharlal Nehru Port (Mumbai, IN)',
    destination: 'Singapore Tuas Hub (SG)',
    eta: 'Nov 22, 2026',
    speed: '17.8 kn',
    containers: 5100,
    status: 'On Schedule',
    riskFactor: 18
  },
  {
    id: 'SH-6204',
    trackingId: 'TRK-2026-004',
    vessel: 'CMA CGM Jacques Saadé',
    origin: 'Singapore Tuas Hub (SG)',
    destination: 'Port of Yokohama (JP)',
    eta: 'Nov 28, 2026 (+1.8d)',
    speed: '14.1 kn',
    containers: 6200,
    status: 'Delayed',
    riskFactor: 64
  }
]

export const initialSuppliers: SupplierItem[] = [
  {
    id: 'SUP-01',
    name: 'Nippon Semiconductor Precision Ltd.',
    category: 'Semiconductors & Electronics',
    rating: 4.9,
    onTimeDeliveryRate: 98.2,
    activeOrders: 8,
    location: 'Yokohama, Japan',
    status: 'Active'
  },
  {
    id: 'SUP-02',
    name: 'Tuas Marine Energy & Battery Solutions',
    category: 'Clean Energy & Power',
    rating: 4.8,
    onTimeDeliveryRate: 95.4,
    activeOrders: 5,
    location: 'Singapore Tuas Hub',
    status: 'Active'
  },
  {
    id: 'SUP-03',
    name: 'Bharat Advanced Logistics & Marine Parts',
    category: 'Industrial Machinery',
    rating: 4.7,
    onTimeDeliveryRate: 92.8,
    activeOrders: 6,
    location: 'Mumbai, India',
    status: 'Active'
  },
  {
    id: 'SUP-04',
    name: 'Pacific Cold-Chain Pharma Logistics',
    category: 'Pharmaceuticals',
    rating: 4.9,
    onTimeDeliveryRate: 99.1,
    activeOrders: 3,
    location: 'Tokyo, Japan',
    status: 'Active'
  }
]

export const initialAutomations: AutomationRule[] = [
  {
    id: 'AUT-01',
    title: 'Typhoon & Weather Surge Reroute Policy',
    agent: 'Supervisor / Orchestrator Agent (Agent 09)',
    trigger: 'Wave Swell > 2.8m OR Wind Gusts > 50 km/h along corridor',
    action: 'Execute OR-Tools CP-SAT Scenario B Southern Bypass and draft EDI notice',
    enabled: true,
    lastRun: '12 mins ago'
  },
  {
    id: 'AUT-02',
    title: 'Port Dwell Congestion Alert & Berth Booking',
    agent: 'Port Congestion Agent (Agent 04)',
    trigger: 'Destination Port Dwell > 30 Hours OR Berth Capacity > 70%',
    action: 'Issue emergency priority harbor reservation and trigger buffer hold',
    enabled: true,
    lastRun: '45 mins ago'
  },
  {
    id: 'AUT-03',
    title: 'SKU Stockout Predictive Replenishment',
    agent: 'Inventory Impact Agent (Agent 05)',
    trigger: 'Predicted Stockout Horizon < 7.0 Days at destination terminal',
    action: 'Dispatch air-freight emergency buffer order for critical SKUs',
    enabled: false,
    lastRun: '2 days ago'
  }
]

export const initialIntegrations: IntegrationItem[] = [
  {
    id: 'INT-01',
    name: 'MarineTraffic Live AIS Stream',
    category: 'AIS & Satellite Telemetry',
    status: 'Connected',
    lastSync: 'Real-time (2s ago)',
    icon: 'Radio',
    description: 'Direct NMEA transponder and satellite constellation data stream'
  },
  {
    id: 'INT-02',
    name: 'Open-Meteo Maritime Forecast V2',
    category: 'Weather Radar',
    status: 'Connected',
    lastSync: '5 mins ago',
    icon: 'Waves',
    description: 'High-resolution ocean swell, wind vectors, and tropical storm tracking'
  },
  {
    id: 'INT-03',
    name: 'Port of Yokohama TOS / EDI Gateway',
    category: 'Port Authority',
    status: 'Connected',
    lastSync: '12 mins ago',
    icon: 'Building2',
    description: 'Direct EDI 214 & 301 harbor master clearance integration'
  },
  {
    id: 'INT-04',
    name: 'SAP S/4HANA Supply Chain ERP',
    category: 'Enterprise Inventory',
    status: 'Connected',
    lastSync: '1 hour ago',
    icon: 'Box',
    description: 'Real-time SKU balances, buffer limits, and purchase order tracking'
  }
]

export const initialDecisionAgents: DecisionAgent[] = [
  { step: '01', name: 'Live Risk Detection Agent', category: 'API Stream + Telemetry Parser', status: 'ONLINE', model: 'Open-Meteo V2 + AIS MarineTraffic Stream', output: 'Anomaly flagged: 3.4m wave swell along Mumbai-Yokohama corridor at 18.95N, 72.95E.' },
  { step: '02', name: 'Shipment Disruption Predictor', category: 'Trained ML Model', status: 'CRITICAL', model: 'Trained ExtraTreesClassifier (ExtraTrees)', output: 'Disruption Probability: 82% (Threshold > 45% exceeded).' },
  { step: '03', name: 'ETA Delay Predictor', category: 'Trained ML Model', status: 'ETA SLIP', model: 'LightGBM Regression Model', output: 'Predicted Schedule Delay: +4.2 days slip for CSCL Globe Supermax.' },
  { step: '04', name: 'Port Congestion Agent', category: 'Trained ML Model', status: 'AT RISK', model: 'RandomForest Dwell Forecaster (31-Port Matrix)', output: 'Yokohama Port Dwell: 31.0 hours · Berth capacity at 74%.' },
  { step: '05', name: 'Inventory Impact Agent', category: 'Demand-Supply Forecaster', status: 'STOCKOUT', model: 'Downstream ERP Stockout Predictor', output: 'SKU-003 (Enterprise SSDs) predicted stockout in 5.8 days at Yokohama buffer.' },
  { step: '06', name: 'Cost & Financial Exposure Engine', category: 'Financial Loss Engine', status: 'EXPOSURE', model: 'Contractual Demurrage Matrix', output: 'Total Financial Exposure: $64,600 USD ($18K fuel + $28.4K demurrage + $18K stockout).' },
  { step: '07', name: 'Route Optimization Agent', category: 'Mathematical Solver', status: 'READY', model: 'Google OR-Tools CP-SAT Combinatorial Solver', output: 'Scenario B (Southern Weather Bypass) optimal (-63% net financial loss).' },
  { step: '08', name: 'Digital Twin Simulation Engine', category: 'Monte Carlo Stochastic Engine', status: 'SIMULATED', model: '500-Sample Probabilistic Monte Carlo Engine', output: '94.6% confidence of arriving within SLA window under Plan B: Southern Bypass.' },
  { step: '09', name: 'Supervisor / Orchestrator Agent', category: 'Autonomous Multi-Agent Supervisor', status: 'AUTO-APPROVED', model: 'HITL Governance & Automated EDI Dispatcher', output: 'Executive Action: Plan Auto-Approved. Net loss reduced by 63% ($42K saved).' }
]

export const initialUsers: UserAccessItem[] = [
  {
    id: 'USR-01',
    name: 'Alex Mercer',
    email: 'alex.mercer@flowforge.internal',
    role: 'Operations VP',
    department: 'Maritime Operations & Strategy',
    hitlApprovalLimit: '$500,000 USD',
    status: 'Active'
  },
  {
    id: 'USR-02',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@flowforge.internal',
    role: 'Risk Analyst',
    department: 'Predictive Maritime AI',
    hitlApprovalLimit: '$250,000 USD',
    status: 'Active'
  },
  {
    id: 'USR-03',
    name: 'Kenji Sato',
    email: 'kenji.sato@flowforge.internal',
    role: 'Logistics Officer',
    department: 'Yokohama Port Operations',
    hitlApprovalLimit: '$100,000 USD',
    status: 'Active'
  },
  {
    id: 'USR-04',
    name: 'Elena Rostova',
    email: 'elena.rostova@flowforge.internal',
    role: 'System Administrator',
    department: 'Security & Cloud Infrastructure',
    hitlApprovalLimit: 'Unlimited',
    status: 'Active'
  }
]
