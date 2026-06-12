"""Smoke test — proves the stubbed loop runs end-to-end. OWNER: shared.
Run: PYTHONPATH=. pytest"""
from flowforge.core import build_engine
from flowforge.contracts import Decision


def test_engine_resolves_a_disruption():
    engine = build_engine()
    records = engine.tick()
    assert records, "expected at least one resolution"
    r = records[0]
    assert r.disruption.summary
    assert r.report.passed in (True, False)
    assert r.gate.decision in set(Decision)
    assert len(r.audit_trail) >= 4
