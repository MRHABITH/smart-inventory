from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base
from datetime import datetime

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=True)
    alert_type = Column(String(50), nullable=False) # LOW_STOCK|OUT_OF_STOCK|OVERSTOCK|HIGH_DEMAND|SLOW_MOVING
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="WARNING") # INFO|WARNING|CRITICAL
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="alerts")
    product = relationship("Product", back_populates="alerts")
    warehouse = relationship("Warehouse", back_populates="alerts")

Index("ix_alerts_company_is_read", Alert.company_id, Alert.is_read)
Index("ix_alerts_created_at", Alert.created_at)
