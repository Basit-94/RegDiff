from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Ensure .env.local and .env are automatically loaded
root_path = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(root_path / ".env.local")
load_dotenv(root_path / ".env")
load_dotenv(".env.local")
load_dotenv(".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=[".env.local", ".env"], extra="allow")

    PROJECT_NAME: str = "RegDiff"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = "sqlite+aiosqlite:///./regdiff.db"
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    ENVIRONMENT: str = "development"

settings = Settings()
