import uuid
from typing import Dict, List, Any, Optional
from app.connectors.zoho.base import BaseZohoConnector

BOOKS_MODULES = [
    {"api_name": "Customers", "label": "Customers"},
    {"api_name": "Vendors", "label": "Vendors"},
    {"api_name": "Items", "label": "Items"},
    {"api_name": "Invoices", "label": "Invoices"},
    {"api_name": "Bills", "label": "Bills"},
    {"api_name": "Chart_of_Accounts", "label": "Chart of Accounts"}
]

BOOKS_FIELDS: Dict[str, List[Dict[str, Any]]] = {
    "Customers": [
        {"api_name": "contact_name", "label": "Display Name", "data_type": "text", "is_mandatory": True, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "company_name", "label": "Company Name", "data_type": "text", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "email", "label": "Email", "data_type": "email", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "phone", "label": "Work Phone", "data_type": "phone", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "currency_code", "label": "Currency", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {"default": "USD"}},
    ],
    "Items": [
        {"api_name": "name", "label": "Item Name", "data_type": "text", "is_mandatory": True, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "rate", "label": "Selling Price", "data_type": "currency", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "sku", "label": "SKU", "data_type": "text", "is_mandatory": False, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "item_type", "label": "Product Type", "data_type": "picklist", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {"allowed_values": ["goods", "service"]}},
    ]
}

class ZohoBooksConnector(BaseZohoConnector):
    def validate_connection(self) -> Dict[str, Any]:
        return {
            "valid": True,
            "organization_id": "books_org_98214",
            "organization_name": "Zoho Books Org US",
            "api_domain": f"https://www.zohoapis.{self.data_center.lower()}/books/v3"
        }

    def get_organizations(self) -> List[Dict[str, Any]]:
        return [{"id": "books_org_98214", "name": "Zoho Books Org US", "primary": True}]

    def discover_modules(self) -> List[Dict[str, Any]]:
        return BOOKS_MODULES

    def discover_fields(self, module: str) -> List[Dict[str, Any]]:
        return BOOKS_FIELDS.get(module, [
            {"api_name": "name", "label": "Name", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {}},
        ])

    def discover_relationships(self, module: str) -> List[Dict[str, Any]]:
        return []

    def get_capabilities(self) -> Dict[str, bool]:
        return {
            "bulk_write": False,
            "upsert": False,
            "layouts": False,
            "subforms": False,
            "lookups": True,
            "max_records_per_request": 50
        }

    def import_records(self, module: str, records: List[Dict[str, Any]], options: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        results = []
        for idx, rec in enumerate(records):
            results.append({
                "record_index": idx,
                "status": "success",
                "target_id": f"books_{uuid.uuid4().hex[:12]}",
                "error_code": None,
                "error_message": None
            })
        return results
