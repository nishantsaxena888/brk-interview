import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..database import get_db
from ..models import QuizSubmission, QuizSubmitRequest, QuizSubmitResponse

router = APIRouter(prefix="/api/quizzes", tags=["Quizzes"])

@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz_answer(payload: QuizSubmitRequest, db: AsyncSession = Depends(get_db)):
    """Stores quiz answer submission and calculates correctness."""
    try:
        is_correct = (
            payload.selected_option == payload.correct_option 
            if payload.correct_option is not None 
            else True
        )

        submission = QuizSubmission(
            user_id=payload.user_id or "default-user",
            module_id=payload.module_id,
            question_id=payload.question_id,
            selected_option=payload.selected_option,
            is_correct=is_correct,
            submitted_at=datetime.datetime.utcnow()
        )
        db.add(submission)
        await db.commit()
        await db.refresh(submission)

        return QuizSubmitResponse(
            status="recorded",
            is_correct=is_correct,
            explanation="Response recorded in masterclass database."
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record quiz submission: {str(e)}")


@router.get("/stats")
async def get_quiz_stats(user_id: str = "default-user", module_id: str = None, db: AsyncSession = Depends(get_db)):
    """Returns aggregated quiz performance metrics for user."""
    query = select(QuizSubmission).where(QuizSubmission.user_id == user_id)
    if module_id:
        query = query.where(QuizSubmission.module_id == module_id)
        
    result = await db.execute(query)
    records = result.scalars().all()

    total = len(records)
    correct = sum(1 for r in records if r.is_correct)
    accuracy = round((correct / total * 100), 1) if total > 0 else 0.0

    return {
        "user_id": user_id,
        "module_id": module_id,
        "total_submissions": total,
        "correct_submissions": correct,
        "accuracy_percent": accuracy
    }
