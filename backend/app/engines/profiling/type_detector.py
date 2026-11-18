import re
from datetime import datetime
from typing import Any, List, Tuple, Optional

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}$")
BOOLEAN_VALUES = {"true", "false", "yes", "no", "1", "0", "y", "n", "t", "f"}

COMMON_DATE_FORMATS = [
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%m/%d/%Y",
    "%d/%m/%Y",
    "%Y/%m/%d",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "%d-%b-%Y",
    "%d %B %Y"
]

class TypeDetector:
    @staticmethod
    def is_null_or_empty(val: Any) -> bool:
        if val is None:
            return True
        if isinstance(val, str) and val.strip() == "":
            return True
        return False

    @staticmethod
    def is_integer(val: Any) -> bool:
        if isinstance(val, int) and not isinstance(val, bool):
            return True
        if isinstance(val, str):
            val = val.strip()
            return val.lstrip("-+").isdigit()
        return False

    @staticmethod
    def is_float(val: Any) -> bool:
        if isinstance(val, float):
            return True
        if isinstance(val, str):
            try:
                float(val.strip())
                return True
            except ValueError:
                return False
        return False

    @staticmethod
    def is_boolean(val: Any) -> bool:
        if isinstance(val, bool):
            return True
        if isinstance(val, str):
            return val.strip().lower() in BOOLEAN_VALUES
        return False

    @staticmethod
    def is_email(val: Any) -> bool:
        if isinstance(val, str):
            return bool(EMAIL_REGEX.match(val.strip()))
        return False

    @staticmethod
    def is_phone(val: Any) -> bool:
        if isinstance(val, str):
            cleaned = val.strip()
            # Clean string should contain mostly numbers and valid separators
            digits_only = re.sub(r"\D", "", cleaned)
            if 7 <= len(digits_only) <= 15:
                return bool(PHONE_REGEX.match(cleaned))
        elif isinstance(val, (int, float)):
            digits = str(int(val))
            return 7 <= len(digits) <= 15
        return False

    @staticmethod
    def is_date(val: Any) -> bool:
        if isinstance(val, (datetime,)):
            return True
        if not isinstance(val, str):
            return False
        s = val.strip()
        if len(s) < 6:
            return False
        for fmt in COMMON_DATE_FORMATS:
            try:
                datetime.strptime(s, fmt)
                return True
            except ValueError:
                continue
        return False

    @classmethod
    def infer_column_type(cls, values: List[Any], total_rows: int) -> Tuple[str, int, dict]:
        """
        Infers the data type of a list of non-null values and detects anomalies.
        Returns: (inferred_type, invalid_format_count, flags_dict)
        """
        non_empty = [v for v in values if not cls.is_null_or_empty(v)]
        if not non_empty:
            return "Text", 0, {}

        count = len(non_empty)
        email_matches = sum(1 for v in non_empty if cls.is_email(v))
        phone_matches = sum(1 for v in non_empty if cls.is_phone(v))
        date_matches = sum(1 for v in non_empty if cls.is_date(v))
        bool_matches = sum(1 for v in non_empty if cls.is_boolean(v))
        int_matches = sum(1 for v in non_empty if cls.is_integer(v))
        float_matches = sum(1 for v in non_empty if cls.is_float(v))

        flags = {
            "is_candidate_email": False,
            "is_candidate_phone": False,
            "is_candidate_date": False,
            "is_candidate_identifier": False
        }

        # Email check: if >= 50% match email pattern, classify as Email Candidate
        if email_matches > 0 and (email_matches / count) >= 0.5:
            flags["is_candidate_email"] = True
            invalid_count = count - email_matches
            return "Email", invalid_count, flags

        # Phone check: if >= 60% match phone pattern
        if phone_matches > 0 and (phone_matches / count) >= 0.6:
            flags["is_candidate_phone"] = True
            invalid_count = count - phone_matches
            return "Phone", invalid_count, flags

        # Date check: if >= 60% match date pattern
        if date_matches > 0 and (date_matches / count) >= 0.6:
            flags["is_candidate_date"] = True
            invalid_count = count - date_matches
            return "Date", invalid_count, flags

        # Boolean check: if 100% match boolean representation
        if bool_matches == count:
            return "Boolean", 0, flags

        # Integer check
        if int_matches == count:
            return "Integer", 0, flags

        # Float / Decimal check
        if float_matches == count:
            return "Decimal", 0, flags

        # Default fallback
        return "Text", 0, flags
