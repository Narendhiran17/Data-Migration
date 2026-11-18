from abc import ABC, abstractmethod
from typing import Dict, List, Any
from pathlib import Path

class BaseSourceParser(ABC):
    @abstractmethod
    def parse(self, file_path: Path) -> Dict[str, Dict[str, Any]]:
        """
        Parses a source file.
        Returns a dictionary mapping sheet/table names to:
        {
            "columns": List[str],
            "records": List[Dict[str, Any]],
            "total_rows": int
        }
        """
        pass
