from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any, Set, Callable

# Placeholder imports for your actual model/aggregator
# from ultralytics import YOLO
# from your_module import YourAggregator


@dataclass
class Summary:
    ts: float
    version: int
    text: Optional[str] = None
    audio_url: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SessionState:
    session_id: str
    queue: "asyncio.Queue[dict]" = field(default_factory=asyncio.Queue)
    task: Optional[asyncio.Task] = None
    latest_summary: Optional[Summary] = None
    last_activity_ts: float = field(default_factory=lambda: time.time())
    # For WebSocket subscribers (managed by router)
    subscribers: Set[Callable[[Summary], None]] = field(default_factory=set)
    # Placeholder for your aggregator instance
    aggregator: Any = None


class CVService:
    def __init__(self, summary_interval_s: float = 5.0, idle_timeout_s: float = 300.0) -> None:
        # Load YOLO and other heavy resources ONCE here if desired
        # self.model = YOLO("yolov8n.pt")
        # self.tracker = ...
        self._sessions: Dict[str, SessionState] = {}
        self._lock = asyncio.Lock()
        self._summary_interval_s = summary_interval_s
        self._idle_timeout_s = idle_timeout_s
        self._shutdown = False
        self._reaper_task: Optional[asyncio.Task] = asyncio.create_task(self._reaper_loop())

    async def shutdown(self) -> None:
        self._shutdown = True
        if self._reaper_task:
            self._reaper_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._reaper_task
        # Stop all sessions
        for sid in list(self._sessions.keys()):
            await self.stop_session(sid)

    async def _reaper_loop(self) -> None:
        try:
            while not self._shutdown:
                now = time.time()
                stale: List[str] = []
                for sid, st in list(self._sessions.items()):
                    if now - st.last_activity_ts > self._idle_timeout_s:
                        stale.append(sid)
                for sid in stale:
                    await self.stop_session(sid)
                await asyncio.sleep(5)
        except asyncio.CancelledError:
            pass

    async def start_session(self, params: Optional[Dict[str, Any]] = None) -> str:
        del params  # currently unused
        sid = str(uuid.uuid4())
        st = SessionState(session_id=sid)
        # Initialize your aggregator here if needed
        # st.aggregator = YourAggregator(...)
        st.task = asyncio.create_task(self._session_worker(st))
        async with self._lock:
            self._sessions[sid] = st
        return sid

    async def stop_session(self, session_id: str) -> None:
        async with self._lock:
            st = self._sessions.pop(session_id, None)
        if not st:
            return
        if st.task:
            st.task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await st.task

    async def enqueue_frames(self, session_id: str, frames: List[bytes], timestamps: Optional[List[float]] = None) -> None:
        st = self._sessions.get(session_id)
        if not st:
            raise KeyError("session not found")
        st.last_activity_ts = time.time()
        payload = {
            "type": "frames",
            "frames": frames,
            "timestamps": timestamps,
        }
        await st.queue.put(payload)

    async def enqueue_clip(self, session_id: str, clip_bytes: bytes, fps: Optional[float] = None) -> None:
        st = self._sessions.get(session_id)
        if not st:
            raise KeyError("session not found")
        st.last_activity_ts = time.time()
        payload = {
            "type": "clip",
            "clip": clip_bytes,
            "fps": fps,
        }
        await st.queue.put(payload)

    def get_latest_summary(self, session_id: str) -> Optional[Summary]:
        st = self._sessions.get(session_id)
        if not st:
            return None
        return st.latest_summary

    def subscribe(self, session_id: str, callback: Callable[[Summary], None]) -> None:
        st = self._sessions.get(session_id)
        if not st:
            raise KeyError("session not found")
        st.subscribers.add(callback)

    def unsubscribe(self, session_id: str, callback: Callable[[Summary], None]) -> None:
        st = self._sessions.get(session_id)
        if not st:
            return
        st.subscribers.discard(callback)

    async def _session_worker(self, st: SessionState) -> None:
        try:
            last_summary_ts = 0.0
            version = 0
            while True:
                item = await st.queue.get()
                # Placeholder: run your YOLO + tracking + aggregator update here
                if item["type"] == "frames":
                    frames: List[bytes] = item["frames"]
                    _ = frames  # replace with inference
                elif item["type"] == "clip":
                    clip = item["clip"]
                    _ = clip  # replace with inference

                # Periodic summarization trigger (simple timer-based)
                now = time.time()
                if now - last_summary_ts >= self._summary_interval_s:
                    version += 1
                    summary = Summary(ts=now, version=version, text=f"Summary v{version}")
                    st.latest_summary = summary
                    # Fan-out to any subscribers (WebSocket callbacks)
                    for cb in list(st.subscribers):
                        try:
                            cb(summary)
                        except Exception:
                            # Best-effort delivery
                            pass
                    last_summary_ts = now
        except asyncio.CancelledError:
            return


# Singleton helpers
import contextlib
_service: Optional[CVService] = None


def init_cv_service() -> None:
    global _service
    if _service is None:
        _service = CVService()


def get_cv_service() -> CVService:
    assert _service is not None, "CVService not initialized. Call init_cv_service() during startup."
    return _service
