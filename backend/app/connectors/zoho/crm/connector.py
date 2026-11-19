import uuid
from typing import Dict, List, Any, Optional
from app.connectors.zoho.base import BaseZohoConnector

CRM_STANDARD_MODULES = [
    {"api_name": "Leads", "label": "Leads", "singular_label": "Lead"},
    {"api_name": "Accounts", "label": "Accounts", "singular_label": "Account"},
    {"api_name": "Contacts", "label": "Contacts", "singular_label": "Contact"},
    {"api_name": "Deals", "label": "Deals", "singular_label": "Deal"},
    {"api_name": "Products", "label": "Products", "singular_label": "Product"},
    {"api_name": "Vendors", "label": "Vendors", "singular_label": "Vendor"},
    {"api_name": "Quotes", "label": "Quotes", "singular_label": "Quote"},
    {"api_name": "Invoices", "label": "Invoices", "singular_label": "Invoice"},
    {"api_name": "Tasks", "label": "Tasks", "singular_label": "Task"},
]

CRM_STANDARD_FIELDS: Dict[str, List[Dict[str, Any]]] = {
    "Leads": [
        {"api_name": "Last_Name", "label": "Last Name", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {"max_length": 80}},
        {"api_name": "First_Name", "label": "First Name", "data_type": "text", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {"max_length": 40}},
        {"api_name": "Company", "label": "Company", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {"max_length": 100}},
        {"api_name": "Email", "label": "Email", "data_type": "email", "is_mandatory": False, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "Phone", "label": "Phone", "data_type": "phone", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Lead_Status", "label": "Lead Status", "data_type": "picklist", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {"allowed_values": ["Not Contacted", "Attempted to Contact", "Contacted", "Qualified", "Lost Lead"]}},
        {"api_name": "Lead_Source", "label": "Lead Source", "data_type": "picklist", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {"allowed_values": ["Advertisement", "Cold Call", "Online Store", "Partner", "Web Download"]}},
        {"api_name": "Annual_Revenue", "label": "Annual Revenue", "data_type": "currency", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Description", "label": "Description", "data_type": "textarea", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
    ],
    "Accounts": [
        {"api_name": "Account_Name", "label": "Account Name", "data_type": "text", "is_mandatory": True, "is_unique": True, "is_read_only": False, "constraints": {"max_length": 120}},
        {"api_name": "Phone", "label": "Phone", "data_type": "phone", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Website", "label": "Website", "data_type": "url", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Billing_Country", "label": "Billing Country", "data_type": "text", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Billing_City", "label": "Billing City", "data_type": "text", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Annual_Revenue", "label": "Annual Revenue", "data_type": "currency", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
    ],
    "Contacts": [
        {"api_name": "Last_Name", "label": "Last Name", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {"max_length": 80}},
        {"api_name": "First_Name", "label": "First Name", "data_type": "text", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {"max_length": 40}},
        {"api_name": "Account_Name", "label": "Account Name", "data_type": "lookup", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {"lookup_module": "Accounts"}},
        {"api_name": "Email", "label": "Email", "data_type": "email", "is_mandatory": False, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "Phone", "label": "Phone", "data_type": "phone", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Title", "label": "Title", "data_type": "text", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
    ],
    "Deals": [
        {"api_name": "Deal_Name", "label": "Deal Name", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Account_Name", "label": "Account Name", "data_type": "lookup", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {"lookup_module": "Accounts"}},
        {"api_name": "Contact_Name", "label": "Contact Name", "data_type": "lookup", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {"lookup_module": "Contacts"}},
        {"api_name": "Stage", "label": "Stage", "data_type": "picklist", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {"allowed_values": ["Qualification", "Needs Analysis", "Value Proposition", "Proposal/Price Quote", "Closed Won", "Closed Lost"]}},
        {"api_name": "Amount", "label": "Amount", "data_type": "currency", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Closing_Date", "label": "Closing Date", "data_type": "date", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {}},
    ],
    "Products": [
        {"api_name": "Product_Name", "label": "Product Name", "data_type": "text", "is_mandatory": True, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "Product_Code", "label": "Product Code", "data_type": "text", "is_mandatory": False, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "Unit_Price", "label": "Unit Price", "data_type": "currency", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
    ],
    "Vendors": [
        {"api_name": "Vendor_Name", "label": "Vendor Name", "data_type": "text", "is_mandatory": True, "is_unique": True, "is_read_only": False, "constraints": {}},
        {"api_name": "Email", "label": "Email", "data_type": "email", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        {"api_name": "Phone", "label": "Phone", "data_type": "phone", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
    ]
}

class ZohoCRMConnector(BaseZohoConnector):
    def validate_connection(self) -> Dict[str, Any]:
        return {
            "valid": True,
            "organization_id": "org_zoho_crm_8492048",
            "organization_name": "Zoho Production CRM",
            "api_domain": f"https://www.zohoapis.{self.data_center.lower()}",
            "scopes": ["ZohoCRM.modules.ALL", "ZohoCRM.settings.ALL"]
        }

    def get_organizations(self) -> List[Dict[str, Any]]:
        return [{
            "id": "org_zoho_crm_8492048",
            "name": "Zoho Production CRM",
            "primary": True
        }]

    def discover_modules(self) -> List[Dict[str, Any]]:
        return CRM_STANDARD_MODULES

    def discover_fields(self, module: str) -> List[Dict[str, Any]]:
        return CRM_STANDARD_FIELDS.get(module, [
            {"api_name": "Name", "label": "Name", "data_type": "text", "is_mandatory": True, "is_unique": False, "is_read_only": False, "constraints": {}},
            {"api_name": "Email", "label": "Email", "data_type": "email", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
            {"api_name": "Phone", "label": "Phone", "data_type": "phone", "is_mandatory": False, "is_unique": False, "is_read_only": False, "constraints": {}},
        ])

    def discover_relationships(self, module: str) -> List[Dict[str, Any]]:
        fields = self.discover_fields(module)
        relationships = []
        for f in fields:
            if f["data_type"] == "lookup" and "lookup_module" in f.get("constraints", {}):
                relationships.append({
                    "field_api_name": f["api_name"],
                    "parent_module": f["constraints"]["lookup_module"],
                    "relationship_type": "many_to_one"
                })
        return relationships

    def get_capabilities(self) -> Dict[str, bool]:
        return {
            "bulk_write": True,
            "upsert": True,
            "layouts": True,
            "subforms": False,
            "lookups": True,
            "max_records_per_request": 100
        }

    def import_records(self, module: str, records: List[Dict[str, Any]], options: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        results = []
        for idx, rec in enumerate(records):
            # Check mandatory fields
            fields = self.discover_fields(module)
            mandatory_fields = [f["api_name"] for f in fields if f["is_mandatory"]]
            missing = [mf for mf in mandatory_fields if not rec.get(mf)]

            if missing:
                results.append({
                    "record_index": idx,
                    "status": "failed",
                    "target_id": None,
                    "error_code": "MANDATORY_NOT_FOUND",
                    "error_message": f"Missing mandatory field(s): {', '.join(missing)}"
                })
            else:
                generated_id = f"crm_{module.lower()}_{uuid.uuid4().hex[:12]}"
                results.append({
                    "record_index": idx,
                    "status": "success",
                    "target_id": generated_id,
                    "error_code": None,
                    "error_message": None
                })
        return results
