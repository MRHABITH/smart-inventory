import io
import csv
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.inventory import InventoryItem, StockMovement


class ReportService:
    def __init__(self, db: Session, company_id: str):
        self.db = db
        self.company_id = company_id

    def inventory_valuation(self) -> Dict[str, Any]:
        items = (
            self.db.query(InventoryItem)
            .join(Product)
            .filter(Product.company_id == self.company_id, Product.is_active == True)
            .all()
        )

        result = []
        total_value = 0.0
        for item in items:
            if item.product and item.warehouse:
                value = item.quantity * item.product.cost
                total_value += value
                result.append({
                    "product_name": item.product.name,
                    "sku": item.product.sku,
                    "warehouse": item.warehouse.name,
                    "quantity": item.quantity,
                    "cost": item.product.cost,
                    "price": item.product.price,
                    "cost_value": round(value, 2),
                    "retail_value": round(item.quantity * item.product.price, 2),
                })

        return {
            "items": result,
            "total_cost_value": round(total_value, 2),
            "total_retail_value": round(sum(i["retail_value"] for i in result), 2),
            "generated_at": datetime.utcnow().isoformat(),
        }

    def stock_movement_report(self, days: int = 30) -> List[Dict]:
        since = datetime.utcnow() - timedelta(days=days)
        movements = (
            self.db.query(StockMovement)
            .filter(
                StockMovement.company_id == self.company_id,
                StockMovement.created_at >= since,
            )
            .order_by(StockMovement.created_at.desc())
            .all()
        )
        return [
            {
                "date": m.created_at.strftime("%Y-%m-%d %H:%M"),
                "product": m.product.name if m.product else "—",
                "sku": m.product.sku if m.product else "—",
                "warehouse": m.warehouse.name if m.warehouse else "—",
                "type": m.movement_type,
                "quantity": m.quantity,
                "reference": m.reference or "—",
                "notes": m.notes or "—",
            }
            for m in movements
        ]

    def warehouse_stock_report(self) -> List[Dict]:
        warehouses = self.db.query(Warehouse).filter(
            Warehouse.company_id == self.company_id,
            Warehouse.is_active == True,
        ).all()

        result = []
        for wh in warehouses:
            items = self.db.query(InventoryItem).filter(
                InventoryItem.warehouse_id == wh.id
            ).all()
            result.append({
                "warehouse": wh.name,
                "location": wh.location,
                "capacity": wh.capacity,
                "products": [
                    {
                        "name": i.product.name if i.product else "—",
                        "sku": i.product.sku if i.product else "—",
                        "quantity": i.quantity,
                        "status": "low" if i.quantity <= i.reorder_point else "normal",
                    }
                    for i in items if i.product
                ],
                "total_quantity": sum(i.quantity for i in items),
                "utilization": round(sum(i.quantity for i in items) / wh.capacity * 100, 1) if wh.capacity > 0 else 0,
            })
        return result

    def to_csv(self, data: List[Dict], filename: str = "report") -> io.BytesIO:
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return io.BytesIO(output.getvalue().encode("utf-8"))

    def to_excel(self, data: List[Dict], sheet_name: str = "Report") -> io.BytesIO:
        import pandas as pd
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        output.seek(0)
        return output
