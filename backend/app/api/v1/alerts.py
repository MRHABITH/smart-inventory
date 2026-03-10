from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert import AlertReadRequest
from app.core.deps import get_current_user

router = APIRouter(prefix="/alerts")


@router.get("")
def list_alerts(
    unread_only: bool = False,
    severity: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Alert).filter(Alert.company_id == current_user.company_id)

    if unread_only:
        query = query.filter(Alert.is_read == False)
    if severity:
        query = query.filter(Alert.severity == severity.upper())

    total = query.count()
    alerts = query.order_by(Alert.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for a in alerts:
        result.append({
            "id": str(a.id),
            "alert_type": a.alert_type,
            "message": a.message,
            "severity": a.severity,
            "is_read": a.is_read,
            "created_at": a.created_at,
            "product_name": a.product.name if a.product else None,
            "warehouse_name": a.warehouse.name if a.warehouse else None,
        })

    return {"data": result, "total": total, "page": page, "limit": limit}


@router.post("/mark-read")
def mark_alerts_read(
    payload: AlertReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Alert).filter(
        Alert.id.in_(payload.alert_ids),
        Alert.company_id == current_user.company_id,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": f"{len(payload.alert_ids)} alerts marked as read"}


@router.post("/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Alert).filter(
        Alert.company_id == current_user.company_id,
        Alert.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All alerts marked as read"}
