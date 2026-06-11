import sys
import time
from flowforge.core import build_engine
from flowforge.contracts import RawSignal, Domain
from flowforge.connectors.logistics.generator import generate_signal

def main():
    print("=== FlowForge Command-Line Pipeline Driver ===")
    engine = build_engine()
    
    # Generate a series of test disruption signals
    signals = [generate_signal(i) for i in [7, 11, 15]]
    
    for sig in signals:
        print(f"\nScanning raw signals. Domain: {sig.domain.value}...")
        for record in engine.tick([sig]):
            disruption = record.disruption
            print(f"[{disruption.id}] Status: {disruption.status} | Summary: {disruption.summary}")
            if record.plans:
                best = record.plan.recommended()
                if best:
                    print(f" -> Propose recommended plan: Total cost: ${best.total_cost}, Score: {best.score}")
                    print(f" -> Rationale: {best.rationale}")
            if record.verification:
                print(f" -> Verifier verification: confidence={record.verification.confidence}, passed={record.verification.passed}")
            if record.decision:
                print(f" -> HITL Decision outcome: {record.decision.value}")
            if record.results:
                for result in record.results:
                    print(f" -> Execution action result: {result.action.value} success={result.success} detail='{result.detail}'")
        time.sleep(1)

if __name__ == "__main__":
    main()
