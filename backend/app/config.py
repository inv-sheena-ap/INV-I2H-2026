"""
Application configuration from environment variables.
Uses .env in backend root when present.
"""
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """App settings; override via env or .env file."""

    # JWT
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # Database: MySQL only. For Docker use mysql:3306; for local use localhost:3307 (or your MySQL port).
    database_url: str = "mysql+pymysql://app:apppass@localhost:3307/ecommerce"

    # CORS
    cors_origins: str = "*"

    # Optional: email that gets admin role on signup
    admin_email: str | None = None

    # Product image uploads
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 5
    allowed_image_types: List[str] = ["image/jpeg", "image/png", "image/webp"]

    @property
    def cors_origins_list(self) -> List[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
# Resolve upload dir relative to backend root
UPLOAD_DIR = Path(__file__).resolve().parent.parent / settings.upload_dir
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
