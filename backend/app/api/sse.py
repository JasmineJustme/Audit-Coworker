from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from app.services.sse_manager import sse_manager

router = APIRouter(prefix="", tags=["sse"])


@router.get("/sse/events")
async def sse_events(request: Request):
    client_id, _ = sse_manager.subscribe()

    async def event_stream():
        try:
            async for event in sse_manager.event_generator(client_id):
                if await request.is_disconnected():
                    break
                yield event
        finally:
            sse_manager.unsubscribe(client_id)

    return EventSourceResponse(event_stream())
