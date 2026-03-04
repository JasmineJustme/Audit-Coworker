import asyncio
import json
from typing import Any

from sse_starlette.sse import ServerSentEvent


class SSEManager:
    """Manages SSE connections and broadcasts events to all connected clients."""

    def __init__(self):
        self._queues: dict[int, asyncio.Queue] = {}
        self._next_id = 0

    def subscribe(self) -> tuple[int, asyncio.Queue]:
        """Register a new client and return (client_id, queue)."""
        queue: asyncio.Queue = asyncio.Queue()
        client_id = self._next_id
        self._next_id += 1
        self._queues[client_id] = queue
        return client_id, queue

    def unsubscribe(self, client_id: int) -> None:
        """Remove a client from subscriptions."""
        self._queues.pop(client_id, None)

    async def event_generator(self, client_id: int) -> Any:
        """Async generator that yields ServerSentEvent for a client. Sends ping every 30s."""
        queue = self._queues.get(client_id)
        if not queue:
            return
        ping = ServerSentEvent(data="keepalive", event="ping")
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield event
            except asyncio.TimeoutError:
                yield ping

    async def broadcast(self, event_type: str, data: dict[str, Any] | Any) -> None:
        """Broadcast an event to all connected clients."""
        payload = ServerSentEvent(
            data=json.dumps(data) if isinstance(data, dict) else json.dumps({"data": data}),
            event=event_type,
        )
        for queue in list(self._queues.values()):
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                pass


sse_manager = SSEManager()
