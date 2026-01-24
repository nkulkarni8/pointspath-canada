import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./points_optimizer.db")
    
    # Fix for Render/Neon PostgreSQL URLs
    # They use postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS
    ALLOWED_ORIGINS: list = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:5173,http://localhost:5174"
    ).split(",")
    
    # API Configuration
    API_TITLE: str = "PointsPath Canada API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = """
    API for optimizing Canadian credit card points for travel.
    
    ## Features
    * Calculate points needed for specific routes
    * Generate earning strategies
    * Calculate points gaps with personalized plans
    * Search and filter credit cards
    
    ## About
    PointsPath Canada helps Canadians maximize their credit card points
    to achieve their travel goals through smart optimization and planning.
    """

# Create settings instance
settings = Settings()

# Debug print (only in development)
if settings.ENVIRONMENT == "development":
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    print(f"🗄️  Database: {settings.DATABASE_URL[:50]}...")
    print(f"🌐 CORS Origins: {settings.ALLOWED_ORIGINS}")