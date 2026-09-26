import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..database import get_db

router = APIRouter(tags=["Health"])

START_TIME = datetime.datetime.utcnow()

@router.get("/health")
@router.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Comprehensive health check for container orchestration and Render deployment."""
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    uptime_seconds = (datetime.datetime.utcnow() - START_TIME).total_seconds()

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "service": "AWS Lambda Masterclass Platform",
        "database": db_status,
        "uptime_seconds": round(uptime_seconds, 2),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

@router.get("/ping")
@router.get("/api/ping")
async def ping():
    """Lightweight ping endpoint for Render keep-alive and zero-downtime probing."""
    return "pong"
