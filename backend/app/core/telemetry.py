import asyncio
import json
from typing import AsyncGenerator, Dict, Any, List
from datetime import datetime, timezone

class TelemetryBroadcaster:
    def __init__(self):
        self._listeners: List[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self._listeners.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._listeners:
            self._listeners.remove(q)

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        message = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        dead_listeners = []
        for q in self._listeners:
            try:
                q.put_nowait(message)
            except Exception:
                dead_listeners.append(q)
        for q in dead_listeners:
            self.unsubscribe(q)

broadcaster = TelemetryBroadcaster()

async def event_generator() -> AsyncGenerator[str, None]:
    queue = broadcaster.subscribe()
    try:
        # Send initial connection ping
        init_event = {
            "event": "CONNECTED",
            "data": {"status": "telemetry stream active"},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        yield f"event: {init_event['event']}\ndata: {json.dumps(init_event)}\n\n"
        while True:
            msg = await queue.get()
            yield f"event: {msg['event']}\ndata: {json.dumps(msg)}\n\n"
    except asyncio.CancelledError:
        broadcaster.unsubscribe(queue)
        raise
    finally:
        broadcaster.unsubscribe(queue)
