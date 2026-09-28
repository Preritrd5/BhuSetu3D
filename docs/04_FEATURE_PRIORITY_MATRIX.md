# ASTATINE: Feature Priority Matrix (P0 / P1 / P2)
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. Feature Prioritization Strategy

To guarantee the delivery of an exceptional, technically credible, and fully working prototype for Smart India Hackathon 2026, all platform capabilities are divided into three rigid priority tiers:
- **P0 (Core SIH Demonstration):** Mandatory foundational features directly answering SIH26011. Must be fully working without mockups or simulated placeholders.
- **P1 (High-Value Supporting Features):** Advanced geospatial and analytical differentiators that elevate the platform during competitive evaluation.
- **P2 (Future Extensions):** Enterprise and sovereign-scale extensions documented and architecturally planned, but deferred from core hackathon prototyping.

---

## 2. Priority Matrix Overview

| ID | Feature Name | Priority | SIH Alignment / Problem Solved | Target Phase | Complexity / Risk | Phase 0 Status |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| **F-01** | **3D Property Model** | **P0** | Translates 2D cadastral plots into 3D polyhedra. | Phase 6, 7 | High / Core | Architecture Defined Only |
| **F-02** | **Parcel Visualization** | **P0** | High-precision 2D cadastral overlay in CesiumJS. | Phase 5 | Medium / Low | Architecture Defined Only |
| **F-03** | **3D Building Generation** | **P0** | Extrudes building footprints using DEM/height data. | Phase 6 | High / Medium | Architecture Defined Only |
| **F-04** | **Vertical Property Hierarchy** | **P0** | Parcel $\rightarrow$ Building $\rightarrow$ Floor $\rightarrow$ Unit spatial mapping. | Phase 7 | High / Core | Architecture Defined Only |
| **F-05** | **ULPIN-oriented Property Record**| **P0** | 3D ULPIN geocode generation & metadata linking. | Phase 7 | Medium / Low | Architecture Defined Only |
| **F-06** | **Evidence & Provenance System** | **P0** | Rigorous tracking of dataset sources & confidence. | Phase 8 | Medium / Low | Architecture Defined Only |
| **F-07** | **Spatial Conflict Detection** | **P0** | Footprint vs. Parcel boundary encroachment tests. | Phase 9 | High / Medium | Architecture Defined Only |
| **F-08** | **Natural-Language Spatial Query**| **P0** | Translates English prompts into structured spatial filters.| Phase 10 | High / Medium | Architecture Defined Only |
| **F-09** | **AI Spatial Investigator** | **P0** | Explains discrepancies with supporting evidence. | Phase 10 | High / Medium | Architecture Defined Only |
| **F-10** | **Human Verification Workflow** | **P0** | Maker-checker review (Approve/Modify/Reject). | Phase 11 | Medium / Low | Architecture Defined Only |
| **F-11** | **Audit Trail System** | **P0** | Immutable event logging with SHA-256 hash chaining. | Phase 11 | Medium / Low | Architecture Defined Only |
| **F-12** | **3D City X-Ray** | **P1** | Subsurface & interior visual slicing. | Phase 12 | High / High | Deferred from Early Phases |
| **F-13** | **Property Relationship Graph** | **P1** | Interactive React Flow DAG of spatial dependencies. | Phase 12 | Medium / Low | Deferred from Early Phases |
| **F-14** | **3D Spatial Measurement Tools** | **P1** | Euclidean distance, vertical height, polygon area in 3D.| Phase 13 | Medium / Low | Deferred from Early Phases |
| **F-15** | **Infrastructure Relationship Analysis**| **P1** | Buffer intersection with roads, water, utilities. | Phase 12 | High / Medium | Deferred from Early Phases |
| **F-16** | **Data & ULPIN Quality Scoring**| **P1** | Quality metrics on geometry completeness & accuracy. | Phase 13 | Low / Low | Deferred from Early Phases |
| **F-17** | **4D History / Time Machine** | **P1** | Multi-year cadastral & satellite change detection. | Phase 12 | High / High | Deferred from Early Phases |
| **F-18** | **Disaster / Emergency Mode** | **P2** | Evacuation routing & flood zone inundation model. | Phase 14+ | High / High | Future Extension |
| **F-19** | **Advanced Underground Visualization**| **P2** | Full 3D GPR volumetric rendering of bedrock/pipes. | Phase 14+ | Very High / High | Future Extension |
| **F-20** | **Full Multilingual Interface** | **P2** | 12+ Indian official languages dynamic translation. | Phase 14+ | Low / Low (i18n ready) | Future Extension |
| **F-21** | **Multi-City Automated Ingestion**| **P2** | Zero-touch automated CRS & ingestion pipelines. | Phase 14+ | High / Medium | Future Extension |
| **F-22** | **Predictive Urban Analytics** | **P2** | ML-based future vertical density simulation. | Phase 14+ | Very High / High | Future Extension |

---

## 3. P0 Detailed Feature Specifications

### F-01: 3D Property Model
- **Input:** 2D Cadastral boundary, building footprint polygon, digital surface model (DSM) / digital elevation model (DEM).
- **Transformation:** Elevation extraction, Z-offset calculation, vertical extrusion into 3D PolyhedralSurface / 3D Tiles (b3dm).
- **Output:** Queryable 3D envelope with discrete spatial centroid $(X, Y, Z)$ and bounding box.

### F-04: Vertical Property Hierarchy (Parcel $\rightarrow$ Building $\rightarrow$ Floor $\rightarrow$ Unit)
- **Hierarchy Structure:**
  - `Parcel`: 2D/3D land parcel registered under cadastral survey number.
  - `Building`: Physical structure situated within or overlapping the parcel.
  - `Floor`: Vertical horizontal slice with base elevation $Z_{min}$ and ceiling elevation $Z_{max}$.
  - `Unit`: Individual residential, commercial, or common utility 3D space with dedicated 3D ULPIN.
- **Integrity Rule:** No unit can exist without an associated floor; no floor can exist without an associated building; every building must map to at least one parcel.

### F-06: Evidence & Provenance Engine
- Every derived geometric feature or attribute must bind to:
  - Source identifier (e.g., `DATASET_SOI_CADASTRE_2024`, `DATASET_DRONE_ORTHO_5CM`).
  - Source classification (`AUTHORITATIVE`, `DERIVED`, `INFERRED`, `ILLUSTRATIVE`, `UNVERIFIED`).
  - Extraction algorithm & version (e.g., `Astatine-Extrude-v1.2`, `YOLOv8-Footprint-v2.0`).
  - Mathematical confidence score $c \in [0.00, 1.00]$.
  - Current verification status (`PENDING`, `VERIFIED`, `MODIFIED`, `REJECTED`).

### F-07: Spatial Conflict Detection Engine
- Executes automated PostGIS topological evaluations:
  1. `ST_Difference(building.geom, parcel.geom)`: Detects footprint encroachment outside parcel lines.
  2. `ST_Area(building.geom) vs. deed.recorded_area`: Detects area variances greater than configurable tolerance threshold (e.g., $\Delta > 5\%$).
  3. `building.detected_floors vs. sanction.permitted_floors`: Detects unauthorized vertical additions.
- Generates structured conflict event with classification, calculated deviation metric, and recommended action.

### F-08 & F-09: AI Spatial Investigator & NL Query Engine
- **Input:** Natural language query from user.
- **Translation:** Gemini API transforms input into a strictly validated **Spatial Query Abstract Syntax Tree (AST)** adhering to a rigid Pydantic JSON schema.
- **Safety Enforcement:** Raw SQL generation is strictly prohibited. The backend compiler maps the AST into parameterized PostGIS queries.
- **Visual Feedback:** CesiumJS focuses on and color-highlights matching properties; context drawer opens with full explanation and supporting evidence.

### F-10 & F-11: Human Verification & Immutable Audit Trail
- **Workflow:** System detected conflicts are flagged `PENDING_REVIEW`.
- **Officer Action:** Authorized user reviews 3D discrepancy alongside evidence datasets and chooses `APPROVE`, `MODIFY_BOUNDS`, or `REJECT`.
- **Audit Logging:** Every administrative or verification action logs actor ID, role, timestamp, entity ID, previous state, new state, comments, and a cryptographic SHA-256 hash chained to the previous log entry.

---

## 4. Deferral & Anti-Scope Guardrails

To preserve architectural integrity and prevent scope bloat during SIH 2026:
- **No Mock Functionality:** Fake buttons that trigger hardcoded alerts are banned. If a feature is scheduled for Phase 7, it will not exist in Phase 5.
- **No Unverifiable Subsurface Claims:** The system will never simulate underground utilities without an authoritative dataset backing it.
- **No Direct LLM-to-Database Bridges:** Direct execution of AI-generated text against the PostGIS database is architecturally prevented.
