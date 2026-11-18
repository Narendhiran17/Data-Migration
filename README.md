# Zoho Data Migration Assistant

> Developer productivity platform for Zoho data migration engineers, consultants, and associate developers.

## Sprint 1: Source File Analysis Engine

Sprint 1 delivers the complete end-to-end foundation for source data ingestion, profiling, and anomaly detection across Excel, CSV, and JSON files before mapping to Zoho CRM or Creator.

### Key Capabilities Delivered in Sprint 1

1. **Source File Connectors & Parsers:**
   - **Excel (.xlsx, .xls):** OpenPyXL memory-optimized streaming reader with independent multi-sheet detection, header normalization, and row trimming.
   - **CSV (.csv):** Auto-sniffing delimiter detector (comma, semicolon, tab, pipe), UTF-8 / UTF-8-sig (BOM) handling, robust quoted comma parsing, and Tamil/Unicode support.
   - **JSON (.json):** Array-of-objects and nested document ingestion with key extraction and schema normalization.

2. **Data Profiling Engine:**
   - Semantic type inference (Integer, Decimal, Date, Email, Phone, Boolean, Text).
   - Candidate identifier key detection (100% unique, zero nulls, naming heuristics).
   - Anomaly and invalid format counting (e.g. malformed emails or dates in predominantly typed columns).
   - Duplicate row detection and per-column duplicate counts.
   - Null value counting and percentage calculations.
   - Safe sample value extraction with sensitive data minimization.

3. **Backend API (FastAPI + SQLAlchemy + Alembic):**
   - Project lifecycle management (`/api/v1/projects`).
   - File upload with SHA-256 integrity checksums and storage quotas (`/api/v1/sources/upload`).
   - Analysis execution and profiling report retrieval (`/api/v1/sources/{id}/analyse`, `/api/v1/sources/{id}/profile`).
   - Searchable, paginated record preview grid (`/api/v1/sources/{id}/preview`).
   - Full Celery + Redis worker task definitions with automatic fallback for local development.

4. **Web Frontend (React + TypeScript + Vite + Tailwind CSS):**
   - Clean dark-mode workspace dashboard with project KPI metrics.
   - Project creation modal (Zoho CRM vs. Creator target selection).
   - Drag-and-drop source file upload zone with format validation.
   - Interactive data profiling report with worksheet switcher, null visualization bars, and anomaly tags.
   - Paginated record explorer with global search and cell inspection.

5. **Desktop Ready (Tauri 2):**
   - Tauri configuration sharing the identical React frontend and FastAPI API contract.

---

### Running Locally

#### 1. Backend (FastAPI)
```bash
# From workspace root
python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
```
Swagger UI will be available at: `http://localhost:8000/api/v1/docs`

#### 2. Frontend (Vite + React)
```bash
cd apps/web
npm run dev
```
Web client will be available at: `http://localhost:5173`

#### 3. Running Automated Tests
```bash
python -m pytest -v
```
All parser, profiling, regression fixture (`customers.xlsx`), and API endpoint tests execute automatically.
