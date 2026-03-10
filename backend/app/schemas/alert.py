from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AlertBase(BaseModel):
    alert_type: str
    message: str
    severity: str = "MEDIUM"
    is_resolved: Optional[bool] = False
    is_read: Optional[bool] = False

class AlertCreate(AlertBase):
    product_id: Optional[int] = None
    warehouse_id: Optional[int] = None

class AlertResponse(AlertBase):
    id: int
    company_id: int
    product_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class AlertReadRequest(BaseModel):
    alert_ids: List[int]
