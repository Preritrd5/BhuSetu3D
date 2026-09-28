# ASTATINE: System Architecture Specification
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. High-Level Modular Monolithic Architecture

ASTATINE avoids premature distributed microservice overhead during the prototype and validation stages while maintaining strict domain boundary isolation within a **modular monolithic architecture**. The system is cleanly split into three primary tiers:
1. **Frontend Presentation & 3D Spatial Canvas (Web Client)**
2. **Core API, Geospatial Engine & AI Orchestrator (Backend Application)**
3. **Spatial Data Engine & Storage Tier (Supabase Managed PostgreSQL 16 + PostGIS 3.4 Engine + Object Storage)**

```
                                  ASTATINE PLATFORM
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         ┌───────────────────┐                         ┌───────────────────┐
         │   WEB CLIENT      │                         │   BACKEND API     │
         │ (Next.js / React) │                         │    (FastAPI)      │
         └────────┬──────────┘                         └─────────┬─────────┘
                  │                                              │
         ┌────────┴──────────┐                         ┌─────────┴─────────┐
         │ CesiumJS 3D View  │                         │ Business & Domain │
         │ React Flow Graph  │◄────── REST / WSS ─────►│ Services (Python) │
         │ Tailwind UI / Radix│                        │ Spatial Engine    │
         └───────────────────┘                         └─────────┬─────────┘
                                                                 │
                                                                 ▼
                                               ┌─────────────────────────────────────────┐
                                               │  SUPABASE MANAGED PLATFORM              │
                                               │  POSTGRESQL 16 + POSTGIS 3.4 ENGINE     │
                                               ├─────────────────────────────────────────┤
                                               │ • Cadastral Parcels (2D Polygons)       │
                                               │ • 3D Buildings & Floor Slices           │
                                               │ • 3D Units & Centroids (PointZ)         │
                                               │ • GIST Spatial Indexes & PostGIS RPC    │
                                               │ • Evidence, Conflicts & Chained Audits  │
                                               │ • Storage Buckets (3D Tiles, Orthos)    │
                                               └─────────────────────────────────────────┘
```

---

## 2. Frontend Architectural Blueprint (apps/web)

The web client operates as a **geospatial-first application**. Rather than placing a map as a minor widget inside an administrative dashboard, the 3D Cesium globe is the primary operational canvas, with floating contextual intelligence panels.

### 2.1 Core Technology Stack
- **Framework:** Next.js 14+ (App Router, Server & Client Components).
- **Language:** TypeScript (Strict mode enabled, zero `any` policy).
- **3D Spatial Visualization:** CesiumJS (with customized React wrapper managing WebGL context and Cesium Viewer lifecycle).
- **Styling & Design System:** Tailwind CSS, Radix UI primitives, Lucide React icons.
- **Topological Relationship Graph:** React Flow (for parcel-building-unit-infrastructure DAG exploration).
- **State Management:** Zustand (for lightweight global UI state: selected entities, active layers, camera targets) + TanStack Query (React Query) for server state caching and synchronization.

### 2.2 Client-Side Component Topology
```
apps/web/
├── app/                      # Next.js App Router (pages & layouts)
│   ├── layout.tsx            # Global metadata, theme, and font providers
│   ├── page.tsx              # Primary 3D Spatial Canvas layout
│   └── (auth)/               # Login and role-switch modals
├── components/               # Shared atomic UI components (Button, Modal, Badge, Tooltip)
├── features/                 # Domain-driven feature modules
│   ├── map/                  # CesiumJS Viewer, camera controllers, coordinate readout
│   ├── parcels/              # 2D Cadastral polygon renderers, parcel search
│   ├── buildings/            # 3D Building extrusion, LoD rendering, height color coding
│   ├── vertical-property/    # Floor slicing, unit breakdown, 3D ULPIN badge viewer
│   ├── evidence/             # Evidence drawer, dataset provenance cards, confidence bars
│   ├── conflicts/            # Spatial discrepancy highlights, clash visualizer
│   ├── investigator/         # Natural language prompt box, structured query response
│   ├── verification/         # Officer verification decision modal, modification editor
│   ├── history/              # 4D timeline scrubber, temporal geometry comparator
│   └── infrastructure/       # Subsurface utility renderer, evidence-gated styling
├── hooks/                    # Custom React hooks (useCesiumCamera, useSpatialEntity)
├── lib/                      # Utilities (Cesium math, projection conversions, formatters)
└── types/                    # Shared TypeScript interfaces for entities, API payloads
```

---

## 3. Backend Architectural Blueprint (apps/api)

The backend provides a high-throughput, async-first REST API built using **FastAPI (Python 3.11+)**. It hosts the domain logic, GIS coordinate operations, AI orchestration, and spatial conflict evaluation.

### 3.1 Core Technology Stack
- **Framework:** FastAPI with Uvicorn / Gunicorn ASGI servers.
- **Language:** Python 3.11+ with strict type hints and Pydantic v2 schemas.
- **ORM & Database Layer:** SQLAlchemy 2.0 (AsyncIO engine) + GeoAlchemy2 for PostGIS spatial typing.
- **Geospatial Processing Engine:** Shapely 2.0 (GEOS wrapper), GeoPandas, GDAL / OGR bindings, PyProj (CRS transformations), Rasterio (DEM elevation sampling).
- **AI & LLM Services:** Google Gemini API (via official SDK) utilizing strict JSON schema structured tool outputs.
- **Background Task Execution:** Celery / Redis (or FastAPI `BackgroundTasks` for prototype phases) for long-running raster and point-cloud transformations.

### 3.2 Modular Backend Layering
```
apps/api/
├── app/
│   ├── api/                  # REST Routing & Endpoint definitions
│   │   ├── v1/               # Versioned endpoints (/parcels, /buildings, /conflicts, etc.)
│   │   └── deps.py           # Dependency injection (DB session, Auth context, Logger)
│   ├── core/                 # App configuration, security settings, exceptions
│   ├── models/               # SQLAlchemy ORM models with GeoAlchemy2 spatial geometries
│   ├── schemas/              # Pydantic v2 request, response, and validation schemas
│   ├── services/             # Core business and domain logic
│   │   ├── spatial_service.py      # PostGIS spatial queries, buffering, intersection tests
│   │   ├── ulpin_service.py        # 3D ULPIN generation and hierarchy indexing
│   │   ├── conflict_service.py     # Discrepancy detection engine
│   │   ├── ai_investigator.py      # Natural language -> Structured AST -> Query execution
│   │   ├── verification_service.py # Maker-checker workflow and state transitions
│   │   └── audit_service.py        # Immutable audit trail logger
│   ├── gis/                  # Low-level GIS computation scripts (Shapely/GDAL)
│   │   ├── crs_normalizer.py       # Reprojection to EPSG:4326 / EPSG:3857
│   │   ├── footprint_extrusion.py  # 2D polygon + DEM -> 3D polyhedral mesh
│   │   └── vertical_slicer.py      # Building envelope -> Floor plates -> Units
│   └── db/                   # Database engine, session maker, Alembic migrations
```

---

## 4. End-to-End Processing & Data Pipeline

The central system pipeline processes raw spatial data into certified 3D property records:

```
[RAW SPATIAL DATA]
(Cadastral SHP, Drone Ortho GeoTIFF, DEM, Architectural Plans)
       │
       ▼
[STAGE 1: Ingestion & Validation]
- File format validation (SHP, GeoJSON, GeoTIFF, LAS)
- Coordinate Reference System (CRS) inspection & automatic reprojection (PyProj -> EPSG:4326)
- Geometric topology repair (ST_MakeValid, self-intersection fixes via Shapely)
       │
       ▼
[STAGE 2: Spatial Database Storage]
- PostGIS table ingestion with GIST 2D/3D spatial indexing
- Ingestion metadata recorded in DATA_SOURCES & DATASETS tables
       │
       ▼
[STAGE 3: 2D to 3D Vertical Extrusion]
- Footprint polygon extracted from Cadastral or Drone segmentation
- Z-base and Z-top derived from DEM and photogrammetry height models
- Slicing into Floor levels ($h_{floor} \approx 3.0\text{ m}$ or sanction plan spec)
- Floor partitioned into spatial Units with discrete centroid coordinates $(X_c, Y_c, Z_c)$
       │
       ▼
[STAGE 4: 3D ULPIN Assignment]
- Parcel ULPIN: 14-character geocode $(X, Y)$
- 3D ULPIN: Parcel ULPIN + Vertical Structure Index + Floor Code + Unit Code
       │
       ▼
[STAGE 5: Evidence & Provenance Binding]
- Linking geometries to primary source datasets, capture dates, sensors, algorithms
- Assignment of Confidence scores ($0.0 - 1.0$)
- Initial Verification State set to `PENDING`
       │
       ▼
[STAGE 6: Spatial Conflict Detection Engine]
- Evaluates Footprint vs. Cadastral Boundary (ST_Difference, ST_Area)
- Evaluates Sanctioned vs. Detected Height/Floor count
- Evaluates Proximity to Infrastructure/Setback buffers
- Generates `CONFLICT` records with severity levels (LOW, MEDIUM, HIGH)
       │
       ▼
[STAGE 7: AI Spatial Investigator & Querying]
- Accepts user natural language queries
- Generates validated JSON spatial filter queries (no direct raw SQL execution)
- Executes parameterized spatial queries on PostGIS
- Returns highlighted entities with linked evidence to Web UI
       │
       ▼
[STAGE 8: Human Verification & Audit Trail]
- Authorized Revenue/Town Planning Officer inspects discrepancy in 3D
- Officer executes APPROVE, MODIFY, or REJECT with reason comments
- Immutable entry written to AUDIT_LOGS with hash chaining
```

---

## 5. Subsurface & Underground Infrastructure Rules
ASTATINE enforces a zero-tolerance policy against the algorithmic fabrication of buried infrastructure:
1. **Source Gating:** Underground pipeline and electrical conduits can only enter the system via **Authoritative Municipal GIS** or **GPR Subsurface Surveys**.
2. **Visual Differentiation in 3D:** 
   - Authoritative underground layers render as solid pipes with verified elevation depths.
   - Any inferred or simulation layer is rendered with translucent dashed line ribbons and watermarked with an `ILLUSTRATIVE - NOT VERIFIED` overlay.
   - Illustrative lines are strictly excluded from automated conflict generation against parcel boundaries.

---

## 6. Architectural Decision Records (ADRs) Summary
- **ADR-01:** Selection of CesiumJS over Three.js directly for native support of WGS84 globes, standard 3D Tiles (b3dm), and accurate geographic projections.
- **ADR-02:** Selection of PostgreSQL 16 + PostGIS 3.4 as the single source of truth for both 2D cadastral polygons and 3D spatial polyhedra.
- **ADR-03:** Strict separation of LLM text generation from SQL execution via intermediate Typed Abstract Syntax Tree (AST) validation.
- **ADR-04:** Modular Monolith architecture in a single unified monorepo to guarantee interface synchronization during hackathon iteration.
