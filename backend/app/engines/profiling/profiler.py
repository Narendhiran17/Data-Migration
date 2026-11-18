from typing import List, Dict, Any
from app.engines.profiling.statistics import ColumnStatisticsCalculator
from app.engines.profiling.duplicate_detector import DuplicateDetector
from app.schemas.source import SheetProfile, ColumnProfile

class DataProfiler:
    @classmethod
    def profile_sheet(cls, sheet_name: str, records: List[Dict[str, Any]], columns: List[str]) -> SheetProfile:
        """
        Profiles an individual sheet or table of records.
        """
        total_rows = len(records)
        total_columns = len(columns)
        
        column_profiles: List[ColumnProfile] = []
        
        for col in columns:
            col_values = [r.get(col) for r in records]
            stats = ColumnStatisticsCalculator.calculate(col, col_values, total_rows)
            column_profiles.append(ColumnProfile(**stats))
            
        duplicate_rows = DuplicateDetector.calculate_row_duplicates(records)
        
        return SheetProfile(
            sheet_name=sheet_name,
            total_rows=total_rows,
            total_columns=total_columns,
            columns=column_profiles,
            duplicate_rows_count=duplicate_rows
        )
