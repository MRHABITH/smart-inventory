from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.core.deps import get_current_active_user

router = APIRouter()

class ProductCreate(BaseModel):
    sku: str
    name: str
    description: str = ""
    category: str = ""
    price: float = 0.0
    cost: float = 0.0
    brand: str = ""
    barcode: str = ""

class ProductUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    description: str | None = None
    category: str | None = None
    price: float | None = None
    cost: float | None = None
    brand: str | None = None
    barcode: str | None = None
    short_description: str | None = None
    bullet_highlights: list | None = None
    seo_keywords: list | None = None

@router.get("/")
def get_products(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.company_id == current_user.company_id).all()
    return {"data": products}

@router.post("/")
def create_product(payload: ProductCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.sku == payload.sku, Product.company_id == current_user.company_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
        
    new_product = Product(
        sku=payload.sku,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        brand=payload.brand,
        barcode=payload.barcode,
        price=payload.price,
        cost=payload.cost,
        company_id=current_user.company_id
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}")
def update_product(product_id: str, payload: ProductUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.company_id == current_user.company_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(product_id: str, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.company_id == current_user.company_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Deleted"}
