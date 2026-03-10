from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.ai import (
    ProductDescriptionRequest, ProductDescriptionResponse,
    InventoryInsightsResponse, ChatRequest, ChatResponse,
    DemandForecastRequest, DemandForecastResponse,
)
from app.core.deps import get_current_user
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/product-description", response_model=ProductDescriptionResponse)
def generate_description(
    payload: ProductDescriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = ai_service.generate_product_description(
            product_name=payload.product_name,
            category=payload.category,
            features=payload.features,
            brand=payload.brand,
            price=payload.price,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.get("/inventory-insights", response_model=InventoryInsightsResponse)
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return ai_service.get_inventory_insights(
            company_id=str(current_user.company_id), db=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI insight generation failed: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = ai_service.chat_assistant(
            user_message=payload.message,
            company_id=str(current_user.company_id),
            db=db,
            history=[msg.model_dump() for msg in payload.history],
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")


@router.post("/demand-forecast", response_model=DemandForecastResponse)
def demand_forecast(
    payload: DemandForecastRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return ai_service.predict_demand(
            product_id=payload.product_id,
            company_id=str(current_user.company_id),
            db=db,
            days_ahead=payload.days_ahead,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demand forecast failed: {str(e)}")
