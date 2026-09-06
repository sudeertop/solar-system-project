"""Idempotent seed for the `bodies` collection.  Run: cd /app/backend && python seed.py"""

import asyncio

from data.bodies_data import BODIES
from lib.db import db, ensure_indexes


async def main() -> None:
    await ensure_indexes()
    for body in BODIES:
        await db.bodies.replace_one({"id": body.id}, body.model_dump(), upsert=True)
    count = await db.bodies.count_documents({})
    print(f"seeded bodies: {count}")


if __name__ == "__main__":
    asyncio.run(main())
