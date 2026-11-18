from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.source_service import SourceService
from app.core.logging import logger

@celery_app.task(name="tasks.analyse_source_file", bind=True, max_retries=2)
def analyse_source_file_task(self, file_id: str):
    logger.info(f"Starting background source analysis task for file: {file_id}")
    db = SessionLocal()
    try:
        service = SourceService(db)
        result = service.analyse_file(file_id=file_id)
        logger.info(f"Source analysis task completed successfully for file: {file_id}")
        return result.model_dump()
    except Exception as exc:
        logger.error(f"Source analysis failed for file {file_id}: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=5)
    finally:
        db.close()
