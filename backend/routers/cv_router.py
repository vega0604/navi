from __future__ import annotations

import asyncio
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi import Depends
import contextlib

from dtos.cv_dtos import (
    StartSessionRequest,
    StartSessionResponse,
    StopSessionRequest,
    StopSessionResponse,
    LatestSummaryResponse,
)
from services.cv_service import get_cv_service, CVService, Summary

router = APIRouter(prefix="/cv", tags=["cv"])


def get_service() -> CVService:
    return get_cv_service()


@router.post("/session/start", response_model=StartSessionResponse)
async def start_session(req: StartSessionRequest, svc: CVService = Depends(get_service)):
    # Optionally use req.sampling_rate / req.summary_interval_s to configure session
    session_id = await svc.start_session(params=req.model_dump())
    return StartSessionResponse(session_id=session_id)


@router.post("/session/stop", response_model=StopSessionResponse)
async def stop_session(req: StopSessionRequest, svc: CVService = Depends(get_service)):
    await svc.stop_session(req.session_id)
    return StopSessionResponse(ok=True)


@router.post("/frames")
async def upload_frames(
    session_id: str = Form(...),
    frames: List[UploadFile] = File(...),
    timestamps_json: Optional[str] = Form(None),
    svc: CVService = Depends(get_service),
):
    # Parse timestamps if provided
    timestamps: Optional[List[float]] = None
    if timestamps_json:
        import json
        try:
            timestamps = json.loads(timestamps_json)
            if not isinstance(timestamps, list):
                raise ValueError
        except Exception:
            raise HTTPException(status_code=400, detail="timestamps_json must be a JSON array of floats")

    # Read bytes
    data: List[bytes] = []
    for f in frames:
        content = await f.read()
        data.append(content)

    try:
        await svc.enqueue_frames(session_id, data, timestamps)
    except KeyError:
        raise HTTPException(status_code=404, detail="session not found")

    return {"ok": True}


@router.post("/clip")
async def upload_clip(
    session_id: str = Form(...),
    clip: UploadFile = File(...),
    fps: Optional[float] = Form(None),
    svc: CVService = Depends(get_service),
):
    content = await clip.read()
    try:
        await svc.enqueue_clip(session_id, content, fps)
    except KeyError:
        raise HTTPException(status_code=404, detail="session not found")

    return {"ok": True}


@router.get("/summary/latest", response_model=LatestSummaryResponse)
async def latest_summary(session_id: str, svc: CVService = Depends(get_service)):
    summ = svc.get_latest_summary(session_id)
    if not summ:
        # Either no session or no summary yet. Check session existence first.
        # If session exists but none yet, return 204-like payload with session_id only
        # We can't return 204 with body, so return minimal model.
        return LatestSummaryResponse(session_id=session_id)
    return LatestSummaryResponse(
        session_id=session_id,
        ts=summ.ts,
        version=summ.version,
        text=summ.text,
        audio_url=summ.audio_url,
        extra=summ.extra,
    )


# WebSocket for push summaries
@router.websocket("/summary/ws/{session_id}")
async def summary_ws(ws: WebSocket, session_id: str):
    await ws.accept()
    svc = get_cv_service()
    # Define a callback to push summaries
    queue: asyncio.Queue[Summary] = asyncio.Queue()

    def on_summary(s: Summary) -> None:
        # push into queue for async send
        try:
            queue.put_nowait(s)
        except Exception:
            pass

    try:
        svc.subscribe(session_id, on_summary)
    except KeyError:
        await ws.send_json({"type": "error", "detail": "session not found"})
        await ws.close(code=4404)
        return

    try:
        while True:
            s = await queue.get()
            await ws.send_json({
                "type": "summary",
                "session_id": session_id,
                "ts": s.ts,
                "version": s.version,
                "text": s.text,
                "audio_url": s.audio_url,
                "extra": s.extra,
            })
    except WebSocketDisconnect:
        pass
    finally:
        svc.unsubscribe(session_id, on_summary)
        with contextlib.suppress(Exception):
            await ws.close()
