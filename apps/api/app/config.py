import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "sqlite:///./crs.db"

    # Auth
    admin_id: str = "admin"
    admin_password: str = "Sneha@2003"

    # External APIs (all optional — system works without them)
    openweather_api_key: str = ""   # optional fallback; Open-Meteo is used by default

    # Gemini AI Assistant (free key from https://aistudio.google.com/app/apikey)
    gemini_api_key: str = ""        # set GEMINI_API_KEY env var to enable AI chat

    # ML artifact
    model_artifact_path: str = "ml_artifacts/model.joblib"

    # CORS
    # Supports either:
    # - JSON array:  ["https://myapp.vercel.app", "https://example.com"]
    # - Comma-separated string: https://myapp.vercel.app, https://example.com
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def _parse_allowed_origins(cls, value):
        if value is None:
            return value

        if isinstance(value, (list, tuple)):
            return list(value)

        if isinstance(value, str):
            s = value.strip()
            if not s:
                return []

            if s.startswith("["):
                try:
                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    pass

            return [part.strip() for part in s.split(",") if part.strip()]

        return value

    # Server
    port: int = 8000


settings = Settings()
