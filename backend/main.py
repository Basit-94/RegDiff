import sys
import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

# Ensure root and backend directory are in sys.path for cloud hosts
_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_root))
sys.path.insert(0, str(Path(__file__).resolve().parent))

load_dotenv(_root / ".env.local")
load_dotenv(_root / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env.local")
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.regulations import router as regulations_router
from backend.app.api.policies import router as policies_router
from backend.app.api.runs import router as runs_router
from backend.app.api.patches import router as patches_router
from backend.app.api.ledger import router as ledger_router
from backend.app.api.telemetry import router as telemetry_router
from backend.app.api.mcp_route import router as mcp_router
from backend.app.api.auth import router as auth_router
from backend.app.api.sentinel import router as sentinel_router
from backend.app.api.connectors import router as connectors_router
from backend.app.api.grc import router as grc_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables created
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Continuous Compliance and Regulatory Regression Testing Platform (Track 3 & Track 2)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend developer console
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RFC 7807 Structured Exception Handling
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "https://regdiff.compliance/errors/internal-server-error",
            "title": "Internal Server Error",
            "status": 500,
            "detail": str(exc),
            "instance": request.url.path,
        }
    )

# Health endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "RegDiff API",
        "version": "1.0.0",
        "mode": "Continuous Compliance Engine"
    }

# Include API v1 routers
prefix = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=prefix)
app.include_router(sentinel_router, prefix=prefix)
app.include_router(connectors_router, prefix=prefix)
app.include_router(grc_router, prefix=prefix)
app.include_router(regulations_router, prefix=prefix)
app.include_router(policies_router, prefix=prefix)
app.include_router(runs_router, prefix=prefix)
app.include_router(patches_router, prefix=prefix)
app.include_router(ledger_router, prefix=prefix)
app.include_router(telemetry_router, prefix=prefix)
app.include_router(mcp_router, prefix=prefix)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
