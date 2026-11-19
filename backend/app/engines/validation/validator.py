from typing import Any, Dict, List, Optional
from app.engines.profiling.type_detector import TypeDetector

class RecordValidator:
    @staticmethod
    def validate_record(row_number: int, record: Dict[str, Any],
                        target_fields: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        errors = []

        for field in target_fields:
            api_name = field["api_name"]
            data_type = field.get("data_type", "text").lower()
            is_mandatory = field.get("is_mandatory", False)
            constraints = field.get("constraints", {})
            val = record.get(api_name)

            # 1. Mandatory check
            if is_mandatory and (val is None or str(val).strip() == ""):
                errors.append({
                    "row_number": row_number,
                    "field_name": api_name,
                    "severity": "Error",
                    "error_code": "MISSING_REQUIRED_FIELD",
                    "message": f"Mandatory field '{api_name}' is empty or null.",
                    "suggested_correction": "Provide a valid non-empty value or configure a default value rule."
                })
                continue

            if val is None or str(val).strip() == "":
                continue

            str_val = str(val).strip()

            # 2. Email validation
            if data_type == "email":
                if not TypeDetector.is_email(str_val):
                    errors.append({
                        "row_number": row_number,
                        "field_name": api_name,
                        "severity": "Error",
                        "error_code": "INVALID_EMAIL",
                        "message": f"Value '{str_val}' is not a valid email address.",
                        "suggested_correction": "Ensure format matches user@domain.com"
                    })

            # 3. Phone validation
            elif data_type == "phone":
                if not TypeDetector.is_phone(str_val):
                    errors.append({
                        "row_number": row_number,
                        "field_name": api_name,
                        "severity": "Warning",
                        "error_code": "INVALID_PHONE",
                        "message": f"Value '{str_val}' may not be a valid phone number.",
                        "suggested_correction": "Verify country code and numerical digits."
                    })

            # 4. Date validation
            elif data_type == "date":
                if not TypeDetector.is_date(str_val):
                    errors.append({
                        "row_number": row_number,
                        "field_name": api_name,
                        "severity": "Error",
                        "error_code": "INVALID_DATE",
                        "message": f"Date value '{str_val}' cannot be parsed into standard date format.",
                        "suggested_correction": "Apply a date_format transformation rule."
                    })

            # 5. Picklist validation
            elif data_type == "picklist":
                allowed = constraints.get("allowed_values", [])
                if allowed:
                    allowed_lower = [str(a).lower() for a in allowed]
                    if str_val.lower() not in allowed_lower:
                        errors.append({
                            "row_number": row_number,
                            "field_name": api_name,
                            "severity": "Error",
                            "error_code": "VALUE_NOT_IN_PICKLIST",
                            "message": f"Value '{str_val}' is not in allowed picklist choices: {', '.join(allowed[:5])}.",
                            "suggested_correction": "Configure a picklist_map transformation rule to map to an allowed choice."
                        })

            # 6. Length check
            max_len = constraints.get("max_length")
            if max_len and len(str_val) > max_len:
                errors.append({
                    "row_number": row_number,
                    "field_name": api_name,
                    "severity": "Error",
                    "error_code": "FIELD_LENGTH_EXCEEDED",
                    "message": f"Field value exceeds maximum allowed length of {max_len} (current: {len(str_val)}).",
                    "suggested_correction": "Trim or shorten the source value."
                })

        return errors

    @classmethod
    def validate_dataset(cls, records: List[Dict[str, Any]], target_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
        all_errors = []
        valid_count = 0
        warning_count = 0
        error_count = 0

        for idx, rec in enumerate(records):
            row_num = idx + 1
            issues = cls.validate_record(row_num, rec, target_fields)
            if not issues:
                valid_count += 1
            else:
                has_error = any(i["severity"] == "Error" for i in issues)
                if has_error:
                    error_count += 1
                else:
                    warning_count += 1
                all_errors.extend(issues)

        return {
            "total_records": len(records),
            "valid_records": valid_count,
            "invalid_records": error_count,
            "warning_records": warning_count,
            "errors": all_errors
        }
