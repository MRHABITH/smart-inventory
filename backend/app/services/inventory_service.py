from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.inventory import InventoryItem, StockMovement
from app.models.product import Product
from app.models.warehouse import Warehouse


class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def _get_or_create_inventory_item(self, product_id: str, warehouse_id: str) -> InventoryItem:
        item = self.db.query(InventoryItem).filter(
            InventoryItem.product_id == product_id,
            InventoryItem.warehouse_id == warehouse_id,
        ).first()

        if not item:
            item = InventoryItem(product_id=product_id, warehouse_id=warehouse_id, quantity=0)
            self.db.add(item)
            self.db.flush()
        return item

    def _validate_product_and_warehouse(self, product_id: str, warehouse_id: str, company_id: str):
        product = self.db.query(Product).filter(
            Product.id == product_id,
            Product.company_id == company_id,
            Product.is_active == True,
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        warehouse = self.db.query(Warehouse).filter(
            Warehouse.id == warehouse_id,
            Warehouse.company_id == company_id,
            Warehouse.is_active == True,
        ).first()
        if not warehouse:
            raise HTTPException(status_code=404, detail="Warehouse not found")

        return product, warehouse

    def process_stock_in(
        self,
        product_id: str,
        warehouse_id: str,
        quantity: int,
        company_id: str,
        user_id: str,
        reference: str = None,
        notes: str = None,
    ) -> StockMovement:
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")

        self._validate_product_and_warehouse(product_id, warehouse_id, company_id)
        item = self._get_or_create_inventory_item(product_id, warehouse_id)
        item.quantity += quantity

        movement = StockMovement(
            company_id=company_id,
            product_id=product_id,
            warehouse_id=warehouse_id,
            user_id=user_id,
            movement_type="IN",
            quantity=quantity,
            reference=reference,
            notes=notes,
        )
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)
        return movement

    def process_stock_out(
        self,
        product_id: str,
        warehouse_id: str,
        quantity: int,
        company_id: str,
        user_id: str,
        reference: str = None,
        notes: str = None,
    ) -> StockMovement:
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")

        self._validate_product_and_warehouse(product_id, warehouse_id, company_id)
        item = self._get_or_create_inventory_item(product_id, warehouse_id)

        if item.quantity < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available: {item.quantity}, Requested: {quantity}",
            )

        item.quantity -= quantity

        movement = StockMovement(
            company_id=company_id,
            product_id=product_id,
            warehouse_id=warehouse_id,
            user_id=user_id,
            movement_type="OUT",
            quantity=quantity,
            reference=reference,
            notes=notes,
        )
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)
        return movement

    def process_transfer(
        self,
        product_id: str,
        from_warehouse_id: str,
        to_warehouse_id: str,
        quantity: int,
        company_id: str,
        user_id: str,
        notes: str = None,
    ):
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        if from_warehouse_id == to_warehouse_id:
            raise HTTPException(status_code=400, detail="Source and destination warehouses must differ")

        # Deduct from source
        source_item = self._get_or_create_inventory_item(product_id, from_warehouse_id)
        if source_item.quantity < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock in source warehouse. Available: {source_item.quantity}",
            )
        source_item.quantity -= quantity

        # Add to destination
        dest_item = self._get_or_create_inventory_item(product_id, to_warehouse_id)
        dest_item.quantity += quantity

        # Log movement
        movement_out = StockMovement(
            company_id=company_id, product_id=product_id, warehouse_id=from_warehouse_id,
            user_id=user_id, movement_type="TRANSFER", quantity=quantity,
            notes=f"Transfer to warehouse {to_warehouse_id}. {notes or ''}",
        )
        movement_in = StockMovement(
            company_id=company_id, product_id=product_id, warehouse_id=to_warehouse_id,
            user_id=user_id, movement_type="TRANSFER", quantity=quantity,
            notes=f"Transfer from warehouse {from_warehouse_id}. {notes or ''}",
        )
        self.db.add_all([movement_out, movement_in])
        self.db.commit()
