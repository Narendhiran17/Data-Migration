from pathlib import Path
from app.connectors.sources.base import BaseSourceParser
from app.connectors.sources.excel.parser import ExcelParser
from app.connectors.sources.csv.parser import CSVParser
from app.connectors.sources.json.parser import JSONParser
from app.core.exceptions import BadRequestException

class SourceParserFactory:
    @staticmethod
    def get_parser(file_format: str) -> BaseSourceParser:
        fmt = file_format.upper().strip()
        if fmt in ["XLSX", "XLS", "EXCEL"]:
            return ExcelParser()
        elif fmt in ["CSV", "TSV", "TXT"]:
            return CSVParser()
        elif fmt == "JSON":
            return JSONParser()
        else:
            raise BadRequestException(f"Unsupported file format '{file_format}'. Supported: XLSX, CSV, JSON.")

    @staticmethod
    def detect_format_from_filename(filename: str) -> str:
        ext = Path(filename).suffix.lower()
        if ext in [".xlsx", ".xls"]:
            return "XLSX"
        elif ext in [".csv"]:
            return "CSV"
        elif ext in [".json"]:
            return "JSON"
        else:
            return "UNKNOWN"
