import json
from pathlib import Path
from typing import Dict, List, Any
from app.connectors.sources.base import BaseSourceParser
from app.core.exceptions import FileProcessingException

class JSONParser(BaseSourceParser):
    def parse(self, file_path: Path) -> Dict[str, Dict[str, Any]]:
        if not file_path.exists():
            raise FileProcessingException(f"JSON file not found at {file_path}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = json.load(f)
        except Exception as e:
            raise FileProcessingException(f"Invalid JSON format: {str(e)}")

        records_list: List[Dict[str, Any]] = []

        if isinstance(content, list):
            records_list = [r for r in content if isinstance(r, dict)]
        elif isinstance(content, dict):
            # Check for common array keys
            for key in ["records", "data", "items", "rows", "results"]:
                if key in content and isinstance(content[key], list):
                    records_list = [r for r in content[key] if isinstance(r, dict)]
                    break
            if not records_list:
                # Single record dictionary
                records_list = [content]

        if not records_list:
            return {
                "default": {
                    "columns": [],
                    "records": [],
                    "total_rows": 0
                }
            }

        # Extract all distinct columns across all records
        columns_set = set()
        for r in records_list:
            for k in r.keys():
                columns_set.add(k)
        
        columns = sorted(list(columns_set))

        # Normalize records so all columns exist and nested structures are formatted cleanly
        normalized_records = []
        for r in records_list:
            norm = {}
            for col in columns:
                val = r.get(col)
                if isinstance(val, (dict, list)):
                    val = json.dumps(val)
                elif val is not None:
                    val = str(val).strip()
                norm[col] = val
            normalized_records.append(norm)

        return {
            "default": {
                "columns": columns,
                "records": normalized_records,
                "total_rows": len(normalized_records)
            }
        }
