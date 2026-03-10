from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.product import Product
from app.models.alert import Alert
from app.models.warehouse import Warehouse
from app.models.inventory import InventoryItem, StockMovement
from app.models.user import User
from app.core.deps import get_current_active_user

from datetime import datetime, timedelta

router = APIRouter()

@router.get("/")
def get_dashboard_stats(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    company_id = current_user.company_id
    
    # Aggregate basic catalog stats
    total_products = db.query(Product).filter(Product.company_id == company_id).count()
    unread_alerts = db.query(Alert).filter(Alert.company_id == company_id, Alert.is_read == False).count()
    total_warehouses = db.query(Warehouse).filter(Warehouse.company_id == company_id).count()
    
    # Calculate complete value
    stock_value = db.query(func.sum(InventoryItem.quantity * Product.price))\
        .join(Product, InventoryItem.product_id == Product.id)\
        .filter(Product.company_id == company_id).scalar() or 0.0

    # Inventory distribution stats
    out_of_stock_count = db.query(InventoryItem).join(Warehouse).filter(Warehouse.company_id == company_id, InventoryItem.quantity == 0).count()
    low_stock_count = db.query(InventoryItem).join(Warehouse).filter(Warehouse.company_id == company_id, InventoryItem.quantity > 0, InventoryItem.quantity <= InventoryItem.min_stock).count()
    overstock_count = db.query(InventoryItem).join(Warehouse).filter(Warehouse.company_id == company_id, InventoryItem.quantity >= InventoryItem.max_stock).count()

    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    total_stock_movements_today = db.query(StockMovement).filter(
        StockMovement.company_id == company_id,
        StockMovement.created_at >= today_start
    ).count()

    # Recent Alerts Array
    recent_alerts = db.query(Alert)\
        .filter(Alert.company_id == company_id)\
        .order_by(Alert.created_at.desc())\
        .limit(5).all()

    alerts_data = [{
        "id": str(a.id),
        "message": a.message,
        "severity": getattr(a, 'severity', 'HIGH'),
        "created_at": a.created_at,
        "is_read": getattr(a, 'is_read', False)
    } for a in recent_alerts]

    # Top Selling Products Array
    out_movements = db.query(
        StockMovement.product_id,
        func.sum(StockMovement.quantity).label('total_sold')
    ).filter(
        StockMovement.company_id == company_id,
        StockMovement.movement_type == "OUT"
    ).group_by(StockMovement.product_id).order_by(func.sum(StockMovement.quantity).desc()).limit(5).all()

    top_products = []
    for mov in out_movements:
        prod = db.query(Product).filter(Product.id == mov.product_id).first()
        if prod:
            top_products.append({
                "product_name": prod.name,
                "sku": prod.sku,
                "total_sold": mov.total_sold,
                "total_value": float(prod.price * mov.total_sold)
            })

    # Warehouse Utilization Array
    warehouses = db.query(Warehouse).filter(Warehouse.company_id == company_id).all()
    warehouse_utilization = []
    for w in warehouses:
        total_qty = db.query(func.sum(InventoryItem.quantity)).filter(InventoryItem.warehouse_id == w.id).scalar() or 0
        cap = getattr(w, 'capacity', 1000) or 1000
        pct = round((total_qty / cap) * 100, 1) if cap > 0 else 0
        warehouse_utilization.append({
            "warehouse_name": w.name,
            "total_quantity": total_qty,
            "capacity": cap,
            "utilization_percent": pct
        })

    # Stock Trend Array (Last 14 days)
    today = datetime.utcnow().date()
    stock_trend = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        start_of_day = datetime.combine(d, datetime.min.time())
        end_of_day = datetime.combine(d, datetime.max.time())
        
        stock_in = db.query(func.sum(StockMovement.quantity)).filter(
            StockMovement.company_id == company_id,
            StockMovement.movement_type == "IN",
            StockMovement.created_at >= start_of_day,
            StockMovement.created_at <= end_of_day
        ).scalar() or 0
        
        stock_out = db.query(func.sum(StockMovement.quantity)).filter(
            StockMovement.company_id == company_id,
            StockMovement.movement_type == "OUT",
            StockMovement.created_at >= start_of_day,
            StockMovement.created_at <= end_of_day
        ).scalar() or 0
        
        stock_trend.append({
            "date": d.strftime("%b %d"),
            "stock_in": stock_in,
            "stock_out": stock_out
        })

    return {
        "stats": {
            "total_products": total_products,
            "total_inventory_value": float(stock_value),
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "warehouse_count": total_warehouses,
            "unread_alerts": unread_alerts,
            "total_stock_movements_today": total_stock_movements_today,
            "overstock_count": overstock_count
        },
        "stock_trend": stock_trend,
        "warehouse_utilization": warehouse_utilization,
        "top_products": top_products,
        "recent_alerts": alerts_data
    }
