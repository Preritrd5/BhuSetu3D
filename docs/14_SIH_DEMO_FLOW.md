# ASTATINE: SIH Demonstration Narrative & Presentation Flow
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. The Core Demonstration Philosophy

Judges at the Smart India Hackathon evaluate **technical depth, real working software, practical governance alignment, and sovereign credibility**. Rather than showing disjointed features or a generic dashboard, ASTATINE presents a cohesive, end-to-end operational journey following **ONE specific property** through the complete lifecycle.

---

## 2. The 17-Step Golden Narrative

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Municipal Officer / Jury
    participant UI as ASTATINE 3D Canvas (Cesium)
    participant API as FastAPI Backend
    participant GIS as PostGIS / Spatial Engine
    participant AI as AI Spatial Investigator (Gemini)
    participant Audit as Cryptographic Audit Ledger

    Note over Officer,UI: 1. Ingestion & 2D Parcel Mapping
    Officer->>UI: Selects Pilot Ward (Bengaluru Urban - Ward 142)
    UI->>API: GET /parcels?bbox=...
    API->>GIS: Spatial BBox Query
    GIS-->>API: 2D Cadastral Boundaries
    API-->>UI: GeoJSON Parcels
    UI-->>Officer: Renders 2D Cadastral Parcel on 3D Terrain

    Note over Officer,UI: 2. 3D Extrusion & Vertical Hierarchy
    Officer->>UI: Selects Parcel Sy. No. 48/2B
    UI->>API: GET /buildings/by-parcel/{id}
    API-->>UI: 3D LoD2 Building Envelope
    UI-->>Officer: Extrudes 3D Building at True Elevation (920m AMSL)
    Officer->>UI: Activates "Floor Slicer" Tool
    UI-->>Officer: Visually isolates Floor 4 -> Highlights Unit 402
    UI-->>Officer: Displays 3D ULPIN: KA-BLR-04-0012-B1-F04-U402

    Note over Officer,UI: 3. Evidence & Provenance Inspection
    Officer->>UI: Opens "Evidence & Lineage" Drawer
    UI-->>Officer: Shows Drone Ortho (5cm GSD) + Survey of India Vector (Confidence: 93.4%)

    Note over Officer,UI: 4. Spatial Discrepancy Detection
    GIS->>GIS: ST_Difference(Building, Parcel)
    GIS-->>API: Boundary overhang detected (1.84m offset, 14.2 sq.m)
    API-->>UI: Spatial Conflict Flagged (Severity: HIGH)
    UI-->>Officer: Flashes Amber/Red Warning Outline on Overhanging Facade

    Note over Officer,UI: 5. AI Spatial Investigation (Natural Language)
    Officer->>UI: Types: "Show properties where building extends beyond parcel boundary"
    UI->>API: POST /ai/investigate
    API->>AI: Prompts Gemini with User Query + Strict AST Schema
    AI-->>API: Validated Spatial Query AST (No Raw SQL)
    API->>GIS: Executes Parameterized PostGIS Query
    GIS-->>API: Matching Conflict Entities
    API-->>UI: Matching Results + Natural Language Governance Explanation
    UI-->>Officer: Cesium Camera Smoothly Flies to Highlighted Clash

    Note over Officer,UI: 6. Human Verification & Immutable Audit
    Officer->>UI: Switches Role to "GOVERNMENT_OFFICER"
    Officer->>UI: Clicks "Adjudicate Conflict" -> Enters Justification
    UI->>API: POST /verification/decide { action: "APPROVE_WITH_MODIFICATION" }
    API->>GIS: Updates Entity Verification Status to "VERIFIED"
    API->>Audit: Appends Log with SHA-256 Hash Chain
    Audit-->>API: Hash Chain Confirmed Valid
    API-->>UI: Status Confirmed
    UI-->>Officer: Building Outline Turns Emerald Green; Audit Record Displayed
```

---

## 3. Detailed Step-by-Step Walkthrough

### Step 1: Ingest & Select Territorial Context
- **Action:** Officer loads the workspace and selects **Bengaluru Urban (Ward 142 - BTM Layout)**.
- **Visual:** CesiumJS smoothly swoops from space into a 3D perspective view over the pilot sector with high-resolution satellite imagery and terrain.

### Step 2: Cadastral Boundary Overlay
- **Action:** Officer toggles the **Cadastral Parcels** layer.
- **Visual:** Survey boundaries render as crisp blue cadastral vectors draped precisely over the 3D Copernicus elevation surface.

### Step 3: AI/Photogrammetry Feature Extraction
- **Action:** System displays drone-derived building footprints extracted from 5cm orthomosaics.
- **Visual:** Vector footprints are overlaid, demonstrating sub-decimeter alignment with visible rooftops.

### Step 4: 2D-to-3D Building Extrusion
- **Action:** Extrusion engine extrudes the 2D footprints into LoD1/LoD2 volumetric 3D meshes using elevation baselines and photogrammetric heights.
- **Visual:** Structures rise realistically from the ground surface, showing accurate building heights.

### Step 5: Establish Vertical Property Hierarchy
- **Action:** Officer clicks **Tower A (Commercial/Residential High-Rise)** situated on Parcel `KA-BLR-04-0012`.
- **Visual:** Contextual Inspector opens on the right drawer, rendering the interactive structural hierarchy tree:
  $$\text{Parcel Sy. 48/2B } \longrightarrow \text{Tower A } \longrightarrow \text{Floor 4 } \longrightarrow \text{Unit 402}$$

### Step 6: 3D ULPIN Assignment & Floor Slicing
- **Action:** Officer drags the **Vertical Floor Slicer** slider to Floor 4.
- **Visual:** CesiumJS visually clips the upper floors (Floors 5–12), revealing the interior floor plate of Floor 4 and individual apartment unit polyhedra. Clicking Unit 402 displays its unique geocode:  
  **`KA-BLR-04-0012-B1-F04-U402`** along with carpet area ($124.5\text{ m}^2$) and 3D centroid coordinates.

### Step 7: Inspect Evidence & Lineage
- **Action:** Officer clicks the **Evidence** tab in the Inspector drawer.
- **Visual:** Evidence card displays:
  - Primary Source: *Survey of India Cadastral Vector (2024)* (`AUTHORITATIVE`)
  - Secondary Source: *BBMP Drone Orthomosaic (Jan 2025)* (`DERIVED`)
  - Confidence Score: `93.4%`
  - Extraction Pipeline: `Astatine-LoD2-Extruder-v1.4`

### Step 8: Multi-Dataset Comparative Analysis
- **Action:** Officer toggles the **Dual-Dataset Split View**.
- **Visual:** The 3D view shows the legal cadastral boundary on one side and the drone orthophoto on the other, highlighting the physical structure extending past the surveyed line.

### Step 9: Automated Spatial Discrepancy Detection
- **Action:** System triggers the **Spatial Conflict Engine**.
- **Visual:** The western facade of Tower A lights up with an amber/red highlight. The Inspector displays:  
  `Spatial Discrepancy: Footprint extends 1.84m beyond cadastral parcel boundary (Encroached Area: 14.2 sq.m).`

### Step 10: Natural-Language Query via AI Spatial Investigator
- **Action:** Officer types into the top command bar:  
  *"Show properties where the building extends beyond the parcel boundary."*

### Step 11: Structured Spatial Query Translation
- **Action:** Google Gemini translates the prompt into the validated `SpatialQueryAST` JSON schema (zero raw SQL).
- **Visual:** A transparent technical badge displays the parsed spatial filter parameters:  
  `Filter: ST_Difference(building.footprint, parcel.geom) > 0.5m`.

### Step 12: Parameterized PostGIS Query Execution
- **Action:** PostGIS executes the compiled spatial query against spatial GIST indexes in $< 45\text{ ms}$.

### Step 13: 3D Visual Feedback in Cesium
- **Action:** Cesium smoothly flies the camera directly to the overhanging structure, rendering an extruded red clash prism along the overhanging edge.

### Step 14: Evidence-Aware Governance Explanation
- **Action:** AI Investigator outputs a formal explanation:  
  *"Spatial discrepancy detected between Cadastral Parcel KA-BLR-04-0012 and Building BLD-01 footprint. Ground survey records state 0.0m setback; drone photogrammetry indicates a 1.84m overhang along the western boundary."*

### Step 15: Officer Persona Switch & Review
- **Action:** User switches active role to **`GOVERNMENT_OFFICER`** (Revenue Officer / Town Planner).
- **Visual:** The Inspector unlocks the **Verification Actions** panel.

### Step 16: Human Adjudication (Maker-Checker Sign-off)
- **Action:** Officer selects **`APPROVE_WITH_MODIFICATION`**, enters the statutory comment:  
  *"Joint field verification conducted on 2026-03-14 with ETS. Physical cantilever balcony overhang confirmed within permissible municipal projection limits. Setback variance regularized under Municipal By-Law 14B."*
- **Visual:** Officer clicks **Submit Decision**.

### Step 17: Immutable Audit Ledger & State Transition
- **Action:** The entity verification status updates to `VERIFIED`. The 3D clash highlight shifts from warning red to compliant emerald green.
- **Visual:** The **Audit Trail** panel renders the new event entry:
  - Timestamp: `2026-03-14T14:44:12Z`
  - Actor: `Rajesh Sharma (Revenue Officer)`
  - Action: `VERIFY_SPATIAL_RECORD`
  - SHA-256 Hash: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
  - Chained to Previous Block: Validated.

---

## 4. SIH Jury Presentation Script & Timing (8-Minute Pitch)

| Time Window | Segment | Presenter Talking Points & Actions |
| :--- | :--- | :--- |
| **0:00 – 1:30** | **The National Problem** | "India has 2D ULPIN / Bhu-Aadhaar, but modern India lives vertically. In a 30-story building, 200 families share one 2D parcel. How do you map title, tax, utility connections, and structural encroachments in 3D?" |
| **1:30 – 3:30** | **The 3D Spatial Hierarchy** | *Demonstrate Steps 1–6 in Cesium.* "ASTATINE builds a queryable hierarchy: Parcel $\rightarrow$ Building $\rightarrow$ Floor $\rightarrow$ Unit. We slice floors with our 3D Floor Slicer and generate the 3D ULPIN for individual vertical units." |
| **3:30 – 5:00** | **Evidence-Aware AI & Conflicts** | *Demonstrate Steps 7–9.* "We never state a property is 'illegal'. Our spatial engine calculates the exact topological difference. Every polygon is tied to verifiable evidence and a sensor confidence score." |
| **5:00 – 6:30** | **AI Spatial Investigator** | *Demonstrate Steps 10–14.* "An officer asks in plain English: 'Show properties where the building extends beyond the parcel.' Our Gemini pipeline compiles this into a safe spatial AST—no raw SQL, zero hallucinations." |
| **6:30 – 8:00** | **Sovereign Verification & Audit** | *Demonstrate Steps 15–17.* "The officer verifies the record with field justification. Every single change is cryptographically hashed in our immutable audit trail. This is sovereign-grade 3D land governance." |
