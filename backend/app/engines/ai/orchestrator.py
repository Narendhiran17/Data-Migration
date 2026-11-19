from typing import Dict, List, Any, Optional

class AIOrchestrator:
    @staticmethod
    def explain_anomaly(column_name: str, inferred_type: str, anomaly_type: str,
                        sample_invalid_values: List[Any]) -> Dict[str, str]:
        """
        Explains detected data quality anomalies in plain English with recommended corrective action.
        """
        samples_str = ", ".join(f"'{s}'" for s in sample_invalid_values[:3])

        if anomaly_type == "INVALID_EMAIL":
            return {
                "explanation": f"Column '{column_name}' contains values such as {samples_str} that do not follow standard email RFC format.",
                "recommendation": "Use a regex clean rule or map invalid entries to a notes/description field."
            }
        elif anomaly_type == "INVALID_DATE":
            return {
                "explanation": f"Date values in '{column_name}' exhibit mixed or non-standard date delimiters (e.g. {samples_str}).",
                "recommendation": "Configure a date_format transformation with output format '%Y-%m-%d' for Zoho CRM compatibility."
            }
        elif anomaly_type == "VALUE_NOT_IN_PICKLIST":
            return {
                "explanation": f"Source values in '{column_name}' do not match target Zoho picklist values.",
                "recommendation": "Use picklist_map rule to map existing source categories into approved destination picklist values."
            }
        else:
            return {
                "explanation": f"Column '{column_name}' has inconsistencies in format or length.",
                "recommendation": "Review record data and verify source encoding."
            }

    @staticmethod
    def suggest_transformation(source_field: str, source_type: str,
                               target_field: str, target_type: str) -> Optional[Dict[str, Any]]:
        """
        Suggests deterministic transformation rules between source and target fields.
        """
        src_lower = source_field.lower()
        tgt_lower = target_field.lower()

        if "phone" in src_lower and "phone" in tgt_lower:
            return {
                "rule_type": "phone_normalize",
                "target_field": target_field,
                "configuration": {"country_code": "1"},
                "reason": "Ensure uniform E.164 phone formatting"
            }
        elif source_type == "Date" and target_type == "date":
            return {
                "rule_type": "date_format",
                "target_field": target_field,
                "configuration": {"output_format": "%Y-%m-%d"},
                "reason": "Standardize date strings to YYYY-MM-DD for Zoho API"
            }
        elif target_type in ["text", "textarea"]:
            return {
                "rule_type": "trim",
                "target_field": target_field,
                "configuration": {},
                "reason": "Trim whitespace padding"
            }
        return None
