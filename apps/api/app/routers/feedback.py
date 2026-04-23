"""
POST /feedback
Stores a farmer's thumbs-up / thumbs-down with an optional comment.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models import Feedback, get_session
from app.schemas import FeedbackRequest, FeedbackResponse

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    req: FeedbackRequest,
    session: Session = Depends(get_session),
) -> FeedbackResponse:
    row = Feedback(
        recommendation_id=req.recommendation_id,
        helpful=req.helpful,
        comment=req.comment,
    )
    session.add(row)
    session.commit()
    return FeedbackResponse()
