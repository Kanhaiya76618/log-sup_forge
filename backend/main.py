import os
import asyncio
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Database
from backend.database.mongodb import init_db, save_telemetry_event, fetch_telemetry_events

# Collectors
from backend.collectors.weather import weather_collector
from backend.collectors.marine import marine_collector
from backend.collectors.ais import ais_collector
from backend.collectors.ports_india import ports_india_collector
from backend.collectors.ports_japan import ports_japan_collector
from backend.collectors.news import get_latest_news
from backend.collectors.disasters import disaster_collector

# Processors
from backend.processors.normalizer import normalizer
from backend.processors.anomaly_detector import anomaly_detector
from backend.processors.event_detector import event_detector

# Agents
from backend.agents.weather_agent import weather_agent
from backend.agents.vessel_agent import vessel_agent
from backend.agents.port_agent import port_agent
from backend.agents.news_agent import news_agent
from backend.agents.disaster_agent import disaster_agent
from backend.agents.risk_agent import master_risk_agent

# Models
from backend.models.delay_model import delay_model
from backend.models.congestion_model import congestion_model

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("flowforge.main")

app = FastAPI(
    title="FlowForge — Multi-Agent Supply Chain Intelligence API",
    description="Backend API powering real-time marine telemetry, AI multi-agent risk assessment, and predictive logistics models.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing FlowForge Backend & Database connections...")
    await init_db()

@app.get("/")
async def root():
    return {
        "system": "FlowForge Backend API",
        "status": "OPERATIONAL",
        "version": "1.0.0",
        "endpoints": [
            "/api/v1/health",
            "/api/v1/network",
            "/api/v1/vessels",
            "/api/v1/ports/india",
            "/api/v1/ports/japan",
            "/api/v1/risks",
            "/api/v1/simulate",
            "/api/v1/agents",
            "/api/v1/live-feed"
        ]
    }

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "system": "FlowForge Intelligence Layer",
        "timestamp": "2026-08-17T11:25:00Z"
    }

@app.get("/api/v1/network")
async def get_network_overview():
    return {
        "network_health": "94.7%",
        "active_vessels": 1842,
        "active_routes": 247,
        "facilities": 12430,
        "system_status": "SYSTEM · OPERATIONAL"
    }

@app.get("/api/v1/vessels")
async def get_vessels():
    vessels = await ais_collector.get_active_vessels()
    normalized_vessels = [
        normalizer.normalize_vessel_telemetry(v) for v in vessels
    ]
    # Persist each vessel position to Atlas
    for v in normalized_vessels:
        await save_telemetry_event("vessels", v)
    return {
        "count": len(normalized_vessels),
        "vessels": normalized_vessels
    }

@app.get("/api/v1/ports/india")
async def get_indian_ports():
    ports = await ports_india_collector.get_indian_ports()
    return {
        "country": "India",
        "count": len(ports),
        "ports": ports
    }

@app.get("/api/v1/ports/japan")
async def get_japanese_ports():
    ports = await ports_japan_collector.get_japanese_ports()
    return {
        "country": "Japan",
        "count": len(ports),
        "ports": ports
    }

@app.get("/api/v1/risks")
async def get_risk_analysis():
    weather = await weather_collector.get_yokohama_weather()
    vessels = await ais_collector.get_active_vessels()
    jp_ports = await ports_japan_collector.get_japanese_ports()
    news = get_latest_news()
    disasters = await disaster_collector.get_recent_disasters()

    risk_analysis = await master_risk_agent.orchestrate_risk_analysis(
        weather_data=weather,
        vessels=vessels,
        ports=jp_ports,
        news=news,
        disasters=disasters
    )

    port_anomalies = anomaly_detector.detect_port_anomalies(jp_ports)
    vessel_anomalies = anomaly_detector.detect_vessel_anomalies(vessels)
    events = event_detector.synthesize_events(disasters, news, port_anomalies)

    # Persist live data to Atlas
    await save_telemetry_event("weather", weather)
    for d in disasters:
        await save_telemetry_event("disasters", d)
    for n in news:
        await save_telemetry_event("news_events", n)
    await save_telemetry_event("alerts", {
        "risk_summary": risk_analysis,
        "anomalies": {"vessels": vessel_anomalies, "ports": port_anomalies}
    })

    return {
        "risk_summary": risk_analysis,
        "anomalies": {
            "vessels": vessel_anomalies,
            "ports": port_anomalies
        },
        "synthesized_events": events
    }

class SimulationRequest(BaseModel):
    scenario_index: int = 1 # 0: PORT CLOSURE, 1: TYPHOON, 2: FACTORY FAILURE, 3: SUPPLIER FAILURE, 4: SHIPPING DELAY

@app.post("/api/v1/simulate")
async def run_simulation(req: SimulationRequest):
    scenarios = ["PORT CLOSURE", "TYPHOON", "FACTORY FAILURE", "SUPPLIER FAILURE", "SHIPPING DELAY"]
    idx = max(0, min(req.scenario_index, len(scenarios) - 1))
    scenario_name = scenarios[idx]

    # Predict delay using model
    delay_prediction = delay_model.predict_delay_hours(
        distance_nm=1200.0,
        vessel_speed_knots=14.2,
        wind_speed_knots=38.0 if idx == 1 else 20.0,
        wave_height_meters=4.5 if idx == 1 else 2.0,
        destination_port_congestion=0.82 if idx == 0 else 0.45
    )

    # Predict port congestion
    congestion_prediction = congestion_model.predict_congestion(
        incoming_vessels=42,
        outgoing_vessels=61,
        occupied_berths=28,
        total_berths=32,
        weather_severity_score=0.85 if idx == 1 else 0.30
    )

    return {
        "scenario": scenario_name,
        "baseline_health": "94.7%",
        "disruption_exposure": "82%" if idx in [0, 1] else "64%",
        "projected_recovery_health": "91.6%",
        "delay_forecast": delay_prediction,
        "congestion_forecast": congestion_prediction
    }

@app.get("/api/v1/agents")
async def get_agent_statuses():
    agents_list = [
        {"name": "SIGNAL", "status": "ACTIVE", "description": "Processing AIS & Satellite Data"},
        {"name": "IMPACT", "status": "ACTIVE", "description": "Yokohama Disruption Probability: 82%"},
        {"name": "ROUTING", "status": "READY", "description": "4 Alternative Sea Lanes Calculated"},
        {"name": "INVENTORY", "status": "READY", "description": "Osaka & Kobe Warehouse Rebalance"},
        {"name": "FINANCE", "status": "READY", "description": "Est. Savings: $1.42M"},
        {"name": "RECOVERY", "status": "READY", "description": "Coordinated Response Ready"},
        {"name": "EXECUTION", "status": "READY", "description": "Automated Logistics Triggers"}
    ]
    return {"count": len(agents_list), "agents": agents_list}

@app.get("/api/v1/live-feed")
async def get_live_telemetry_feed():
    weather = await weather_collector.get_yokohama_weather()
    marine = await marine_collector.fetch_marine_conditions(35.4437, 139.6380)
    news = get_latest_news()
    disasters = await disaster_collector.get_recent_disasters()

    # Persist all live telemetry to Atlas as it arrives
    await save_telemetry_event("weather", weather)
    if marine:
        await save_telemetry_event("marine", {**marine, "latitude": 35.4437, "longitude": 139.638})
    for n in news:
        await save_telemetry_event("news_events", n)
    for d in disasters:
        await save_telemetry_event("disasters", d)

    return {
        "weather": weather,
        "marine": marine,
        "news": news,
        "disasters": disasters
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
