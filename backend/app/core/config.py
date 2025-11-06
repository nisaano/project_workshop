from pydantic_settings import BaseSettings
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    OPENAI_API_KEY: str = "dummy-key-for-testing"
    OPENAI_MODEL: str = "gpt-4"
    LOCAL_AI_URL: str = "http://localhost:5000"
    FRONTEND_URL: str = "http://localhost:3000"


    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = f"{BASE_DIR}/.env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Игнорировать лишние переменные в .env


settings = Settings()