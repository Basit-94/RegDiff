from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from backend.app.core.telemetry import event_generator

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.get("/stream")
async def telemetry_stream():
    """
    Live Server-Sent Events stream for real-time compliance events:
    AMENDMENT_DETECTED, RUN_STARTED, ASSERTION_FAILED, PATCH_READY, AUDIT_BLOCK_MINED.
    """
    return EventSourceResponse(event_generator())
