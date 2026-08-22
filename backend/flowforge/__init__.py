"""FlowForge Maritime Disruption OS Backend"""
import sys

__version__ = "2.0.0"

# Package alias: enable any `from app.xxx import yyy` to resolve to `flowforge.xxx`
if __name__ in sys.modules and "app" not in sys.modules:
    sys.modules["app"] = sys.modules[__name__]

