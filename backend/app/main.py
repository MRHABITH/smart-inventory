from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base
from app.api.v1 import auth, products, warehouses, inventory, dashboard, alerts, reports, ai
import logging

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup — gracefully handle DB unavailability
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully.")
    except Exception as e:
        logger.error(f"Database connection failed at startup: {e}")
        logger.warning("App will start without DB — endpoints may fail until DB is reachable.")
    yield

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)

origins = []
if isinstance(settings.ALLOWED_ORIGINS, str):
    origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(',')]
else:
    origins = settings.ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(warehouses.router, prefix="/api/v1/warehouses", tags=["warehouses"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])

@app.get("/")
def read_root():
    return {"message": "Welcome to GoGenix-AI Inventory Backend Service"}
