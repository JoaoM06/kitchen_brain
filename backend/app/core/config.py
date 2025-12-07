from pydantic_settings import BaseSettings
from pydantic import AnyUrl

class Settings(BaseSettings):
    DATABASE_URL: AnyUrl
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    BACKEND_CORS_ORIGINS: str = "*"
    GEMINI_API_KEY: str
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"

settings = Settings()
