from typing import Dict, List, Set, Tuple

class DependencyEngine:
    @staticmethod
    def build_dependency_order(entities: List[str], relationships: List[Dict[str, str]]) -> Tuple[List[str], bool, List[List[str]]]:
        """
        Takes entities and relationships: [{"parent": "Accounts", "child": "Contacts"}]
        Returns: (ordered_entities, has_cycle, cycles)
        """
        # Graph adjacency: parent -> list of children
        # In-degree counts how many parents an entity depends on
        adj: Dict[str, Set[str]] = {e: set() for e in entities}
        in_degree: Dict[str, int] = {e: 0 for e in entities}

        for rel in relationships:
            parent = rel["parent"]
            child = rel["child"]
            if parent in adj and child in adj:
                if child not in adj[parent]:
                    adj[parent].add(child)
                    in_degree[child] += 1

        # Kahn's algorithm for topological sorting
        queue = [e for e in entities if in_degree[e] == 0]
        order = []

        while queue:
            # Sort for deterministic ordering
            queue.sort()
            curr = queue.pop(0)
            order.append(curr)

            for child in adj[curr]:
                in_degree[child] -= 1
                if in_degree[child] == 0:
                    queue.append(child)

        has_cycle = len(order) < len(entities)
        cycles = []
        if has_cycle:
            unresolved = [e for e in entities if e not in order]
            cycles.append(unresolved)

        return order, has_cycle, cycles

    @staticmethod
    def get_standard_crm_order() -> List[str]:
        """Recommended topological order for standard Zoho CRM migrations."""
        return [
            "Users",
            "Accounts",
            "Vendors",
            "Contacts",
            "Products",
            "Price_Books",
            "Leads",
            "Deals",
            "Campaigns",
            "Quotes",
            "Sales_Orders",
            "Purchase_Orders",
            "Invoices",
            "Cases",
            "Tasks"
        ]
