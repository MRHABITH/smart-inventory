from pydantic import BaseModel
from typing import List, Optional

class DashboardStats(BaseModel):
    total_products: int
    low_stock_alerts: int
    total_warehouses: int
    stock_value: float

class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_alerts: List[dict]
