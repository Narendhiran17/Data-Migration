import csv
import json
import io
import zipfile
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any

class PackageGenerator:
    @staticmethod
    def generate_zip_package(
        project_name: str,
        target_product: str,
        transformed_modules: Dict[str, List[Dict[str, Any]]],
        mappings: Dict[str, Any],
        dependency_order: List[str],
        validation_summary: Dict[str, Any],
        output_path: Path
    ) -> Dict[str, Any]:
        """
        Builds a self-contained ZIP migration package.
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)
        total_records = 0

        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            # 1. Manifest
            manifest = {
                "project_name": project_name,
                "target_product": target_product,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "generator_version": "1.0.0",
                "dependency_order": dependency_order,
                "modules_included": list(transformed_modules.keys())
            }
            zipf.writestr("manifest.json", json.dumps(manifest, indent=2))

            # 2. Mappings and Plan
            zipf.writestr("mappings.json", json.dumps(mappings, indent=2))
            zipf.writestr("dependency-plan.json", json.dumps({
                "execution_order": dependency_order,
                "strategy": "Topological parent-child cascade"
            }, indent=2))

            # 3. Transformed Data CSVs
            for mod_name, records in transformed_modules.items():
                if not records:
                    continue
                total_records += len(records)
                csv_buffer = io.StringIO()
                fieldnames = list(records[0].keys())
                writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(records)

                zipf.writestr(f"data/{mod_name.lower()}.csv", csv_buffer.getvalue())

            # 4. Reports
            zipf.writestr("reports/validation-summary.json", json.dumps(validation_summary, indent=2))

            # 5. Instructions README
            instructions = f"""# Zoho Data Migration Package
Project: {project_name}
Target System: Zoho {target_product}
Generated At: {manifest['generated_at']}

## Execution Order
{chr(10).join(f"{i+1}. {mod}" for i, mod in enumerate(dependency_order))}

## Verification
- Total Records: {total_records}
- Validated Pre-flight Checks: {validation_summary.get('valid_records', 0)}
- Critical Errors: {validation_summary.get('invalid_records', 0)}
"""
            zipf.writestr("README.md", instructions)

        # Compute checksum & file size
        hasher = hashlib.sha256()
        with open(output_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)

        checksum = hasher.hexdigest()
        file_size = output_path.stat().st_size

        return {
            "package_path": str(output_path),
            "checksum": checksum,
            "record_count": total_records,
            "file_size": file_size,
            "modules": list(transformed_modules.keys())
        }
