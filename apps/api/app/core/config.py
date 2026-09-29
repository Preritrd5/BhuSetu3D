"""
BhuSetu 3D Core Configuration
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
from typing import List, Union, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "BhuSetu 3D API"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    API_V1_PREFIX: str = "/api/v1"

    # Server settings
    API_HOST: str = Field(default="0.0.0.0", env="API_HOST")
    API_PORT: int = Field(default=8000, env="API_PORT")

    # Supabase Managed PostgreSQL + PostGIS (Sole Database Platform)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.qcobqjtrhhdwzmadfykq.supabase.co:5432/postgres",
        env="DATABASE_URL"
    )

    # Supabase Auth Settings
    SUPABASE_URL: str = Field(
        default="https://qcobqjtrhhdwzmadfykq.supabase.co", 
        env="SUPABASE_URL"
    )
    SUPABASE_PUBLISHABLE_KEY: str = Field(
        default="sb_publishable_lCZMVQiaV9X-GnUjdYx-TA_2iHm3AHp", 
        env="SUPABASE_PUBLISHABLE_KEY"
    )
    # Service role secret key for administrative actions / backend bypass
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
    # Optional JWT Secret for local high-speed HMAC verification
    SUPABASE_JWT_SECRET: str = Field(default="", env="SUPABASE_JWT_SECRET")

    # Gemini AI Spatial Investigator Settings (Phase 10)
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-3.8-flash", env="GEMINI_MODEL")

    # Operational & Security Settings (Phase 14)
    DEBUG: bool = Field(default=False, env="DEBUG")
    SECRET_KEY: str = Field(default="", env="SECRET_KEY")
    MAX_REQUEST_SIZE_BYTES: int = Field(default=52428800, env="MAX_REQUEST_SIZE_BYTES")  # 50MB
    RATE_LIMIT_ENABLED: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    REQUEST_TIMEOUT_SECONDS: int = Field(default=60, env="REQUEST_TIMEOUT_SECONDS")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")

    # CORS Settings
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://bhusetu3d.vercel.app",
            "https://bhusetu-3d.vercel.app",
        ],
        env="CORS_ORIGINS"
    )
    CORS_ORIGIN_REGEX: Optional[str] = Field(
        default=r"^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$",
        env="CORS_ORIGIN_REGEX"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        origins: List[str] = []
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    loaded = json.loads(v_str)
                    if isinstance(loaded, list):
                        origins = [str(i).strip().rstrip("/") for i in loaded if str(i).strip()]
                except Exception:
                    pass
            if not origins:
                origins = [i.strip().strip('"').strip("'").rstrip("/") for i in v_str.strip("[]").split(",") if i.strip()]
        elif isinstance(v, (list, tuple, set)):
            origins = [str(i).strip().rstrip("/") for i in v if str(i).strip()]

        # Mandatory trusted production origins that must always be allowed across all deployments
        trusted_production_origins = [
            "https://bhusetu3d.vercel.app",
            "https://bhusetu-3d.vercel.app",
        ]
        for trusted in trusted_production_origins:
            if trusted not in origins:
                origins.append(trusted)

        return origins

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
