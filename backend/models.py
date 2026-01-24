from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, Date, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class CreditCard(Base):
    __tablename__ = "credit_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    issuer = Column(String(100), nullable=True)
    program = Column(String(100), nullable=True)
    earn_rate = Column(String(500), nullable=True)  # Changed to String for descriptions
    annual_fee = Column(Integer, nullable=True)
    welcome_bonus = Column(Integer, nullable=True)
    categories = Column(Text, nullable=True)
    transfer_partners = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class Route(Base):
    __tablename__ = "routes"
    
    id = Column(Integer, primary_key=True, index=True)
    from_city = Column(String(100), nullable=False)
    to_city = Column(String(100), nullable=False)
    distance_km = Column(Integer, nullable=True)
    route_type = Column(String(50), nullable=True)
    economy_points = Column(Integer, nullable=True)
    premium_economy_points = Column(Integer, nullable=True)
    business_points = Column(Integer, nullable=True)
    first_points = Column(Integer, nullable=True)
    program = Column(String(100), nullable=True)

class SpendingCategory(Base):
    """Spending categories for earning optimization"""
    __tablename__ = "spending_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String)
    typical_monthly_spend = Column(Integer)  # Average Canadian household spend
    
class CardEarningRate(Base):
    """Detailed earning rates for cards by category"""
    __tablename__ = "card_earning_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("credit_cards.id"))
    category_id = Column(Integer, ForeignKey("spending_categories.id"))
    points_per_dollar = Column(Float, nullable=False)
    
    card = relationship("CreditCard")
    category = relationship("SpendingCategory")