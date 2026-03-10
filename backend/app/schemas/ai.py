from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AIQueryRequest(BaseModel):
    query: str
    context: Optional[str] = None

class AIQueryResponse(BaseModel):
    response: str
    action_items: Optional[List[str]] = []

class ProductDescriptionRequest(BaseModel):
    product_name: str
    category: str
    features: List[str]
    brand: Optional[str] = ""
    price: Optional[float] = 0.0

class ProductDescriptionResponse(BaseModel):
    short_description: str
    detailed_description: str
    bullet_highlights: List[str]
    seo_keywords: List[str]

class InventoryInsightsResponse(BaseModel):
    summary: str
    critical_items: List[Dict[str, Any]]
    recommendations: List[str]
    reorder_urgency: str
    total_items_analyzed: int
    items_needing_attention: int

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []

class DemandForecastRequest(BaseModel):
    product_id: str
    days_ahead: int = 30

class DemandForecastResponse(BaseModel):
    predicted_demand: int
    daily_average: float
    recommended_stock: int
    confidence: str
    forecast_summary: str
    trend: str
    reorder_date: str
