import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from ..database import get_db
from ..models import UserProgress, ProgressSyncRequest, ProgressSyncResponse

router = APIRouter(prefix="/api/progress", tags=["Progress"])

@router.post("/sync", response_model=ProgressSyncResponse)
async def sync_progress(payload: ProgressSyncRequest, db: AsyncSession = Depends(get_db)):
    """Upserts student learning progress for a given module into PostgreSQL."""
    try:
        stmt = select(UserProgress).where(
            UserProgress.user_id == payload.user_id,
            UserProgress.module_id == payload.module_id
        )
        result = await db.execute(stmt)
        record = result.scalars().first()

        if record:
            # Merge completed sections ensuring uniqueness
            existing_sections = set(record.completed_sections or [])
            merged = list(existing_sections.union(set(payload.completed_sections)))
            record.completed_sections = merged
            record.lesson_id = payload.lesson_id or record.lesson_id
            record.is_completed = payload.is_completed or record.is_completed
            record.mastery_level = payload.mastery_level or record.mastery_level
            record.updated_at = datetime.datetime.utcnow()
        else:
            record = UserProgress(
                user_id=payload.user_id,
                module_id=payload.module_id,
                lesson_id=payload.lesson_id,
                completed_sections=payload.completed_sections,
                is_completed=payload.is_completed,
                mastery_level=payload.mastery_level or "beginner",
                updated_at=datetime.datetime.utcnow()
            )
            db.add(record)

        await db.commit()
        await db.refresh(record)

        return ProgressSyncResponse(
            status="success",
            message="Progress synced successfully",
            module_id=payload.module_id,
            completed_count=len(record.completed_sections or [])
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database sync failed: {str(e)}")


@router.get("/get")
async def get_progress(user_id: str = "default-user", module_id: str = None, db: AsyncSession = Depends(get_db)):
    """Retrieves progress data for a given user and optional module."""
    query = select(UserProgress).where(UserProgress.user_id == user_id)
    if module_id:
        query = query.where(UserProgress.module_id == module_id)
    
    result = await db.execute(query)
    records = result.scalars().all()

    progress_map = {}
    for r in records:
        progress_map[r.module_id] = {
            "completed_sections": r.completed_sections or [],
            "is_completed": r.is_completed,
            "mastery_level": r.mastery_level,
            "last_updated": r.updated_at.isoformat() if r.updated_at else None
        }

    return {
        "user_id": user_id,
        "modules": progress_map
    }


@router.get("/summary")
async def get_progress_summary(user_id: str = "default-user", db: AsyncSession = Depends(get_db)):
    """Aggregates overall progress metrics across all masterclass modules."""
    result = await db.execute(select(UserProgress).where(UserProgress.user_id == user_id))
    records = result.scalars().all()

    total_modules_started = len(records)
    total_modules_completed = sum(1 for r in records if r.is_completed)
    total_sections_completed = sum(len(r.completed_sections or []) for r in records)

    return {
        "user_id": user_id,
        "total_modules_started": total_modules_started,
        "total_modules_completed": total_modules_completed,
        "total_sections_completed": total_sections_completed
    }
