"""
CostAgent — independent backend service for shipment cost optimization.

Model: flowforge_cost_optimizer_xgb.pkl (sklearn Pipeline)
  └─ ColumnTransformer (OneHotEncoder for categoricals, SimpleImputer for numerics)
  └─ XGBRegressor
  Trained on SCMS supply chain dataset.
  Target variable: line_item_value (total logistics cost in USD per shipment)

Model features (11, in exact training order):
  Categorical (OHE):  shipment_mode, country, vendor, fulfill_via, vendor_inco_term
  Numeric (imputed):  line_item_quantity, line_item_value, pack_price, unit_price,
                      weight_kilograms, line_item_insurance_usd

Prediction method: Pipeline.predict(df) → float (USD)

Post-prediction calculations (derived from model output + shipment parameters):
  extra_fuel_cost_usd    = extra_distance_nm × 0.104 tons/nm × fuel_price_usd/ton
  extra_charter_cost_usd = (extra_distance_nm / speed_knots) × (daily_charter / 24)
  total_reroute_cost_usd = extra_fuel_cost + extra_charter_cost
  demurrage_saved_usd    = (delay_hours_avoided / 24) × demurrage_rate/day
  net_savings_usd        = max(0, demurrage_saved - total_reroute_cost)

This agent:
  - Receives a validated CostInput Pydantic model
  - Prepares the 11-feature DataFrame in the exact training column order
  - Calls model_registry.predict_cost() (no model loading here)
  - Computes derived cost breakdowns post-prediction
  - Returns a typed CostOutput Pydantic model
  - Never retrains, never loads pkl files, never touches API/frontend code
"""
import logging
import pandas as pd
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

try:
    from app.models.model_loader import model_registry
    from app.services.fuel_service import fuel_service
except ImportError:
    from models.model_loader import model_registry
    from services.fuel_service import fuel_service

logger = logging.getLogger("flowforge.agents.cost")

# Fuel consumption constant derived from SCMS maritime dataset context
FUEL_CONSUMPTION_TONS_PER_NM = 0.104  # metric tons per nautical mile at ~14 knots
DEFAULT_DAILY_CHARTER_USD = 25000.0   # $/day vessel charter (configured)
DEFAULT_DEMURRAGE_RATE_USD = 45000.0  # $/day demurrage (industry standard)


# ── Structured Input Schema ────────────────────────────────────────────────────

class CostInput(BaseModel):
    """
    Validated input for CostAgent.
    Fields map to the model's 11 training features + operational parameters
    used for post-prediction derived cost calculations.
    """
    # === Model features (11) — must match training column names exactly ===
    # Categorical
    shipment_mode: str = Field("Ocean", description="Shipment mode: Ocean, Air, Truck, Rail")
    country: str = Field("Japan", description="Destination country")
    vendor: str = Field("VendorA", description="Vendor/supplier identifier")
    fulfill_via: str = Field("Direct", description="Fulfillment channel")
    vendor_inco_term: str = Field("FOB", description="Incoterms: FOB, CIF, EXW, etc.")
    # Numeric
    line_item_quantity: int = Field(100, gt=0, description="Number of cargo units")
    line_item_value: float = Field(5000.0, ge=0, description="Total declared line item value USD")
    pack_price: float = Field(50.0, ge=0, description="Price per pack USD")
    unit_price: float = Field(50.0, ge=0, description="Price per unit USD")
    weight_kilograms: float = Field(1200.0, gt=0, description="Total shipment weight in kg")
    line_item_insurance_usd: float = Field(150.0, ge=0, description="Insurance cost in USD")

    # === Operational parameters for post-prediction derived calculations ===
    vessel_name: str = Field("MV ORION", description="Vessel identifier")
    baseline_route_nm: float = Field(1200.0, gt=0, description="Direct route distance in nautical miles")
    alternative_route_nm: float = Field(1380.0, ge=0, description="Alternative/diversion route distance nm")
    speed_knots: float = Field(14.2, gt=0, description="Vessel speed in knots")
    daily_vessel_charter_usd: float = Field(DEFAULT_DAILY_CHARTER_USD, gt=0, description="Daily charter rate USD")
    demurrage_cost_per_day_usd: float = Field(DEFAULT_DEMURRAGE_RATE_USD, gt=0, description="Demurrage rate USD/day")
    delay_hours_avoided: float = Field(18.0, ge=0, description="Delay hours avoided by rerouting")
    fuel_cost_per_ton_usd: Optional[float] = Field(None, description="Fuel cost USD/ton; if None, fetched from FuelService")


# ── Structured Output Schema ───────────────────────────────────────────────────

class CostBreakdown(BaseModel):
    """Derived reroute cost components — all DERIVED_CALCULATION."""
    extra_distance_nm: float
    extra_fuel_tons: float = Field(description="extra_distance_nm × 0.104 t/nm")
    extra_fuel_cost_usd: float
    extra_transit_hours: float
    extra_charter_cost_usd: float
    total_reroute_cost_usd: float
    source: str = "DERIVED_CALCULATION"


class SavingsBreakdown(BaseModel):
    """Avoided cost components — all DERIVED_CALCULATION."""
    delay_hours_avoided: float
    demurrage_saved_usd: float = Field(description="(delay_hours_avoided / 24) × demurrage_rate")
    source: str = "DERIVED_CALCULATION"


class CostOutput(BaseModel):
    """
    Structured output from CostAgent.
    Only contains fields that can actually be calculated from the model and inputs.
    """
    agent: str
    vessel_name: str

    # ML model prediction — sourced from flowforge_cost_optimizer_xgb.pkl
    total_cost_usd: float = Field(description="ML model predicted baseline cost in USD")
    prediction_source: str = Field(description="TRAINED_MODEL | DERIVED_CALCULATION")
    model_file: str

    # Fuel cost — derived from live fuel price × consumption model
    fuel_cost_usd: float = Field(description="Actual fuel cost for alternative route (DERIVED)")
    fuel_price_usd_per_ton: float
    fuel_price_source: str

    # Port/demurrage cost — derived
    port_cost_usd: float = Field(
        description="Demurrage savings quantified as cost-avoided (DERIVED)"
    )

    # Reroute cost breakdown
    reroute_cost_breakdown: CostBreakdown

    # Savings breakdown
    savings_breakdown: SavingsBreakdown

    # Net result
    net_financial_savings_usd: float = Field(description="max(0, demurrage_saved - total_reroute_cost)")
    net_savings_source: str = "DERIVED_CALCULATION"
    recommendation: str

    # Feature values sent to the model (for audit)
    model_input_features: Dict[str, Any]
    ml_model_active: bool


# ── Agent Implementation ───────────────────────────────────────────────────────

class CostAgent:
    """
    CostAgent — wraps flowforge_cost_optimizer_xgb.pkl (sklearn Pipeline).

    Pipeline internals (from audit):
      ColumnTransformer:
        - OHE: shipment_mode, country, vendor, fulfill_via, vendor_inco_term
        - SimpleImputer(strategy='median'): numeric columns
      XGBRegressor: predicts line_item_value (logistics cost USD)

    Post-prediction derived calculations:
      extra_fuel_cost = (alt_nm - base_nm) × 0.104 t/nm × fuel_$/t
      extra_charter   = (extra_nm / speed_knots) × (charter_$/day / 24)
      reroute_cost    = extra_fuel + extra_charter
      demurrage_saved = (delay_h_avoided / 24) × demurrage_$/day
      net_savings     = max(0, demurrage_saved - reroute_cost)
    """

    def __init__(self):
        self.name = "COST_AGENT"

    def _build_model_df(self, inp: CostInput) -> pd.DataFrame:
        """
        Construct the exact 11-column DataFrame matching the training pipeline column order.
        Column names must match feature_names_in_ exactly.
        """
        return pd.DataFrame([{
            "line_item_quantity": inp.line_item_quantity,
            "line_item_value": inp.line_item_value,
            "pack_price": inp.pack_price,
            "unit_price": inp.unit_price,
            "weight_kilograms": inp.weight_kilograms,
            "line_item_insurance_usd": inp.line_item_insurance_usd,
            "shipment_mode": inp.shipment_mode,
            "country": inp.country,
            "vendor": inp.vendor,
            "fulfill_via": inp.fulfill_via,
            "vendor_inco_term": inp.vendor_inco_term,
        }])

    def predict(self, inp: CostInput) -> CostOutput:
        """
        Core prediction method — pure business logic.

        1. Fetches live fuel price from FuelService
        2. Builds 11-column DataFrame for model input
        3. Calls model_registry.predict_cost() — the single ModelRegistry gate
        4. Computes post-prediction derived cost breakdown
        5. Returns typed CostOutput
        """
        # Fetch live fuel price
        fuel_data = fuel_service.get_fuel_price_per_ton()
        fuel_price = inp.fuel_cost_per_ton_usd if inp.fuel_cost_per_ton_usd is not None else float(fuel_data["value"])
        fuel_source = fuel_data.get("source", "CONFIGURED")

        # Build model input
        model_df = self._build_model_df(inp)

        # ML prediction
        ml_cost = None
        prediction_source = "DERIVED_CALCULATION"
        ml_active = model_registry.cost_optimizer_model is not None

        if ml_active:
            try:
                ml_cost = model_registry.predict_cost(model_df)
                prediction_source = "TRAINED_MODEL"
            except Exception as e:
                logger.warning(f"Cost model prediction failed ({e}), using heuristic")
                ml_cost = inp.line_item_value * 1.15  # rough overhead estimate
                prediction_source = "DERIVED_CALCULATION"
        else:
            ml_cost = inp.line_item_value * 1.15
            prediction_source = "DERIVED_CALCULATION"

        # Post-prediction derived calculations
        extra_nm = max(0.0, inp.alternative_route_nm - inp.baseline_route_nm)
        extra_fuel_tons = extra_nm * FUEL_CONSUMPTION_TONS_PER_NM
        extra_fuel_cost = extra_fuel_tons * fuel_price
        extra_transit_hours = extra_nm / inp.speed_knots if extra_nm > 0 else 0.0
        extra_charter_cost = (extra_transit_hours / 24.0) * inp.daily_vessel_charter_usd
        total_reroute_cost = extra_fuel_cost + extra_charter_cost

        demurrage_saved = (inp.delay_hours_avoided / 24.0) * inp.demurrage_cost_per_day_usd
        net_savings = max(0.0, demurrage_saved - total_reroute_cost)

        recommendation = (
            "EXECUTE REROUTE — Positive Net ROI" if net_savings > 0
            else "MAINTAIN COURSE — Reroute cost exceeds demurrage savings"
        )

        return CostOutput(
            agent=self.name,
            vessel_name=inp.vessel_name,
            total_cost_usd=round(ml_cost, 2),
            prediction_source=prediction_source,
            model_file="flowforge_cost_optimizer_xgb.pkl",
            fuel_cost_usd=round(extra_fuel_cost, 2),
            fuel_price_usd_per_ton=round(fuel_price, 2),
            fuel_price_source=fuel_source,
            port_cost_usd=round(demurrage_saved, 2),
            reroute_cost_breakdown=CostBreakdown(
                extra_distance_nm=round(extra_nm, 2),
                extra_fuel_tons=round(extra_fuel_tons, 2),
                extra_fuel_cost_usd=round(extra_fuel_cost, 2),
                extra_transit_hours=round(extra_transit_hours, 2),
                extra_charter_cost_usd=round(extra_charter_cost, 2),
                total_reroute_cost_usd=round(total_reroute_cost, 2)
            ),
            savings_breakdown=SavingsBreakdown(
                delay_hours_avoided=inp.delay_hours_avoided,
                demurrage_saved_usd=round(demurrage_saved, 2)
            ),
            net_financial_savings_usd=round(net_savings, 2),
            recommendation=recommendation,
            model_input_features=model_df.iloc[0].to_dict(),
            ml_model_active=ml_active
        )

    def calculate_cost_impact(
        self,
        vessel_name: str = "MV ORION",
        baseline_route_nm: float = 1200.0,
        alternative_route_nm: float = 1380.0,
        daily_vessel_charter_usd: float = DEFAULT_DAILY_CHARTER_USD,
        fuel_cost_per_ton_usd: Optional[float] = None,
        demurrage_cost_per_day_usd: float = DEFAULT_DEMURRAGE_RATE_USD,
        delay_hours_avoided: float = 18.0,
        shipment_mode: str = "Ocean",
        country: str = "Japan",
        line_item_quantity: int = 100,
        line_item_value: float = 5000.0,
        weight_kilograms: float = 1200.0,
        vendor: str = "VendorA",
        fulfill_via: str = "Direct",
        vendor_inco_term: str = "FOB",
        speed_knots: float = 14.2
    ) -> Dict[str, Any]:
        """
        Backward-compatible orchestrator interface.
        Builds CostInput, calls predict(), returns dict matching old response shape.
        """
        unit_price = line_item_value / max(line_item_quantity, 1)
        pack_price = unit_price
        insurance = round(line_item_value * 0.03, 2)

        inp = CostInput(
            shipment_mode=shipment_mode,
            country=country,
            vendor=vendor,
            fulfill_via=fulfill_via,
            vendor_inco_term=vendor_inco_term,
            line_item_quantity=line_item_quantity,
            line_item_value=line_item_value,
            pack_price=pack_price,
            unit_price=unit_price,
            weight_kilograms=weight_kilograms,
            line_item_insurance_usd=insurance,
            vessel_name=vessel_name,
            baseline_route_nm=baseline_route_nm,
            alternative_route_nm=alternative_route_nm,
            speed_knots=speed_knots,
            daily_vessel_charter_usd=daily_vessel_charter_usd,
            demurrage_cost_per_day_usd=demurrage_cost_per_day_usd,
            delay_hours_avoided=delay_hours_avoided,
            fuel_cost_per_ton_usd=fuel_cost_per_ton_usd
        )
        result = self.predict(inp)

        fuel_prov = fuel_service.get_fuel_price_per_ton()
        return {
            "agent": result.agent,
            "vessel_name": result.vessel_name,
            "baseline_route_nm": baseline_route_nm,
            "alternative_route_nm": alternative_route_nm,
            "extra_distance_nm": result.reroute_cost_breakdown.extra_distance_nm,
            "ml_predicted_shipment_cost": {
                "value": result.total_cost_usd,
                "source": result.prediction_source,
                "model_file": result.model_file
            },
            "cost_breakdown": {
                "extra_fuel_tons": result.reroute_cost_breakdown.extra_fuel_tons,
                "extra_fuel_cost_usd": result.reroute_cost_breakdown.extra_fuel_cost_usd,
                "extra_charter_cost_usd": result.reroute_cost_breakdown.extra_charter_cost_usd,
                "total_reroute_cost_usd": result.reroute_cost_breakdown.total_reroute_cost_usd,
                "source": "DERIVED_CALCULATION"
            },
            "savings_breakdown": {
                "demurrage_saved_usd": result.savings_breakdown.demurrage_saved_usd,
                "total_gross_savings_usd": result.savings_breakdown.demurrage_saved_usd,
                "source": "DERIVED_CALCULATION"
            },
            "net_financial_savings_usd": {
                "value": result.net_financial_savings_usd,
                "source": "DERIVED_CALCULATION"
            },
            "recommendation": result.recommendation,
            "fuel_provenance": fuel_prov,
            "ml_model_active": result.ml_model_active
        }


cost_agent = CostAgent()
