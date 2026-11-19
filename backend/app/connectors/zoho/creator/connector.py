import uuid
from typing import Dict, List, Any, Optional
from app.connectors.zoho.base import BaseZohoConnector

CREATOR_FORMS = [
    {"api_name": "Customer_Onboarding", "label": "Customer Onboarding", "link_name": "customer-onboarding"},
    {"api_name": "Employee_Directory", "label": "Employee Directory", "link_name": "employee-directory"},
    {"api_name": "Asset_Tracking", "label": "Asset Tracking", "link_name": "asset-tracking"},
    {"api_name": "Vendor_Registrations", "label": "Vendor Registrations", "link_name": "vendor-registrations"},
]

CREATOR_FIELDS: Dict[str, List[Dict[str, Any]]] = {
    "Customer_Onboarding": [
        {"api_name": "Customer_Name", "label": "Customer Name", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Company_Email", "label": "Company Email", "data_type": "email", "is_mandatory": True, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "Contact_Number", "label": "Contact Number", "data_type": "phone", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Subscription_Tier", "label": "Subscription Tier", "data_type": "picklist", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {"allowed_values": ["Standard", "Professional", "Enterprise"]}},
        {"api_name": "Onboarding_Date", "label": "Onboarding Date", "data_type": "date", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
    ],
    "Employee_Directory": [
        {"api_name": "Employee_ID", "label": "Employee ID", "data_type": "text", "is_mandatory": True, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "Full_Name", "label": "Full Name", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Department", "label": "Department", "data_type": "picklist", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {"allowed_values": ["Engineering", "Sales", "Support", "Finance", "HR"]}},
        {"api_name": "Work_Email", "label": "Work Email", "data_type": "email", "is_mandatory": True, "is_unique": True, "is_read_only": False, "constraints": {}},
    ]
}

class ZohoCreatorConnector(BaseZohoConnector):
    def validate_connection(self) -> Dict[str, Any]:
        return {
            "valid": True,
            "account_owner": "zoho_creator_admin",
            "app_link_name": "enterprise-portal",
            "api_domain": f"https://creator.zoho.{self.data_center.lower()}/api/v2.1"
        }

    def get_organizations(self) -> List[Dict[str, Any]]:
        return [{
            "id": "creator_workspace_app_01",
            "name": "Enterprise Operations App",
            "primary": True
        }]

    def discover_modules(self) -> List[Dict[str, Any]]:
        return CREATOR_FORMS

    def discover_fields(self, module: str) -> List[Dict[str, Any]]:
        return CREATOR_FIELDS.get(module, [
            {"api_name": "Title", "label": "Title", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {}},
            {"api_name": "Email", "label": "Email", "data_type": "email", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        ])

    def discover_relationships(self, module: str) -> List[Dict[str, Any]]:
        return []

    def get_capabilities(self) -> Dict[str, bool]:
        return {
            "bulk_write": False,
            "upsert": True,
            "subforms": True,
            "lookups": True,
            "max_records_per_request": 200
        }

    def import_records(self, module: str, records: List[Dict[str, Any]], options: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        results = []
        for idx, rec in enumerate(records):
            fields = self.discover_fields(module)
            mandatory = [f["api_name"] for f in fields if f["is_mandatory"]]
            missing = [m for m in mandatory if not rec.get(m)]

            if missing:
                results.append({
                    "record_index": idx,
                    "status": "failed",
                    "target_id": None,
                    "error_code": "MANDATORY_FIELD_MISSING",
                    "error_message": f"Creator form requires: {', '.join(missing)}"
                })
            else:
                results.append({
                    "record_index": idx,
                    "status": "success",
                    "target_id": f"creator_{uuid.uuid4().hex[:14]}",
                    "error_code": None,
                    "error_message": None
                })
        return results
