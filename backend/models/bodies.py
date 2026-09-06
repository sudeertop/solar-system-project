"""Pydantic v2 models for Solar System bodies. Mirrored in frontend/src/site/types.ts."""

from typing import List, Literal, Optional

from pydantic import BaseModel


class BodyStat(BaseModel):
    label: str
    value: str


class BodySection(BaseModel):
    heading: str
    body: str


class Body(BaseModel):
    id: str
    name: str
    kicker: str
    body_type: str
    # "page" -> clicking navigates to `href`; "panel" -> clicking only swaps the left panel
    mode: Literal["page", "panel"]
    href: Optional[str] = None
    lead: str
    stats: List[BodyStat] = []
    sections: List[BodySection] = []
    color: str
    radius: float
    orbit_radius: float
    orbit_period_days: Optional[float] = None


class Overview(BaseModel):
    kicker: str
    title: str
    lead: str
    sections: List[BodySection] = []
    hint: str
