# ASTATINE: Complete Phase Roadmap (Phases 0 – 15)
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. Development Methodology & Execution Discipline

ASTATINE is constructed through a strict, phased engineering process. Each phase operates under the **Phase Execution Rule**:
1. **Specification First:** Provide a comprehensive phase specification detailing UI screens, backend endpoints, database tables, GIS math, test suites, and expected deliverables.
2. **Strict Boundary Adherence:** Implement *only* the approved phase. No placeholder buttons or premature future implementations.
3. **Multi-Tiered Verification:** Run unit, integration, spatial, and frontend tests to verify the deliverables.
4. **Halt & Gate Review:** Report completed work, remaining backlog, and halt execution. The next phase will *never* begin without explicit human confirmation.

---

## 2. Phase-by-Phase Roadmap

```
+───────────────────────────────────────────────────────────────────────────────────+
| PHASE 0: Product Definition, Architecture & Master Blueprint (CURRENT PHASE)       |
| - Complete architectural blueprints, PRD, ER models, API designs, security gates. |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 1: Project Foundation & Development Environment                              |
| - Turborepo monorepo setup, Docker Compose (PostGIS, MinIO), Next.js & FastAPI base|
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 2: Authentication, Roles & Application Shell                                |
| - RBAC boundary enforcement, Next.js 5-zone spatial shell, Cesium context wrapper. |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 3: PostGIS & Property Data Model                                            |
| - Database migrations (Alembic), GeoAlchemy2 models, spatial indexes, seed data.   |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 4: Data Ingestion & GIS Processing Pipeline                                 |
| - PyProj reprojection, Shapely topology repair, DEM elevation sampling engine.     |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 5: 2D Parcel Mapping & Property Explorer                                    |
| - Cesium 2D cadastral boundary rendering, BBox querying, ULPIN search bar.        |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 6: AI Building Extraction & 3D Extrusion                                    |
| - Photogrammetry/DEM 3D extrusion engine, LoD1/LoD2 building meshes in Cesium.     |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 7: Vertical Property Mapping & 3D ULPIN Model                               |
| - Floor slicing engine, 3D unit partitioning, 3D ULPIN generator & inspector card. |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 8: Evidence & Provenance System                                             |
| - Lineage binding, confidence scoring mathematical model, Evidence Drawer in UI.   |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 9: Spatial Intelligence & Conflict Detection                                |
| - ST_Difference boundary encroachments, height variance checks, conflict overlays. |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 10: Natural-Language Spatial Query & AI Investigator                        |
| - Gemini tool calling -> Spatial AST JSON schema -> Parameterized PostGIS query.  |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 11: Human Verification Workflow & Immutable Audit Trail                     |
| - Maker-checker officer review UI, SHA-256 chained audit ledger.                   |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 12: 4D Property History & Infrastructure Intelligence                       |
| - Temporal timeline scrubber, multi-epoch change detection, utility overlay.       |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 13: Analytics, Quality Scoring & UI/UX Polish                               |
| - FAR/FSI compliance, data completeness scores, 60 FPS WebGL render optimizations.|
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 14: Production Hardening, Security & Containerization                       |
| - Multi-stage Docker builds, rate-limiting, CORS lockdown, automated security test.|
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │
+────────────────────────────────────────▼──────────────────────────────────────────+
| PHASE 15: Complete SIH Demo Integration & Final Presentation Pack                 |
| - End-to-end golden narrative test, jury presentation script, system walkthrough.  |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 3. Detailed Phase Deliverables & Success Criteria

### Phase 0: Product Definition, Architecture & Master Blueprint (CURRENT)
- **Objective:** Establish the complete product requirements, system architecture, database ER design, API boundaries, AI/GIS pipeline, security constraints, and phased execution plan.
- **Success Criteria:** 100% documentation completion. Zero premature application code written.

### Phase 1: Project Foundation & Development Environment
- **Objective:** Configure the monorepo workspace (`apps/web`, `apps/api`, `packages/shared-types`), initialize Docker Compose with PostgreSQL 16/PostGIS and MinIO, and establish developer toolchains (TypeScript, Pytest, ESLint, Prettier).
- **Success Criteria:** `docker compose up` starts all backing services; backend returns `{ "status": "healthy" }`; frontend renders Next.js baseline.

### Phase 2: Authentication, Roles & Application Shell
- **Objective:** Build the Next.js 5-zone spatial layout shell with CesiumJS context provider, top search bar, left navigation rail, bottom toolbar, and client-side role-switching switcher.
- **Success Criteria:** CesiumJS initializes cleanly in browser without WebGL errors; navigation rail switches tabs; active role badge renders properly.

### Phase 3: PostGIS & Property Data Model
- **Objective:** Write Alembic migrations for all core tables (`cities`, `regions`, `parcels`, `buildings`, `floors`, `units`, `infrastructure`, `evidence`, `conflicts`, `users`, `audit_logs`). Seed baseline pilot dataset for Bengaluru Urban (Ward 142).
- **Success Criteria:** Migrations run cleanly; spatial queries return seeded parcel polygons; GIST indexes created.

### Phase 4: Data Ingestion & GIS Processing Pipeline
- **Objective:** Implement Python GIS ingestion scripts using GeoPandas, Shapely, GDAL, and Rasterio for CRS reprojection, geometry validation (`ST_MakeValid`), and DEM elevation sampling.
- **Success Criteria:** Raw cadastral shapefiles and drone GeoTIFFs are sanitized, reprojected to EPSG:4326, and stored in PostGIS.

### Phase 5: 2D Parcel Mapping & Property Explorer
- **Objective:** Connect Next.js Cesium frontend to `/api/v1/parcels`. Render cadastral parcel polygons on terrain with interactive hover/click selection.
- **Success Criteria:** Clicking a parcel displays its 14-digit ULPIN, recorded area, and survey number in the Contextual Inspector.

### Phase 6: AI Building Extraction & 3D Extrusion
- **Objective:** Extrude 2D building footprints into LoD1/LoD2 3D building meshes using photogrammetric heights and DEM baselines. Render in CesiumJS.
- **Success Criteria:** 3D buildings appear accurately situated upon parcels at true elevation above sea level.

### Phase 7: Vertical Property Mapping & 3D ULPIN Model
- **Objective:** Implement vertical floor slicing ($H / N$) and unit subdivision. Compute 3D centroids $(X, Y, Z)$ and generate structured 3D ULPIN identifiers.
- **Success Criteria:** Activating the Floor Slicer isolates floor plates; clicking a unit displays its 3D ULPIN (e.g., `KA-BLR-04-0012-B1-F04-U402`).

### Phase 8: Evidence & Provenance System
- **Objective:** Implement the Evidence backend service and UI Drawer. Bind every derived building and unit to its source dataset, sensor type, algorithm, and confidence score.
- **Success Criteria:** Selecting any 3D entity displays its complete lineage card with verified source badges and confidence metrics.

### Phase 9: Spatial Intelligence & Conflict Detection
- **Objective:** Implement automated topological conflict engine (`ST_Difference`, height checks, setback buffer checks). Render conflict outlines in Cesium.
- **Success Criteria:** Encroaching building footprints display red warning outlines; conflict cards show calculated deviation in meters.

### Phase 10: Natural-Language Spatial Query & AI Investigator
- **Objective:** Integrate Google Gemini API with structured tool calling. Translate natural language queries into validated Spatial ASTs and execute parameterized PostGIS queries.
- **Success Criteria:** Query *"Show buildings taller than sanctioned floors"* highlights matching structures in Cesium with textual explanation.

### Phase 11: Human Verification Workflow & Immutable Audit Trail
- **Objective:** Build maker-checker review modal for authorized officers (`APPROVE`, `MODIFY`, `REJECT`) with mandatory notes. Implement cryptographically chained SHA-256 audit logs.
- **Success Criteria:** Officer approval transitions state to `VERIFIED`; audit log entry displays previous state, new state, and valid hash.

### Phase 12: 4D Property History & Infrastructure Intelligence
- **Objective:** Implement temporal timeline scrubber comparing historical cadastral boundaries against present-day drone surveys. Render evidence-gated subsurface utility lines.
- **Success Criteria:** Scrubbing the timeline visually shows building expansion over time; underground pipes render with clear evidence labels.

### Phase 13: Analytics, Quality Scoring & UI/UX Polish
- **Objective:** Implement Floor Area Ratio (FAR/FSI) compliance calculators, data completeness quality scores, and WebGL rendering optimizations.
- **Success Criteria:** Application runs at consistent 60 FPS; analytics charts display ward-level density metrics.

### Phase 14: Production Hardening, Security & Containerization
- **Objective:** Configure production Docker builds, enforce TLS/CORS security policies, rate-limiting, and automated security vulnerability scans.
- **Success Criteria:** Zero critical vulnerabilities in image scans; all API routes protected by role-based guards.

### Phase 15: Complete SIH Demo Integration & Final Presentation Pack
- **Objective:** End-to-end dry run of the 17-step SIH demonstration story. Package slide deck, jury documentation, and system walkthrough.
- **Success Criteria:** Flawless 10-minute live demonstration from raw ingestion to verified 3D ULPIN property record.
