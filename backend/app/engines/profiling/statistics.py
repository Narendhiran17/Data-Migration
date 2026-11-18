from typing import Any, List, Optional, Dict
from app.engines.profiling.type_detector import TypeDetector
from app.engines.profiling.duplicate_detector import DuplicateDetector

class ColumnStatisticsCalculator:
    @staticmethod
    def calculate(column_name: str, values: List[Any], total_rows: int) -> Dict[str, Any]:
        """
        Calculates complete statistics for a column.
        """
        null_count = sum(1 for v in values if TypeDetector.is_null_or_empty(v))
        null_percentage = round((null_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        
        non_null_values = [v for v in values if not TypeDetector.is_null_or_empty(v)]
        
        dup_metrics = DuplicateDetector.calculate_column_duplicates(values)
        inferred_type, invalid_format_count, flags = TypeDetector.infer_column_type(values, total_rows)
        
        # Calculate min & max
        min_val = None
        max_val = None
        if non_null_values:
            try:
                # If numeric
                if inferred_type in ("Integer", "Decimal"):
                    num_vals = [float(v) for v in non_null_values if TypeDetector.is_float(v)]
                    if num_vals:
                        min_val = str(min(num_vals))
                        max_val = str(max(num_vals))
                else:
                    str_vals = [str(v) for v in non_null_values]
                    min_val = str(min(str_vals))
                    max_val = str(max(str_vals))
            except Exception:
                min_val = str(non_null_values[0])
                max_val = str(non_null_values[-1])

        # Candidate identifier heuristic:
        # If 100% unique (or nearly 100% without nulls) and column name contains ID, Code, Num, Key or starts with C/ACC etc.
        col_lower = column_name.lower()
        is_id_name = any(kw in col_lower for kw in ["id", "code", "key", "number", "num"])
        if null_count == 0 and dup_metrics["unique_percentage"] == 100.0 and (is_id_name or inferred_type in ("Integer", "Text")):
            flags["is_candidate_identifier"] = True

        # Safe sample values (up to 5 distinct non-null values)
        samples = []
        for v in non_null_values:
            str_v = str(v)
            if str_v not in samples:
                samples.append(str_v)
            if len(samples) >= 5:
                break

        return {
            "column_name": column_name,
            "inferred_type": inferred_type,
            "nullable": null_count > 0,
            "null_count": null_count,
            "null_percentage": null_percentage,
            "distinct_count": dup_metrics["distinct_count"],
            "unique_percentage": dup_metrics["unique_percentage"],
            "duplicate_count": dup_metrics["duplicate_count"],
            "invalid_format_count": invalid_format_count,
            "min_value": min_val,
            "max_value": max_val,
            "is_candidate_identifier": flags.get("is_candidate_identifier", False),
            "is_candidate_email": flags.get("is_candidate_email", False),
            "is_candidate_phone": flags.get("is_candidate_phone", False),
            "is_candidate_date": flags.get("is_candidate_date", False),
            "sample_values": samples
        }
