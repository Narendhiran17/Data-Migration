# Design System Specification: Zoho Data Migration Assistant

## 1. Visual Personality
- **Tone:** Precise, High-Trust, Technical, Focused.
- **Inspiration:** High-performance developer and data infrastructure tools (Datagrip, BigQuery Studio, Linear, Retool).
- **Aesthetic:** Dark technical workspace with high contrast, crisp 1px borders, subtle surface elevations, tabular data layouts, and monospaced typography for technical artifacts (API names, types, error codes, IDs).

## 2. Color Strategy & Semantic Tokens
- **Base Surfaces:**
  - `surface-canvas`: `#09090b` (Deep obsidian background)
  - `surface-panel`: `#121215` (Elevated tool panel)
  - `surface-subtle`: `#18181b` (Active row / inset card)
  - `surface-hover`: `#222226`
- **Borders & Dividers:**
  - `border-subtle`: `#27272a` (Default 1px structure boundary)
  - `border-strong`: `#3f3f46`
  - `border-focus`: `#3b82f6`
- **Text & Foreground:**
  - `text-primary`: `#f4f4f5` (Headers and primary identifiers)
  - `text-secondary`: `#a1a1aa` (Labels, helper copy, descriptions)
  - `text-muted`: `#71717a` (De-emphasized metadata, timestamps)
- **Brand & Action:**
  - `action-primary`: `#0066cc` / `#2563eb` (Zoho Engineering Blue)
  - `action-hover`: `#1d4ed8`
- **Semantic Status Signals (Used strictly for verified data states):**
  - `status-success`: `#10b981` (Validated / Approved / Migrated)
  - `status-warning`: `#f59e0b` (Anomalies / Non-blocking format alerts)
  - `status-error`: `#ef4444` (Blocking pre-flight errors / Required missing)
  - `status-info`: `#0ea5e9` (Candidate key / Topological index)

## 3. Typography
- **Primary Sans:** `Inter`, system-ui (Clean, legible at 11px-13px for dense operational screens).
- **Code & Data Mono:** `JetBrains Mono`, `ui-monospace`, monospace (Used for API names, record IDs, SQL types, raw sample values, and checksums).
- **Scale:**
  - `text-xs` (11px-12px): Dense table cells, badges, status pills, helper hints.
  - `text-sm` (13px-14px): Section titles, button text, table headers.
  - `text-base` (15px-16px): View headers, modal titles.
  - `text-lg` (18px): Workspace title, primary stats.

## 4. Information Density & Layout Model
- **Dense, Scannable Layouts:** Tabular data with compact row padding (`py-2.5 px-3`), fixed sticky headers, right-aligned numeric statistics.
- **Workflow Pipeline:**
  - Global Header: Active Project + Zoho Connected Org + Pipeline Health Badge.
  - Step Bar: Clear 5-phase operational workflow:
    1. Ingestion & Profiling
    2. Zoho Target Metadata
    3. Schema Mapping Studio
    4. Pre-Flight Verification
    5. Migration & Packages
- **Dual-Pane Views:** Side-by-side mapping studio (Source &rarr; Target) with inline rule configuration and visual status pills.
