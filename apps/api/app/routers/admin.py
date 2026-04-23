"""
GET /admin/metrics   → usage summary
GET /admin/feedback  → list all feedback rows

All admin routes require the X-Admin-Token header.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import Feedback, RequestLog, get_session
from app.schemas import FeedbackRow, MetricsResponse

router = APIRouter(prefix="/admin", tags=["admin"])


def _verify_auth(
    x_admin_id: str = Header(default=""),
    x_admin_password: str = Header(default="")
) -> None:
    if x_admin_id.strip() != settings.admin_id or x_admin_password.strip() != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")


@router.get("/metrics", response_model=MetricsResponse, dependencies=[Depends(_verify_auth)])
async def get_metrics(session: Session = Depends(get_session)) -> MetricsResponse:
    total_req = session.execute(select(func.count()).select_from(RequestLog)).scalar_one()
    total_fb = session.execute(select(func.count()).select_from(Feedback)).scalar_one()
    helpful_yes = session.execute(
        select(func.count()).select_from(Feedback).where(Feedback.helpful.is_(True))
    ).scalar_one()
    helpful_no = total_fb - helpful_yes

    return MetricsResponse(
        total_recommend_requests=total_req,
        total_feedback=total_fb,
        helpful_yes=helpful_yes,
        helpful_no=helpful_no,
    )


@router.get("/feedback", response_model=list[FeedbackRow], dependencies=[Depends(_verify_auth)])
async def list_feedback(session: Session = Depends(get_session)) -> list[FeedbackRow]:
    result = session.execute(
        select(Feedback).order_by(Feedback.created_at.desc()).limit(100)
    )
    rows = result.scalars().all()
    return [
        FeedbackRow(
            id=r.id,
            recommendation_id=r.recommendation_id,
            helpful=r.helpful,
            comment=r.comment,
            created_at=str(r.created_at),
        )
        for r in rows
    ]
