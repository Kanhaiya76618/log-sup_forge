"""
backend/flowforge/solver/simulate.py
500-Sample Monte Carlo Probabilistic Digital Twin Stress Simulation.
"""

import random
from typing import Dict, Any, List


class DigitalTwinSimulator:
    """Runs stochastic Monte Carlo simulations to evaluate maritime schedule stability."""

    def __init__(self, samples: int = 500):
        self.samples = samples

    def run_simulation(
        self,
        base_delay_days: float = 4.2,
        wave_height_m: float = 2.8,
        port_dwell_hours: float = 31.0,
        route_scenario: str = "SCENARIO_B"
    ) -> Dict[str, Any]:
        """
        Simulates 500 probabilistic iterations with stochastic perturbations across:
        - Meteorological headwinds & wave drag
        - Harbor berth queue dwell
        - Secondary terminal bottlenecks
        """
        random.seed(42)

        delay_distribution: List[float] = []
        cost_distribution: List[float] = []

        scenario_mitigation = 0.18 if route_scenario == "SCENARIO_B" else (0.50 if route_scenario == "SCENARIO_A" else 0.40)
        base_slip = base_delay_days * scenario_mitigation

        for _ in range(self.samples):
            weather_noise = random.gauss(0, wave_height_m * 0.12)
            port_noise = random.expovariate(1.0 / max(1.0, port_dwell_hours * 0.04)) - (port_dwell_hours * 0.04)
            sample_delay = max(0.1, round(base_slip + weather_noise + (port_noise / 24.0), 2))
            sample_cost = round((sample_delay * 12000.0) + (wave_height_m * 1800.0) + random.uniform(8000, 14000), 2)

            delay_distribution.append(sample_delay)
            cost_distribution.append(sample_cost)

        delay_distribution.sort()
        cost_distribution.sort()

        p10_delay = delay_distribution[int(self.samples * 0.10)]
        p50_delay = delay_distribution[int(self.samples * 0.50)]
        p90_delay = delay_distribution[int(self.samples * 0.90)]
        p99_delay = delay_distribution[int(self.samples * 0.99)]

        p50_cost = cost_distribution[int(self.samples * 0.50)]
        p90_cost = cost_distribution[int(self.samples * 0.90)]

        min_d, max_d = delay_distribution[0], delay_distribution[-1]
        step = (max_d - min_d) / 12.0 if max_d > min_d else 0.5
        bins = []
        for i in range(12):
            bin_start = min_d + (i * step)
            bin_end = bin_start + step
            count = sum(1 for d in delay_distribution if bin_start <= d < bin_end or (i == 11 and d == bin_end))
            bins.append({
                "bin_label": f"{bin_start:.1f}d",
                "frequency": count,
                "probability_pct": round((count / self.samples) * 100.0, 1)
            })

        sla_compliant_samples = sum(1 for d in delay_distribution if d <= 2.0)
        sla_confidence_pct = round((sla_compliant_samples / self.samples) * 100.0, 1)

        return {
            "samples_executed": self.samples,
            "scenario": route_scenario,
            "sla_confidence_percent": sla_confidence_pct,
            "percentiles": {
                "p10_delay_days": p10_delay,
                "p50_delay_days": p50_delay,
                "p90_delay_days": p90_delay,
                "p99_delay_days": p99_delay,
                "p50_cost_usd": p50_cost,
                "p90_cost_usd": p90_cost,
            },
            "histogram_curve": bins,
            "summary": f"Monte Carlo Stress Test: {sla_confidence_pct}% probability of arriving within SLA window under {route_scenario}. P90 maximum loss capped at ${p90_cost:,.0f} USD."
        }


digital_twin_simulator = DigitalTwinSimulator()
