from app.workers.celery_app import celery_app
from app.database import SessionLocal
from app.models.company import Company
from app.services.alert_service import AlertService
from app.core.cache import delete_pattern
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def run_alert_checks(self):
    """Run inventory alert checks for all active companies"""
    db = SessionLocal()
    try:
        companies = db.query(Company).filter(Company.is_active == True).all()
        for company in companies:
            try:
                AlertService(db).run_scheduled_checks(company_id=str(company.id))
                logger.info(f"Alert check completed for company: {company.name}")
            except Exception as e:
                logger.error(f"Alert check failed for {company.name}: {e}")
        return {"status": "completed", "companies_processed": len(companies)}
    except Exception as exc:
        logger.error(f"Alert task failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@celery_app.task
def clear_old_cache():
    """Clear stale cache entries"""
    delete_pattern("dashboard:*")
    delete_pattern("products:*")
    logger.info("Cache cleared successfully")
    return {"status": "cache cleared"}
