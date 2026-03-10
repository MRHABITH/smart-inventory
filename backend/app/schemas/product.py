from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit_price: float

class ProductCreate(ProductBase):
    supplier_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    company_id: int
    supplier_id: Optional[int] = None

    model_config = {"from_attributes": True}
