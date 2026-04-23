from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, func
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.config import settings

engine = create_engine(settings.database_url, echo=False, future=True, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(engine, class_=Session, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String(64), index=True)
    village = Column(String(200), nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String(64), index=True)
    helpful = Column(Boolean)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


def init_db() -> None:
    Base.metadata.create_all(engine)


def get_session():
    with SessionLocal() as session:
        yield session
