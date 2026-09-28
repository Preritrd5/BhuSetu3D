# Phase 8 Specification: Evidence, Provenance & Confidence System

**Project:** BhuSetu 3D  
**SIH Problem Statement:** SIH26011 — 3D ULPIN Generation and Vertical Property Mapping System  
**Team:** TANTRAKATHA  
**Status:** Completed & Formally Verified  
**Date:** September 2026  

---

## 1. Executive Summary & Purpose

Phase 8 implements the **Evidence, Provenance & Confidence System** for BhuSetu 3D. In cadastral property intelligence and 3D land administration, geometry without evidence is merely an illustration. To serve statutory, civic, and tax governance requirements, every digital property boundary, building volume, floor slab, unit space, and utility corridor must be backed by traceable sensor evidence, deterministic derivation history, and transparent confidence ratings.

### Core Principles Upheld

1. **Hierarchy-Wide Traceability**:
   Traceability is preserved unbroken across the full vertical stack:
   $$\text{Property / Parcel} \longrightarrow \text{Building} \longrightarrow \text{Floor Level} \longrightarrow \text{3D Unit} \longrightarrow \text{Utility / Infrastructure}$$
2. **Confidence $\neq$ Verification (Strict Rule)**:
   High algorithmic precision (e.g. 0.95 IoU from YOLOv8x or sub-5cm GSD from drone photogrammetry) reflects sensor accuracy and mathematical rigor, but **does not constitute statutory verification**. Statutory verification is an explicit administrative action reserved exclusively for authorized human Revenue Officers under the Phase 11 Maker-Checker statutory queue.
3. **Controlled Source Classifications**:
   - `OBSERVED`: Direct physical measurement or high-resolution imagery (drone photogrammetry, airborne LiDAR, surveyor RTK-GNSS).
   - `DERIVED`: Deterministic mathematical/geometric computation (polygon intersection, footprint area, floor extrusion).
   - `AI_ASSISTED`: Machine learning model inferences (building detection YOLOv8, height estimation from shadows).
   - `INFERRED`: Logical heuristics or assumptions (standard floor height 3.0m when LiDAR is unavailable).
   - `VERIFIED`: Explicit statutory human officer sign-off.
   - `UNKNOWN`: Missing or unrecorded lineage.
4. **Truthful Absence & No Mock Fabrication**:
   When evidence is absent or unrecorded, the system explicitly reports:
   `"Evidence unavailable / Source not recorded"`, lifecycle status `UNAVAILABLE`, confidence `0.0`, and documents the missing factors in limiting factor logs.

---

## 2. Database Schema & Migration

### Alembic Migration: `0006_phase8_evidence_provenance.py`

The database schema extends PostgreSQL 16 + PostGIS 3.4 in Supabase without secondary or mock storage:

1. **Enhanced `public.evidence` Table**:
   - Added `status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE'` (`AVAILABLE`, `PARTIAL`, `UNAVAILABLE`, `INVALID`, `SUPERSEDED`).
   - Added `source_type VARCHAR(50) NOT NULL DEFAULT 'SURVEY_DATA'`.
   - Added `supporting_factors JSONB DEFAULT '[]'::jsonb`.
   - Added `limiting_factors JSONB DEFAULT '[]'::jsonb`.
   - Added `evidence_metadata JSONB DEFAULT '{}'::jsonb`.
   - Made `dataset_id` nullable (`DROP NOT NULL`) to accommodate unrecorded or direct field surveyor records without synthetic datasets.
   - Added indexes on `source_type`, `status`, and `confidence_score`.

2. **New `public.provenance_records` Table**:
   ```sql
   CREATE TABLE IF NOT EXISTS public.provenance_records (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       target_entity_type VARCHAR(50) NOT NULL,
       target_entity_id UUID NOT NULL,
       source_entity_type VARCHAR(50),
       source_entity_id UUID,
       operation_type VARCHAR(50) NOT NULL,
       operation_name VARCHAR(150) NOT NULL,
       operation_version VARCHAR(50),
       performed_by VARCHAR(100),
       execution_timestamp TIMESTAMPTZ DEFAULT NOW(),
       input_reference JSONB DEFAULT '{}'::jsonb,
       output_reference JSONB DEFAULT '{}'::jsonb,
       metadata_json JSONB DEFAULT '{}'::jsonb,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Enhanced `public.data_sources` Table**:
   - Added `reliability_score NUMERIC(4, 3) DEFAULT 0.850`.

---

## 3. Provenance DAG & Lineage Traversal

Lineage DAG traversal follows sequential computational operations:
```
[1. Cadastral Survey Ingestion]
      │
      ▼ (Parcel Geometry & Survey Number)
[2. AI Building Extraction (YOLOv8x / Mask R-CNN)]
      │
      ▼ (Building Footprint & LoD2 Height)
[3. Vertical Floor Slicing Engine (v1.4.0)]
      │
      ▼ (Floor Levels & Unit Slabs)
[4. Deterministic 3D ULPIN Assignment Engine]
      │
      ▼ (Prototype Spatial Identifiers)
```

If explicit rows in `provenance_records` are empty for legacy seed parcels, `EvidenceService.get_property_provenance` deterministically reconstructs the sequential DAG from the existing entity attributes (`extraction_method`, `height_source`, `processing_version`), ensuring zero dead ends.

---

## 4. Confidence Analytics Engine

The composite confidence score $C_{\text{composite}}$ is calculated as a transparent weighted sum of component ratings:

$$C_{\text{composite}} = 0.30 \cdot C_{\text{parcel}} + 0.35 \cdot C_{\text{building}} + 0.25 \cdot C_{\text{vertical}} + 0.10 \cdot C_{\text{infrastructure}}$$

- **Parcel Boundary ($C_{\text{parcel}}$)**: Evaluates RTK-GNSS ground control, cadastral survey match, and boundary point density.
- **Building Footprint & Height ($C_{\text{building}}$)**: Evaluates AI detection IoU, GSD resolution, and height source (`LIDAR_POINT_CLOUD` vs `ESTIMATED_SHADOW`).
- **Vertical Floors & Units ($C_{\text{vertical}}$)**: Evaluates ground elevation datum consistency and slicing heuristics.
- **Infrastructure & Utilities ($C_{\text{infrastructure}}$)**: Evaluates subsurface utility records (ground-penetrating radar vs municipality drawings).

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/evidence` | Paginated evidence vault with multi-filter query (`entity_type`, `classification`, `source_type`, `status`, `min_confidence`). |
| `GET` | `/api/v1/evidence/{id}` | Deep inspection of an individual evidence record with dataset origin and factors. |
| `GET` | `/api/v1/properties/{property_id}/evidence` | Hierarchical evidence roll-up across parcel, buildings, floors, units, and utilities with missing evidence warnings. |
| `GET` | `/api/v1/properties/{property_id}/provenance` | Sequential provenance lineage chain (DAG nodes, inputs, outputs, timestamps). |
| `GET` | `/api/v1/properties/{property_id}/confidence` | Transparent composite confidence score, component scores, supporting/limiting factors, and decoupled statutory verification status. |
| `GET` | `/api/v1/datasets/{dataset_id}/evidence` | All evidence items originating from a given ingested dataset. |

---

## 6. Frontend Architecture

1. **Evidence Vault Page (`/evidence`)**:
   - Navigation: Enabled in `Sidebar.tsx` as an active module.
   - Top metrics banner: Total Records, Mean Confidence %, Observed Ground Truth, AI Derived count.
   - Multi-dimensional filters: Search query, Classification, Entity scope, Status, and Min Confidence slider.
   - Evidence records table with color-coded classification badges, confidence gauge, factors count, and inspect drawer.
   - Interactive Detail Modal with sensor specs, dataset information, factors, and metadata JSON viewer.
   - Lineage Graph Inspector tab allowing instant DAG resolution by Property UUID with interactive sequential timeline.
2. **Evidence Detail Page (`/evidence/[id]`)**:
   - Direct standalone view for individual evidence records with dataset details and factor logs.
3. **2D Property Inspector (`PropertyInspector.tsx`)**:
   - Added collapsible `Evidence & Lineage Trace` accordion displaying composite confidence bar, statutory status warning (`UNVERIFIED`), supporting/limiting factors, and link to Vault.
4. **3D Building Inspector (`BuildingInspector3D.tsx`)**:
   - Added `Evidence & Provenance` card displaying AI extraction method, height source, confidence score, and direct link to Vault.

---

## 7. Verification & Test Suite

- **Pytest Suite (`apps/api`)**:
  - `77 passed` (all 68 previous tests preserved, 9 new Phase 8 tests passed).
  - Tests verify evidence listing, single item inspection, 404 handling, hierarchy coverage, synthesized provenance DAG, composite confidence calculation, dataset query, programmatic recording, and unauthenticated access rejection.
- **TypeScript & Build (`apps/web`)**:
  - `npx tsc --noEmit`: 0 errors.
  - `npm run build`: Exit code 0, all static and dynamic routes compiled successfully.
