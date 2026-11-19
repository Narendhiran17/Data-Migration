from typing import Optional
from app.connectors.zoho.base import BaseZohoConnector
from app.connectors.zoho.crm.connector import ZohoCRMConnector
from app.connectors.zoho.creator.connector import ZohoCreatorConnector
from app.connectors.zoho.books.connector import ZohoBooksConnector
from app.connectors.zoho.desk.connector import ZohoDeskConnector
from app.core.exceptions import BadRequestException

class ZohoConnectorFactory:
    @staticmethod
    def get_connector(product: str, data_center: str = "US", access_token: Optional[str] = None) -> BaseZohoConnector:
        prod = product.upper().strip()
        if prod == "CRM":
            return ZohoCRMConnector(data_center=data_center, access_token=access_token)
        elif prod == "CREATOR":
            return ZohoCreatorConnector(data_center=data_center, access_token=access_token)
        elif prod in ["BOOKS", "INVENTORY"]:
            return ZohoBooksConnector(data_center=data_center, access_token=access_token)
        elif prod in ["DESK", "PROJECTS", "PEOPLE"]:
            return ZohoDeskConnector(data_center=data_center, access_token=access_token)
        else:
            raise BadRequestException(f"Unsupported Zoho product '{product}'.")
