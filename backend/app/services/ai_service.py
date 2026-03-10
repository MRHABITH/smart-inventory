import json
from typing import List, Dict, Any, Optional
from groq import Groq
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.config import settings
from app.models.inventory import InventoryItem, StockMovement
from app.models.product import Product
from app.models.warehouse import Warehouse


class AIService:
    """
    Core AI Service powered by Groq API (llama-3.3-70b-versatile)
    Handles: Product Descriptions, Inventory Insights,
             Demand Forecasting, AI Chat Assistant
    """

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL

    def _parse_json_response(self, text: str) -> Any:
        """Clean and parse JSON from AI response"""
        text = text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        return json.loads(text.strip())

    def _call_groq(self, messages: List[Dict], temperature: float = 0.5, max_tokens: int = 1000) -> str:
        """Make a call to Groq API"""
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return completion.choices[0].message.content

    # ──────────────────────────────────────────────────────────────
    # 1. AI PRODUCT DESCRIPTION GENERATOR
    # ──────────────────────────────────────────────────────────────
    def generate_product_description(
        self,
        product_name: str,
        category: str,
        features: List[str],
        brand: str = "",
        price: float = 0.0,
    ) -> Dict[str, Any]:
        features_str = "\n".join(f"- {f}" for f in features)

        prompt = f"""You are a world-class ecommerce copywriter. Generate a complete product listing for:

Product Name: {product_name}
Category: {category}
Brand: {brand or "Generic"}
Price: ₹{price:.2f}
Key Features:
{features_str}

Return ONLY a valid JSON object with this exact structure:
{{
    "short_description": "2-3 sentence engaging product summary (max 100 words)",
    "detailed_description": "Full ecommerce description (150-200 words), persuasive and informative",
    "bullet_highlights": [
        "Highlight 1 — specific benefit",
        "Highlight 2 — specific benefit",
        "Highlight 3 — specific benefit",
        "Highlight 4 — specific benefit",
        "Highlight 5 — specific benefit"
    ],
    "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}}"""

        response = self._call_groq(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1500,
        )

        try:
            return self._parse_json_response(response)
        except Exception:
            return {
                "short_description": f"{product_name} — a high-quality {category} product.",
                "detailed_description": response,
                "bullet_highlights": features[:5],
                "seo_keywords": [product_name.lower(), category.lower()],
            }

    # ──────────────────────────────────────────────────────────────
    # 2. INVENTORY INSIGHTS ANALYZER
    # ──────────────────────────────────────────────────────────────
    def get_inventory_insights(self, company_id: str, db: Session) -> Dict[str, Any]:
        inventory_items = (
            db.query(InventoryItem)
            .join(Product, InventoryItem.product_id == Product.id)
            .filter(Product.company_id == company_id)
            .limit(25)
            .all()
        )

        if not inventory_items:
            return {
                "summary": "No inventory data found. Add products and stock to get insights.",
                "critical_items": [],
                "recommendations": ["Add products to your inventory to get AI insights."],
                "reorder_urgency": "LOW",
                "total_items_analyzed": 0,
                "items_needing_attention": 0,
            }

        summary_data = []
        for item in inventory_items:
            status = "normal"
            if item.quantity == 0:
                status = "OUT_OF_STOCK"
            elif item.quantity <= item.reorder_point:
                status = "LOW_STOCK"
            elif item.quantity >= item.max_stock:
                status = "OVERSTOCK"

            summary_data.append({
                "product": item.product.name if item.product else "Unknown",
                "sku": item.product.sku if item.product else "",
                "quantity": item.quantity,
                "reorder_point": item.reorder_point,
                "max_stock": item.max_stock,
                "status": status,
            })

        critical_count = sum(1 for s in summary_data if s["status"] != "normal")

        prompt = f"""You are an AI inventory management expert. Analyze this inventory data and provide actionable business insights:

{json.dumps(summary_data, indent=2)}

Return ONLY valid JSON:
{{
    "summary": "2-3 sentence executive summary of overall inventory health",
    "critical_items": [
        {{"product": "product name", "issue": "description of issue", "action": "specific recommended action"}}
    ],
    "recommendations": [
        "Actionable recommendation 1",
        "Actionable recommendation 2",
        "Actionable recommendation 3"
    ],
    "reorder_urgency": "LOW|MEDIUM|HIGH|CRITICAL",
    "total_items_analyzed": {len(summary_data)},
    "items_needing_attention": {critical_count}
}}"""

        response = self._call_groq(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1200,
        )

        try:
            return self._parse_json_response(response)
        except Exception:
            return {
                "summary": response[:300],
                "critical_items": [],
                "recommendations": [],
                "reorder_urgency": "MEDIUM",
                "total_items_analyzed": len(summary_data),
                "items_needing_attention": critical_count,
            }

    # ──────────────────────────────────────────────────────────────
    # 3. AI INVENTORY CHAT ASSISTANT
    # ──────────────────────────────────────────────────────────────
    def chat_assistant(
        self,
        user_message: str,
        company_id: str,
        db: Session,
        history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        # Gather live inventory context
        from sqlalchemy import func

        total_products = (
            db.query(func.count(Product.id))
            .filter(Product.company_id == company_id, Product.is_active == True)
            .scalar() or 0
        )
        low_stock = (
            db.query(func.count(InventoryItem.id))
            .join(Product)
            .filter(
                Product.company_id == company_id,
                InventoryItem.quantity <= InventoryItem.reorder_point,
                InventoryItem.quantity > 0,
            )
            .scalar() or 0
        )
        out_of_stock = (
            db.query(func.count(InventoryItem.id))
            .join(Product)
            .filter(Product.company_id == company_id, InventoryItem.quantity == 0)
            .scalar() or 0
        )

        # Get top low stock items for context
        low_items = (
            db.query(InventoryItem)
            .join(Product)
            .filter(
                Product.company_id == company_id,
                InventoryItem.quantity <= InventoryItem.reorder_point,
            )
            .limit(5)
            .all()
        )
        low_items_str = ", ".join(
            f"{i.product.name} ({i.quantity} left)" for i in low_items if i.product
        )

        system_prompt = f"""You are ARIA — an intelligent AI Inventory Assistant for AI Inventory OS.

📊 LIVE INVENTORY SNAPSHOT:
- Total Active Products: {total_products}
- Low Stock Items: {low_stock}
- Out of Stock Items: {out_of_stock}
- Items needing reorder soon: {low_items_str or "None"}

You help with:
✅ Inventory analysis and actionable insights
✅ Stock management recommendations
✅ Reorder suggestions with urgency levels
✅ Demand forecasting guidance
✅ Warehouse optimization tips
✅ Supplier management advice

Be concise, professional, and data-driven. Use bullet points for clarity.
When you don't have specific data, provide best-practice recommendations."""

        messages = [{"role": "system", "content": system_prompt}]

        # Include recent history (last 6 messages)
        if history:
            for msg in history[-6:]:
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": user_message})

        response = self._call_groq(messages=messages, temperature=0.5, max_tokens=800)

        # Generate follow-up suggestions
        suggestions_prompt = f"""Based on this inventory assistant conversation, suggest 3 short follow-up questions the user might want to ask next. 
User asked: "{user_message}"
Return as JSON array: ["question1", "question2", "question3"]"""

        try:
            suggestions_response = self._call_groq(
                messages=[{"role": "user", "content": suggestions_prompt}],
                temperature=0.6,
                max_tokens=200,
            )
            suggestions = self._parse_json_response(suggestions_response)
        except Exception:
            suggestions = [
                "Which products should I reorder this week?",
                "Show me slow-moving inventory",
                "What's my current inventory value?",
            ]

        return {"response": response, "suggestions": suggestions if isinstance(suggestions, list) else []}

    # ──────────────────────────────────────────────────────────────
    # 4. AI DEMAND FORECASTING
    # ──────────────────────────────────────────────────────────────
    def predict_demand(
        self,
        product_id: str,
        company_id: str,
        db: Session,
        days_ahead: int = 30,
    ) -> Dict[str, Any]:
        sixty_days_ago = datetime.utcnow() - timedelta(days=60)

        movements = (
            db.query(StockMovement)
            .filter(
                StockMovement.product_id == product_id,
                StockMovement.company_id == company_id,
                StockMovement.movement_type == "OUT",
                StockMovement.created_at >= sixty_days_ago,
            )
            .all()
        )

        product = db.query(Product).filter(Product.id == product_id).first()
        current_inventory = db.query(InventoryItem).filter(
            InventoryItem.product_id == product_id
        ).first()

        if not movements:
            return {
                "predicted_demand": 0,
                "daily_average": 0.0,
                "recommended_stock": current_inventory.reorder_point * 2 if current_inventory else 50,
                "confidence": "LOW",
                "forecast_summary": "Insufficient sales data. Minimum 1 week of sales history required for accurate forecasting.",
                "trend": "STABLE",
                "reorder_date": "Unable to determine",
            }

        # Build daily sales map
        daily_sales: Dict[str, int] = {}
        for m in movements:
            key = m.created_at.strftime("%Y-%m-%d")
            daily_sales[key] = daily_sales.get(key, 0) + m.quantity

        avg_daily = sum(daily_sales.values()) / max(len(daily_sales), 1)
        total_qty = sum(m.quantity for m in movements)
        current_qty = current_inventory.quantity if current_inventory else 0
        days_until_stockout = int(current_qty / avg_daily) if avg_daily > 0 else 999
        reorder_date = (datetime.utcnow() + timedelta(days=max(days_until_stockout - 5, 0))).strftime("%Y-%m-%d")

        prompt = f"""You are an inventory forecasting AI. Analyze the following sales data and provide a demand forecast.

Product: {product.name if product else "Unknown"}
Category: {product.category if product else "Unknown"}
Historical Data (60 days):
- Total units sold: {total_qty}
- Average daily sales: {avg_daily:.2f}
- Active selling days: {len(daily_sales)}
- Current stock: {current_qty}
- Reorder point: {current_inventory.reorder_point if current_inventory else 20}
- Days until stockout: {days_until_stockout}
Forecast Period: {days_ahead} days

Return ONLY valid JSON:
{{
    "predicted_demand": {int(avg_daily * days_ahead)},
    "daily_average": {round(avg_daily, 2)},
    "recommended_stock": {int(avg_daily * days_ahead * 1.25)},
    "confidence": "MEDIUM",
    "forecast_summary": "Brief human-readable forecast explanation (2-3 sentences)",
    "trend": "INCREASING|STABLE|DECREASING",
    "reorder_date": "{reorder_date}"
}}"""

        response = self._call_groq(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=500,
        )

        try:
            return self._parse_json_response(response)
        except Exception:
            return {
                "predicted_demand": int(avg_daily * days_ahead),
                "daily_average": round(avg_daily, 2),
                "recommended_stock": int(avg_daily * days_ahead * 1.25),
                "confidence": "MEDIUM",
                "forecast_summary": f"Based on {total_qty} units sold over {len(daily_sales)} days.",
                "trend": "STABLE",
                "reorder_date": reorder_date,
            }


# Singleton instance
ai_service = AIService()
