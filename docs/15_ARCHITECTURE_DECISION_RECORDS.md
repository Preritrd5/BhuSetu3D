# ASTATINE: Architecture Decision Records (ADRs)
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## ADR-001: 3D Visualization Engine Selection (CesiumJS)
- **Status:** APPROVED
- **Context:** ASTATINE requires an interactive 3D spatial canvas capable of rendering national cadastral boundaries draped over digital elevation models (DEMs), 3D building envelopes, vertical floor plates, and subsurface infrastructure. Candidates evaluated: Three.js, Babylon.js, Deck.gl, and CesiumJS.
- **Decision:** Select **CesiumJS**.
- **Rationale:**
  1. *WGS 84 Native Support:* CesiumJS operates natively in Earth-centered, Earth-fixed (ECEF) and geographic coordinates (latitude, longitude, ellipsoidal height), eliminating complex custom projections required in Three.js or Babylon.js.
  2. *OGC 3D Tiles Standard:* Native streaming support for Batched 3D Model (`b3dm`), Point Cloud (`pnts`), and Quantized Mesh terrain tilesets via dynamic Level of Detail (LoD).
  3. *Camera Geodesics & Precision:* High-precision floating-point camera physics tailored for city-scale navigation down to sub-centimeter building facade inspections.
- **Consequences:** CesiumJS has a larger bundle footprint than standard Three.js and requires careful WebGL memory management, which will be addressed using dynamic entity cleanup and tile caching in Next.js.

---

## ADR-002: Spatial Database Platform (Supabase Managed PostgreSQL 16 + PostGIS 3.4)
- **Status:** APPROVED
- **Context:** The system needs to store, index, and query both 2D cadastral polygons and 3D volumetric structures (buildings, floor plates, unit spaces), executing topological predicates (intersection, containment, difference) at millisecond latencies, with managed scalability and Row Level Security. Candidates evaluated: Supabase Managed PostgreSQL/PostGIS, Self-hosted Docker PostgreSQL, MongoDB Spatial, Neo4j Spatial, Spatialite.
- **Decision:** Select **Supabase Managed PostgreSQL 16 with PostGIS 3.4 Extension** as the sole database platform.
- **Rationale:**
  1. *De-Facto Sovereign Standard:* Recognized globally and by Indian state land revenue departments as the gold standard for cadastral GIS.
  2. *True 3D Geometry Support:* Full support for `PolyhedralSurfaceZ`, `TIN`, `PointZ`, and `LineStringZ` with 3D bounding box indexing (`GIST` index using `&&&` operators).
  3. *Deterministic Topology:* GEOS-backed topological predicates (`ST_Difference`, `ST_Intersection`, `ST_DWithin`) provide reproducible, legally defensible results.
  4. *Unified Cloud Platform:* Built-in PostgREST REST API, Remote Procedure Calls (RPC) for PostGIS functions, Row Level Security (RLS) enforcement, and managed high-availability without requiring local database containers.
- **Consequences:** All database migrations and schema executions target the Supabase PostgreSQL database. No local or Docker-hosted PostgreSQL instances are permitted.

---

## ADR-003: Backend Language & Framework (FastAPI / Python 3.11+)
- **Status:** APPROVED
- **Context:** The backend must concurrently serve high-concurrency REST endpoints, interface with heavy C-based GIS libraries, run computer vision models, and orchestrate LLM spatial reasoning. Candidates evaluated: Node.js / Express, Python / FastAPI, Go / Gin, Java / Spring Boot.
- **Decision:** Select **FastAPI with Python 3.11+**.
- **Rationale:**
  1. *GIS Ecosystem Unification:* Python provides first-class native bindings to the core GIS ecosystem: GDAL/OGR, Shapely 2.0 (GEOS), GeoPandas, PyProj, and Rasterio.
  2. *AI/ML Co-location:* Seamless interoperability with PyTorch and Google Gemini SDKs without inter-process communication overhead.
  3. *Async I/O Performance:* Built upon Starlette and Pydantic v2, FastAPI delivers throughput comparable to Go and Node.js for I/O-bound database operations.
  4. *Automatic OpenAPI/Swagger:* Real-time documentation generation for rapid team collaboration.
- **Consequences:** Heavy CPU-bound photogrammetry and raster conversions must be handled asynchronously via background worker tasks to avoid blocking the ASGI event loop.

---

## ADR-004: AI Spatial Query Architecture (Validated AST over Raw Text-to-SQL)
- **Status:** APPROVED
- **Context:** Non-technical revenue officers need to ask complex spatial questions in natural language. Allowing an LLM to generate raw SQL strings directly poses catastrophic security risks (SQL injection, accidental schema drops, non-deterministic queries).
- **Decision:** Implement an **Intermediate Validated Spatial Abstract Syntax Tree (AST)** enforced by Pydantic v2 schemas.
- **Rationale:**
  1. *Absolute Injection Immunity:* The LLM never writes SQL syntax. It outputs structured JSON parameters matching a rigid schema.
  2. *Whitelisted Attributes:* Only pre-approved spatial predicates (`ST_Difference`, `ST_DWithin`) and entity fields can be queried.
  3. *Deterministic Parameterization:* The backend query compiler translates the AST into safe, parameterized SQLAlchemy Core queries using explicit bind parameters.
- **Consequences:** Requires maintaining the Pydantic AST schema and compiler as new query operators are introduced.

---

## ADR-005: Separation of Sensor Confidence from Officer Verification
- **Status:** APPROVED
- **Context:** Deep learning algorithms and photogrammetric sensors produce probabilistic confidence scores. In legal land administration, an algorithm cannot unilaterally alter property titles or adjudicate disputes.
- **Decision:** Maintain **strict conceptual, mathematical, and database separation** between `confidence_score` (a continuous machine metric $\in [0.0, 1.0]$) and `verification_status` (a discrete statutory human state: `PENDING`, `VERIFIED`, `MODIFIED`, `REJECTED`).
- **Rationale:**
  1. *Sovereign Accountability:* Ensures human decision-makers retain statutory authority while benefiting from algorithmic decision support.
  2. *Legal Defensibility:* Prevents automated systems from creating unlawful cloud on title.
- **Consequences:** UI must display both metrics side-by-side with clear distinction to prevent officer confusion.

---

## ADR-006: Subsurface Data Integrity Policy
- **Status:** APPROVED
- **Context:** Multi-utility urban management requires visualizing underground pipes, electrical feeder lines, and metro tunnels alongside vertical properties. However, satellite and drone imagery cannot view underground infrastructure.
- **Decision:** Enforce a **strict ban on the algorithmic fabrication or simulation of underground utilities**. Subsurface features must strictly originate from verified utility GIS datasets or calibrated GPR surveys, and any simulation must be watermarked as `ILLUSTRATIVE`.
- **Rationale:**
  1. *Preventing Civil Catastrophe:* Misrepresenting a fabricated underground gas line or high-voltage power conduit as authoritative creates severe civil engineering hazards.
  2. *Evaluation Credibility:* Demonstrates sovereign-grade geospatial maturity to SIH jury members.
- **Consequences:** Certain demonstration regions without authoritative utility data will show no underground utilities or clearly watermarked illustrative placeholders.

---

## ADR-007: Monorepo Architecture (Turborepo)
- **Status:** APPROVED
- **Context:** Managing multiple repositories during hackathon iteration leads to schema desynchronization between TypeScript frontend types and Python Pydantic models.
- **Decision:** Organize the codebase as a **Turborepo monorepo** containing `apps/web`, `apps/api`, `packages/shared-types`, and `packages/spatial-utils`.
- **Rationale:**
  1. Single pull request / commit atomic changes across frontend and backend.
  2. Unified Docker Compose orchestrating database, object storage, API, and web client.
  3. Rapid debugging and local development without multi-repo syncing hurdles.
- **Consequences:** Requires configuring workspace dependency tooling for combined Node.js and Python environments.
