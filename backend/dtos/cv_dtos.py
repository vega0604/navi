from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional


class StartSessionRequest(BaseModel):
    sampling_rate: Optional[int] = Field(default=None, description="Frontend sampling rate N (every N frames)")
    summary_interval_s: Optional[float] = Field(default=None, description="Override server summary interval")


class StartSessionResponse(BaseModel):
    session_id: str


class StopSessionRequest(BaseModel):
    session_id: str


class StopSessionResponse(BaseModel):
    ok: bool = True


class LatestSummaryResponse(BaseModel):
    session_id: str
    ts: Optional[float] = None
    version: Optional[int] = None
    text: Optional[str] = None
    audio_url: Optional[str] = None
    extra: Optional[dict] = None
