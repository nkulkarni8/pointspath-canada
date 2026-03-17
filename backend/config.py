import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pointspath.db")
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    if "postgresql://" in DATABASE_URL and "sslmode" not in DATABASE_URL:
        DATABASE_URL += "?sslmode=require" if "?" not in DATABASE_URL else "&sslmode=require"

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

    API_TITLE: str = "PointsPath API"
    API_VERSION: str = "3.0.0"
    API_DESCRIPTION: str = "Travel rewards optimizer for Canada, USA & India"

    BEEHIIV_API_KEY: str = os.getenv("BEEHIIV_API_KEY", "")
    BEEHIIV_PUB_ID: str  = os.getenv("BEEHIIV_PUB_ID", "")

settings = Settings()
