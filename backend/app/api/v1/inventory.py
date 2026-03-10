from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.inventory import InventoryItem, StockMovement
from app.models.product import Product
from app.models.user import User
from app.core.deps import get_current_active_user

router = APIRouter()

class StockAction(BaseModel):
    product_id: str
    warehouse_id: str
    quantity: int
    reference: Optional[str] = None
    note: Optional[str] = None

class StockTransfer(BaseModel):
    product_id: str
    from_warehouse_id: str
    to_warehouse_id: str
    quantity: int
    reference: Optional[str] = None
    note: Optional[str] = None

@router.get("/")
def get_inventory(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem).join(Product).filter(Product.company_id == current_user.company_id)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.sku.ilike(f"%{search}%"))
        )
    items = query.order_by(InventoryItem.updated_at.desc()).all()
    # Build response format expected by frontend
    res = []
    for item in items:
        status = "in_stock"
        if item.quantity == 0:
            status = "out_of_stock"
        elif item.quantity <= item.min_stock:
            status = "low_stock"
        elif item.quantity >= item.max_stock:
            status = "overstock"
            
        res.append({
            "id": item.id,
            "product_id": item.product_id,
            "warehouse_id": item.warehouse_id,
            "quantity": item.quantity,
            "min_stock_level": item.min_stock,
            "max_stock_level": item.max_stock,
            "reorder_point": item.reorder_point,
            "updated_at": item.updated_at,
            "product_name": item.product.name if item.product else None,
            "product_sku": item.product.sku if item.product else None,
            "warehouse_name": item.warehouse.name if item.warehouse else None,
            "status": status
        })
    return {"data": res}

@router.get("/movements")
def get_movements(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    query = db.query(StockMovement).join(Product).filter(StockMovement.company_id == current_user.company_id)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.sku.ilike(f"%{search}%"))
        )
    moves = query.order_by(StockMovement.created_at.desc()).all()
    res = []
    for m in moves:
        res.append({
            "id": m.id,
            "product_id": m.product_id,
            "warehouse_id": m.warehouse_id,
            "movement_type": m.movement_type,
            "quantity": m.quantity,
            "reference": m.reference,
            "created_at": m.created_at,
            "product_name": m.product.name if m.product else None,
            "warehouse_name": m.warehouse.name if m.warehouse else None,
            "user_id": m.user_id,
            "notes": m.notes,
        })
    return {"data": res}

@router.post("/stock-in")
def stock_in(payload: StockAction, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    inv = db.query(InventoryItem).filter_by(product_id=payload.product_id, warehouse_id=payload.warehouse_id).first()
    if not inv:
        inv = InventoryItem(product_id=payload.product_id, warehouse_id=payload.warehouse_id, quantity=0)
        db.add(inv)
        db.flush()
        
    inv.quantity += payload.quantity
    
    move = StockMovement(
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        movement_type="IN",
        quantity=payload.quantity,
        reference=payload.reference,
        notes=payload.note,
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    db.add(move)
    db.commit()
    return {"message": "Stock logged"}

@router.post("/stock-out")
def stock_out(payload: StockAction, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    inv = db.query(InventoryItem).filter_by(product_id=payload.product_id, warehouse_id=payload.warehouse_id).first()
    if not inv or inv.quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
        
    inv.quantity -= payload.quantity
    
    move = StockMovement(
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        movement_type="OUT",
        quantity=payload.quantity,
        reference=payload.reference,
        notes=payload.note,
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    db.add(move)
    db.commit()
    return {"message": "Stock removed"}

@router.post("/transfer")
def transfer_stock(payload: StockTransfer, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Validate source != destination
    if payload.from_warehouse_id == payload.to_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination warehouses must be different")

    inv_from = db.query(InventoryItem).filter_by(product_id=payload.product_id, warehouse_id=payload.from_warehouse_id).first()
    if not inv_from or inv_from.quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock in source warehouse")
        
    inv_to = db.query(InventoryItem).filter_by(product_id=payload.product_id, warehouse_id=payload.to_warehouse_id).first()
    if not inv_to:
        inv_to = InventoryItem(product_id=payload.product_id, warehouse_id=payload.to_warehouse_id, quantity=0)
        db.add(inv_to)
        db.flush()

    inv_from.quantity -= payload.quantity
    inv_to.quantity += payload.quantity

    # Use warehouse names in notes for readability
    from app.models.warehouse import Warehouse
    wh_from = db.query(Warehouse).filter(Warehouse.id == payload.from_warehouse_id).first()
    wh_to = db.query(Warehouse).filter(Warehouse.id == payload.to_warehouse_id).first()
    from_name = wh_from.name if wh_from else payload.from_warehouse_id
    to_name = wh_to.name if wh_to else payload.to_warehouse_id

    move_out = StockMovement(
        product_id=payload.product_id,
        warehouse_id=payload.from_warehouse_id,
        movement_type="TRANSFER_OUT",
        quantity=payload.quantity,
        reference=payload.reference,
        notes=f"Transfer to {to_name}",
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    move_in = StockMovement(
        product_id=payload.product_id,
        warehouse_id=payload.to_warehouse_id,
        movement_type="TRANSFER_IN",
        quantity=payload.quantity,
        reference=payload.reference,
        notes=f"Transfer from {from_name}",
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    db.add(move_out)
    db.add(move_in)
    db.commit()
    return {
        "message": f"Transferred {payload.quantity} units from {from_name} to {to_name}",
        "from_warehouse": from_name,
        "to_warehouse": to_name,
        "quantity": payload.quantity
    }

@router.delete("/{item_id}")
def delete_inventory_item(item_id: str, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    item = db.query(InventoryItem).join(Product).filter(
        InventoryItem.id == item_id,
        Product.company_id == current_user.company_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    db.commit()
    return {"message": "Inventory item deleted"}

@router.delete("/movements/{movement_id}")
def delete_stock_movement(movement_id: str, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    movement = db.query(StockMovement).filter(
        StockMovement.id == movement_id,
        StockMovement.company_id == current_user.company_id
    ).first()
    if not movement:
        raise HTTPException(status_code=404, detail="Stock movement not found")
    db.delete(movement)
    db.commit()
    return {"message": "Stock movement deleted"}
