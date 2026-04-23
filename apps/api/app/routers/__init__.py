from app.routers.recommend import router as recommend_router
from app.routers.feedback import router as feedback_router
from app.routers.admin import router as admin_router
from app.routers.chat import router as chat_router

__all__ = ["recommend_router", "feedback_router", "admin_router", "chat_router"]
