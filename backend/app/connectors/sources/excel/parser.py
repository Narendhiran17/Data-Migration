from pathlib import Path
from typing import Dict, List, Any
import openpyxl
from datetime import datetime, date
from app.connectors.sources.base import BaseSourceParser
from app.core.exceptions import FileProcessingException

class ExcelParser(BaseSourceParser):
    def parse(self, file_path: Path) -> Dict[str, Dict[str, Any]]:
        if not file_path.exists():
            raise FileProcessingException(f"Excel file not found at {file_path}")
            
        try:
            wb = openpyxl.load_workbook(filename=str(file_path), read_only=True, data_only=True)
        except Exception as e:
            raise FileProcessingException(f"Failed to open Excel workbook: {str(e)}")

        results: Dict[str, Dict[str, Any]] = {}

        try:
            for sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                rows_iter = ws.iter_rows(values_only=True)
                
                try:
                    header_row = next(rows_iter, None)
                except Exception:
                    header_row = None

                if not header_row:
                    # Empty sheet
                    results[sheet_name] = {
                        "columns": [],
                        "records": [],
                        "total_rows": 0
                    }
                    continue

                # Clean column headers
                columns = []
                for idx, col in enumerate(header_row):
                    if col is not None and str(col).strip() != "":
                        col_str = str(col).strip()
                    else:
                        col_str = f"Column_{idx + 1}"
                    columns.append(col_str)

                records = []
                for row_idx, row in enumerate(rows_iter):
                    # Check if row is entirely empty
                    if not any(v is not None and str(v).strip() != "" for v in row):
                        continue
                    
                    record = {}
                    for col_idx, col_name in enumerate(columns):
                        val = row[col_idx] if col_idx < len(row) else None
                        # Format datetime to ISO string for consistency
                        if isinstance(val, (datetime, date)):
                            val = val.isoformat()
                        elif val is not None:
                            val = str(val).strip()
                        record[col_name] = val
                    records.append(record)

                results[sheet_name] = {
                    "columns": columns,
                    "records": records,
                    "total_rows": len(records)
                }
        finally:
            wb.close()

        return results
