from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.core.deps import get_current_user
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/inventory-valuation")
def inventory_valuation_report(
    format: str = Query("json", regex="^(json|csv|excel)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ReportService(db, str(current_user.company_id))
    data = service.inventory_valuation()

    if format == "json":
        return data
    elif format == "csv":
        csv_content = service.to_csv(data["items"], filename="inventory_valuation")
        return StreamingResponse(
            csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=inventory_valuation.csv"},
        )
    elif format == "excel":
        excel_content = service.to_excel(data["items"], sheet_name="Inventory Valuation")
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=inventory_valuation.xlsx"},
        )


@router.get("/stock-movement")
def stock_movement_report(
    days: int = Query(30, ge=1, le=365),
    format: str = Query("json", regex="^(json|csv|excel)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ReportService(db, str(current_user.company_id))
    data = service.stock_movement_report(days=days)

    if format == "json":
        return data
    elif format == "csv":
        csv_content = service.to_csv(data, filename="stock_movement")
        return StreamingResponse(
            csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=stock_movement.csv"},
        )
    elif format == "excel":
        excel_content = service.to_excel(data, sheet_name="Stock Movement")
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=stock_movement.xlsx"},
        )


@router.get("/warehouse-stock")
def warehouse_stock_report(
    format: str = Query("json", regex="^(json|csv|excel)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ReportService(db, str(current_user.company_id))
    data = service.warehouse_stock_report()

    if format == "json":
        return data
    
    # Flatten the data for warehouse stock export
    flat_data = []
    for wh in data:
        for p in wh["products"]:
            flat_data.append({
                "Warehouse": wh["warehouse"],
                "Location": wh["location"],
                "Utilization %": wh["utilization"],
                "Product": p["name"],
                "SKU": p["sku"],
                "Quantity": p["quantity"],
                "Status": p["status"]
            })

    if format == "csv":
        csv_content = service.to_csv(flat_data, filename="warehouse_stock")
        return StreamingResponse(
            csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=warehouse_stock.csv"},
        )
    elif format == "excel":
        excel_content = service.to_excel(flat_data, sheet_name="Warehouse Stock")
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=warehouse_stock.xlsx"},
        )
