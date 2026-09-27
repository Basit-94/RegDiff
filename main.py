import sys
from pathlib import Path

# Add backend directory to sys.path
_root = Path(__file__).resolve().parent
sys.path.insert(0, str(_root))
sys.path.insert(0, str(_root / "backend"))

from backend.main import app

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
