from collections import Counter
from typing import Any, List, Dict

class DuplicateDetector:
    @staticmethod
    def calculate_column_duplicates(values: List[Any]) -> Dict[str, Any]:
        """
        Calculates duplicate metrics for a single column.
        """
        non_null = [v for v in values if v is not None and str(v).strip() != ""]
        total_non_null = len(non_null)
        if total_non_null == 0:
            return {
                "distinct_count": 0,
                "duplicate_count": 0,
                "unique_percentage": 0.0
            }
        
        counter = Counter(non_null)
        distinct_count = len(counter)
        # Duplicate count is items that appear more than once: total minus unique distinct
        duplicate_count = sum(count - 1 for count in counter.values() if count > 1)
        unique_percentage = round((distinct_count / total_non_null) * 100, 2)
        
        return {
            "distinct_count": distinct_count,
            "duplicate_count": duplicate_count,
            "unique_percentage": unique_percentage
        }

    @staticmethod
    def calculate_row_duplicates(records: List[Dict[str, Any]]) -> int:
        """
        Finds exact duplicate records across all columns.
        """
        if not records:
            return 0
        
        # Hashable row representation
        seen = set()
        duplicate_rows = 0
        for r in records:
            # Tuple of sorted items
            row_tuple = tuple(sorted((k, str(v)) for k, v in r.items()))
            if row_tuple in seen:
                duplicate_rows += 1
            else:
                seen.add(row_tuple)
        return duplicate_rows
