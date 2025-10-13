from pydantic_settings import BaseSettings
from pydantic import AnyUrl
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: AnyUrl
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    BACKEND_CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"

settings = Settings()
