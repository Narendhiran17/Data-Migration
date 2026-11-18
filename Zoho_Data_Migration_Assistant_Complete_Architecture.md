# Zoho Data Migration Assistant

## Complete Product, Technical Architecture & Development Blueprint

**Document version:** 1.0\
**Status:** Architecture baseline\
**Product type:** Developer productivity platform\
**Platforms:** Web + Desktop\
**Primary users:** Zoho Associate Software Developers, implementation
developers, migration engineers and technical consultants\
**Initial Zoho integrations:** Zoho CRM and Zoho Creator\
**Future integrations:** Zoho Books, Inventory, Desk, Projects, People
and other supported Zoho products

------------------------------------------------------------------------

# 1. Executive Summary

Zoho Data Migration Assistant is a cross-platform application that helps
Zoho implementation teams analyse client data, understand destination
Zoho structures, map and transform source records, validate data quality
and relationships, generate import-ready packages, and optionally
execute controlled migrations through supported Zoho APIs.

The product is not intended to be another basic CSV importer. Its
primary value is reducing the manual work that developers currently
perform before and during data migration.

The platform will support:

-   Source files: Excel, CSV and JSON.
-   Structured databases: PostgreSQL, MySQL, SQL Server and additional
    adapters.
-   External systems: legacy CRM platforms and configurable REST/API
    sources.
-   Zoho destinations: CRM and Creator first, followed progressively by
    Books, Inventory, Desk, Projects, People and other products.
-   Migration modes: import-ready file generation and direct API
    migration.
-   AI capabilities: schema understanding, mapping recommendations,
    anomaly explanation and transformation suggestions.

## 1.1 Product objective

Provide one reusable migration workspace in which a developer can:

1.  Connect or upload client source data.
2.  Discover the target Zoho organization's actual schema.
3.  Profile and understand the source data.
4.  Map source fields to destination fields.
5.  Transform records using approved deterministic rules.
6.  Validate fields, records and relationships.
7.  Determine safe migration order.
8.  Generate import-ready packages.
9.  Optionally execute and monitor migration through Zoho APIs.
10. Reconcile results and produce an auditable report.

## 1.2 Primary users

-   Zoho Associate Software Developers.
-   Zoho implementation developers.
-   Data migration engineers.
-   Technical consultants.
-   Migration project administrators and reviewers.

The client organization remains the owner of its data. Users must have
appropriate authorization to access source systems and destination Zoho
organizations.

## 1.3 Product principles

-   Metadata-driven, not hardcoded to default Zoho modules.
-   Connector-based, not tied to one Zoho product.
-   Deterministic validation and transformation.
-   AI-assisted recommendations, with human approval for consequential
    decisions.
-   Preserve original source data and transformation lineage.
-   Explicit approval before direct migration.
-   Secure by design, with tenant/workspace isolation.
-   Build a modular monolith first; extract services only when justified
    by scale or operational needs.

------------------------------------------------------------------------

# 2. Product Scope and Boundaries

## 2.1 Supported source systems

  -----------------------------------------------------------------------
  Source type                         Initial approach
  ----------------------------------- -----------------------------------
  Excel (.xlsx)                       OpenPyXL, streaming/chunked
                                      processing where possible

  CSV                                 Python CSV / Polars

  JSON                                Streaming parser and schema
                                      inference

  PostgreSQL                          SQLAlchemy adapter

  MySQL                               SQLAlchemy adapter

  SQL Server                          SQLAlchemy with supported driver

  Legacy CRM                          Product-specific API adapter

  Other CRM                           REST API and configurable source
                                      adapter
  -----------------------------------------------------------------------

Additional source formats can be introduced through the source connector
interface.

## 2.2 Zoho destination scope

  -----------------------------------------------------------------------
  Product                 Example modules /       Rollout
                          entities                
  ----------------------- ----------------------- -----------------------
  Zoho CRM                Leads, Contacts,        Initial
                          Accounts, Deals,        
                          Products, Vendors,      
                          Campaigns, Quotes,      
                          Sales Orders, Invoices, 
                          Purchase Orders, Tasks, 
                          Cases, custom modules   

  Zoho Creator            Applications, forms,    Initial
                          fields, lookups,        
                          subforms, records       

  Zoho Books              Customers, vendors,     Later
                          items, invoices, bills, 
                          payments, expenses,     
                          accounts                

  Zoho Inventory          Items, warehouses,      Later
                          contacts, purchase      
                          orders, sales orders,   
                          packages, shipments     

  Zoho Desk               Tickets, contacts,      Later
                          accounts, agents,       
                          departments, products   

  Zoho Projects           Projects, tasks,        Later
                          milestones, users, bugs 

  Zoho People             Employees, departments, Later
                          designations,           
                          attendance, leave       
  -----------------------------------------------------------------------

**Important:** This table is a product coverage plan, not a claim that
all products expose identical metadata or import APIs. Each connector
must advertise the operations, field types, relationship capabilities
and API limits actually supported by its product and API version.

## 2.3 Functional boundaries

Included:

-   Source ingestion and profiling.
-   Zoho metadata discovery.
-   Field mapping.
-   Transformation rules.
-   AI-assisted recommendations.
-   Data validation.
-   Relationship and dependency analysis.
-   Import-ready package generation.
-   Controlled direct migration.
-   Monitoring, reconciliation and audit reports.

Not included in the initial release:

-   Replacing Zoho's native applications.
-   Unattended migration without user authorization.
-   Arbitrary execution of uploaded scripts.
-   Automatic changes to client business configuration.
-   Guaranteed rollback of every Zoho operation. Rollback capability
    varies by product and operation; compensating actions and recovery
    procedures must be designed explicitly.

------------------------------------------------------------------------

# 3. Product Modules

  -----------------------------------------------------------------------
  ID                      Module                  Responsibility
  ----------------------- ----------------------- -----------------------
  M01                     Workspace Management    Workspaces, users,
                                                  roles and migration
                                                  projects

  M02                     Source Connectors       Files, databases and
                                                  external systems

  M03                     Zoho Connectors         OAuth connections to
                                                  Zoho organizations and
                                                  products

  M04                     Metadata Discovery      Modules, forms, fields,
                                                  layouts and
                                                  relationships

  M05                     Data Profiling          Source structure,
                                                  statistics and quality
                                                  indicators

  M06                     Schema Mapping          Source-to-target
                                                  mapping and approval

  M07                     Transformation Engine   Deterministic data
                                                  conversion and cleaning

  M08                     AI Intelligence         Mapping and
                                                  transformation
                                                  suggestions, anomaly
                                                  explanations

  M09                     Validation Engine       File, schema, field,
                                                  record and relationship
                                                  validation

  M10                     Dependency Engine       Relationship graph and
                                                  migration ordering

  M11                     Package Generator       Product-specific
                                                  import-ready files and
                                                  reports

  M12                     Migration Executor      Controlled API-based
                                                  migration

  M13                     Monitoring and Audit    Job progress, logs,
                                                  audit and
                                                  reconciliation

  M14                     Reporting               Data quality and
                                                  migration outcome
                                                  reports
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 4. System Architecture

## 4.1 Architecture decision

Use a **modular monolith with asynchronous workers and independent
connector adapters** for the first release.

Do not begin with microservices. A modular monolith reduces deployment,
networking and operational complexity while the product and domain model
are being validated.

The architecture must still enforce module boundaries so components can
be extracted later if scale or team ownership requires it.

## 4.2 High-level architecture

``` mermaid
flowchart TB
    U[Web Browser / Desktop Client] --> FE[React + TypeScript Frontend]
    FE --> API[FastAPI Application API]
    API --> AUTH[Authentication and Authorization]
    API --> APP[Application Services]
    APP --> META[Metadata Discovery]
    APP --> PROFILE[Data Profiling]
    APP --> MAP[Mapping Engine]
    APP --> TRANS[Transformation Engine]
    APP --> VALID[Validation Engine]
    APP --> DEP[Dependency Engine]
    APP --> EXPORT[Package Generator]
    APP --> MIG[Migration Executor]
    APP --> AI[AI Orchestrator]

    API --> PG[(PostgreSQL)]
    API --> REDIS[(Redis)]
    REDIS --> WORKER[Celery Workers]
    WORKER --> OBJ[(Encrypted Object Storage)]
    WORKER --> ZOHO[Zoho Product APIs]
    WORKER --> SRC[Source Systems]
    AI --> MODEL[Approved AI Model Provider]
    API --> OBS[Logs / Metrics / Traces]
    WORKER --> OBS
```

## 4.3 Presentation layer

**Technology:** React, TypeScript and Vite.

Responsibilities:

-   Dashboard and workspace navigation.
-   Migration project management.
-   Source upload and connection configuration.
-   Zoho connection management.
-   Metadata browser.
-   Data profiling interface.
-   Field mapping editor.
-   Transformation rule editor.
-   Validation results and correction workflow.
-   Relationship/dependency visualizer.
-   Migration execution console.
-   Export center.
-   Reports and audit history.

The frontend must not contain Zoho secrets or perform privileged
migration operations directly. All such operations go through the
backend.

## 4.4 Desktop architecture

**Technology:** Tauri 2 with the shared React frontend.

Principles:

-   Share frontend components and backend APIs between web and desktop.
-   Do not duplicate migration business logic in the desktop
    application.
-   Use Tauri capabilities and permissions restrictively.
-   Do not expose arbitrary filesystem access to untrusted web content.
-   Decide whether desktop connects to a centrally hosted backend or an
    explicitly installed local backend. The initial product should use
    the same API contract in either deployment model.
-   Package and sign desktop builds for supported operating systems.

## 4.5 Backend architecture

**Technology:** Python and FastAPI.

Core components:

  Component                Responsibility
  ------------------------ -------------------------------------------
  Authentication service   Identity, sessions and token validation
  Workspace service        Workspace membership and access
  Project service          Migration project lifecycle
  Connector registry       Connector discovery and capabilities
  Source service           File and source-system ingestion
  Metadata service         Target metadata retrieval and snapshots
  Profiling service        Source statistics and inferred types
  Mapping service          Mapping suggestions and approved mappings
  AI service               Provider abstraction and AI orchestration
  Transformation service   Rule execution
  Validation service       Deterministic validation
  Dependency service       Relationship graph and ordering
  Export service           Package creation
  Migration service        Direct migration orchestration
  Audit service            Security and business audit events

Use explicit service interfaces, repositories for persistence, Pydantic
schemas at API boundaries and domain-level tests.

------------------------------------------------------------------------

# 5. Connector Architecture

## 5.1 Connector design

Implement common connector contracts and product-specific adapters.

A conceptual interface:

``` python
from abc import ABC, abstractmethod

class BaseZohoConnector(ABC):
    @abstractmethod
    async def validate_connection(self):
        ...

    @abstractmethod
    async def get_organizations(self):
        ...

    @abstractmethod
    async def discover_modules(self):
        ...

    @abstractmethod
    async def discover_fields(self, module):
        ...

    @abstractmethod
    async def discover_relationships(self, module):
        ...

    @abstractmethod
    async def get_capabilities(self):
        ...

    @abstractmethod
    async def import_records(self, module, records, options):
        ...

    @abstractmethod
    async def get_record(self, module, record_id):
        ...
```

This is a conceptual contract. A connector may report an operation as
unsupported if the product does not expose it or if the connected
account lacks permission.

## 5.2 Capability registry

Each connector must publish capabilities dynamically.

Example capability categories:

-   Discover organizations.
-   Discover modules/forms.
-   Discover fields.
-   Discover layouts.
-   Discover related lists.
-   Read records.
-   Create records.
-   Update records.
-   Upsert records.
-   Bulk import.
-   Upload files.
-   Resolve lookups.
-   Support subforms.
-   Retrieve import/job status.

The UI must not display unavailable operations as supported.

## 5.3 Source connector contract

Source adapters should provide:

-   Connection validation.
-   Source/table/sheet discovery.
-   Schema inference.
-   Paginated or chunked record iteration.
-   Record count estimation.
-   Stable source record references.
-   Source-specific error normalization.

Do not require every source adapter to load an entire dataset into
memory.

------------------------------------------------------------------------

# 6. Source Data Ingestion and Profiling

## 6.1 Ingestion pipeline

``` mermaid
flowchart TD
    A[Upload or Connect Source] --> B[File and Security Inspection]
    B --> C[Format Detection]
    C --> D[Parse Source]
    D --> E[Discover Sheets / Tables]
    E --> F[Infer Columns and Types]
    F --> G[Profile Records]
    G --> H[Detect Quality Issues]
    H --> I[Persist Schema and Statistics]
    I --> J[Display Analysis Report]
    J --> K[Ready for Mapping]
```

## 6.2 Profiling features

For each column, calculate where applicable:

-   Total records.
-   Null count and percentage.
-   Distinct value count.
-   Duplicate count.
-   Minimum and maximum.
-   Inferred data type.
-   Invalid format count.
-   Candidate identifier status.
-   Candidate email/phone/date status.
-   Sample values with sensitive data redacted.
-   Potential relationship candidates.

Example profile:

  Column          Inferred type                           Null %   Unique %
  --------------- ------------------------------------- -------- ----------
  Customer_ID     Integer/string identifier candidate         0%       100%
  Customer_Name   Text                                        2%        89%
  Email           Email candidate                             5%        93%
  Phone           Phone candidate                            12%        81%
  Created_Date    Date candidate                              0%        34%

Inferred type and semantic meaning must be kept separate. A numeric
column is not automatically a phone number or identifier.

## 6.3 File processing

-   Inspect actual file signatures, not only file extensions.
-   Apply file size, row count, decompression and processing limits.
-   Detect malformed or corrupted files safely.
-   Handle CSV quoting, delimiters, encodings and embedded newlines.
-   Detect Excel sheets independently.
-   Support JSON arrays and agreed JSON object formats.
-   Use chunked processing or Polars streaming for large datasets.
-   Store original source files immutably during the configured
    retention period.
-   Calculate checksums to detect accidental changes.

## 6.4 Source data lineage

Every transformed record must retain a reference to its original source
file, sheet/table and row or stable source key.

Never silently discard source values. Store transformation outcomes and
errors separately from the immutable original.

------------------------------------------------------------------------

# 7. Metadata Discovery

## 7.1 Zoho CRM metadata

Discover the connected organization's actual:

-   Standard and custom modules.
-   Module API names and labels.
-   Fields and API names.
-   Field data types.
-   Mandatory and read-only attributes.
-   Length and value constraints.
-   Picklist values.
-   Layouts and layout-specific requirements.
-   Related lists and supported relationships.
-   Unique fields where exposed.
-   API and import capabilities.

Do not assume all organizations have identical fields or layouts.

## 7.2 Zoho Creator metadata

Discover:

-   Applications.
-   Application link names.
-   Forms and form link names.
-   Fields and field link names.
-   Field types and constraints.
-   Mandatory and unique rules where exposed.
-   Lookup relationships.
-   Subforms.
-   Relevant reports and record access context where needed.

Creator applications are client-defined. Metadata discovery must be
dynamic.

## 7.3 Metadata snapshot strategy

Store versioned metadata snapshots with:

-   Product and API version.
-   Organization/application reference.
-   Retrieval timestamp.
-   Raw response or normalized representation.
-   Snapshot checksum.
-   Connector version.
-   Capability information.

Before migration, refresh or verify the metadata snapshot. If the
destination structure changed after mapping, flag affected mappings and
require revalidation.

------------------------------------------------------------------------

# 8. Field Mapping Engine

## 8.1 Mapping process

``` mermaid
flowchart TD
    A[Source Schema] --> C[Mapping Candidate Engine]
    B[Target Metadata] --> C
    C --> D[Exact Name Matching]
    C --> E[Type Compatibility]
    C --> F[Semantic Similarity]
    C --> G[Sample Value Compatibility]
    D --> H[Candidate Ranking]
    E --> H
    F --> H
    G --> H
    H --> I[AI Recommendation]
    I --> J[Risk and Confidence Assessment]
    J --> K{Developer Review}
    K -->|Approve| L[Versioned Mapping]
    K -->|Reject| M[Manual Mapping]
```

## 8.2 Mapping signals

-   Source and target field labels.
-   API names and aliases.
-   Field descriptions.
-   Compatible data types.
-   Sample value patterns.
-   Existing mapping templates, if authorized.
-   Relationship context.
-   Product-specific constraints.

## 8.3 Initial confidence scoring

An initial ranking model:

`Score = 0.30N + 0.25T + 0.25M + 0.20V`

Where:

-   N = name similarity.
-   T = type compatibility.
-   M = semantic similarity.
-   V = sample value compatibility.

All values are normalized between 0 and 1.

Initial recommendation bands:

  Score        Treatment
  ------------ ------------------------------------------------
  0.90--1.00   Strong suggestion; review policy still applies
  0.75--0.89   Review recommended
  0.50--0.74   Low confidence
  Below 0.50   No automatic recommendation

These thresholds must be calibrated using real migration examples.
Confidence is not proof of semantic correctness.

## 8.4 Mapping states

-   Suggested.
-   Approved.
-   Rejected.
-   Manually configured.
-   Needs review.
-   Invalidated by metadata change.

Mappings must be versioned. A migration job must record exactly which
mapping version it used.

------------------------------------------------------------------------

# 9. AI Intelligence Architecture

## 9.1 AI responsibilities

  -----------------------------------------------------------------------
  Capability              Input                   Output
  ----------------------- ----------------------- -----------------------
  Schema understanding    Field metadata and      Semantic interpretation
                          descriptions            

  Field mapping           Source and target       Mapping recommendations
                          metadata                

  Anomaly explanation     Profiles and validation Human-readable
                          findings                explanations

  Transformation          Source and target       Proposed rules
  suggestion              constraints             

  Relationship suggestion Keys and sample         Candidate relationships
                          patterns                

  Error explanation       Validation errors       Correction guidance
  -----------------------------------------------------------------------

## 9.2 AI components

``` text
AI Orchestrator
    |
    +-- Schema Understanding Agent
    |
    +-- Field Mapping Agent
    |
    +-- Transformation Suggestion Agent
    |
    +-- Anomaly Explanation Agent
    |
    +-- Relationship Suggestion Agent
    |
    +-- Validation Explanation Agent
```

These are logical components. Start with a single orchestrator and
provider abstraction; do not introduce unnecessary autonomous-agent
infrastructure.

## 9.3 Provider abstraction

Support an interchangeable model-provider interface, including
OpenAI-compatible providers and other approved model APIs.

Requirements:

-   Provider configuration outside application code.
-   Timeouts and retry policies.
-   Token/cost monitoring.
-   Structured output validation.
-   Model/version tracking.
-   Prompt versioning.
-   Redaction and data minimization.
-   Optional AI-disabled mode.

## 9.4 AI output contract

Example:

``` json
{
  "source_field": "Customer_Email",
  "target_field": "Email",
  "confidence": 0.97,
  "reason": "Both fields appear to represent an email address",
  "transformation_required": false,
  "requires_review": false
}
```

All AI output must be validated against Pydantic schemas. Reject unknown
or unsupported operations.

## 9.5 AI safety boundary

AI may recommend, explain and rank. It must not independently:

-   Approve mappings.
-   Connect to Zoho organizations.
-   Read arbitrary customer records.
-   Execute transformations outside the approved engine.
-   Start, cancel or retry migrations.
-   Delete or modify destination records.
-   Change organization configuration.

The deterministic backend and authorized user approval remain in
control.

Do not send complete customer datasets to external model providers by
default. Send only the minimum necessary metadata or redacted samples,
subject to customer policy and consent.

------------------------------------------------------------------------

# 10. Transformation Engine

## 10.1 Design principles

-   Deterministic.
-   Repeatable.
-   Versioned.
-   Testable.
-   Auditable.
-   Safe to preview before execution.

## 10.2 Initial transformations

  Category   Operations
  ---------- --------------------------------------------------------
  Text       Trim, replace, lowercase, uppercase
  Numeric    Integer conversion, decimal parsing, rounding
  Date       Parse, format, timezone conversion
  Phone      Normalize and format with configured country rules
  Email      Trim, lowercase and syntax validation
  Boolean    Convert approved Yes/No and True/False representations
  Choice     Map source values to destination picklist values
  Lookup     Resolve source keys to destination record IDs
  Custom     Approved sandboxed transformation functions

## 10.3 Transformation DSL

Use a declarative JSON-based rule format. Do not execute arbitrary
Python, JavaScript or shell code uploaded by users.

Example:

``` json
{
  "rule_type": "trim",
  "source_field": "Customer_Name",
  "target_field": "Last_Name",
  "enabled": true,
  "execution_order": 1
}
```

Support preview, test cases, versioning and per-record error reporting.

Preserve original values and record the transformed result separately.

------------------------------------------------------------------------

# 11. Validation Engine

## 11.1 Validation layers

1.  File-level validation.
2.  Schema-level validation.
3.  Field-level validation.
4.  Record-level validation.
5.  Relationship-level validation.
6.  Destination organization validation.

## 11.2 Validation categories

-   Required fields.
-   Data type compatibility.
-   Field length.
-   Email and phone format.
-   Date parsing and accepted ranges.
-   Picklist and allowed values.
-   Unique constraints and duplicate candidates.
-   Lookup resolution.
-   Relationship integrity.
-   Unsupported/read-only/formula fields.
-   Product-specific API constraints.

## 11.3 Severity

  -----------------------------------------------------------------------
  Severity                            Behaviour
  ----------------------------------- -----------------------------------
  Error                               Blocks export or migration unless a
                                      documented exception is approved

  Warning                             Requires review; may continue
                                      according to project policy

  Information                         Non-blocking observation
  -----------------------------------------------------------------------

## 11.4 Error codes

``` text
MISSING_REQUIRED_FIELD
INVALID_DATA_TYPE
INVALID_EMAIL
INVALID_DATE
VALUE_NOT_IN_PICKLIST
DUPLICATE_RECORD
LOOKUP_NOT_FOUND
RELATIONSHIP_CONFLICT
FIELD_LENGTH_EXCEEDED
TARGET_FIELD_UNSUPPORTED
SOURCE_VALUE_AMBIGUOUS
METADATA_CHANGED
```

## 11.5 Validation result contract

``` python
from dataclasses import dataclass
from typing import Optional

@dataclass
class ValidationResult:
    row_number: int
    field_name: Optional[str]
    severity: str
    error_code: str
    message: str
    suggested_correction: Optional[str] = None
```

The production implementation should use validated Pydantic/domain
schemas and persist the source record reference, not depend solely on a
physical row number.

------------------------------------------------------------------------

# 12. Relationship and Dependency Engine

## 12.1 Purpose

Many Zoho modules and Creator forms contain relationships. Importing
child records before their parent records may cause lookup failures.

The dependency engine builds a directed graph of entities and their
references.

Example:

``` mermaid
flowchart TD
    A[Accounts] --> B[Contacts]
    A --> C[Deals]
    B --> C
    C --> D[Quotes]
    A --> E[Sales Orders]
```

## 12.2 Responsibilities

-   Detect candidate primary keys and foreign keys.
-   Identify parent-child relationships.
-   Read known target relationships from metadata.
-   Validate source relationship values.
-   Detect missing parent references.
-   Generate a dependency graph.
-   Determine a safe topological execution order.
-   Detect circular dependencies.
-   Maintain source-to-target ID mappings.
-   Resolve dependent record references during migration.

## 12.3 Circular dependencies

If a dependency cycle exists:

1.  Identify the cycle.
2.  Display the affected entities and fields.
3.  Determine whether the target supports a staged or deferred
    relationship update.
4.  Request a developer-approved strategy.
5.  Do not silently invent an import order.

## 12.4 Creator-specific relationships

Creator lookups and subforms need product-specific handling. A subform
is not necessarily equivalent to an independent child module. The
connector must inspect the form structure and supported API behaviour
before generating records or executing writes.

------------------------------------------------------------------------

# 13. Import-Ready Package Generator

## 13.1 Output formats

-   CSV.
-   XLSX where appropriate.
-   JSON.
-   ZIP migration package containing multiple related files and reports.

## 13.2 Package contents

A package may include:

``` text
migration-package/
├── README.md
├── manifest.json
├── source-summary.json
├── target-metadata.json
├── mappings.json
├── transformation-rules.json
├── dependency-plan.json
├── data/
│   ├── accounts.csv
│   ├── contacts.csv
│   ├── deals.csv
│   └── quotes.csv
└── reports/
    ├── validation-summary.csv
    ├── validation-errors.csv
    ├── warnings.csv
    └── migration-instructions.pdf
```

Actual package files depend on the destination product and supported
import capabilities.

## 13.3 Package requirements

-   Correct target API/import field names.
-   Product-specific data formatting.
-   Correct dependency order.
-   Record counts and checksums.
-   Mapping and metadata version references.
-   Validation summary.
-   Error and warning files.
-   Instructions for manual import where required.
-   No secrets or OAuth tokens in the package.

------------------------------------------------------------------------

# 14. Zoho Integration and Direct Migration

## 14.1 OAuth architecture

Use Zoho OAuth 2.0 with product-appropriate scopes and data-center
configuration.

``` mermaid
sequenceDiagram
    participant U as Developer
    participant F as Frontend
    participant B as FastAPI
    participant Z as Zoho OAuth
    participant S as Secrets Store

    U->>F: Connect Zoho
    F->>B: Start authorization
    B->>Z: Redirect to authorization
    Z->>U: Consent screen
    U->>Z: Approve scopes
    Z->>B: Authorization callback
    B->>B: Validate state and callback
    B->>Z: Exchange authorization code
    Z->>B: Access and refresh tokens
    B->>S: Store encrypted credentials
    B->>F: Connection status
```

Requirements:

-   Use authorization code flow and PKCE where supported.
-   Validate OAuth state.
-   Use correct Zoho data-center endpoints.
-   Request least-privilege scopes.
-   Keep refresh tokens out of the frontend.
-   Encrypt tokens using managed key infrastructure.
-   Refresh tokens securely.
-   Handle revocation and expired connections.
-   Support disconnect and credential deletion.

## 14.2 Zoho CRM connector

Initial capabilities to investigate and implement:

-   Module discovery.
-   Field discovery.
-   Layout discovery.
-   Related-list discovery.
-   Record retrieval.
-   Record insertion.
-   Update/upsert where supported.
-   Bulk operations for larger migrations.
-   Job status and error retrieval.

The connector must respect the API version, edition, account
permissions, field restrictions, API limits and product-specific import
behaviour.

For ordinary CRM record insertion, API calls commonly support up to 100
records per request. CRM Bulk Write is intended for larger asynchronous
operations and has separate limits and job handling. Verify current
limits in the official documentation before implementation.

## 14.3 Zoho Creator connector

Initial capabilities to investigate and implement:

-   Application discovery.
-   Form discovery.
-   Field discovery.
-   Lookup metadata.
-   Subform metadata.
-   Record retrieval.
-   Record insertion.
-   Product-specific file upload handling.

Creator API v2.1 has metadata APIs for forms and fields. Its Add Records
API supports up to 200 records per request in documented scenarios. Some
fields, including formula, auto-number and file-upload fields, require
special handling or cannot be populated through the ordinary Add Records
request. Verify current API constraints before implementing.

Creator workflows may execute when records are created through APIs. The
migration preview must explain workflow implications to the developer.

## 14.4 Books and Inventory connectors

Implement after CRM and Creator foundations.

Requirements include:

-   Organization-specific context.
-   Product-specific metadata.
-   Customers and vendors.
-   Items and identifiers.
-   Currency and financial fields.
-   Taxes and configuration dependencies.
-   Warehouse references.
-   Transaction relationships.
-   Product-specific pagination and API limits.

Do not treat invoices, bills or inventory transactions as generic rows.
Their business rules and related records must be respected.

## 14.5 Direct migration workflow

``` mermaid
flowchart TD
    A[Developer Requests Migration] --> B[Check Authorization]
    B --> C[Refresh Target Metadata]
    C --> D[Revalidate Mapping and Records]
    D --> E{Blocking Errors?}
    E -->|Yes| F[Stop and Report]
    E -->|No| G[Build Dependency Graph]
    G --> H[Create Dry Run]
    H --> I[Developer Reviews and Approves]
    I --> J[Create Migration Job]
    J --> K[Execute Parent Records]
    K --> L[Persist Target IDs]
    L --> M[Resolve Child Lookups]
    M --> N[Execute Dependent Records]
    N --> O[Collect Record Results]
    O --> P[Reconcile Counts and Errors]
    P --> Q[Generate Final Report]
```

## 14.6 Execution controls

-   Dry-run mode.
-   Test organization support.
-   Explicit approval.
-   Create-only, update-only and upsert modes where supported.
-   Duplicate policy selection.
-   Idempotency keys or equivalent safeguards.
-   Batching and throttling.
-   API quota monitoring.
-   Retry only failed records.
-   Cancellation where safely supported.
-   Per-record result storage.
-   Source-to-target ID mapping.
-   Final reconciliation report.

Never claim rollback unless the relevant product operation supports it.
Use compensating actions and documented recovery plans where necessary.

------------------------------------------------------------------------

# 15. Database Architecture

**Database:** PostgreSQL.

Store project configuration, schema snapshots, mapping definitions,
validation results, migration execution state and audit history. Store
large source files and generated packages in encrypted object storage
rather than as database blobs by default.

## 15.1 Entity relationship diagram

``` mermaid
erDiagram
    USERS ||--o{ WORKSPACE_MEMBERS : joins
    WORKSPACES ||--o{ WORKSPACE_MEMBERS : contains
    WORKSPACES ||--o{ MIGRATION_PROJECTS : contains
    MIGRATION_PROJECTS ||--o{ SOURCE_CONNECTIONS : has
    MIGRATION_PROJECTS ||--o{ ZOHO_CONNECTIONS : uses
    MIGRATION_PROJECTS ||--o{ SOURCE_FILES : uploads
    SOURCE_FILES ||--o{ SOURCE_SCHEMAS : produces
    MIGRATION_PROJECTS ||--o{ TARGET_SCHEMAS : discovers
    MIGRATION_PROJECTS ||--o{ FIELD_MAPPINGS : configures
    MIGRATION_PROJECTS ||--o{ TRANSFORMATION_RULES : defines
    MIGRATION_PROJECTS ||--o{ VALIDATION_JOBS : runs
    VALIDATION_JOBS ||--o{ VALIDATION_ERRORS : reports
    MIGRATION_PROJECTS ||--o{ MIGRATION_JOBS : executes
    MIGRATION_JOBS ||--o{ MIGRATION_BATCHES : contains
    MIGRATION_BATCHES ||--o{ RECORD_RESULTS : records
    MIGRATION_PROJECTS ||--o{ RECORD_ID_MAPPINGS : resolves
    MIGRATION_PROJECTS ||--o{ EXPORT_PACKAGES : generates
    USERS ||--o{ AUDIT_LOGS : performs
    MIGRATION_PROJECTS ||--o{ AUDIT_LOGS : tracks
```

## 15.2 Core tables

### users

  Column          Type               Notes
  --------------- ------------------ -------------------------------
  id              UUID               Primary key
  email           VARCHAR            Unique identity
  password_hash   VARCHAR nullable   Only for local authentication
  display_name    VARCHAR            Display name
  status          VARCHAR            Active/disabled
  created_at      TIMESTAMPTZ        Creation time

### workspaces

  Column       Type          Notes
  ------------ ------------- ----------------
  id           UUID          Primary key
  name         VARCHAR       Workspace name
  owner_id     UUID          User reference
  created_at   TIMESTAMPTZ   Creation time

### workspace_members

  Column         Type      Notes
  -------------- --------- ---------------------------------------
  id             UUID      Primary key
  workspace_id   UUID      Workspace reference
  user_id        UUID      User reference
  role           VARCHAR   Owner/Admin/Developer/Reviewer/Viewer

### migration_projects

  Column           Type          Notes
  ---------------- ------------- ---------------------
  id               UUID          Primary key
  workspace_id     UUID          Workspace reference
  name             VARCHAR       Project name
  description      TEXT          Optional
  source_type      VARCHAR       File/database/CRM
  target_product   VARCHAR       CRM/Creator/etc.
  status           VARCHAR       Project lifecycle
  created_by       UUID          User reference
  created_at       TIMESTAMPTZ   Creation time
  updated_at       TIMESTAMPTZ   Update time

### zoho_connections

  ---------------------------------------------------------------------------
  Column                  Type                    Notes
  ----------------------- ----------------------- ---------------------------
  id                      UUID                    Primary key

  workspace_id            UUID                    Workspace reference

  product                 VARCHAR                 CRM/Creator/Books/etc.

  organization_id         VARCHAR nullable        Product-specific
                                                  organization identifier

  data_center             VARCHAR                 Zoho DC

  account_owner           VARCHAR nullable        Creator-specific context if
                                                  needed

  app_link_name           VARCHAR nullable        Creator app reference

  credential_reference    VARCHAR                 Secrets-vault reference

  status                  VARCHAR                 Connected/expired/revoked

  created_at              TIMESTAMPTZ             Creation time
  ---------------------------------------------------------------------------

### source_connections

  Column                 Type      Notes
  ---------------------- --------- -------------------------------
  id                     UUID      Primary key
  project_id             UUID      Project reference
  source_type            VARCHAR   PostgreSQL/MySQL/CRM/etc.
  connection_config      JSONB     Non-secret configuration only
  credential_reference   VARCHAR   Secrets-vault reference
  status                 VARCHAR   Connection status

### source_files

  Column              Type          Notes
  ------------------- ------------- --------------------------
  id                  UUID          Primary key
  project_id          UUID          Project reference
  original_filename   VARCHAR       Original filename
  storage_key         VARCHAR       Object storage key
  file_format         VARCHAR       XLSX/CSV/JSON
  file_size           BIGINT        Bytes
  checksum            VARCHAR       Integrity checksum
  status              VARCHAR       Uploaded/analysed/failed
  uploaded_at         TIMESTAMPTZ   Upload time

### source_schemas

  Column                Type      Notes
  --------------------- --------- -----------------------
  id                    UUID      Primary key
  file_id               UUID      Source file reference
  sheet_or_table_name   VARCHAR   Sheet/table
  column_name           VARCHAR   Source column
  inferred_type         VARCHAR   Inferred type
  nullable              BOOLEAN   Null presence
  sample_values         JSONB     Redacted examples
  statistics            JSONB     Profiling statistics

### target_schemas

  Column             Type      Notes
  ------------------ --------- ----------------------
  id                 UUID      Primary key
  project_id         UUID      Project reference
  product            VARCHAR   Zoho product
  module_or_form     VARCHAR   Module/form
  field_api_name     VARCHAR   API/link name
  field_label        VARCHAR   Display label
  data_type          VARCHAR   Product field type
  is_mandatory       BOOLEAN   Required status
  is_unique          BOOLEAN   Unique where exposed
  constraints        JSONB     Restrictions
  metadata_version   VARCHAR   Snapshot version

### field_mappings

  Column             Type            Notes
  ------------------ --------------- -----------------------------
  id                 UUID            Primary key
  project_id         UUID            Project reference
  source_schema_id   UUID            Source field
  target_schema_id   UUID            Target field
  mapping_type       VARCHAR         Direct/AI/manual
  confidence         NUMERIC         Recommendation score
  status             VARCHAR         Suggested/approved/rejected
  approved_by        UUID nullable   Reviewer
  version            INTEGER         Mapping version
  created_at         TIMESTAMPTZ     Creation time

### transformation_rules

  Column            Type      Notes
  ----------------- --------- ---------------------------
  id                UUID      Primary key
  project_id        UUID      Project reference
  mapping_id        UUID      Mapping reference
  rule_type         VARCHAR   Rule type
  configuration     JSONB     Declarative configuration
  execution_order   INTEGER   Rule order
  enabled           BOOLEAN   Active status
  version           INTEGER   Rule version

### validation_jobs

-   id (UUID)
-   project_id (UUID)
-   source_file_id (UUID)
-   status
-   total_records
-   valid_records
-   invalid_records
-   warning_records
-   started_at
-   completed_at

### validation_errors

-   id (UUID)
-   validation_job_id (UUID)
-   source_record_reference
-   row_number nullable
-   field_name nullable
-   error_code
-   severity
-   message
-   suggested_correction nullable

### migration_jobs

-   id (UUID)
-   project_id (UUID)
-   target_product
-   target_module
-   execution_mode
-   status
-   total_records
-   successful_records
-   failed_records
-   approved_by
-   started_at
-   completed_at

### migration_batches

-   id (UUID)
-   migration_job_id (UUID)
-   batch_number
-   status
-   request_reference
-   retry_count
-   response_summary

### record_results

-   id (UUID)
-   batch_id (UUID)
-   source_record_reference
-   source_record_key
-   target_record_id nullable
-   status
-   error_code nullable
-   error_message nullable

### record_id_mappings

-   id (UUID)
-   project_id (UUID)
-   target_module
-   source_record_key
-   target_record_id
-   external_identifier nullable

### export_packages

-   id (UUID)
-   project_id (UUID)
-   package_name
-   storage_key
-   format
-   checksum
-   record_count
-   created_at

### audit_logs

-   id (UUID)
-   workspace_id
-   project_id nullable
-   user_id
-   action
-   resource_type
-   resource_id
-   metadata JSONB
-   timestamp

## 15.3 Database principles

-   UUID primary keys.
-   Foreign key constraints.
-   Index workspace, project, job and source-record identifiers.
-   Use JSONB for flexible metadata, not as a substitute for core
    relational modelling.
-   Version mappings and transformation rules.
-   Store raw metadata snapshots separately from normalized field rows.
-   Never store raw OAuth tokens or database passwords in ordinary
    application tables.
-   Use Alembic for schema migrations.
-   Apply tenant/workspace authorization to every data access path.
-   Define retention and deletion policies for source files, derived
    records and logs.

------------------------------------------------------------------------

# 16. API Architecture

Base path: `/api/v1`

## 16.1 Endpoint groups

  Method   Endpoint                            Purpose
  -------- ----------------------------------- ----------------------------
  POST     `/auth/register`                    Register user
  POST     `/auth/login`                       Authenticate
  GET      `/workspaces`                       List workspaces
  POST     `/workspaces`                       Create workspace
  GET      `/projects`                         List projects
  POST     `/projects`                         Create project
  GET      `/projects/{id}`                    Project details
  POST     `/sources/upload`                   Upload source file
  POST     `/sources/analyse`                  Start source analysis
  GET      `/sources/{id}/profile`             Profiling report
  GET      `/zoho/oauth/{product}/authorize`   Start OAuth
  GET      `/zoho/oauth/callback`              OAuth callback
  GET      `/zoho/connections`                 List connections
  POST     `/metadata/discover`                Discover target metadata
  GET      `/metadata/{project_id}`            Retrieve target schema
  POST     `/mappings/suggest`                 Suggest mappings
  POST     `/mappings`                         Save mapping
  PUT      `/mappings/{id}`                    Update mapping
  POST     `/transformations/preview`          Preview transformation
  POST     `/validations/run`                  Run validation
  GET      `/validations/{id}`                 Validation results
  POST     `/exports/generate`                 Generate package
  GET      `/exports/{id}/download`            Download package
  POST     `/migrations/dry-run`               Simulate migration
  POST     `/migrations/execute`               Execute approved migration
  GET      `/migrations/{id}`                  Migration status
  POST     `/migrations/{id}/cancel`           Request cancellation
  GET      `/audit`                            Retrieve audit records

## 16.2 API response contract

Success:

``` json
{
  "success": true,
  "message": "Source analysis completed",
  "data": {
    "source_id": "uuid",
    "total_rows": 5000,
    "total_columns": 12,
    "detected_sheets": 3
  },
  "error": null,
  "request_id": "uuid"
}
```

Error:

``` json
{
  "success": false,
  "message": "Source analysis failed",
  "data": null,
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "details": "Unsupported file format"
  },
  "request_id": "uuid"
}
```

Requirements:

-   Correct HTTP status codes.
-   Pagination for large result sets.
-   Request correlation IDs.
-   Consistent error codes.
-   Idempotency for operations that may be retried.
-   WebSocket or Server-Sent Events for live job progress.
-   OpenAPI documentation generated from FastAPI schemas.

------------------------------------------------------------------------

# 17. Security Architecture

## 17.1 Security layers

1.  Identity security.
2.  API security.
3.  Data security.
4.  Processing security.
5.  AI security.
6.  Migration security.
7.  Infrastructure security.

## 17.2 Authentication and authorization

Use role-based access control.

  Role              Permissions
  ----------------- ---------------------------------------------------
  Workspace Owner   Full workspace control
  Administrator     Members, connections and projects
  Developer         Create, map, validate and execute when authorized
  Reviewer          Review mappings and approve migrations
  Viewer            Read projects and reports

Require a distinct migration approval permission. A developer's ability
to prepare a migration must not automatically grant permission to
execute it.

## 17.3 Sensitive data protection

  Data                   Protection
  ---------------------- ------------------------------------------------
  Zoho refresh tokens    Envelope encryption with managed KMS
  Database credentials   Secrets vault
  Source files           Encrypted object storage
  Customer records       Tenant isolation and access control
  AI prompts             Data minimization and redaction
  Reports                Access-controlled, expiring downloads
  Audit records          Append-only design and restricted modification

Additional controls:

-   File signature validation.
-   File size and decompression limits.
-   ZIP-bomb and malicious-document protection.
-   Temporary file cleanup.
-   Signed URLs with short expiration.
-   Configurable retention and deletion.
-   Avoid full customer records in logs.
-   Restrict CORS and API origins.
-   Apply rate limits.
-   Validate all user-controlled paths and query parameters.
-   Prevent server-side request forgery in URL-based source connectors.
-   Use least-privilege service accounts.

## 17.4 AI security

-   Treat uploaded content and source records as untrusted data.
-   Defend against prompt injection in text fields and documents.
-   Do not give AI direct connector credentials.
-   Do not let AI execute arbitrary code or tools.
-   Validate AI output against strict schemas.
-   Record model and prompt versions.
-   Minimize data sent to external providers.
-   Allow customer/workspace AI policy controls.

## 17.5 Compliance readiness

Design for applicable requirements such as GDPR and India's Digital
Personal Data Protection Act. Support data retention, deletion, access
controls, auditability and customer-specific data residency where
required.

Architecture alone does not establish legal compliance or certification.
Obtain appropriate legal and security review before production
deployment.

------------------------------------------------------------------------

# 18. Observability and Reliability

## 18.1 Logging

Use structured logs with:

-   Timestamp.
-   Severity.
-   Request ID.
-   Workspace and project IDs.
-   Job and batch IDs.
-   Connector name and version.
-   Operation.
-   Duration.
-   Error code.

Do not log secrets or complete customer records.

## 18.2 Metrics

Track:

-   File upload success/failure.
-   Analysis duration.
-   Records profiled per second.
-   Memory and CPU usage.
-   Validation error counts.
-   AI request latency and cost.
-   Zoho API request counts and throttling.
-   Migration success/failure.
-   Retry counts.
-   Queue depth and worker health.

## 18.3 Reliability controls

-   Background jobs with retry policies.
-   Dead-letter handling.
-   Idempotent job execution.
-   Checkpointing for large datasets.
-   Safe cancellation.
-   Database backups and restore tests.
-   Object storage lifecycle policies.
-   Connector timeout and circuit-breaker policies.
-   API quota awareness.
-   Reconciliation after partial failure.

------------------------------------------------------------------------

# 19. Deployment Architecture

## 19.1 Initial deployment

Use Docker-based development and deployment.

``` mermaid
flowchart TB
    CLIENT[Web / Desktop Client] --> PROXY[Reverse Proxy]
    PROXY --> API[FastAPI API]
    API --> PG[(PostgreSQL)]
    API --> REDIS[(Redis)]
    REDIS --> WORKER[Celery Workers]
    WORKER --> STORAGE[(Object Storage)]
    WORKER --> ZOHO[Zoho APIs]
    WORKER --> SOURCE[Source Databases]
    API --> MON[Monitoring]
    WORKER --> MON
```

## 19.2 Infrastructure components

-   Docker and Docker Compose for local development.
-   PostgreSQL.
-   Redis.
-   Celery workers.
-   S3-compatible object storage.
-   Managed secrets/KMS in production.
-   Reverse proxy and TLS.
-   Centralized logging and monitoring.
-   Automated database backups.
-   CI/CD pipelines.
-   Signed desktop releases.

## 19.3 Environment separation

Maintain separate environments:

-   Local development.
-   Automated testing.
-   Staging.
-   Production.

Use separate Zoho OAuth applications, credentials, databases and storage
buckets where appropriate.

------------------------------------------------------------------------

# 20. Testing Strategy

## 20.1 Testing layers

  Test type     Coverage
  ------------- ----------------------------------------------------------
  Unit          Profiling, mapping, transformations and validation
  Integration   Database, storage, queue and connector adapters
  Contract      Connector and API response contracts
  End-to-end    Full upload-to-export workflow
  Security      Authentication, authorization, file handling and secrets
  Performance   Large files, concurrent projects and job queues
  Recovery      Worker restarts, retries and partial migrations

## 20.2 Test datasets

Create permanent, synthetic test fixtures for:

-   Normal Excel files.
-   Multi-sheet workbooks.
-   CSV with quoted commas.
-   UTF-8 and Tamil text.
-   Mixed date formats.
-   Duplicate identifiers.
-   Invalid emails and phone numbers.
-   Null and blank fields.
-   Corrupted documents.
-   Large datasets.
-   Malformed JSON.
-   Parent-child datasets.
-   Circular relationships.

Do not use real client personal data in routine development fixtures.

------------------------------------------------------------------------

# 21. Complete Development Roadmap

  -----------------------------------------------------------------------
  Sprint                  Deliverable             Outcome
  ----------------------- ----------------------- -----------------------
  1                       Source analysis engine  Upload, parse and
                                                  profile client data

  2                       Zoho CRM metadata       Discover modules,
                          connector               fields and layouts

  3                       Mapping engine          Source-to-target
                                                  mapping

  4                       Transformation engine   Deterministic data
                                                  conversion

  5                       Validation and          Quality and
                          dependency engine       relationship
                                                  verification

  6                       Package generator       Import-ready files and
                                                  reports

  7                       Zoho Creator connector  Creator forms, fields,
                                                  lookups and subforms

  8                       AI intelligence         Mapping and anomaly
                                                  recommendations

  9                       Books and Inventory     Additional product
                                                  connectors

  10                      Direct migration        Controlled API
                                                  execution

  11                      Remaining Zoho products Desk, Projects, People
                                                  and additional
                                                  connectors

  12                      Enterprise readiness    Security, scale,
                                                  deployment and
                                                  operational hardening
  -----------------------------------------------------------------------

Sprints may overlap after interfaces are stable, but do not skip core
validation and data-integrity requirements.

------------------------------------------------------------------------

# 22. Sprint 1 Detailed Implementation Plan

## 22.1 Objective

Build a working application where a developer can create a migration
project, upload Excel/CSV/JSON, inspect sheets and columns, profile
records, detect basic data-quality issues and view a report.

Sprint 1 establishes source analysis before introducing Zoho-specific
complexity.

## 22.2 Sprint 1 scope

  Feature                          Sprint 1
  -------------------------------- ---------------------
  React web application shell      Yes
  Tauri desktop shell              Initial integration
  Development authentication       Basic
  Project creation                 Yes
  Excel upload                     Yes
  CSV upload                       Yes
  JSON upload                      Yes
  Multi-sheet detection            Yes
  Column detection                 Yes
  Type inference                   Yes
  Null detection                   Yes
  Duplicate detection              Yes
  Basic invalid-format detection   Yes
  Profiling report                 Yes
  Record preview                   Yes
  PostgreSQL persistence           Yes
  Background processing            Yes
  Zoho integration                 Later sprint
  AI mapping                       Later sprint
  Direct migration                 Later sprint

## 22.3 Sprint 1 UI screens

### Dashboard

Display:

-   Total projects.
-   Uploaded files.
-   Analysed records.
-   Recent projects.
-   Recent activity.

### Create project

Fields:

-   Project name.
-   Description.
-   Source type.
-   Intended target product (CRM or Creator).
-   Status.

### Source upload

Support:

-   Drag and drop.
-   File browser.
-   Multiple files.
-   Format detection.
-   Upload progress.
-   File validation.

### Data analysis

Display:

-   File name.
-   Sheet/table name.
-   Row and column count.
-   Detected types.
-   Null percentages.
-   Duplicate statistics.
-   Invalid value candidates.
-   Redacted sample values.

### Record preview

Provide:

-   Search.
-   Pagination.
-   Column selection.
-   Data-quality indicators.
-   Row-level issue details.

## 22.4 Sprint 1 processing pipeline

``` mermaid
flowchart TD
    A[Frontend Upload] --> B[FastAPI Upload API]
    B --> C[Validate File]
    C --> D[Store File]
    D --> E[Create Analysis Job]
    E --> F[Background Worker]
    F --> G[Parse Excel / CSV / JSON]
    G --> H[Detect Sheets and Columns]
    H --> I[Infer Data Types]
    I --> J[Calculate Statistics]
    J --> K[Detect Duplicates and Invalid Values]
    K --> L[Persist Source Schema]
    L --> M[Mark Analysis Complete]
    M --> N[Display Results]
```

## 22.5 Sprint 1 task breakdown

  ID      Task                                 Priority
  ------- ------------------------------------ ----------
  S1-01   Initialize monorepo                  Critical
  S1-02   Configure React and TypeScript       Critical
  S1-03   Initialize FastAPI                   Critical
  S1-04   Configure PostgreSQL                 Critical
  S1-05   Configure Redis and Celery           High
  S1-06   Create database models               Critical
  S1-07   Create Alembic migrations            Critical
  S1-08   Implement project APIs               Critical
  S1-09   Implement file upload                Critical
  S1-10   Implement Excel parser               Critical
  S1-11   Implement CSV parser                 Critical
  S1-12   Implement JSON parser                Critical
  S1-13   Implement type detector              Critical
  S1-14   Implement profiler                   Critical
  S1-15   Implement duplicate detector         High
  S1-16   Implement background analysis task   Critical
  S1-17   Implement profiling API              Critical
  S1-18   Build project dashboard              Critical
  S1-19   Build upload interface               Critical
  S1-20   Build data profiling report          Critical
  S1-21   Build record preview                 Critical
  S1-22   Add automated tests                  Critical
  S1-23   Integrate initial Tauri shell        High

## 22.6 Sprint 1 folder structure

``` text
backend/app/
├── main.py
├── core/
│   ├── config.py
│   ├── database.py
│   └── logging.py
├── api/
│   └── v1/
│       ├── projects.py
│       └── sources.py
├── models/
│   ├── user.py
│   ├── workspace.py
│   ├── migration_project.py
│   ├── source_file.py
│   └── source_schema.py
├── schemas/
│   ├── project.py
│   └── source.py
├── repositories/
├── services/
│   ├── project_service.py
│   └── source_service.py
├── connectors/
│   └── sources/
│       ├── excel/
│       ├── csv/
│       └── json/
├── engines/
│   └── profiling/
│       ├── profiler.py
│       ├── type_detector.py
│       ├── duplicate_detector.py
│       └── statistics.py
└── workers/
    ├── celery_app.py
    └── tasks/
        └── analyse_source.py
```

## 22.7 Sprint 1 test cases

  Test                          Expected result
  ----------------------------- ---------------------------------
  Normal Excel file             Analysed successfully
  Excel with multiple sheets    All supported sheets detected
  CSV with UTF-8 Tamil text     Text preserved
  CSV with quoted commas        Parsed correctly
  JSON array                    Records detected
  Empty file                    Clear validation error
  Missing column values         Null statistics calculated
  Duplicate emails              Duplicate candidates identified
  Mixed date formats            Inconsistency warning
  Large file                    Processed with bounded memory
  Corrupted Excel               Safe failure
  Oversized or malicious file   Rejected safely

## 22.8 Sample regression fixture

`customers.xlsx`

  Customer_ID   Customer_Name      Email           Phone        Created_Date
  ------------- ------------------ --------------- ------------ --------------
  C001          ABC Technologies   abc@gmail.com   9876543210   12-11-2026
  C002          XYZ Solutions      xyz@gmail.com   9876543211   10-11-2026
  C003          ABC Technologies   abc@gmail.com   9876543210   12-11-2026
  C004          Global Systems     InvalidEmail    9876543212   15-11-2026

Expected analysis:

-   4 source records.
-   5 detected columns.
-   1 duplicate candidate group.
-   1 invalid email candidate.
-   0 missing values.
-   Customer_ID identified as a possible identifier.
-   Created_Date identified as a date candidate.

These are synthetic test records. The exact date parsing result depends
on the configured date format and locale.

## 22.9 Sprint 1 Definition of Done

-   [ ] Developer can create a migration project.
-   [ ] Developer can upload Excel, CSV and JSON.
-   [ ] Excel sheets are detected independently.
-   [ ] Application detects columns and inferred types.
-   [ ] Null and duplicate statistics are calculated.
-   [ ] Data preview is available.
-   [ ] Analysis results are persisted.
-   [ ] Background jobs report success or failure.
-   [ ] Automated tests pass.
-   [ ] Web application works end-to-end.
-   [ ] Desktop shell launches and accesses the same backend API.
-   [ ] File processing respects configured resource limits.

------------------------------------------------------------------------

# 23. Proposed Repository Structure

The following is the complete target monorepo structure. Implement
modules incrementally; do not create empty placeholder implementations
merely to match the tree.

``` text
zoho-data-migration-assistant/
│
├── apps/
│   ├── web/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── workspaces/
│   │   │   │   ├── projects/
│   │   │   │   ├── sources/
│   │   │   │   ├── connections/
│   │   │   │   ├── metadata/
│   │   │   │   ├── mapping/
│   │   │   │   ├── transformation/
│   │   │   │   ├── validation/
│   │   │   │   ├── migration/
│   │   │   │   └── reports/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   └── desktop/
│       ├── src-tauri/
│       │   ├── src/
│       │   ├── capabilities/
│       │   └── tauri.conf.json
│       └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   ├── logging.py
│   │   │   └── exceptions.py
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── connectors/
│   │   │   ├── base/
│   │   │   ├── sources/
│   │   │   │   ├── excel/
│   │   │   │   ├── csv/
│   │   │   │   ├── json/
│   │   │   │   ├── postgres/
│   │   │   │   ├── mysql/
│   │   │   │   └── crm/
│   │   │   └── zoho/
│   │   │       ├── base/
│   │   │       ├── crm/
│   │   │       ├── creator/
│   │   │       ├── books/
│   │   │       ├── inventory/
│   │   │       ├── desk/
│   │   │       ├── projects/
│   │   │       └── people/
│   │   ├── engines/
│   │   │   ├── profiling/
│   │   │   ├── mapping/
│   │   │   ├── transformation/
│   │   │   ├── validation/
│   │   │   ├── dependency/
│   │   │   ├── export/
│   │   │   └── migration/
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   ├── agents/
│   │   │   ├── prompts/
│   │   │   ├── schemas/
│   │   │   └── orchestrator.py
│   │   ├── workers/
│   │   │   ├── celery_app.py
│   │   │   └── tasks/
│   │   └── utils/
│   ├── migrations/
│   ├── tests/
│   ├── alembic.ini
│   └── requirements.txt
│
├── packages/
│   ├── shared-types/
│   ├── api-contracts/
│   └── ui-components/
│
├── infrastructure/
│   ├── docker/
│   ├── postgres/
│   ├── redis/
│   ├── nginx/
│   └── deployment/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── security/
│   ├── connectors/
│   └── product/
│
├── scripts/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

------------------------------------------------------------------------

# 24. Architecture Decision Register

  ----------------------------------------------------------------------------
  ID                Decision          Selected approach      Reason
  ----------------- ----------------- ---------------------- -----------------
  ADR-001           Product scope     Zoho migration         Focus on
                                      assistant              implementation
                                                             developer
                                                             productivity

  ADR-002           Platforms         Web + Desktop          Shared access and
                                                             desktop workflows

  ADR-003           Desktop framework Tauri 2                Lightweight
                                                             shared frontend
                                                             shell

  ADR-004           Frontend          React + TypeScript     Mature component
                                                             ecosystem

  ADR-005           Backend           Python + FastAPI       Data processing
                                                             and API
                                                             development

  ADR-006           Architecture      Modular monolith       Lower initial
                                                             operational
                                                             complexity

  ADR-007           Database          PostgreSQL             Relational
                                                             integrity and
                                                             JSONB support

  ADR-008           Background        Celery + Redis         Asynchronous data
                    processing                               processing

  ADR-009           File processing   Polars + OpenPyXL      Efficient data
                                                             profiling and
                                                             Excel support

  ADR-010           Source support    Files, SQL and         Broad migration
                                      external CRM adapters  coverage

  ADR-011           First Zoho        CRM and Creator        Establish
                    connectors                               reusable metadata
                                                             architecture

  ADR-012           AI                Provider-independent   Avoid
                                      orchestration          model-provider
                                                             lock-in

  ADR-013           Mapping           AI-assisted,           Prevent silent
                                      human-approved         semantic mistakes

  ADR-014           Validation        Deterministic engine   Repeatable
                                                             data-quality
                                                             decisions

  ADR-015           Execution         File export and direct Support both
                                      API                    migration
                                                             workflows

  ADR-016           Security          OAuth, RBAC,           Protect client
                                      encryption and audit   business data

  ADR-017           Initial milestone Source analysis        Validate source
                                                             processing
                                                             independently
  ----------------------------------------------------------------------------

Changes to these decisions should be recorded with the reason, impact
and migration plan rather than silently changing the architecture.

------------------------------------------------------------------------

# 25. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- -----------------------
  Zoho APIs differ by     Connector failures      Product-specific
  product                                         adapters and capability
                                                  registry

  Custom fields vary by   Incorrect mapping       Dynamic metadata
  organization                                    discovery

  AI recommends wrong     Data corruption         Confidence/risk scoring
  fields                                          and approval

  Lookup dependencies are Import failures         Dependency graph and ID
  missing                                         resolution

  API throttling          Slow or failed          Rate limits, queues and
                          migrations              retry policy

  Large files exceed      Worker failure          Chunked processing and
  memory                                          resource limits

  Metadata changes after  Invalid exports         Snapshot versioning and
  mapping                                         preflight checks

  Partial migration       Inconsistent target     Record-level results
                          data                    and reconciliation

  Sensitive client data   Security incident       Encryption,
  exposure                                        minimization and access
                                                  controls

  Duplicate migration     Duplicate records       Idempotency and
  execution                                       execution safeguards

  Creator workflows have  Unintended business     Workflow-impact preview
  side effects            actions                 and approval
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 26. Success Metrics

Measure product success using:

-   Time required to analyse a source dataset.
-   Percentage of fields with useful mapping suggestions.
-   Mapping approval and correction rates.
-   Percentage of records passing validation.
-   Number of errors detected before import.
-   Migration success rate.
-   Duplicate creation rate.
-   Average time to resolve failed records.
-   Reconciliation accuracy.
-   Developer time saved compared with the existing manual process.

Do not claim a fixed productivity improvement until it has been measured
against real, representative migration projects.

------------------------------------------------------------------------

# 27. Official Documentation and Technical References

Use official documentation as the source of truth for implementation.
API versions, limits, scopes and supported field types can change;
verify the current documentation when each connector is implemented.

## Zoho CRM

-   [Zoho CRM API
    documentation](https://www.zoho.com/crm/developer/docs/api/v8/)
-   [CRM Modules
    API](https://www.zoho.com/crm/developer/docs/api/v8/modules-api.html)
-   [CRM Fields
    API](https://www.zoho.com/crm/developer/docs/api/v8/field-meta.html)
-   [CRM Records
    API](https://www.zoho.com/crm/developer/docs/api/v8/insert-records.html)
-   [CRM Bulk Write
    API](https://www.zoho.com/crm/developer/docs/api/v8/bulk-write/overview.html)

## Zoho Creator

-   [Zoho Creator API v2.1](https://www.zoho.com/creator/help/api/v2.1/)
-   [Creator Get Forms
    API](https://www.zoho.com/creator/help/api/v2.1/get-forms.html)
-   [Creator Get Fields
    API](https://www.zoho.com/creator/help/api/v2.1/get-fields.html)
-   [Creator Add Records
    API](https://www.zoho.com/creator/help/api/v2.1/add-records.html)

## Zoho Books

-   [Zoho Books API documentation](https://www.zoho.com/books/api/v3/)
-   [Zoho OAuth documentation](https://www.zoho.com/books/api/v3/oauth/)

## Development technologies

-   [FastAPI](https://fastapi.tiangolo.com/)
-   [React](https://react.dev/)
-   [TypeScript](https://www.typescriptlang.org/docs/)
-   [Tauri 2](https://v2.tauri.app/)
-   [PostgreSQL](https://www.postgresql.org/docs/)
-   [SQLAlchemy](https://docs.sqlalchemy.org/)
-   [Alembic](https://alembic.sqlalchemy.org/)
-   [Celery](https://docs.celeryq.dev/)
-   [Polars](https://docs.pola.rs/)
-   [OpenPyXL](https://openpyxl.readthedocs.io/)

------------------------------------------------------------------------

# 28. Final Development Direction

The architecture baseline is:

-   **Product:** Zoho Data Migration Assistant.
-   **Platform:** Web + Desktop.
-   **Frontend:** React + TypeScript.
-   **Desktop:** Tauri 2.
-   **Backend:** Python + FastAPI.
-   **Architecture:** Modular monolith with background workers.
-   **Database:** PostgreSQL.
-   **Queue:** Redis + Celery.
-   **File processing:** Polars + OpenPyXL and format-specific parsers.
-   **AI:** Provider-independent, schema-validated recommendations.
-   **Sources:** Excel, CSV, JSON, SQL databases and external CRM
    systems.
-   **First Zoho integrations:** CRM and Creator.
-   **Future integrations:** Books, Inventory, Desk, Projects, People
    and other supported Zoho products.
-   **Migration modes:** Import-ready file preparation and controlled
    direct API migration.
-   **Security:** OAuth 2.0, RBAC, encryption, tenant isolation, audit
    and explicit execution approval.
-   **First development milestone:** Sprint 1 Source File Analysis
    Engine.

## Non-negotiable engineering principles

1.  Do not hardcode Zoho module or field structures.
2.  Do not assume all Zoho products share the same APIs or field rules.
3.  Do not let AI independently approve or execute migrations.
4.  Never silently discard or modify original source data.
5.  Validate against the actual destination metadata.
6.  Preserve source-to-target record identity.
7.  Make migration jobs auditable and safe to retry.
8.  Build and test the common engine before expanding connectors.
9.  Keep web and desktop business logic shared.
10. Preserve the agreed architecture and record approved changes in the
    decision register.

**End of architecture document.**
