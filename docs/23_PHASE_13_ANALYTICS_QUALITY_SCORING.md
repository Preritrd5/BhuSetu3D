# Phase 13: Analytics + Quality Scoring + UI/UX Polish

**Project:** BhuSetu 3D  
**SIH Problem Statement:** SIH26011 — 3D ULPIN Generation and Vertical Property Mapping System  
**Team:** TANTRAKATHA  
**Status:** COMPLETE & FULLY VALIDATED  
**Database:** Supabase PostgreSQL 16 + PostGIS 3.4  
**Backend:** FastAPI (Python 3.13) — 128/128 Unit & Integration Tests Passing (100%)  
**Frontend:** Next.js 14 App Router + TailwindCSS — 14 Routes Compiled Cleanly (0 errors)  

---

## 1. Overview & Objectives

Phase 13 transitions BhuSetu 3D into an **Explainable Data Quality Intelligence & Enterprise Spatial Analytics System**. It gives municipal authorities, cadastre surveyors, and urban planners comprehensive answers to the core data health questions:
- *How much property data exists?* (Parcels, 3D building envelopes, floors, vertical units)
- *How complete is it?* (ULPIN completeness, mandatory attributes, municipal land use)
- *How much has multi-sensor evidence?* (LiDAR point clouds, drone photogrammetry, ground control surveys)
- *How much has been verified?* (Statutory human audit coverage and hash-chained reviews)
- *What is the data quality score?* (Deterministic, weighted mathematical score across 7 components)
- *Which records require immediate attention?* (Deduplicated, actionable quality issues linked to correction workflows)

---

## 2. Core Architectural Principles & Governance Guardrails

1. **Quality Score $\neq$ Legal Status:**
   - The Data Quality Score measures *record completeness, topological validity, and evidence coverage*.
   - It is **never** labeled "Valid Property", "Legally Approved", "Title Certified", or "Government Sanctioned".
   - Official disclaimer displayed across all analytics views:  
     > *"Data Quality Score reflects record completeness, topological validity, and evidence coverage. It does NOT represent legal title, ownership validity, or government sanction."*

2. **100% Deterministic & Reproducible (No AI/ML Scoring):**
   - The score is evaluated using an explicit, weighted formula executed directly in the backend:
     $$\text{Overall Score} = \sum_{i=1}^{7} (W_i \times S_i)$$
   - Scoring versions are stamped explicitly (`quality_v1`).
   - Every score calculation is fully explainable with component scores and rule-by-rule breakdowns.
   - LLMs / Gemini are only permitted to *explain* scores computed by the engine; they never decide or alter the score.

3. **Supabase PostgreSQL 16 + PostGIS 3.4 Sole Source of Truth:**
   - Aggregations and spatial computations run server-side using PostGIS topological functions.
   - Zero external analytics engines, NoSQL datastores, or redundant pipelines.

4. **Actionable Remediation Workflows:**
   - Issues are not merely listed; they provide deep-link navigation directly into:
     - Statutory Verification Queue (`/verification`)
     - Evidence Lineage Chain (`/evidence`)
     - Spatial Setback & Conflict Inspector (`/conflicts`)
     - 4D History Timeline (`/history`)
     - AI Spatial Investigator (`/spatial-investigator`)

---

## 3. 7-Component Deterministic Quality Model

| Component | Default Weight | Target Metrics Evaluated |
|---|---|---|
| **1. Completeness** | 20% | Mandatory identifiers (`ulpin_2d`, `ulpin_3d`), boundary geometry, municipal land use classification. |
| **2. Spatial Validity** | 20% | PostGIS `ST_IsValid`, closed polygon topology, absence of self-intersections, 3D polyhedral mesh availability. |
| **3. Attribute Consistency** | 15% | Floor count to building height ratio ($2.2\text{ m} \le \text{floor height} \le 5.0\text{ m}$), positive area, city boundary hierarchy anchor. |
| **4. Provenance Coverage** | 15% | Authoritative extraction lineage linking entity to source surveys, photogrammetry runs, or algorithms. |
| **5. Evidence Coverage** | 15% | Linked raw sensor observations (orthophotos, LiDAR point clouds, GPS survey coordinates). |
| **6. Verification Coverage** | 10% | Approved statutory human review decisions in cryptographic hash-chained audit ledger. |
| **7. Temporal Coverage** | 5% | Multi-epoch 4D timestamp baseline and recorded change event lineage. |

---

## 4. Database Schema (Supabase PostgreSQL 16 + PostGIS 3.4)

### 4.1 `public.quality_score_snapshots`
- `id` (UUID, PK)
- `entity_type` (VARCHAR(50), `PARCEL`, `BUILDING`)
- `entity_id` (UUID, indexed)
- `overall_score` (NUMERIC(5,2), indexed)
- `component_scores` (JSONB, breakdown across 7 components)
- `weights_used` (JSONB, weights applied)
- `rule_results` (JSONB, array of PASS/FAIL rule evaluations)
- `missing_fields` (JSONB, array of missing attribute names)
- `scoring_version` (VARCHAR(50), default `quality_v1`)
- `calculated_at` (TIMESTAMPTZ, indexed)
- `calculated_by` (UUID, FK to `users.id`)

### 4.2 `public.quality_issues`
- `id` (UUID, PK)
- `entity_type` (VARCHAR(50), indexed)
- `entity_id` (UUID, indexed)
- `category` (VARCHAR(50), indexed)
- `severity` (VARCHAR(20), `INFO`, `WARNING`, `ERROR`, indexed)
- `rule_code` (VARCHAR(50))
- `message` (TEXT)
- `discrepancy_details` (JSONB)
- `evidence_reference` (JSONB)
- `status` (VARCHAR(30), `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `WONT_FIX`, indexed)
- `action_url` (VARCHAR(255))
- `detected_at` (TIMESTAMPTZ)
- `resolved_at` (TIMESTAMPTZ, nullable)
- `resolved_by` (UUID, FK to `users.id`)
- `UniqueConstraint("entity_type", "entity_id", "rule_code", "category")`

---

## 5. API Endpoints

### 5.1 Quality Engine Endpoints (`/api/v1/quality`)
- `GET /api/v1/quality/{entity_type}/{entity_id}` — Evaluates or retrieves latest quality score snapshot.
- `POST /api/v1/quality/recalculate` — Recalculates quality score with optional what-if simulation weights.
- `GET /api/v1/quality/{entity_type}/{entity_id}/history` — Chronological quality evolution snapshots.
- `GET /api/v1/quality/issues` — Filterable actionable quality issues queue.
- `PATCH /api/v1/quality/issues/{issue_id}` — Updates issue status (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `WONT_FIX`).

### 5.2 Enterprise Spatial Analytics Endpoints (`/api/v1/analytics`)
- `GET /api/v1/analytics/overview` — High-level KPI summary, counts, average scores, coverage percentages.
- `GET /api/v1/analytics/properties` — Cadastral land use distribution, building heights, floors, area totals.
- `GET /api/v1/analytics/quality` — Quality distribution tiers, component averages, top missing attributes.
- `GET /api/v1/analytics/conflicts` — Spatial setback violations, encroachments, resolution throughput.
- `GET /api/v1/analytics/verification` — Reviewer throughput, decision breakdown, turnaround times.
- `GET /api/v1/analytics/changes` — 4D vertical expansions, parcel subdivisions, footprint alterations.
- `GET /api/v1/analytics/infrastructure` — Monitored utility corridors and intersecting cadastre parcels.

---

## 6. Frontend Workspace (`/analytics`)

- **Scope Selector:** Seamless toggle between National Registry (Global) and Municipal Jurisdictions (`KA-BLR`, `MH-MUM`, `DL-DEL`).
- **7 Top KPI Cards:** Parcels, Buildings, Average Quality Score, Evidence Coverage, Verification Coverage, Open Conflicts, 4D Changes.
- **5 Comprehensive Tabs:**
  1. *Executive Overview:* 7-Component Scorecard, Data Quality Distribution meter, Top Missing Attributes ranking.
  2. *Quality Intelligence & Live Evaluator:* Entity-level inspector, live rule audit table, historical evolution snapshots.
  3. *Actionable Quality Issues:* Severity & status filterable issue queue with deep links to `/verification`, `/evidence`, and `/spatial-analysis`.
  4. *Spatial & Verification Analytics:* Conflict counts by severity and statutory review throughput.
  5. *4D History & Infrastructure:* Multi-epoch change detection and corridor buffer proximity compliance.
- **Full Type-Safety & Production Build:** Next.js 14 App Router optimized static & dynamic bundling (14 routes compiled cleanly).

---

## 7. Verification & Test Metrics

- **Unit & Integration Tests:** 128 passed / 128 tests (100% pass rate).
- **Quality Engine Tests:**
  - `test_quality_engine_evaluates_parcel_complete_and_explainable` (PASSED)
  - `test_quality_engine_detects_missing_fields_and_generates_issues` (PASSED)
  - `test_quality_history_retrieves_chronological_snapshots` (PASSED)
  - `test_analytics_overview_server_side_metrics` (PASSED)
  - `test_get_quality_endpoint_fastapi` (PASSED)
  - `test_analytics_overview_endpoint_fastapi` (PASSED)
  - `test_spatial_investigator_quality_query` (PASSED)
- **Frontend Build:** `npm run build` completed with 0 errors across all 14 routes.
