from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any, Set, Callable

import os
import contextlib
import tempfile

import numpy as np
import cv2
from dotenv import load_dotenv
from ultralytics import YOLO
from google import genai


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
    # Per-session scene state
    scene_objects: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    event_buffer: List[Any] = field(default_factory=list)
    last_summary_time: float = 0.0
    last_window_time: float = field(default_factory=lambda: time.time())
    frame_idx: int = 0


class CVService:
    def __init__(self, summary_interval_s: float = 3.0, idle_timeout_s: float = 300.0) -> None:
        # Load env (dev) for GOOGLE_API_KEY, etc.
        load_dotenv()

        # Load heavy resources ONCE
        device = "cuda" if os.getenv("YOLO_DEVICE", "cuda") == "cuda" else "cpu"
        self.model = YOLO(os.getenv("YOLO_MODEL", "yolov8n.pt")).to(device)
        self.genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

        # Parameters from user's script
        self.classes: List[int] = [0, 15, 16, 1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 56, 57, 59, 60, 61, 71, 72, 62, 74]
        self.DISTANCE_STABILITY_FRAMES = 8
        self.POSITION_STABILITY_FRAMES = 6
        self.PROCESS_EVERY_N_FRAMES = 8
        # SUMMARY_WINDOW_SECONDS governs when to consider summaries (we also keep older timer-based fallback)
        self.SUMMARY_WINDOW_SECONDS = 3
        self.SUMMARY_COOLDOWN_SECONDS = 6

        self._sessions: Dict[str, SessionState] = {}
        self._lock = asyncio.Lock()
        self._summary_interval_s = summary_interval_s
        self._idle_timeout_s = idle_timeout_s
        self._shutdown = False
        self._reaper_task: Optional[asyncio.Task] = asyncio.create_task(self._reaper_loop())
        # Limit concurrent GPU inference if needed
        self._infer_sem = asyncio.Semaphore(int(os.getenv("YOLO_MAX_CONCURRENCY", "1")))

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
        # Optionally adapt parameters per session from params
        sid = str(uuid.uuid4())
        st = SessionState(session_id=sid)
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
                if item["type"] == "frames":
                    frames: List[bytes] = item["frames"]
                    await self._process_frames_payload(st, frames)
                elif item["type"] == "clip":
                    clip = item["clip"]
                    fps = item.get("fps")
                    await self._process_clip_payload(st, clip, fps)

                # Periodic summarization trigger (simple timer-based)
                now = time.time()
                # Window-based summarization like the user's script
                if now - st.last_window_time >= self.SUMMARY_WINDOW_SECONDS:
                    if st.event_buffer and (now - st.last_summary_time) >= self.SUMMARY_COOLDOWN_SECONDS:
                        text = await self._summarize_scene(st.event_buffer)
                        if text:
                            version += 1
                            summary = Summary(ts=now, version=version, text=text)
                            st.latest_summary = summary
                            for cb in list(st.subscribers):
                                with contextlib.suppress(Exception):
                                    cb(summary)
                            st.event_buffer.clear()
                            st.last_summary_time = now
                    st.last_window_time = now
        except asyncio.CancelledError:
            return

    async def _process_frames_payload(self, st: SessionState, frames: List[bytes]) -> None:
        for fb in frames:
            st.frame_idx += 1
            # Decode image bytes
            arr = np.frombuffer(fb, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                continue
            # Sampling
            if st.frame_idx % self.PROCESS_EVERY_N_FRAMES != 0:
                continue
            # Inference (tracking)
            async with self._infer_sem:
                results = await asyncio.to_thread(
                    self.model.track,
                    frame,
                    classes=self.classes,
                    conf=0.8,
                    imgsz=320,
                    verbose=False,
                )
            detections = self._extract_detections(results, frame.shape)
            events = self._update_scene(st, detections)
            if events:
                st.event_buffer.extend(events)

    async def _process_clip_payload(self, st: SessionState, clip_bytes: bytes, fps: Optional[float]) -> None:
        # Save to temp file for OpenCV VideoCapture
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=True) as tmp:
            tmp.write(clip_bytes)
            tmp.flush()
            cap = cv2.VideoCapture(tmp.name)
            try:
                while True:
                    ok, frame = cap.read()
                    if not ok:
                        break
                    st.frame_idx += 1
                    if st.frame_idx % self.PROCESS_EVERY_N_FRAMES != 0:
                        continue
                    async with self._infer_sem:
                        results = await asyncio.to_thread(
                            self.model.track,
                            frame,
                            classes=self.classes,
                            conf=0.8,
                            imgsz=320,
                            verbose=False,
                        )
                    detections = self._extract_detections(results, frame.shape)
                    events = self._update_scene(st, detections)
                    if events:
                        st.event_buffer.extend(events)
            finally:
                cap.release()

    async def _summarize_scene(self, events: List[Any]) -> str:
        if not events:
            return ""
        prompt = f"""
You are describing a visual scene to a blind user.
Summarize the following observed changes clearly and concisely.

Events:
{events}
"""
        try:
            r = await asyncio.to_thread(
                self.genai_client.models.generate_content,
                model=os.getenv("GEMINI_MODEL", "gemini-3-flash-preview"),
                contents=prompt,
            )
            return self._extract_gemini_text(r)
        except Exception:
            return ""

    def _extract_gemini_text(self, response: Any) -> str:
        if hasattr(response, "text") and response.text:
            return str(response.text).strip()
        if hasattr(response, "candidates") and response.candidates:
            parts = getattr(response.candidates[0].content, "parts", [])
            texts = [getattr(p, "text", "") for p in parts if getattr(p, "text", "")]
            return " ".join(texts).strip()
        return ""

    def _classify_position(self, x: float, w: float) -> str:
        if x < w * 0.33:
            return "left"
        if x > w * 0.66:
            return "right"
        return "center"

    def _classify_distance(self, area: float, frame_area: float) -> str:
        r = area / frame_area
        if r > 0.25:
            return "very_close"
        if r > 0.1:
            return "near"
        return "far"

    def _hysteresis_update(self, stable, candidate, count, new, threshold):
        if new == stable:
            return stable, None, 0, False
        if candidate == new:
            count += 1
        else:
            candidate = new
            count = 1
        if count >= threshold:
            return new, None, 0, True
        return stable, candidate, count, False

    def _extract_detections(self, results: Any, shape: Any) -> List[Dict[str, Any]]:
        h, w, _ = shape
        frame_area = h * w
        boxes = results[0].boxes
        if boxes.id is None:
            return []
        detections: List[Dict[str, Any]] = []
        for box, tid, cls in zip(
            boxes.xyxy.cpu().numpy(),
            boxes.id.cpu().numpy(),
            boxes.cls.cpu().numpy(),
        ):
            x1, y1, x2, y2 = box
            area = float((x2 - x1) * (y2 - y1))
            xc = float((x1 + x2) / 2)
            detections.append(
                {
                    "type": self.model.names[int(cls)],
                    "id": int(tid),
                    "position": self._classify_position(xc, w),
                    "distance": self._classify_distance(area, frame_area),
                }
            )
        return detections

    def _update_scene(self, st: SessionState, detections: List[Dict[str, Any]]) -> List[Any]:
        events: List[Any] = []
        for d in detections:
            oid = f"{d['type']}_{d['id']}"
            if oid not in st.scene_objects:
                st.scene_objects[oid] = {
                    "type": d["type"],
                    "position": d["position"],
                    "distance": d["distance"],
                    "pc": None,
                    "pcn": 0,
                    "dc": None,
                    "dcn": 0,
                }
                events.append(("new_object", d))
                continue
            o = st.scene_objects[oid]
            o["distance"], o["dc"], o["dcn"], dc = self._hysteresis_update(
                o["distance"], o["dc"], o["dcn"], d["distance"], self.DISTANCE_STABILITY_FRAMES
            )
            if dc:
                events.append(
                    (
                        "distance_change",
                        {
                            "type": o["type"],
                            "id": d["id"],
                            "position": o["position"],
                            "distance": o["distance"],
                        },
                    )
                )
            o["position"], o["pc"], o["pcn"], pc = self._hysteresis_update(
                o["position"], o["pc"], o["pcn"], d["position"], self.POSITION_STABILITY_FRAMES
            )
            if pc:
                events.append(
                    (
                        "position_change",
                        {
                            "type": o["type"],
                            "id": d["id"],
                            "position": o["position"],
                            "distance": o["distance"],
                        },
                    )
                )
        return events


# Singleton helpers
_service: Optional[CVService] = None


def init_cv_service() -> None:
    global _service
    if _service is None:
        _service = CVService()


def get_cv_service() -> CVService:
    assert _service is not None, "CVService not initialized. Call init_cv_service() during startup."
    return _service
