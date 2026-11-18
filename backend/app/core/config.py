import os
from pathlib import Path
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zoho Data Migration Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "tauri://localhost"
    ]
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./storage/migration_assistant.db",
        description="SQLAlchemy database URL. e.g. postgresql://user:pass@localhost:5432/zoho_migration"
    )
    
    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    ASYNC_MODE: str = Field(
        default="in_memory",
        description="'celery' or 'in_memory' for running background ingestion tasks"
    )
    
    # Storage
    STORAGE_DIR: Path = Path("./storage/uploads")
    MAX_FILE_SIZE_MB: int = 100
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()

# Ensure local storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
