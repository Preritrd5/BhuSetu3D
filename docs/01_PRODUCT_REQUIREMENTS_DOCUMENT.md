# ASTATINE: Product Requirements Document (PRD)
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026)  
**Problem Statement ID:** SIH26011  
**Problem Statement:** 3D ULPIN Generation and Vertical Property Mapping System  
**Theme:** Smart Automation | **Category:** Software  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. Executive Summary & Problem Context
In India, the Unique Land Parcel Identification Number (ULPIN / *Bhu-Aadhaar*) provides a 14-digit alphanumeric identification for 2D land parcels based on their latitude-longitude coordinates (derived from cadastral maps and georeferencing). However, modern urban spaces feature multi-story complexes, high-rises, mixed-use commercial properties, and vertical layered infrastructure. 

A 2D parcel polygon fails to capture:
1. **Vertical Property Rights:** Multiple ownerships, tenancies, and registrations stacked vertically across 10–50+ floors over a single 2D parcel.
2. **Subsurface & Layered Infrastructure:** Utilities, metro tunnels, foundations, pipelines, and underground basements intersecting property bounds.
3. **Spatial Discrepancies & Encroachments:** Footprint overhangs, floor-addition violations beyond approved municipal sanction plans, and setbacks encroaching on adjoining parcels or public rights-of-way.
4. **Disjointed Evidence:** Land records, municipal tax entries, building sanction drawings, satellite/drone orthomosaics, and utility GIS datasets reside in siloed databases with conflicting geometry and attribution.

**ASTATINE** (developed by Team TANTRAKATHA) solves this problem by establishing an **evidence-backed, queryable, 3D property intelligence and land-governance platform**. ASTATINE transforms fragmented 2D survey records and aerial/spatial datasets into a vertically structured 3D spatial hierarchy:
$$\text{PARCEL} \longrightarrow \text{BUILDING} \longrightarrow \text{FLOOR} \longrightarrow \text{UNIT} \longrightarrow \text{INFRASTRUCTURE}$$

Every vertical property object is associated with a standardized **3D ULPIN-oriented property record** linked directly to verifiable evidence, confidence scores, and full provenance tracking.

---

## 2. Core Product Principles

### 2.1 Principle of Evidence-Aware Intelligence
No AI or GIS-derived geometry or claim is treated as automatically authoritative. Every derived result must explicitly provide answers to the Five Foundational Governance Inquiries:
1. **WHAT** did the system detect? (e.g., "Building footprint overhang detected beyond Cadastral Parcel boundary by 1.84 meters").
2. **WHY** did the system detect it? (e.g., "Spatial intersection detected between photogrammetry-derived building polygon and surveyed cadastral boundary").
3. **WHAT DATA** supports it? (e.g., "Survey of India Cadastral Vector [Dataset ID: `DL-CAD-2024-V2`] + DGCA Drone Orthomosaic at 5cm GSD [Dataset ID: `DRONE-2025-Q1`]").
4. **HOW CONFIDENT** is the system? (e.g., "Confidence: 93.4% derived from multi-angle orthophoto agreement and ground control point validation").
5. **WHAT SHOULD THE HUMAN DO NEXT?** (e.g., "Action: On-site verification recommended by Municipal Town Planner or Empanelled Surveyor").

### 2.2 Terminology & Legal Safety Boundaries
ASTATINE is an assistive decision-support platform for municipal authorities, town planners, revenue officers, and surveyors.
- **Never issue definitive legal judgements:** The platform must **never** state *"This property is illegal"* or *"This building is an unauthorized encroachment"*.
- **Authoritative phrasing:** The platform must strictly report:
  - *"Spatial discrepancy detected"*
  - *"Boundary offset exceeds municipal tolerance (0.3m) — Verification Required"*
  - *"Floor count deviation between sanction record and derived model — Review Required"*
- **ULPIN Claim Safety:** ASTATINE does not pretend to replace the Survey of India or Department of Land Resources (DoLR) in issuing statutory gazetted ULPIN numbers. It generates **"3D ULPIN-oriented Property Records"** and **"3D ULPIN prototypes"** compliant with national geospatial standards.

### 2.3 Strict Underground & Subsurface Integrity
Above-ground satellite, drone, and optical imagery cannot detect buried utilities or structural foundations.
- ASTATINE **strictly forbids fabricating underground infrastructure**.
- Any underground or subsurface feature must strictly trace back to verified authoritative utility GIS layers, GPR (Ground Penetrating Radar) surveys, or officially submitted civil engineering blueprints.
- When illustrative or estimated utility lines are shown for planning simulation, they are tagged `ILLUSTRATIVE` with conspicuous UI badges and cannot trigger legal discrepancy alerts.

---

## 3. User Personas & Use Cases

| Persona | Role & Mandate | Primary Needs in ASTATINE |
| :--- | :--- | :--- |
| **Government Land Officer / Revenue Officer** | Custodian of cadastral records, title registration, and land tax assessment. | Inspect 3D property models; review detected spatial conflicts between cadastral bounds and actual structures; approve or reject verification requests; inspect complete audit logs. |
| **Municipal Town Planner** | Building plan sanctioning, floor area ratio (FAR/FSI) compliance, urban zoning. | Evaluate vertical density; cross-check sanctioned floors against photogrammetric height models; analyze infrastructure capacity vs. unit load; run spatial queries. |
| **Licensed Surveyor / Field GIS Engineer** | Field data acquisition (Total Station, GNSS, Drone LiDAR), spatial data ingestion. | Ingest raw survey data (Shapefiles, GeoJSON, GeoTIFF, LAS/LAZ); inspect automated feature extraction; adjust vertices and floor elevations; submit ground verification reports. |
| **Spatial Data Analyst** | Urban analytics, policy planning, infrastructure gap assessment. | Natural-language spatial queries; aggregate density heatmaps; temporal change tracking (4D property history); export standardized spatial reports. |
| **System Administrator** | Platform security, tenant management, RBAC, CRS parameter configuration. | Manage users, access control levels, audit logging, dataset encryption keys, multi-city deployment configurations. |
| **Public Citizen / Property Buyer (Restricted)** | Title diligence, tax status, vertical unit boundary awareness. | Restricted 3D view of certified property units; verify 3D ULPIN lookup; view public tax verification status; inspect certified civic infrastructure connections. |

---

## 4. Functional Requirements Overview

### 4.1 3D Spatial Hierarchy Management (P0)
- **Parcel Level:** Ingestion and visualization of 2D cadastral parcels with EPSG projection handling, georeferencing, and parcel attribution.
- **Building Level:** Extrusion of 2D footprints into LoD1/LoD2 3D building models using photogrammetric elevation / DEM, assigning Building Identifiers.
- **Floor Level:** Division of 3D building mass into vertical floor plates based on architectural floor-to-floor height rules, elevation bounds, and sanction plans.
- **Unit Level:** Partitioning of floor plates into distinct 3D spatial units (apartments, commercial suites, common areas) with discrete 3D ULPIN-oriented identifiers ($X/Y/Z$ spatial centroids + elevation bracket).
- **Infrastructure Level:** Spatial association of municipal utility ties (water supply mains, stormwater drain lines, electrical feeder lines, road access easements) to specific parcels and buildings.

### 4.2 Evidence & Provenance Engine (P0)
- Every spatial entity and derived property attribute must record:
  - Source Type (`AUTHORITATIVE`, `DERIVED`, `INFERRED`, `ILLUSTRATIVE`, `UNVERIFIED`).
  - Dataset ID, acquisition date, sensor/source modality, processing pipeline version.
  - Confidence metric ($0.00 - 1.00$) calculated independently from verification status.
  - Verification state (`PENDING`, `VERIFIED`, `MODIFIED`, `REJECTED`), reviewer identifier, and review timestamp.

### 4.3 Automated Spatial Conflict Detection (P0)
- Detect spatial discrepancies:
  1. *Building vs. Parcel Encroachment:* Building footprint intersecting outside cadastral parcel boundaries.
  2. *Recorded vs. Derived Area Variance:* Cadastral deed area vs. computed geometric footprint area exceeding configured tolerance threshold ($\Delta > 5\%$).
  3. *Floor Count Variance:* Municipal sanctioned floor count vs. detected vertical floor levels.
  4. *Infrastructure Proximity / Buffer Violation:* Building structure intersecting high-tension line buffers, water body setbacks, or road right-of-way easements.

### 4.4 AI Spatial Investigator & NL Query Engine (P0)
- Transform natural language queries (e.g., *"Highlight commercial buildings in Sector 4 exceeding sanctioned height by more than 2 floors"*) into a strictly typed, validated Spatial Query Abstract Syntax Tree (AST).
- Execute parameterized, sanitized PostGIS queries against spatial and vertical indexes.
- Highlight matching 3D entities in the CesiumJS viewport and populate the Evidence Inspector with supporting datasets.

### 4.5 Human Verification & Immutable Audit Trail (P0)
- Two-officer / maker-checker verification workflow for spatial discrepancies.
- Full provenance audit log capturing every administrative mutation, geometry edit, verification decision, and export action with cryptographic hash chaining.

---

## 5. Non-Functional Requirements

### 5.1 Performance & 3D Geospatial Scalability
- **3D Render Performance:** Maintain steady 60 FPS in CesiumJS on standard workstation laptops (16GB RAM, integrated Iris Xe / GTX 1650 or higher) for up to 10,000 visible building envelopes via 3D Tiles (Batched 3D Model - b3dm / I3S / quantized mesh).
- **Spatial Query Response:** PostGIS bounding-box (BBox) and 3D centroid containment queries must respond in $< 250\text{ ms}$ for datasets of 500,000 spatial records.
- **Tiled Data Delivery:** Vector tiles (MVT) and 3D Tiles served with HTTP range requests and aggressive client-side LRU caching.

### 5.2 Security & Data Governance
- Strict Role-Based Access Control (RBAC).
- Zero Raw SQL execution from AI models: LLM outputs JSON query schemas validated with strict Pydantic models.
- End-to-end audit logging for all mutations and spatial updates.
- Sanitization and CRS normalization for all geospatial uploads.

### 5.3 Reliability & Fault Tolerance
- Asynchronous task processing (Celery / BackgroundWorker) for heavy GIS tasks (photogrammetry, point cloud tiling, raster slope analysis).
- UI fallback states: Every component implements `LOADING`, `SUCCESS`, `EMPTY`, `ERROR`, and `RETRY` lifecycles.
