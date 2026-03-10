from pydantic import BaseModel
from typing import Optional

class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    company_id: int

    model_config = {"from_attributes": True}
