import csv
from pathlib import Path
from typing import Dict, List, Any
from app.connectors.sources.base import BaseSourceParser
from app.core.exceptions import FileProcessingException

class CSVParser(BaseSourceParser):
    ENCODINGS_TO_TRY = ["utf-8-sig", "utf-8", "latin-1", "cp1252"]

    def parse(self, file_path: Path) -> Dict[str, Dict[str, Any]]:
        if not file_path.exists():
            raise FileProcessingException(f"CSV file not found at {file_path}")

        # Detect encoding
        encoding_used = None
        sample_bytes = None
        for enc in self.ENCODINGS_TO_TRY:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    sample_bytes = f.read(4096)
                    encoding_used = enc
                    break
            except (UnicodeDecodeError, UnicodeError):
                continue

        if not encoding_used:
            encoding_used = "utf-8"

        # Detect delimiter
        delimiter = ","
        try:
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample_bytes or "", delimiters=",;\t|")
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","

        try:
            with open(file_path, "r", encoding=encoding_used, newline="") as f:
                reader = csv.reader(f, delimiter=delimiter)
                
                try:
                    header_row = next(reader, None)
                except Exception:
                    header_row = None

                if not header_row:
                    return {
                        "default": {
                            "columns": [],
                            "records": [],
                            "total_rows": 0
                        }
                    }

                columns = [
                    str(c).strip() if str(c).strip() else f"Column_{i+1}"
                    for i, c in enumerate(header_row)
                ]

                records = []
                for row in reader:
                    # Skip completely empty rows
                    if not any(v.strip() != "" for v in row if v):
                        continue
                    
                    record = {}
                    for col_idx, col_name in enumerate(columns):
                        val = row[col_idx] if col_idx < len(row) else None
                        if val is not None:
                            val = val.strip()
                        record[col_name] = val if val != "" else None
                    records.append(record)

            return {
                "default": {
                    "columns": columns,
                    "records": records,
                    "total_rows": len(records)
                }
            }
        except Exception as e:
            raise FileProcessingException(f"Failed to parse CSV file: {str(e)}")
