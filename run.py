import os
import sys
import uvicorn

_backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
_flowforge_dir = os.path.join(_backend_dir, "flowforge")
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
if _flowforge_dir not in sys.path:
    sys.path.insert(0, _flowforge_dir)

if __name__ == "__main__":
    uvicorn.run("flowforge.main:app", host="0.0.0.0", port=8000, reload=True)
