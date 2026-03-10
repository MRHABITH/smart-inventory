from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app.models.warehouse import Warehouse
from app.models.inventory import InventoryItem
from app.models.user import User
from app.core.deps import get_current_active_user

router = APIRouter()

class WarehouseCreate(BaseModel):
    name: str
    location: str = ""
    capacity: int = 10000

@router.get("/")
def get_warehouses(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    warehouses = db.query(Warehouse).filter(Warehouse.company_id == current_user.company_id).all()
    
    res = []
    for w in warehouses:
        total_items = db.query(func.count(InventoryItem.id)).filter(InventoryItem.warehouse_id == w.id, InventoryItem.quantity > 0).scalar() or 0
        total_quantity = db.query(func.sum(InventoryItem.quantity)).filter(InventoryItem.warehouse_id == w.id).scalar() or 0
        
        cap = w.capacity or 10000
        util_pct = round((total_quantity / cap) * 100, 1) if cap > 0 else 0
        
        res.append({
            "id": w.id,
            "company_id": w.company_id,
            "name": w.name,
            "location": w.location,
            "capacity": w.capacity,
            "is_active": w.is_active,
            "created_at": w.created_at,
            "total_items": total_items,
            "total_quantity": total_quantity,
            "utilization_percent": util_pct
        })
        
    return {"data": res}

@router.post("/")
def create_warehouse(payload: WarehouseCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    warehouse = Warehouse(
        name=payload.name,
        location=payload.location,
        capacity=payload.capacity,
        company_id=current_user.company_id
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse

@router.put("/{warehouse_id}")
def update_warehouse(warehouse_id: str, payload: WarehouseCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id, Warehouse.company_id == current_user.company_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    warehouse.name = payload.name
    warehouse.location = payload.location
    warehouse.capacity = payload.capacity
    db.commit()
    db.refresh(warehouse)
    return warehouse

@router.delete("/{warehouse_id}")
def delete_warehouse(warehouse_id: str, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id, Warehouse.company_id == current_user.company_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    db.delete(warehouse)
    db.commit()
    return {"message": "Deleted"}
