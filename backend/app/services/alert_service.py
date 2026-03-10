from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional

from app.models.alert import Alert
from app.models.inventory import InventoryItem, StockMovement
from app.models.product import Product
from app.models.warehouse import Warehouse


class AlertService:
    def __init__(self, db: Session):
        self.db = db

    def _alert_exists(self, company_id: str, product_id: str, alert_type: str) -> bool:
        """Avoid duplicate unread alerts"""
        recent = datetime.utcnow() - timedelta(hours=24)
        return bool(
            self.db.query(Alert)
            .filter(
                Alert.company_id == company_id,
                Alert.product_id == product_id,
                Alert.alert_type == alert_type,
                Alert.is_read == False,
                Alert.created_at >= recent,
            )
            .first()
        )

    def _create_alert(self, company_id: str, product_id: str, warehouse_id: str,
                      alert_type: str, message: str, severity: str = "WARNING"):
        if not self._alert_exists(company_id, product_id, alert_type):
            alert = Alert(
                company_id=company_id,
                product_id=product_id,
                warehouse_id=warehouse_id,
                alert_type=alert_type,
                message=message,
                severity=severity,
            )
            self.db.add(alert)

    def check_and_create_alerts(self, company_id: str, product_id: str, warehouse_id: str):
        """Check inventory status and generate smart alerts"""
        item = self.db.query(InventoryItem).filter(
            InventoryItem.product_id == product_id,
            InventoryItem.warehouse_id == warehouse_id,
        ).first()

        if not item:
            return

        product = self.db.query(Product).filter(Product.id == product_id).first()
        warehouse = self.db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
        pname = product.name if product else "Unknown Product"
        wname = warehouse.name if warehouse else "Unknown Warehouse"

        # Out of Stock — CRITICAL
        if item.quantity == 0:
            self._create_alert(
                company_id=company_id, product_id=product_id, warehouse_id=warehouse_id,
                alert_type="OUT_OF_STOCK",
                message=f"🔴 OUT OF STOCK: '{pname}' has 0 units in {wname}. Immediate reorder required.",
                severity="CRITICAL",
            )

        # Low Stock — WARNING
        elif item.quantity <= item.reorder_point:
            self._create_alert(
                company_id=company_id, product_id=product_id, warehouse_id=warehouse_id,
                alert_type="LOW_STOCK",
                message=f"⚠️ LOW STOCK: '{pname}' is at {item.quantity} units in {wname} (reorder point: {item.reorder_point}).",
                severity="WARNING",
            )

        # Overstock — INFO
        elif item.quantity >= item.max_stock:
            self._create_alert(
                company_id=company_id, product_id=product_id, warehouse_id=warehouse_id,
                alert_type="OVERSTOCK",
                message=f"📦 OVERSTOCK: '{pname}' has {item.quantity} units in {wname} (max: {item.max_stock}). Consider promotional pricing.",
                severity="INFO",
            )

        self.db.commit()

    def run_scheduled_checks(self, company_id: str):
        """Full company-wide inventory check — called by Celery worker"""
        items = (
            self.db.query(InventoryItem)
            .join(Product)
            .filter(Product.company_id == company_id)
            .all()
        )
        for item in items:
            self.check_and_create_alerts(
                company_id=company_id,
                product_id=str(item.product_id),
                warehouse_id=str(item.warehouse_id),
            )

        # Check for slow-moving items (no OUT movements in 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        for item in items:
            if item.quantity > 0:
                recent_out = (
                    self.db.query(func.count(StockMovement.id))
                    .filter(
                        StockMovement.product_id == item.product_id,
                        StockMovement.warehouse_id == item.warehouse_id,
                        StockMovement.movement_type == "OUT",
                        StockMovement.created_at >= thirty_days_ago,
                    )
                    .scalar() or 0
                )
                if recent_out == 0:
                    self._create_alert(
                        company_id=company_id,
                        product_id=str(item.product_id),
                        warehouse_id=str(item.warehouse_id),
                        alert_type="SLOW_MOVING",
                        message=f"🐌 SLOW MOVING: '{item.product.name if item.product else '?'}' has had no sales in 30 days with {item.quantity} units remaining.",
                        severity="INFO",
                    )

        self.db.commit()
