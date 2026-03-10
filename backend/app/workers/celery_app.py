from celery import Celery
from app.config import settings

celery_app = Celery(
    "ai_inventory_os",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.beat_schedule = {
    "check-inventory-alerts-every-15-min": {
        "task": "app.workers.tasks.run_alert_checks",
        "schedule": 900,  # 15 minutes
    },
    "clear-old-cache-daily": {
        "task": "app.workers.tasks.clear_old_cache",
        "schedule": 86400,  # 24 hours
    },
}

celery_app.conf.timezone = "UTC"
