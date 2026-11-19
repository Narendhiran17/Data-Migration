from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

class BaseZohoConnector(ABC):
    def __init__(self, connection_id: Optional[str] = None, data_center: str = "US", access_token: Optional[str] = None):
        self.connection_id = connection_id
        self.data_center = data_center
        self.access_token = access_token

    @abstractmethod
    def validate_connection(self) -> Dict[str, Any]:
        """Validates OAuth token / connectivity."""
        pass

    @abstractmethod
    def get_organizations(self) -> List[Dict[str, Any]]:
        """Returns accessible Zoho organizations/portals."""
        pass

    @abstractmethod
    def discover_modules(self) -> List[Dict[str, Any]]:
        """Returns available modules, forms, or entity types."""
        pass

    @abstractmethod
    def discover_fields(self, module: str) -> List[Dict[str, Any]]:
        """
        Discovers all field metadata for a target entity.
        Returns list of dicts with:
        api_name, label, data_type, is_mandatory, is_unique, is_read_only, constraints
        """
        pass

    @abstractmethod
    def discover_relationships(self, module: str) -> List[Dict[str, Any]]:
        """Returns lookups and parent-child dependencies."""
        pass

    @abstractmethod
    def get_capabilities(self) -> Dict[str, bool]:
        """Returns supported features: bulk_write, upsert, lookups, layouts, etc."""
        pass

    @abstractmethod
    def import_records(self, module: str, records: List[Dict[str, Any]], options: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Executes record insertion / upsert and returns per-record result status and IDs."""
        pass
