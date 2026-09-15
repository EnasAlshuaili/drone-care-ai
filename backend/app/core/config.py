"""
Central application configuration.

All environment-dependent values (database, auth secrets, CORS, ML artifact
paths) are read from environment variables here and nowhere else, so the rest
of the codebase never reads os.environ directly. See ../../.env.example at
the repository root for the full list of supported variables.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    APP_NAME: str = "DroneCare API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # --- CORS (local React/Vite dev server by default) ---
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # --- Database ---
    DATABASE_URL: str = ""

    # --- Auth (JWT carried in an HttpOnly cookie — see core/security.py) ---
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_COOKIE_NAME: str = "dronecare_access_token"
    # False for local http dev; must be True whenever served over https.
    COOKIE_SECURE: bool = False

    # --- ML artifact locations (not yet loaded — prepared for the AI integration
    # phase; each path is independently configurable so the served model/scaler/
    # encoder set can be swapped via environment variables without code changes) ---
    ML_MODEL_PATH: str = "../ann2_model.h5"
    ML_SCALER_PATH: str = "../scaler2.pkl"
    ML_ENCODERS_PATH: str = "../encoders.pkl"

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance so the .env file is parsed only once."""
    return Settings()
