export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type StepStatus = 'pending' | 'active' | 'completed' | 'failed'

export interface InventoryItem {
  sku: string
  productName: string
  category: string
  stock: number
  quantity?: number
  reorderPoint: number
  warehouse: string
  location?: string
  unitCost: number
  status: 'In Stock' | 'Low Stock' | 'Stockout'
  updatedAt?: string
}

export interface ShipmentItem {
  id: string
  trackingId: string
  vessel: string
  origin: string
  destination: string
  eta: string
  speed: string
  containers: number
  status: 'On Schedule' | 'At Risk' | 'Delayed'
  riskFactor: number
}

export interface SupplierItem {
  id: string
  name: string
  category: string
  rating: number
  onTimeDeliveryRate: number
  activeOrders: number
  location: string
  status: 'Active' | 'Pending Review' | 'Suspended'
}

export interface AutomationRule {
  id: string
  title: string
  agent: string
  trigger: string
  action: string
  enabled: boolean
  lastRun: string
}

export interface IntegrationItem {
  id: string
  name: string
  category: string
  status: 'Connected' | 'Error' | 'Disconnected'
  lastSync: string
  icon: string
  description?: string
}

export interface DecisionAgent {
  step: string
  name: string
  category: string
  status: 'ONLINE' | 'ACTIVE' | 'CRITICAL' | 'ETA SLIP' | 'AT RISK' | 'STOCKOUT' | 'EXPOSURE' | 'READY' | 'SIMULATED' | 'AUTO-APPROVED'
  model: string
  output: string
  confidence?: number
  latencyMs?: number
}

export interface DisruptionInput {
  type: 'severe_weather' | 'port_congestion' | 'canal_blockage' | 'geopolitical_strait' | 'labor_strike' | 'equipment_failure'
  severity: number // 1 to 100
  affectedNode: string
  predictedDelayHours: number
  waveHeightMeters?: number
  windSpeedKmh?: number
  portCongestionPct?: number
  description?: string
}

export interface ConstraintInput {
  maxBudgetUsd: number
  maxDelayHours: number
  allowTransshipment: boolean
  prioritizeCarbon: boolean
  strictSla: boolean
  preferredCarriers?: string[]
}

export interface CostBusinessInput {
  fuelCostPerTonUsd: number
  demurrageRatePerHourUsd: number
  stockoutPenaltyPerDayUsd: number
  carbonTaxPerTonUsd: number
  cargoValueUsd: number
}

export interface ScenarioInput {
  id: string
  title: string
  shipmentId: string
  vesselName: string
  origin: string
  destination: string
  transshipmentHub?: string
  currentSpeedKnots: number
  scheduledTransitHours: number
  disruption: DisruptionInput
  constraints: ConstraintInput
  costRules: CostBusinessInput
  createdAt: string
}

export interface RouteOption {
  id: string
  name: string
  type: 'CURRENT_DELAYED' | 'RECOMMENDED_REROUTE' | 'SPEED_BOOST' | 'ALTERNATE_HUB'
  pathSummary: string
  distanceNm: number
  speedKnots: number
  transitTimeHours: number
  etaDate: string
  delayVsSlaHours: number
  fuelCostUsd: number
  demurrageCostUsd: number
  penaltyCostUsd: number
  totalFinancialExposureUsd: number
  savingsVsDoNothingUsd: number
  co2EmissionsTons: number
  riskScorePercent: number
  recommended: boolean
  confidenceScore: number
  waypoints: [number, number][]
}

export interface DecisionEvidenceItem {
  agentStep: string
  agentName: string
  inferenceModel: string
  reasoning: string
  keySignal: string
  confidence: number
}

export interface CalculationStep {
  factor: string
  formula: string
  baselineValue: string
  disruptedValue: string
  netDelta: string
}

export interface WhatIfScenarioVariant {
  name: string
  speedChangeKnots: number
  weatherDecayPct: number
  predictedSlipDays: number
  netSavingsUsd: number
  slaConfidencePct: number
}

export interface AnalysisResult {
  id: string
  scenarioInput: ScenarioInput
  disruptionProbability: number
  riskLevel: RiskLevel
  affectedCorridor: string
  predictedDelayDays: number
  lossAvoidedAmountUsd: number
  slaCompliancePercent: number
  recommendedRoute: RouteOption
  routeComparison: RouteOption[]
  decisionEvidence: DecisionEvidenceItem[]
  calculationLogic: CalculationStep[]
  whatIfScenarios: WhatIfScenarioVariant[]
  disruptionSummary: {
    event: string
    severity: string
    rootCauses: string[]
    immediateImpacts: string[]
    cascadingRisks: string[]
  }
  factorsAndConstraints: {
    criticalFactors: string[]
    activeConstraints: string[]
    mitigationDirectives: string[]
  }
  pipelineSteps: DecisionAgent[]
  createdAt: string
}

export interface UserAccessItem {
  id: string
  name: string
  email: string
  role: 'Logistics Officer' | 'Risk Analyst' | 'Operations VP' | 'System Administrator'
  department: string
  hitlApprovalLimit: string
  status: 'Active' | 'Inactive'
}
