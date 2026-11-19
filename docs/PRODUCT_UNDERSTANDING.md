# Product Understanding Brief: Zoho Data Migration Assistant

## 1. Product & Problem
Zoho Data Migration Assistant is a technical developer productivity platform for Zoho implementation developers, migration engineers, and technical consultants.
**The Problem:** Zoho data migrations historically require tedious manual Excel cleaning, guesswork mapping against custom organization fields, foreign-key lookup lookup failures due to incorrect import order, and lack of rollback/audit trails.

## 2. Primary Users & Operational Environment
- **Primary Users:** Zoho Associate Software Developers, Implementation Engineers, Technical Consultants.
- **Environment:** Desktop workstation (Web browser or native Tauri desktop shell), multi-monitor setups, handling spreadsheets with thousands of records, complex foreign key hierarchies, and strict data confidentiality.
- **Mental Model:** Developers think in terms of schemas, relational foreign keys, data types, null percentages, reproducible deterministic transformation rules, and pre-flight validation checklists.

## 3. Core Task Workflows
1. **Source Discovery & Ingestion:** Ingest client files (Excel multi-sheet, CSV, JSON), inspect data profiles, detect anomalies (malformed emails, invalid dates, duplicate rows).
2. **Target Schema Discovery:** Inspect live Zoho CRM/Creator organizations to discover actual custom fields, mandatory flags, picklist choices, and lookup relationships.
3. **Interactive Schema Mapping:** Map source columns to destination fields with composite ranking (Name, Type, Semantic Synonyms, Sample Compatibility) and human-in-the-loop review.
4. **Declarative Transformation Pipeline:** Apply deterministic transformations (phone normalization, date formatting, picklist mapping, trimming) without executing untrusted arbitrary scripts.
5. **Pre-flight Integrity & DAG Ordering:** Build topological execution order (Accounts -> Contacts -> Deals -> Quotes) and validate records before touching Zoho APIs.
6. **Controlled Execution & Lineage:** Run dry-run simulations, execute throttled API migrations, persist immutable source-to-target record ID mapping, and generate export ZIP packages.

## 4. What the Interface Must Avoid
- Generic AI-dashboard clichés: no neon purple gradients, no meaningless 4-card KPI rows, no promotional banner heroes, no emoji-as-icons.
- Monotonous card grids.
- Detached forms requiring users to type already-known field names.
- Silent errors or fake success states.
