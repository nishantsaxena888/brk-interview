import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from .database import Base

# ==============================================================================
# SQLAlchemy ORM Models (PostgreSQL / SQLite Compatible)
# ==============================================================================

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(128), index=True, default="default-user")
    module_id = Column(String(64), index=True, nullable=False)
    lesson_id = Column(String(64), nullable=True)
    completed_sections = Column(JSON, default=list)
    is_completed = Column(Boolean, default=False)
    mastery_level = Column(String(32), default="beginner")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(128), index=True, default="default-user")
    module_id = Column(String(64), index=True, nullable=False)
    question_id = Column(String(64), nullable=False)
    selected_option = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)


class ChallengeSubmission(Base):
    __tablename__ = "challenge_submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(128), index=True, default="default-user")
    module_id = Column(String(64), index=True, nullable=False)
    challenge_id = Column(String(64), nullable=False)
    status = Column(String(32), default="completed")
    code_submitted = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)


class UserNote(Base):
    __tablename__ = "user_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(128), index=True, default="default-user")
    module_id = Column(String(64), index=True, nullable=False)
    note_content = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


# ==============================================================================
# Pydantic Schemas (Request / Response validation)
# ==============================================================================

class ProgressSyncRequest(BaseModel):
    user_id: Optional[str] = "default-user"
    module_id: str
    lesson_id: Optional[str] = None
    completed_sections: List[str] = Field(default_factory=list)
    is_completed: bool = False
    mastery_level: Optional[str] = "beginner"


class ProgressSyncResponse(BaseModel):
    status: str
    message: str
    module_id: str
    completed_count: int


class QuizSubmitRequest(BaseModel):
    user_id: Optional[str] = "default-user"
    module_id: str
    question_id: str
    selected_option: int
    correct_option: Optional[int] = None


class QuizSubmitResponse(BaseModel):
    status: str
    is_correct: bool
    explanation: Optional[str] = None


class CodeExecutionRequest(BaseModel):
    code: str
    language: Optional[str] = "python"
    timeout_seconds: Optional[int] = 10


class CodeExecutionResponse(BaseModel):
    status: str
    stdout: str
    stderr: str
    execution_time_ms: float
