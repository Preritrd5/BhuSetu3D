# Phase 12: 4D Property History + Infrastructure Intelligence

**Project:** BhuSetu 3D  
**SIH Problem Statement:** SIH26011 — 3D ULPIN Generation and Vertical Property Mapping System  
**Team:** TANTRAKATHA  
**Status:** COMPLETE & VALIDATED  
**Database:** Supabase PostgreSQL 16 + PostGIS 3.4  
**Backend:** FastAPI (Python 3.13) — 121/121 Unit & Integration Tests Passing  
**Frontend:** Next.js 14 App Router + TailwindCSS — 13 Routes Compiled Cleanly  

---

## 1. Overview & Objectives

Phase 12 transitions BhuSetu 3D from a 3D spatial platform into a **4D Temporal Property Intelligence System** ($\text{3D} + \text{Time}$). It empowers municipal authorities, cadastre surveyors, and urban planners to answer core governance questions:
- *What existed before?* (Historical discrete property state snapshots)
- *What exists now?* (Authoritative current 3D cadastre registry)
- *What changed?* (PostGIS conformal metric delta: footprint area $\Delta$, vertical floors $\Delta$, height $\Delta$)
- *When did it change?* (Authoritative sensor acquisition dates and observation intervals)
- *Which municipal infrastructure corridors changed or exist nearby?* (Conformal metric proximity to roads, drainage, water, and power networks)

---

## 2. Core Architectural Principles & Governance Guardrails

1. **No Fabricated History or Exact Dates:**
   - Differentiates `observed_at` (actual date of sensor survey / imagery acquisition) from `valid_from` and `valid_to`.
   - If exact construction or demolition date is unknown, temporal interval is represented as an observation range (e.g. `Q2 2024`, `EXACT`). Exact construction dates are never fabricated.

2. **Non-Accusatory Governance Language:**
   - Physical differences between observation epochs (e.g., $+60.50\text{ m}^2$ footprint expansion or $+1$ vertical floor) are recorded objectively as *observed geometric discrepancies*, **never** as "illegal construction" or "unauthorized expansion".
   - Official disclaimer rendered across all comparison interfaces:  
     > *"Observation difference establishes temporal variance, not authorized construction or legal legality."*

3. **Temporal Consistency (No Silent Mixing of Epochs):**
   - If historical infrastructure telemetry is unavailable for a historical property date, the platform issues an explicit statutory notice:  
     > *"Historical municipal infrastructure data is unavailable for this date. Current 2026 municipal utilities are shown for reference."*

4. **Strict Physical Connectivity Integrity (Rule INFR-CONN-001):**
   - `CONNECTED` relationship is claimed **only** if physical network connectivity telemetry is explicitly confirmed.
   - Proximity alone is classified into metric topological relationships: `ADJACENT` ($\le 1\text{ m}$), `WITHIN` ($\le 15\text{ m}$), `SPATIALLY_INTERSECTS`, or `NEAR`.

---

## 3. Database Schema (Supabase PostgreSQL 16 + PostGIS 3.4)

### 3.1 `public.property_state_versions`
Discrete state snapshots of parcels, buildings, floors, and units across time:
- `id` (UUID, PK)
- `entity_type` (VARCHAR(50), e.g. `BUILDING`, `PARCEL`, `INFRASTRUCTURE`)
- `entity_id` (UUID)
- `version_number` (INT, 1-indexed sequential)
- `observed_at` (DATE, sensor survey acquisition epoch)
- `valid_from`, `valid_to` (DATE, temporal validity bounds)
- `observed_interval` (VARCHAR(50), e.g. `EXACT`, `Q2 2024`)
- `source_dataset_id` (FK to `datasets.id`)
- `source_name` (VARCHAR(150), e.g. "Aerial Photogrammetry Survey 2024")
- `geom_spatial` (Geometry(GEOMETRY, 4326))
- `attributes_snapshot` (JSONB, footprint area, height, floors, elevation, land use)
- `evidence_reference` (JSONB, sensor lineage and resolution)
- `confidence_score` (NUMERIC(4,3))
- `verification_status` (VARCHAR(30))
- `created_at` (TIMESTAMPTZ)
- Unique constraint: `uq_entity_version(entity_type, entity_id, version_number)`

### 3.2 `public.change_events`
Immutable ledger of physical transitions between state versions:
- `id` (UUID, PK)
- `entity_type` (VARCHAR(50))
- `entity_id` (UUID)
- `change_type` (VARCHAR(50), e.g. `BUILDING_EXPANDED`, `FLOOR_COUNT_CHANGED`, `HEIGHT_CHANGED`, `PARCEL_GEOMETRY_CHANGED`)
- `previous_version_id`, `new_version_id` (FKs to `property_state_versions.id`)
- `observed_at` (DATE)
- `measured_change` (JSONB, `area_difference_sqm`, `percentage_change`, `floor_difference`, `height_difference_m`)
- `change_geom` (Geometry(GEOMETRY, 4326))
- `description` (TEXT)
- `evidence_reference` (JSONB)
- `confidence_score` (NUMERIC(4,3))
- `verification_status` (VARCHAR(30), linked to Phase 11 human review)
- `status` (VARCHAR(30), `DETECTED`, `RESOLVED`)
- `analysis_version` (VARCHAR(50), default `temporal_analysis_v1`)
- `created_at` (TIMESTAMPTZ)
- Unique constraint: `uq_change_event_dedup(entity_type, entity_id, previous_version_id, new_version_id, change_type, analysis_version)`

### 3.3 `public.infrastructure` Temporal Enhancements
- `observation_date` (DATE)
- `valid_from`, `valid_to` (DATE)
- `network_connectivity` (JSONB, `{"is_physically_connected": bool, "connection_type": str}`)

---

## 4. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/properties/{id}/history` | Retrieves discrete state versions, sequential change events, and observation dates |
| `GET` | `/api/v1/properties/{id}/history/{version_id}` | Retrieves a single historical state snapshot |
| `GET` | `/api/v1/properties/{id}/changes` | Retrieves recorded change events for a property |
| `POST` | `/api/v1/temporal/compare` | Executes PostGIS metric comparison between two epochs (T1 vs T2) |
| `POST` | `/api/v1/temporal/analyze` | Triggers multi-epoch change detection and deduplicated event persistence |
| `GET` | `/api/v1/change-events` | Paginated, filterable feed of change events |
| `GET` | `/api/v1/change-events/{id}` | Detailed change event inspector with measurements and evidence |
| `GET` | `/api/v1/properties/{id}/infrastructure` | Proximity analysis to municipal utilities with metric distances and temporal notice |
| `GET` | `/api/v1/infrastructure/{id}/nearby-properties` | Reverse spatial lookup of properties along an infrastructure corridor |

---

## 5. AI Spatial Investigator 4D Integration

The AI Spatial Investigator is extended with 4D temporal capabilities:
- **Intents:** `PROPERTY_HISTORY`, `CHANGE_QUERY`, `TEMPORAL_COMPARISON`, `INFRASTRUCTURE_PROXIMITY`, `INFRASTRUCTURE_CHANGE`
- **Tool:** `find_temporal_history_and_changes`
- **Actions:** `SHOW_HISTORICAL_STATE`, `COMPARE_STATES`, `SHOW_CHANGE`
- **Natural Language Capabilities:**
  - *"How did this building change between 2024 and 2026?"*
  - *"Show nearby water and road infrastructure for this parcel"*
  - *"Compare footprint area and floor count across observation epochs"*

---

## 6. Frontend Workspace (`/history`)

The 4D Property History & Infrastructure Intelligence workspace features:
1. **Interactive Discrete Timeline:** Select observation epochs (e.g. 2024 Photogrammetry $\rightarrow$ 2025 Drone Ortho $\rightarrow$ 2026 Drone LiDAR).
2. **Sequential Change Cards:** View detected footprint expansions ($+60.50\text{ m}^2$), vertical floor additions ($+1$ floor), and height changes ($+3.20\text{ m}$) with non-accusatory governance descriptions.
3. **Temporal State Comparison Studio:** Select T1 (Base) and T2 (Comparison) for mathematical PostGIS delta metrics and side-by-side inspection.
4. **Infrastructure Intelligence Panel:** Inspect nearby municipal roads, drainage, water, and power networks with conformal metric distances and verified physical connection flags.
5. **Change Events Feed:** Filter and drill down into all detected change events with direct links to Phase 11 Statutory Verification.

---

## 7. Quality Verification & Test Results

- **Backend Pytest Suite:** **121/121 tests passing** ($100\%$ success rate, 0 failures, 0 regressions).
  - `test_temporal_history.py`: 6 tests passing (expansion & floor diff calculations, deduplication, temporal consistency notice, FastAPI endpoints).
- **TypeScript Typecheck:** 0 errors (`npx tsc --noEmit` clean).
- **Next.js Production Build:** **13 routes compiled and prerendered cleanly** (`/history` 10.6 kB).
