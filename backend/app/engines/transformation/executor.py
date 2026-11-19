import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from app.engines.profiling.type_detector import COMMON_DATE_FORMATS

class TransformationExecutor:
    @staticmethod
    def apply_rule(val: Any, rule_type: str, config: Dict[str, Any], record_context: Optional[Dict[str, Any]] = None) -> Any:
        if val is None or val == "":
            default = config.get("default_value")
            if default is not None:
                return default
            return None

        str_val = str(val).strip()

        if rule_type == "trim":
            return str_val

        elif rule_type == "uppercase":
            return str_val.upper()

        elif rule_type == "lowercase":
            return str_val.lower()

        elif rule_type == "replace":
            old_str = config.get("find", "")
            new_str = config.get("replace_with", "")
            return str_val.replace(old_str, new_str)

        elif rule_type == "phone_normalize":
            digits = re.sub(r"\D", "", str_val)
            country_prefix = config.get("country_code", "")
            if country_prefix and not str_val.startswith("+"):
                return f"+{country_prefix}{digits}"
            return digits

        elif rule_type == "date_format":
            out_fmt = config.get("output_format", "%Y-%m-%d")
            # Try parsing
            parsed_dt = None
            for fmt in COMMON_DATE_FORMATS:
                try:
                    parsed_dt = datetime.strptime(str_val, fmt)
                    break
                except ValueError:
                    continue
            if parsed_dt:
                return parsed_dt.strftime(out_fmt)
            return str_val

        elif rule_type == "picklist_map":
            mapping = config.get("mapping", {})  # e.g. {"Active": "Contacted", "Cold": "Lost Lead"}
            return mapping.get(str_val, config.get("fallback", str_val))

        elif rule_type == "lookup_resolve":
            id_map = config.get("id_map", {})  # source_key -> target_id
            return id_map.get(str_val, str_val)

        elif rule_type == "prefix":
            prefix = config.get("prefix", "")
            return f"{prefix}{str_val}"

        return val

    @classmethod
    def transform_record(cls, record: Dict[str, Any], rules_by_target: Dict[str, List[Dict[str, Any]]],
                         field_mappings: Dict[str, str]) -> Dict[str, Any]:
        """
        Takes raw source record, applies mappings (source -> target), then applies transformation rules.
        """
        output = {}
        for target_field, source_field in field_mappings.items():
            val = record.get(source_field)

            # Apply any transformation rules registered for this target field
            if target_field in rules_by_target:
                # Sort by execution order
                rules = sorted(rules_by_target[target_field], key=lambda r: r.get("execution_order", 1))
                for r in rules:
                    if r.get("enabled", True):
                        val = cls.apply_rule(val, r["rule_type"], r.get("configuration", {}), record)

            output[target_field] = val
        return output

    @classmethod
    def preview_transformations(cls, sample_records: List[Dict[str, Any]],
                                rules: List[Dict[str, Any]],
                                mappings: Dict[str, str]) -> List[Dict[str, Any]]:
        rules_by_target: Dict[str, List[Dict[str, Any]]] = {}
        for r in rules:
            tgt = r["target_field"]
            if tgt not in rules_by_target:
                rules_by_target[tgt] = []
            rules_by_target[tgt].append(r)

        return [cls.transform_record(rec, rules_by_target, mappings) for rec in sample_records]
