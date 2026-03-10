from pydantic import BaseModel
from typing import Optional

class InventoryBase(BaseModel):
    quantity: int
    min_stock_level: Optional[int] = 10
    max_stock_level: Optional[int] = 1000

class InventoryCreate(InventoryBase):
    product_id: int
    warehouse_id: int

class InventoryResponse(InventoryBase):
    id: int
    product_id: int
    warehouse_id: int

    model_config = {"from_attributes": True}
