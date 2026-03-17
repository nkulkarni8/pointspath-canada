from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class CreditCard(Base):
    __tablename__ = "credit_cards"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(255), nullable=False)
    issuer        = Column(String(100), nullable=True)
    program       = Column(String(100), nullable=True)
    earn_rate     = Column(String(500), nullable=True)
    annual_fee    = Column(Integer, nullable=True)
    welcome_bonus = Column(Integer, nullable=True)
    categories    = Column(Text, nullable=True)
    country       = Column(String(10), nullable=True, default="CA")  # CA | US | IN
    is_active     = Column(Boolean, default=True)


class Route(Base):
    __tablename__ = "routes"

    id                      = Column(Integer, primary_key=True, index=True)
    from_city               = Column(String(100), nullable=False)
    to_city                 = Column(String(100), nullable=False)
    distance_km             = Column(Integer, nullable=True)
    route_type              = Column(String(50), nullable=True)
    economy_points          = Column(Integer, nullable=True)
    premium_economy_points  = Column(Integer, nullable=True)
    business_points         = Column(Integer, nullable=True)
    first_points            = Column(Integer, nullable=True)
    program                 = Column(String(100), nullable=True)
    country                 = Column(String(10), nullable=True, default="CA")  # CA | US | IN
