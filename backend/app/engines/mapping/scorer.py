import re
from typing import Dict, List, Any, Tuple
from difflib import SequenceMatcher

SYNONYM_GROUPS = [
    {"email", "mail", "e_mail", "customer_email", "work_email", "contact_email"},
    {"phone", "mobile", "cell", "telephone", "contact_number", "work_phone"},
    {"name", "full_name", "customer_name", "contact_name", "display_name", "first_name", "last_name"},
    {"company", "organization", "account_name", "business", "company_name"},
    {"id", "identifier", "code", "key", "customer_id", "lead_id", "product_code"},
    {"date", "created_date", "onboarding_date", "closing_date", "timestamp"},
    {"amount", "price", "annual_revenue", "unit_price", "rate", "cost", "revenue"},
    {"city", "billing_city", "location"},
    {"country", "billing_country", "region"},
    {"status", "lead_status", "stage", "state"}
]

TYPE_COMPATIBILITY: Dict[Tuple[str, str], float] = {
    ("Email", "email"): 1.0,
    ("Phone", "phone"): 1.0,
    ("Date", "date"): 1.0,
    ("Integer", "number"): 1.0,
    ("Integer", "currency"): 0.8,
    ("Decimal", "currency"): 1.0,
    ("Decimal", "number"): 1.0,
    ("Boolean", "boolean"): 1.0,
    ("Text", "text"): 1.0,
    ("Text", "textarea"): 1.0,
    ("Text", "picklist"): 0.7,
    ("Text", "email"): 0.4,
    ("Text", "phone"): 0.4,
}

class MappingScorer:
    @staticmethod
    def clean_name(name: str) -> str:
        return re.sub(r"[_\-\s]+", "", name.lower())

    @classmethod
    def calculate_name_similarity(cls, src: str, tgt: str) -> float:
        s1 = cls.clean_name(src)
        s2 = cls.clean_name(tgt)
        if s1 == s2:
            return 1.0
        if s1 in s2 or s2 in s1:
            return 0.85
        return SequenceMatcher(None, s1, s2).ratio()

    @classmethod
    def calculate_type_compatibility(cls, src_type: str, tgt_type: str) -> float:
        pair = (src_type, tgt_type.lower())
        if pair in TYPE_COMPATIBILITY:
            return TYPE_COMPATIBILITY[pair]
        if tgt_type.lower() == "text":
            return 0.75  # Most things can convert to text safely
        return 0.2

    @classmethod
    def calculate_semantic_similarity(cls, src: str, tgt: str) -> float:
        src_lower = src.lower().replace("-", "_")
        tgt_lower = tgt.lower().replace("-", "_")

        for group in SYNONYM_GROUPS:
            src_match = any(term in src_lower for term in group)
            tgt_match = any(term in tgt_lower for term in group)
            if src_match and tgt_match:
                return 1.0
        return 0.0

    @classmethod
    def calculate_sample_compatibility(cls, samples: List[Any], tgt_type: str, constraints: Dict[str, Any]) -> float:
        if not samples:
            return 0.5
        
        # If target is picklist, check percentage of samples in allowed values
        if tgt_type.lower() == "picklist" and "allowed_values" in constraints:
            allowed = {str(v).lower() for v in constraints["allowed_values"]}
            matching = sum(1 for s in samples if str(s).lower() in allowed)
            return matching / len(samples) if samples else 0.5

        return 0.9

    @classmethod
    def calculate_score(cls, src_name: str, src_type: str, samples: List[Any],
                        tgt_name: str, tgt_type: str, constraints: Dict[str, Any]) -> Tuple[float, str]:
        """
        Calculates composite score: 0.30N + 0.25T + 0.25M + 0.20V
        """
        N = cls.calculate_name_similarity(src_name, tgt_name)
        T = cls.calculate_type_compatibility(src_type, tgt_type)
        M = cls.calculate_semantic_similarity(src_name, tgt_name)
        V = cls.calculate_sample_compatibility(samples, tgt_type, constraints)

        score = (0.30 * N) + (0.25 * T) + (0.25 * M) + (0.20 * V)
        score = round(min(1.0, max(0.0, score)), 2)

        reason = []
        if N > 0.8:
            reason.append(f"Name match '{src_name}' ≈ '{tgt_name}'")
        if M > 0.8:
            reason.append("Semantic synonym match")
        if T > 0.8:
            reason.append(f"Compatible data type ({src_type} -> {tgt_type})")
        if not reason:
            reason.append(f"General candidate with score {score}")

        return score, "; ".join(reason)
