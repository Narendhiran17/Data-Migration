import time
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.migration_job import MigrationJob, MigrationBatch, RecordResult, RecordIdMapping
from app.connectors.zoho.factory import ZohoConnectorFactory

class MigrationExecutor:
    def __init__(self, db: Session):
        self.db = db

    def execute_migration(
        self,
        project_id: str,
        target_product: str,
        target_module: str,
        records: List[Dict[str, Any]],
        source_key_field: str = "Customer_ID",
        execution_mode: str = "dry_run",
        batch_size: int = 50,
        approved_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a controlled migration job (dry-run or live) with batching and ID mapping.
        """
        started_at = datetime.now(timezone.utc)

        # 1. Initialize MigrationJob in DB
        job = MigrationJob(
            project_id=project_id,
            target_product=target_product,
            target_module=target_module,
            execution_mode=execution_mode,
            status="running",
            total_records=len(records),
            approved_by=approved_by,
            started_at=started_at
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        connector = ZohoConnectorFactory.get_connector(target_product)
        total_success = 0
        total_failed = 0
        created_id_mappings = []

        # 2. Process records in batches
        num_batches = (len(records) + batch_size - 1) // batch_size if records else 1

        for b_idx in range(num_batches):
            batch_slice = records[b_idx * batch_size : (b_idx + 1) * batch_size]
            batch_num = b_idx + 1

            batch = MigrationBatch(
                migration_job_id=job.id,
                batch_number=batch_num,
                status="running"
            )
            self.db.add(batch)
            self.db.commit()
            self.db.refresh(batch)

            # Call connector or simulate in dry-run
            if execution_mode == "dry_run":
                # Simulated responses
                batch_results = [
                    {
                        "record_index": i,
                        "status": "success",
                        "target_id": f"sim_{target_module.lower()}_{uuid.uuid4().hex[:8]}",
                        "error_code": None,
                        "error_message": None
                    }
                    for i in range(len(batch_slice))
                ]
            else:
                batch_results = connector.import_records(target_module, batch_slice)

            batch_success_count = 0
            for i, res in enumerate(batch_results):
                rec = batch_slice[i]
                src_key = str(rec.get(source_key_field, f"row_{b_idx * batch_size + i + 1}"))
                tgt_id = res.get("target_id")

                rec_res = RecordResult(
                    batch_id=batch.id,
                    source_record_reference=f"row_{b_idx * batch_size + i + 1}",
                    source_record_key=src_key,
                    target_record_id=tgt_id,
                    status=res.get("status", "success"),
                    error_code=res.get("error_code"),
                    error_message=res.get("error_message")
                )
                self.db.add(rec_res)

                if res.get("status") == "success":
                    batch_success_count += 1
                    total_success += 1
                    # Save ID mapping for lookup resolution
                    id_map = RecordIdMapping(
                        project_id=project_id,
                        target_module=target_module,
                        source_record_key=src_key,
                        target_record_id=tgt_id
                    )
                    self.db.add(id_map)
                    created_id_mappings.append({"source_key": src_key, "target_id": tgt_id})
                else:
                    total_failed += 1

            batch.status = "success" if batch_success_count == len(batch_slice) else "failed"
            batch.response_summary = {
                "records_in_batch": len(batch_slice),
                "successful": batch_success_count,
                "failed": len(batch_slice) - batch_success_count
            }
            self.db.commit()

        # 3. Update MigrationJob final status
        completed_at = datetime.now(timezone.utc)
        job.status = "completed" if total_failed == 0 else "partially_failed"
        job.successful_records = total_success
        job.failed_records = total_failed
        job.completed_at = completed_at
        self.db.commit()

        duration_sec = round((completed_at - started_at).total_seconds(), 2)

        return {
            "job_id": job.id,
            "project_id": project_id,
            "target_product": target_product,
            "target_module": target_module,
            "execution_mode": execution_mode,
            "status": job.status,
            "total_records": len(records),
            "successful_records": total_success,
            "failed_records": total_failed,
            "duration_seconds": duration_sec,
            "id_mappings_created": len(created_id_mappings),
            "sample_mappings": created_id_mappings[:5]
        }
