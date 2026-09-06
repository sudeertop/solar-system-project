"""Solar System body content endpoints. Mounted on api_router (prefix /api)."""

from fastapi import APIRouter, HTTPException

from data.bodies_data import BODIES, OVERVIEW
from lib.db import db
from models.bodies import Body, Overview

router = APIRouter(tags=["bodies"])

_FALLBACK = {b.id: b for b in BODIES}


async def _load_all() -> list[Body]:
    """Mongo is the source of truth once seeded; the bundled data keeps the API
    working on a fresh database without a seed run."""
    docs = await db.bodies.find({}, {"_id": 0}).to_list(50)
    if not docs:
        return BODIES
    by_id = {d["id"]: Body(**d) for d in docs}
    # preserve the canonical ordering from the bundled list
    return [by_id.get(b.id, b) for b in BODIES]


@router.get("/overview", response_model=Overview)
async def get_overview() -> Overview:
    return OVERVIEW


@router.get("/bodies", response_model=list[Body])
async def list_bodies() -> list[Body]:
    return await _load_all()


@router.get("/bodies/{body_id}", response_model=Body)
async def get_body(body_id: str) -> Body:
    doc = await db.bodies.find_one({"id": body_id}, {"_id": 0})
    if doc:
        return Body(**doc)
    if body_id in _FALLBACK:
        return _FALLBACK[body_id]
    raise HTTPException(status_code=404, detail=f"Bilinmeyen gök cismi: {body_id}")
