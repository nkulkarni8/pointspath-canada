from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class CreditCard(Base):
    """Credit card information"""
    __tablename__ = "credit_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    issuer = Column(String, nullable=False)  # TD, RBC, CIBC, Amex, Scotia, BMO
    program = Column(String, nullable=False)  # Aeroplan, Avion, Scene+, etc.
    earn_rate = Column(String, nullable=False)
    annual_fee = Column(Integer, nullable=False)
    welcome_bonus = Column(Integer, nullable=False)
    categories = Column(JSON)  # ["dining", "groceries", "gas", etc.]
    transfer_partners = Column(JSON)  # ["Air Canada", "United", etc.]
    is_active = Column(Boolean, default=True)
    
class Route(Base):
    """Flight route and points requirements"""
    __tablename__ = "routes"
    
    id = Column(Integer, primary_key=True, index=True)
    from_city = Column(String, nullable=False, index=True)
    to_city = Column(String, nullable=False, index=True)
    distance_km = Column(Integer, nullable=False)
    route_type = Column(String)  # domestic, short-haul, long-haul
    
    # Points requirements by class
    economy_points = Column(Integer, nullable=False)
    premium_economy_points = Column(Integer)
    business_points = Column(Integer)
    first_points = Column(Integer)
    
    # Airline program
    program = Column(String, nullable=False)  # Aeroplan, Avios, etc.
    
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