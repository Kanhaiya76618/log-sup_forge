import requests
import json

API_URL = "http://localhost:8000/api/v1/disruptions/diagnose"

test_cases = [
    {"scenario": "01. Calm Waters / Clear Navigation", "op": 0.05, "geo": 0.08, "cong": 0.10},
    {"scenario": "02. Minor Port Crane Queue (Mumbai)", "op": 0.15, "geo": 0.12, "cong": 0.35},
    {"scenario": "03. Standard Open-Sea Voyage", "op": 0.20, "geo": 0.18, "cong": 0.20},
    {"scenario": "04. Moderate Monsoon Swell (Arabian Sea)", "op": 0.38, "geo": 0.32, "cong": 0.25},
    {"scenario": "05. Singapore Tuas Peak Transshipment", "op": 0.25, "geo": 0.22, "cong": 0.65},
    {"scenario": "06. Mild Headwinds (Bay of Bengal)", "op": 0.40, "geo": 0.35, "cong": 0.30},
    {"scenario": "07. Yokohama Berth Maintenance Dwell", "op": 0.30, "geo": 0.28, "cong": 0.72},
    {"scenario": "08. Crew Shift Overtime Stress", "op": 0.65, "geo": 0.20, "cong": 0.30},
    {"scenario": "09. Malacca Strait Fog & Vessel Congestion", "op": 0.45, "geo": 0.55, "cong": 0.50},
    {"scenario": "10. Approaching Typhoon Periphery", "op": 0.55, "geo": 0.65, "cong": 0.40},
    {"scenario": "11. Rotterdam Gateway Container Bottleneck", "op": 0.35, "geo": 0.40, "cong": 0.85},
    {"scenario": "12. East China Sea Heavy Squall", "op": 0.70, "geo": 0.68, "cong": 0.45},
    {"scenario": "13. Suez Canal Transit Slowdown", "op": 0.50, "geo": 0.80, "cong": 0.60},
    {"scenario": "14. Active Tropical Cyclone Swell (4.2m)", "op": 0.78, "geo": 0.82, "cong": 0.55},
    {"scenario": "15. Critical Port Strike & Berth Freeze", "op": 0.40, "geo": 0.70, "cong": 0.95},
    {"scenario": "16. Engine Mechanical Stress + Storm Headwinds", "op": 0.88, "geo": 0.75, "cong": 0.50},
    {"scenario": "17. FlowForge Baseline Disruption Case", "op": 0.82, "geo": 0.74, "cong": 0.68},
    {"scenario": "18. Severe Geopolitical Strait Blockade", "op": 0.60, "geo": 0.98, "cong": 0.80},
    {"scenario": "19. Super Typhoon Direct Path + Harbor Gridlock", "op": 0.92, "geo": 0.90, "cong": 0.92},
    {"scenario": "20. Worst-Case Maritime Catastrophe", "op": 1.00, "geo": 1.00, "cong": 1.00},
]

print("=" * 105)
print(f"{'#':<3} | {'Scenario':<42} | {'OpStress':<8} | {'GeoRisk':<8} | {'Congest':<8} | {'Disruption %':<12} | {'Prediction':<13} | {'Risk Tier'}")
print("=" * 105)

for i, tc in enumerate(test_cases, 1):
    payload = {
        "operational_stress": tc["op"],
        "geo_port_risk": tc["geo"],
        "port_congestion_score": tc["cong"],
        "threshold": 0.45
    }
    try:
        res = requests.post(API_URL, json=payload, timeout=3)
        data = res.json()
        prob_pct = f"{data['disruption_probability_percent']:.2f}%"
        pred = data['prediction']
        risk = data['risk_level']
        print(f"{i:<3} | {tc['scenario']:<42} | {tc['op']:<8.2f} | {tc['geo']:<8.2f} | {tc['cong']:<8.2f} | {prob_pct:<12} | {pred:<13} | {risk}")
    except Exception as e:
        print(f"{i:<3} | {tc['scenario']:<42} | ERROR: {e}")

print("=" * 105)
print("ML Model Used: Trained ExtraTreesClassifier (flowforge_model/disruption_model.pkl)")
