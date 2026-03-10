from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base
from datetime import datetime

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)
    name = Column(String(500), nullable=False)
    sku = Column(String(100), nullable=False)
    category = Column(String(255), nullable=True)
    brand = Column(String(255), nullable=True)
    barcode = Column(String(100), nullable=True)
    price = Column(Numeric(10, 2), default=0)
    cost = Column(Numeric(10, 2), default=0)
    description = Column(Text, nullable=True)
    short_description = Column(Text, nullable=True)
    bullet_highlights = Column(JSONB, nullable=True)
    seo_keywords = Column(JSONB, nullable=True)
    images = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    inventories = relationship("InventoryItem", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product")
    alerts = relationship("Alert", back_populates="product")
